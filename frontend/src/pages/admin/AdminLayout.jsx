import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Pill, PackageCheck, FileText, Layers,
  Users, Tag, AlertTriangle, MessageSquare, ArrowLeft, Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminLayout() {
  const location = useLocation();
  const { user, isAdmin, isPharmacist } = useAuth();

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Medicines', path: '/admin/medicines', icon: Pill },
    { label: 'Prescriptions Review', path: '/admin/prescriptions', icon: FileText, highlight: true },
    { label: 'Orders Logistics', path: '/admin/orders', icon: PackageCheck },
    { label: 'Inventory & Alerts', path: '/admin/inventory', icon: AlertTriangle },
    ...(isAdmin ? [
      { label: 'Categories', path: '/admin/categories', icon: Layers },
      { label: 'Users Management', path: '/admin/users', icon: Users },
      { label: 'Coupons', path: '/admin/coupons', icon: Tag },
      { label: 'Customer Reviews', path: '/admin/reviews', icon: MessageSquare },
    ] : [])
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 p-6 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-white tracking-tight">MediCare Portal</h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-400 text-slate-950">
                  {user?.role} Staff
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Logged in as {user?.first_name} ({user?.email})
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 text-xs font-semibold">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Back to Storefront Link */}
        <div className="pt-6 border-t border-slate-800">
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-emerald-400 text-xs font-bold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Storefront
          </Link>
        </div>
      </aside>

      {/* Main Admin Content View */}
      <main className="flex-1 p-6 sm:p-10 max-w-7xl overflow-x-hidden">
        <Outlet />
      </main>

    </div>
  );
}
