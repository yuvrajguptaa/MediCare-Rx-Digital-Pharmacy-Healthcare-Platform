import React from 'react';
import { Link } from 'react-router-dom';
import { Pill, ShieldCheck, Truck, RefreshCw, Award, Heart, Phone, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      {/* Trust Badges */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 border-b border-slate-800">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-800/50 border border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">100% Genuine Meds</h4>
              <p className="text-xs text-slate-400">Direct from certified pharmaceutical distributors</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-800/50 border border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Express Doorstep Delivery</h4>
              <p className="text-xs text-slate-400">Same day dispatch on verified orders</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-800/50 border border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Licensed Pharmacists</h4>
              <p className="text-xs text-slate-400">Every prescription verified before dispensing</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-800/50 border border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Easy Returns & Refunds</h4>
              <p className="text-xs text-slate-400">Hassle-free 7-day policy on eligible goods</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          
          {/* Company Bio */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white">
                <Pill className="w-5 h-5 rotate-45" />
              </div>
              <span className="text-2xl font-black text-white tracking-tight">
                Medi<span className="text-emerald-400">Care</span>
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              MediCare is a licensed digital healthcare platform providing access to certified medications, diagnostic essentials, and wellness products with professional pharmacist oversight.
            </p>
            <div className="space-y-2 text-xs text-slate-400 pt-2">
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400" />
                <span>24/7 Helpline: +91 1800-MED-CARE</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-emerald-400" />
                <span>support@medicare-pharmacy.com</span>
              </div>
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>DLF Cyber City, Tower B, Phase 2, Gurugram 122002</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h5 className="font-bold text-white text-sm mb-4">Quick Links</h5>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li><Link to="/medicines" className="hover:text-emerald-400 transition-colors">All Medicines</Link></li>
              <li><Link to="/prescriptions" className="hover:text-emerald-400 transition-colors">Upload Prescription</Link></li>
              <li><Link to="/ai-assistant" className="hover:text-emerald-400 transition-colors">MediAI Health Assistant</Link></li>
              <li><Link to="/orders" className="hover:text-emerald-400 transition-colors">Track Order</Link></li>
              <li><Link to="/wishlist" className="hover:text-emerald-400 transition-colors">Wishlist</Link></li>
            </ul>
          </div>

          {/* Popular Categories */}
          <div>
            <h5 className="font-bold text-white text-sm mb-4">Categories</h5>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li><Link to="/medicines?category=Antibiotics%20%26%20Anti-Infectives" className="hover:text-emerald-400 transition-colors">Antibiotics</Link></li>
              <li><Link to="/medicines?category=Pain%20Relief%20%26%20Analgesics" className="hover:text-emerald-400 transition-colors">Pain Relief</Link></li>
              <li><Link to="/medicines?category=Cardiovascular%20%26%20Heart" className="hover:text-emerald-400 transition-colors">Heart & BP</Link></li>
              <li><Link to="/medicines?category=Diabetes%20Care" className="hover:text-emerald-400 transition-colors">Diabetes Care</Link></li>
              <li><Link to="/medicines?category=Vitamins%20%26%20Supplements" className="hover:text-emerald-400 transition-colors">Vitamins</Link></li>
            </ul>
          </div>

          {/* Legal & Regulatory */}
          <div>
            <h5 className="font-bold text-white text-sm mb-4">Regulatory & Trust</h5>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li><span className="text-slate-300">Drug License:</span> DL-DL-2026-99182</li>
              <li><span className="text-slate-300">FSSAI Lic:</span> 10020042000192</li>
              <li><span className="text-slate-300">Pharmacist Registry:</span> Verified</li>
              <li className="pt-2 text-[11px] text-slate-500">All prescription medicines are dispensed strictly under valid doctor prescriptions.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Statutory Disclaimer & Copyright */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-slate-800 text-center text-xs text-slate-500 space-y-3">
        <p className="max-w-4xl mx-auto text-[11px] text-slate-500 leading-relaxed">
          <strong>Statutory Medical Disclaimer:</strong> The information provided on MediCare is for educational and informational purposes only. It is not intended to be a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or qualified healthcare provider with any questions you may have regarding a medical condition. Do not disregard professional medical advice or delay seeking it because of something you have read on this website.
        </p>
        <p>© 2026 MediCare Online Pharmacy System. All rights reserved.</p>
      </div>
    </footer>
  );
}
