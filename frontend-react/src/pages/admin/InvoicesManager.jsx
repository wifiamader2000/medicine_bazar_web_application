import React, { useEffect, useState } from 'react';
import { FileText, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';

const InvoicesManager = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/invoices?limit=50');
      setInvoices(res.data?.data || res.data?.invoices || []);
    } catch {
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Invoices</h1>
          <p className="text-sm text-slate-500">Sales invoices, printable receipts and accounting references.</p>
        </div>
        <Button onClick={loadInvoices} variant="secondary" className="flex items-center gap-2">
          <RefreshCw size={16} /> Refresh
        </Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center"><Loading /></div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FileText size={42} className="mx-auto mb-3 text-primary" />
            <h2 className="font-bold text-slate-900">No invoices yet</h2>
            <p className="text-sm">Invoices generated from orders and POS sales will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="text-left p-4">Invoice</th>
                  <th className="text-left p-4">Customer</th>
                  <th className="text-left p-4">Source</th>
                  <th className="text-left p-4">Date</th>
                  <th className="text-right p-4">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((invoice) => (
                  <tr key={invoice.id || invoice._id} className="hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-900">{invoice.invoiceNumber || invoice.id}</td>
                    <td className="p-4 text-slate-600">{invoice.customerName || invoice.phone || 'Customer'}</td>
                    <td className="p-4 text-slate-600">{invoice.source || invoice.type || 'order'}</td>
                    <td className="p-4 text-slate-600">{invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString() : '-'}</td>
                    <td className="p-4 text-right font-bold">৳{invoice.total || invoice.amount || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoicesManager;
