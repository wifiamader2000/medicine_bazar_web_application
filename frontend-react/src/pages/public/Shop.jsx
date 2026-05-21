import React, { useState, useEffect } from 'react';
import { Filter, SlidersHorizontal, Search as SearchIcon } from 'lucide-react';
import api from '../../services/api';
import ProductGrid from '../../components/product/ProductGrid';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import ErrorState from '../../components/common/ErrorState';
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
    sort: searchParams.get('sort') || ''
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
    setSearchParams(urlParams, { replace: true });
    
  }, [filters, pagination.page, setSearchParams]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      
      {/* Mobile Filter Toggle */}
      <div className="md:hidden flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <h1 className="text-lg font-bold text-gray-900">{t('common.shop')}</h1>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="gap-2">
          <Filter size={18} /> {language === 'en' ? 'Filters' : 'ফিল্টারসমূহ'}
        </Button>
      </div>

      {/* Sidebar Filters */}
      <aside className={`w-full md:w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden md:block'}`}>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm sticky top-24">
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100 text-gray-900 font-bold text-lg">
            <SlidersHorizontal size={20} />
            {language === 'en' ? 'Filters' : 'ফিল্টারসমূহ'}
          </div>
          
          <div className="mb-6 relative">
            <input 
              type="text" 
              placeholder={t('common.searchPlaceholder')} 
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <SearchIcon size={16} className="absolute left-3 top-2.5 text-gray-400" />
          </div>

          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wider">{language === 'en' ? 'Categories' : 'ক্যাটাগরি সমূহ'}</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="category"
                  checked={filters.category === ''}
                  onChange={() => handleFilterChange('category', '')}
                  className="text-primary focus:ring-primary" 
                />
                <span className="text-gray-700 text-sm">{language === 'en' ? 'All Categories' : 'সব ক্যাটাগরি'}</span>
              </label>
              {categories.map(cat => (
                <label key={cat.id || cat._id} className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="category"
                    checked={filters.category === cat.slug || filters.category === cat.name}
                    onChange={() => handleFilterChange('category', cat.slug || cat.name)}
                    className="text-primary focus:ring-primary" 
                  />
                  <span className="text-gray-700 text-sm">{language === 'bn' && cat.nameBn ? cat.nameBn : cat.name}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wider">{language === 'en' ? 'Prescription' : 'প্রেসক্রিপশন'}</h4>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="rx" 
                  checked={filters.prescriptionRequired === ''}
                  onChange={() => handleFilterChange('prescriptionRequired', '')}
                  className="text-primary focus:ring-primary" 
                />
                <span className="text-gray-700 text-sm">{language === 'en' ? 'All Products' : 'সব পণ্য'}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="rx" 
                  checked={filters.prescriptionRequired === 'true'}
                  onChange={() => handleFilterChange('prescriptionRequired', 'true')}
                  className="text-primary focus:ring-primary" 
                />
                <span className="text-gray-700 text-sm">{t('common.rxRequired')}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="rx" 
                  checked={filters.prescriptionRequired === 'false'}
                  onChange={() => handleFilterChange('prescriptionRequired', 'false')}
                  className="text-primary focus:ring-primary" 
                />
                <span className="text-gray-700 text-sm">{language === 'en' ? 'Non-Rx (OTC)' : 'ওটিসি (OTC) মেডিসিন'}</span>
              </label>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wider">{language === 'en' ? 'Availability' : 'সহজলভ্যতা'}</h4>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={filters.inStock}
                onChange={(e) => handleFilterChange('inStock', e.target.checked)}
                className="rounded text-primary focus:ring-primary" 
              />
              <span className="text-gray-700 text-sm">{language === 'en' ? 'In Stock Only' : 'শুধু স্টকে আছে'}</span>
            </label>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-100">
             <Button 
                variant="outline" 
                fullWidth 
                onClick={() => {
                  setFilters({ category: '', search: '', prescriptionRequired: '', inStock: false, sort: '' });
                  setPagination({ page: 1, totalPages: 1 });
                }}
             >
               {language === 'en' ? 'Reset Filters' : 'ফিল্টার রিসেট'}
             </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 hidden md:flex">
          <h1 className="text-xl font-bold text-gray-900">
            {filters.category ? filters.category : (language === 'en' ? 'All Products' : 'সব পণ্য')}
            {filters.search && ` matching "${filters.search}"`}
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 font-medium">{language === 'en' ? 'Sort by:' : 'ক্রম সাজান:'}</span>
            <select 
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-primary text-gray-700 cursor-pointer"
            >
              <option value="">{language === 'en' ? 'Relevance' : 'প্রাসঙ্গিকতা'}</option>
              <option value="sellingPrice:asc">{language === 'en' ? 'Price: Low to High' : 'মূল্য: কম থেকে বেশি'}</option>
              <option value="sellingPrice:desc">{language === 'en' ? 'Price: High to Low' : 'মূল্য: বেশি থেকে কম'}</option>
              <option value="name:asc">{language === 'en' ? 'Name: A to Z' : 'নাম: এ থেকে জেড'}</option>
            </select>
          </div>
        </div>
        
        {/* Mobile sorting (visible only on mobile) */}
        <div className="md:hidden flex items-center justify-between bg-white p-3 rounded-xl border border-gray-200 shadow-sm mb-4">
          <span className="text-sm text-gray-500 font-medium">{language === 'en' ? 'Sort:' : 'ক্রম:'}</span>
          <select 
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-primary bg-transparent"
            >
              <option value="">{language === 'en' ? 'Relevance' : 'প্রাসঙ্গিকতা'}</option>
              <option value="sellingPrice:asc">{language === 'en' ? 'Low to High' : 'কম থেকে বেশি'}</option>
              <option value="sellingPrice:desc">{language === 'en' ? 'High to Low' : 'বেশি থেকে কম'}</option>
            </select>
        </div>

        {error ? (
          <ErrorState message={error} />
        ) : products.length === 0 && !loading ? (
          <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">{language === 'en' ? 'No products found' : 'কোনো পণ্য পাওয়া যায়নি'}</h3>
            <p className="text-gray-500">{language === 'en' ? 'Try adjusting your filters or search term.' : 'অনুগ্রহ করে আপনার ফিল্টার বা অনুসন্ধান শব্দ পরিবর্তন করুন।'}</p>
          </div>
        ) : (
          <>
            <ProductGrid products={products} />
            
            {loading && <div className="mt-8"><Loading /></div>}
            
            {!loading && pagination.page < pagination.totalPages && (
              <div className="mt-8 flex justify-center">
                <Button 
                  variant="outline" 
                  className="px-8" 
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  {t('home.viewMore')}
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Shop;
