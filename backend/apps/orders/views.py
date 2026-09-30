import hmac
import hashlib
import random
import uuid
import datetime
import re
import urllib.request
import urllib.error
import json
from bson import ObjectId
from django.conf import settings
from django.core.cache import cache
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

from backend_core.db import get_db, serialize_doc, to_object_id
from backend_core.auth_utils import (
    IsAuthenticatedMongoUser, IsAdminUserMongo, IsPharmacistOrAdminUserMongo
)
from apps.cart_wishlist.views import recalculate_cart

# --- PINCODE LOOKUP ---

# Simple in-memory cache since Django cache may not be configured with a backend
_pincode_cache = {}

class PincodeLookupView(APIView):
    """Proxy endpoint for Indian pincode lookup via the India Post free API.
    Uses https://api.postalpincode.in/pincode/{pincode} — no API key required,
    covers every Indian pincode including rural ones.
    Caches results in memory to reduce external API calls.
    Accessible without authentication.
    """
    permission_classes = [AllowAny]

    def get(self, request, pincode):
        # Validate: must be exactly 6 digits
        if not re.fullmatch(r'\d{6}', str(pincode)):
            return Response(
                {'error': 'Please enter a valid 6-digit Indian Pincode.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Return cached result if available
        cache_key = f'pincode_{pincode}'
        cached = _pincode_cache.get(cache_key)
        if cached:
            return Response(cached, status=status.HTTP_200_OK)

        # India Post free API — no auth required, covers all Indian pincodes
        external_url = f'https://api.postalpincode.in/pincode/{pincode}'
        try:
            req = urllib.request.Request(
                external_url,
                headers={
                    'User-Agent': 'MediCare-Pharmacy/1.0',
                    'Accept': 'application/json',
                }
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                raw_data = json.loads(resp.read().decode('utf-8'))
        except urllib.error.HTTPError:
            return Response(
                {'error': 'Pincode lookup failed. Please try again.'},
                status=status.HTTP_502_BAD_GATEWAY
            )
        except Exception:
            return Response(
                {'error': 'Pincode lookup temporarily unavailable. Please fill in the fields manually.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        # India Post API response shape:
        # [ { "Message": "...", "Status": "Success" | "Error",
        #     "PostOffice": [ { "Name": "...", "District": "Bhind", "State": "Madhya Pradesh", ... } ] } ]
        if not raw_data or not isinstance(raw_data, list) or len(raw_data) == 0:
            return Response(
                {'error': 'Please enter a valid Indian Pincode.'},
                status=status.HTTP_404_NOT_FOUND
            )

        entry = raw_data[0]
        if entry.get('Status') == 'Error' or not entry.get('PostOffice'):
            return Response(
                {'error': 'Please enter a valid Indian Pincode.'},
                status=status.HTTP_404_NOT_FOUND
            )

        post_offices = entry['PostOffice']
        if not post_offices:
            return Response(
                {'error': 'Please enter a valid Indian Pincode.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Use first post office record for district/state
        po = post_offices[0]
        district = po.get('District') or ''
        state = po.get('State') or ''

        if not district or not state or district == 'NA' or state == 'NA':
            return Response(
                {'error': 'Please enter a valid Indian Pincode.'},
                status=status.HTTP_404_NOT_FOUND
            )

        result = {
            'pincode': pincode,
            'city': district.strip().title(),
            'state': state.strip().title(),
        }

        # Cache result (pincodes rarely change)
        _pincode_cache[cache_key] = result

        return Response(result, status=status.HTTP_200_OK)


# --- ADDRESSES ---

class AddressListCreateView(APIView):
    permission_classes = [IsAuthenticatedMongoUser]

    def get(self, request):
        db = get_db()
        addresses = list(db.addresses.find({'user_id': str(request.user.id)}).sort('is_default', -1))
        return Response({'addresses': serialize_doc(addresses)}, status=status.HTTP_200_OK)

    def post(self, request):
        data = request.data
        full_name = (data.get('full_name') or '').strip()
        phone = (data.get('phone') or '').strip()
        street_address = (data.get('street_address') or '').strip()
        city = (data.get('city') or '').strip()
        state = (data.get('state') or '').strip()
        postal_code = (data.get('postal_code') or '').strip()
        country = (data.get('country') or 'India').strip()
        address_type = (data.get('address_type') or 'HOME').upper()
        is_default = bool(data.get('is_default', False))

        if not all([full_name, phone, street_address, city, state, postal_code]):
            return Response({'error': 'Please fill all required address fields.'}, status=status.HTTP_400_BAD_REQUEST)

        db = get_db()
        if is_default:
            db.addresses.update_many({'user_id': str(request.user.id)}, {'$set': {'is_default': False}})

        # If it's the user's first address, make it default automatically
        count = db.addresses.count_documents({'user_id': str(request.user.id)})
        if count == 0:
            is_default = True

        address_doc = {
            'user_id': str(request.user.id),
            'full_name': full_name,
            'phone': phone,
            'street_address': street_address,
            'apartment': (data.get('apartment') or '').strip(),
            'city': city,
            'state': state,
            'postal_code': postal_code,
            'country': country,
            'address_type': address_type,
            'is_default': is_default,
            'created_at': datetime.datetime.utcnow()
        }

        res = db.addresses.insert_one(address_doc)
        address_doc['_id'] = res.inserted_id

        return Response({
            'message': 'Address saved successfully.',
            'address': serialize_doc(address_doc)
        }, status=status.HTTP_201_CREATED)

class AddressDetailView(APIView):
    permission_classes = [IsAuthenticatedMongoUser]

    def put(self, request, pk):
        oid = to_object_id(pk)
        if not oid:
            return Response({'error': 'Invalid address ID.'}, status=status.HTTP_400_BAD_REQUEST)

        db = get_db()
        address = db.addresses.find_one({'_id': oid, 'user_id': str(request.user.id)})
        if not address:
            return Response({'error': 'Address not found.'}, status=status.HTTP_404_NOT_FOUND)

        data = request.data
        updates = {}
        fields = ['full_name', 'phone', 'street_address', 'apartment', 'city', 'state', 'postal_code', 'country', 'address_type']
        for f in fields:
            if f in data:
                updates[f] = str(data[f]).strip()

        if data.get('is_default'):
            db.addresses.update_many({'user_id': str(request.user.id)}, {'$set': {'is_default': False}})
            updates['is_default'] = True

        db.addresses.update_one({'_id': oid}, {'$set': updates})
        updated = db.addresses.find_one({'_id': oid})
        return Response({'message': 'Address updated.', 'address': serialize_doc(updated)}, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        oid = to_object_id(pk)
        if not oid:
            return Response({'error': 'Invalid address ID.'}, status=status.HTTP_400_BAD_REQUEST)

        db = get_db()
        db.addresses.delete_one({'_id': oid, 'user_id': str(request.user.id)})
        return Response({'message': 'Address deleted successfully.'}, status=status.HTTP_200_OK)

# --- COUPONS ---

class CouponValidateView(APIView):
    permission_classes = [IsAuthenticatedMongoUser]

    def post(self, request):
        code = (request.data.get('code') or '').strip().upper()
        if not code:
            return Response({'error': 'Coupon code is required.'}, status=status.HTTP_400_BAD_REQUEST)

        db = get_db()
        coupon = db.coupons.find_one({'code': code, 'is_active': True})
        if not coupon:
            return Response({'error': 'Invalid or expired coupon code.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check cart
        cart_data = recalculate_cart(request.user.id, code)
        if not cart_data.get('applied_coupon'):
            min_order = coupon.get('min_order_amount', 0)
            return Response({
                'error': f"Minimum cart subtotal of ₹{min_order} required for coupon '{code}'."
            }, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'message': f"Coupon '{code}' applied successfully!",
            'coupon': cart_data['applied_coupon'],
            'cart': cart_data
        }, status=status.HTTP_200_OK)

# --- ORDERS & CHECKOUT ---

class CheckoutSummaryView(APIView):
    permission_classes = [IsAuthenticatedMongoUser]

    def post(self, request):
        coupon_code = (request.data.get('coupon_code') or '').strip().upper()
        cart_data = recalculate_cart(request.user.id, coupon_code)
        if not cart_data['items']:
            return Response({'error': 'Cart is empty.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'summary': cart_data}, status=status.HTTP_200_OK)

class CreateOrderView(APIView):
    permission_classes = [IsAuthenticatedMongoUser]

    def post(self, request):
        data = request.data
        address_id = data.get('address_id')
        shipping_address = data.get('shipping_address')
        coupon_code = (data.get('coupon_code') or '').strip().upper()
        payment_method = (data.get('payment_method') or 'COD').upper()
        prescription_id = data.get('prescription_id')
        if not prescription_id or str(prescription_id).lower() in ['null', 'none']:
            prescription_id = None
        customer_notes = (data.get('customer_notes') or '').strip()

        db = get_db()

        # Resolve address
        if address_id:
            addr_doc = db.addresses.find_one({'_id': to_object_id(address_id), 'user_id': str(request.user.id)})
            if addr_doc:
                shipping_address = serialize_doc(addr_doc)

        if not shipping_address:
            return Response({'error': 'Shipping address is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Recalculate cart securely
        cart_data = recalculate_cart(request.user.id, coupon_code)
        if not cart_data['items']:
            return Response({'error': 'Your cart is empty.'}, status=status.HTTP_400_BAD_REQUEST)

        if cart_data['has_out_of_stock']:
            return Response({'error': 'One or more items in your cart are currently out of stock.'}, status=status.HTTP_400_BAD_REQUEST)

        # Prescription check
        if cart_data['requires_prescription']:
            if not prescription_id:
                # Check if user has an approved prescription
                approved_rx = db.prescriptions.find_one({
                    'user_id': str(request.user.id),
                    'status': 'APPROVED'
                })
                if approved_rx:
                    prescription_id = str(approved_rx['_id'])
                else:
                    return Response({
                        'error': 'This order contains prescription medicines. Please upload or select a prescription.',
                        'requires_prescription': True
                    }, status=status.HTTP_400_BAD_REQUEST)

        # Generate unique order number
        random_suffix = random.randint(100000, 999999)
        date_prefix = datetime.datetime.utcnow().strftime('%Y%m%d')
        order_number = f"MED-{date_prefix}-{random_suffix}"

        now = datetime.datetime.utcnow()

        # Decrement medicine stock
        for item in cart_data['items']:
            med_oid = to_object_id(item['medicine_id'])
            db.medicines.update_one(
                {'_id': med_oid},
                {'$inc': {'stock': -int(item['quantity'])}}
            )

        # Create Order Document
        order_doc = {
            'order_number': order_number,
            'user_id': str(request.user.id),
            'customer_name': f"{request.user.first_name} {request.user.last_name}".strip(),
            'customer_email': request.user.email,
            'customer_phone': shipping_address.get('phone', ''),
            'items': cart_data['items'],
            'shipping_address': shipping_address,
            'prescription_id': prescription_id,
            'payment_method': payment_method,
            'payment_status': 'PAID' if payment_method in ['MOCK_CARD', 'RAZORPAY'] else 'PENDING',
            'order_status': 'CONFIRMED' if payment_method in ['MOCK_CARD', 'RAZORPAY'] else 'PLACED',
            'subtotal_mrp': cart_data['subtotal_mrp'],
            'subtotal_selling': cart_data['subtotal_selling'],
            'mrp_savings': cart_data['mrp_savings'],
            'coupon_code': coupon_code if cart_data.get('applied_coupon') else None,
            'coupon_discount': cart_data['coupon_discount'],
            'delivery_fee': cart_data['delivery_fee'],
            'total_savings': cart_data['total_savings'],
            'total_amount': cart_data['final_total'],
            'customer_notes': customer_notes,
            'status_history': [
                {
                    'status': 'PLACED',
                    'timestamp': now,
                    'note': 'Order created and received by MediCare.'
                }
            ],
            'created_at': now,
            'updated_at': now
        }

        if payment_method in ['MOCK_CARD', 'RAZORPAY']:
            order_doc['status_history'].append({
                'status': 'CONFIRMED',
                'timestamp': now,
                'note': f"Payment of ₹{cart_data['final_total']} received successfully via {payment_method}."
            })

        res = db.orders.insert_one(order_doc)
        order_id = str(res.inserted_id)
        order_doc['_id'] = res.inserted_id

        # Record payment transaction
        payment_record = {
            'order_id': order_id,
            'order_number': order_number,
            'user_id': str(request.user.id),
            'amount': cart_data['final_total'],
            'currency': 'INR',
            'method': payment_method,
            'transaction_id': f"TXN-{uuid.uuid4().hex[:12].upper()}",
            'status': 'SUCCESS' if payment_method in ['MOCK_CARD', 'RAZORPAY'] else 'PENDING',
            'created_at': now
        }
        db.payments.insert_one(payment_record)

        # Clear cart
        db.carts.update_one({'user_id': str(request.user.id)}, {'$set': {'items': [], 'updated_at': now}})

        # Increment coupon usage if used
        if cart_data.get('applied_coupon'):
            db.coupons.update_one({'code': coupon_code}, {'$inc': {'usage_count': 1}})

        # Send User Notification
        db.notifications.insert_one({
            'user_id': str(request.user.id),
            'title': f"Order #{order_number} Placed! 📦",
            'message': f"Thank you! Your order of ₹{cart_data['final_total']} has been placed successfully.",
            'type': 'ORDER',
            'is_read': False,
            'link': f"/orders/{order_id}",
            'created_at': now
        })

        return Response({
            'message': 'Order created successfully.',
            'order': serialize_doc(order_doc),
            'payment': serialize_doc(payment_record)
        }, status=status.HTTP_201_CREATED)

class UserOrdersView(APIView):
    permission_classes = [IsAuthenticatedMongoUser]

    def get(self, request):
        db = get_db()
        orders = list(db.orders.find({'user_id': str(request.user.id)}).sort('created_at', -1))
        return Response({'orders': serialize_doc(orders)}, status=status.HTTP_200_OK)

class OrderDetailView(APIView):
    permission_classes = [IsAuthenticatedMongoUser]

    def get(self, request, pk):
        db = get_db()
        oid = to_object_id(pk)
        
        query = {'_id': oid} if oid else {'order_number': pk}
        order = db.orders.find_one(query)

        if not order:
            return Response({'error': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Customer or staff permission check
        if str(order.get('user_id')) != str(request.user.id) and request.user.role not in ['ADMIN', 'PHARMACIST']:
            return Response({'error': 'Unauthorized to view this order.'}, status=status.HTTP_403_FORBIDDEN)

        # Fetch payment record
        payment = db.payments.find_one({'order_id': str(order['_id'])})

        res_data = serialize_doc(order)
        res_data['payment_details'] = serialize_doc(payment)

        return Response({'order': res_data}, status=status.HTTP_200_OK)

class CancelOrderView(APIView):
    permission_classes = [IsAuthenticatedMongoUser]

    def post(self, request, pk):
        db = get_db()
        oid = to_object_id(pk)
        query = {'_id': oid} if oid else {'order_number': pk}
        order = db.orders.find_one(query)

        if not order:
            return Response({'error': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        if str(order.get('user_id')) != str(request.user.id) and request.user.role not in ['ADMIN']:
            return Response({'error': 'Unauthorized.'}, status=status.HTTP_403_FORBIDDEN)

        if order.get('order_status') in ['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']:
            return Response({
                'error': f"Order cannot be cancelled in '{order.get('order_status')}' status."
            }, status=status.HTTP_400_BAD_REQUEST)

        now = datetime.datetime.utcnow()
        reason = request.data.get('reason', 'Cancelled by customer.')

        # Restore stock
        for item in order.get('items', []):
            med_oid = to_object_id(item.get('medicine_id'))
            if med_oid:
                db.medicines.update_one({'_id': med_oid}, {'$inc': {'stock': int(item.get('quantity', 1))}})

        # Update order status
        status_entry = {
            'status': 'CANCELLED',
            'timestamp': now,
            'note': f"Order cancelled. Reason: {reason}"
        }

        db.orders.update_one(
            {'_id': order['_id']},
            {
                '$set': {'order_status': 'CANCELLED', 'updated_at': now},
                '$push': {'status_history': status_entry}
            }
        )

        # User notification
        db.notifications.insert_one({
            'user_id': str(order.get('user_id')),
            'title': f"Order #{order.get('order_number')} Cancelled",
            'message': f"Your order has been cancelled. Any payments will be refunded in 3-5 business days.",
            'type': 'ORDER',
            'is_read': False,
            'link': f"/orders/{str(order['_id'])}",
            'created_at': now
        })

        updated = db.orders.find_one({'_id': order['_id']})
        return Response({'message': 'Order cancelled successfully.', 'order': serialize_doc(updated)}, status=status.HTTP_200_OK)

class ReorderView(APIView):
    permission_classes = [IsAuthenticatedMongoUser]

    def post(self, request, pk):
        db = get_db()
        oid = to_object_id(pk)
        query = {'_id': oid} if oid else {'order_number': pk}
        order = db.orders.find_one(query)

        if not order:
            return Response({'error': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        cart = db.carts.find_one({'user_id': str(request.user.id)})
        current_items = cart.get('items', []) if cart else []

        for item in order.get('items', []):
            med_id = item.get('medicine_id')
            qty = item.get('quantity', 1)
            found = False
            for ci in current_items:
                if ci.get('medicine_id') == med_id:
                    ci['quantity'] += qty
                    found = True
                    break
            if not found:
                current_items.append({'medicine_id': med_id, 'quantity': qty})

        db.carts.update_one(
            {'user_id': str(request.user.id)},
            {'$set': {'items': current_items, 'updated_at': datetime.datetime.utcnow()}},
            upsert=True
        )

        cart_data = recalculate_cart(request.user.id)
        return Response({'message': 'Items added to cart.', 'cart': cart_data}, status=status.HTTP_200_OK)
