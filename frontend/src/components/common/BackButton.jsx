import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/**
 * Reusable, accessible, and smart Back Button.
 * Uses browser/history navigation when available, avoiding navigation loops,
 * and falls back safely to a default route if visited directly.
 */
export default function BackButton({
  fallbackUrl = '/',
  label = 'Back',
  className = '',
  onClick = null,
  showLabel = true
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = (e) => {
    e.preventDefault();
    if (onClick) {
      onClick(e);
      return;
    }

    // Check if there is browser history within the current app session
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate(fallbackUrl, { replace: true });
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200/90 text-xs font-bold transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer shrink-0 ${className}`}
      aria-label={label}
      title={label}
    >
      <ArrowLeft className="w-3.5 h-3.5" />
      {showLabel && <span>{label}</span>}
    </button>
  );
}
