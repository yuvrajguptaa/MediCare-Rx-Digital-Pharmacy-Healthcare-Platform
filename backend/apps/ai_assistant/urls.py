from django.urls import path
from .views import MediAIChatView

urlpatterns = [
    path('ai/chat/', MediAIChatView.as_view(), name='ai_chat'),
]
