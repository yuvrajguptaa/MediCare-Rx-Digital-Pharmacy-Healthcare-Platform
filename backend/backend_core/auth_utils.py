import datetime
import jwt
import bcrypt
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import BasePermission
from backend_core.db import get_db, to_object_id, serialize_doc

JWT_SECRET = getattr(settings, 'SECRET_KEY', 'jwt-secret-pharmacy-2026')
JWT_ALGORITHM = 'HS256'
ACCESS_TOKEN_LIFETIME = datetime.timedelta(days=1)
REFRESH_TOKEN_LIFETIME = datetime.timedelta(days=7)

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def check_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False

def generate_tokens(user_dict: dict):
    user_id = str(user_dict.get('id') or user_dict.get('_id'))
    now = datetime.datetime.utcnow()
    
    access_payload = {
        'user_id': user_id,
        'email': user_dict.get('email'),
        'role': user_dict.get('role', 'USER'),
        'exp': now + ACCESS_TOKEN_LIFETIME,
        'iat': now,
        'token_type': 'access'
    }
    
    refresh_payload = {
        'user_id': user_id,
        'exp': now + REFRESH_TOKEN_LIFETIME,
        'iat': now,
        'token_type': 'refresh'
    }
    
    access_token = jwt.encode(access_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    refresh_token = jwt.encode(refresh_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    return {
        'access_token': access_token,
        'refresh_token': refresh_token,
        'expires_in': int(ACCESS_TOKEN_LIFETIME.total_seconds())
    }

def decode_token(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise AuthenticationFailed('Token has expired.')
    except jwt.InvalidTokenError:
        raise AuthenticationFailed('Invalid token.')

class MongoUser:
    """Wrapper around MongoDB user dict to satisfy DRF's request.user expectations"""
    def __init__(self, doc):
        self.doc = doc
        self.id = str(doc.get('_id') or doc.get('id'))
        self.email = doc.get('email', '')
        self.first_name = doc.get('first_name', '')
        self.last_name = doc.get('last_name', '')
        self.role = doc.get('role', 'USER')
        self.is_active = doc.get('is_active', True)
        self.is_authenticated = True

    @property
    def is_anonymous(self):
        return False

    @property
    def is_admin(self):
        return self.role == 'ADMIN'

    @property
    def is_pharmacist(self):
        return self.role in ['PHARMACIST', 'ADMIN']

    @property
    def is_delivery_partner(self):
        return self.role == 'DELIVERY_PARTNER'

    def to_dict(self):
        clean = serialize_doc(self.doc)
        if 'password_hash' in clean:
            del clean['password_hash']
        return clean

class MongoJWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return None
        
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return None
        
        token = parts[1]
        payload = decode_token(token)
        
        if payload.get('token_type') != 'access':
            raise AuthenticationFailed('Invalid token type.')
        
        user_id = payload.get('user_id')
        oid = to_object_id(user_id)
        if not oid:
            raise AuthenticationFailed('Invalid user reference in token.')
        
        db = get_db()
        user_doc = db.users.find_one({'_id': oid})
        if not user_doc or not user_doc.get('is_active', True):
            raise AuthenticationFailed('User not found or deactivated.')
        
        return (MongoUser(user_doc), token)

# Permissions
class IsAuthenticatedMongoUser(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and getattr(request.user, 'is_authenticated', False))

class IsAdminUserMongo(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and getattr(request.user, 'is_authenticated', False) and getattr(request.user, 'role', '') == 'ADMIN')

class IsPharmacistOrAdminUserMongo(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and getattr(request.user, 'is_authenticated', False) and getattr(request.user, 'role', '') in ['PHARMACIST', 'ADMIN'])

class IsDeliveryPartnerMongo(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and getattr(request.user, 'is_authenticated', False) and getattr(request.user, 'role', '') in ['DELIVERY_PARTNER', 'ADMIN'])

class IsStaffOrDeliveryPartnerMongo(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and getattr(request.user, 'is_authenticated', False) and getattr(request.user, 'role', '') in ['ADMIN', 'PHARMACIST', 'DELIVERY_PARTNER'])
