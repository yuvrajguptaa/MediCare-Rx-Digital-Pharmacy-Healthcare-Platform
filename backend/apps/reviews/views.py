import datetime
from bson import ObjectId
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

from backend_core.db import get_db, serialize_doc, to_object_id
from backend_core.auth_utils import (
    IsAuthenticatedMongoUser, IsAdminUserMongo
)

def update_medicine_ratings(medicine_id):
    db = get_db()
    reviews = list(db.reviews.find({'medicine_id': str(medicine_id), 'is_approved': True}))
    if not reviews:
        db.medicines.update_one(
            {'_id': to_object_id(medicine_id)},
            {'$set': {'ratings_avg': 0.0, 'ratings_count': 0}}
        )
        return

    avg = sum(r.get('rating', 5) for r in reviews) / len(reviews)
    db.medicines.update_one(
        {'_id': to_object_id(medicine_id)},
        {'$set': {'ratings_avg': round(avg, 1), 'ratings_count': len(reviews)}}
    )

class MedicineReviewsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, medicine_id):
        db = get_db()
        reviews = list(
            db.reviews.find({'medicine_id': str(medicine_id), 'is_approved': True}).sort('created_at', -1)
        )
        return Response({'reviews': serialize_doc(reviews)}, status=status.HTTP_200_OK)

    def post(self, request, medicine_id):
        # Authenticated user post review
        if not request.user or not request.user.is_authenticated:
            return Response({'error': 'Authentication required to post a review.'}, status=status.HTTP_401_UNAUTHORIZED)

        rating = int(request.data.get('rating', 5))
        comment = request.data.get('comment', '').strip()
        headline = request.data.get('headline', '').strip()

        if rating < 1 or rating > 5:
            return Response({'error': 'Rating must be between 1 and 5.'}, status=status.HTTP_400_BAD_REQUEST)

        if not comment:
            return Response({'error': 'Review comment is required.'}, status=status.HTTP_400_BAD_REQUEST)

        db = get_db()
        med_oid = to_object_id(medicine_id)
        medicine = db.medicines.find_one({'_id': med_oid})
        if not medicine:
            return Response({'error': 'Medicine not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Check verified purchase
        has_purchased = db.orders.find_one({
            'user_id': str(request.user.id),
            'items.medicine_id': str(medicine['_id']),
            'order_status': {'$in': ['CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED']}
        }) is not None

        # Check if already reviewed
        existing = db.reviews.find_one({
            'medicine_id': str(medicine['_id']),
            'user_id': str(request.user.id)
        })
        if existing:
            return Response({'error': 'You have already reviewed this medicine.'}, status=status.HTTP_400_BAD_REQUEST)

        review_doc = {
            'medicine_id': str(medicine['_id']),
            'medicine_name': medicine.get('name'),
            'user_id': str(request.user.id),
            'user_name': f"{request.user.first_name} {request.user.last_name}".strip() or request.user.email.split('@')[0],
            'rating': rating,
            'headline': headline,
            'comment': comment,
            'is_verified_purchase': has_purchased,
            'is_approved': True,  # Auto-approved for verified/real customer feedback; admin can moderate
            'created_at': datetime.datetime.utcnow()
        }

        res = db.reviews.insert_one(review_doc)
        review_doc['_id'] = res.inserted_id

        # Update medicine average rating
        update_medicine_ratings(medicine['_id'])

        return Response({
            'message': 'Review submitted successfully. Thank you for your feedback!',
            'review': serialize_doc(review_doc)
        }, status=status.HTTP_201_CREATED)

class CheckCanReviewView(APIView):
    permission_classes = [IsAuthenticatedMongoUser]

    def get(self, request, medicine_id):
        db = get_db()
        med_oid = to_object_id(medicine_id)
        medicine = db.medicines.find_one({'_id': med_oid})
        if not medicine:
            return Response({'can_review': False, 'reason': 'Medicine not found'}, status=status.HTTP_404_NOT_FOUND)

        existing = db.reviews.find_one({
            'medicine_id': str(medicine['_id']),
            'user_id': str(request.user.id)
        })
        if existing:
            return Response({
                'can_review': False,
                'has_reviewed': True,
                'existing_review': serialize_doc(existing),
                'reason': 'You have already submitted a review for this medicine.'
            }, status=status.HTTP_200_OK)

        has_purchased = db.orders.find_one({
            'user_id': str(request.user.id),
            'items.medicine_id': str(medicine['_id']),
            'order_status': {'$in': ['CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED']}
        }) is not None

        return Response({
            'can_review': has_purchased,
            'has_reviewed': False,
            'is_verified_purchase': has_purchased,
            'reason': 'Verified purchase required' if not has_purchased else 'Eligible to review'
        }, status=status.HTTP_200_OK)
