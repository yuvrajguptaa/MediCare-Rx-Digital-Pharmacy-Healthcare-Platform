import React, { useState, useEffect } from 'react';
import { AlertTriangle, Package, Check, Save, ArrowUpDown } from 'lucide-react';
import api from '../../api/client';
import { useNotifications } from '../../context/NotificationContext';
import BackButton from '../../components/common/BackButton';

export default function AdminInventory() {
  const { showToast } = useNotifications();
  const [data, setData] = useState({ low_stock_medicines: [], inventory_items: [] });
  const [stockEdits, setStockEdits] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = () => {
    setLoading(true);
    api.get('/admin/inventory/')
      .then(res => {
        setData(res.data);
        const initial = {};
        res.data.inventory_items?.forEach(item => {
          initial[item.id || item._id] = item.stock;
        });
        setStockEdits(initial);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleStockChange = (id, val) => {
    setStockEdits(prev => ({
      ...prev,
      [id]: Math.max(0, parseInt(val) || 0)
    }));
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      const updates = Object.entries(stockEdits).map(([medicine_id, stock]) => ({
        medicine_id,
        stock
      }));
      await api.post('/admin/inventory/', { updates });
      showToast('Inventory stock updated successfully!', 'success');
      fetchInventory();
    } catch (err) {
      showToast('Failed to update inventory', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton fallbackUrl="/admin" label="Dashboard" />
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Inventory & Stock Alerts</h1>
            <p className="text-xs text-slate-500">Monitor low-stock items and perform bulk stock updates</p>
          </div>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs flex items-center gap-1.5 shrink-0"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save All Stock Updates'}
        </button>
      </div>

      {/* Low Stock Warning Banner */}
      {data.low_stock_medicines?.length > 0 && (
        <div className="p-5 rounded-3xl bg-rose-50 border border-rose-200 space-y-3">
          <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <span>Critical Low Stock Alert ({data.low_stock_medicines.length} Medicines with ≤ 15 units)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {data.low_stock_medicines.map((m) => (
              <div key={m.id || m._id} className="p-3 bg-white rounded-2xl border border-rose-200 flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-slate-900">{m.name}</p>
                  <p className="text-[11px] text-slate-500">{m.brand}</p>
                </div>
                <span className="font-black text-rose-600 bg-rose-100 px-2.5 py-1 rounded-lg">
                  {m.stock} left
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inventory Items Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-4">SKU & Name</th>
                <th className="p-4">Brand</th>
                <th className="p-4">Price</th>
                <th className="p-4">Expiry Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Update Stock Units</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.inventory_items?.map((item) => {
                const itemId = item.id || item._id;
                const currentVal = stockEdits[itemId] !== undefined ? stockEdits[itemId] : item.stock;
                const isLow = currentVal <= 10;
                return (
                  <tr key={itemId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-slate-900">{item.name}</p>
                      <span className="font-mono text-[10px] text-slate-400">{item.sku}</span>
                    </td>
                    <td className="p-4 font-semibold">{item.brand}</td>
                    <td className="p-4 font-bold text-slate-900">₹{item.selling_price}</td>
                    <td className="p-4 font-mono">{item.expiry_date || '2028-12-31'}</td>
                    <td className="p-4">
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                        currentVal === 0 ? 'bg-rose-100 text-rose-700' : isLow ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {currentVal === 0 ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <input
                        type="number"
                        min="0"
                        value={currentVal}
                        onChange={(e) => handleStockChange(itemId, e.target.value)}
                        className="w-24 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-right font-bold focus:ring-2 focus:ring-emerald-500"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
