import os
from datetime import datetime
from bson import ObjectId
from pymongo import MongoClient, ASCENDING, DESCENDING, TEXT
from django.conf import settings

_mongo_client = None
_mongo_db = None

def get_mongo_client():
    global _mongo_client
    if _mongo_client is None:
        mongo_uri = getattr(settings, 'MONGODB_URI', 'mongodb://localhost:27017/')
        _mongo_client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
    return _mongo_client

def get_db():
    global _mongo_db
    if _mongo_db is None:
        client = get_mongo_client()
        db_name = getattr(settings, 'MONGODB_DB_NAME', 'pharmacy_db')
        _mongo_db = client[db_name]
        init_db_indexes(_mongo_db)
    return _mongo_db

def serialize_doc(doc):
    """Recursively converts ObjectId and datetime to JSON serializable formats"""
    if doc is None:
        return None
    if isinstance(doc, list):
        return [serialize_doc(item) for item in doc]
    if isinstance(doc, dict):
        result = {}
        for key, value in doc.items():
            if key == '_id':
                result['id'] = str(value)
                result['_id'] = str(value)
            elif isinstance(value, ObjectId):
                result[key] = str(value)
            elif isinstance(value, datetime):
                result[key] = value.isoformat()
            elif isinstance(value, (dict, list)):
                result[key] = serialize_doc(value)
            else:
                result[key] = value
        return result
    return doc

def to_object_id(id_str):
    try:
        if isinstance(id_str, ObjectId):
            return id_str
        return ObjectId(id_str)
    except Exception:
        return None

def init_db_indexes(db):
    try:
        # Users indexes
        db.users.create_index([('email', ASCENDING)], unique=True)
        db.users.create_index([('role', ASCENDING)])

        # Medicines indexes
        db.medicines.create_index([
            ('name', TEXT),
            ('generic_name', TEXT),
            ('brand', TEXT),
            ('description', TEXT),
            ('uses', TEXT)
        ], default_language='english')
        db.medicines.create_index([('name', ASCENDING)])
        db.medicines.create_index([('generic_name', ASCENDING)])
        db.medicines.create_index([('category', ASCENDING)])
        db.medicines.create_index([('brand', ASCENDING)])
        db.medicines.create_index([('selling_price', ASCENDING)])
        db.medicines.create_index([('prescription_required', ASCENDING)])
        db.medicines.create_index([('stock', ASCENDING)])
        db.medicines.create_index([('is_active', ASCENDING)])
        db.medicines.create_index(
            [('name', ASCENDING), ('generic_name', ASCENDING), ('brand', ASCENDING)],
            name='medicine_dup_idx'
        )

        # Categories
        db.categories.create_index([('slug', ASCENDING)], unique=True)

        # Carts & Wishlists
        db.carts.create_index([('user_id', ASCENDING)], unique=True)
        db.wishlists.create_index([('user_id', ASCENDING)], unique=True)

        # Addresses
        db.addresses.create_index([('user_id', ASCENDING)])

        # Prescriptions
        db.prescriptions.create_index([('user_id', ASCENDING)])
        db.prescriptions.create_index([('status', ASCENDING)])

        # Orders
        db.orders.create_index([('order_number', ASCENDING)], unique=True)
        db.orders.create_index([('user_id', ASCENDING)])
        db.orders.create_index([('order_status', ASCENDING)])
        db.orders.create_index([('created_at', DESCENDING)])

        # Reviews
        db.reviews.create_index([('medicine_id', ASCENDING)])
        db.reviews.create_index([('user_id', ASCENDING)])

        # Coupons
        db.coupons.create_index([('code', ASCENDING)], unique=True)

        # Notifications
        db.notifications.create_index([('user_id', ASCENDING)])
        db.notifications.create_index([('is_read', ASCENDING)])
    except Exception as e:
        print(f"Warning initializing indexes: {e}")
