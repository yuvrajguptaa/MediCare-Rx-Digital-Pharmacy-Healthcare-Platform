import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Truck, Clock, CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react';
import api from '../api/client';
import BackButton from '../components/common/BackButton';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/my/')
      .then(res => setOrders(res.data?.orders || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'SHIPPED':
      case 'OUT_FOR_DELIVERY':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'CONFIRMED':
      case 'PACKED':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'CANCELLED':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">My Orders</h1>
          <p className="text-xs text-slate-500 mt-0.5">Track and view history of your pharmacy orders</p>
        </div>
        <BackButton fallbackUrl="/" label="Back to Home" />
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Orders Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You have not placed any orders yet. Browse our catalog to place your first order.
          </p>
          <Link
            to="/medicines"
            className="inline-block px-6 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            Explore Medicines
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const orderId = order.id || order._id;
            return (
              <div
                key={orderId}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-5 sm:p-6 space-y-4"
              >
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="space-y-0.5">
                    <span className="font-mono font-bold text-sm text-slate-900">#{order.order_number}</span>
                    <span className="text-[11px] text-slate-400 block">
                      Placed on {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-[11px] font-extrabold uppercase px-3 py-1 rounded-full border ${getStatusColor(order.order_status)}`}>
                      {order.order_status.replace(/_/g, ' ')}
                    </span>
                    <span className="font-black text-base text-slate-900">
                      ₹{order.total_amount}
                    </span>
                  </div>
                </div>

                {/* Items Thumbnails */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                    {order.items?.map((it, idx) => (
                      <div key={idx} className="flex items-center gap-2 shrink-0 bg-slate-50 p-1.5 rounded-xl border border-slate-200 text-xs">
                        <img
                          src={it.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100'}
                          alt={it.name}
                          className="w-10 h-10 object-cover rounded-lg"
                        />
                        <div className="max-w-[140px] pr-2">
                          <p className="font-bold text-slate-900 truncate text-[11px]">{it.name}</p>
                          <p className="text-[10px] text-slate-500">Qty: {it.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Link
                    to={`/orders/${orderId}`}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1 transition-colors shrink-0 shadow-xs"
                  >
                    Track Order <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
