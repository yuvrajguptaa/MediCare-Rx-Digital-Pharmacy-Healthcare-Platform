import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Star, Plus, Minus, Check } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useNotifications } from '../../context/NotificationContext';

export default function MedicineCard({ medicine }) {
  const { addToCart, updateQuantity, removeFromCart, toggleWishlist, isInWishlist, getCartItemQuantity } = useCart();
  const { showToast } = useNotifications();
  const [loading, setLoading] = useState(false);

  const medId = medicine.id || medicine._id;
  const inWish = isInWishlist(medId);
  const qtyInCart = getCartItemQuantity(medId);
  const isOutOfStock = medicine.stock <= 0;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    try {
      setLoading(true);
      await addToCart(medId, 1);
      showToast(`Added ${medicine.name} to cart!`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to add to cart', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleIncrease = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (qtyInCart >= medicine.stock) {
      showToast(`Only ${medicine.stock} units available in stock.`, 'warning');
      return;
    }
    await updateQuantity(medId, qtyInCart + 1);
  };

  const handleDecrease = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (qtyInCart === 1) {
      await removeFromCart(medId);
      showToast(`Removed from cart`, 'info');
    } else {
      await updateQuantity(medId, qtyInCart - 1);
    }
  };

  const handleWishlistToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await toggleWishlist(medicine);
      showToast(inWish ? 'Removed from wishlist' : 'Added to wishlist!', inWish ? 'info' : 'success');
    } catch (err) {
      showToast(err.message || 'Please login to save to wishlist', 'error');
    }
  };

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-emerald-500/40 transition-all duration-300 flex flex-col justify-between overflow-hidden relative">
      
      {/* Top Badges & Wishlist */}
      <div className="relative p-4 pb-0">
        <div className="flex items-center justify-between gap-2">
          {/* Prescription Badge */}
          {medicine.prescription_required ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-700 uppercase tracking-wider">
              Rx Required
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700 uppercase tracking-wider">
              OTC Safe
            </span>
          )}

          {/* Wishlist Button */}
          <button
            onClick={handleWishlistToggle}
            className={`p-2 rounded-full transition-all ${
              inWish
                ? 'bg-rose-50 text-rose-600 shadow-sm'
                : 'text-slate-400 hover:text-rose-500 hover:bg-slate-100'
            }`}
            title="Save to Wishlist"
          >
            <Heart className={`w-4 h-4 ${inWish ? 'fill-rose-500' : ''}`} />
          </button>
        </div>

        {/* Medicine Image */}
        <Link to={`/medicines/${medId}`} className="block relative mt-2 overflow-hidden rounded-xl bg-slate-50 aspect-4/3 flex items-center justify-center">
          <img
            src={medicine.images?.[0] || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop&q=70'}
            alt={medicine.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />

          {/* Discount Tag */}
          {medicine.discount > 0 && (
            <span className="absolute top-2 left-2 bg-gradient-to-r from-amber-500 to-rose-500 text-white font-black text-[10px] px-2 py-0.5 rounded-md shadow-sm">
              {medicine.discount}% OFF
            </span>
          )}

          {/* Out of stock overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center">
              <span className="bg-slate-900 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Out of Stock
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Body Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Brand & Dosage */}
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1">
            <span className="text-emerald-700 font-bold truncate max-w-[120px]">{medicine.brand}</span>
            <span>{medicine.dosage_form || 'Tablet'}</span>
          </div>

          {/* Title */}
          <Link to={`/medicines/${medId}`} className="block">
            <h3 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-emerald-600 transition-colors line-clamp-1">
              {medicine.name}
            </h3>
          </Link>

          {/* Generic Salt */}
          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5" title={medicine.generic_name}>
            {medicine.generic_name}
          </p>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mt-2">
            <div className="flex items-center gap-0.5 bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded text-xs font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{medicine.ratings_avg || 4.5}</span>
            </div>
            <span className="text-[11px] text-slate-400">
              ({medicine.ratings_count || 0})
            </span>
          </div>
        </div>

        {/* Pricing & Add to Cart Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-black text-slate-900">
                ₹{medicine.selling_price}
              </span>
              {medicine.mrp > medicine.selling_price && (
                <span className="text-xs text-slate-400 line-through">
                  ₹{medicine.mrp}
                </span>
              )}
            </div>
            {medicine.stock > 0 && medicine.stock <= 10 && (
              <span className="text-[10px] font-bold text-amber-600 block">
                Only {medicine.stock} left!
              </span>
            )}
          </div>

          {/* Add / Qty Control */}
          {qtyInCart > 0 ? (
            <div className="flex items-center bg-emerald-50 border border-emerald-300 rounded-xl p-0.5 shadow-xs">
              <button
                onClick={handleDecrease}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-emerald-800 hover:bg-emerald-100 font-bold transition-colors"
                title="Decrease"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-7 text-center font-extrabold text-xs text-emerald-950">
                {qtyInCart}
              </span>
              <button
                onClick={handleIncrease}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-bold transition-colors"
                title="Increase"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock || loading}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                isOutOfStock
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 hover:shadow-md'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
