import React, { useState, useEffect } from 'react';
import { 
  DollarSign, TrendingUp, TrendingDown, CreditCard, 
  Wallet, RefreshCcw, Download, Plus, AlertTriangle 
} from 'lucide-react';
import api from '../../services/api';
import { formatPrice } from '../../utils/apiData';
import Button from '../../components/common/Button';

const AccountingDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [cashBook, setCashBook] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ category: '', amount: '', paymentMethod: 'cash', note: '' });
  const [expenseLoading, setExpenseLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sumRes, cbRes] = await Promise.all([
        api.get('/accounting/summary'),
        api.get('/accounting/cash-book')
      ]);
      setSummary(sumRes.data.data);
      setCashBook(cbRes.data.data);
    } catch (err) {
      console.error('Error fetching accounting data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    setExpenseLoading(true);
    try {
      await api.post('/accounting/expense', expenseForm);
      setShowExpenseModal(false);
      setExpenseForm({ category: '', amount: '', paymentMethod: 'cash', note: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving expense');
    } finally {
      setExpenseLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading accounting data...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Accounting Dashboard</h1>
          <p className="text-slate-500">Live financial overview and cash book</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCcw size={18} className="mr-2" /> Refresh
          </Button>
          <Button onClick={() => setShowExpenseModal(true)}>
            <Plus size={18} className="mr-2" /> Add Expense
          </Button>
        </div>
      </div>

      {summary?.profitAccuracy === 'partial' && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle className="mt-0.5 text-amber-600 shrink-0" size={20} />
          <div>
            <h4 className="font-bold">Partial Profit Accuracy</h4>
            <p className="text-sm mt-1">কিছু পণ্যের purchase price নেই ({summary.missingCostItems} items), তাই profit calculation partial হতে পারে।</p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-1">Today Income</div>
          <div className="text-2xl font-black text-emerald-600">{formatPrice(summary?.todayIncome)}</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-1">Today Expense/Refunds</div>
          <div className="text-2xl font-black text-rose-600">{formatPrice(summary?.todayExpense)}</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-1">Today Net Profit</div>
          <div className={`text-2xl font-black ${summary?.todayNetProfit >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
            {formatPrice(summary?.todayNetProfit)}
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-1">Total Net Profit</div>
          <div className="text-2xl font-black text-slate-800">{formatPrice(summary?.netProfit)}</div>
        </div>
      </div>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="text-emerald-500" size={20} />
            Income Breakdown
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-600 font-medium">POS Sales</span>
              <span className="font-bold text-slate-800">{formatPrice(summary?.posSales)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-600 font-medium">Online Sales (Realized)</span>
              <span className="font-bold text-slate-800">{formatPrice(summary?.onlineSales)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <span className="text-blue-800 font-medium">Total Realized Income</span>
              <span className="font-bold text-blue-900">{formatPrice(summary?.totalIncome)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Wallet className="text-indigo-500" size={20} />
            Payment Methods
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-lg flex justify-between">
              <span className="text-slate-600">Cash</span>
              <span className="font-bold">{formatPrice(summary?.cashTotal)}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg flex justify-between">
              <span className="text-slate-600">bKash</span>
              <span className="font-bold">{formatPrice(summary?.bkashTotal)}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg flex justify-between">
              <span className="text-slate-600">Nagad</span>
              <span className="font-bold">{formatPrice(summary?.nagadTotal)}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg flex justify-between">
              <span className="text-slate-600">COD</span>
              <span className="font-bold">{formatPrice(summary?.codTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cash Book Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Unified Cash Book</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-3 font-semibold">Date</th>
                <th className="px-6 py-3 font-semibold">Type</th>
                <th className="px-6 py-3 font-semibold">Source & Ref</th>
                <th className="px-6 py-3 font-semibold">Method</th>
                <th className="px-6 py-3 font-semibold text-right">Amount</th>
                <th className="px-6 py-3 font-semibold">Created By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {cashBook.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {new Date(row.date).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold ${
                      row.type === 'income' ? 'bg-emerald-100 text-emerald-800' :
                      row.type === 'expense' ? 'bg-rose-100 text-rose-800' :
                      row.type === 'refund' ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      {row.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="font-semibold text-slate-800">{row.source.toUpperCase()}</div>
                    <div className="text-xs text-slate-500">{row.referenceId}</div>
                    {row.note && <div className="text-xs text-slate-400 mt-0.5">{row.note}</div>}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 uppercase">
                    {row.paymentMethod}
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-bold text-slate-800">
                    {row.type === 'expense' || row.type === 'refund' ? '-' : ''}{formatPrice(row.amount)}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {row.createdBy}
                  </td>
                </tr>
              ))}
              {cashBook.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-lg font-bold">Add Manual Expense</h2>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            <form onSubmit={handleExpenseSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <select 
                  required
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-primary focus:ring-primary"
                  value={expenseForm.category}
                  onChange={e => setExpenseForm({...expenseForm, category: e.target.value})}
                >
                  <option value="">Select Category</option>
                  <option value="salary">Salary</option>
                  <option value="utility">Utility Bills</option>
                  <option value="rent">Rent</option>
                  <option value="supplies">Store Supplies</option>
                  <option value="marketing">Marketing</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                <input 
                  type="number" min="1" step="any" required
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-primary focus:ring-primary"
                  value={expenseForm.amount}
                  onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
                <select 
                  required
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-primary focus:ring-primary"
                  value={expenseForm.paymentMethod}
                  onChange={e => setExpenseForm({...expenseForm, paymentMethod: e.target.value})}
                >
                  <option value="cash">Cash</option>
                  <option value="bkash">bKash</option>
                  <option value="nagad">Nagad</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Note (Optional)</label>
                <textarea 
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-primary focus:ring-primary"
                  rows="2"
                  value={expenseForm.note}
                  onChange={e => setExpenseForm({...expenseForm, note: e.target.value})}
                ></textarea>
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <Button variant="outline" type="button" onClick={() => setShowExpenseModal(false)}>Cancel</Button>
                <Button type="submit" loading={expenseLoading}>Save Expense</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountingDashboard;
