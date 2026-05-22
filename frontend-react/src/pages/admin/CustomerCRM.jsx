import React, { useState, useEffect } from 'react';
import { Users, Search, Phone, FileText, UserPlus, TrendingDown, Clock, Activity, CheckCircle, Save } from 'lucide-react';
import api from '../../services/api';
import { formatPrice } from '../../utils/apiData';
import Button from '../../components/common/Button';

const CustomerCRM = () => {
  const [customers, setCustomers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dueOnly, setDueOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Profile Drawer
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerProfile, setCustomerProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  
  // Forms
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: '', paymentMethod: 'cash', note: '' });
  const [paymentLoading, setPaymentLoading] = useState(false);

  const [showDueForm, setShowDueForm] = useState(false);
  const [dueForm, setDueForm] = useState({ amount: '', note: '' });
  const [dueLoading, setDueLoading] = useState(false);

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [search, dueOnly, page]);

  const fetchSummary = async () => {
    try {
      const res = await api.get('/customers/summary');
      setSummary(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customers', {
        params: { search, dueOnly, page, limit: 20 }
      });
      setCustomers(res.data.data);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async (id) => {
    setProfileLoading(true);
    try {
      const res = await api.get(`/customers/${id}`);
      setCustomerProfile(res.data.data);
      setSelectedCustomer(res.data.data);
    } catch (err) {
      alert('Error loading profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleCollectPayment = async (e) => {
    e.preventDefault();
    setPaymentLoading(true);
    try {
      await api.post(`/customers/${selectedCustomer.id}/payment`, paymentForm);
      setShowPaymentForm(false);
      setPaymentForm({ amount: '', paymentMethod: 'cash', note: '' });
      fetchProfile(selectedCustomer.id);
      fetchSummary();
      fetchCustomers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error collecting payment');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleAddDue = async (e) => {
    e.preventDefault();
    setDueLoading(true);
    try {
      await api.post(`/customers/${selectedCustomer.id}/due`, dueForm);
      setShowDueForm(false);
      setDueForm({ amount: '', note: '' });
      fetchProfile(selectedCustomer.id);
      fetchSummary();
      fetchCustomers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding due');
    } finally {
      setDueLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Customer CRM</h1>
          <p className="text-slate-500">Manage customers, track due balances, and view ledger</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-1">Total Customers</div>
          <div className="text-2xl font-black text-slate-800">{summary?.totalCustomers || 0}</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-1">Customers with Due</div>
          <div className="text-2xl font-black text-amber-600">{summary?.customersWithDue || 0}</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-1">Total Market Due</div>
          <div className="text-2xl font-black text-rose-600">{formatPrice(summary?.totalDue || 0)}</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-1">Due Collected Today</div>
          <div className="text-2xl font-black text-emerald-600">{formatPrice(summary?.dueCollectedToday || 0)}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by phone or name..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border-slate-300 focus:ring-primary focus:border-primary"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="flex gap-4 items-center">
          <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
            <input 
              type="checkbox" 
              className="rounded text-primary focus:ring-primary" 
              checked={dueOnly} 
              onChange={(e) => { setDueOnly(e.target.checked); setPage(1); }} 
            />
            Show Due Only
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-3 font-semibold">Customer</th>
                <th className="px-6 py-3 font-semibold">Type</th>
                <th className="px-6 py-3 font-semibold text-right">Total Purchase</th>
                <th className="px-6 py-3 font-semibold text-right">Due Balance</th>
                <th className="px-6 py-3 font-semibold">Last Visit</th>
                <th className="px-6 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">Loading customers...</td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">No customers found</td></tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{c.name || 'Unknown'}</div>
                      <div className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone size={12} /> {c.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 capitalize">
                      {c.customerType.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium text-slate-800">
                      {formatPrice(c.totalPurchase || 0)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        c.dueBalance > 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {formatPrice(c.dueBalance || 0)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {c.lastVisitAt ? new Date(c.lastVisitAt).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="outline" size="sm" onClick={() => fetchProfile(c.id)}>
                        View Profile
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Profile Modal/Drawer */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col animate-slide-in-right">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Users className="text-primary" /> Customer Profile
              </h2>
              <button onClick={() => setSelectedCustomer(null)} className="text-slate-400 hover:text-slate-600 p-2">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {profileLoading ? (
                <div className="text-center text-slate-500 mt-10">Loading profile...</div>
              ) : customerProfile ? (
                <div className="space-y-8">
                  {/* Info Header */}
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                    <h3 className="text-xl font-black text-slate-800">{customerProfile.name || 'Unknown Name'}</h3>
                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-600">
                      <span className="flex items-center gap-1 font-medium bg-white px-3 py-1 rounded-full border border-slate-200"><Phone size={14} className="text-primary"/> {customerProfile.phone}</span>
                      <span className="flex items-center gap-1 font-medium bg-white px-3 py-1 rounded-full border border-slate-200"><Clock size={14} className="text-primary"/> Last Visit: {customerProfile.lastVisitAt ? new Date(customerProfile.lastVisitAt).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>

                  {/* Financials */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
                      <div className="text-xs font-bold text-slate-500 uppercase">Total Purchase</div>
                      <div className="text-xl font-black text-slate-800 mt-1">{formatPrice(customerProfile.totalPurchase || 0)}</div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
                      <div className="text-xs font-bold text-slate-500 uppercase">Total Paid</div>
                      <div className="text-xl font-black text-emerald-600 mt-1">{formatPrice(customerProfile.totalPaid || 0)}</div>
                    </div>
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-center">
                      <div className="text-xs font-bold text-rose-600 uppercase">Current Due</div>
                      <div className="text-xl font-black text-rose-700 mt-1">{formatPrice(customerProfile.dueBalance || 0)}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button fullWidth onClick={() => setShowPaymentForm(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                      <CheckCircle size={18} className="mr-2"/> Collect Payment
                    </Button>
                    <Button fullWidth variant="outline" onClick={() => setShowDueForm(true)} className="text-rose-600 border-rose-200 hover:bg-rose-50">
                      <TrendingDown size={18} className="mr-2"/> Add Manual Due
                    </Button>
                  </div>

                  {/* Payment Form Inline */}
                  {showPaymentForm && (
                    <form onSubmit={handleCollectPayment} className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 space-y-4">
                      <h4 className="font-bold text-emerald-800">Collect Due Payment</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-emerald-800 mb-1">Amount</label>
                          <input type="number" min="1" step="any" required className="w-full rounded-lg border-emerald-200" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-emerald-800 mb-1">Method</label>
                          <select required className="w-full rounded-lg border-emerald-200" value={paymentForm.paymentMethod} onChange={e => setPaymentForm({...paymentForm, paymentMethod: e.target.value})}>
                            <option value="cash">Cash</option>
                            <option value="bkash">bKash</option>
                            <option value="nagad">Nagad</option>
                            <option value="bank">Bank</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-emerald-800 mb-1">Note (Optional)</label>
                        <input type="text" className="w-full rounded-lg border-emerald-200" value={paymentForm.note} onChange={e => setPaymentForm({...paymentForm, note: e.target.value})} />
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => setShowPaymentForm(false)}>Cancel</Button>
                        <Button type="submit" loading={paymentLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white">Confirm Payment</Button>
                      </div>
                    </form>
                  )}

                  {/* Manual Due Form Inline */}
                  {showDueForm && (
                    <form onSubmit={handleAddDue} className="bg-rose-50 border border-rose-200 rounded-xl p-5 space-y-4">
                      <h4 className="font-bold text-rose-800">Add Manual Due</h4>
                      <div>
                        <label className="block text-sm font-medium text-rose-800 mb-1">Amount</label>
                        <input type="number" min="1" step="any" required className="w-full rounded-lg border-rose-200" value={dueForm.amount} onChange={e => setDueForm({...dueForm, amount: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-rose-800 mb-1">Reason / Note</label>
                        <input type="text" required className="w-full rounded-lg border-rose-200" value={dueForm.note} onChange={e => setDueForm({...dueForm, note: e.target.value})} />
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => setShowDueForm(false)}>Cancel</Button>
                        <Button type="submit" loading={dueLoading} className="bg-rose-600 hover:bg-rose-700 text-white">Confirm Due</Button>
                      </div>
                    </form>
                  )}

                  {/* Ledger Table */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Activity size={20}/> Customer Ledger</h3>
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                          <tr>
                            <th className="p-3 font-semibold">Date & Type</th>
                            <th className="p-3 font-semibold text-right">Amount</th>
                            <th className="p-3 font-semibold text-right">Paid</th>
                            <th className="p-3 font-semibold text-right">Due</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(customerProfile.recentLedger || []).map(l => (
                            <tr key={l.id} className="hover:bg-slate-50">
                              <td className="p-3">
                                <div className="font-medium text-slate-800">{new Date(l.date).toLocaleDateString()}</div>
                                <div className={`text-xs font-bold uppercase mt-0.5 ${
                                  l.type === 'payment' ? 'text-emerald-600' :
                                  l.type === 'due_added' ? 'text-rose-600' : 'text-blue-600'
                                }`}>{l.type.replace('_', ' ')}</div>
                                {l.note && <div className="text-xs text-slate-400 mt-1">{l.note}</div>}
                              </td>
                              <td className="p-3 text-right font-medium">{formatPrice(l.amount)}</td>
                              <td className="p-3 text-right font-bold text-emerald-600">{l.paidAmount > 0 ? formatPrice(l.paidAmount) : '-'}</td>
                              <td className="p-3 text-right font-bold text-rose-600">{l.dueAmount > 0 ? formatPrice(l.dueAmount) : '-'}</td>
                            </tr>
                          ))}
                          {(!customerProfile.recentLedger || customerProfile.recentLedger.length === 0) && (
                            <tr><td colSpan="4" className="p-4 text-center text-slate-500">No ledger history found.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerCRM;
