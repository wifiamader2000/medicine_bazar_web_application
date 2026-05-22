import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import api from '../../services/api';
import { unwrapData } from '../../utils/apiData';

const PaymentGateways = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/gateways/status')
      .then(res => {
        setStatus(unwrapData(res));
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching gateway status:', err);
        setError('Failed to load payment gateway status.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-muted">Loading gateway status...</div>;
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200">
          {error}
        </div>
      </div>
    );
  }

  const renderStatusCard = (name, config, iconColor, bgColor) => {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgColor}`}>
              <CreditCard className={iconColor} size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">{name}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Automated Gateway</p>
            </div>
          </div>
          {config?.configured && config?.enabled ? (
            <span className="flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
              <CheckCircle size={12} /> Active
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
              <XCircle size={12} /> Inactive
            </span>
          )}
        </div>

        <div className="space-y-3 mt-6">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Credentials Configured</span>
            <span className={config?.configured ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>
              {config?.configured ? 'Yes' : 'No'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Globally Enabled</span>
            <span className={config?.enabled ? 'text-green-600 font-bold' : 'text-slate-500 font-bold'}>
              {config?.enabled ? 'Yes' : 'No'}
            </span>
          </div>
        </div>

        {!config?.configured && (
          <div className="mt-5 bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2 items-start">
            <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={14} />
            <p className="text-xs text-amber-800 leading-relaxed">
              Configure {name} credentials in the server <code>.env</code> file to enable this gateway.
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800">Payment Gateways</h1>
        <p className="text-slate-500 text-sm mt-1">Manage automated payment methods and their connection status.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {renderStatusCard('bKash', status?.bkash, 'text-[#D12053]', 'bg-[#D12053]/10')}
        {renderStatusCard('Nagad', status?.nagad, 'text-[#F06222]', 'bg-[#F06222]/10')}
        {renderStatusCard('SSLCommerz', status?.sslcommerz, 'text-slate-700', 'bg-slate-100')}
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-6">
        <h3 className="font-bold text-blue-900 mb-2">Manual Payments (Active)</h3>
        <p className="text-sm text-blue-800 mb-4">
          Cash on Delivery (COD) and manual Send Money options are currently enabled by default. Customers can enter transaction IDs manually for admin verification.
        </p>
        <ul className="text-sm text-blue-800 space-y-1 list-disc pl-5">
          <li>bKash Personal: 01602444532</li>
          <li>Nagad Personal: 01602444532</li>
          <li>Upay Personal: 01602444532</li>
          <li>Merchant: 01940826276</li>
        </ul>
      </div>
    </div>
  );
};

export default PaymentGateways;
