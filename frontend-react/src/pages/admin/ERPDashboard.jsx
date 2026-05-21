import React, { useState, useEffect } from 'react';
import { Calculator, TrendingUp, TrendingDown, DollarSign, Plus } from 'lucide-react';
import api from '../../services/api';
import { formatPrice, unwrapData } from '../../utils/apiData';
import Button from '../../components/common/Button';

const ERPDashboard = () => {
  const [dailySales, setDailySales] = useState({ todaySales: 0, todayOrdersCount: 0 });
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, profit: 0 });
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense',
    category: 'Utilities',
    description: '',
    paymentMethod: 'cash'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [salesRes, summaryRes] = await Promise.all([
        api.get('/erp/daily-sales'),
        api.get('/erp/summary')
      ]);
      setDailySales(unwrapData(salesRes, { todaySales: 0, todayOrdersCount: 0 }));
      setSummary(unwrapData(summaryRes, { totalIncome: 0, totalExpense: 0, profit: 0 }));
    } catch (err) {
      console.error('Failed to fetch ERP data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/erp/transactions', formData);
      setShowModal(false);
      setFormData({ amount: '', type: 'expense', category: 'Utilities', description: '', paymentMethod: 'cash' });
      fetchData();
    } catch (err) {
      alert('Failed to add transaction');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calculator className="text-primary" /> Accounting & ERP
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage finances, view profit & loss</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="flex items-center gap-2">
          <Plus size={18} /> Record Expense
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading financial data...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                <DollarSign size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Today's Sales</p>
                <h3 className="text-2xl font-bold text-gray-900">{formatPrice(dailySales.todaySales)}</h3>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">From {dailySales.todayOrdersCount} orders today</div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Income</p>
                <h3 className="text-2xl font-bold text-gray-900">{formatPrice(summary.totalIncome)}</h3>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center text-red-600">
                <TrendingDown size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Expense</p>
                <h3 className="text-2xl font-bold text-gray-900">{formatPrice(summary.totalExpense)}</h3>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${summary.profit >= 0 ? 'bg-primary/20 text-primary-dark' : 'bg-red-100 text-red-600'}`}>
                <Calculator size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Net Profit</p>
                <h3 className={`text-2xl font-bold ${summary.profit >= 0 ? 'text-primary-dark' : 'text-red-600'}`}>
                  {formatPrice(summary.profit)}
                </h3>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction form modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">Record Transaction</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input required type="number" min="0" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input required type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="e.g. Utilities, Restock, Salary" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
              </div>
              <div className="pt-4 flex gap-3">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
                <Button type="submit" className="flex-1">Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ERPDashboard;
