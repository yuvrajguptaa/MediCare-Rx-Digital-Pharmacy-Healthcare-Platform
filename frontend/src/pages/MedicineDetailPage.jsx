import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Star, Heart, ShoppingCart, ShieldCheck, Truck, Clock, AlertTriangle,
  FileText, Check, Plus, Minus, CheckCircle, ArrowRight, MessageSquare,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNotifications } from '../context/NotificationContext';
import MedicineCard from '../components/common/MedicineCard';
import BackButton from '../components/common/BackButton';

export default function MedicineDetailPage() {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const [medicine, setMedicine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Review states
  const [canReviewInfo, setCanReviewInfo] = useState({ can_review: false, has_reviewed: false });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [headline, setHeadline] = useState('');
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const [prevMedicine, setPrevMedicine] = useState(null);
  const [nextMedicine, setNextMedicine] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.get(`/medicines/${id}/`)
      .then(async (res) => {
        const medData = res.data;
        setMedicine(medData);
        setQuantity(1);

        // Fetch category list to determine previous and next medicine for product browsing
        if (medData?.category) {
          try {
            const catRes = await api.get(`/medicines/?category=${encodeURIComponent(medData.category)}&limit=50`);
            const list = catRes.data?.medicines || [];
            const curIdx = list.findIndex(m => (m.id || m._id) === (medData.id || medData._id));
            if (curIdx > 0) {
              setPrevMedicine(list[curIdx - 1]);
            } else {
              setPrevMedicine(null);
            }
            if (curIdx >= 0 && curIdx < list.length - 1) {
              setNextMedicine(list[curIdx + 1]);
            } else {
              setNextMedicine(null);
            }
          } catch (e) {
            console.error(e);
          }
        }
      })
      .catch((err) => {
        console.error(err);
        showToast('Medicine not found', 'error');
      })
      .finally(() => setLoading(false));

    if (isAuthenticated) {
      api.get(`/reviews/can-review/${id}/`)
        .then((res) => setCanReviewInfo(res.data))
        .catch((err) => console.error(err));
    }
  }, [id, isAuthenticated]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!medicine) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <BackButton fallbackUrl="/medicines" label="Back to Catalog" />
        <h2 className="text-xl font-bold text-slate-900 mt-4">Medicine Not Found</h2>
        <Link to="/medicines" className="inline-block px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs">
          Return to Catalog
        </Link>
      </div>
    );
  }

  const medId = medicine.id || medicine._id;
  const inWish = isInWishlist(medId);
  const isOutOfStock = medicine.stock <= 0;

  const handleAddToCart = async () => {
    if (isOutOfStock) return;
    try {
      await addToCart(medId, quantity);
      showToast(`Added ${quantity}x ${medicine.name} to cart!`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to add to cart', 'error');
    }
  };

  const handleBuyNow = async () => {
    if (isOutOfStock) return;
    try {
      await addToCart(medId, quantity);
      navigate('/checkout');
    } catch (err) {
      showToast(err.message || 'Please login to checkout', 'error');
      if (!isAuthenticated) navigate('/login');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      showToast('Please enter your review feedback.', 'warning');
      return;
    }
    try {
      setSubmittingReview(true);
      const res = await api.post(`/reviews/medicine/${medId}/`, {
        rating,
        headline,
        comment
      });
      showToast('Review submitted successfully!', 'success');
      setShowReviewForm(false);
      setMedicine(prev => ({
        ...prev,
        reviews: [res.data.review, ...(prev.reviews || [])]
      }));
      setCanReviewInfo({ can_review: false, has_reviewed: true });
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to submit review', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Navigation Bar: Back Button, Breadcrumbs, and Previous/Next Medicine Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-3 flex-wrap">
          <BackButton fallbackUrl="/medicines" label="Back to Catalog" />
          
          {/* Breadcrumbs */}
          <nav className="text-xs font-semibold text-slate-500 flex items-center gap-2">
            <Link to="/" className="hover:text-emerald-600">Home</Link>
            <span>/</span>
            <Link to="/medicines" className="hover:text-emerald-600">Medicines</Link>
            <span>/</span>
            <Link to={`/medicines?category=${encodeURIComponent(medicine.category)}`} className="hover:text-emerald-600">
              {medicine.category}
            </Link>
            <span>/</span>
            <span className="text-slate-900 truncate max-w-[160px] sm:max-w-xs">{medicine.name}</span>
          </nav>
        </div>

        {/* Previous & Next Product Browsing Controls */}
        <div className="flex items-center gap-2 justify-end">
          <button
            type="button"
            onClick={() => {
              if (prevMedicine) {
                navigate(`/medicines/${prevMedicine.id || prevMedicine._id}`);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            disabled={!prevMedicine}
            title={prevMedicine ? `Previous Medicine: ${prevMedicine.name}` : 'First medicine in this category'}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 disabled:opacity-30 disabled:hover:bg-white transition-all shadow-2xs"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Previous Med</span>
            <span className="sm:hidden">Prev</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (nextMedicine) {
                navigate(`/medicines/${nextMedicine.id || nextMedicine._id}`);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            disabled={!nextMedicine}
            title={nextMedicine ? `Next Medicine: ${nextMedicine.name}` : 'Last medicine in this category'}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 disabled:opacity-30 disabled:hover:bg-white transition-all shadow-2xs"
          >
            <span className="hidden sm:inline">Next Med</span>
            <span className="sm:hidden">Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Top Section: Gallery & Buy Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs">
        
        {/* Left: Images */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 aspect-square flex items-center justify-center">
            <img
              src={medicine.images?.[activeImageIndex] || medicine.images?.[0] || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600'}
              alt={medicine.name}
              className="w-full h-full object-cover"
            />
            {medicine.discount > 0 && (
              <span className="absolute top-4 left-4 bg-gradient-to-r from-amber-500 to-rose-500 text-white font-black text-xs px-3 py-1 rounded-lg shadow-md">
                {medicine.discount}% DISCOUNT
              </span>
            )}
            <button
              onClick={() => toggleWishlist(medicine)}
              className={`absolute top-4 right-4 p-3 rounded-full transition-all ${
                inWish ? 'bg-rose-50 text-rose-600 shadow-md' : 'bg-white/80 text-slate-500 hover:text-rose-500'
              }`}
            >
              <Heart className={`w-5 h-5 ${inWish ? 'fill-rose-500' : ''}`} />
            </button>
          </div>

          {/* Thumbnails */}
          {medicine.images?.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {medicine.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-16 h-16 rounded-xl border-2 overflow-hidden shrink-0 transition-all ${
                    activeImageIndex === idx ? 'border-emerald-600 shadow-sm' : 'border-slate-200 opacity-60'
                  }`}
                >
                  <img src={img} alt="thumb" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Details & Purchase Options */}
        <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            
            {/* Badges & Meta */}
            <div className="flex flex-wrap items-center gap-2.5">
              {medicine.prescription_required ? (
                <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Prescription Required (Rx)
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                  OTC (Over The Counter)
                </span>
              )}
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                {medicine.dosage_form || 'Tablet'} • {medicine.strength || ''}
              </span>
              <span className="text-xs text-slate-400 font-mono">SKU: {medicine.sku}</span>
            </div>

            {/* Title */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{medicine.name}</h1>
              <p className="text-sm font-semibold text-slate-600 mt-1">
                Active Salt: <span className="text-emerald-800">{medicine.generic_name}</span>
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Manufactured by <strong className="text-slate-800">{medicine.manufacturer || medicine.brand}</strong>
              </p>
            </div>

            {/* Rating summary */}
            <div className="flex items-center gap-2 pt-1">
              <div className="flex items-center gap-1 bg-amber-50 text-amber-800 px-2.5 py-1 rounded-lg text-xs font-black">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{medicine.ratings_avg || 4.8}</span>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Based on {medicine.ratings_count || 120} verified patient reviews
              </span>
            </div>

            {/* Pricing Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-baseline justify-between">
              <div>
                <span className="text-xs text-slate-400 block font-medium">Special Selling Price</span>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-black text-slate-900">₹{medicine.selling_price}</span>
                  {medicine.mrp > medicine.selling_price && (
                    <span className="text-sm text-slate-400 line-through">MRP ₹{medicine.mrp}</span>
                  )}
                  {medicine.discount > 0 && (
                    <span className="text-xs font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">
                      You Save ₹{(medicine.mrp - medicine.selling_price).toFixed(2)} ({medicine.discount}%)
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 block mt-1">Inclusive of all applicable taxes</span>
              </div>

              <div className="text-right">
                <span className={`text-xs font-extrabold uppercase px-2.5 py-1 rounded-md ${
                  isOutOfStock ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {isOutOfStock ? 'Out of Stock' : `In Stock (${medicine.stock} units)`}
                </span>
                <span className="text-[11px] text-slate-500 block mt-1">Exp: {medicine.expiry_date || '2027-12-31'}</span>
              </div>
            </div>

            {/* Prescription Notice if Rx Required */}
            {medicine.prescription_required && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-900">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-rose-950">Valid Doctor Prescription Required</h4>
                  <p className="mt-0.5 text-rose-800">
                    You can upload your prescription before or during checkout. Our licensed pharmacist will review it before dispatch.
                  </p>
                  <Link to="/prescriptions" className="inline-block mt-2 font-bold text-rose-700 hover:underline">
                    Upload Prescription in advance →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Quantity & CTA Buttons */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-slate-700">Quantity:</span>
              <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  disabled={quantity <= 1 || isOutOfStock}
                  className="w-8 h-8 rounded-lg bg-white flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-30"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center font-extrabold text-sm text-slate-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => Math.min(medicine.stock, q + 1))}
                  disabled={quantity >= medicine.stock || isOutOfStock}
                  className="w-8 h-8 rounded-lg bg-white flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-30"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="py-3.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <ShoppingCart className="w-4 h-4" />
                Add To Cart
              </button>

              <button
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-40"
              >
                Buy Now →
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Clinical & Pharmacological Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Uses & Description */}
        <div className="md:col-span-2 space-y-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs">
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Product Description & Uses</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {medicine.description || 'Standard therapeutic grade medication.'}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h4 className="font-bold text-sm text-slate-900 mb-2">Primary Indications / Key Uses</h4>
            <div className="flex flex-wrap gap-2">
              {(medicine.uses || '').split(',').map((use, i) => (
                <span key={i} className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold">
                  {use.trim()}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h4 className="font-bold text-sm text-slate-900 mb-2">Active Ingredients & Formulation</h4>
            <p className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              {medicine.ingredients || 'See packaging'}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h4 className="font-bold text-sm text-slate-900 mb-2">Important Safety Guidelines</h4>
            <ul className="list-disc list-inside text-xs text-slate-600 space-y-1.5">
              <li>Store below 25°C in a cool, dry place away from direct sunlight.</li>
              <li>Keep all medicines out of reach of children and pets.</li>
              <li>Do not exceed the recommended dose prescribed by your doctor.</li>
              <li>If symptoms persist or you experience unexpected reactions, contact a doctor immediately.</li>
            </ul>
          </div>
        </div>

        {/* MediAI Quick Widget */}
        <div className="bg-gradient-to-b from-slate-900 to-teal-950 text-white p-6 rounded-3xl space-y-4 shadow-md flex flex-col justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">
              <MessageSquare className="w-3.5 h-3.5" />
              Ask MediAI About This Med
            </div>
            <h3 className="font-bold text-lg text-white">Have questions about {medicine.name}?</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              MediAI can explain common side effects, interactions, and dosage guidelines for {medicine.generic_name}.
            </p>
          </div>

          <Link
            to="/ai-assistant"
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl text-center transition-colors shadow-md block"
          >
            Ask MediAI Now →
          </Link>
        </div>
      </div>

      {/* Verified Customer Reviews Section */}
      <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Verified Patient Reviews</h3>
            <p className="text-xs text-slate-500">Authentic feedback from verified purchasers</p>
          </div>

          {canReviewInfo.can_review && !showReviewForm && (
            <button
              onClick={() => setShowReviewForm(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs"
            >
              Write a Review
            </button>
          )}
        </div>

        {/* Review Form */}
        {showReviewForm && (
          <form onSubmit={handleReviewSubmit} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 animate-fade-in">
            <h4 className="font-bold text-sm text-slate-900">Write Your Review</h4>
            
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Rating</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star className={`w-6 h-6 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Review Headline</label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Effective relief, fast delivery"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Detailed Review *</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Share your experience regarding dosage, effectiveness, packaging..."
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowReviewForm(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingReview}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                {submittingReview ? 'Submitting...' : 'Post Review'}
              </button>
            </div>
          </form>
        )}

        {/* Reviews List */}
        <div className="divide-y divide-slate-100">
          {(!medicine.reviews || medicine.reviews.length === 0) ? (
            <p className="text-xs text-slate-400 py-6 text-center">No reviews yet for this product.</p>
          ) : (
            medicine.reviews.map((rev) => (
              <div key={rev.id || rev._id} className="py-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{rev.user_name}</span>
                    {rev.is_verified_purchase && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> Verified Purchase
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(rev.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                    />
                  ))}
                  {rev.headline && (
                    <span className="font-bold text-xs text-slate-800 ml-1.5">{rev.headline}</span>
                  )}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Related Medicines in same category */}
      {medicine.related_medicines?.length > 0 && (
        <section className="space-y-6">
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            Similar Medicines in {medicine.category}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {medicine.related_medicines.map((rel) => (
              <MedicineCard key={rel.id || rel._id} medicine={rel} />
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
