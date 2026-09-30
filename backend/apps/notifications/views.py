import datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from backend_core.db import get_db, serialize_doc, to_object_id
from backend_core.auth_utils import IsAuthenticatedMongoUser

class NotificationListView(APIView):
    permission_classes = [IsAuthenticatedMongoUser]

    def get(self, request):
        db = get_db()
        notifications = list(
            db.notifications.find({'user_id': str(request.user.id)}).sort('created_at', -1).limit(50)
        )
        unread_count = db.notifications.count_documents({
            'user_id': str(request.user.id),
            'is_read': False
        })
        return Response({
            'notifications': serialize_doc(notifications),
            'unread_count': unread_count
        }, status=status.HTTP_200_OK)

class MarkNotificationReadView(APIView):
    permission_classes = [IsAuthenticatedMongoUser]

    def post(self, request, pk):
        db = get_db()
        oid = to_object_id(pk)
        if not oid:
            return Response({'error': 'Invalid notification ID.'}, status=status.HTTP_400_BAD_REQUEST)

        db.notifications.update_one(
            {'_id': oid, 'user_id': str(request.user.id)},
            {'$set': {'is_read': True}}
        )
        return Response({'message': 'Notification marked as read.'}, status=status.HTTP_200_OK)

class MarkAllNotificationsReadView(APIView):
    permission_classes = [IsAuthenticatedMongoUser]

    def post(self, request):
        db = get_db()
        db.notifications.update_many(
            {'user_id': str(request.user.id), 'is_read': False},
            {'$set': {'is_read': True}}
        )
        return Response({'message': 'All notifications marked as read.'}, status=status.HTTP_200_OK)
