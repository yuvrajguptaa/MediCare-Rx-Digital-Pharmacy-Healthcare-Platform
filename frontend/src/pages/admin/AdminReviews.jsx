import React, { useState, useEffect } from 'react';
import { Star, Trash2, CheckCircle2, MessageSquare, Check } from 'lucide-react';
import api from '../../api/client';
import { useNotifications } from '../../context/NotificationContext';
import BackButton from '../../components/common/BackButton';

export default function AdminReviews() {
  const { showToast } = useNotifications();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = () => {
    setLoading(true);
    api.get('/admin/reviews/')
      .then(res => setReviews(res.data?.reviews || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleToggleApproved = async (rev) => {
    try {
      const rId = rev.id || rev._id;
      await api.patch(`/admin/reviews/${rId}/`, {
        is_approved: !rev.is_approved
      });
      showToast('Review status updated.', 'info');
      fetchReviews();
    } catch (err) {
      showToast('Failed to update review status', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer review?')) return;
    try {
      await api.delete(`/admin/reviews/${id}/`);
      showToast('Review deleted.', 'info');
      fetchReviews();
    } catch (err) {
      showToast('Failed to delete review', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton fallbackUrl="/admin" label="Dashboard" />
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Customer Reviews Moderation</h1>
            <p className="text-xs text-slate-500">Review, moderate, and approve customer feedback on medicines</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="p-4">Medicine & Customer</th>
              <th className="p-4">Rating</th>
              <th className="p-4">Review Content</th>
              <th className="p-4">Verified</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reviews.map((r) => {
              const rId = r.id || r._id;
              return (
                <tr key={rId} className="hover:bg-slate-50/80">
                  <td className="p-4">
                    <p className="font-bold text-slate-900">{r.medicine_name || 'Medicine'}</p>
                    <p className="text-[11px] text-slate-500">by {r.user_name}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 font-bold text-amber-600">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{r.rating} / 5</span>
                    </div>
                  </td>
                  <td className="p-4 max-w-sm">
                    {r.headline && <p className="font-bold text-slate-800">{r.headline}</p>}
                    <p className="text-slate-600 text-[11px] line-clamp-2">{r.comment}</p>
                  </td>
                  <td className="p-4">
                    {r.is_verified_purchase ? (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                        Verified
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Standard</span>
                    )}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggleApproved(r)}
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full cursor-pointer ${
                        r.is_approved ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {r.is_approved ? 'Approved' : 'Hidden'}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDelete(rId)}
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
    </div>
  );
}
