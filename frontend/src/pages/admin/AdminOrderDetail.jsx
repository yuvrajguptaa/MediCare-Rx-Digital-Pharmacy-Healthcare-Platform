import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Package, Truck, CheckCircle2, Clock, AlertCircle, Printer,
  FileText, ShieldCheck, MapPin, Phone, Mail, User, CreditCard,
  ArrowLeft, Check, RotateCcw, Box, CheckSquare, Square,
  Send, UserCheck, AlertTriangle, ChevronRight, ExternalLink
} from 'lucide-react';
import api from '../../api/client';
import { useNotifications } from '../../context/NotificationContext';
import BackButton from '../../components/common/BackButton';

const TIMELINE_STEPS = [
  { key: 'PLACED', label: 'Order Placed', desc: 'Received & logged' },
  { key: 'CONFIRMED', label: 'Confirmed', desc: 'Verified & authorized' },
  { key: 'PACKING', label: 'Preparing / Packing', desc: 'Store staff packing items' },
  { key: 'READY_FOR_PICKUP', label: 'Ready for Pickup', desc: 'Sealed in pharmacy package' },
  { key: 'ASSIGNED', label: 'Assigned', desc: 'Assigned to delivery rider' },
  { key: 'PICKED_UP', label: 'Picked Up', desc: 'Rider collected package' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'Rider on the way' },
  { key: 'DELIVERED', label: 'Delivered', desc: 'Delivered to recipient' }
];

export default function AdminOrderDetail() {
  const { id } = useParams();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Packing workflow states
  const [updatingItemIndex, setUpdatingItemIndex] = useState(null);
  const [showReadyModal, setShowReadyModal] = useState(false);
  const [markingReady, setMarkingReady] = useState(false);

  // Delivery Partner states
  const [deliveryPartners, setDeliveryPartners] = useState([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigning, setAssigning] = useState(false);

  // Status update states
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [manualStatus, setManualStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Print mode ('invoice' or 'packingslip')
  const [printMode, setPrintMode] = useState('invoice');

  useEffect(() => {
    fetchOrder();
    fetchDeliveryPartners();
  }, [id]);

  const fetchOrder = () => {
    setLoading(true);
    api.get(`/admin/orders/${id}/`)
      .then(res => {
        setOrder(res.data?.order);
        setManualStatus(res.data?.order?.order_status || 'CONFIRMED');
      })
      .catch(err => {
        console.error(err);
        showToast('Failed to load order details', 'error');
      })
      .finally(() => setLoading(false));
  };

  const fetchDeliveryPartners = () => {
    api.get('/admin/delivery-partners/')
      .then(res => setDeliveryPartners(res.data?.delivery_partners || []))
      .catch(err => console.error(err));
  };

  // Toggle item packed in checklist
  const handleTogglePacked = async (idx, currentVal) => {
    try {
      setUpdatingItemIndex(idx);
      const res = await api.post(`/admin/orders/${id}/packing/`, {
        item_index: idx,
        packed: !currentVal
      });
      setOrder(res.data.order);
      showToast(res.data.message || 'Packing status updated', 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update item packing', 'error');
    } finally {
      setUpdatingItemIndex(null);
    }
  };

  // Mark order as Ready for Pickup
  const handleConfirmReadyForPickup = async () => {
    try {
      setMarkingReady(true);
      const res = await api.post(`/admin/orders/${id}/mark-ready/`, { force: true });
      setOrder(res.data.order);
      setShowReadyModal(false);
      showToast('Order marked as Ready for Pickup! Package sealed.', 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to mark order ready', 'error');
    } finally {
      setMarkingReady(false);
    }
  };

  // Assign delivery partner
  const handleAssignDeliveryPartner = async (e) => {
    e.preventDefault();
    if (!selectedPartnerId) {
      showToast('Please select a delivery partner.', 'warning');
      return;
    }
    try {
      setAssigning(true);
      const res = await api.post(`/admin/orders/${id}/assign-delivery/`, {
        delivery_partner_id: selectedPartnerId
      });
      setOrder(res.data.order);
      setShowAssignModal(false);
      showToast(res.data.message || 'Delivery partner assigned successfully!', 'success');
      fetchDeliveryPartners();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to assign delivery partner', 'error');
    } finally {
      setAssigning(false);
    }
  };

  // Manual status update
  const handleManualStatusUpdate = async (e) => {
    e.preventDefault();
    try {
      setUpdatingStatus(true);
      const res = await api.post(`/admin/orders/${id}/status/`, {
        order_status: manualStatus,
        note: statusNote || `Status updated to ${manualStatus}`
      });
      setOrder(res.data.order);
      setShowStatusModal(false);
      showToast(`Order status updated to ${manualStatus}!`, 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update status', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePrint = (mode) => {
    setPrintMode(mode);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <BackButton fallbackUrl="/admin/orders" label="Back to Orders" />
        <h2 className="text-xl font-bold text-slate-900 mt-4">Order Not Found</h2>
        <Link to="/admin/orders" className="inline-block px-6 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl">
          Back to Orders List
        </Link>
      </div>
    );
  }

  const items = order.items || [];
  const packedCount = items.filter(it => it.packed).length;
  const totalItemsCount = items.length;
  const packingProgressPercent = totalItemsCount > 0 ? Math.round((packedCount / totalItemsCount) * 100) : 0;
  const allPacked = totalItemsCount > 0 && packedCount === totalItemsCount;

  // Step index
  let stepIndex = TIMELINE_STEPS.findIndex(s => s.key === order.order_status);
  if (stepIndex === -1) {
    if (order.order_status === 'PREPARING') stepIndex = 2;
    else if (order.order_status === 'SHIPPED') stepIndex = 5;
    else stepIndex = 1;
  }

  return (
    <div className="space-y-8 animate-fade-in print:p-0">
      
      {/* Printable Area - Hide on Normal Screen */}
      <div className="hidden print:block text-slate-900 font-sans p-6 text-xs">
        {printMode === 'packingslip' ? (
          /* PACKING SLIP PRINT TEMPLATE */
          <div className="space-y-6">
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
              <div>
                <h1 className="text-2xl font-black tracking-tight uppercase">MediCare Pharmacy</h1>
                <p className="text-xs text-slate-600 font-bold uppercase tracking-wider">Store Dispatch & Packing Slip</p>
                <p className="text-[11px] text-slate-500">Licensed Digital Pharmacy Store #MH-99401</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-black font-mono">#{order.order_number}</span>
                <p className="text-[11px] text-slate-500">Date: {new Date(order.created_at).toLocaleString()}</p>
                <p className="text-xs font-bold text-slate-800">Status: {order.order_status}</p>
              </div>
            </div>

            {/* Recipient & Shipping info */}
            <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 border border-slate-300 rounded-lg">
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-1">Deliver To:</h3>
                <p className="font-bold text-sm text-slate-900">{order.customer_name}</p>
                <p>{order.shipping_address?.street_address}</p>
                <p>{order.shipping_address?.city}, {order.shipping_address?.state} - {order.shipping_address?.postal_code}</p>
                <p className="font-bold mt-1">📞 {order.customer_phone}</p>
              </div>
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-1">Dispatch Details:</h3>
                <p>Payment Mode: <strong className="uppercase">{order.payment_method}</strong> ({order.payment_status})</p>
                <p>Total Items: <strong>{totalItemsCount} Medicines</strong></p>
                {order.delivery_partner && (
                  <p>Assigned Rider: <strong>{order.delivery_partner.name} ({order.delivery_partner.phone})</strong></p>
                )}
                {order.customer_notes && (
                  <p className="mt-1 text-slate-600">Instructions: <em>{order.customer_notes}</em></p>
                )}
              </div>
            </div>

            {/* Packing Checklist Table */}
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider text-slate-900 mb-2">
                Medicines Packing Checklist
              </h3>
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-200 border-b border-slate-400 text-left">
                    <th className="p-2 border">Pack [✓]</th>
                    <th className="p-2 border">Medicine Name & Generic Salt</th>
                    <th className="p-2 border text-center">Brand</th>
                    <th className="p-2 border text-center">Qty</th>
                    <th className="p-2 border text-center">Rx Required</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <tr key={idx} className="border-b border-slate-300">
                      <td className="p-2 border text-center font-bold text-sm">
                        {it.packed ? '☑ PACKED' : '☐ [   ]'}
                      </td>
                      <td className="p-2 border">
                        <span className="font-bold text-slate-900 block">{it.name}</span>
                        <span className="text-[11px] text-slate-500">{it.generic_name}</span>
                      </td>
                      <td className="p-2 border text-center">{it.brand || '-'}</td>
                      <td className="p-2 border text-center font-bold text-base">{it.quantity}</td>
                      <td className="p-2 border text-center font-bold">
                        {it.prescription_required ? 'YES (Rx)' : 'OTC'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-6 border-t border-slate-400 flex justify-between items-end text-xs">
              <div>
                <p>Packed By: __________________________</p>
                <p className="text-[10px] text-slate-500 mt-1">Pharmacist Verification Stamp & Signature</p>
              </div>
              <div>
                <p>Rider Signature: __________________________</p>
                <p className="text-[10px] text-slate-500 mt-1">Package handover signature</p>
              </div>
            </div>
          </div>
        ) : (
          /* TAX INVOICE PRINT TEMPLATE */
          <div className="space-y-6">
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
              <div>
                <h1 className="text-2xl font-black tracking-tight uppercase">MediCare Pharmacy Ltd.</h1>
                <p className="text-xs text-slate-600 font-bold uppercase tracking-wider">Tax Invoice / Retail Bill</p>
                <p className="text-[11px] text-slate-500">GSTIN: 27AABCM8899K1Z4 • Drug License: DL-20B-11228</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-black font-mono">#{order.order_number}</span>
                <p className="text-[11px] text-slate-500">Invoice Date: {new Date(order.created_at).toLocaleDateString()}</p>
                <p className="text-xs font-bold text-slate-800 uppercase">Payment: {order.payment_method} ({order.payment_status})</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-300">
              <div>
                <h4 className="font-bold text-slate-500 text-[11px] uppercase">Customer / Patient:</h4>
                <p className="font-bold text-sm text-slate-900">{order.customer_name}</p>
                <p>{order.shipping_address?.street_address}</p>
                <p>{order.shipping_address?.city}, {order.shipping_address?.state} - {order.shipping_address?.postal_code}</p>
                <p className="font-bold mt-1">Phone: {order.customer_phone}</p>
                <p className="text-slate-500">Email: {order.customer_email}</p>
              </div>
              <div>
                <h4 className="font-bold text-slate-500 text-[11px] uppercase">Order Details:</h4>
                <p>Order ID: <strong>{order.order_number}</strong></p>
                <p>Payment Method: <strong className="uppercase">{order.payment_method}</strong></p>
                <p>Payment Status: <strong className="uppercase text-emerald-800">{order.payment_status}</strong></p>
                {order.payment_details?.transaction_id && (
                  <p className="font-mono text-[11px] text-slate-600">Txn ID: {order.payment_details.transaction_id}</p>
                )}
              </div>
            </div>

            {/* Invoice Line Items */}
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-200 border-b border-slate-400 text-left">
                  <th className="p-2 border">#</th>
                  <th className="p-2 border">Item Description</th>
                  <th className="p-2 border text-center">Qty</th>
                  <th className="p-2 border text-right">MRP (₹)</th>
                  <th className="p-2 border text-right">Price (₹)</th>
                  <th className="p-2 border text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={idx} className="border-b border-slate-300">
                    <td className="p-2 border text-center">{idx + 1}</td>
                    <td className="p-2 border">
                      <span className="font-bold text-slate-900 block">{it.name}</span>
                      <span className="text-[10px] text-slate-500">{it.generic_name} • {it.brand}</span>
                    </td>
                    <td className="p-2 border text-center font-bold">{it.quantity}</td>
                    <td className="p-2 border text-right text-slate-500 line-through">₹{it.mrp}</td>
                    <td className="p-2 border text-right font-bold">₹{it.selling_price}</td>
                    <td className="p-2 border text-right font-black">₹{it.item_total_selling}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Total summary */}
            <div className="flex justify-end">
              <div className="w-72 space-y-1.5 text-xs text-slate-700 bg-slate-50 p-4 border border-slate-300 rounded-lg">
                <div className="flex justify-between">
                  <span>Subtotal MRP:</span>
                  <span>₹{order.subtotal_mrp}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>MRP Savings:</span>
                  <span>-₹{order.mrp_savings}</span>
                </div>
                {order.coupon_discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Coupon ({order.coupon_code}):</span>
                    <span>-₹{order.coupon_discount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery Charge:</span>
                  <span>{order.delivery_fee === 0 ? 'FREE' : `₹${order.delivery_fee}`}</span>
                </div>
                <div className="flex justify-between border-t border-slate-400 pt-2 text-base font-black text-slate-900">
                  <span>Total Amount:</span>
                  <span>₹{order.total_amount}</span>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 text-center pt-4 border-t border-slate-300">
              This is a computer-generated tax invoice and requires no physical signature under Indian IT Act 2000.
            </p>
          </div>
        )}
      </div>

      {/* Screen View */}
      <div className="print:hidden space-y-6">
        
        {/* Top Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BackButton fallbackUrl="/admin/orders" label="Back to Orders List" />
            <div>
              <span className="text-[11px] font-mono font-bold text-slate-400">ORDER PROCESSING DASHBOARD</span>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                #{order.order_number}
                <span className={`text-[11px] font-black uppercase px-3 py-0.5 rounded-full border ${
                  order.order_status === 'DELIVERED'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : order.order_status === 'CANCELLED'
                    ? 'bg-rose-100 text-rose-800 border-rose-200'
                    : order.order_status === 'READY_FOR_PICKUP'
                    ? 'bg-purple-100 text-purple-800 border-purple-200'
                    : 'bg-sky-100 text-sky-800 border-sky-200'
                }`}>
                  {order.order_status.replace(/_/g, ' ')}
                </span>
              </h1>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handlePrint('packingslip')}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Print Packing Slip</span>
            </button>
            <button
              onClick={() => handlePrint('invoice')}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={() => setShowAssignModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all"
            >
              <Truck className="w-4 h-4" />
              <span>{order.delivery_partner ? 'Reassign Rider' : 'Assign Delivery Partner'}</span>
            </button>
            <button
              onClick={() => setShowStatusModal(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Update Status</span>
            </button>
          </div>
        </div>

        {/* Visual Timeline Stepper */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-600" />
              Order Lifecycle Stepper
            </h3>
            {order.delivery_otp && (
              <span className="text-xs font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg">
                🔐 Delivery OTP: <strong className="text-slate-900">{order.delivery_otp}</strong>
              </span>
            )}
          </div>

          <div className="relative pt-2 pb-2">
            <div className="hidden lg:block absolute top-7 left-6 right-6 h-1 bg-slate-100 -z-0">
              <div
                className="bg-emerald-500 h-full transition-all duration-700"
                style={{ width: `${Math.max(0, (stepIndex / (TIMELINE_STEPS.length - 1)) * 100)}%` }}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 relative z-10">
              {TIMELINE_STEPS.map((step, idx) => {
                const isPassed = stepIndex >= idx;
                const isCurrent = stepIndex === idx;

                return (
                  <div key={step.key} className="flex flex-col items-center text-center gap-1.5">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                        isPassed
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      } ${isCurrent ? 'ring-4 ring-emerald-100 scale-110' : ''}`}
                    >
                      {isPassed ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
                    </div>
                    <div>
                      <p className={`text-[11px] font-bold ${isPassed ? 'text-slate-900' : 'text-slate-400'}`}>
                        {step.label}
                      </p>
                      <p className="text-[9px] text-slate-400 hidden lg:block">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Grid: Left (Packing & Items), Right (Customer & Delivery Partner) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT 8 COLS: PACKING WORKFLOW & MEDICINE ITEMS */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* PACKING WORKFLOW CARD */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-emerald-500/30 shadow-md space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-extrabold uppercase px-4 py-1 rounded-bl-xl tracking-wider shadow-sm">
                Store Packing Center
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Box className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">Order Packing Checklist</h2>
                </div>
                <p className="text-xs text-slate-500">
                  Store staff must verify active salts and check off each medicine item before dispatching.
                </p>
              </div>

              {/* Packing Progress Bar */}
              <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">
                    Packing Progress: <strong className="text-emerald-700">{packedCount} / {totalItemsCount} items packed</strong>
                  </span>
                  <span className="font-black text-emerald-700">{packingProgressPercent}%</span>
                </div>
                <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${allPacked ? 'bg-emerald-600' : 'bg-emerald-500'}`}
                    style={{ width: `${packingProgressPercent}%` }}
                  />
                </div>
                {allPacked ? (
                  <p className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> All items verified and packed in express pouch!
                  </p>
                ) : (
                  <p className="text-[11px] text-amber-700 font-medium flex items-center gap-1 pt-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {totalItemsCount - packedCount} item(s) pending packing. Check off below.
                  </p>
                )}
              </div>

              {/* Packing Items Checklist */}
              <div className="divide-y divide-slate-100">
                {items.map((it, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleTogglePacked(idx, it.packed)}
                    className={`py-3.5 px-4 rounded-2xl flex items-center justify-between gap-4 cursor-pointer transition-all ${
                      it.packed
                        ? 'bg-emerald-50/50 border border-emerald-200/80 shadow-xs'
                        : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                          it.packed
                            ? 'bg-emerald-600 text-white'
                            : 'border-2 border-slate-300 bg-white text-transparent'
                        }`}
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </button>

                      <img
                        src={it.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100'}
                        alt={it.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                      />

                      <div>
                        <div className="flex items-center gap-2">
                          <p className={`text-xs font-bold ${it.packed ? 'text-slate-900 line-through text-slate-500' : 'text-slate-900'}`}>
                            {it.name}
                          </p>
                          {it.prescription_required && (
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-rose-100 text-rose-800">
                              Rx Required
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500">{it.generic_name} • {it.brand}</p>
                        <p className="text-[11px] font-semibold text-slate-700 mt-0.5">
                          ₹{it.selling_price} <span className="text-slate-400 line-through text-[10px]">₹{it.mrp}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="inline-block px-3 py-1 bg-slate-900 text-white font-black text-xs rounded-xl shadow-xs">
                        Qty: {it.quantity}
                      </span>
                      <span className="block text-xs font-bold text-slate-800 mt-1">₹{it.item_total_selling}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Ready for Pickup Action Button */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Status: <span className="uppercase text-emerald-700">{order.order_status.replace(/_/g, ' ')}</span>
                  </p>
                  <p className="text-[11px] text-slate-500">Seals the package and prepares for courier pickup.</p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowReadyModal(true)}
                  disabled={order.order_status === 'READY_FOR_PICKUP' || order.order_status === 'DELIVERED'}
                  className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  <Package className="w-4 h-4" />
                  <span>Mark as Ready for Pickup</span>
                </button>
              </div>
            </div>

            {/* PRESCRIPTION ATTACHMENT DETAILS (if linked) */}
            {order.prescription_doc && (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  Linked Doctor Prescription
                </h3>
                <div className="flex items-center justify-between p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs">
                  <div>
                    <p className="font-bold text-slate-900">{order.prescription_doc.file_name}</p>
                    <p className="text-[11px] text-slate-600">Patient: {order.prescription_doc.patient_name || order.customer_name}</p>
                    <span className="inline-block mt-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Status: {order.prescription_doc.status}
                    </span>
                  </div>
                  {order.prescription_doc.file_url && (
                    <a
                      href={order.prescription_doc.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-1.5 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1"
                    >
                      View Rx File <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* ORDER HISTORY AUDIT LOG */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600" />
                Audit Trail & History Logs ({order.status_history?.length || 0})
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto divide-y divide-slate-100 text-xs">
                {order.status_history?.map((h, idx) => (
                  <div key={idx} className="pt-2.5 pb-1 flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-900 uppercase">{h.status}</span>
                      <p className="text-slate-600">{h.note}</p>
                      {h.updated_by && (
                        <span className="text-[10px] text-slate-400">By: {h.updated_by}</span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                      {new Date(h.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT 4 COLS: CUSTOMER, DELIVERY PARTNER, PAYMENT BREAKDOWN */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* DELIVERY PARTNER CARD */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-indigo-600" />
                  Assigned Delivery Partner
                </h3>
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                >
                  {order.delivery_partner ? 'Change' : 'Assign'}
                </button>
              </div>

              {order.delivery_partner ? (
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center gap-3 p-3 bg-indigo-50/70 border border-indigo-200 rounded-2xl">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                      🛵
                    </div>
                    <div>
                      <p className="font-black text-slate-900">{order.delivery_partner.name}</p>
                      <p className="text-[11px] text-slate-500">{order.delivery_partner.vehicle || 'Express Courier'}</p>
                    </div>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Phone:</span>
                    <a href={`tel:${order.delivery_partner.phone}`} className="font-bold text-indigo-600 hover:underline">
                      📞 {order.delivery_partner.phone}
                    </a>
                  </div>
                  {order.timestamps?.assignedAt && (
                    <div className="flex justify-between py-1 text-slate-500 text-[11px]">
                      <span>Assigned At:</span>
                      <span>{new Date(order.timestamps.assignedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center space-y-2">
                  <p className="text-xs text-slate-500">No delivery rider assigned yet.</p>
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    + Assign Delivery Rider
                  </button>
                </div>
              )}
            </div>

            {/* CUSTOMER INFORMATION CARD */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                <User className="w-4 h-4 text-emerald-600" />
                Customer Information
              </h3>

              <div className="space-y-3 text-xs text-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Recipient Name</span>
                  <p className="font-black text-sm text-slate-900">{order.customer_name}</p>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Contact Phone</span>
                  <a href={`tel:${order.customer_phone}`} className="font-bold text-emerald-700 hover:underline flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> {order.customer_phone}
                  </a>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Email Address</span>
                  <p className="text-slate-600 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> {order.customer_email}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Complete Delivery Address</span>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <p className="font-semibold text-slate-800">{order.shipping_address?.street_address}</p>
                    {order.shipping_address?.apartment && <p>{order.shipping_address?.apartment}</p>}
                    <p>{order.shipping_address?.city}, {order.shipping_address?.state} - <strong className="text-slate-900">{order.shipping_address?.postal_code}</strong></p>
                    <p className="text-[10px] text-slate-400">{order.shipping_address?.country || 'India'}</p>
                  </div>
                </div>

                {order.customer_notes && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-950">
                    <span className="text-[10px] font-bold uppercase block">Customer Delivery Notes:</span>
                    <p className="text-xs italic mt-0.5">"{order.customer_notes}"</p>
                  </div>
                )}
              </div>
            </div>

            {/* PAYMENT & ORDER SUMMARY */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                Payment & Order Summary
              </h3>

              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <strong className="uppercase text-slate-900">{order.payment_method}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Payment Status:</span>
                  <strong className={`uppercase ${order.payment_status === 'PAID' ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {order.payment_status}
                  </strong>
                </div>
                {order.payment_details?.transaction_id && (
                  <div className="flex justify-between text-[11px] font-mono">
                    <span>Txn ID:</span>
                    <span className="text-slate-800 truncate max-w-[140px]">{order.payment_details.transaction_id}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 space-y-1.5">
                  <div className="flex justify-between">
                    <span>Subtotal Selling:</span>
                    <span>₹{order.subtotal_selling}</span>
                  </div>
                  {order.coupon_discount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Coupon ({order.coupon_code}):</span>
                      <span>-₹{order.coupon_discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Express Delivery Fee:</span>
                    <span>{order.delivery_fee === 0 ? 'FREE' : `₹${order.delivery_fee}`}</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-100">
                    <span>Final Total Payable:</span>
                    <span>₹{order.total_amount}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* CONFIRMATION MODAL: MARK READY FOR PICKUP */}
      {showReadyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 animate-fade-in shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <Package className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-black text-lg text-slate-900">Mark Order Ready for Pickup?</h3>
              <p className="text-xs text-slate-500">
                All <strong>{totalItemsCount} items</strong> have been packed. This will seal the order package and notify the delivery team for dispatch.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between font-bold text-slate-800">
                <span>Order Identifier:</span>
                <span className="font-mono">#{order.order_number}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Recipient:</span>
                <span>{order.customer_name}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Items:</span>
                <span>{totalItemsCount} medicines ({packedCount} checked)</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowReadyModal(false)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReadyForPickup}
                disabled={markingReady}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-50"
              >
                {markingReady ? 'Sealing Package...' : 'Yes, Mark Ready for Pickup'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ASSIGN DELIVERY PARTNER */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-4 animate-fade-in shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900">Assign Delivery Executive</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleAssignDeliveryPartner} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-2">Select Active Delivery Partner:</label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {deliveryPartners.map((rider) => {
                    const isSelected = selectedPartnerId === rider.id;
                    return (
                      <div
                        key={rider.id}
                        onClick={() => setSelectedPartnerId(rider.id)}
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
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning || !selectedPartnerId}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-50"
                >
                  {assigning ? 'Assigning...' : 'Assign Order to Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADVANCE ORDER STATUS */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 animate-fade-in shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900">Update Order Status</h3>
              <button onClick={() => setShowStatusModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleManualStatusUpdate} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">New Order Status:</label>
                <select
                  value={manualStatus}
                  onChange={(e) => setManualStatus(e.target.value)}
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
                  <option value="REFUNDED">Refunded</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Activity Note (Optional):</label>
                <input
                  type="text"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="e.g. Package dispatched from Hub A"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingStatus}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  {updatingStatus ? 'Updating...' : 'Update & Notify Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
