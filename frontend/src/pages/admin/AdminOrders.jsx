import React, { useState, useEffect } from 'react';
import {
  Package, Truck, CheckCircle2, AlertCircle, Search,
  Filter, Eye, Clock, ArrowRight, ShieldCheck
} from 'lucide-react';
import api from '../../api/client';
import { useNotifications } from '../../context/NotificationContext';
import BackButton from '../../components/common/BackButton';

const STATUS_OPTIONS = [
  'PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'
];

export default function AdminOrders() {
  const { showToast } = useNotifications();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = () => {
    setLoading(true);
    const url = statusFilter ? `/admin/orders/?status=${statusFilter}` : '/admin/orders/';
    api.get(url)
      .then(res => setOrders(res.data?.orders || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
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
      const res = await api.post(`/admin/orders/${ordId}/status/`, {
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

  const filteredOrders = orders.filter(o =>
    o.order_number?.toLowerCase().includes(search.toLowerCase()) ||
    o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    o.customer_email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton fallbackUrl="/admin" label="Dashboard" />
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Order Fulfillment & Logistics</h1>
            <p className="text-xs text-slate-500">Track and advance simulated delivery status timelines</p>
          </div>
        </div>

        {/* Filter by status */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
          >
            <option value="">All Statuses ({orders.length})</option>
            {STATUS_OPTIONS.map(st => (
              <option key={st} value={st}>{st.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Search Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by Order #, Customer Name, or Email..."
          className="flex-1 bg-transparent border-0 text-xs focus:ring-0 text-slate-900 placeholder:text-slate-400"
        />
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-4">Order # & Date</th>
                <th className="p-4">Customer Details</th>
                <th className="p-4">Items</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Current Status</th>
                <th className="p-4 text-right">Update Logistics</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((ord) => {
                const ordId = ord.id || ord._id;
                return (
                  <tr key={ordId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <span className="font-bold text-slate-900 font-mono text-xs block">#{ord.order_number}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(ord.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-900">{ord.customer_name}</p>
                      <p className="text-[11px] text-slate-500">{ord.customer_email}</p>
                    </td>
                    <td className="p-4 font-semibold">{ord.items?.length || 0} medicines</td>
                    <td className="p-4 font-black text-slate-900">₹{ord.total_amount}</td>
                    <td className="p-4">
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                        {ord.order_status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleOpenStatusModal(ord)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-1"
                      >
                        Update Status
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Update Status Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-4 animate-fade-in shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Update Order Logistics Status</h3>
                <p className="text-xs text-slate-500 font-mono">#{selectedOrder.order_number}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleStatusUpdate} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Advance Order Status:</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-800 text-xs"
                >
                  {STATUS_OPTIONS.map(st => (
                    <option key={st} value={st}>{st.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Logistics Activity Note:</label>
                <input
                  type="text"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="e.g. Package dispatched via Bluedart AWB #998811"
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
                  {updating ? 'Saving...' : 'Update & Notify Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
