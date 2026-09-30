import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, Package, FileText, Sparkles, Clock } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import BackButton from '../components/common/BackButton';

export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton fallbackUrl="/" label="Back" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Notifications</h1>
            <p className="text-xs text-slate-500 mt-0.5">Stay updated with orders, prescription approvals, and offers</p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shrink-0"
          >
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center space-y-3 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Bell className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Notifications</h3>
          <p className="text-xs text-slate-500">You are all caught up!</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {notifications.map((n) => {
            const notifId = n.id || n._id;
            return (
              <div
                key={notifId}
                className={`p-5 flex items-start gap-4 transition-colors ${
                  !n.is_read ? 'bg-emerald-50/40' : 'hover:bg-slate-50'
                }`}
              >
                <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  {n.type === 'ORDER' ? (
                    <Package className="w-5 h-5 text-sky-600" />
                  ) : n.type === 'PRESCRIPTION' ? (
                    <FileText className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Bell className="w-5 h-5 text-amber-600" />
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-slate-900 truncate">{n.title}</h4>
                    <span className="text-[10px] text-slate-400">
                      {new Date(n.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                  
                  <div className="pt-2 flex items-center gap-4">
                    {n.link && (
                      <Link
                        to={n.link}
                        onClick={() => { if (!n.is_read) markAsRead(notifId); }}
                        className="text-xs font-bold text-emerald-700 hover:underline"
                      >
                        View Details →
                      </Link>
                    )}
                    {!n.is_read && (
                      <button
                        onClick={() => markAsRead(notifId)}
                        className="text-[11px] text-slate-500 hover:text-slate-800 font-medium"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>

                {!n.is_read && (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 mt-2" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
