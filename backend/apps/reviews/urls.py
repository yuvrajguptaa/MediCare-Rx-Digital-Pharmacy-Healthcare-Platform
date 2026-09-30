from django.urls import path
from .views import MedicineReviewsView, CheckCanReviewView

urlpatterns = [
    path('reviews/medicine/<str:medicine_id>/', MedicineReviewsView.as_view(), name='medicine_reviews'),
    path('reviews/can-review/<str:medicine_id>/', CheckCanReviewView.as_view(), name='check_can_review'),
]
