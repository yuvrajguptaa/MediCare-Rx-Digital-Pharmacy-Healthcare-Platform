import React, { useState, useEffect } from 'react';
import {
  Truck, CheckCircle2, Clock, MapPin, Phone, ShieldCheck,
  AlertCircle, Package, Search, RefreshCw, KeyRound, ExternalLink,
  ChevronRight, ArrowRight, UserCheck, CheckCircle
} from 'lucide-react';
import api from '../../api/client';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

export default function DeliveryDashboard() {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [stats, setStats] = useState({
    assigned: 0,
    picked_up: 0,
    out_for_delivery: 0,
    delivered_today: 0,
    today_earnings: 0,
  });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ACTIVE'); // 'ACTIVE' | 'COMPLETED' | 'ALL'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  // OTP Modal
  const [otpModalOrder, setOtpModalOrder] = useState(null);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh every 20 seconds for live rider updates
    const interval = setInterval(fetchDashboardData, 20000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        api.get('/delivery/dashboard/'),
        api.get(`/delivery/orders/?filter=${activeTab}`),
      ]);
      setStats(statsRes.data?.stats || {});
      setOrders(ordersRes.data?.orders || []);
    } catch (err) {
      console.error('Failed to load rider dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      setActionLoading(true);
      const res = await api.patch(`/delivery/orders/${orderId}/status/`, { status: newStatus });
      showToast(`Order updated to ${newStatus.replace(/_/g, ' ')}`, 'success');
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder(res.data.order);
      }
      fetchDashboardData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update order status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    if (!enteredOtp || enteredOtp.length < 4) {
      showToast('Please enter the 4-digit OTP provided by customer', 'warning');
      return;
    }
    try {
      setVerifyingOtp(true);
      await api.patch(`/delivery/orders/${otpModalOrder._id}/verify-otp/`, { otp: enteredOtp.trim() });
      showToast('Delivery confirmed & marked DELIVERED successfully! Great job!', 'success');
      setOtpModalOrder(null);
      setEnteredOtp('');
      if (selectedOrder && selectedOrder._id === otpModalOrder._id) {
        setSelectedOrder(null);
      }
      fetchDashboardData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Invalid OTP code. Please check with customer.', 'error');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (o.order_number || '').toLowerCase().includes(q) ||
      (o.shipping_address?.full_name || '').toLowerCase().includes(q) ||
      (o.shipping_address?.phone || '').includes(q) ||
      (o.shipping_address?.postal_code || '').includes(q) ||
      (o.shipping_address?.city || '').toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DELIVERED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">Delivered</span>;
      case 'OUT_FOR_DELIVERY':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-purple-100 text-purple-800 border border-purple-200 animate-pulse">Out for Delivery</span>;
      case 'PICKED_UP':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-sky-100 text-sky-800 border border-sky-200">Picked Up</span>;
      case 'READY_FOR_PICKUP':
      case 'ASSIGNED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-100 text-amber-800 border border-amber-200">Ready at Hub</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-16">
      {/* Top Header Bar */}
      <div className="bg-slate-950 border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  Rider Portal
                </span>
                <span className="text-xs text-slate-400">Live Logistics</span>
              </div>
              <h1 className="text-base font-bold text-white leading-tight">
                {user?.full_name || 'Delivery Partner'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchDashboardData}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-colors border border-slate-700"
              title="Refresh deliveries"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* KPI Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Assigned / Ready</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-amber-400">{stats.assigned || 0}</span>
              <Package className="w-4 h-4 text-amber-400/60" />
            </div>
          </div>

          <div className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Picked Up</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-sky-400">{stats.picked_up || 0}</span>
              <Clock className="w-4 h-4 text-sky-400/60" />
            </div>
          </div>

          <div className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Out for Delivery</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-purple-400">{stats.out_for_delivery || 0}</span>
              <Truck className="w-4 h-4 text-purple-400/60" />
            </div>
          </div>

          <div className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Delivered Today</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-emerald-400">{stats.delivered_today || 0}</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400/60" />
            </div>
          </div>

          <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-emerald-950/80 to-slate-800/80 border border-emerald-800/40 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-emerald-300 uppercase">Today's Payout</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-emerald-300">₹{stats.today_earnings || (stats.delivered_today * 50)}</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-800/40 p-3 rounded-2xl border border-slate-700/60">
          <div className="flex items-center gap-1.5 w-full sm:w-auto bg-slate-900/80 p-1 rounded-xl border border-slate-700/80">
            <button
              onClick={() => setActiveTab('ACTIVE')}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'ACTIVE'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Active Runs ({stats.assigned + stats.picked_up + stats.out_for_delivery})
            </button>
            <button
              onClick={() => setActiveTab('COMPLETED')}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'COMPLETED'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Delivered ({stats.delivered_today})
            </button>
            <button
              onClick={() => setActiveTab('ALL')}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'ALL'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Runs
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Order #, Customer, Pincode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Deliveries List */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-3xl p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">No deliveries in this queue</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {activeTab === 'ACTIVE'
                ? 'All assigned deliveries have been fulfilled or no active runs are currently dispatched.'
                : 'No delivery records match your current filter.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.map((order) => {
              const isDelivered = order.order_status === 'DELIVERED';
              const isOutForDelivery = order.order_status === 'OUT_FOR_DELIVERY';
              const isPickedUp = order.order_status === 'PICKED_UP';
              const isReady = ['READY_FOR_PICKUP', 'ASSIGNED'].includes(order.order_status);

              return (
                <div
                  key={order._id}
                  className={`bg-slate-800/80 border rounded-3xl p-5 flex flex-col justify-between transition-all hover:border-slate-600 ${
                    isOutForDelivery
                      ? 'border-purple-500/50 ring-1 ring-purple-500/20 shadow-lg shadow-purple-950/20'
                      : 'border-slate-700'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header: Order ID & Status */}
                    <div className="flex items-start justify-between gap-2 border-b border-slate-700/60 pb-3">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400">IDENTIFIER</span>
                        <h3 className="text-sm font-black text-white">{order.order_number}</h3>
                        <span className="text-[10px] text-slate-400">
                          {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {order.items?.length || 0} packages
                        </span>
                      </div>
                      {getStatusBadge(order.order_status)}
                    </div>

                    {/* Customer Info & Direct Call */}
                    <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-white">{order.shipping_address?.full_name || 'Customer'}</p>
                          <p className="text-[11px] text-slate-400">{order.shipping_address?.phone}</p>
                        </div>
                        {order.shipping_address?.phone && (
                          <a
                            href={`tel:${order.shipping_address.phone}`}
                            className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5" /> Call
                          </a>
                        )}
                      </div>

                      {/* Address */}
                      <div className="text-xs text-slate-300 flex items-start gap-2 pt-1 border-t border-slate-800/80">
                        <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <div className="leading-snug">
                          <p className="text-slate-200">{order.shipping_address?.street_address}</p>
                          <p className="text-slate-400 text-[11px]">
                            {order.shipping_address?.city}, {order.shipping_address?.state} - <strong className="text-emerald-400 font-mono">{order.shipping_address?.postal_code}</strong>
                          </p>
                        </div>
                      </div>

                      {/* Google Maps link */}
                      {order.shipping_address?.street_address && (
                        <div className="pt-1 flex justify-end">
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              `${order.shipping_address.street_address}, ${order.shipping_address.city} ${order.shipping_address.postal_code}`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" /> Open in Google Maps
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Medicines checklist for rider inspection */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Package Contents:</span>
                      <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                        {order.items?.map((it, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs bg-slate-900/40 px-2.5 py-1 rounded-lg border border-slate-800">
                            <span className="text-slate-300 truncate max-w-[180px]">{it.name}</span>
                            <span className="text-emerald-400 font-bold font-mono">× {it.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Payment Mode Note */}
                    <div className="flex items-center justify-between text-xs bg-slate-900/40 p-2 rounded-xl border border-slate-800">
                      <span className="text-slate-400">Collect Amount:</span>
                      <span className="font-bold text-white">
                        {order.payment_method === 'COD' && order.payment_status !== 'PAID'
                          ? <span className="text-amber-400">Collect ₹{order.total_amount} (Cash/UPI)</span>
                          : <span className="text-emerald-400">₹{order.total_amount} (Prepaid - No Cash)</span>
                        }
                      </span>
                    </div>
                  </div>

                  {/* Rider Status Action Buttons */}
                  <div className="pt-4 border-t border-slate-700/60 mt-4 space-y-2">
                    {isReady && (
                      <button
                        onClick={() => handleUpdateStatus(order._id, 'PICKED_UP')}
                        disabled={actionLoading}
                        className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
                      >
                        <Package className="w-4 h-4" /> Pick Up from Pharmacy Hub
                      </button>
                    )}

                    {isPickedUp && (
                      <button
                        onClick={() => handleUpdateStatus(order._id, 'OUT_FOR_DELIVERY')}
                        disabled={actionLoading}
                        className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
                      >
                        <Truck className="w-4 h-4" /> Start Delivery (Out for Delivery)
                      </button>
                    )}

                    {isOutForDelivery && (
                      <button
                        onClick={() => {
                          setOtpModalOrder(order);
                          setEnteredOtp('');
                        }}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm shadow-emerald-900/40 transition-all"
                      >
                        <KeyRound className="w-4 h-4" /> Verify OTP & Mark Delivered
                      </button>
                    )}

                    {isDelivered && (
                      <div className="w-full py-2 bg-emerald-950/60 border border-emerald-800/60 rounded-xl text-center text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                        <CheckCircle className="w-4 h-4" /> Delivered at {order.timestamps?.delivered_at ? new Date(order.timestamps.delivered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Earlier'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* OTP Delivery Verification Modal */}
      {otpModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-black text-white">Doorstep Delivery OTP</h2>
              <p className="text-xs text-slate-400">
                Ask customer <strong className="text-white">{otpModalOrder.shipping_address?.full_name}</strong> for the 4-digit OTP shown on their order tracking screen.
              </p>
            </div>

            <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 text-center">
                  Customer 4-Digit Security OTP
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="• • • •"
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                  className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 text-center tracking-[1em] text-2xl font-black font-mono py-3 rounded-2xl text-emerald-400 placeholder-slate-700 focus:outline-hidden"
                />
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Order Identifier:</span>
                  <span className="font-bold text-white font-mono">{otpModalOrder.order_number}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment status:</span>
                  <span className="font-bold text-emerald-400 uppercase">{otpModalOrder.payment_status}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOtpModalOrder(null)}
                  disabled={verifyingOtp}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifyingOtp || enteredOtp.length < 4}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-emerald-900/50"
                >
                  {verifyingOtp ? 'Verifying...' : 'Confirm Delivery'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
