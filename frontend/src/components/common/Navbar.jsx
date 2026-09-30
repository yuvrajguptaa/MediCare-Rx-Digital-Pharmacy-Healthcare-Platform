import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search, ShoppingCart, Heart, Bell, User, Shield, Pill,
  FileText, Sparkles, ChevronDown, LogOut, CheckCircle2,
  AlertCircle, Menu, X, Clock, PackageCheck, Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useNotifications } from '../../context/NotificationContext';
import api from '../../api/client';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, isPharmacist, logout } = useAuth();
  const { cart, wishlist } = useCart();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categories, setCategories] = useState([]);

  const searchRef = useRef(null);
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  // Fetch categories for subnav
  useEffect(() => {
    api.get('/categories/')
      .then(res => setCategories(res.data?.categories || []))
      .catch(err => console.error(err));
  }, []);

  // Debounced search suggestions
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        api.get(`/medicines/suggestions/?q=${encodeURIComponent(searchQuery.trim())}`)
          .then(res => {
            setSuggestions(res.data?.suggestions || []);
            setShowSuggestions(true);
          })
          .catch(err => console.error(err));
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      navigate(`/medicines?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Top Banner */}
      <div className="bg-emerald-700 text-white text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-300" />
              100% Genuine Certified Medicines
            </span>
            <span className="hidden md:inline text-emerald-200">|</span>
            <span className="hidden md:flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-300" />
              Express 24-Hour Doorstep Delivery
            </span>
          </div>
          <div className="flex items-center gap-4 text-emerald-100">
            <span>24x7 Pharmacist Help: <strong className="text-white">+91 1800-MED-CARE</strong></span>
            {isAdmin && (
              <span className="bg-amber-400 text-slate-900 font-bold px-2 py-0.5 rounded text-[10px] tracking-wider uppercase">
                Admin Mode
              </span>
            )}
            {isPharmacist && !isAdmin && (
              <span className="bg-sky-300 text-slate-900 font-bold px-2 py-0.5 rounded text-[10px] tracking-wider uppercase">
                Pharmacist Mode
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Pill className="w-6 h-6 rotate-45" />
            </div>
            <div>
              <div className="text-2xl font-black tracking-tight text-slate-900 flex items-center">
                Medi<span className="text-emerald-600">Care</span>
                <span className="ml-1 text-[10px] uppercase font-extrabold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">Rx</span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 -mt-1 tracking-wider uppercase">Digital Pharmacy</p>
            </div>
          </Link>

          {/* Search Bar with live autocomplete */}
          <div ref={searchRef} className="relative flex-1 max-w-2xl hidden md:block">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                placeholder="Search for medicines, active salts (e.g. Paracetamol, Amoxicillin)..."
                className="w-full pl-12 pr-24 py-3 bg-slate-100/90 border border-slate-200 rounded-full text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all shadow-inner"
              />
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 bottom-1.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-full transition-colors flex items-center gap-1 shadow-sm"
              >
                Search
              </button>
            </form>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 animate-fade-in overflow-hidden">
                <div className="px-4 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Suggested Medicines</span>
                  <span className="text-[11px] font-normal text-emerald-600">{suggestions.length} matches</span>
                </div>
                <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                  {suggestions.map((item) => (
                    <Link
                      key={item.id || item._id}
                      to={`/medicines/${item.id || item._id}`}
                      onClick={() => { setShowSuggestions(false); setSearchQuery(''); }}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-emerald-50/70 transition-colors"
                    >
                      <img
                        src={item.images?.[0] || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100'}
                        alt={item.name}
                        className="w-10 h-10 object-cover rounded-lg border border-slate-200"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900 truncate">{item.name}</p>
                          {item.prescription_required && (
                            <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.5 rounded">Rx</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate">{item.generic_name} • {item.brand}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-emerald-700">₹{item.selling_price}</span>
                        {item.mrp > item.selling_price && (
                          <span className="block text-[11px] text-slate-400 line-through">₹{item.mrp}</span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="p-2 bg-slate-50 border-t border-slate-100 text-center">
                  <button
                    onClick={handleSearchSubmit}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                  >
                    View all results for "{searchQuery}" →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Quick Upload Rx CTA */}
            <Link
              to="/prescriptions"
              className="hidden lg:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold transition-all border border-teal-200/80"
            >
              <FileText className="w-4 h-4 text-teal-600" />
              Upload Rx
            </Link>

            {/* MediAI Assistant CTA */}
            <Link
              to="/ai-assistant"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 text-emerald-800 text-xs font-bold transition-all border border-emerald-200"
            >
              <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
              <span className="hidden sm:inline">MediAI</span>
            </Link>

            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="relative p-2.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              title="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link
              to="/cart"
              className="relative flex items-center gap-2 p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all hover:shadow-lg"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="hidden sm:inline font-bold">₹{cart.final_total || 0}</span>
              {cart.item_count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-slate-900 font-extrabold text-[11px] w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white">
                  {cart.item_count}
                </span>
              )}
            </Link>

            {/* Notifications Popover */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="relative p-2.5 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded-xl transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifs && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 animate-fade-in">
                  <div className="px-4 py-2 flex items-center justify-between border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.slice(0, 5).map((n) => (
                        <div
                          key={n.id || n._id}
                          onClick={() => {
                            if (!n.is_read) markAsRead(n.id || n._id);
                            if (n.link) navigate(n.link);
                            setShowNotifs(false);
                          }}
                          className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors ${
                            !n.is_read ? 'bg-emerald-50/50' : ''
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="mt-0.5 text-base">
                              {n.type === 'ORDER' ? '📦' : n.type === 'PRESCRIPTION' ? '📋' : '🔔'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">{n.title}</p>
                              <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">{n.message}</p>
                              <span className="text-[10px] text-slate-400 mt-1 block">
                                {new Date(n.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            {!n.is_read && (
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1" />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-2 border-t border-slate-100 text-center">
                    <Link
                      to="/notifications"
                      onClick={() => setShowNotifs(false)}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                    >
                      View all notifications →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile / Auth Button */}
            {isAuthenticated ? (
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 pl-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  <img
                    src={user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'}
                    alt="avatar"
                    className="w-7 h-7 rounded-lg bg-emerald-100 border border-slate-300"
                  />
                  <span className="hidden sm:inline text-xs font-bold text-slate-800 max-w-[90px] truncate">
                    {user.first_name || 'Account'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-fade-in">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">{user.first_name} {user.last_name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        {user.role}
                      </span>
                    </div>

                    <div className="py-1 text-xs text-slate-700">
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-amber-50 text-amber-900 font-bold"
                        >
                          <Layers className="w-4 h-4 text-amber-600" />
                          Admin Dashboard
                        </Link>
                      )}
                      {isPharmacist && !isAdmin && (
                        <Link
                          to="/admin/prescriptions"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-sky-50 text-sky-900 font-bold"
                        >
                          <PackageCheck className="w-4 h-4 text-sky-600" />
                          Pharmacist Reviews
                        </Link>
                      )}
                      <Link
                        to="/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        My Profile
                      </Link>
                      <Link
                        to="/orders"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50"
                      >
                        <PackageCheck className="w-4 h-4 text-slate-400" />
                        My Orders
                      </Link>
                      <Link
                        to="/prescriptions"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50"
                      >
                        <FileText className="w-4 h-4 text-slate-400" />
                        My Prescriptions
                      </Link>
                      <Link
                        to="/addresses"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50"
                      >
                        <Shield className="w-4 h-4 text-slate-400" />
                        Saved Addresses
                      </Link>
                    </div>

                    <div className="pt-1 border-t border-slate-100">
                      <button
                        onClick={() => {
                          logout();
                          setShowUserMenu(false);
                          navigate('/');
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-xs"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl md:hidden"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search medicines..."
              className="w-full pl-10 pr-20 py-2.5 bg-slate-100 border border-slate-200 rounded-full text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <button
              type="submit"
              className="absolute right-1.5 top-1 bottom-1 px-4 bg-emerald-600 text-white text-xs font-bold rounded-full"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Categories Subnavigation Bar */}
      <nav className="bg-slate-50 border-t border-slate-200/80 overflow-x-auto scrollbar-none hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 py-2 text-xs font-semibold whitespace-nowrap">
          <Link
            to="/medicines"
            className="px-3 py-1.5 rounded-lg text-emerald-700 bg-emerald-100/70 hover:bg-emerald-200 font-bold transition-colors"
          >
            All Medicines (50+)
          </Link>
          {categories.slice(0, 8).map((cat) => (
            <Link
              key={cat.id || cat._id || cat.slug}
              to={`/medicines?category=${encodeURIComponent(cat.name)}`}
              className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-slate-200/70 transition-colors"
            >
              {cat.name}
            </Link>
          ))}
          <Link
            to="/medicines"
            className="px-3 py-1.5 rounded-lg text-slate-500 hover:text-emerald-700 transition-colors"
          >
            More Categories →
          </Link>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-3 animate-fade-in">
          <div className="grid grid-cols-2 gap-2 text-xs font-bold">
            <Link
              to="/medicines"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-xl bg-slate-100 text-slate-800 text-center"
            >
              Browse Catalog
            </Link>
            <Link
              to="/prescriptions"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-xl bg-teal-50 text-teal-700 text-center"
            >
              Upload Prescription
            </Link>
            <Link
              to="/ai-assistant"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-center col-span-2 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Ask MediAI Assistant
            </Link>
          </div>
          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block p-2.5 rounded-xl bg-amber-100 text-amber-900 font-bold text-xs text-center"
            >
              Admin Dashboard
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
