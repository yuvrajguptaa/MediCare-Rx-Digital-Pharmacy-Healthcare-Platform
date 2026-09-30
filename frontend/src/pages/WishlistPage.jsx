import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import MedicineCard from '../components/common/MedicineCard';
import BackButton from '../components/common/BackButton';

export default function WishlistPage() {
  const { wishlist } = useCart();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">My Saved Wishlist</h1>
          <p className="text-xs text-slate-500 mt-0.5">{wishlist.length} saved medications</p>
        </div>
        <BackButton fallbackUrl="/medicines" label="Browse Medicines" />
      </div>

      {wishlist.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Your Wishlist is Empty</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Save medicines you frequently order for easy one-click monthly refills.
          </p>
          <Link
            to="/medicines"
            className="inline-block px-6 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            Explore Medicines
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {wishlist.map((med) => (
            <MedicineCard key={med.id || med._id} medicine={med} />
          ))}
        </div>
      )}
    </div>
  );
}
