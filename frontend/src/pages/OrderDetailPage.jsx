import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Package, Truck, CheckCircle2, Clock, AlertTriangle, Printer,
  RotateCcw, XCircle, ArrowLeft, ShieldCheck, MapPin, CreditCard,
  Phone, UserCheck, KeyRound, RefreshCw, FileText
} from 'lucide-react';
import api from '../api/client';
import { useNotifications } from '../context/NotificationContext';
import { useCart } from '../context/CartContext';
import BackButton from '../components/common/BackButton';

const TIMELINE_STEPS = [
  { key: 'PLACED', label: 'Order Placed', desc: 'Received & logged' },
  { key: 'CONFIRMED', label: 'Confirmed', desc: 'Prescription & Payment verified' },
  { key: 'PACKING', label: 'Packing', desc: 'Items checked & sealed' },
  { key: 'READY_FOR_PICKUP', label: 'Ready for Pickup', desc: 'Packed at pharmacy hub' },
  { key: 'PICKED_UP', label: 'Picked Up', desc: 'Rider picked up parcel' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'Rider arriving at doorstep' },
  { key: 'DELIVERED', label: 'Delivered', desc: 'Delivered with OTP' }
];

export default function OrderDetailPage() {
  const { id } = useParams();
  const { showToast } = useNotifications();
  const { fetchCart } = useCart();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    fetchOrder();
    // Live polling every 15s if order is in progress
    const interval = setInterval(() => {
      fetchOrder(false);
    }, 15000);
    return () => clearInterval(interval);
  }, [id]);

  const fetchOrder = (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    api.get(`/orders/${id}/`)
      .then(res => setOrder(res.data?.order))
      .catch(err => {
        console.error(err);
        if (showSpinner) showToast('Order not found', 'error');
      })
      .finally(() => {
        if (showSpinner) setLoading(false);
      });
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      setCancelling(true);
      const res = await api.post(`/orders/${id}/cancel/`, { reason: 'Customer requested cancellation.' });
      showToast('Order cancelled successfully.', 'info');
      setOrder(res.data.order);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to cancel order.', 'error');
    } finally {
      setCancelling(false);
    }
  };

  const handleReorder = async () => {
    try {
      setReordering(true);
      await api.post(`/orders/${id}/reorder/`);
      await fetchCart();
      showToast('Items added to cart!', 'success');
      navigate('/cart');
    } catch (err) {
      showToast('Failed to reorder items.', 'error');
    } finally {
      setReordering(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <BackButton fallbackUrl="/orders" label="Back to Orders" />
        <h2 className="text-xl font-bold text-slate-900 mt-4">Order Not Found</h2>
        <Link to="/orders" className="inline-block px-6 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl">
          Back to Orders
        </Link>
      </div>
    );
  }

  const isCancelled = order.order_status === 'CANCELLED';
  const isDelivered = order.order_status === 'DELIVERED';
  const canCancel = ['PLACED', 'PENDING', 'CONFIRMED'].includes(order.order_status);

  // Normalize current step index
  let normalizedStatus = order.order_status;
  if (normalizedStatus === 'PENDING') normalizedStatus = 'PLACED';
  if (normalizedStatus === 'PREPARING') normalizedStatus = 'PACKING';
  if (normalizedStatus === 'ASSIGNED') normalizedStatus = 'READY_FOR_PICKUP';

  const stepIndex = TIMELINE_STEPS.findIndex(s => s.key === normalizedStatus);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 print:p-0">
      
      {/* Top Controls with Back Button */}
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <BackButton fallbackUrl="/orders" label="Back to My Orders" />
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchOrder(true)}
            className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            title="Refresh order status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4" /> Print Invoice
          </button>
          <button
            onClick={handleReorder}
            disabled={reordering}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <RotateCcw className="w-4 h-4" /> {reordering ? 'Adding...' : 'Reorder Items'}
          </button>
          {canCancel && (
            <button
              onClick={handleCancelOrder}
              disabled={cancelling}
              className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold text-xs rounded-xl transition-colors"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Order'}
            </button>
          )}
        </div>
      </div>

      {/* Order Header Summary Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs text-slate-400 font-mono">ORDER IDENTIFIER</span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">#{order.order_number}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Placed on {new Date(order.created_at).toLocaleDateString()} • Payment: <strong className="uppercase text-slate-800">{order.payment_method}</strong> ({order.payment_status})
            </p>
          </div>

          <span className={`text-xs font-black uppercase px-4 py-1.5 rounded-full border ${
            isCancelled
              ? 'bg-rose-100 text-rose-800 border-rose-200'
              : order.order_status === 'DELIVERED'
              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
              : 'bg-sky-100 text-sky-800 border-sky-200'
          }`}>
            {order.order_status.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Security Delivery OTP Banner */}
        {!isCancelled && !isDelivered && (
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-emerald-900 text-center sm:text-left">
              <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-950">Doorstep Delivery Security OTP</h3>
                <p className="text-xs text-emerald-700">
                  Share this 4-digit secret OTP with your delivery partner only upon physically receiving your parcel.
                </p>
              </div>
            </div>
            <div className="bg-white px-5 py-2.5 rounded-xl border-2 border-dashed border-emerald-400 text-center shadow-xs">
              <span className="text-[10px] uppercase tracking-wider text-emerald-600 font-bold block">Delivery OTP</span>
              <span className="text-2xl font-black font-mono tracking-widest text-emerald-700">
                {order.delivery_otp || '----'}
              </span>
            </div>
          </div>
        )}

        {/* Visual Logistics Tracking Stepper */}
        {!isCancelled ? (
          <div className="py-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-6">
              Live Logistics Stepper
            </h3>
            
            <div className="relative">
              <div className="hidden sm:block absolute top-5 left-6 right-6 h-1 bg-slate-100 -z-0">
                <div
                  className="bg-emerald-500 h-full transition-all duration-700"
                  style={{ width: `${Math.max(0, (stepIndex / (TIMELINE_STEPS.length - 1)) * 100)}%` }}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-7 gap-3 relative z-10">
                {TIMELINE_STEPS.map((step, idx) => {
                  const isPassed = stepIndex >= idx;
                  const isCurrent = stepIndex === idx;

                  // Get timestamp for step if exists
                  const tsKey = {
                    PLACED: 'placed_at',
                    CONFIRMED: 'confirmed_at',
                    PACKING: 'packing_started_at',
                    READY_FOR_PICKUP: 'ready_for_pickup_at',
                    PICKED_UP: 'picked_up_at',
                    OUT_FOR_DELIVERY: 'out_for_delivery_at',
                    DELIVERED: 'delivered_at'
                  }[step.key];

                  const timestamp = order.timestamps?.[tsKey];

                  return (
                    <div key={step.key} className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                          isPassed
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        } ${isCurrent ? 'ring-4 ring-emerald-100' : ''}`}
                      >
                        {isPassed ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                      </div>
                      <div>
                        <p className={`text-xs font-bold ${isPassed ? 'text-slate-900' : 'text-slate-400'}`}>
                          {step.label}
                        </p>
                        <p className="text-[10px] text-slate-400 hidden sm:block mt-0.5">{step.desc}</p>
                        {timestamp && (
                          <span className="text-[9px] text-emerald-600 font-medium block mt-0.5">
                            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Status History Logs */}
            {order.status_history?.length > 0 && (
              <div className="mt-8 pt-6 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-bold text-slate-700">Timeline Activity Log:</h4>
                <div className="space-y-2">
                  {order.status_history.map((h, i) => (
                    <div key={i} className="flex items-start gap-3 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <span className="font-bold text-slate-800 uppercase mr-2">{h.status}:</span>
                        <span className="text-slate-600">{h.note}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>This order was cancelled. Any captured payments are processed for refund.</span>
          </div>
        )}
      </div>

      {/* Grid: Items Breakdown & Delivery Address */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Items List */}
        <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-3">
            Ordered Medicines ({order.items?.length || 0})
          </h3>

          <div className="divide-y divide-slate-100">
            {order.items?.map((it, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={it.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100'}
                    alt={it.name}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                  />
                  <div>
                    <Link to={`/medicines/${it.medicine_id}`} className="font-bold text-xs text-slate-900 hover:underline">
                      {it.name}
                    </Link>
                    <p className="text-[11px] text-slate-500">
                      ₹{it.selling_price} {it.mrp && it.mrp > it.selling_price && <span className="line-through text-slate-400">₹{it.mrp}</span>} × {it.quantity} units
                    </p>
                    {it.requires_prescription && (
                      <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded border border-amber-200">
                        Rx Verified
                      </span>
                    )}
                  </div>
                </div>
                <span className="font-bold text-xs text-slate-900">₹{it.item_total_selling}</span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{order.subtotal_selling}</span>
            </div>
            {order.coupon_discount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Coupon Discount ({order.coupon_code})</span>
                <span>-₹{order.coupon_discount}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span>{order.delivery_fee === 0 ? 'FREE' : `₹${order.delivery_fee}`}</span>
            </div>
            <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-100">
              <span>Total Amount</span>
              <span>₹{order.total_amount}</span>
            </div>
          </div>
        </div>

        {/* Address & Delivery Partner & Payment Info */}
        <div className="lg:col-span-4 space-y-6">
          {/* Delivery Partner Card if assigned */}
          {order.delivery_partner?.name && (
            <div className="bg-emerald-900 text-white p-6 rounded-3xl shadow-sm space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-emerald-300" />
                Assigned Delivery Partner
              </h4>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-white text-sm">{order.delivery_partner.name}</p>
                  <p className="text-xs text-emerald-200">{order.delivery_partner.phone || 'Verified Delivery Agent'}</p>
                </div>
                {order.delivery_partner.phone && (
                  <a
                    href={`tel:${order.delivery_partner.phone}`}
                    className="p-2.5 bg-emerald-700 hover:bg-emerald-600 rounded-xl text-white transition-colors"
                    title="Call Delivery Partner"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          )}

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-600" />
              Delivery Address
            </h4>
            <div className="text-xs text-slate-700 leading-relaxed space-y-1">
              <p className="font-bold text-slate-900">{order.shipping_address?.full_name}</p>
              <p>{order.shipping_address?.street_address}</p>
              <p>{order.shipping_address?.city}, {order.shipping_address?.state} - {order.shipping_address?.postal_code}</p>
              <p className="font-semibold text-slate-900 pt-1">📞 {order.shipping_address?.phone}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              Payment Details
            </h4>
            <div className="text-xs text-slate-700 space-y-1.5">
              <div className="flex justify-between">
                <span>Method:</span>
                <strong className="uppercase">{order.payment_method}</strong>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <strong className="text-emerald-700 uppercase">{order.payment_status}</strong>
              </div>
              {order.payment_details?.transaction_id && (
                <div className="flex justify-between font-mono text-[10px] text-slate-500">
                  <span>Txn ID:</span>
                  <span>{order.payment_details.transaction_id}</span>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
