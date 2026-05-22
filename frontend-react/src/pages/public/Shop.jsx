import React, { useState, useEffect } from 'react';
import { Filter, SlidersHorizontal, Search as SearchIcon, Upload, Phone, AlertCircle, RotateCcw, X } from 'lucide-react';
import api from '../../services/api';
import ProductGrid from '../../components/product/ProductGrid';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import ErrorState from '../../components/common/ErrorState';
import Badge from '../../components/common/Badge';
import { unwrapData } from '../../utils/apiData';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { language, t } = useLanguage();
  
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  // Filters state
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    search: searchParams.get('search') || '',
    prescriptionRequired: searchParams.get('prescriptionRequired') || '',
    inStock: searchParams.get('inStock') === 'true',
    sort: searchParams.get('sort') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || ''
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        setCategories(unwrapData(res, []));
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError('');
        
        const params = { 
          limit: 24, 
          page: pagination.page,
          ...filters
        };
        
        // Remove empty filters
        Object.keys(params).forEach(key => {
          if (params[key] === '' || params[key] === null || params[key] === false) {
            delete params[key];
          }
        });

        const res = await api.get('/products', { params });
        const newProducts = unwrapData(res, []);
        
        if (pagination.page === 1) {
          setProducts(newProducts);
        } else {
          setProducts(prev => [...prev, ...newProducts]);
        }
        
        if (res.data?.pagination) {
          setPagination(prev => ({ ...prev, totalPages: res.data.pagination.totalPages }));
        }
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Products could not be loaded.');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
    
    // Update URL params
    const urlParams = new URLSearchParams();
    if (filters.category) urlParams.set('category', filters.category);
    if (filters.search) urlParams.set('search', filters.search);
    if (filters.prescriptionRequired) urlParams.set('prescriptionRequired', filters.prescriptionRequired);
    if (filters.inStock) urlParams.set('inStock', 'true');
    if (filters.sort) urlParams.set('sort', filters.sort);
    if (filters.minPrice) urlParams.set('minPrice', filters.minPrice);
    if (filters.maxPrice) urlParams.set('maxPrice', filters.maxPrice);
    setSearchParams(urlParams, { replace: true });
    
  }, [filters, pagination.page, setSearchParams]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleWhatsAppOrder = () => {
    const message = encodeURIComponent("Hello Medicine Bazar, I'd like to ask about medicine availability.");
    window.open(`https://wa.me/8801602444532?text=${message}`, '_blank');
  };

  const handleUploadPrescription = () => {
    window.location.href = '/prescription-upload';
  };

  return (
    <div className="healthcare-page py-6 sm:py-10">
      <div className="premium-container">
        
        {/* Breadcrumb / Section Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] mb-3">
            <span>{t('common.home') || 'Home'}</span>
            <span>•</span>
            <span className="text-[var(--color-primary)]">{t('common.shop') || 'Shop'}</span>
            {filters.category && (
              <>
                <span>•</span>
                <span className="text-slate-700">{filters.category}</span>
              </>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-800 leading-tight">
                {filters.category 
                  ? (language === 'bn' ? `${filters.category} গ্যালারি` : `${filters.category} Collection`)
                  : (language === 'bn' ? 'সব ওষুধ গ্যালারি' : 'Digital Pharmacy Shop')}
              </h1>
              <p className="text-sm text-[var(--color-muted)] mt-1.5">
                {language === 'bn' 
                  ? 'নিরাপদ, অথেনটিক এবং ড্রাগ অ্যাডভাইজরি টিম দ্বারা রিভিউড মেডিসিন ক্যাটালগ।' 
                  : 'Authentic prescription & OTC drugs curated under strict pharmacist evaluation.'}
              </p>
            </div>
            
            {/* Quick Stats */}
            <div className="hidden lg:flex items-center gap-4 bg-white/70 backdrop-blur-md px-5 py-3 rounded-2xl border border-[var(--color-primary)]/10 shadow-sm">
              <div className="text-center px-4 border-r border-slate-100">
                <span className="text-xs text-[var(--color-muted)] font-bold block uppercase tracking-wider">Fast Courier</span>
                <span className="text-sm font-bold text-slate-800">Inside Dhaka</span>
              </div>
              <div className="text-center px-4">
                <span className="text-xs text-[var(--color-muted)] font-bold block uppercase tracking-wider">Pharmacist Checked</span>
                <span className="text-sm font-bold text-[var(--color-primary)]">100% Genuine</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Category Chips Row */}
        <div className="mb-8 overflow-x-auto pb-3 flex gap-2 scrollbar-thin">
          <button
            onClick={() => handleFilterChange('category', '')}
            className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
              filters.category === ''
                ? 'cta-gradient text-white shadow-md shadow-emerald-500/10'
                : 'bg-white/80 border border-slate-100 text-slate-600 hover:border-[var(--color-primary)]/20 hover:text-[var(--color-primary)]'
            }`}
          >
            {language === 'en' ? 'All Categories' : 'সব ওষুধ ও ক্যাটাগরি'}
          </button>
          {categories.map((cat) => {
            const isSelected = filters.category === cat.slug || filters.category === cat.name;
            return (
              <button
                key={cat.id || cat._id}
                onClick={() => handleFilterChange('category', cat.slug || cat.name)}
                className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'cta-gradient text-white shadow-md shadow-emerald-500/10'
                    : 'bg-white/80 border border-slate-100 text-slate-600 hover:border-[var(--color-primary)]/20 hover:text-[var(--color-primary)]'
                }`}
              >
                {language === 'bn' && cat.nameBn ? cat.nameBn : cat.name}
              </button>
            );
          })}
        </div>

        {/* Main Grid Wrapper */}
        <div className="flex flex-col md:flex-row gap-8 relative">
          
          {/* Mobile Filter & Sort Bar */}
          <div className="md:hidden flex gap-3 w-full shrink-0 z-10">
            <button
              onClick={() => setShowFilters(true)}
              className="flex-1 bg-white/80 backdrop-blur-md py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm pressable"
            >
              <Filter size={18} className="text-[var(--color-primary)]" />
              {language === 'en' ? 'Refine Filters' : 'ফিল্টারসমূহ'}
            </button>
            
            <div className="flex-1 relative">
              <select 
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="w-full bg-white/80 backdrop-blur-md py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm focus:outline-none focus:border-[var(--color-primary)] cursor-pointer shadow-sm appearance-none"
              >
                <option value="">{language === 'en' ? 'Relevance' : 'প্রাসঙ্গিকতা'}</option>
                <option value="sellingPrice:asc">{language === 'en' ? 'Price: Low to High' : 'দাম: কম থেকে বেশি'}</option>
                <option value="sellingPrice:desc">{language === 'en' ? 'Price: High to Low' : 'দাম: বেশি থেকে কম'}</option>
              </select>
            </div>
          </div>

          {/* Mobile Drawer Overlay Backdrop */}
          {showFilters && (
            <div 
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden animate-fade-in"
              onClick={() => setShowFilters(false)}
            />
          )}

          {/* Sidebar Filters Widget / Slide-out Mobile Drawer */}
          <aside className={`fixed inset-y-0 left-0 w-80 bg-white z-50 p-6 shadow-2xl overflow-y-auto border-r border-slate-100 transition-transform duration-300 ease-out md:static md:w-72 md:p-0 md:bg-transparent md:shadow-none md:border-0 md:h-auto md:overflow-visible ${
            showFilters ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}>
            <div className="bg-white/95 backdrop-blur-lg p-6 rounded-[24px] border border-[var(--color-primary)]/10 shadow-lg md:shadow-emerald-950/5 sticky top-24 space-y-6">
              
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <span className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                  <SlidersHorizontal size={18} className="text-[var(--color-primary)]" />
                  {language === 'en' ? 'Filter Directory' : 'পণ্য ফিল্টার করুন'}
                </span>
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => {
                      setFilters({ category: '', search: '', prescriptionRequired: '', inStock: false, sort: '', minPrice: '', maxPrice: '' });
                      setPagination({ page: 1, totalPages: 1 });
                    }}
                    className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <RotateCcw size={12} />
                    {language === 'en' ? 'Reset All' : 'মুছে ফেলুন'}
                  </button>
                  <button 
                    onClick={() => setShowFilters(false)}
                    className="md:hidden p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Keyword Search Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">{language === 'en' ? 'Search Keyword' : 'অনুসন্ধান করুন'}</label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder={t('common.searchPlaceholder')} 
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] focus:bg-white transition-all font-medium"
                  />
                  <SearchIcon size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                </div>
              </div>

              {/* Price Filter range */}
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">{language === 'en' ? 'Price Range (৳)' : 'মূল্যসীমা (৳)'}</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    placeholder={language === 'en' ? 'Min' : 'সর্বনিম্ন'}
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]"
                  />
                  <span className="text-slate-400 text-xs">-</span>
                  <input 
                    type="number" 
                    placeholder={language === 'en' ? 'Max' : 'সর্বোচ্চ'}
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]"
                  />
                </div>
              </div>

              {/* Prescription Type */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">{language === 'en' ? 'Prescription Rule' : 'প্রেসক্রিপশন বিধি'}</label>
                <div className="space-y-2.5">
                  {[
                    { id: '', en: 'All Medicines', bn: 'সব ধরনের ওষুধ' },
                    { id: 'true', en: 'Rx Prescription Only', bn: 'শুধু প্রেসক্রিপশন-অনলি' },
                    { id: 'false', en: 'OTC Non-Rx Medicines', bn: 'ওটিসি (OTC) ওষুধ' }
                  ].map(option => (
                    <label key={option.id} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="radio" 
                        name="prescriptionRequired"
                        checked={filters.prescriptionRequired === option.id}
                        onChange={() => handleFilterChange('prescriptionRequired', option.id)}
                        className="w-4 h-4 text-[var(--color-primary)] focus:ring-[var(--color-primary)]/20 border-slate-300 bg-slate-50" 
                      />
                      <span className="text-slate-600 text-sm font-medium group-hover:text-slate-800 transition-colors">
                        {language === 'bn' ? option.bn : option.en}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Availability Toggle */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">{language === 'en' ? 'Availability' : 'সহজলভ্যতা'}</label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={filters.inStock}
                    onChange={(e) => handleFilterChange('inStock', e.target.checked)}
                    className="w-4 h-4 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)]/20 border-slate-300 bg-slate-50 animate-soft-scale" 
                  />
                  <span className="text-slate-600 text-sm font-medium group-hover:text-slate-800 transition-colors">
                    {language === 'en' ? 'In Stock Only' : 'শুধু স্টকে আছে'}
                  </span>
                </label>
              </div>

            </div>
          </aside>

          {/* Main Collection Board */}
          <main className="flex-1 space-y-6">
            
            {/* Top Stats Bar */}
            <div className="bg-white/80 backdrop-blur-md px-6 py-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-4 hidden md:flex">
              <span className="text-slate-700 font-extrabold text-sm">
                {filters.category ? filters.category : (language === 'en' ? 'All Products' : 'সব ওষুধ ও স্বাস্থ্যপণ্য')}
                {filters.search && ` matched for "${filters.search}"`}
              </span>
              
              <div className="flex items-center gap-3">
                <span className="text-xs text-[var(--color-muted)] font-bold uppercase tracking-wider">{language === 'en' ? 'Sort by' : 'সাজানোর নিয়ম'}:</span>
                <select 
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="border border-slate-200 bg-slate-50/60 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-[var(--color-primary)] focus:bg-white cursor-pointer transition-all"
                >
                  <option value="">{language === 'en' ? 'Relevance' : 'প্রাসঙ্গিকতা'}</option>
                  <option value="sellingPrice:asc">{language === 'en' ? 'Price: Low to High' : 'মূল্য: কম থেকে বেশি'}</option>
                  <option value="sellingPrice:desc">{language === 'en' ? 'Price: High to Low' : 'মূল্য: বেশি থেকে কম'}</option>
                  <option value="name:asc">{language === 'en' ? 'Name: A to Z' : 'নাম: এ থেকে জেড'}</option>
                </select>
              </div>
            </div>

            {error ? (
              <ErrorState message={error} />
            ) : products.length === 0 && !loading ? (
              
              /* Redesigned Empty State / No Result Alert */
              <div className="bg-white/90 backdrop-blur-md rounded-[28px] border border-[var(--color-primary)]/10 shadow-lg shadow-emerald-950/5 p-12 text-center max-w-2xl mx-auto my-6 space-y-6">
                <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-500 border border-amber-100/50">
                  <AlertCircle size={36} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-800">
                    {language === 'en' ? 'Medicine Not Found' : 'আমরা এই ওষুধটি খুঁজে পাইনি'}
                  </h3>
                  <p className="text-sm text-[var(--color-muted)] max-w-md mx-auto">
                    {language === 'en' 
                      ? "Don't worry! Upload your prescription or contact our pharmacist on WhatsApp to source it directly."
                      : "চিন্তা করবেন না! প্রেসক্রিপশন আপলোড করুন অথবা সরাসরি WhatsApp-এ যোগাযোগ করুন, আমাদের টিম আপনার জন্য ওষুধটি সংগ্রহ করবে।"}
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
                  <Button 
                    variant="primary" 
                    className="gap-2 rounded-xl shadow-md font-bold px-6 py-2.5 min-h-[44px]"
                    onClick={handleUploadPrescription}
                  >
                    <Upload size={18} />
                    {language === 'en' ? 'Upload Prescription' : 'প্রেসক্রিপশন আপলোড দিন'}
                  </Button>
                  <Button 
                    variant="secondary" 
                    className="gap-2 rounded-xl font-bold px-6 py-2.5 min-h-[44px]"
                    onClick={handleWhatsAppOrder}
                  >
                    <Phone size={18} />
                    {language === 'en' ? 'WhatsApp Support' : 'WhatsApp মেসেজ করুন'}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <ProductGrid products={products} />
                
                {/* Skeletal Loading Cards */}
                {loading && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-8 animate-pulse">
                    {[1, 2, 3, 4].map(idx => (
                      <div key={idx} className="bg-white p-4 rounded-[24px] border border-slate-100 space-y-4">
                        <div className="bg-slate-100 rounded-[18px] aspect-square w-full"></div>
                        <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                        <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                        <div className="h-8 bg-slate-100 rounded-[12px] w-full pt-2"></div>
                      </div>
                    ))}
                  </div>
                )}
                
                {!loading && pagination.page < pagination.totalPages && (
                  <div className="mt-12 flex justify-center">
                    <Button 
                      variant="outline" 
                      className="px-10 font-bold border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5" 
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    >
                      {t('home.viewMore') || 'Load More Medicines'}
                    </Button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>

      </div>
    </div>
  );
};

export default Shop;
