import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Filter, Search, SlidersHorizontal, ArrowUpDown, X, Check,
  ChevronLeft, ChevronRight, AlertCircle, RefreshCw
} from 'lucide-react';
import api from '../api/client';
import MedicineCard from '../components/common/MedicineCard';
import BackButton from '../components/common/BackButton';

export default function MedicinesPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter States initialized from URL params
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get('brand') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '');
  const [prescriptionRequired, setPrescriptionRequired] = useState(searchParams.get('prescription_required') || '');
  const [inStockOnly, setInStockOnly] = useState(searchParams.get('in_stock') === 'true');
  const [sortBy, setSortBy] = useState(searchParams.get('sort_by') || 'featured');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1', 10));

  // Data States
  const [medicines, setMedicines] = useState([]);
  const [filterOptions, setFilterOptions] = useState({ categories: [], brands: [] });
  const [pagination, setPagination] = useState({ total_count: 0, page: 1, limit: 12, total_pages: 1 });
  const [loading, setLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const fetchMedicines = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (selectedCategory) params.set('category', selectedCategory);
      if (selectedBrand) params.set('brand', selectedBrand);
      if (minPrice) params.set('min_price', minPrice);
      if (maxPrice) params.set('max_price', maxPrice);
      if (prescriptionRequired) params.set('prescription_required', prescriptionRequired);
      if (inStockOnly) params.set('in_stock', 'true');
      if (sortBy) params.set('sort_by', sortBy);
      params.set('page', currentPage.toString());
      params.set('limit', '12');

      // Update browser URL
      setSearchParams(params, { replace: true });

      const res = await api.get(`/medicines/?${params.toString()}`);
      setMedicines(res.data?.medicines || []);
      setPagination(res.data?.pagination || { total_count: 0, page: 1, limit: 12, total_pages: 1 });
      if (res.data?.filters) {
        setFilterOptions(res.data.filters);
      }
    } catch (err) {
      console.error('Failed to fetch medicines:', err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, selectedBrand, minPrice, maxPrice, prescriptionRequired, inStockOnly, sortBy, currentPage, setSearchParams]);

  useEffect(() => {
    fetchMedicines();
  }, [fetchMedicines]);

  // Sync state if URL query params change externally
  useEffect(() => {
    const urlCategory = searchParams.get('category');
    if (urlCategory !== null && urlCategory !== selectedCategory) {
      setSelectedCategory(urlCategory);
      setCurrentPage(1);
    }
    const urlSearch = searchParams.get('search');
    if (urlSearch !== null && urlSearch !== search) {
      setSearch(urlSearch);
      setCurrentPage(1);
    }
  }, [searchParams]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedBrand('');
    setMinPrice('');
    setMaxPrice('');
    setPrescriptionRequired('');
    setInStockOnly(false);
    setSortBy('featured');
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(
    search || selectedCategory || selectedBrand || minPrice || maxPrice || prescriptionRequired || inStockOnly
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-4">
          <BackButton fallbackUrl="/" label="Back" />
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Medicine Catalog</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing {pagination.total_count} certified medicines {selectedCategory ? `in ${selectedCategory}` : ''}
            </p>
          </div>
        </div>

        {/* Sort & Mobile Filter Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="md:hidden flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200"
          >
            <Filter className="w-4 h-4" />
            Filters {hasActiveFilters && '(Active)'}
          </button>

          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
              className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="featured">Sort: Featured</option>
              <option value="price_low">Price: Low → High</option>
              <option value="price_high">Price: High → Low</option>
              <option value="rating">Highest Rating</option>
              <option value="discount">Biggest Discount</option>
              <option value="name_asc">Name: A to Z</option>
              <option value="newest">Newly Added</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
        
        {/* Sidebar Filters (Desktop) */}
        <aside className="hidden md:block bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-6 sticky top-28">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
              Filter Medicines
            </h3>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
              >
                Reset
              </button>
            )}
          </div>

          {/* Search Input Filter */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Keyword Search</label>
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                placeholder="Name, salt, brand..."
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
            >
              <option value="">All Categories</option>
              {filterOptions.categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Brand Filter */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Manufacturer / Brand</label>
            <select
              value={selectedBrand}
              onChange={(e) => { setSelectedBrand(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
            >
              <option value="">All Brands</option>
              {filterOptions.brands.map((brand) => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>

          {/* Price Range Filter */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Price Range (₹)</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={minPrice}
                onChange={(e) => { setMinPrice(e.target.value); setCurrentPage(1); }}
                placeholder="Min ₹"
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800"
              />
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => { setMaxPrice(e.target.value); setCurrentPage(1); }}
                placeholder="Max ₹"
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800"
              />
            </div>
          </div>

          {/* Prescription Required Toggle */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Prescription Type</label>
            <div className="space-y-1.5 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="rx_req"
                  checked={prescriptionRequired === ''}
                  onChange={() => { setPrescriptionRequired(''); setCurrentPage(1); }}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-slate-700">All Products</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="rx_req"
                  checked={prescriptionRequired === 'false'}
                  onChange={() => { setPrescriptionRequired('false'); setCurrentPage(1); }}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-slate-700">OTC (No Rx Needed)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="rx_req"
                  checked={prescriptionRequired === 'true'}
                  onChange={() => { setPrescriptionRequired('true'); setCurrentPage(1); }}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-slate-700">Prescription Required (Rx)</span>
              </label>
            </div>
          </div>

          {/* In Stock Only Checkbox */}
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => { setInStockOnly(e.target.checked); setCurrentPage(1); }}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>In Stock Only</span>
            </label>
          </div>
        </aside>

        {/* Medicines Grid & Pagination */}
        <main className="md:col-span-3 space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 h-80 animate-pulse flex flex-col justify-between">
                  <div className="bg-slate-200 rounded-xl h-44 w-full" />
                  <div className="space-y-2 mt-4">
                    <div className="bg-slate-200 rounded h-4 w-3/4" />
                    <div className="bg-slate-200 rounded h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : medicines.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No medicines found matching your criteria</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try adjusting your search terms, removing filters, or searching by active generic salt names.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors inline-flex items-center gap-2 shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Clear All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {medicines.map((med) => (
                  <MedicineCard key={med.id || med._id} medicine={med} />
                ))}
              </div>

              {/* Pagination Stepper with Previous and Next navigation */}
              {pagination.total_pages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500 order-2 sm:order-1">
                    Showing Page <strong className="text-slate-900">{pagination.page}</strong> of <strong className="text-slate-900">{pagination.total_pages}</strong> ({pagination.total_count} total medicines)
                  </span>
                  
                  <div className="flex items-center gap-2 order-1 sm:order-2 w-full sm:w-auto justify-between sm:justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        if (pagination.page > 1) {
                          setCurrentPage(p => Math.max(1, p - 1));
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      disabled={pagination.page <= 1}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 disabled:opacity-40 disabled:hover:bg-transparent transition-all shadow-2xs"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Previous</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {[...Array(pagination.total_pages)].map((_, i) => {
                        const pNum = i + 1;
                        return (
                          <button
                            key={pNum}
                            type="button"
                            onClick={() => {
                              setCurrentPage(pNum);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className={`w-8 h-8 rounded-xl font-bold text-xs transition-colors ${
                              pagination.page === pNum
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-700 hover:bg-slate-100 border border-slate-100'
                            }`}
                          >
                            {pNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (pagination.page < pagination.total_pages) {
                          setCurrentPage(p => Math.min(pagination.total_pages, p + 1));
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      disabled={pagination.page >= pagination.total_pages}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 disabled:opacity-40 disabled:hover:bg-transparent transition-all shadow-2xs"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile Filter Modal */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end md:hidden">
          <div className="w-80 max-w-full bg-white h-full p-6 space-y-6 overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Filters</h3>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile filter controls */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
              >
                <option value="">All Categories</option>
                {filterOptions.categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Manufacturer</label>
              <select
                value={selectedBrand}
                onChange={(e) => { setSelectedBrand(e.target.value); setCurrentPage(1); }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
              >
                <option value="">All Brands</option>
                {filterOptions.brands.map((brand) => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => { setMobileFilterOpen(false); fetchMedicines(); }}
              className="w-full py-3 bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
