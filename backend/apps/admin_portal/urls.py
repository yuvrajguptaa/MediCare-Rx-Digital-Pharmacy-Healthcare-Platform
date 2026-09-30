from django.urls import path
from .views import (
    AdminDashboardStatsView, AdminUsersListView, AdminUserActionView,
    AdminMedicineListCreateView, AdminMedicineDetailView,
    AdminMedicineBulkUploadView, AdminMedicineCSVTemplateView,
    AdminCategoryListCreateView, AdminCategoryDetailView,
    AdminOrdersListView, AdminOrderStatusUpdateView,
    AdminCouponListCreateView, AdminCouponDetailView,
    AdminReviewsListView, AdminInventoryOverviewView
)

urlpatterns = [
    path('admin/stats/', AdminDashboardStatsView.as_view(), name='admin_stats'),
    path('admin/users/', AdminUsersListView.as_view(), name='admin_users_list'),
    path('admin/users/<str:pk>/', AdminUserActionView.as_view(), name='admin_user_action'),
    # Medicine inventory (paginated list + single create)
    path('admin/medicines/', AdminMedicineListCreateView.as_view(), name='admin_medicines_list_create'),
    # Bulk CSV upload
    path('admin/medicines/bulk-upload/', AdminMedicineBulkUploadView.as_view(), name='admin_medicines_bulk_upload'),
    # CSV template download
    path('admin/medicines/export/template/', AdminMedicineCSVTemplateView.as_view(), name='admin_medicines_csv_template'),
    # Single medicine edit / delete
    path('admin/medicines/<str:pk>/', AdminMedicineDetailView.as_view(), name='admin_medicine_detail'),
    path('admin/categories/', AdminCategoryListCreateView.as_view(), name='admin_categories_list_create'),
    path('admin/categories/<str:pk>/', AdminCategoryDetailView.as_view(), name='admin_category_detail'),
    path('admin/orders/', AdminOrdersListView.as_view(), name='admin_orders_list'),
    path('admin/orders/<str:pk>/status/', AdminOrderStatusUpdateView.as_view(), name='admin_order_status_update'),
    path('admin/coupons/', AdminCouponListCreateView.as_view(), name='admin_coupons_list_create'),
    path('admin/coupons/<str:pk>/', AdminCouponDetailView.as_view(), name='admin_coupon_detail'),
    path('admin/reviews/', AdminReviewsListView.as_view(), name='admin_reviews_list'),
    path('admin/reviews/<str:pk>/', AdminReviewsListView.as_view(), name='admin_review_action'),
    path('admin/inventory/', AdminInventoryOverviewView.as_view(), name='admin_inventory_overview'),
]
