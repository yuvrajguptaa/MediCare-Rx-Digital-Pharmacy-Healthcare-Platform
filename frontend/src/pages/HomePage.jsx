import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Upload, Shield, Truck, Sparkles, ArrowRight, Percent,
  Activity, Star, CheckCircle, Zap, Clock, Pill, HeartHandshake,
  Search, ShieldCheck, HeartPulse
} from 'lucide-react';
import api from '../api/client';
import MedicineCard from '../components/common/MedicineCard';

export default function HomePage() {
  const [featured, setFeatured] = useState({ popular: [], offers: [], otc_essentials: [] });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroSearch, setHeroSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/medicines/featured/'),
      api.get('/categories/')
    ])
      .then(([featRes, catRes]) => {
        setFeatured(featRes.data);
        setCategories(catRes.data?.categories || []);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleHeroSearch = (e) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      navigate(`/medicines?search=${encodeURIComponent(heroSearch.trim())}`);
    }
  };

  return (
    <div className="space-y-16 pb-16">
      
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-900 via-teal-900 to-slate-900 text-white py-16 lg:py-24">
        {/* Glow ambient backgrounds */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold tracking-wide">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Licensed Online Pharmacy • 100% Authentic Meds
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
                Healthcare delivered <br className="hidden sm:inline" />
                with <span className="bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent">trust & speed.</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto lg:mx-0 font-normal">
                Order genuine prescription medicines, OTC remedies, and health essentials with registered pharmacist verification and express 24h doorstep delivery.
              </p>

              {/* Hero Search Bar */}
              <form onSubmit={handleHeroSearch} className="relative max-w-lg mx-auto lg:mx-0 pt-2">
                <input
                  type="text"
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                  placeholder="Search medicines, salts, or brands..."
                  className="w-full pl-12 pr-32 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-400 focus:bg-white/20 transition-all text-sm"
                />
                <Search className="w-5 h-5 text-emerald-300 absolute left-4 top-6" />
                <button
                  type="submit"
                  className="absolute right-2 top-3.5 bottom-3.5 px-6 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5"
                >
                  Find Meds
                </button>
              </form>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4">
                <Link
                  to="/prescriptions"
                  className="px-6 py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-sm transition-all shadow-lg shadow-teal-500/25 flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload Prescription Now
                </Link>

                <Link
                  to="/medicines"
                  className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 transition-all flex items-center gap-2"
                >
                  Browse 50+ Medicines
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Trust counters */}
              <div className="grid grid-cols-3 gap-4 pt-6 max-w-md mx-auto lg:mx-0 border-t border-white/10 text-center lg:text-left">
                <div>
                  <p className="text-2xl font-black text-white">50+</p>
                  <p className="text-xs text-slate-400 font-medium">Curated Medicines</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-emerald-400">100%</p>
                  <p className="text-xs text-slate-400 font-medium">Genuine Guarantee</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-teal-300">24/7</p>
                  <p className="text-xs text-slate-400 font-medium">Pharmacist Support</p>
                </div>
              </div>
            </div>

            {/* Hero Interactive Card / Prescription CTA Box */}
            <div className="lg:col-span-5">
              <div className="glass-panel-dark rounded-3xl p-6 sm:p-8 border border-white/15 shadow-2xl relative">
                <div className="absolute -top-3 right-6 bg-gradient-to-r from-amber-400 to-emerald-400 text-slate-950 font-black text-[11px] px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                  Express Dispensing
                </div>

                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                    <Pill className="w-6 h-6 rotate-45" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white">Have a Prescription?</h3>
                    <p className="text-xs text-slate-300">Let our pharmacists review and prepare your order</p>
                  </div>
                </div>

                <div className="space-y-3.5 mb-6 text-xs text-slate-300">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Upload a clear photo (JPG, PNG) or PDF of your Rx</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Registered pharmacist verifies dosage & instructions</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Medicines safely packed & delivered to your doorstep</span>
                  </div>
                </div>

                <Link
                  to="/prescriptions"
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload & Order Medicines
                </Link>

                <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    Instant MediAI Assistance
                  </span>
                  <Link to="/ai-assistant" className="text-emerald-300 hover:underline font-bold">
                    Ask MediAI →
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. Medicine Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-700">Explore by condition</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">Medicine Categories</h2>
          </div>
          <Link
            to="/medicines"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            All Categories →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id || cat._id || cat.slug}
              to={`/medicines?category=${encodeURIComponent(cat.name)}`}
              className="group p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-500 hover:shadow-lg transition-all flex flex-col items-center text-center justify-between relative overflow-hidden"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-all flex items-center justify-center mb-3 shadow-xs">
                <HeartPulse className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2">
                {cat.name}
              </h4>
              <span className="text-[11px] font-semibold text-slate-400 mt-1">
                {cat.product_count || 5}+ Products
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Best Offers & Discounts (Flash Deals) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md">
                <Percent className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Best Offers & Flash Discounts</h2>
                <p className="text-xs text-slate-600">Save up to 25% on top essential medications and wellness products</p>
              </div>
            </div>
            <Link
              to="/medicines?sort_by=discount"
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors shadow-xs"
            >
              View All Offers →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {(featured?.offers || []).slice(0, 4).map((med) => (
              <MedicineCard key={med.id || med._id} medicine={med} />
            ))}
          </div>
        </div>
      </section>

      {/* 4. Popular Medicines Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-700">Highest rated</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">Popular Medicines</h2>
          </div>
          <Link
            to="/medicines"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            Explore Full Catalog →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {(featured?.popular || []).slice(0, 8).map((med) => (
            <MedicineCard key={med.id || med._id} medicine={med} />
          ))}
        </div>
      </section>

      {/* 5. Daily OTC Essentials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-700">No prescription needed</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">Daily OTC Essentials</h2>
          </div>
          <Link
            to="/medicines?prescription_required=false"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            View All OTC Items →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {(featured?.otc_essentials || []).slice(0, 4).map((med) => (
            <MedicineCard key={med.id || med._id} medicine={med} />
          ))}
        </div>
      </section>

      {/* 6. Healthcare Information & Wellness Insights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden">
          <div className="max-w-2xl relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              MediAI Healthcare Guidance
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Have questions about your medication dosage or symptoms?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Our intelligent pharmaceutical assistant MediAI can help explain medical terms, active ingredients, dosage timing, and general health precautions.
            </p>
            <div className="pt-2">
              <Link
                to="/ai-assistant"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg"
              >
                Chat with MediAI Now →
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
