from django.urls import path
from .views import (
    AddressListCreateView, AddressDetailView,
    CouponValidateView, CheckoutSummaryView, CreateOrderView,
    UserOrdersView, OrderDetailView, CancelOrderView, ReorderView,
    PincodeLookupView
)

urlpatterns = [
    # Pincode autofill (no auth required)
    path('address/pincode/<str:pincode>/', PincodeLookupView.as_view(), name='pincode_lookup'),

    path('addresses/', AddressListCreateView.as_view(), name='address_list_create'),
    path('addresses/<str:pk>/', AddressDetailView.as_view(), name='address_detail'),
    path('coupons/validate/', CouponValidateView.as_view(), name='coupon_validate'),
    path('checkout/summary/', CheckoutSummaryView.as_view(), name='checkout_summary'),
    path('orders/', CreateOrderView.as_view(), name='order_create'),
    path('orders/my/', UserOrdersView.as_view(), name='order_my'),
    path('orders/<str:pk>/', OrderDetailView.as_view(), name='order_detail'),
    path('orders/<str:pk>/cancel/', CancelOrderView.as_view(), name='order_cancel'),
    path('orders/<str:pk>/reorder/', ReorderView.as_view(), name='order_reorder'),
]
