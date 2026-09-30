import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Plus, Trash2, CheckCircle2, Loader2 } from 'lucide-react';
import api from '../api/client';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import BackButton from '../components/common/BackButton';

const EMPTY_FORM = (user) => ({
  full_name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim(),
  phone: user?.phone || '',
  street_address: '',
  apartment: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'India',
  address_type: 'HOME',
  is_default: false,
});

export default function AddressesPage() {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState(EMPTY_FORM(user));

  // Pincode autofill state
  const [pincodeStatus, setPincodeStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [pincodeError, setPincodeError] = useState('');
  const [cityStateLocked, setCityStateLocked] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = () => {
    setLoading(true);
    api.get('/addresses/')
      .then(res => setAddresses(res.data?.addresses || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  // --- Pincode autofill ---
  const handlePincodeChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setFormData(prev => ({ ...prev, postal_code: val }));

    if (val.length < 6) {
      clearTimeout(debounceRef.current);
      setPincodeStatus('idle');
      setPincodeError('');
      if (cityStateLocked) {
        setCityStateLocked(false);
        setFormData(prev => ({ ...prev, city: '', state: '', postal_code: val }));
      }
      return;
    }

    // Full 6 digits — debounce by 500 ms
    clearTimeout(debounceRef.current);
    setPincodeStatus('loading');
    setPincodeError('');
    debounceRef.current = setTimeout(() => lookupPincode(val), 500);
  };

  const lookupPincode = async (pincode) => {
    try {
      const res = await api.get(`/address/pincode/${pincode}/`);
      const { city, state } = res.data;
      setFormData(prev => ({ ...prev, city, state, postal_code: pincode }));
      setCityStateLocked(true);
      setPincodeStatus('success');
      setPincodeError('');
    } catch (err) {
      const msg = err.response?.data?.error || 'Please enter a valid Indian Pincode.';
      setFormData(prev => ({ ...prev, city: '', state: '' }));
      setCityStateLocked(false);
      setPincodeStatus('error');
      setPincodeError(msg);
    }
  };

  const openModal = () => {
    setFormData(EMPTY_FORM(user));
    setPincodeStatus('idle');
    setPincodeError('');
    setCityStateLocked(false);
    setShowModal(true);
  };

  // --- Form validation ---
  const validateForm = () => {
    if (!formData.full_name.trim()) return 'Recipient Name is required.';
    if (!formData.phone.trim()) return 'Phone Number is required.';
    if (!/^\d{10}$/.test(formData.phone.trim())) return 'Phone Number must be 10 digits.';
    if (!formData.street_address.trim()) return 'Street Address is required.';
    if (!formData.city.trim()) return 'City is required. Please enter a valid Pincode to auto-fill.';
    if (!formData.state.trim()) return 'State is required. Please enter a valid Pincode to auto-fill.';
    if (!/^\d{6}$/.test(formData.postal_code)) return 'Pincode must be exactly 6 digits.';
    return null;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) { showToast(validationError, 'error'); return; }
    if (pincodeStatus === 'loading') { showToast('Please wait for Pincode verification to complete.', 'warning'); return; }

    try {
      await api.post('/addresses/', formData);
      showToast('Address added successfully!', 'success');
      fetchAddresses();
      setShowModal(false);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save address', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this saved address?')) return;
    try {
      await api.delete(`/addresses/${id}/`);
      showToast('Address removed', 'info');
      setAddresses(prev => prev.filter(a => (a.id || a._id) !== id));
    } catch (err) {
      showToast('Failed to delete address', 'error');
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton fallbackUrl="/profile" label="Back" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Saved Addresses</h1>
            <p className="text-xs text-slate-500 mt-0.5">Manage delivery addresses for quick doorstep checkout</p>
          </div>
        </div>
        <button
          onClick={openModal}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Address
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {addresses.map((addr) => {
          const addrId = addr.id || addr._id;
          return (
            <div
              key={addrId}
              className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">{addr.full_name}</span>
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded bg-slate-100 text-slate-700">
                    {addr.address_type}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {addr.street_address}, {addr.apartment && `${addr.apartment}, `}{addr.city}, {addr.state} - {addr.postal_code}
                </p>
                <p className="text-xs font-semibold text-slate-800">📞 {addr.phone}</p>
                {addr.is_default && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    <CheckCircle2 className="w-3 h-3" /> Default Delivery Address
                  </span>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => handleDelete(addrId)}
                  className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-4 animate-fade-in shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Add New Address</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number *</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    maxLength={10}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Street Address *</label>
                <input
                  type="text"
                  value={formData.street_address}
                  onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              {/* Pincode — enters first so City/State can be auto-filled */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Pincode *
                  {pincodeStatus === 'success' && (
                    <span className="ml-2 text-emerald-600 font-semibold">✓ Verified</span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formData.postal_code}
                    onChange={handlePincodeChange}
                    required
                    maxLength={6}
                    placeholder="6-digit Pincode"
                    className={`w-full bg-slate-50 border rounded-xl px-3 py-2 pr-8 ${
                      pincodeStatus === 'error'
                        ? 'border-rose-400'
                        : pincodeStatus === 'success'
                        ? 'border-emerald-400'
                        : 'border-slate-200'
                    }`}
                  />
                  {pincodeStatus === 'loading' && (
                    <Loader2 className="absolute right-2.5 top-2 w-4 h-4 text-slate-400 animate-spin" />
                  )}
                </div>
                {pincodeError && (
                  <p className="mt-1 text-[11px] text-rose-600 font-medium">{pincodeError}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    City *
                    {cityStateLocked && <span className="ml-1 text-slate-400 font-normal">(auto-filled)</span>}
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={cityStateLocked ? undefined : (e) => setFormData({ ...formData, city: e.target.value })}
                    readOnly={cityStateLocked}
                    required
                    placeholder={pincodeStatus === 'loading' ? 'Fetching…' : 'Enter valid Pincode'}
                    className={`w-full border rounded-xl px-3 py-2 ${
                      cityStateLocked
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900 cursor-not-allowed'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    State *
                    {cityStateLocked && <span className="ml-1 text-slate-400 font-normal">(auto-filled)</span>}
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={cityStateLocked ? undefined : (e) => setFormData({ ...formData, state: e.target.value })}
                    readOnly={cityStateLocked}
                    required
                    placeholder={pincodeStatus === 'loading' ? 'Fetching…' : 'Enter valid Pincode'}
                    className={`w-full border rounded-xl px-3 py-2 ${
                      cityStateLocked
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900 cursor-not-allowed'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pincodeStatus === 'loading'}
                  className="px-6 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-50"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
