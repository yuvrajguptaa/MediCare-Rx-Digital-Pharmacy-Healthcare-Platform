import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  MapPin, CreditCard, CheckCircle2, ShieldCheck, Plus,
  FileText, ArrowRight, ArrowLeft, Truck, AlertCircle, Sparkles, Check, Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../api/client';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import BackButton from '../components/common/BackButton';

export default function CheckoutPage() {
  const { cart, fetchCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1); // 1: Address, 2: Summary & Rx, 3: Payment

  // Addresses
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [showNewAddressModal, setShowNewAddressModal] = useState(false);
  const [newAddress, setNewAddress] = useState({
    full_name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim(),
    phone: user?.phone || '',
    street_address: '',
    apartment: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'India',
    address_type: 'HOME',
    is_default: true
  });

  // Pincode autofill state (for new address modal)
  const [pincodeStatus, setPincodeStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [pincodeError, setPincodeError] = useState('');
  const [cityStateLocked, setCityStateLocked] = useState(false);
  const debounceRef = useRef(null);

  // Prescriptions
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState('');
  const [uploadingRx, setUploadingRx] = useState(false);
  const [rxFile, setRxFile] = useState(null);
  const [rxNotes, setRxNotes] = useState('');

  // Payment
  const [paymentMethod, setPaymentMethod] = useState('RAZORPAY'); // 'RAZORPAY', 'COD', 'MOCK_CARD'
  const [customerNotes, setCustomerNotes] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);

  // Fetch addresses and prescriptions on mount
  useEffect(() => {
    api.get('/addresses/')
      .then((res) => {
        const list = res.data?.addresses || [];
        setAddresses(list);
        const def = list.find(a => a.is_default) || list[0];
        if (def) setSelectedAddressId(def.id || def._id);
      })
      .catch((err) => console.error(err));

    api.get('/prescriptions/my/')
      .then((res) => {
        const list = res.data?.prescriptions || [];
        setPrescriptions(list);
        const approved = list.find(p => p.status === 'APPROVED');
        if (approved) setSelectedPrescriptionId(approved.id || approved._id);
      })
      .catch((err) => console.error(err));
  }, []);

  // Save new address
  const handleSaveAddress = async (e) => {
    e.preventDefault();

    // Validate before saving
    const addr = newAddress;
    if (!addr.full_name.trim()) { showToast('Recipient Name is required.', 'error'); return; }
    if (!addr.phone.trim() || !/^\d{10}$/.test(addr.phone.trim())) { showToast('Phone Number must be exactly 10 digits.', 'error'); return; }
    if (!addr.street_address.trim()) { showToast('Street Address is required.', 'error'); return; }
    if (!addr.city.trim()) { showToast('City is required. Enter a valid Pincode to auto-fill.', 'error'); return; }
    if (!addr.state.trim()) { showToast('State is required. Enter a valid Pincode to auto-fill.', 'error'); return; }
    if (!/^\d{6}$/.test(addr.postal_code)) { showToast('Pincode must be exactly 6 digits.', 'error'); return; }
    if (pincodeStatus === 'loading') { showToast('Please wait for Pincode verification to complete.', 'warning'); return; }

    try {
      const res = await api.post('/addresses/', newAddress);
      showToast('Address saved successfully!', 'success');
      const saved = res.data.address;
      setAddresses(prev => [saved, ...prev]);
      setSelectedAddressId(saved.id || saved._id);
      setShowNewAddressModal(false);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save address', 'error');
    }
  };

  // --- Pincode autofill for checkout modal ---
  const handlePincodeChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setNewAddress(prev => ({ ...prev, postal_code: val }));

    if (val.length < 6) {
      clearTimeout(debounceRef.current);
      setPincodeStatus('idle');
      setPincodeError('');
      if (cityStateLocked) {
        setCityStateLocked(false);
        setNewAddress(prev => ({ ...prev, city: '', state: '', postal_code: val }));
      }
      return;
    }

    clearTimeout(debounceRef.current);
    setPincodeStatus('loading');
    setPincodeError('');
    debounceRef.current = setTimeout(() => lookupPincode(val), 500);
  };

  const lookupPincode = async (pincode) => {
    try {
      const res = await api.get(`/address/pincode/${pincode}/`);
      const { city, state } = res.data;
      setNewAddress(prev => ({ ...prev, city, state, postal_code: pincode }));
      setCityStateLocked(true);
      setPincodeStatus('success');
      setPincodeError('');
    } catch (err) {
      const msg = err.response?.data?.error || 'Please enter a valid Indian Pincode.';
      setNewAddress(prev => ({ ...prev, city: '', state: '' }));
      setCityStateLocked(false);
      setPincodeStatus('error');
      setPincodeError(msg);
    }
  };

  const openNewAddressModal = () => {
    setNewAddress({
      full_name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim(),
      phone: user?.phone || '',
      street_address: '',
      apartment: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'India',
      address_type: 'HOME',
      is_default: true
    });
    setPincodeStatus('idle');
    setPincodeError('');
    setCityStateLocked(false);
    setShowNewAddressModal(true);
  };


  // Quick Prescription Upload inside checkout
  const handleQuickUploadRx = async (e) => {
    e.preventDefault();
    if (!rxFile) {
      showToast('Please select a prescription file.', 'warning');
      return;
    }
    try {
      setUploadingRx(true);
      const formData = new FormData();
      formData.append('prescription_file', rxFile);
      formData.append('notes', rxNotes);
      formData.append('patient_name', `${user?.first_name} ${user?.last_name}`);

      const res = await api.post('/prescriptions/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showToast('Prescription uploaded & linked to order!', 'success');
      const newRx = res.data.prescription;
      setPrescriptions(prev => [newRx, ...prev]);
      setSelectedPrescriptionId(newRx.id || newRx._id);
      setRxFile(null);
    } catch (err) {
      showToast(err.response?.data?.error || 'Upload failed', 'error');
    } finally {
      setUploadingRx(false);
    }
  };

  // Helper to load Razorpay SDK dynamically
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Submit Final Order to Backend
  const submitFinalOrder = async (extraPaymentData = {}) => {
    try {
      setPlacingOrder(true);
      const payload = {
        address_id: selectedAddressId,
        payment_method: paymentMethod,
        prescription_id: selectedPrescriptionId || null,
        coupon_code: cart.applied_coupon?.code || '',
        customer_notes: customerNotes || '',
        ...extraPaymentData
      };

      const res = await api.post('/orders/', payload);
      const order = res.data.order;

      // Celebrate with confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Refresh cart context (cart is now empty on backend)
      await fetchCart();

      // Navigate to order success
      navigate('/order-success', { state: { order } });
    } catch (err) {
      const errMsg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        err.response?.data?.message ||
        (typeof err.response?.data === 'string' && err.response?.data.length < 200 ? err.response?.data : null) ||
        err.message ||
        'Failed to place order. Please try again.';
      showToast(errMsg, 'error');
    } finally {
      setPlacingOrder(false);
    }
  };

  // Place Order Action
  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      showToast('Please select or add a delivery address.', 'warning');
      setCurrentStep(1);
      return;
    }

    if (cart.requires_prescription && !selectedPrescriptionId) {
      showToast('Please select or upload a valid prescription for this order.', 'warning');
      setCurrentStep(2);
      return;
    }

    // If Razorpay selected, initialize Razorpay order & open popup
    if (paymentMethod === 'RAZORPAY') {
      try {
        setPlacingOrder(true);
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          showToast('Failed to load Razorpay payment gateway. Proceeding with instant confirmation.', 'warning');
          await submitFinalOrder();
          return;
        }

        // Call backend to create Razorpay Order
        const orderRes = await api.post('/orders/razorpay/create-order/', {
          coupon_code: cart.applied_coupon?.code || ''
        });

        const selectedAddr = addresses.find(a => (a.id || a._id) === selectedAddressId);
        const rzpKey = orderRes.data.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_RrD9fB8nXJ3BVC';

        const options = {
          key: rzpKey,
          amount: orderRes.data.amount,
          currency: orderRes.data.currency || 'INR',
          name: 'MediCare Pharmacy',
          description: `Medicines & Healthcare Order (${cart.item_count} items)`,
          order_id: orderRes.data.razorpay_order_id,
          handler: async function (response) {
            await submitFinalOrder({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            });
          },
          prefill: {
            name: selectedAddr?.full_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Valued Customer',
            email: user?.email || '',
            contact: selectedAddr?.phone || user?.phone || '9999999999'
          },
          notes: {
            address: selectedAddr ? `${selectedAddr.street_address}, ${selectedAddr.city}` : ''
          },
          theme: {
            color: '#059669' // MediCare Emerald Green
          },
          modal: {
            ondismiss: function () {
              setPlacingOrder(false);
              showToast('Payment cancelled. You can retry whenever you are ready.', 'info');
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp) {
          showToast(resp.error?.description || 'Payment failed. Please try again.', 'error');
          setPlacingOrder(false);
        });
        rzp.open();
      } catch (err) {
        console.error('Razorpay initialization error:', err);
        // Fallback to direct placement if network issues connecting to Razorpay
        await submitFinalOrder();
      }
      return;
    }

    // For COD and MOCK_CARD
    await submitFinalOrder();
  };

  if (cart.items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Your cart is empty</h2>
        <Link to="/medicines" className="inline-block px-6 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl">
          Browse Medicines
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Header with Back Button */}
      <div className="flex items-center justify-between">
        <BackButton fallbackUrl="/cart" label="Back to Cart" />
        <div className="text-right">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Step {currentStep} of 3</span>
          <p className="text-xs font-bold text-slate-700">
            {currentStep === 1 ? 'Delivery Address' : currentStep === 2 ? 'Order & Prescription' : 'Payment & Confirmation'}
          </p>
        </div>
      </div>

      {/* Stepper Progress Header */}
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-0.5 bg-slate-200 z-0" />
          
          {/* Step 1 */}
          <div className="relative z-10 flex flex-col items-center">
            <button
              onClick={() => setCurrentStep(1)}
              className={`w-10 h-10 rounded-full font-bold text-xs flex items-center justify-center transition-all ${
                currentStep >= 1 ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-200 text-slate-500'
              }`}
            >
              1
            </button>
            <span className="text-[11px] font-bold text-slate-700 mt-2">Delivery Address</span>
          </div>

          {/* Step 2 */}
          <div className="relative z-10 flex flex-col items-center">
            <button
              onClick={() => {
                if (!selectedAddressId) {
                  showToast('Please select or add a delivery address first.', 'warning');
                  return;
                }
                setCurrentStep(2);
              }}
              className={`w-10 h-10 rounded-full font-bold text-xs flex items-center justify-center transition-all ${
                currentStep >= 2 ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-200 text-slate-500'
              }`}
            >
              2
            </button>
            <span className="text-[11px] font-bold text-slate-700 mt-2">Order & Prescription</span>
          </div>

          {/* Step 3 */}
          <div className="relative z-10 flex flex-col items-center">
            <button
              onClick={() => {
                if (!selectedAddressId) {
                  showToast('Please select a delivery address first.', 'warning');
                  return;
                }
                if (cart.requires_prescription && !selectedPrescriptionId) {
                  showToast('Please select or upload a valid prescription before payment.', 'warning');
                  return;
                }
                setCurrentStep(3);
              }}
              className={`w-10 h-10 rounded-full font-bold text-xs flex items-center justify-center transition-all ${
                currentStep >= 3 ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-200 text-slate-500'
              }`}
            >
              3
            </button>
            <span className="text-[11px] font-bold text-slate-700 mt-2">Payment</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Step Form on Left, Sticky Summary on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Step Card Container */}
        <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
          
          {/* STEP 1: ADDRESS */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Select Delivery Address</h2>
                  <p className="text-xs text-slate-500">Where should we deliver your order?</p>
                </div>
                <button
                  onClick={openNewAddressModal}
                  className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs hover:bg-emerald-100 flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add New Address
                </button>
              </div>

              {/* Saved Addresses List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map((addr) => {
                  const isSelected = (addr.id || addr._id) === selectedAddressId;
                  return (
                    <div
                      key={addr.id || addr._id}
                      onClick={() => setSelectedAddressId(addr.id || addr._id)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black text-slate-900">{addr.full_name}</span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {addr.address_type || 'HOME'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {addr.street_address}, {addr.apartment && `${addr.apartment}, `}{addr.city}, {addr.state} - {addr.postal_code}
                      </p>
                      <p className="text-xs font-semibold text-slate-700 mt-2">📞 {addr.phone}</p>
                    </div>
                  );
                })}
              </div>

              {addresses.length === 0 && (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-3">
                  <p className="text-xs text-slate-500">No saved addresses found. Please add your shipping address.</p>
                  <button
                    onClick={openNewAddressModal}
                    className="px-5 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    + Add New Address
                  </button>
                </div>
              )}

              {/* Step 1 Navigation Buttons */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={true}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 text-slate-400 font-bold text-xs flex items-center justify-center gap-1.5 cursor-not-allowed opacity-50"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Previous Step
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedAddressId) {
                      showToast('Please select or add a delivery address to proceed.', 'warning');
                      return;
                    }
                    setCurrentStep(2);
                  }}
                  disabled={!selectedAddressId}
                  className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  <span>Next: Order Review</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: ORDER REVIEW & PRESCRIPTION */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl font-bold text-slate-900">Review Items & Prescription</h2>
                <p className="text-xs text-slate-500">Verify your cart contents and attach doctor prescription if needed</p>
              </div>

              {/* Items Preview */}
              <div className="divide-y divide-slate-100 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                {cart.items.map((item) => (
                  <div key={item.medicine_id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-800">{item.quantity}x</span>
                      <div>
                        <p className="font-bold text-slate-900">{item.name}</p>
                        <p className="text-[11px] text-slate-500">{item.generic_name}</p>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900">₹{item.item_total_selling}</span>
                  </div>
                ))}
              </div>

              {/* Prescription Attachment Section */}
              {cart.requires_prescription ? (
                <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-4">
                  <div className="flex items-center gap-2 text-amber-950 font-bold text-sm">
                    <FileText className="w-4 h-4 text-amber-600" />
                    <span>Prescription Verification Required for this Order</span>
                  </div>

                  {/* Select from uploaded */}
                  {prescriptions.length > 0 && (
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-2">
                        Select from your uploaded prescriptions:
                      </label>
                      <div className="space-y-2">
                        {prescriptions.map((rx) => {
                          const isSel = (rx.id || rx._id) === selectedPrescriptionId;
                          return (
                            <div
                              key={rx.id || rx._id}
                              onClick={() => setSelectedPrescriptionId(rx.id || rx._id)}
                              className={`p-3 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                                isSel ? 'border-emerald-600 bg-white shadow-xs' : 'border-slate-200 bg-white/50'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-slate-500" />
                                <div>
                                  <p className="text-xs font-bold text-slate-900">{rx.file_name}</p>
                                  <p className="text-[10px] text-slate-500">{rx.doctor_name || 'Doctor Prescription'}</p>
                                </div>
                              </div>
                              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                                rx.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {rx.status}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Quick Upload dropzone */}
                  <div className="pt-2 border-t border-amber-200/70">
                    <label className="text-xs font-bold text-slate-800 block mb-1.5">
                      Or Upload a New Doctor Prescription:
                    </label>
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={(e) => setRxFile(e.target.files[0])}
                        className="text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700"
                      />
                      <button
                        onClick={handleQuickUploadRx}
                        disabled={!rxFile || uploadingRx}
                        className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 disabled:opacity-40"
                      >
                        {uploadingRx ? 'Uploading...' : 'Upload & Attach'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>All items in this order are OTC and do not require a prescription.</span>
                </div>
              )}

              {/* Special Delivery Notes */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Delivery Instructions (Optional)
                </label>
                <input
                  type="text"
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="e.g. Ring bell twice, leave with security guard..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Step 2 Navigation Buttons */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Previous: Delivery Address
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (cart.requires_prescription && !selectedPrescriptionId) {
                      showToast('Please select or upload a valid doctor prescription before proceeding.', 'warning');
                      return;
                    }
                    setCurrentStep(3);
                  }}
                  disabled={cart.requires_prescription && !selectedPrescriptionId}
                  className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  <span>Next: Payment Method</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PAYMENT */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl font-bold text-slate-900">Select Payment Method</h2>
                <p className="text-xs text-slate-500">Choose how you want to pay for this order</p>
              </div>

              <div className="space-y-3">
                {/* Razorpay Online Payment */}
                <label
                  onClick={() => setPaymentMethod('RAZORPAY')}
                  className={`p-4 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                    paymentMethod === 'RAZORPAY'
                      ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                      UPI
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900">Online Payment / UPI / NetBanking</p>
                      <p className="text-[11px] text-slate-500">Instant verification via Razorpay / Cards</p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'RAZORPAY'}
                    onChange={() => setPaymentMethod('RAZORPAY')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                </label>

                {/* Mock Card Payment */}
                <label
                  onClick={() => setPaymentMethod('MOCK_CARD')}
                  className={`p-4 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                    paymentMethod === 'MOCK_CARD'
                      ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900">Credit / Debit Card (Instant Test Mode)</p>
                      <p className="text-[11px] text-slate-500">Instant test card payment simulation</p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'MOCK_CARD'}
                    onChange={() => setPaymentMethod('MOCK_CARD')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                </label>

                {/* Cash on Delivery (COD) */}
                <label
                  onClick={() => setPaymentMethod('COD')}
                  className={`p-4 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                    paymentMethod === 'COD'
                      ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xs">
                      COD
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900">Cash on Delivery</p>
                      <p className="text-[11px] text-slate-500">Pay cash or scan QR upon physical delivery</p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                </label>
              </div>

              {/* Step 3 Navigation Buttons */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Previous: Order Review
                </button>
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={placingOrder}
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{placingOrder ? 'Confirming Order...' : `Pay & Place Order (₹${cart.final_total})`}</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Right: Sticky Summary Box */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4 sticky top-28">
          <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3">
            Payment Breakdown
          </h3>

          <div className="space-y-2.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Items Total ({cart.item_count})</span>
              <span>₹{cart.subtotal_selling}</span>
            </div>
            {cart.coupon_discount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Coupon ({cart.applied_coupon?.code})</span>
                <span>-₹{cart.coupon_discount}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Express Delivery</span>
              <span>{cart.delivery_fee === 0 ? <strong className="text-emerald-600">FREE</strong> : `₹${cart.delivery_fee}`}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-between items-baseline">
            <span className="font-bold text-xs text-slate-900">Total Payable</span>
            <span className="text-2xl font-black text-slate-900">₹{cart.final_total}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 space-y-1">
            <p className="flex items-center gap-1 font-semibold text-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Verified Digital Dispensing
            </p>
            <p>Our licensed pharmacists pack every item under strict hygienic protocols.</p>
          </div>
        </div>

      </div>

      {/* New Address Modal */}
      {showNewAddressModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-4 animate-fade-in shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Add New Shipping Address</h3>
              <button
                onClick={() => setShowNewAddressModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Recipient Name *</label>
                  <input
                    type="text"
                    value={newAddress.full_name}
                    onChange={(e) => setNewAddress({ ...newAddress, full_name: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number *</label>
                  <input
                    type="text"
                    value={newAddress.phone}
                    onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                    required
                    maxLength={10}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Street Address / House No *</label>
                <input
                  type="text"
                  value={newAddress.street_address}
                  onChange={(e) => setNewAddress({ ...newAddress, street_address: e.target.value })}
                  placeholder="House/Flat No, Building, Street"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              {/* Pincode — enters first, triggers auto-fill of City & State */}
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
                    value={newAddress.postal_code}
                    onChange={handlePincodeChange}
                    required
                    maxLength={6}
                    placeholder="6-digit Indian Pincode"
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
                    value={newAddress.city}
                    onChange={cityStateLocked ? undefined : (e) => setNewAddress({ ...newAddress, city: e.target.value })}
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
                    value={newAddress.state}
                    onChange={cityStateLocked ? undefined : (e) => setNewAddress({ ...newAddress, state: e.target.value })}
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

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewAddressModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pincodeStatus === 'loading'}
                  className="px-6 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-50"
                >
                  Save & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
