from django.urls import path
from .views import CartView, WishlistView, MoveWishlistToCartView

urlpatterns = [
    path('cart/', CartView.as_view(), name='cart_view'),
    path('wishlist/', WishlistView.as_view(), name='wishlist_view'),
    path('wishlist/move-to-cart/', MoveWishlistToCartView.as_view(), name='wishlist_move_to_cart'),
]
