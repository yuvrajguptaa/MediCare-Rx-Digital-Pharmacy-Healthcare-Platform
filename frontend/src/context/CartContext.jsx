import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState({
    items: [],
    item_count: 0,
    subtotal_mrp: 0,
    subtotal_selling: 0,
    mrp_savings: 0,
    coupon_discount: 0,
    applied_coupon: null,
    delivery_fee: 0,
    total_savings: 0,
    final_total: 0,
    requires_prescription: false,
    has_out_of_stock: false
  });
  const [wishlist, setWishlist] = useState([]);
  const [appliedCouponCode, setAppliedCouponCode] = useState('');
  const [cartLoading, setCartLoading] = useState(false);

  const fetchCart = useCallback(async (coupon = appliedCouponCode) => {
    if (!isAuthenticated) {
      setCart({
        items: [],
        item_count: 0,
        subtotal_mrp: 0,
        subtotal_selling: 0,
        mrp_savings: 0,
        coupon_discount: 0,
        applied_coupon: null,
        delivery_fee: 0,
        total_savings: 0,
        final_total: 0,
        requires_prescription: false,
        has_out_of_stock: false
      });
      return;
    }
    try {
      setCartLoading(true);
      const url = coupon ? `/cart/?coupon=${encodeURIComponent(coupon)}` : '/cart/';
      const res = await api.get(url);
      setCart(res.data);
    } catch (err) {
      console.error('Error fetching cart:', err);
    } finally {
      setCartLoading(false);
    }
  }, [isAuthenticated, appliedCouponCode]);

  const fetchWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setWishlist([]);
      return;
    }
    try {
      const res = await api.get('/wishlist/');
      setWishlist(res.data?.wishlist || []);
    } catch (err) {
      console.error('Error fetching wishlist:', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
    fetchWishlist();
  }, [fetchCart, fetchWishlist]);

  const addToCart = async (medicineId, quantity = 1) => {
    if (!isAuthenticated) {
      throw new Error('Please login to add items to your cart.');
    }
    const res = await api.post('/cart/', { medicine_id: medicineId, quantity });
    if (res.data?.cart) {
      setCart(res.data.cart);
    } else {
      await fetchCart();
    }
    return res.data;
  };

  const updateQuantity = async (medicineId, quantity) => {
    if (quantity <= 0) {
      return removeFromCart(medicineId);
    }
    const res = await api.post('/cart/', { medicine_id: medicineId, quantity });
    if (res.data?.cart) {
      setCart(res.data.cart);
    } else {
      await fetchCart();
    }
  };

  const removeFromCart = async (medicineId) => {
    const res = await api.delete('/cart/', { data: { medicine_id: medicineId } });
    if (res.data?.cart) {
      setCart(res.data.cart);
    } else {
      await fetchCart();
    }
  };

  const clearCart = async () => {
    await api.delete('/cart/', { data: { clear_all: true } });
    setAppliedCouponCode('');
    await fetchCart('');
  };

  const applyCoupon = async (code) => {
    const res = await api.post('/coupons/validate/', { code });
    if (res.data?.coupon) {
      setAppliedCouponCode(code);
      setCart(res.data.cart);
    }
    return res.data;
  };

  const removeCoupon = () => {
    setAppliedCouponCode('');
    fetchCart('');
  };

  const toggleWishlist = async (medicine) => {
    if (!isAuthenticated) {
      throw new Error('Please login to manage your wishlist.');
    }
    const medId = medicine.id || medicine._id;
    const isPresent = wishlist.some(m => (m.id || m._id) === medId);
    if (isPresent) {
      await api.delete('/wishlist/', { data: { medicine_id: medId } });
      setWishlist(prev => prev.filter(m => (m.id || m._id) !== medId));
    } else {
      await api.post('/wishlist/', { medicine_id: medId });
      setWishlist(prev => [...prev, medicine]);
    }
  };

  const moveToCart = async (medicineId) => {
    const res = await api.post('/wishlist/move-to-cart/', { medicine_id: medicineId });
    if (res.data?.cart) {
      setCart(res.data.cart);
    }
    setWishlist(prev => prev.filter(m => (m.id || m._id) !== medicineId));
    return res.data;
  };

  const isInWishlist = (medicineId) => {
    return wishlist.some(m => (m.id || m._id) === medicineId);
  };

  const isInCart = (medicineId) => {
    return cart.items.some(m => m.medicine_id === medicineId);
  };

  const getCartItemQuantity = (medicineId) => {
    const item = cart.items.find(m => m.medicine_id === medicineId);
    return item ? item.quantity : 0;
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        wishlist,
        cartLoading,
        appliedCouponCode,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        applyCoupon,
        removeCoupon,
        fetchCart,
        fetchWishlist,
        toggleWishlist,
        moveToCart,
        isInWishlist,
        isInCart,
        getCartItemQuantity
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
