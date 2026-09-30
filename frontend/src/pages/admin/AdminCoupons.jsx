import React, { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import api from '../../api/client';
import { useNotifications } from '../../context/NotificationContext';
import BackButton from '../../components/common/BackButton';

export default function AdminCoupons() {
  const { showToast } = useNotifications();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    discount_percentage: 15,
    min_order_amount: 500,
    max_discount_amount: 200,
    expiry_date: '2028-12-31',
    is_active: true
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = () => {
    setLoading(true);
    api.get('/admin/coupons/')
      .then(res => setCoupons(res.data?.coupons || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/coupons/', formData);
      showToast('Coupon created successfully!', 'success');
      setShowModal(false);
      setFormData({
        code: '',
        discount_percentage: 15,
        min_order_amount: 500,
        max_discount_amount: 200,
        expiry_date: '2028-12-31',
        is_active: true
      });
      fetchCoupons();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to create coupon', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await api.delete(`/admin/coupons/${id}/`);
      showToast('Coupon deleted.', 'info');
      fetchCoupons();
    } catch (err) {
      showToast('Failed to delete coupon', 'error');
    }
  };

  const handleToggle = async (coupon) => {
    try {
      const coupId = coupon.id || coupon._id;
      await api.put(`/admin/coupons/${coupId}/`, {
        is_active: !coupon.is_active
      });
      showToast(`Coupon status toggled.`, 'info');
      fetchCoupons();
    } catch (err) {
      showToast('Failed to update coupon status', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton fallbackUrl="/admin" label="Dashboard" />
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Promotional Coupons</h1>
            <p className="text-xs text-slate-500">Manage discount codes and cart thresholds</p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" /> Create Coupon
        </button>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="p-4">Coupon Code</th>
              <th className="p-4">Discount</th>
              <th className="p-4">Min Order</th>
              <th className="p-4">Max Discount</th>
              <th className="p-4">Expiry Date</th>
              <th className="p-4">Usage</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {coupons.map((c) => {
              const cId = c.id || c._id;
              return (
                <tr key={cId} className="hover:bg-slate-50/80">
                  <td className="p-4 font-black font-mono text-emerald-800 text-xs">{c.code}</td>
                  <td className="p-4 font-bold">{c.discount_percentage}% OFF</td>
                  <td className="p-4">₹{c.min_order_amount}</td>
                  <td className="p-4">₹{c.max_discount_amount}</td>
                  <td className="p-4 font-mono">{c.expiry_date}</td>
                  <td className="p-4">{c.usage_count || 0} times</td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggle(c)}
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full cursor-pointer ${
                        c.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {c.is_active ? 'Active' : 'Disabled'}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDelete(cId)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 animate-fade-in shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Create New Coupon</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Coupon Code *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. HEALTH25"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Discount % *</label>
                  <input
                    type="number"
                    value={formData.discount_percentage}
                    onChange={(e) => setFormData({ ...formData, discount_percentage: parseFloat(e.target.value) || 0 })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Min Order (₹)</label>
                  <input
                    type="number"
                    value={formData.min_order_amount}
                    onChange={(e) => setFormData({ ...formData, min_order_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Max Cap (₹)</label>
                  <input
                    type="number"
                    value={formData.max_discount_amount}
                    onChange={(e) => setFormData({ ...formData, max_discount_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Create Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
