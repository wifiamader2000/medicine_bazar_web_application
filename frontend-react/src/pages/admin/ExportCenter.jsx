import React, { useState } from 'react';
import { Download, FileText, TrendingUp, DollarSign, Package, AlertTriangle, Users, CreditCard, Table2 } from 'lucide-react';
import api from '../../services/api';

const ExportCenter = () => {
  const [loading, setLoading] = useState({});
  const [error, setError] = useState(null);

  // Helper function to handle blob download via api service
  const downloadExport = async (endpoint, filename, typeId) => {
    try {
      setLoading(prev => ({ ...prev, [typeId]: true }));
      setError(null);

      // Using the api interceptor to automatically add the Bearer token
      // We set responseType to 'blob' so axios parses it directly into a Blob
      const response = await api.get(endpoint, {
        responseType: 'blob'
      });

      // If the response is json (e.g. error returned incorrectly), check if it's an error
      if (response.data.type === 'application/json') {
        const text = await response.data.text();
        const json = JSON.parse(text);
        throw new Error(json.message || 'Export failed');
      }

      // Create a blob URL and trigger download
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      // Determine if error is inside blob text
      if (err.response && err.response.data && err.response.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          setError(json.message || 'Export failed');
        } catch (e) {
          setError(err.message || 'Failed to download export');
        }
      } else {
        setError(err.message || 'Failed to download export');
      }
    } finally {
      setLoading(prev => ({ ...prev, [typeId]: false }));
    }
  };

  const handleGoogleSheets = async () => {
    try {
      setLoading(prev => ({ ...prev, 'google-sheets': true }));
      setError(null);
      
      const response = await api.post('/export/google-sheets');
      if (response.data && !response.data.success) {
        throw new Error(response.data.message || 'Failed to connect');
      }
    } catch (err) {
      console.error('Google Sheets Error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to initiate Google Sheets export');
    } finally {
      setLoading(prev => ({ ...prev, 'google-sheets': false }));
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const yearMonthStr = `${new Date().getFullYear()}_${new Date().getMonth() + 1}`;

  const exportOptions = [
    {
      id: 'daily',
      title: 'Today Sales',
      description: 'Export all POS sales, online orders, expenses, and due collections for today.',
      icon: <TrendingUp size={24} className="text-emerald-600" />,
      action: () => downloadExport(`/export/daily-report?date=${todayStr}&format=csv`, `daily_report_${todayStr}.csv`, 'daily')
    },
    {
      id: 'monthly',
      title: 'Monthly Sales',
      description: 'Export daily breakdown of sales and expenses for the current month.',
      icon: <FileText size={24} className="text-blue-600" />,
      action: () => downloadExport(`/export/monthly-report?format=csv`, `monthly_report_${yearMonthStr}.csv`, 'monthly')
    },
    {
      id: 'accounting',
      title: 'Accounting Summary',
      description: 'Export cash book, total income, expenses, and profit/loss summary.',
      icon: <DollarSign size={24} className="text-purple-600" />,
      action: () => downloadExport(`/export/accounting?format=csv`, `accounting_summary.csv`, 'accounting')
    },
    {
      id: 'stock',
      title: 'Stock Report',
      description: 'Export complete product list, generic names, selling/purchase prices, and stock counts.',
      icon: <Package size={24} className="text-indigo-600" />,
      action: () => downloadExport(`/export/stock?format=csv`, `stock_report.csv`, 'stock')
    },
    {
      id: 'expiry',
      title: 'Near Expiry Report',
      description: 'Export products expiring within the next 30 days along with batch info.',
      icon: <AlertTriangle size={24} className="text-rose-600" />,
      action: () => downloadExport(`/export/expiry?withinDays=30&format=csv`, `expiry_report_30days.csv`, 'expiry')
    },
    {
      id: 'due',
      title: 'Customer Due',
      description: 'Export list of customers with pending due balances.',
      icon: <Users size={24} className="text-orange-600" />,
      action: () => downloadExport(`/export/customer-due?dueOnly=true&format=csv`, `customer_due_report.csv`, 'due')
    },
    {
      id: 'payments',
      title: 'Payment Verification',
      description: 'Export online payment records and their current verification status.',
      icon: <CreditCard size={24} className="text-teal-600" />,
      action: () => downloadExport(`/export/payments?format=csv`, `payments_report.csv`, 'payments')
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Export Center</h1>
        <p className="text-slate-500 mt-1">Download sales, accounting, stock, due and payment reports securely.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-3">
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Quick Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {exportOptions.map(option => (
          <div key={option.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                {option.icon}
              </div>
              <div>
                <h3 className="font-bold text-slate-800">{option.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mt-1">{option.description}</p>
              </div>
            </div>
            <div className="mt-auto pt-4 border-t border-slate-100 flex gap-3">
              <button
                onClick={option.action}
                disabled={loading[option.id]}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white font-medium py-2 rounded-lg transition-colors text-sm"
              >
                {loading[option.id] ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <Download size={16} />
                )}
                Download CSV
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Google Sheets Integration */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-50 rounded-lg">
              <Table2 size={24} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Google Sheets Integration</h3>
              <p className="text-xs text-slate-500 mt-1">Status: <span className="text-amber-600 font-semibold">Not Configured</span></p>
            </div>
          </div>
          <div className="p-4 bg-amber-50 text-amber-800 text-sm rounded-lg mb-4">
            Google Sheets integration is not configured. Add credentials in server .env to enable automated sync.
          </div>
          <button
            onClick={handleGoogleSheets}
            disabled={loading['google-sheets']}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium py-2 rounded-lg transition-colors text-sm"
          >
            {loading['google-sheets'] ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              'Sync to Google Sheets'
            )}
          </button>
        </div>

        {/* Download History Placeholder */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center text-center">
          <FileText size={48} className="text-slate-200 mb-4" />
          <h3 className="font-bold text-slate-800 mb-2">Download History</h3>
          <p className="text-sm text-slate-500 max-w-xs">
            Download history will appear after exports are tracked.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExportCenter;
