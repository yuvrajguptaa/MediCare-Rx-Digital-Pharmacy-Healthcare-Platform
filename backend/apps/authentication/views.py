import datetime
from bson import ObjectId
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

from backend_core.db import get_db, serialize_doc, to_object_id
from backend_core.auth_utils import (
    hash_password, check_password, generate_tokens, decode_token,
    IsAuthenticatedMongoUser
)

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        email = data.get('email', '').strip().lower()
        password = data.get('password', '').strip()
        first_name = data.get('first_name', '').strip()
        last_name = data.get('last_name', '').strip()
        phone = data.get('phone', '').strip()
        role = data.get('role', 'USER').upper()

        if role not in ['USER', 'ADMIN', 'PHARMACIST']:
            role = 'USER'

        if not email or not password:
            return Response(
                {'error': 'Email and password are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(password) < 6:
            return Response(
                {'error': 'Password must be at least 6 characters long.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        db = get_db()
        existing = db.users.find_one({'email': email})
        if existing:
            return Response(
                {'error': 'User with this email already exists.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user_doc = {
            'email': email,
            'password_hash': hash_password(password),
            'first_name': first_name or email.split('@')[0].capitalize(),
            'last_name': last_name,
            'phone': phone,
            'role': role,
            'is_active': True,
            'avatar': f"https://api.dicebear.com/7.x/avataaars/svg?seed={email}",
            'created_at': datetime.datetime.utcnow(),
            'updated_at': datetime.datetime.utcnow()
        }

        res = db.users.insert_one(user_doc)
        user_id = str(res.inserted_id)
        user_doc['_id'] = res.inserted_id
        user_doc['id'] = user_id

        # Initialize empty cart and wishlist
        db.carts.insert_one({
            'user_id': user_id,
            'items': [],
            'updated_at': datetime.datetime.utcnow()
        })
        db.wishlists.insert_one({
            'user_id': user_id,
            'medicine_ids': [],
            'updated_at': datetime.datetime.utcnow()
        })

        # Add welcome notification
        db.notifications.insert_one({
            'user_id': user_id,
            'title': 'Welcome to MediCare Online Pharmacy! 🎉',
            'message': 'Your account has been created successfully. Browse medicines, upload prescriptions, and enjoy fast doorstep delivery.',
            'type': 'SYSTEM',
            'is_read': False,
            'link': '/medicines',
            'created_at': datetime.datetime.utcnow()
        })

        tokens = generate_tokens(user_doc)
        clean_user = serialize_doc(user_doc)
        clean_user.pop('password_hash', None)

        return Response({
            'message': 'Registration successful.',
            'user': clean_user,
            'tokens': tokens
        }, status=status.HTTP_201_CREATED)

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        email = data.get('email', '').strip().lower()
        password = data.get('password', '').strip()

        if not email or not password:
            return Response(
                {'error': 'Email and password are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        db = get_db()
        user_doc = db.users.find_one({'email': email})
        if not user_doc:
            return Response(
                {'error': 'Invalid email or password.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user_doc.get('is_active', True):
            return Response(
                {'error': 'This account has been deactivated. Please contact support.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if not check_password(password, user_doc.get('password_hash', '')):
            return Response(
                {'error': 'Invalid email or password.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        tokens = generate_tokens(user_doc)
        clean_user = serialize_doc(user_doc)
        clean_user.pop('password_hash', None)

        return Response({
            'message': 'Login successful.',
            'user': clean_user,
            'tokens': tokens
        }, status=status.HTTP_200_OK)

class RefreshTokenView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.data.get('refresh_token')
        if not refresh_token:
            return Response({'error': 'Refresh token is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payload = decode_token(refresh_token)
            if payload.get('token_type') != 'refresh':
                return Response({'error': 'Invalid token type.'}, status=status.HTTP_400_BAD_REQUEST)

            user_id = payload.get('user_id')
            db = get_db()
            user_doc = db.users.find_one({'_id': to_object_id(user_id)})
            if not user_doc or not user_doc.get('is_active', True):
                return Response({'error': 'User not found or inactive.'}, status=status.HTTP_401_UNAUTHORIZED)

            tokens = generate_tokens(user_doc)
            return Response({'tokens': tokens}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

class ProfileView(APIView):
    permission_classes = [IsAuthenticatedMongoUser]

    def get(self, request):
        return Response({'user': request.user.to_dict()}, status=status.HTTP_200_OK)

    def put(self, request):
        db = get_db()
        data = request.data
        updates = {
            'updated_at': datetime.datetime.utcnow()
        }

        if 'first_name' in data:
            updates['first_name'] = data['first_name'].strip()
        if 'last_name' in data:
            updates['last_name'] = data['last_name'].strip()
        if 'phone' in data:
            updates['phone'] = data['phone'].strip()
        if 'avatar' in data:
            updates['avatar'] = data['avatar'].strip()

        db.users.update_one({'_id': to_object_id(request.user.id)}, {'$set': updates})
        updated_doc = db.users.find_one({'_id': to_object_id(request.user.id)})
        clean_user = serialize_doc(updated_doc)
        clean_user.pop('password_hash', None)

        return Response({
            'message': 'Profile updated successfully.',
            'user': clean_user
        }, status=status.HTTP_200_OK)

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticatedMongoUser]

    def post(self, request):
        current_password = request.data.get('current_password', '')
        new_password = request.data.get('new_password', '')

        if not current_password or not new_password:
            return Response({'error': 'Current and new password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if len(new_password) < 6:
            return Response({'error': 'New password must be at least 6 characters.'}, status=status.HTTP_400_BAD_REQUEST)

        db = get_db()
        user_doc = db.users.find_one({'_id': to_object_id(request.user.id)})
        if not check_password(current_password, user_doc.get('password_hash', '')):
            return Response({'error': 'Incorrect current password.'}, status=status.HTTP_400_BAD_REQUEST)

        db.users.update_one(
            {'_id': to_object_id(request.user.id)},
            {'$set': {
                'password_hash': hash_password(new_password),
                'updated_at': datetime.datetime.utcnow()
            }}
        )

        return Response({'message': 'Password changed successfully.'}, status=status.HTTP_200_OK)

class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        db = get_db()
        user_doc = db.users.find_one({'email': email})
        
        # Always return success message for security, but generate simulated reset token if user exists
        reset_code = "123456"  # Simplified standard OTP for development / demo
        if user_doc:
            db.users.update_one(
                {'_id': user_doc['_id']},
                {'$set': {'reset_code': reset_code, 'reset_code_exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)}}
            )

        return Response({
            'message': 'If an account exists with this email, password reset instructions and OTP have been sent.',
            'demo_otp': reset_code
        }, status=status.HTTP_200_OK)

class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        otp = request.data.get('otp', '').strip()
        new_password = request.data.get('new_password', '').strip()

        if not email or not otp or not new_password:
            return Response({'error': 'Email, OTP, and new password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if len(new_password) < 6:
            return Response({'error': 'Password must be at least 6 characters.'}, status=status.HTTP_400_BAD_REQUEST)

        db = get_db()
        user_doc = db.users.find_one({'email': email})
        if not user_doc:
            return Response({'error': 'Invalid request.'}, status=status.HTTP_400_BAD_REQUEST)

        saved_otp = user_doc.get('reset_code')
        if not saved_otp or (saved_otp != otp and otp != '123456'):
            return Response({'error': 'Invalid or expired OTP.'}, status=status.HTTP_400_BAD_REQUEST)

        db.users.update_one(
            {'_id': user_doc['_id']},
            {
                '$set': {
                    'password_hash': hash_password(new_password),
                    'updated_at': datetime.datetime.utcnow()
                },
                '$unset': {'reset_code': '', 'reset_code_exp': ''}
            }
        )

        return Response({'message': 'Password reset successful. You can now login.'}, status=status.HTTP_200_OK)
