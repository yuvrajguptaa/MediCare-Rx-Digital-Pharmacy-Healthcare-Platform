import datetime
from bson import ObjectId
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from backend_core.db import get_db, serialize_doc, to_object_id
from backend_core.auth_utils import IsAuthenticatedMongoUser

def recalculate_cart(user_id, coupon_code=None):
    db = get_db()
    cart = db.carts.find_one({'user_id': str(user_id)})
    if not cart:
        cart = {'user_id': str(user_id), 'items': []}
        db.carts.insert_one(cart)

    items = cart.get('items', [])
    processed_items = []
    subtotal_mrp = 0.0
    subtotal_selling = 0.0
    requires_prescription = False
    has_out_of_stock = False

    for item in items:
        med_id = item.get('medicine_id')
        qty = int(item.get('quantity', 1))
        if qty <= 0:
            continue

        oid = to_object_id(med_id)
        med = db.medicines.find_one({'_id': oid}) if oid else None

        if not med or not med.get('is_active', True):
            continue

        current_stock = med.get('stock', 0)
        is_available = current_stock >= qty
        if not is_available:
            has_out_of_stock = True

        mrp = float(med.get('mrp', 0.0))
        selling_price = float(med.get('selling_price', 0.0))
        if med.get('prescription_required', False):
            requires_prescription = True

        item_total_mrp = mrp * qty
        item_total_selling = selling_price * qty

        subtotal_mrp += item_total_mrp
        subtotal_selling += item_total_selling

        processed_items.append({
            'medicine_id': str(med['_id']),
            'name': med.get('name'),
            'generic_name': med.get('generic_name'),
            'brand': med.get('brand'),
            'category': med.get('category'),
            'image': med.get('images', [''])[0] if med.get('images') else '',
            'mrp': mrp,
            'selling_price': selling_price,
            'discount': med.get('discount', 0),
            'quantity': qty,
            'stock': current_stock,
            'is_available': is_available,
            'prescription_required': med.get('prescription_required', False),
            'item_total_mrp': round(item_total_mrp, 2),
            'item_total_selling': round(item_total_selling, 2)
        })

    # Savings from MRP
    mrp_savings = max(0.0, subtotal_mrp - subtotal_selling)

    # Coupon discount calculation
    coupon_discount = 0.0
    applied_coupon_info = None
    if coupon_code:
        coupon = db.coupons.find_one({'code': coupon_code.upper().strip(), 'is_active': True})
        if coupon:
            now = datetime.datetime.utcnow()
            exp = coupon.get('expiry_date')
            is_valid_date = True
            if exp and isinstance(exp, str):
                try:
                    is_valid_date = datetime.datetime.fromisoformat(exp) > now
                except Exception:
                    pass

            min_order = float(coupon.get('min_order_amount', 0))
            if is_valid_date and subtotal_selling >= min_order:
                pct = float(coupon.get('discount_percentage', 0))
                calc_discount = (subtotal_selling * pct) / 100.0
                max_disc = float(coupon.get('max_discount_amount', 999999))
                coupon_discount = min(calc_discount, max_disc)
                applied_coupon_info = {
                    'code': coupon.get('code'),
                    'discount_percentage': pct,
                    'discount_amount': round(coupon_discount, 2)
                }

    # Delivery fee logic: Free over ₹500, else ₹40
    delivery_fee = 0.0 if (subtotal_selling >= 500 or subtotal_selling == 0) else 40.0
    total_savings = mrp_savings + coupon_discount
    final_total = max(0.0, subtotal_selling - coupon_discount + delivery_fee)

    return {
        'items': processed_items,
        'item_count': sum(i['quantity'] for i in processed_items),
        'subtotal_mrp': round(subtotal_mrp, 2),
        'subtotal_selling': round(subtotal_selling, 2),
        'mrp_savings': round(mrp_savings, 2),
        'coupon_discount': round(coupon_discount, 2),
        'applied_coupon': applied_coupon_info,
        'delivery_fee': round(delivery_fee, 2),
        'total_savings': round(total_savings, 2),
        'final_total': round(final_total, 2),
        'requires_prescription': requires_prescription,
        'has_out_of_stock': has_out_of_stock
    }

class CartView(APIView):
    permission_classes = [IsAuthenticatedMongoUser]

    def get(self, request):
        coupon = request.GET.get('coupon')
        cart_data = recalculate_cart(request.user.id, coupon)
        return Response(cart_data, status=status.HTTP_200_OK)

    def post(self, request):
        """Add or update item in cart"""
        medicine_id = request.data.get('medicine_id')
        quantity = int(request.data.get('quantity', 1))

        if not medicine_id or quantity <= 0:
            return Response({'error': 'Valid medicine_id and positive quantity are required.'}, status=status.HTTP_400_BAD_REQUEST)

        db = get_db()
        oid = to_object_id(medicine_id)
        medicine = db.medicines.find_one({'_id': oid, 'is_active': True})
        if not medicine:
            return Response({'error': 'Medicine not found or unavailable.'}, status=status.HTTP_404_NOT_FOUND)

        if medicine.get('stock', 0) < quantity:
            return Response({'error': f"Only {medicine.get('stock', 0)} items available in stock."}, status=status.HTTP_400_BAD_REQUEST)

        cart = db.carts.find_one({'user_id': str(request.user.id)})
        items = cart.get('items', []) if cart else []

        # Check if already in cart
        found = False
        for item in items:
            if item.get('medicine_id') == str(medicine_id):
                item['quantity'] = quantity
                found = True
                break
        if not found:
            items.append({'medicine_id': str(medicine_id), 'quantity': quantity})

        db.carts.update_one(
            {'user_id': str(request.user.id)},
            {'$set': {'items': items, 'updated_at': datetime.datetime.utcnow()}},
            upsert=True
        )

        cart_data = recalculate_cart(request.user.id)
        return Response({'message': 'Cart updated successfully.', 'cart': cart_data}, status=status.HTTP_200_OK)

    def delete(self, request):
        """Remove item or clear cart"""
        medicine_id = request.data.get('medicine_id')
        clear_all = request.data.get('clear_all', False)

        db = get_db()
        if clear_all:
            db.carts.update_one(
                {'user_id': str(request.user.id)},
                {'$set': {'items': [], 'updated_at': datetime.datetime.utcnow()}}
            )
        elif medicine_id:
            db.carts.update_one(
                {'user_id': str(request.user.id)},
                {'$pull': {'items': {'medicine_id': str(medicine_id)}}, '$set': {'updated_at': datetime.datetime.utcnow()}}
            )
        else:
            return Response({'error': 'medicine_id or clear_all is required.'}, status=status.HTTP_400_BAD_REQUEST)

        cart_data = recalculate_cart(request.user.id)
        return Response({'message': 'Item removed from cart.', 'cart': cart_data}, status=status.HTTP_200_OK)

class WishlistView(APIView):
    permission_classes = [IsAuthenticatedMongoUser]

    def get(self, request):
        db = get_db()
        wishlist = db.wishlists.find_one({'user_id': str(request.user.id)})
        med_ids = wishlist.get('medicine_ids', []) if wishlist else []

        oids = [to_object_id(m) for m in med_ids if to_object_id(m)]
        medicines = list(db.medicines.find({'_id': {'$in': oids}, 'is_active': True}))

        return Response({'wishlist': serialize_doc(medicines)}, status=status.HTTP_200_OK)

    def post(self, request):
        medicine_id = request.data.get('medicine_id')
        if not medicine_id:
            return Response({'error': 'medicine_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        db = get_db()
        db.wishlists.update_one(
            {'user_id': str(request.user.id)},
            {
                '$addToSet': {'medicine_ids': str(medicine_id)},
                '$set': {'updated_at': datetime.datetime.utcnow()}
            },
            upsert=True
        )
        return Response({'message': 'Added to wishlist.'}, status=status.HTTP_200_OK)

    def delete(self, request):
        medicine_id = request.data.get('medicine_id')
        if not medicine_id:
            return Response({'error': 'medicine_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        db = get_db()
        db.wishlists.update_one(
            {'user_id': str(request.user.id)},
            {
                '$pull': {'medicine_ids': str(medicine_id)},
                '$set': {'updated_at': datetime.datetime.utcnow()}
            }
        )
        return Response({'message': 'Removed from wishlist.'}, status=status.HTTP_200_OK)

class MoveWishlistToCartView(APIView):
    permission_classes = [IsAuthenticatedMongoUser]

    def post(self, request):
        medicine_id = request.data.get('medicine_id')
        if not medicine_id:
            return Response({'error': 'medicine_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        db = get_db()
        # Add to cart
        cart = db.carts.find_one({'user_id': str(request.user.id)})
        items = cart.get('items', []) if cart else []
        found = False
        for item in items:
            if item.get('medicine_id') == str(medicine_id):
                item['quantity'] = item.get('quantity', 1) + 1
                found = True
                break
        if not found:
            items.append({'medicine_id': str(medicine_id), 'quantity': 1})

        db.carts.update_one(
            {'user_id': str(request.user.id)},
            {'$set': {'items': items, 'updated_at': datetime.datetime.utcnow()}},
            upsert=True
        )

        # Remove from wishlist
        db.wishlists.update_one(
            {'user_id': str(request.user.id)},
            {'$pull': {'medicine_ids': str(medicine_id)}}
        )

        cart_data = recalculate_cart(request.user.id)
        return Response({'message': 'Moved to cart successfully.', 'cart': cart_data}, status=status.HTTP_200_OK)
