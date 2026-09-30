import os
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

def api_root(request):
    return JsonResponse({
        'name': 'MediCare Online Pharmacy REST API',
        'version': 'v1.0.0',
        'status': 'HEALTHY',
        'endpoints': {
            'auth': '/api/v1/auth/',
            'medicines': '/api/v1/medicines/',
            'categories': '/api/v1/categories/',
            'cart': '/api/v1/cart/',
            'wishlist': '/api/v1/wishlist/',
            'addresses': '/api/v1/addresses/',
            'prescriptions': '/api/v1/prescriptions/',
            'orders': '/api/v1/orders/',
            'coupons': '/api/v1/coupons/',
            'reviews': '/api/v1/reviews/',
            'notifications': '/api/v1/notifications/',
            'admin': '/api/v1/admin/',
            'ai': '/api/v1/ai/'
        }
    })

urlpatterns = [
    path('', api_root, name='api_root'),
    path('api/v1/', api_root, name='api_v1_root'),
    path('api/v1/auth/', include('apps.authentication.urls')),
    path('api/v1/', include('apps.medicines.urls')),
    path('api/v1/', include('apps.cart_wishlist.urls')),
    path('api/v1/', include('apps.prescriptions.urls')),
    path('api/v1/', include('apps.orders.urls')),
    path('api/v1/', include('apps.reviews.urls')),
    path('api/v1/', include('apps.notifications.urls')),
    path('api/v1/', include('apps.ai_assistant.urls')),
    path('api/v1/', include('apps.admin_portal.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
