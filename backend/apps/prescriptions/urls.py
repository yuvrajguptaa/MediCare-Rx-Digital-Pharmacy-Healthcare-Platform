from django.urls import path
from .views import (
    PrescriptionUploadView, UserPrescriptionsView,
    PrescriptionDetailView, PharmacistReviewPrescriptionView
)

urlpatterns = [
    path('prescriptions/upload/', PrescriptionUploadView.as_view(), name='prescription_upload'),
    path('prescriptions/my/', UserPrescriptionsView.as_view(), name='prescription_my'),
    path('prescriptions/<str:pk>/', PrescriptionDetailView.as_view(), name='prescription_detail'),
    path('prescriptions/review/list/', PharmacistReviewPrescriptionView.as_view(), name='prescription_review_list'),
    path('prescriptions/<str:pk>/review/', PharmacistReviewPrescriptionView.as_view(), name='prescription_review_action'),
]
