import React, { useState, useEffect, useMemo } from 'react';
import { Calculator, Save, RefreshCcw, CheckCircle, AlertTriangle, Printer } from 'lucide-react';
import api from '../../services/api';
import { formatPrice } from '../../utils/apiData';
import Button from '../../components/common/Button';

const DENOMINATIONS = [1000, 500, 200, 100, 50, 20, 10];

const DayClosing = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [counts, setCounts] = useState({
    '1000': '', '500': '', '200': '', '100': '', '50': '', '20': '', '10': '', 'coins': ''
  });
  const [note, setNote] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/accounting/day-closing');
      setData(res.data.data);
      if (res.data.data.status === 'closed' && res.data.data.denominations) {
        setCounts(res.data.data.denominations);
      }
    } catch (err) {
      console.error('Error fetching day closing data', err);
    } finally {
      setLoading(false);
    }
  };

  const actualCash = useMemo(() => {
    let total = 0;
    DENOMINATIONS.forEach(d => {
      const count = parseInt(counts[d.toString()]) || 0;
      total += count * d;
    });
    total += parseFloat(counts.coins) || 0;
    return total;
  }, [counts]);

  const expectedCash = data?.expectedCash || 0;
  const difference = actualCash - expectedCash;
  const isClosed = data?.status === 'closed';

  const handleCountChange = (key, value) => {
    if (isClosed) return;
    setCounts(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (difference !== 0) {
      if (!window.confirm(`Difference is ${difference}. Do you still want to submit?`)) return;
    }
    
    setSubmitting(true);
    try {
      await api.post('/accounting/day-closing', {
        date: data.date,
        actualCash,
        denominations: counts,
        note
      });
      alert('Day closing submitted successfully!');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error submitting day closing');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="p-8">Loading closing data...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 print:p-0 print:m-0">
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Day Closing</h1>
          <p className="text-slate-500">Reconcile cash and submit end-of-day report</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCcw size={18} className="mr-2" /> Refresh
          </Button>
          {isClosed && (
            <Button variant="outline" onClick={handlePrint}>
              <Printer size={18} className="mr-2" /> Print Report
            </Button>
          )}
        </div>
      </div>

      {isClosed && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3 print:hidden">
          <CheckCircle className="text-emerald-600 shrink-0" size={24} />
          <div>
            <h4 className="font-bold text-lg">Day Closed Successfully</h4>
            <p>The closing report for {data.date} has been submitted.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column - System Calculations */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:border-none print:shadow-none">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-800 text-lg">System Summary ({data.date})</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <span className="text-slate-600">Opening Cash ({data.sessions} sessions)</span>
                <span className="font-semibold text-slate-800">{formatPrice(data.openingCash)}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <span className="text-slate-600">Cash Sales ({data.salesCount})</span>
                <span className="font-bold text-emerald-600">+{formatPrice(data.cashSales)}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <span className="text-slate-600">Cash Refunds ({data.refundsCount})</span>
                <span className="font-bold text-rose-600">-{formatPrice(data.cashRefunds)}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <span className="text-slate-600">Cash Expenses</span>
                <span className="font-bold text-rose-600">-{formatPrice(data.cashExpenses)}</span>
              </div>
              
              <div className="flex justify-between items-center pt-2">
                <span className="text-lg font-bold text-slate-800">Expected Cash In Drawer</span>
                <span className="text-2xl font-black text-indigo-600">{formatPrice(expectedCash)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Denomination Counting */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:border-none print:shadow-none">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
              <Calculator className="text-slate-500" size={20} />
              <h3 className="font-bold text-slate-800 text-lg">Cash Counter</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                {DENOMINATIONS.map(d => (
                  <div key={d} className="flex items-center gap-3">
                    <span className="w-14 text-right font-bold text-slate-600">{d} ৳ <span className="font-normal text-slate-400 mx-1">x</span></span>
                    <input 
                      type="number" min="0" disabled={isClosed}
                      className="w-20 rounded-lg border-slate-300 py-1.5 focus:border-primary focus:ring-primary text-center disabled:bg-slate-50 disabled:text-slate-500"
                      value={counts[d.toString()]}
                      onChange={(e) => handleCountChange(d.toString(), e.target.value)}
                    />
                    <span className="flex-1 text-right text-slate-500 font-medium">
                      = {formatPrice((parseInt(counts[d.toString()]) || 0) * d)}
                    </span>
                  </div>
                ))}
                <div className="flex items-center gap-3 col-span-2 pt-2 border-t border-slate-100">
                  <span className="w-14 text-right font-bold text-slate-600">Coins</span>
                  <input 
                    type="number" min="0" disabled={isClosed}
                    className="w-20 rounded-lg border-slate-300 py-1.5 focus:border-primary focus:ring-primary text-center disabled:bg-slate-50 disabled:text-slate-500"
                    value={counts.coins}
                    onChange={(e) => handleCountChange('coins', e.target.value)}
                  />
                  <span className="flex-1 text-right text-slate-500 font-medium">
                    = {formatPrice(parseFloat(counts.coins) || 0)}
                  </span>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t-2 border-slate-200">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-bold text-slate-800">Actual Counted Cash</span>
                  <span className="text-2xl font-black text-slate-800">{formatPrice(actualCash)}</span>
                </div>

                <div className={`p-4 rounded-xl flex items-center justify-between ${
                  difference === 0 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                  'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  <span className="font-bold">Difference (Actual - Expected)</span>
                  <span className="text-xl font-black">
                    {difference > 0 ? '+' : ''}{formatPrice(difference)}
                  </span>
                </div>
              </div>
            </div>
            
            {!isClosed && (
              <div className="px-6 py-5 border-t border-slate-200 bg-slate-50 print:hidden">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Closing Note (Optional)</label>
                  <input 
                    type="text" className="w-full rounded-lg border-slate-300 focus:border-primary focus:ring-primary"
                    placeholder="E.g., Difference due to missing change"
                    value={note} onChange={e => setNote(e.target.value)}
                  />
                </div>
                <Button fullWidth size="lg" onClick={handleSubmit} loading={submitting} disabled={submitting}>
                  <Save size={20} className="mr-2" /> Submit Day Closing
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DayClosing;
