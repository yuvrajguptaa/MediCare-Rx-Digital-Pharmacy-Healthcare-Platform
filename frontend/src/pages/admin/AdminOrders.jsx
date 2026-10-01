import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package, Truck, CheckCircle2, AlertCircle, Search,
  Filter, Eye, Clock, ArrowRight, ShieldCheck, Box,
  Printer, UserCheck, Calendar, RefreshCw, ChevronRight,
  ChevronLeft, ArrowUpDown
} from 'lucide-react';
import api from '../../api/client';
import { useNotifications } from '../../context/NotificationContext';
import BackButton from '../../components/common/BackButton';

const STATUS_TABS = [
  { key: '', label: 'All Orders' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'PACKING', label: 'Packing' },
  { key: 'READY_FOR_PICKUP', label: 'Ready for Pickup' },
  { key: 'ASSIGNED', label: 'Assigned' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { key: 'DELIVERED', label: 'Delivered' },
  { key: 'CANCELLED', label: 'Cancelled' }
];

export default function AdminOrders() {
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 25, totalPages: 1 });

  // Quick Status update modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [updating, setUpdating] = useState(false);

  // Quick Assign modal
  const [assignOrder, setAssignOrder] = useState(null);
  const [deliveryPartners, setDeliveryPartners] = useState([]);
  const [selectedRiderId, setSelectedRiderId] = useState('');
  const [assigningRider, setAssigningRider] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, paymentFilter, sortBy, page]);

  useEffect(() => {
    fetchDeliveryPartners();
  }, []);

  const fetchOrders = () => {
    setLoading(true);
    let url = `/admin/orders/?page=${page}&limit=25&sort=${sortBy}`;
    if (statusFilter) url += `&status=${statusFilter}`;
    if (paymentFilter) url += `&payment_status=${paymentFilter}`;
    if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;

    api.get(url)
      .then(res => {
        setOrders(res.data?.orders || []);
        setCounts(res.data?.counts || {});
        if (res.data?.pagination) {
          setPagination(res.data.pagination);
        }
      })
      .catch(err => {
        console.error(err);
        showToast('Failed to load orders', 'error');
      })
      .finally(() => setLoading(false));
  };

  const fetchDeliveryPartners = () => {
    api.get('/admin/delivery-partners/')
      .then(res => setDeliveryPartners(res.data?.delivery_partners || []))
      .catch(err => console.error(err));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const handleOpenStatusModal = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.order_status);
    setStatusNote('');
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    try {
      setUpdating(true);
      const ordId = selectedOrder.id || selectedOrder._id;
      await api.post(`/admin/orders/${ordId}/status/`, {
        order_status: newStatus,
        note: statusNote || `Status updated to ${newStatus}`
      });
      showToast(`Order #${selectedOrder.order_number} status updated to ${newStatus}!`, 'success');
      setSelectedOrder(null);
      fetchOrders();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update order status', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleOpenAssignModal = (order) => {
    setAssignOrder(order);
    setSelectedRiderId(order.delivery_partner_id || '');
  };

  const handleAssignRiderSubmit = async (e) => {
    e.preventDefault();
    if (!assignOrder || !selectedRiderId) return;
    try {
      setAssigningRider(true);
      const ordId = assignOrder.id || assignOrder._id;
      await api.post(`/admin/orders/${ordId}/assign-delivery/`, {
        delivery_partner_id: selectedRiderId
      });
      showToast(`Order #${assignOrder.order_number} assigned to delivery partner!`, 'success');
      setAssignOrder(null);
      fetchOrders();
      fetchDeliveryPartners();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to assign rider', 'error');
    } finally {
      setAssigningRider(false);
    }
  };

  const getStatusBadgeClass = (st) => {
    switch (st) {
      case 'DELIVERED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'OUT_FOR_DELIVERY':
      case 'PICKED_UP':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'READY_FOR_PICKUP':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'ASSIGNED':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'PACKING':
      case 'PREPARING':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'CANCELLED':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton fallbackUrl="/admin" label="Dashboard" />
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Order Management & Logistics</h1>
            <p className="text-xs text-slate-500">Monitor live packing workflows, assign delivery executives & track statuses</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setPage(1); fetchOrders(); }}
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 shadow-xs text-xs font-bold flex items-center gap-1.5 transition-colors"
            title="Refresh Orders"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Orders</span>
          <span className="text-xl font-black text-slate-900 mt-1 block">{counts.all || 0}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/40 shadow-xs">
          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">To Pack</span>
          <span className="text-xl font-black text-amber-900 mt-1 block">{counts.packing || 0}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-purple-200 bg-purple-50/40 shadow-xs">
          <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">Ready Pickup</span>
          <span className="text-xl font-black text-purple-900 mt-1 block">{counts.ready_for_pickup || 0}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-indigo-200 bg-indigo-50/40 shadow-xs">
          <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider block">Assigned Rider</span>
          <span className="text-xl font-black text-indigo-900 mt-1 block">{counts.assigned || 0}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-sky-200 bg-sky-50/40 shadow-xs">
          <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wider block">Out for Delivery</span>
          <span className="text-xl font-black text-sky-900 mt-1 block">{(counts.picked_up || 0) + (counts.out_for_delivery || 0)}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Delivered</span>
          <span className="text-xl font-black text-emerald-900 mt-1 block">{counts.delivered || 0}</span>
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {STATUS_TABS.map((tab) => {
          const isSel = statusFilter === tab.key;
          const tabCountKey = tab.key ? tab.key.toLowerCase() : 'all';
          const tabCount = counts[tabCountKey] !== undefined ? counts[tabCountKey] : null;

          return (
            <button
              key={tab.key}
              onClick={() => {
                setStatusFilter(tab.key);
                setPage(1);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isSel
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <span>{tab.label}</span>
              {tabCount !== null && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  isSel ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                }`}>
                  {tabCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search & Sort Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Order #, Customer Name, Phone, Email, Pincode..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 text-slate-900"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={paymentFilter}
            onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
          >
            <option value="">Payment: All</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="amount_desc">Amount (High to Low)</option>
            <option value="amount_asc">Amount (Low to High)</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-4">Order ID & Date</th>
                <th className="p-4">Customer Details</th>
                <th className="p-4">Packing Progress</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Order Status</th>
                <th className="p-4">Delivery Executive</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-xs text-slate-700">No orders found</p>
                    <p className="text-[11px] text-slate-400">Try adjusting your filters or search query.</p>
                  </td>
                </tr>
              ) : (
                orders.map((ord) => {
                  const ordId = ord.id || ord._id;
                  const itList = ord.items || [];
                  const pCount = itList.filter(it => it.packed).length;
                  const tCount = itList.length;
                  const isPacked = tCount > 0 && pCount === tCount;

                  return (
                    <tr key={ordId} className="hover:bg-slate-50/80 transition-colors">
                      {/* Order # & Date */}
                      <td className="p-4">
                        <Link
                          to={`/admin/orders/${ordId}`}
                          className="font-bold text-slate-900 font-mono text-xs hover:text-emerald-600 block"
                        >
                          #{ord.order_number}
                        </Link>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {new Date(ord.created_at).toLocaleDateString()} {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      {/* Customer Details */}
                      <td className="p-4">
                        <p className="font-bold text-slate-900">{ord.customer_name}</p>
                        <p className="text-[11px] text-slate-500">📞 {ord.customer_phone || ord.shipping_address?.phone || '-'}</p>
                        <p className="text-[10px] text-slate-400 truncate max-w-[140px]">{ord.city || ord.shipping_address?.city}, {ord.pincode || ord.shipping_address?.postal_code}</p>
                      </td>

                      {/* Packing Progress */}
                      <td className="p-4">
                        <div className="space-y-1 max-w-[120px]">
                          <div className="flex justify-between text-[10px] font-bold">
                            <span className={isPacked ? 'text-emerald-700' : 'text-slate-600'}>
                              {pCount}/{tCount} packed
                            </span>
                            <span className={isPacked ? 'text-emerald-700' : 'text-slate-400'}>
                              {tCount > 0 ? Math.round((pCount / tCount) * 100) : 0}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${isPacked ? 'bg-emerald-600' : 'bg-amber-500'}`}
                              style={{ width: `${tCount > 0 ? (pCount / tCount) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td className="p-4">
                        <span className="font-black text-slate-900 text-xs">₹{ord.total_amount}</span>
                        <span className="text-[10px] text-slate-400 block">{tCount} items</span>
                      </td>

                      {/* Payment */}
                      <td className="p-4">
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          ord.payment_status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {ord.payment_status}
                        </span>
                        <span className="text-[10px] text-slate-400 block uppercase font-mono mt-0.5">
                          {ord.payment_method}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="p-4">
                        <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${getStatusBadgeClass(ord.order_status)}`}>
                          {ord.order_status.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Delivery Executive */}
                      <td className="p-4">
                        {ord.delivery_partner ? (
                          <div className="text-xs">
                            <p className="font-bold text-slate-900 flex items-center gap-1">
                              🛵 {ord.delivery_partner.name}
                            </p>
                            <p className="text-[10px] text-slate-400">{ord.delivery_partner.phone}</p>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenAssignModal(ord)}
                            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors"
                          >
                            + Assign Rider
                          </button>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/admin/orders/${ordId}`}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-1 transition-colors"
                          >
                            <Box className="w-3.5 h-3.5" />
                            <span>View & Pack</span>
                          </Link>
                          <button
                            onClick={() => handleOpenStatusModal(ord)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
                            title="Update Status"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>
              Showing Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} total orders)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold disabled:opacity-40 flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              <button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold disabled:opacity-40 flex items-center gap-1"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* QUICK STATUS UPDATE MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 animate-fade-in shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Advance Order Logistics</h3>
                <p className="text-xs text-slate-500 font-mono">#{selectedOrder.order_number}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleStatusUpdate} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Advance Status:</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-800"
                >
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="PACKING">Preparing / Packing</option>
                  <option value="READY_FOR_PICKUP">Ready for Pickup</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="PICKED_UP">Picked Up</option>
                  <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Activity Note:</label>
                <input
                  type="text"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="e.g. Package dispatched from main hub"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  {updating ? 'Saving...' : 'Update Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK ASSIGN RIDER MODAL */}
      {assignOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-4 animate-fade-in shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Assign Delivery Partner</h3>
                <p className="text-xs text-slate-500 font-mono">Order #{assignOrder.order_number}</p>
              </div>
              <button onClick={() => setAssignOrder(null)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleAssignRiderSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-2">Select Delivery Partner:</label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {deliveryPartners.map((rider) => {
                    const isSelected = selectedRiderId === rider.id;
                    return (
                      <div
                        key={rider.id}
                        onClick={() => setSelectedRiderId(rider.id)}
                        className={`p-3.5 rounded-2xl border-2 cursor-pointer flex items-center justify-between transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                            🛵
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{rider.name}</p>
                            <p className="text-[11px] text-slate-500">📞 {rider.phone} • {rider.vehicle}</p>
                          </div>
                        </div>

                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          rider.active_deliveries === 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {rider.active_deliveries === 0 ? 'Available' : `${rider.active_deliveries} active`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssignOrder(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigningRider || !selectedRiderId}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-50"
                >
                  {assigningRider ? 'Assigning...' : 'Assign Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

