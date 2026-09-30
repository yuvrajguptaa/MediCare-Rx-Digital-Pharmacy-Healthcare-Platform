import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trash2, Plus, Minus, ArrowRight, ShieldCheck, Tag,
  AlertTriangle, ShoppingBag, Truck, Percent, Check, AlertCircle
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNotifications } from '../context/NotificationContext';
import BackButton from '../components/common/BackButton';

export default function CartPage() {
  const {
    cart,
    cartLoading,
    updateQuantity,
    removeFromCart,
    clearCart,
    applyCoupon,
    removeCoupon,
    appliedCouponCode
  } = useCart();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    try {
      setCouponLoading(true);
      const res = await applyCoupon(couponInput.trim());
      showToast(res.message || 'Coupon applied!', 'success');
      setCouponInput('');
    } catch (err) {
      showToast(err.response?.data?.error || 'Invalid coupon code', 'error');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    showToast('Coupon removed.', 'info');
  };

  if (cartLoading && cart.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-24 h-24 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
          <ShoppingBag className="w-12 h-12" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Your Cart is Empty</h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
            Looks like you haven't added any medicines yet. Explore our genuine catalog of 50+ healthcare items.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <BackButton fallbackUrl="/medicines" label="Back to Shopping" />
          <Link
            to="/medicines"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-600/20"
          >
            Explore Medicines →
          </Link>
        </div>
      </div>
    );
  }

  const freeDeliveryThreshold = 500;
  const remainingForFree = Math.max(0, freeDeliveryThreshold - cart.subtotal_selling);
  const freeDeliveryPercent = Math.min(100, Math.round((cart.subtotal_selling / freeDeliveryThreshold) * 100));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Title & Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <BackButton fallbackUrl="/medicines" label="Back to Catalog" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Your Shopping Cart</h1>
            <p className="text-xs text-slate-500 mt-0.5">{cart.item_count} items in your order</p>
          </div>
        </div>
        <button
          onClick={clearCart}
          className="text-xs font-bold text-rose-600 hover:text-rose-700 transition-colors self-start sm:self-auto"
        >
          Clear Cart
        </button>
      </div>

      {/* Free Delivery Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="flex items-center gap-1.5 text-slate-800">
            <Truck className="w-4 h-4 text-emerald-600" />
            {remainingForFree === 0
              ? '🎉 You unlocked FREE Express Delivery!'
              : `Add ₹${remainingForFree.toFixed(2)} more for FREE Delivery`}
          </span>
          <span className="text-emerald-700">{freeDeliveryPercent}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${freeDeliveryPercent}%` }}
          />
        </div>
      </div>

      {/* Prescription Warning Banner */}
      {cart.requires_prescription && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-amber-950">Prescription Required for this Order</h4>
            <p className="mt-0.5 text-amber-800">
              One or more items in your cart require a valid doctor prescription. You will be able to attach your prescription on the checkout page.
            </p>
          </div>
          <Link
            to="/prescriptions"
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-colors shrink-0 shadow-xs"
          >
            Upload Now
          </Link>
        </div>
      )}

      {/* Grid Layout: Cart Items & Order Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Cart Items List */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden divide-y divide-slate-100">
          {cart.items.map((item) => (
            <div key={item.medicine_id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              
              <div className="flex items-center gap-4 min-w-0">
                <img
                  src={item.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200'}
                  alt={item.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-2xl border border-slate-200 shrink-0"
                />
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/medicines/${item.medicine_id}`}
                      className="font-bold text-sm sm:text-base text-slate-900 hover:text-emerald-600 transition-colors truncate block"
                    >
                      {item.name}
                    </Link>
                    {item.prescription_required && (
                      <span className="text-[10px] bg-rose-100 text-rose-700 font-extrabold px-1.5 py-0.5 rounded">
                        Rx
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{item.generic_name} • {item.brand}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-sm text-slate-900">₹{item.selling_price}</span>
                    {item.mrp > item.selling_price && (
                      <span className="text-xs text-slate-400 line-through">₹{item.mrp}</span>
                    )}
                    {item.discount > 0 && (
                      <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-50 px-1.5 py-0.5 rounded">
                        {item.discount}% off
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quantity Stepper & Remove */}
              <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
                  <button
                    onClick={() => updateQuantity(item.medicine_id, item.quantity - 1)}
                    className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-slate-700 hover:bg-slate-200 font-bold"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center font-extrabold text-xs text-slate-900">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.medicine_id, item.quantity + 1)}
                    disabled={item.quantity >= item.stock}
                    className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-slate-700 hover:bg-slate-200 font-bold disabled:opacity-30"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-right min-w-[70px]">
                  <span className="font-black text-sm text-slate-900 block">
                    ₹{item.item_total_selling}
                  </span>
                </div>

                <button
                  onClick={() => removeFromCart(item.medicine_id)}
                  className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

            </div>
          ))}
        </div>

        {/* Right: Order Summary Card */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Coupon Box */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-emerald-600" />
              Apply Discount Coupon
            </h3>

            {cart.applied_coupon ? (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-black text-xs text-emerald-900">{cart.applied_coupon.code}</span>
                    <span className="text-[11px] text-emerald-700 block">Saved ₹{cart.applied_coupon.discount_amount}</span>
                  </div>
                </div>
                <button
                  onClick={handleRemoveCoupon}
                  className="text-xs font-bold text-rose-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="e.g. HEALTH10, PHARMA20"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs uppercase tracking-wider font-semibold focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  disabled={couponLoading || !couponInput.trim()}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors disabled:opacity-40"
                >
                  {couponLoading ? '...' : 'Apply'}
                </button>
              </form>
            )}

            {/* Quick coupon tags */}
            {!cart.applied_coupon && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['HEALTH10', 'PHARMA20', 'FIRSTMED50'].map(code => (
                  <button
                    key={code}
                    onClick={() => { setCouponInput(code); }}
                    className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200"
                  >
                    {code}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Price Breakdown */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-3">
              Order Summary
            </h3>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Items MRP Subtotal</span>
                <span>₹{cart.subtotal_mrp}</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Discount on MRP</span>
                <span>-₹{cart.mrp_savings}</span>
              </div>
              {cart.coupon_discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Coupon Discount ({cart.applied_coupon?.code})</span>
                  <span>-₹{cart.coupon_discount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Estimated Delivery Fee</span>
                <span>
                  {cart.delivery_fee === 0 ? (
                    <span className="text-emerald-600 font-bold uppercase">FREE</span>
                  ) : (
                    `₹${cart.delivery_fee}`
                  )}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-baseline justify-between">
              <div>
                <span className="text-xs text-slate-400 block font-medium">Total Amount</span>
                <span className="text-2xl font-black text-slate-900">₹{cart.final_total}</span>
              </div>
              {cart.total_savings > 0 && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
                  Total Saved: ₹{cart.total_savings}
                </span>
              )}
            </div>

            <button
              onClick={() => navigate('/checkout')}
              disabled={cart.has_out_of_stock}
              className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-[11px] text-center text-slate-400">
              🔒 100% Safe & Secure Encrypted Checkout
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
