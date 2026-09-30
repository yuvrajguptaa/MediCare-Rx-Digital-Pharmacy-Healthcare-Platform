import React, { useState, useEffect } from 'react';
import { Users, Search, Shield, UserCheck, UserX } from 'lucide-react';
import api from '../../api/client';
import { useNotifications } from '../../context/NotificationContext';
import BackButton from '../../components/common/BackButton';

export default function AdminUsers() {
  const { showToast } = useNotifications();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const fetchUsers = () => {
    setLoading(true);
    const url = roleFilter ? `/admin/users/?role=${roleFilter}` : '/admin/users/';
    api.get(url)
      .then(res => setUsers(res.data?.users || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleToggleActive = async (user) => {
    try {
      const uId = user.id || user._id;
      await api.patch(`/admin/users/${uId}/`, {
        is_active: !user.is_active
      });
      showToast(`User status updated to ${!user.is_active ? 'Active' : 'Deactivated'}.`, 'info');
      fetchUsers();
    } catch (err) {
      showToast('Failed to update user', 'error');
    }
  };

  const handleChangeRole = async (user, newRole) => {
    try {
      const uId = user.id || user._id;
      await api.patch(`/admin/users/${uId}/`, { role: newRole });
      showToast(`User role updated to ${newRole}.`, 'success');
      fetchUsers();
    } catch (err) {
      showToast('Failed to update role', 'error');
    }
  };

  const filteredUsers = users.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.first_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.last_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton fallbackUrl="/admin" label="Dashboard" />
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Registered User Accounts</h1>
            <p className="text-xs text-slate-500">Manage customers, pharmacists, and staff role permissions</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
          >
            <option value="">All Roles ({users.length})</option>
            <option value="USER">Customer (USER)</option>
            <option value="PHARMACIST">Pharmacist</option>
            <option value="ADMIN">Administrator</option>
          </select>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="flex-1 bg-transparent border-0 text-xs focus:ring-0 text-slate-900 placeholder:text-slate-400"
        />
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="p-4">User</th>
              <th className="p-4">Contact Phone</th>
              <th className="p-4">Role Access</th>
              <th className="p-4">Account Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.map((u) => {
              const uId = u.id || u._id;
              return (
                <tr key={uId} className="hover:bg-slate-50/80">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={u.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'}
                        alt="avatar"
                        className="w-9 h-9 rounded-xl bg-emerald-50 border border-slate-200"
                      />
                      <div>
                        <p className="font-bold text-slate-900">{u.first_name} {u.last_name}</p>
                        <p className="text-[11px] text-slate-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-mono">{u.phone || 'N/A'}</td>
                  <td className="p-4">
                    <select
                      value={u.role}
                      onChange={(e) => handleChangeRole(u, e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold"
                    >
                      <option value="USER">USER</option>
                      <option value="PHARMACIST">PHARMACIST</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded ${
                      u.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {u.is_active ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleToggleActive(u)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors ${
                        u.is_active ? 'bg-rose-50 text-rose-700 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}
