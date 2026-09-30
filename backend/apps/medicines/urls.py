from django.urls import path
from .views import (
    MedicineListView, MedicineDetailView, MedicineSuggestionsView,
    FeaturedMedicinesView, CategoryListView, CategoryDetailView
)
from apps.admin_portal.views import (
    AdminMedicineBulkUploadView, AdminMedicineCSVTemplateView
)

urlpatterns = [
    path('medicines/', MedicineListView.as_view(), name='medicine_list'),
    path('medicines/featured/', FeaturedMedicinesView.as_view(), name='medicine_featured'),
    path('medicines/suggestions/', MedicineSuggestionsView.as_view(), name='medicine_suggestions'),
    path('medicines/bulk-upload/', AdminMedicineBulkUploadView.as_view(), name='medicine_bulk_upload_alias'),
    path('medicines/export/template/', AdminMedicineCSVTemplateView.as_view(), name='medicine_export_template_alias'),
    path('medicines/<str:pk>/', MedicineDetailView.as_view(), name='medicine_detail'),
    path('categories/', CategoryListView.as_view(), name='category_list'),
    path('categories/<str:slug>/', CategoryDetailView.as_view(), name='category_detail'),
]
