import React, { useState, useEffect } from 'react';
import {
  Upload, FileText, CheckCircle2, XCircle, Clock, AlertTriangle,
  Plus, Eye, ShieldCheck, UserCheck, Trash2
} from 'lucide-react';
import api from '../api/client';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

import BackButton from '../components/common/BackButton';

export default function PrescriptionsPage() {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Form State
  const [file, setFile] = useState(null);
  const [patientName, setPatientName] = useState(`${user?.first_name || ''} ${user?.last_name || ''}`.trim());
  const [doctorName, setDoctorName] = useState('');
  const [notes, setNotes] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = () => {
    setLoading(true);
    api.get('/prescriptions/my/')
      .then(res => setPrescriptions(res.data?.prescriptions || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      showToast('Please select a prescription file (JPG, PNG, PDF).', 'warning');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('prescription_file', file);
      formData.append('patient_name', patientName);
      formData.append('doctor_name', doctorName);
      formData.append('notes', notes);

      const res = await api.post('/prescriptions/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      showToast('Prescription uploaded successfully! Under review.', 'success');
      setPrescriptions(prev => [res.data.prescription, ...prev]);
      setShowUploadModal(false);
      setFile(null);
      setDoctorName('');
      setNotes('');
    } catch (err) {
      showToast(err.response?.data?.error || 'Upload failed. Please try again.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
            <CheckCircle2 className="w-3.5 h-3.5" /> Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-200 uppercase">
            <XCircle className="w-3.5 h-3.5" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-200 uppercase">
            <Clock className="w-3.5 h-3.5" /> Under Review
          </span>
        );
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Navigation */}
      <div>
        <BackButton fallbackUrl="/" label="Back to Dashboard" />
      </div>

      {/* Header & Upload CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Prescription Vault</h1>
          <p className="text-xs text-slate-500 mt-1 max-w-md">
            Upload and manage doctor prescriptions for hassle-free refills and verified dispensing.
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2 shrink-0"
        >
          <Upload className="w-4 h-4" />
          Upload New Prescription
        </button>
      </div>

      {/* Trust & Process Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
            1
          </div>
          <h4 className="font-bold text-xs text-slate-900">Upload Valid Photo / PDF</h4>
          <p className="text-[11px] text-slate-500">Ensure patient name, doctor registration number, and date are clearly visible.</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
          <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs">
            2
          </div>
          <h4 className="font-bold text-xs text-slate-900">Pharmacist Verification</h4>
          <p className="text-[11px] text-slate-500">Our certified pharmacists review dosage instructions and approve within minutes.</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
          <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold text-xs">
            3
          </div>
          <h4 className="font-bold text-xs text-slate-900">Express Dispensing</h4>
          <p className="text-[11px] text-slate-500">Attach approved prescriptions during checkout for instant order confirmation.</p>
        </div>
      </div>

      {/* Prescriptions List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Uploaded Prescriptions ({prescriptions.length})</h2>

        {prescriptions.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Prescriptions Uploaded</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You haven't uploaded any doctor prescriptions yet. Upload one to order prescription-required medications.
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-6 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              Upload Your First Prescription
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {prescriptions.map((rx) => {
              const rxId = rx.id || rx._id;
              return (
                <div
                  key={rxId}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-6 space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm text-slate-900 truncate" title={rx.file_name}>
                            {rx.file_name}
                          </h3>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            Uploaded {new Date(rx.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {getStatusBadge(rx.status)}
                    </div>

                    <div className="space-y-1 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                      <p><strong>Patient:</strong> {rx.patient_name || 'N/A'}</p>
                      {rx.doctor_name && <p><strong>Doctor:</strong> {rx.doctor_name}</p>}
                      {rx.notes && <p><strong>Notes:</strong> {rx.notes}</p>}
                    </div>

                    {/* Pharmacist Review Feedback */}
                    {rx.review_notes && (
                      <div className={`p-3 rounded-2xl text-xs ${
                        rx.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-rose-50 text-rose-900 border border-rose-200'
                      }`}>
                        <span className="font-bold block">Pharmacist Note:</span>
                        <p className="mt-0.5">{rx.review_notes}</p>
                        {rx.reviewed_by && (
                          <span className="text-[10px] opacity-75 mt-1 block">Reviewed by: {rx.reviewed_by}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <a
                      href={rx.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Document
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 animate-fade-in shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Upload Doctor Prescription</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
              
              {/* File Dropzone */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">
                  Select Prescription File (JPG, PNG, PDF, max 10MB) *
                </label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => setFile(e.target.files[0])}
                  required
                  className="w-full text-slate-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 bg-slate-50 border border-slate-200 rounded-2xl p-2"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Patient Full Name *</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Doctor / Clinic Name (Optional)</label>
                <input
                  type="text"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="e.g. Dr. Vivek Mehra (MBBS)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Additional Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. 1-month regular refill for BP medicines"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-40"
                >
                  {uploading ? 'Uploading...' : 'Submit Prescription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
