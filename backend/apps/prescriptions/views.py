import os
import uuid
import datetime
from django.conf import settings
from django.core.files.storage import default_storage
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from backend_core.db import get_db, serialize_doc, to_object_id
from backend_core.auth_utils import (
    IsAuthenticatedMongoUser, IsPharmacistOrAdminUserMongo
)

ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf', '.webp']
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

class PrescriptionUploadView(APIView):
    permission_classes = [IsAuthenticatedMongoUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        file_obj = request.FILES.get('prescription_file')
        patient_name = request.data.get('patient_name', '').strip() or f"{request.user.first_name} {request.user.last_name}".strip()
        doctor_name = request.data.get('doctor_name', '').strip()
        notes = request.data.get('notes', '').strip()

        file_url = request.data.get('file_url', '')

        if file_obj:
            ext = os.path.splitext(file_obj.name)[1].lower()
            if ext not in ALLOWED_EXTENSIONS:
                return Response(
                    {'error': f"Invalid file type {ext}. Only JPG, PNG, WEBP, and PDF files are allowed."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if file_obj.size > MAX_FILE_SIZE:
                return Response(
                    {'error': 'File size exceeds 10MB limit.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            filename = f"prescriptions/{uuid.uuid4().hex}_{file_obj.name.replace(' ', '_')}"
            saved_path = default_storage.save(filename, file_obj)
            file_url = f"{settings.MEDIA_URL}{saved_path}"
            original_name = file_obj.name
            file_type = ext.replace('.', '').upper()
        elif not file_url:
            return Response(
                {'error': 'Prescription file is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        else:
            original_name = 'Uploaded Document'
            file_type = 'IMAGE'

        db = get_db()
        prescription_doc = {
            'user_id': str(request.user.id),
            'user_email': request.user.email,
            'patient_name': patient_name,
            'doctor_name': doctor_name,
            'notes': notes,
            'file_url': file_url,
            'file_name': original_name,
            'file_type': file_type,
            'status': 'PENDING',  # PENDING, APPROVED, REJECTED
            'review_notes': '',
            'reviewed_by': None,
            'reviewed_at': None,
            'created_at': datetime.datetime.utcnow(),
            'updated_at': datetime.datetime.utcnow()
        }

        res = db.prescriptions.insert_one(prescription_doc)
        prescription_doc['_id'] = res.inserted_id

        # Notification for user
        db.notifications.insert_one({
            'user_id': str(request.user.id),
            'title': 'Prescription Submitted 📋',
            'message': 'Your prescription has been received and is under review by our licensed pharmacists.',
            'type': 'PRESCRIPTION',
            'is_read': False,
            'link': '/prescriptions',
            'created_at': datetime.datetime.utcnow()
        })

        return Response({
            'message': 'Prescription uploaded successfully.',
            'prescription': serialize_doc(prescription_doc)
        }, status=status.HTTP_201_CREATED)

class UserPrescriptionsView(APIView):
    permission_classes = [IsAuthenticatedMongoUser]

    def get(self, request):
        db = get_db()
        prescriptions = list(
            db.prescriptions.find({'user_id': str(request.user.id)}).sort('created_at', -1)
        )
        return Response({'prescriptions': serialize_doc(prescriptions)}, status=status.HTTP_200_OK)

class PrescriptionDetailView(APIView):
    permission_classes = [IsAuthenticatedMongoUser]

    def get(self, request, pk):
        db = get_db()
        oid = to_object_id(pk)
        if not oid:
            return Response({'error': 'Invalid prescription ID.'}, status=status.HTTP_400_BAD_REQUEST)

        prescription = db.prescriptions.find_one({'_id': oid})
        if not prescription:
            return Response({'error': 'Prescription not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Allow owner or admin/pharmacist
        if str(prescription.get('user_id')) != str(request.user.id) and request.user.role not in ['ADMIN', 'PHARMACIST']:
            return Response({'error': 'Unauthorized access.'}, status=status.HTTP_403_FORBIDDEN)

        return Response({'prescription': serialize_doc(prescription)}, status=status.HTTP_200_OK)

class PharmacistReviewPrescriptionView(APIView):
    permission_classes = [IsPharmacistOrAdminUserMongo]

    def get(self, request):
        """List all prescriptions with filtering"""
        status_filter = request.GET.get('status', '').upper()
        db = get_db()
        query = {}
        if status_filter in ['PENDING', 'APPROVED', 'REJECTED']:
            query['status'] = status_filter

        prescriptions = list(db.prescriptions.find(query).sort('created_at', -1).limit(100))
        return Response({'prescriptions': serialize_doc(prescriptions)}, status=status.HTTP_200_OK)

    def post(self, request, pk):
        """Approve or reject a prescription"""
        new_status = request.data.get('status', '').upper()
        review_notes = request.data.get('review_notes', '').strip()

        if new_status not in ['APPROVED', 'REJECTED']:
            return Response({'error': 'Status must be APPROVED or REJECTED.'}, status=status.HTTP_400_BAD_REQUEST)

        db = get_db()
        oid = to_object_id(pk)
        if not oid:
            return Response({'error': 'Invalid prescription ID.'}, status=status.HTTP_400_BAD_REQUEST)

        prescription = db.prescriptions.find_one({'_id': oid})
        if not prescription:
            return Response({'error': 'Prescription not found.'}, status=status.HTTP_404_NOT_FOUND)

        now = datetime.datetime.utcnow()
        db.prescriptions.update_one(
            {'_id': oid},
            {
                '$set': {
                    'status': new_status,
                    'review_notes': review_notes,
                    'reviewed_by': f"{request.user.first_name} ({request.user.role})",
                    'reviewed_at': now,
                    'updated_at': now
                }
            }
        )

        # Send notification to customer
        status_emoji = '✅' if new_status == 'APPROVED' else '❌'
        db.notifications.insert_one({
            'user_id': str(prescription.get('user_id')),
            'title': f"Prescription {new_status.capitalize()} {status_emoji}",
            'message': f"Your prescription has been {new_status.lower()} by the pharmacist. {review_notes}",
            'type': 'PRESCRIPTION',
            'is_read': False,
            'link': '/prescriptions',
            'created_at': now
        })

        updated = db.prescriptions.find_one({'_id': oid})
        return Response({
            'message': f"Prescription {new_status.lower()} successfully.",
            'prescription': serialize_doc(updated)
        }, status=status.HTTP_200_OK)
