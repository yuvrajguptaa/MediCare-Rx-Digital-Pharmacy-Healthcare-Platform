import React, { useState, useEffect } from 'react';
import {
  FileText, CheckCircle2, XCircle, Clock, Eye, AlertCircle,
  ShieldCheck, MessageSquare, Filter
} from 'lucide-react';
import api from '../../api/client';
import { useNotifications } from '../../context/NotificationContext';
import BackButton from '../../components/common/BackButton';

export default function AdminPrescriptions() {
  const { showToast } = useNotifications();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  
  // Review Action Modal
  const [selectedRx, setSelectedRx] = useState(null);
  const [reviewAction, setReviewAction] = useState('APPROVED'); // 'APPROVED' | 'REJECTED'
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPrescriptions();
  }, [statusFilter]);

  const fetchPrescriptions = () => {
    setLoading(true);
    const url = statusFilter ? `/prescriptions/review/list/?status=${statusFilter}` : '/prescriptions/review/list/';
    api.get(url)
      .then(res => setPrescriptions(res.data?.prescriptions || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleOpenReview = (rx, action) => {
    setSelectedRx(rx);
    setReviewAction(action);
    setReviewNotes(
      action === 'APPROVED'
        ? 'Verified against doctor registry. Valid dosage and duration approved.'
        : 'Prescription is unclear / expired. Please upload an updated doctor prescription.'
    );
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRx) return;
    try {
      setSubmitting(true);
      const rxId = selectedRx.id || selectedRx._id;
      await api.post(`/prescriptions/${rxId}/review/`, {
        status: reviewAction,
        review_notes: reviewNotes
      });
      showToast(`Prescription ${reviewAction.toLowerCase()} successfully!`, 'success');
      setSelectedRx(null);
      fetchPrescriptions();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to submit review', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton fallbackUrl="/admin" label="Dashboard" />
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Pharmacist Prescription Review Queue</h1>
            <p className="text-xs text-slate-500">Verify patient prescriptions, doctors registration, and approve/reject dispensing</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
          >
            <option value="">All Statuses ({prescriptions.length})</option>
            <option value="PENDING">Pending Verification</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Prescription Queue List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-4">Patient & Upload Info</th>
                <th className="p-4">Doctor & Clinic</th>
                <th className="p-4">Document</th>
                <th className="p-4">Current Status</th>
                <th className="p-4">Reviewer Feedback</th>
                <th className="p-4 text-right">Verification Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {prescriptions.map((rx) => {
                const rxId = rx.id || rx._id;
                return (
                  <tr key={rxId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-slate-900">{rx.patient_name || 'Customer'}</p>
                      <p className="text-[11px] text-slate-400">{rx.user_email}</p>
                      <span className="text-[10px] text-slate-400">
                        {new Date(rx.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-slate-800">{rx.doctor_name || 'N/A'}</p>
                      {rx.notes && <p className="text-[11px] text-slate-500 italic mt-0.5">"{rx.notes}"</p>}
                    </td>
                    <td className="p-4">
                      <a
                        href={rx.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Rx File
                      </a>
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                        rx.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : rx.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {rx.status}
                      </span>
                    </td>
                    <td className="p-4 max-w-xs">
                      {rx.review_notes ? (
                        <p className="text-[11px] text-slate-600 line-clamp-2">{rx.review_notes}</p>
                      ) : (
                        <span className="text-slate-400 italic">No notes yet</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenReview(rx, 'APPROVED')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleOpenReview(rx, 'REJECTED')}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Confirmation Modal */}
      {selectedRx && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-4 animate-fade-in shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                {reviewAction === 'APPROVED' ? 'Approve Prescription' : 'Reject Prescription'}
              </h3>
              <button onClick={() => setSelectedRx(null)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-2xl space-y-1">
                <p><strong>Patient:</strong> {selectedRx.patient_name}</p>
                <p><strong>Doctor:</strong> {selectedRx.doctor_name || 'N/A'}</p>
                <a
                  href={selectedRx.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1 mt-1"
                >
                  <Eye className="w-3.5 h-3.5" /> Open Uploaded Document in New Tab
                </a>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5">
                  Pharmacist Verification Note (Sent to Customer) *
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedRx(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-6 py-2.5 text-white font-bold text-xs rounded-xl shadow-xs ${
                    reviewAction === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {submitting ? 'Submitting...' : `Confirm ${reviewAction}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
