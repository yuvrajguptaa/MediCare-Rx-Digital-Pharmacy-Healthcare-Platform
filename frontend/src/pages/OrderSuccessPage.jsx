import React, { useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, PackageCheck, ArrowRight, Truck, ShieldCheck, Home } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function OrderSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state?.order;

  useEffect(() => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.5 }
    });
  }, []);

  if (!order) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Order Placed</h2>
        <Link to="/orders" className="inline-block px-6 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl">
          View My Orders
        </Link>
      </div>
    );
  }

  const orderId = order.id || order._id;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-8 animate-fade-in">
      
      {/* Celebration Icon */}
      <div className="w-24 h-24 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xl ring-8 ring-emerald-50">
        <CheckCircle2 className="w-12 h-12" />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-black uppercase tracking-widest text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
          Order Confirmed & Placed
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Thank you for your order!
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          We have received your order <strong>#{order.order_number}</strong>. Our licensed pharmacy team is preparing your medications for dispatch.
        </p>
      </div>

      {/* Summary Box */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm text-left space-y-4 max-w-xl mx-auto">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3 text-xs">
          <span className="text-slate-500">Order Number</span>
          <span className="font-mono font-bold text-slate-900">{order.order_number}</span>
        </div>

        <div className="flex justify-between items-center border-b border-slate-100 pb-3 text-xs">
          <span className="text-slate-500">Total Amount Paid</span>
          <span className="font-black text-base text-emerald-700">₹{order.total_amount}</span>
        </div>

        <div className="flex justify-between items-center border-b border-slate-100 pb-3 text-xs">
          <span className="text-slate-500">Payment Mode</span>
          <span className="font-bold text-slate-800 uppercase">{order.payment_method}</span>
        </div>

        <div className="pt-2 text-xs text-slate-600 space-y-1">
          <span className="font-bold text-slate-800 block">Shipping Destination:</span>
          <p>
            {order.shipping_address?.street_address}, {order.shipping_address?.city}, {order.shipping_address?.state} - {order.shipping_address?.postal_code}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
        <Link
          to={`/orders/${orderId}`}
          className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2"
        >
          <Truck className="w-4 h-4" />
          Track Order Live
        </Link>

        <Link
          to="/medicines"
          className="px-8 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2"
        >
          <Home className="w-4 h-4" />
          Continue Shopping
        </Link>
      </div>

    </div>
  );
}
