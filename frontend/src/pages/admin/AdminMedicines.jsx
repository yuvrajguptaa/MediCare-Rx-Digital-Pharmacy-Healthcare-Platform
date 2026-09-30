import React, { useState, useEffect, useRef } from 'react';
import {
  Pill, Plus, Edit2, Trash2, Search, CheckCircle2,
  AlertCircle, X, ArrowUpDown, ExternalLink, Image as ImageIcon,
  Upload, Download, FileSpreadsheet, ChevronLeft, ChevronRight,
  RotateCcw, Check, Loader2, AlertTriangle, FileText, Info
} from 'lucide-react';
import api from '../../api/client';
import { useNotifications } from '../../context/NotificationContext';
import BackButton from '../../components/common/BackButton';

export default function AdminMedicines() {
  const { showToast } = useNotifications();
  
  // Data & Pagination
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState([]);

  // Server-Side Search & Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [rxFilter, setRxFilter] = useState('All');
  const [stockFilter, setStockFilter] = useState('All');

  // Single Add / Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    generic_name: '',
    brand: 'Cipla',
    category: 'Antibiotics & Anti-Infectives',
    description: '',
    uses: '',
    ingredients: '',
    dosage_form: 'Tablet',
    strength: '500 mg',
    mrp: 100,
    selling_price: 85,
    stock: 50,
    manufacturer: 'Cipla Ltd',
    prescription_required: false,
    expiry_date: '2028-12-31',
    image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500',
    images: ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500']
  });

  // Bulk CSV Upload State
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [duplicateMode, setDuplicateMode] = useState('skip'); // 'skip' | 'update'
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch medicines whenever page, limit, or filters change
  useEffect(() => {
    fetchMedicines(page);
  }, [page, limit, debouncedSearch, categoryFilter, rxFilter, stockFilter]);

  const fetchMedicines = (targetPage = page) => {
    setLoading(true);
    const params = new URLSearchParams({
      page: targetPage,
      limit: limit,
    });
    if (debouncedSearch.trim()) params.append('search', debouncedSearch.trim());
    if (categoryFilter && categoryFilter !== 'All') params.append('category', categoryFilter);
    if (rxFilter !== 'All') params.append('prescription_required', rxFilter);
    if (stockFilter !== 'All') params.append('stock_filter', stockFilter);

    api.get(`/admin/medicines/?${params.toString()}`)
      .then(res => {
        const list = res.data?.medicines || [];
        setMedicines(list);
        const totalCount = res.data?.total ?? res.data?.pagination?.total ?? list.length;
        const totalP = res.data?.totalPages ?? res.data?.pagination?.totalPages ?? 1;
        setTotal(totalCount);
        setTotalPages(Math.max(1, totalP));
        if (res.data?.categories?.length) {
          setCategories(res.data.categories);
        }
      })
      .catch(err => {
        console.error(err);
        showToast('Failed to load medicines catalog', 'error');
      })
      .finally(() => setLoading(false));
  };

  const resetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setCategoryFilter('All');
    setRxFilter('All');
    setStockFilter('All');
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    debouncedSearch.trim() ||
    (categoryFilter && categoryFilter !== 'All') ||
    rxFilter !== 'All' ||
    stockFilter !== 'All'
  );

  // Single Add / Edit Handlers
  const handleOpenAdd = () => {
    setEditingMed(null);
    setFormData({
      name: '',
      generic_name: '',
      brand: 'Cipla',
      category: categories[0] || 'Antibiotics & Anti-Infectives',
      description: '',
      uses: '',
      ingredients: '',
      dosage_form: 'Tablet',
      strength: '500 mg',
      mrp: 100,
      selling_price: 85,
      stock: 50,
      manufacturer: 'Cipla Ltd',
      prescription_required: false,
      expiry_date: '2028-12-31',
      image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500',
      images: ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500']
    });
    setShowModal(true);
  };

  const handleOpenEdit = (med) => {
    setEditingMed(med);
    const mainImg = (Array.isArray(med.images) && med.images.length > 0)
      ? med.images[0]
      : (med.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500');
    setFormData({
      name: med.name || '',
      generic_name: med.generic_name || '',
      brand: med.brand || '',
      category: med.category || '',
      description: med.description || '',
      uses: med.uses || '',
      ingredients: med.ingredients || '',
      dosage_form: med.dosage_form || 'Tablet',
      strength: med.strength || '',
      mrp: med.mrp || 0,
      selling_price: med.selling_price || 0,
      stock: med.stock || 0,
      manufacturer: med.manufacturer || '',
      prescription_required: Boolean(med.prescription_required),
      expiry_date: med.expiry_date || '',
      image_url: mainImg,
      images: med.images?.length ? med.images : [mainImg]
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const imgList = formData.image_url?.trim()
        ? [formData.image_url.trim()]
        : (formData.images?.length ? formData.images : ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500']);
      const payload = {
        ...formData,
        images: imgList
      };
      if (editingMed) {
        const medId = editingMed.id || editingMed._id;
        await api.put(`/admin/medicines/${medId}/`, payload);
        showToast('Medicine updated successfully!', 'success');
      } else {
        await api.post('/admin/medicines/', payload);
        showToast('Medicine added to catalog!', 'success');
      }
      setShowModal(false);
      fetchMedicines(page);
    } catch (err) {
      showToast(err.response?.data?.error || 'Operation failed', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate/Delete this medicine?')) return;
    try {
      await api.delete(`/admin/medicines/${id}/`);
      showToast('Medicine deactivated.', 'info');
      fetchMedicines(page);
    } catch (err) {
      showToast('Failed to delete medicine', 'error');
    }
  };

  // Bulk CSV Handlers
  const handleDownloadTemplate = () => {
    // Generate CSV client-side as well for instant, fail-proof download
    const csvContent =
      "medicineName,description,activeSalt,category,brand,sellingPrice,mrp,stockQuantity,prescriptionRequired,image\n" +
      "Paracetamol 650,Used for fever and pain relief,Paracetamol 650mg,Pain Relief & Analgesics,Micro Labs,29,34,295,false,https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500\n" +
      "Augmentin 625 Duo,Antibiotic for bacterial infections,Amoxicillin 500mg + Clavulanic Acid 125mg,Antibiotics & Anti-Infectives,GlaxoSmithKline,198,220,100,true,https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=500\n";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'medicine_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('CSV Template downloaded!', 'success');
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        setUploadError('Please select a valid CSV file (.csv format only).');
        setCsvFile(null);
        return;
      }
      setCsvFile(file);
      setUploadError('');
      setUploadResult(null);
    }
  };

  const handleBulkUploadSubmit = async (e) => {
    e.preventDefault();
    if (!csvFile) {
      setUploadError('Please choose a CSV file to upload.');
      return;
    }

    setUploading(true);
    setUploadError('');
    setUploadResult(null);
    setUploadProgress(25);

    try {
      const data = new FormData();
      data.append('file', csvFile);
      data.append('on_duplicate', duplicateMode);

      setUploadProgress(60);
      const res = await api.post('/admin/medicines/bulk-upload/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setUploadProgress(100);
      const resData = res.data;
      setUploadResult(resData);
      showToast(resData.message || 'CSV bulk upload processed!', 'success');
      // Refresh inventory list
      fetchMedicines(1);
      setPage(1);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Bulk upload failed. Please verify your CSV format.';
      setUploadError(msg);
      showToast(msg, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleCloseBulkModal = () => {
    setShowBulkModal(false);
    setCsvFile(null);
    setUploadResult(null);
    setUploadError('');
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton fallbackUrl="/admin" label="Dashboard" />
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Medicine Inventory</h1>
            <p className="text-xs text-slate-500">
              Manage medicine details, stock levels, and prescription requirements ({total.toLocaleString()} total medicines)
            </p>
          </div>
        </div>

        {/* Action Buttons: [ + Add Medicine ] [ ↑ Bulk Upload ] */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Medicine
          </button>

          <button
            onClick={() => {
              setUploadResult(null);
              setUploadError('');
              setCsvFile(null);
              setShowBulkModal(true);
            }}
            className="px-4 py-2.5 bg-white hover:bg-emerald-50 active:scale-95 text-slate-800 hover:text-emerald-700 font-bold text-xs uppercase tracking-wider rounded-xl border border-slate-200/90 shadow-xs flex items-center gap-1.5 transition-all"
          >
            <Upload className="w-4 h-4 text-emerald-600" /> Bulk Upload
          </button>
        </div>
      </div>

      {/* Search & Multi-Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* Search bar */}
          <div className="lg:col-span-2 relative flex items-center bg-slate-50 rounded-2xl border border-slate-200 px-3 py-2">
            <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, active salt, brand..."
              className="w-full bg-transparent border-0 text-xs focus:ring-0 text-slate-900 placeholder:text-slate-400 p-0"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600 ml-1">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs font-medium text-slate-700 focus:ring-emerald-500"
            >
              <option value="All">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Rx Filter */}
          <div>
            <select
              value={rxFilter}
              onChange={(e) => { setRxFilter(e.target.value); setPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs font-medium text-slate-700 focus:ring-emerald-500"
            >
              <option value="All">All Rx Types</option>
              <option value="false">OTC (No Rx)</option>
              <option value="true">Prescription Required (Rx)</option>
            </select>
          </div>

          {/* Stock Filter */}
          <div>
            <select
              value={stockFilter}
              onChange={(e) => { setStockFilter(e.target.value); setPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs font-medium text-slate-700 focus:ring-emerald-500"
            >
              <option value="All">All Stock Levels</option>
              <option value="in">In Stock (&gt; 0)</option>
              <option value="low">Low Stock (≤ 15)</option>
              <option value="out">Out of Stock (0)</option>
            </select>
          </div>

        </div>

        {/* Filter status strip & reset */}
        <div className="flex items-center justify-between text-xs pt-1 px-1 border-t border-slate-100">
          <div className="text-slate-500">
            Found <span className="font-bold text-slate-900">{total.toLocaleString()}</span> medicines
            {debouncedSearch && <span className="ml-1 text-emerald-700 font-semibold">matching &ldquo;{debouncedSearch}&rdquo;</span>}
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 hover:underline"
            >
              <RotateCcw className="w-3 h-3" /> Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Medicines Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
              <p className="text-xs font-semibold text-slate-500">Loading catalog medicines...</p>
            </div>
          ) : medicines.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <Pill className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-800">No medicines found</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No medicines match your current search and filter criteria. Try adjusting filters or import records via CSV.
              </p>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Medicine & Active Salt</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Brand</th>
                  <th className="p-4">Image Link</th>
                  <th className="p-4">Selling Price</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4">Rx Type</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {medicines.map((med) => {
                  const medId = med.id || med._id;
                  const imgUrl = (Array.isArray(med.images) && med.images.length > 0) ? med.images[0] : (med.image || '');
                  return (
                    <tr key={medId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={imgUrl || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100'}
                            alt={med.name}
                            className="w-10 h-10 object-cover rounded-xl border border-slate-200 shrink-0"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100';
                            }}
                          />
                          <div>
                            <p className="font-bold text-slate-900 text-xs">{med.name}</p>
                            <p className="text-[11px] text-slate-500">{med.generic_name} {med.strength && `(${med.strength})`}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-medium">{med.category}</td>
                      <td className="p-4 font-bold text-emerald-800">{med.brand}</td>
                      <td className="p-4 max-w-[170px]">
                        {imgUrl ? (
                          <a
                            href={imgUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={imgUrl}
                            className="inline-flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 font-mono text-[11px] truncate max-w-full hover:underline group"
                          >
                            <ExternalLink className="w-3 h-3 shrink-0 group-hover:scale-110 transition-transform" />
                            <span className="truncate">{imgUrl}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">No image link</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-slate-900">₹{med.selling_price}</span>
                        {med.mrp > med.selling_price && (
                          <span className="text-[10px] text-slate-400 line-through block">₹{med.mrp}</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`font-black ${med.stock === 0 ? 'text-rose-600' : med.stock <= 15 ? 'text-amber-600' : 'text-slate-900'}`}>
                          {med.stock} units
                        </span>
                      </td>
                      <td className="p-4">
                        {med.prescription_required ? (
                          <span className="text-[10px] font-extrabold bg-rose-100 text-rose-700 px-2 py-0.5 rounded uppercase">
                            Rx Required
                          </span>
                        ) : (
                          <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded uppercase">
                            OTC
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(med)}
                            title="Edit Medicine"
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(medId)}
                            title="Delete Medicine"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Server-Side Pagination Bar */}
        {!loading && total > 0 && (
          <div className="p-4 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            
            {/* Limit Selector & Summary */}
            <div className="flex items-center gap-3">
              <span className="text-slate-500">
                Showing <strong className="text-slate-900">{Math.min((page - 1) * limit + 1, total)}</strong> to{' '}
                <strong className="text-slate-900">{Math.min(page * limit, total)}</strong> of{' '}
                <strong className="text-slate-900">{total.toLocaleString()}</strong> medicines
              </span>

              <div className="flex items-center gap-1.5 text-slate-500 pl-3 border-l border-slate-200">
                <span>Per page:</span>
                <select
                  value={limit}
                  onChange={(e) => { setLimit(parseInt(e.target.value)); setPage(1); }}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700"
                >
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(1)}
                disabled={page <= 1}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-bold hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none"
              >
                First
              </button>

              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-bold hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Page Pill Indicators */}
              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .map((p, idx, arr) => {
                    const prevP = arr[idx - 1];
                    const showEllipsis = prevP && p - prevP > 1;
                    return (
                      <React.Fragment key={p}>
                        {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                        <button
                          onClick={() => setPage(p)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                            page === p
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-bold hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none"
                aria-label="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setPage(totalPages)}
                disabled={page >= totalPages}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-bold hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none"
              >
                Last
              </button>
            </div>

          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* BULK CSV UPLOAD MODAL */}
      {/* ========================================================= */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-6 max-h-[92vh] overflow-y-auto animate-fade-in shadow-2xl">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900 tracking-tight">Bulk Upload Medicines</h3>
                  <p className="text-xs text-slate-500">Upload CSV containing thousands of medicine catalog records</p>
                </div>
              </div>
              <button
                onClick={handleCloseBulkModal}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Step 1: Download CSV Template */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-xs text-slate-900">1. Download CSV Template</h4>
                  <p className="text-[11px] text-slate-500">
                    Use our standard format with required column headers &amp; sample medicine rows.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-4 py-2 bg-white hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800 border border-emerald-200 font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 shrink-0 transition-colors"
              >
                <Download className="w-4 h-4" /> Download Template
              </button>
            </div>

            {/* Step 2: Choose CSV File */}
            <form onSubmit={handleBulkUploadSubmit} className="space-y-5">
              <div>
                <label className="font-bold text-xs text-slate-700 block mb-1.5">
                  2. Choose CSV File
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
                    csvFile
                      ? 'border-emerald-500 bg-emerald-50/40'
                      : 'border-slate-300 hover:border-emerald-400 bg-slate-50/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {csvFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
                      <div className="text-left">
                        <p className="font-bold text-xs text-slate-900">{csvFile.name}</p>
                        <p className="text-[11px] text-slate-500">{(csvFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCsvFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="ml-3 text-xs font-bold text-rose-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="text-xs font-bold text-slate-700">Click to browse or drag and drop your CSV file here</p>
                      <p className="text-[11px] text-slate-400">Supports UTF-8 CSV files up to 15 MB</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 3: Duplicate Handling Strategy */}
              <div>
                <label className="font-bold text-xs text-slate-700 block mb-1.5">
                  3. Duplicate Detection Strategy (Name + Active Salt + Brand)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className={`p-3 rounded-2xl border text-xs font-semibold flex items-start gap-2.5 cursor-pointer transition-all ${
                    duplicateMode === 'skip' ? 'border-emerald-500 bg-emerald-50/50 text-slate-900' : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}>
                    <input
                      type="radio"
                      name="dupMode"
                      value="skip"
                      checked={duplicateMode === 'skip'}
                      onChange={() => setDuplicateMode('skip')}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <p className="font-bold text-slate-900">Skip Duplicates (Recommended)</p>
                      <p className="text-[11px] text-slate-500 font-normal">Ignores duplicates to prevent creating redundant records.</p>
                    </div>
                  </label>

                  <label className={`p-3 rounded-2xl border text-xs font-semibold flex items-start gap-2.5 cursor-pointer transition-all ${
                    duplicateMode === 'update' ? 'border-emerald-500 bg-emerald-50/50 text-slate-900' : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}>
                    <input
                      type="radio"
                      name="dupMode"
                      value="update"
                      checked={duplicateMode === 'update'}
                      onChange={() => setDuplicateMode('update')}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <p className="font-bold text-slate-900">Update Existing Records</p>
                      <p className="text-[11px] text-slate-500 font-normal">Updates price, stock, and info for matching medicines.</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Error banner */}
              {uploadError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <div>
                    <strong className="block font-bold">Upload Error:</strong>
                    <span>{uploadError}</span>
                  </div>
                </div>
              )}

              {/* Step 4: Upload Action & Progress State */}
              {uploading && (
                <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                      Parsing and validating medicines on server...
                    </span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-emerald-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-emerald-700">Using bulkWrite operations for high-speed MongoDB indexing.</p>
                </div>
              )}

              {/* Step 5: Import Result Display */}
              {uploadResult && (
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <h4 className="font-black text-xs uppercase tracking-wider text-slate-700">Import Summary Result</h4>
                  
                  {/* 4 Cards: Total, Imported, Skipped, Failed */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Total Records</span>
                      <span className="text-xl font-black text-slate-900">{uploadResult.total_records ?? uploadResult.summary?.total_records ?? 0}</span>
                    </div>

                    <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200">
                      <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider block">Imported</span>
                      <span className="text-xl font-black text-emerald-700 flex items-center justify-center gap-1">
                        <Check className="w-4 h-4" /> {uploadResult.successfully_imported ?? uploadResult.summary?.successfully_imported ?? 0}
                      </span>
                    </div>

                    <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200">
                      <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider block">Skipped</span>
                      <span className="text-xl font-black text-amber-700">{uploadResult.skipped ?? uploadResult.summary?.skipped ?? 0}</span>
                    </div>

                    <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200">
                      <span className="text-[10px] font-black uppercase text-rose-700 tracking-wider block">Failed</span>
                      <span className="text-xl font-black text-rose-700">{uploadResult.failed ?? uploadResult.summary?.failed ?? 0}</span>
                    </div>

                  </div>

                  {/* Failed rows detailed list */}
                  {uploadResult.failed_rows?.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Failed Rows &amp; Validation Errors ({uploadResult.failed_rows.length})</span>
                      </div>
                      <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-3 max-h-48 overflow-y-auto font-mono text-[11px] text-rose-900 space-y-1">
                        {uploadResult.failed_rows.map((rowErr, i) => (
                          <div key={i} className="flex items-start gap-1.5">
                            <span className="text-rose-400 select-none">•</span>
                            <span>{typeof rowErr === 'string' ? rowErr : `Row ${rowErr.row} - ${rowErr.errors?.join(', ')}`}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseBulkModal}
                  className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  {uploadResult ? 'Close' : 'Cancel'}
                </button>

                {uploadResult ? (
                  <button
                    type="button"
                    onClick={handleCloseBulkModal}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-colors"
                  >
                    Done &amp; View Catalog
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={uploading || !csvFile}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 disabled:pointer-events-none text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs flex items-center gap-2 transition-all"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" /> Start Bulk Import
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ADD / EDIT MEDICINE MODAL */}
      {/* ========================================================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-4 max-h-[90vh] overflow-y-auto animate-fade-in shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                {editingMed ? 'Edit Medicine Details' : 'Add New Medicine to Catalog'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Medicine Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Generic Active Salt *</label>
                  <input
                    type="text"
                    value={formData.generic_name}
                    onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Brand / Company *</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category *</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">MRP (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.mrp}
                    onChange={(e) => setFormData({ ...formData, mrp: parseFloat(e.target.value) || 0 })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: parseFloat(e.target.value) || 0 })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Stock Units *</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Dosage Form &amp; Strength</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={formData.dosage_form}
                      onChange={(e) => setFormData({ ...formData, dosage_form: e.target.value })}
                      placeholder="Tablet / Syrup / Gel"
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                    />
                    <input
                      type="text"
                      value={formData.strength}
                      onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                      placeholder="500 mg / 100 ml"
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              {/* Image Link (URL) with live preview */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Image Link (URL)
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input
                      type="url"
                      value={formData.image_url}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({
                          ...formData,
                          image_url: val,
                          images: val ? [val] : []
                        });
                      }}
                      placeholder="https://images.unsplash.com/... or direct image URL"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                    />
                  </div>
                  {formData.image_url ? (
                    <div className="w-10 h-10 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 shrink-0 shadow-2xs">
                      <img
                        src={formData.image_url}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl border border-dashed border-slate-300 flex items-center justify-center bg-slate-50 text-slate-400 shrink-0">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Direct web image link (JPG, PNG, WebP) to display as the medicine photo.</p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Product Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              {/* Prescription Required Checkbox */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={formData.prescription_required}
                    onChange={(e) => setFormData({ ...formData, prescription_required: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Prescription Required (Rx) to purchase this medicine</span>
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  {editingMed ? 'Update Medicine' : 'Save Medicine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
