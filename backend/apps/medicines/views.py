import re
import datetime
from bson import ObjectId
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from backend_core.db import get_db, serialize_doc, to_object_id

class MedicineListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        db = get_db()
        query_filter = {'is_active': True}

        search = request.GET.get('search', '').strip()
        category = request.GET.get('category', '').strip()
        brand = request.GET.get('brand', '').strip()
        min_price = request.GET.get('min_price')
        max_price = request.GET.get('max_price')
        prescription_required = request.GET.get('prescription_required')
        in_stock = request.GET.get('in_stock')
        sort_by = request.GET.get('sort_by', 'featured')

        page = max(1, int(request.GET.get('page', 1)))
        limit = max(1, min(50, int(request.GET.get('limit', 12))))
        skip = (page - 1) * limit

        # Search filter
        if search:
            regex_search = {'$regex': re.escape(search), '$options': 'i'}
            query_filter['$or'] = [
                {'name': regex_search},
                {'generic_name': regex_search},
                {'brand': regex_search},
                {'category': regex_search},
                {'description': regex_search},
                {'uses': regex_search}
            ]

        # Category filter
        if category and category.lower() != 'all':
            query_filter['category'] = {'$regex': f"^{re.escape(category)}$", '$options': 'i'}

        # Brand filter
        if brand and brand.lower() != 'all':
            query_filter['brand'] = {'$regex': f"^{re.escape(brand)}$", '$options': 'i'}

        # Price range filter
        price_filter = {}
        if min_price is not None and min_price != '':
            try:
                price_filter['$gte'] = float(min_price)
            except ValueError:
                pass
        if max_price is not None and max_price != '':
            try:
                price_filter['$lte'] = float(max_price)
            except ValueError:
                pass
        if price_filter:
            query_filter['selling_price'] = price_filter

        # Prescription filter
        if prescription_required in ['true', 'True', '1']:
            query_filter['prescription_required'] = True
        elif prescription_required in ['false', 'False', '0']:
            query_filter['prescription_required'] = False

        # In stock filter
        if in_stock in ['true', 'True', '1']:
            query_filter['stock'] = {'$gt': 0}

        # Sorting
        sort_order = [('_id', -1)]
        if sort_by == 'price_low':
            sort_order = [('selling_price', 1)]
        elif sort_by == 'price_high':
            sort_order = [('selling_price', -1)]
        elif sort_by == 'rating':
            sort_order = [('ratings_avg', -1), ('ratings_count', -1)]
        elif sort_by == 'discount':
            sort_order = [('discount', -1)]
        elif sort_by == 'name_asc':
            sort_order = [('name', 1)]
        elif sort_by == 'newest':
            sort_order = [('created_at', -1)]

        total_count = db.medicines.count_documents(query_filter)
        cursor = db.medicines.find(query_filter).sort(sort_order).skip(skip).limit(limit)
        medicines = list(cursor)

        # Get aggregate filter metadata (all categories, top brands, price bounds)
        categories = db.categories.find({'is_active': True}).distinct('name')
        brands = db.medicines.distinct('brand', {'is_active': True})

        return Response({
            'medicines': serialize_doc(medicines),
            'pagination': {
                'total_count': total_count,
                'page': page,
                'limit': limit,
                'total_pages': (total_count + limit - 1) // limit if limit else 1
            },
            'filters': {
                'categories': sorted([c for c in categories if c]),
                'brands': sorted([b for b in brands if b])
            }
        }, status=status.HTTP_200_OK)

class MedicineDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        db = get_db()
        oid = to_object_id(pk)
        if not oid:
            # Fallback search by slug or name if not ObjectId
            medicine = db.medicines.find_one({'_id': pk})
        else:
            medicine = db.medicines.find_one({'_id': oid})

        if not medicine:
            return Response({'error': 'Medicine not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Related medicines in the same category
        related_cursor = db.medicines.find({
            'category': medicine.get('category'),
            '_id': {'$ne': medicine['_id']},
            'is_active': True
        }).limit(4)
        related = list(related_cursor)

        # Fetch verified reviews
        reviews_cursor = db.reviews.find({
            'medicine_id': str(medicine['_id']),
            'is_approved': True
        }).sort('created_at', -1).limit(10)
        reviews = list(reviews_cursor)

        res_data = serialize_doc(medicine)
        res_data['related_medicines'] = serialize_doc(related)
        res_data['reviews'] = serialize_doc(reviews)

        return Response(res_data, status=status.HTTP_200_OK)

class MedicineSuggestionsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        q = request.GET.get('q', '').strip()
        if not q or len(q) < 2:
            return Response({'suggestions': []}, status=status.HTTP_200_OK)

        db = get_db()
        regex_q = {'$regex': re.escape(q), '$options': 'i'}
        cursor = db.medicines.find(
            {
                'is_active': True,
                '$or': [
                    {'name': regex_q},
                    {'generic_name': regex_q},
                    {'brand': regex_q}
                ]
            },
            {
                'name': 1, 'generic_name': 1, 'brand': 1, 'category': 1,
                'selling_price': 1, 'mrp': 1, 'images': 1, 'prescription_required': 1,
                'stock': 1
            }
        ).limit(6)

        suggestions = list(cursor)
        return Response({'suggestions': serialize_doc(suggestions)}, status=status.HTTP_200_OK)

class FeaturedMedicinesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        db = get_db()
        
        # Popular/Top rated
        popular = list(db.medicines.find({'is_active': True}).sort([('ratings_avg', -1), ('stock', -1)]).limit(8))
        
        # Best offers (highest discount)
        offers = list(db.medicines.find({'is_active': True, 'discount': {'$gte': 15}}).sort([('discount', -1)]).limit(8))
        
        # Daily essentials / OTC (prescription_required == False)
        otc = list(db.medicines.find({'is_active': True, 'prescription_required': False}).limit(8))

        return Response({
            'popular': serialize_doc(popular),
            'offers': serialize_doc(offers),
            'otc_essentials': serialize_doc(otc)
        }, status=status.HTTP_200_OK)

class CategoryListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        db = get_db()
        categories = list(db.categories.find({'is_active': True}).sort('name', 1))

        # Add product counts
        for cat in categories:
            cat_name = cat.get('name')
            cat['product_count'] = db.medicines.count_documents({
                'category': {'$regex': f"^{re.escape(cat_name)}$", '$options': 'i'},
                'is_active': True
            })

        return Response({'categories': serialize_doc(categories)}, status=status.HTTP_200_OK)

class CategoryDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, slug):
        db = get_db()
        category = db.categories.find_one({'slug': slug, 'is_active': True})
        if not category:
            # Try by name
            category = db.categories.find_one({'name': {'$regex': f"^{re.escape(slug)}$", '$options': 'i'}, 'is_active': True})

        if not category:
            return Response({'error': 'Category not found.'}, status=status.HTTP_404_NOT_FOUND)

        medicines = list(db.medicines.find({
            'category': {'$regex': f"^{re.escape(category.get('name'))}$", '$options': 'i'},
            'is_active': True
        }).limit(24))

        return Response({
            'category': serialize_doc(category),
            'medicines': serialize_doc(medicines)
        }, status=status.HTTP_200_OK)
