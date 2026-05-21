import React, { useState, useEffect } from 'react';
import { 
  Calculator, TrendingUp, TrendingDown, DollarSign, Plus, 
  AlertTriangle, Calendar, Truck, User, FileText, 
  PlusCircle, CheckCircle, Download, Search, Trash, Edit3, ArrowRight, ShieldAlert, BadgeInfo
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import api from '../../services/api';
import { formatPrice, unwrapData } from '../../utils/apiData';
import Button from '../../components/common/Button';
import { useLanguage } from '../../context/LanguageContext';

const ERPDashboard = () => {
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'suppliers' | 'expiry'
  const [activeAlarmFilter, setActiveAlarmFilter] = useState('expired'); // 'expired' | 'soon' | 'low' | 'out'
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [dailySales, setDailySales] = useState({ todaySales: 0, todayOrdersCount: 0 });
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, profit: 0 });
  const [salesReport, setSalesReport] = useState({ summary: {}, daily: [] });
  const [expiryReport, setExpiryReport] = useState({ expired: [], expiringSoon: [], expiringLater: [], summary: {} });
  const [stockReport, setStockReport] = useState({ lowStock: [], outOfStock: [], summary: {} });
  const [suppliers, setSuppliers] = useState([]);
  
  // Supplier CRM States
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [supplierLedger, setSupplierLedger] = useState([]);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [supplierModalMode, setSupplierModalMode] = useState('add'); // 'add' | 'edit'
  const [supplierForm, setSupplierForm] = useState({
    id: '',
    name: '',
    companyName: '',
    phone: '',
    email: '',
    address: '',
    dueBalance: 0
  });

  // Supplier Transaction Drawer / Modal
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [ledgerForm, setLedgerForm] = useState({
    type: 'purchase', // 'purchase' | 'payment'
    amount: '',
    paymentMethod: 'cash',
    referenceNumber: '',
    description: ''
  });

  // Central Transaction Modal (Manual Income/Expense)
  const [showCentralModal, setShowCentralModal] = useState(false);
  const [centralFormData, setCentralFormData] = useState({
    amount: '',
    type: 'expense',
    category: 'Utilities',
    description: '',
    paymentMethod: 'cash'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const startDateStr = thirtyDaysAgo.toISOString().split('T')[0];

      const [salesRes, summaryRes, salesRepRes, stockRepRes, expiryRepRes, suppliersRes] = await Promise.allSettled([
        api.get('/erp/daily-sales'),
        api.get('/erp/summary'),
        api.get(`/reports/sales?startDate=${startDateStr}`),
        api.get('/reports/stock'),
        api.get('/reports/expiry'),
        api.get('/erp/suppliers')
      ]);

      if (salesRes.status === 'fulfilled') {
        setDailySales(unwrapData(salesRes.value, { todaySales: 0, todayOrdersCount: 0 }));
      }
      if (summaryRes.status === 'fulfilled') {
        setSummary(unwrapData(summaryRes.value, { totalIncome: 0, totalExpense: 0, profit: 0 }));
      }
      if (salesRepRes.status === 'fulfilled') {
        setSalesReport(unwrapData(salesRepRes.value, { summary: {}, daily: [] }));
      }
      if (stockRepRes.status === 'fulfilled') {
        setStockReport(unwrapData(stockRepRes.value, { lowStock: [], outOfStock: [], summary: {} }));
      }
      if (expiryRepRes.status === 'fulfilled') {
        setExpiryReport(unwrapData(expiryRepRes.value, { expired: [], expiringSoon: [], expiringLater: [], summary: {} }));
      }
      if (suppliersRes.status === 'fulfilled') {
        const data = unwrapData(suppliersRes.value, []);
        const list = Array.isArray(data) ? data : (data?.suppliers || []);
        setSuppliers(list);
      }
    } catch (err) {
      console.error('Failed to fetch ERP data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchSupplierLedger = async (supplierId) => {
    try {
      const res = await api.get(`/erp/suppliers/${supplierId}/ledger`);
      const data = unwrapData(res, { supplier: null, ledger: [] });
      if (data.supplier) {
        setSelectedSupplier(data.supplier);
        setSupplierLedger(data.ledger || []);
      }
    } catch (err) {
      console.error('Failed to fetch supplier ledger', err);
    }
  };

  // Central Transaction Handler (Direct Expense/Income)
  const handleCentralSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/erp/transactions', centralFormData);
      setShowCentralModal(false);
      setCentralFormData({ amount: '', type: 'expense', category: 'Utilities', description: '', paymentMethod: 'cash' });
      fetchData();
    } catch (err) {
      alert('Failed to add transaction');
    }
  };

  // Supplier CRM Handlers
  const handleSupplierSubmit = async (e) => {
    e.preventDefault();
    try {
      if (supplierModalMode === 'add') {
        await api.post('/erp/suppliers', supplierForm);
      } else {
        await api.put(`/erp/suppliers/${supplierForm.id}`, supplierForm);
      }
      setShowSupplierModal(false);
      setSupplierForm({ id: '', name: '', companyName: '', phone: '', email: '', address: '', dueBalance: 0 });
      fetchData();
      if (selectedSupplier) {
        fetchSupplierLedger(selectedSupplier.id);
      }
    } catch (err) {
      alert('Failed to save supplier details');
    }
  };

  const handleEditSupplierClick = (supplier) => {
    setSupplierModalMode('edit');
    setSupplierForm({
      id: supplier.id || supplier._id,
      name: supplier.name,
      companyName: supplier.companyName || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      dueBalance: supplier.dueBalance || 0
    });
    setShowSupplierModal(true);
  };

  const handleDeleteSupplier = async (supplierId) => {
    if (!window.confirm('Are you sure you want to delete this supplier? This action cannot be undone.')) return;
    try {
      await api.delete(`/erp/suppliers/${supplierId}`);
      if (selectedSupplier?.id === supplierId || selectedSupplier?._id === supplierId) {
        setSelectedSupplier(null);
        setSupplierLedger([]);
      }
      fetchData();
    } catch (err) {
      alert('Failed to delete supplier');
    }
  };

  // Supplier Ledger Transaction Builder
  const handleLedgerSubmit = async (e) => {
    e.preventDefault();
    try {
      const supplierId = selectedSupplier.id || selectedSupplier._id;
      await api.post(`/erp/suppliers/${supplierId}/ledger`, ledgerForm);
      setShowLedgerModal(false);
      setLedgerForm({ type: 'purchase', amount: '', paymentMethod: 'cash', referenceNumber: '', description: '' });
      await fetchSupplierLedger(supplierId);
      await fetchData();
    } catch (err) {
      alert('Failed to record supplier transaction');
    }
  };

  // Triggered when reordering a low-stock medicine
  const handleReorderClick = (productName) => {
    setActiveTab('suppliers');
    setLedgerForm(prev => ({
      ...prev,
      type: 'purchase',
      description: `Restock supply order: ${productName}`
    }));
  };

  // Filtered Suppliers for searching
  const filteredSuppliers = suppliers.filter(s => 
    s.name?.toLowerCase().includes(supplierSearch.toLowerCase()) ||
    s.companyName?.toLowerCase().includes(supplierSearch.toLowerCase()) ||
    s.phone?.includes(supplierSearch)
  );

  // Chart preparation
  const chartData = [...(salesReport.daily || [])]
    .sort((a, b) => a.date.localeCompare(b.date));

  const onlineTotal = salesReport.summary?.onlineTotal || 0;
  const posTotal = salesReport.summary?.posTotal || 0;
  const grandTotal = onlineTotal + posTotal;
  const onlinePercent = grandTotal > 0 ? ((onlineTotal / grandTotal) * 100).toFixed(0) : 0;
  const posPercent = grandTotal > 0 ? ((posTotal / grandTotal) * 100).toFixed(0) : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header Container */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-xl border border-gray-100 shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calculator className="text-primary" /> {t('admin.erp')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{t('admin.erpSubtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCentralModal(true)} className="flex items-center gap-2 shadow-sm">
            <Plus size={18} /> {t('admin.recordExpense')}
          </Button>
        </div>
      </div>

      {/* Modern Glassmorphic Tab Bar */}
      <div className="flex border-b border-gray-200 bg-white rounded-xl shadow-sm p-1 gap-1">
        <button 
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
            activeTab === 'analytics' 
              ? 'bg-primary text-white shadow-md' 
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <TrendingUp size={18} />
          {t('admin.dashboard') || 'Financial Analytics'}
        </button>
        <button 
          onClick={() => setActiveTab('suppliers')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
            activeTab === 'suppliers' 
              ? 'bg-primary text-white shadow-md' 
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <Truck size={18} />
          {t('admin.supplierLedger') || 'Supplier Ledger'}
        </button>
        <button 
          onClick={() => setActiveTab('expiry')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
            activeTab === 'expiry' 
              ? 'bg-primary text-white shadow-md' 
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <AlertTriangle size={18} />
          {'Expiry & Stock Alarms'}
          {(expiryReport.summary?.expiredCount > 0 || stockReport.summary?.outOfStockCount > 0) && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
              {(expiryReport.summary?.expiredCount || 0) + (stockReport.summary?.outOfStockCount || 0)}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
          <span className="text-gray-500 font-medium">{t('admin.loadingFinancial')}</span>
        </div>
      ) : (
        <>
          {/* TAB 1: FINANCIAL ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              
              {/* Financial KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Today Sales */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:translate-y-[-2px] transition-transform duration-200">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                      <DollarSign size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 font-semibold uppercase tracking-wider">{t('admin.todaySales')}</p>
                      <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{formatPrice(dailySales.todaySales)}</h3>
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg border border-gray-100 font-medium">
                    {t('admin.fromOrdersToday').replace('{count}', dailySales.todayOrdersCount)}
                  </div>
                </div>

                {/* Total Income */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:translate-y-[-2px] transition-transform duration-200">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                      <TrendingUp size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 font-semibold uppercase tracking-wider">{t('admin.totalIncome')}</p>
                      <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{formatPrice(summary.totalIncome)}</h3>
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-emerald-600 bg-emerald-50 p-2 rounded-lg border border-emerald-100 font-medium">
                    Cumulative cash flow inflow
                  </div>
                </div>

                {/* Total Expense */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:translate-y-[-2px] transition-transform duration-200">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
                      <TrendingDown size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 font-semibold uppercase tracking-wider">{t('admin.totalExpense')}</p>
                      <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{formatPrice(summary.totalExpense)}</h3>
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-100 font-medium">
                    Restock restock & utility cost logs
                  </div>
                </div>

                {/* Profit/Loss */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:translate-y-[-2px] transition-transform duration-200">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${summary.profit >= 0 ? 'bg-primary/10 text-primary-dark' : 'bg-red-100 text-red-600'}`}>
                      <Calculator size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 font-semibold uppercase tracking-wider">{t('admin.profit')}</p>
                      <h3 className={`text-2xl font-bold mt-0.5 ${summary.profit >= 0 ? 'text-primary-dark' : 'text-red-600'}`}>
                        {formatPrice(summary.profit)}
                      </h3>
                    </div>
                  </div>
                  <div className={`mt-4 text-xs p-2 rounded-lg border font-medium ${summary.profit >= 0 ? 'text-primary bg-primary/5 border-primary/10' : 'text-red-600 bg-red-50 border-red-100'}`}>
                    {summary.profit >= 0 ? 'Net positive returns' : 'Deficit operational margin'}
                  </div>
                </div>

              </div>

              {/* Sales Chart Card (Recharts) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Sales Area Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Sales Trend Breakdown</h3>
                      <p className="text-xs text-gray-400">Daily breakdown of Online vs POS sales channels over last 30 days</p>
                    </div>
                  </div>
                  
                  {chartData.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-gray-400 border border-dashed border-gray-200 rounded-lg">
                      <TrendingUp size={36} className="mb-2 opacity-50" />
                      <span>No transactions found for trend visualization</span>
                    </div>
                  ) : (
                    <div className="w-full">
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorOnline" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorPos" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                          <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `৳${val}`} />
                          <Tooltip contentStyle={{ background: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} formatter={(value) => [`৳${value}`, '']} />
                          <Legend verticalAlign="top" height={36} iconType="circle" />
                          <Area type="monotone" dataKey="online" name="Online Store" stroke="#10b981" fillOpacity={1} fill="url(#colorOnline)" strokeWidth={2} />
                          <Area type="monotone" dataKey="pos" name="POS Terminals" stroke="#3b82f6" fillOpacity={1} fill="url(#colorPos)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Sales Ratios Card */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{t('admin.posVsOnline')}</h3>
                    <p className="text-xs text-gray-400 mb-6">Distribution ratios of checkout mechanisms</p>
                    
                    <div className="space-y-6">
                      
                      {/* Online Checkouts */}
                      <div>
                        <div className="flex justify-between items-center text-sm font-semibold text-gray-700 mb-2">
                          <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-primary"></span> Online Checkout</span>
                          <span>{formatPrice(onlineTotal)} ({onlinePercent}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-3">
                          <div className="bg-primary h-3 rounded-full transition-all duration-500" style={{ width: `${onlinePercent}%` }}></div>
                        </div>
                      </div>

                      {/* POS sales */}
                      <div>
                        <div className="flex justify-between items-center text-sm font-semibold text-gray-700 mb-2">
                          <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500"></span> POS Checkout</span>
                          <span>{formatPrice(posTotal)} ({posPercent}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-3">
                          <div className="bg-blue-500 h-3 rounded-full transition-all duration-500" style={{ width: `${posPercent}%` }}></div>
                        </div>
                      </div>

                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between text-center text-sm text-gray-500">
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">{salesReport.summary?.onlineCount || 0}</h4>
                      <p className="text-xs">Online Orders</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">{salesReport.summary?.posCount || 0}</h4>
                      <p className="text-xs">POS Orders</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">{formatPrice(grandTotal)}</h4>
                      <p className="text-xs">Grand Total</p>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* TAB 2: SUPPLIER LEDGER CRM */}
          {activeTab === 'suppliers' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Supplier Directory */}
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-gray-900">Supplier Directory</h3>
                  <Button size="xs" onClick={() => {
                    setSupplierModalMode('add');
                    setSupplierForm({ id: '', name: '', companyName: '', phone: '', email: '', address: '', dueBalance: 0 });
                    setShowSupplierModal(true);
                  }} className="flex items-center gap-1">
                    <Plus size={14} /> Add New
                  </Button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search by name, company, or phone..." 
                    value={supplierSearch}
                    onChange={(e) => setSupplierSearch(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  />
                </div>

                {/* Supplier Directory List */}
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {filteredSuppliers.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-sm">
                      No suppliers registered matching query
                    </div>
                  ) : (
                    filteredSuppliers.map((supplier) => {
                      const id = supplier.id || supplier._id;
                      const isSelected = selectedSupplier?.id === id || selectedSupplier?._id === id;
                      return (
                        <div 
                          key={id}
                          onClick={() => fetchSupplierLedger(id)}
                          className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                            isSelected 
                              ? 'bg-primary/5 border-primary shadow-sm' 
                              : 'bg-gray-50 hover:bg-gray-100 border-gray-100'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-gray-950 text-sm flex items-center gap-1.5">
                                <User size={14} className="text-gray-400" /> {supplier.name}
                              </h4>
                              {supplier.companyName && (
                                <p className="text-xs text-gray-500 font-medium mt-0.5">{supplier.companyName}</p>
                              )}
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full font-bold ${supplier.dueBalance > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                              Due: {formatPrice(supplier.dueBalance)}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center text-xs text-gray-400 pt-1 border-t border-dashed border-gray-200">
                            <span>Phone: {supplier.phone || 'N/A'}</span>
                            <div className="flex gap-2">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditSupplierClick(supplier);
                                }}
                                className="text-blue-600 hover:text-blue-800 p-1"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSupplier(id);
                                }}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <Trash size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

              </div>

              {/* Right Column: Detailed Ledger Workspace */}
              <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm min-h-[500px] flex flex-col">
                {selectedSupplier ? (
                  <div className="space-y-6 flex-1 flex flex-col">
                    
                    {/* Workspace Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-100">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                          <User className="text-primary" /> {selectedSupplier.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {selectedSupplier.companyName} | Phone: {selectedSupplier.phone || 'N/A'} | Email: {selectedSupplier.email || 'N/A'}
                        </p>
                      </div>
                      <Button onClick={() => setShowLedgerModal(true)} className="flex items-center gap-1">
                        <PlusCircle size={16} /> Record Purchase/Payment
                      </Button>
                    </div>

                    {/* Balance Callout */}
                    <div className={`p-6 rounded-xl border flex flex-col sm:flex-row justify-between items-center gap-4 ${
                      selectedSupplier.dueBalance > 0 
                        ? 'bg-red-50 border-red-100 text-red-800' 
                        : 'bg-green-50 border-green-100 text-green-800'
                    }`}>
                      <div>
                        <h4 className="text-sm font-semibold uppercase tracking-wider opacity-85">Total Outstanding Due Balance</h4>
                        <p className="text-3xl font-black mt-1">{formatPrice(selectedSupplier.dueBalance)}</p>
                      </div>
                      <BadgeInfo size={36} className="opacity-40" />
                    </div>

                    {/* Ledger History List */}
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
                        <FileText size={16} className="text-primary" /> Transaction Ledger History Log
                      </h4>
                      
                      {supplierLedger.length === 0 ? (
                        <div className="text-center py-16 text-gray-400 border border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center">
                          <FileText size={40} className="mb-2 opacity-30" />
                          <span>No transaction logs registered under this supplier</span>
                          <span className="text-xs text-gray-500 mt-1">Record a purchase or payment to generate ledger entries</span>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-gray-50 text-gray-500 text-xs uppercase font-bold border-b border-gray-200">
                                <th className="p-3">Date</th>
                                <th className="p-3">Type</th>
                                <th className="p-3">Method</th>
                                <th className="p-3">Ref Code</th>
                                <th className="p-3">Description</th>
                                <th className="p-3 text-right">Amount</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                              {supplierLedger.map((log) => {
                                const isPayment = log.type === 'payment';
                                return (
                                  <tr key={log.id || log._id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="p-3 whitespace-nowrap text-gray-500 text-xs">
                                      {new Date(log.date || log.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="p-3">
                                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                        isPayment ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                                      }`}>
                                        {isPayment ? 'PAYMENT' : 'PURCHASE'}
                                      </span>
                                    </td>
                                    <td className="p-3 uppercase text-xs font-semibold text-gray-600">{log.paymentMethod || 'cash'}</td>
                                    <td className="p-3 text-xs font-mono text-gray-500 font-bold">{log.referenceNumber || 'N/A'}</td>
                                    <td className="p-3 max-w-[200px] truncate text-gray-600 font-medium" title={log.description}>{log.description}</td>
                                    <td className={`p-3 text-right font-bold text-sm ${isPayment ? 'text-blue-600' : 'text-amber-600'}`}>
                                      {isPayment ? '-' : '+'}{formatPrice(log.amount)}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-20 border border-dashed border-gray-150 rounded-2xl">
                    <User size={48} className="mb-3 opacity-30" />
                    <span className="font-bold text-gray-900">No Supplier Selected</span>
                    <span className="text-xs text-gray-500 mt-1">Select a supplier from the directory to review complete outstanding balance ledger</span>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 3: INVENTORY EXPIRY & ALARMS */}
          {activeTab === 'expiry' && (
            <div className="space-y-6">
              
              {/* Expiry KPI Alarms */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Expired Items */}
                <div 
                  onClick={() => setActiveAlarmFilter('expired')}
                  className={`p-5 rounded-xl border shadow-sm cursor-pointer hover:translate-y-[-2px] transition-all duration-200 ${
                    activeAlarmFilter === 'expired' 
                      ? 'bg-red-500 border-red-600 text-white' 
                      : 'bg-white border-red-100 text-gray-900'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-bold uppercase tracking-wider ${activeAlarmFilter === 'expired' ? 'text-white' : 'text-red-500'}`}>Expired Items</span>
                    <ShieldAlert size={20} className={activeAlarmFilter === 'expired' ? 'text-white' : 'text-red-500'} />
                  </div>
                  <h3 className="text-3xl font-black mt-3">{expiryReport.summary?.expiredCount || 0}</h3>
                  <p className={`text-xs mt-1 ${activeAlarmFilter === 'expired' ? 'text-white/80' : 'text-gray-400'}`}>Requires immediate disposal</p>
                </div>

                {/* Expiring in 90 Days */}
                <div 
                  onClick={() => setActiveAlarmFilter('soon')}
                  className={`p-5 rounded-xl border shadow-sm cursor-pointer hover:translate-y-[-2px] transition-all duration-200 ${
                    activeAlarmFilter === 'soon' 
                      ? 'bg-amber-500 border-amber-600 text-white' 
                      : 'bg-white border-amber-100 text-gray-900'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-bold uppercase tracking-wider ${activeAlarmFilter === 'soon' ? 'text-white' : 'text-amber-600'}`}>Expiring (90 Days)</span>
                    <Calendar size={20} className={activeAlarmFilter === 'soon' ? 'text-white' : 'text-amber-600'} />
                  </div>
                  <h3 className="text-3xl font-black mt-3">{expiryReport.summary?.expiringSoonCount || 0}</h3>
                  <p className={`text-xs mt-1 ${activeAlarmFilter === 'soon' ? 'text-white/80' : 'text-gray-400'}`}>Promotions / returns queue</p>
                </div>

                {/* Low Stock */}
                <div 
                  onClick={() => setActiveAlarmFilter('low')}
                  className={`p-5 rounded-xl border shadow-sm cursor-pointer hover:translate-y-[-2px] transition-all duration-200 ${
                    activeAlarmFilter === 'low' 
                      ? 'bg-orange-500 border-orange-600 text-white' 
                      : 'bg-white border-orange-100 text-gray-900'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-bold uppercase tracking-wider ${activeAlarmFilter === 'low' ? 'text-white' : 'text-orange-600'}`}>Low Stock (&lt;10)</span>
                    <AlertTriangle size={20} className={activeAlarmFilter === 'low' ? 'text-white' : 'text-orange-600'} />
                  </div>
                  <h3 className="text-3xl font-black mt-3">{stockReport.summary?.lowStockCount || 0}</h3>
                  <p className={`text-xs mt-1 ${activeAlarmFilter === 'low' ? 'text-white/80' : 'text-gray-400'}`}>Requires supplier reorders</p>
                </div>

                {/* Out of Stock */}
                <div 
                  onClick={() => setActiveAlarmFilter('out')}
                  className={`p-5 rounded-xl border shadow-sm cursor-pointer hover:translate-y-[-2px] transition-all duration-200 ${
                    activeAlarmFilter === 'out' 
                      ? 'bg-gray-800 border-gray-900 text-white' 
                      : 'bg-white border-gray-200 text-gray-900'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-bold uppercase tracking-wider ${activeAlarmFilter === 'out' ? 'text-white' : 'text-gray-600'}`}>Out of Stock</span>
                    <ShieldAlert size={20} className={activeAlarmFilter === 'out' ? 'text-white' : 'text-gray-400'} />
                  </div>
                  <h3 className="text-3xl font-black mt-3">{stockReport.summary?.outOfStockCount || 0}</h3>
                  <p className={`text-xs mt-1 ${activeAlarmFilter === 'out' ? 'text-white/80' : 'text-gray-400'}`}>Critical empty bins</p>
                </div>

              </div>

              {/* Data Table Workspace */}
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                
                {/* Active Header */}
                <div className="mb-4">
                  <h4 className="text-lg font-bold text-gray-900 capitalize flex items-center gap-2">
                    <AlertTriangle className="text-primary" />
                    {activeAlarmFilter === 'expired' && 'Expired Inventory Logs'}
                    {activeAlarmFilter === 'soon' && 'Medicines Expiring within 90 Days'}
                    {activeAlarmFilter === 'low' && 'Low Stock Replenishment Warnings'}
                    {activeAlarmFilter === 'out' && 'Critical Out-of-Stock Deficits'}
                  </h4>
                  <p className="text-xs text-gray-400">Inventory audits matching active alarm state parameters</p>
                </div>

                {/* Render Lists */}
                
                {/* 1. EXPIRED ITEMS */}
                {activeAlarmFilter === 'expired' && (
                  expiryReport.expired?.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">No expired items logged. Good job!</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
                            <th className="p-3">Medicine Name</th>
                            <th className="p-3">Batch Number</th>
                            <th className="p-3">Expiry Date</th>
                            <th className="p-3 text-right">Expired Stock</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-gray-100">
                          {expiryReport.expired.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50/50">
                              <td className="p-3 font-bold text-gray-900">{item.name}</td>
                              <td className="p-3 font-mono font-semibold text-gray-500">{item.batch || 'N/A'}</td>
                              <td className="p-3 text-red-600 font-bold">{new Date(item.expiryDate).toLocaleDateString()}</td>
                              <td className="p-3 text-right font-black text-red-600">{item.stock || 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                )}

                {/* 2. EXPIRING SOON */}
                {activeAlarmFilter === 'soon' && (
                  expiryReport.expiringSoon?.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">No items expiring within the next 90 days.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
                            <th className="p-3">Medicine Name</th>
                            <th className="p-3">Batch Number</th>
                            <th className="p-3">Expiry Date</th>
                            <th className="p-3 text-right">Current Stock</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-gray-100">
                          {expiryReport.expiringSoon.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50/50">
                              <td className="p-3 font-bold text-gray-900">{item.name}</td>
                              <td className="p-3 font-mono font-semibold text-gray-500">{item.batch || 'N/A'}</td>
                              <td className="p-3 text-amber-600 font-bold">{new Date(item.expiryDate).toLocaleDateString()}</td>
                              <td className="p-3 text-right font-black text-amber-600">{item.stock || 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                )}

                {/* 3. LOW STOCK WARNING */}
                {activeAlarmFilter === 'low' && (
                  stockReport.lowStock?.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">All shelves are adequately loaded! No low stock warnings.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
                            <th className="p-3">Medicine Name</th>
                            <th className="p-3">Category</th>
                            <th className="p-3">Current Stock</th>
                            <th className="p-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-gray-100">
                          {stockReport.lowStock.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50/50">
                              <td className="p-3 font-bold text-gray-900">{item.name}</td>
                              <td className="p-3 text-gray-500 font-medium">{item.category}</td>
                              <td className="p-3 font-bold text-orange-600">{item.stock || 0}</td>
                              <td className="p-3 text-right">
                                <button 
                                  onClick={() => handleReorderClick(item.name)}
                                  className="text-xs bg-primary/10 hover:bg-primary hover:text-white text-primary-dark font-bold py-1.5 px-3 rounded-lg border border-primary/20 transition-all duration-200 flex items-center gap-1.5 ml-auto"
                                >
                                  Reorder Restock <ArrowRight size={12} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                )}

                {/* 4. OUT OF STOCK Deficit */}
                {activeAlarmFilter === 'out' && (
                  stockReport.outOfStock?.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">All products have available stock cataloged.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
                            <th className="p-3">Medicine Name</th>
                            <th className="p-3">Category</th>
                            <th className="p-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-gray-100">
                          {stockReport.outOfStock.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50/50">
                              <td className="p-3 font-bold text-gray-900">{item.name}</td>
                              <td className="p-3 text-gray-500 font-medium">{item.category}</td>
                              <td className="p-3 text-right">
                                <button 
                                  onClick={() => handleReorderClick(item.name)}
                                  className="text-xs bg-gray-100 hover:bg-gray-800 hover:text-white text-gray-700 font-bold py-1.5 px-3 rounded-lg border border-gray-200 transition-all duration-200 flex items-center gap-1.5 ml-auto"
                                >
                                  Urgent Reorder <ArrowRight size={12} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                )}

              </div>

            </div>
          )}

        </>
      )}

      {/* MODAL 1: CENTRAL Direct expense/income */}
      {showCentralModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-scaleIn">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">{t('admin.recordTransaction')}</h2>
              <button onClick={() => setShowCentralModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors text-xl font-bold">&times;</button>
            </div>
            <form onSubmit={handleCentralSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.amount')}</label>
                <input required type="number" min="0" step="0.01" value={centralFormData.amount} onChange={e => setCentralFormData({...centralFormData, amount: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.type')}</label>
                <select value={centralFormData.type} onChange={e => setCentralFormData({...centralFormData, type: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                  <option value="expense">{t('admin.expense')}</option>
                  <option value="income">{t('admin.income')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.category')}</label>
                <input required type="text" value={centralFormData.category} onChange={e => setCentralFormData({...centralFormData, category: e.target.value})} placeholder="e.g. Utilities, Restock, Salary" className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.description')}</label>
                <input type="text" value={centralFormData.description} onChange={e => setCentralFormData({...centralFormData, description: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
              </div>
              <div className="pt-4 flex gap-3">
                <Button type="button" variant="outline" onClick={() => setShowCentralModal(false)} className="flex-1">{t('common.cancel')}</Button>
                <Button type="submit" className="flex-1">{t('common.save')}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD / EDIT SUPPLIER FORM */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">
                {supplierModalMode === 'add' ? 'Add Supplier Details' : 'Edit Supplier Details'}
              </h2>
              <button onClick={() => setShowSupplierModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors text-xl font-bold">&times;</button>
            </div>
            <form onSubmit={handleSupplierSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Supplier Name *</label>
                <input required type="text" value={supplierForm.name} onChange={e => setSupplierForm({...supplierForm, name: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Company / Manufacturer Name</label>
                <input type="text" value={supplierForm.companyName} onChange={e => setSupplierForm({...supplierForm, companyName: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Phone</label>
                <input type="text" value={supplierForm.phone} onChange={e => setSupplierForm({...supplierForm, phone: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Email</label>
                <input type="email" value={supplierForm.email} onChange={e => setSupplierForm({...supplierForm, email: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Office Address</label>
                <input type="text" value={supplierForm.address} onChange={e => setSupplierForm({...supplierForm, address: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
              </div>
              {supplierModalMode === 'add' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Opening Outstanding Due Balance (BDT)</label>
                  <input type="number" min="0" value={supplierForm.dueBalance} onChange={e => setSupplierForm({...supplierForm, dueBalance: parseFloat(e.target.value) || 0})} className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                </div>
              )}
              <div className="pt-4 flex gap-3">
                <Button type="button" variant="outline" onClick={() => setShowSupplierModal(false)} className="flex-1">{t('common.cancel')}</Button>
                <Button type="submit" className="flex-1">{t('common.save')}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: RECORD SUPPLIER TRANSACTION (PURCHASE OR PAYMENT) */}
      {showLedgerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">Record Ledger Transaction</h2>
              <button onClick={() => setShowLedgerModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors text-xl font-bold">&times;</button>
            </div>
            <form onSubmit={handleLedgerSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Transaction Type</label>
                <select value={ledgerForm.type} onChange={e => setLedgerForm({...ledgerForm, type: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                  <option value="purchase">SUPPLIER PURCHASE / RESTOCK (Increases Due Balance)</option>
                  <option value="payment">PAYMENT TO SUPPLIER (Decreases Due Balance / Logs Expense)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Amount (BDT) *</label>
                <input required type="number" min="0.01" step="0.01" value={ledgerForm.amount} onChange={e => setLedgerForm({...ledgerForm, amount: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Payment Method</label>
                <select value={ledgerForm.paymentMethod} onChange={e => setLedgerForm({...ledgerForm, paymentMethod: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                  <option value="cash">Cash on Delivery</option>
                  <option value="bkash">bKash Mobile Wallet</option>
                  <option value="nagad">Nagad Mobile Wallet</option>
                  <option value="bank_transfer">Bank Wire Transfer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Ref / Invoice Number</label>
                <input type="text" placeholder="e.g. INV-9281 or TRX-82193" value={ledgerForm.referenceNumber} onChange={e => setLedgerForm({...ledgerForm, referenceNumber: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Transaction Description</label>
                <textarea rows="3" placeholder="e.g. Paracetamol & Napa restock supply order" value={ledgerForm.description} onChange={e => setLedgerForm({...ledgerForm, description: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"></textarea>
              </div>
              <div className="pt-4 flex gap-3">
                <Button type="button" variant="outline" onClick={() => setShowLedgerModal(false)} className="flex-1">{t('common.cancel')}</Button>
                <Button type="submit" className="flex-1">{t('common.save')}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ERPDashboard;
