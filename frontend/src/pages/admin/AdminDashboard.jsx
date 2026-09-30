import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Pill, PackageCheck, DollarSign, FileText,
  AlertTriangle, TrendingUp, ArrowRight, Eye, CheckCircle2
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import api from '../../api/client';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats/')
      .then(res => setData(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { stats, charts, recent_orders, recent_prescriptions } = data || {};

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Admin & Pharmacy Metrics</h1>
        <p className="text-xs text-slate-500 mt-0.5">Real-time overview of orders, prescriptions, inventory, and revenue</p>
      </div>

      {/* Metrics Cards Grid (6 cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
          <p className="text-[11px] text-slate-400 font-bold uppercase">Total Revenue</p>
          <h3 className="text-xl font-black text-slate-900">₹{stats?.total_revenue?.toLocaleString() || 0}</h3>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <PackageCheck className="w-4 h-4" />
          </div>
          <p className="text-[11px] text-slate-400 font-bold uppercase">Total Orders</p>
          <h3 className="text-xl font-black text-slate-900">{stats?.total_orders || 0}</h3>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Pill className="w-4 h-4" />
          </div>
          <p className="text-[11px] text-slate-400 font-bold uppercase">Medicines</p>
          <h3 className="text-xl font-black text-slate-900">{stats?.total_medicines || 0}</h3>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <p className="text-[11px] text-slate-400 font-bold uppercase">Total Users</p>
          <h3 className="text-xl font-black text-slate-900">{stats?.total_users || 0}</h3>
        </div>

        <Link
          to="/admin/prescriptions"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1 hover:border-amber-400 transition-colors block"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <p className="text-[11px] text-slate-400 font-bold uppercase">Pending Rx</p>
          <h3 className="text-xl font-black text-amber-600">{stats?.pending_prescriptions || 0}</h3>
        </Link>

        <Link
          to="/admin/inventory"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1 hover:border-rose-400 transition-colors block"
        >
          <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <p className="text-[11px] text-slate-400 font-bold uppercase">Low Stock</p>
          <h3 className="text-xl font-black text-rose-600">{stats?.low_stock_count || 0}</h3>
        </Link>

      </div>

      {/* Recharts Monthly Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Revenue Growth Trend */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900">Monthly Revenue (₹)</h3>
              <p className="text-xs text-slate-400">Total revenue growth over the past 6 months</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> +24% YoY
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts?.monthly_trends || []}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  formatter={(val) => [`₹${val.toLocaleString()}`, 'Revenue']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders Volume Trend */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div>
            <h3 className="font-bold text-base text-slate-900">Order Volume per Month</h3>
            <p className="text-xs text-slate-400">Completed pharmacy fulfillment counts</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.monthly_trends || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  formatter={(val) => [val, 'Orders']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="orders" fill="#0f172a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Grid: Recent Orders & Pending Prescriptions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Recent Orders Table */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-base text-slate-900">Recent Customer Orders</h3>
            <Link to="/admin/orders" className="text-xs font-bold text-emerald-700 hover:underline">
              View All →
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recent_orders?.map((ord) => (
              <div key={ord.id || ord._id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900 font-mono">#{ord.order_number}</p>
                  <p className="text-slate-500">{ord.customer_name} • {ord.items?.length || 0} items</p>
                </div>
                <div className="text-right space-y-1">
                  <span className="font-black text-slate-900 block">₹{ord.total_amount}</span>
                  <span className="inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                    {ord.order_status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Prescriptions Table */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-base text-slate-900">Prescriptions Verification Queue</h3>
            <Link to="/admin/prescriptions" className="text-xs font-bold text-emerald-700 hover:underline">
              Review Queue →
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recent_prescriptions?.map((rx) => (
              <div key={rx.id || rx._id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900">{rx.patient_name || 'Customer Rx'}</p>
                  <p className="text-slate-500">{rx.file_name} • {rx.doctor_name || 'Rx Document'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                    rx.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {rx.status}
                  </span>
                  <Link
                    to="/admin/prescriptions"
                    className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
