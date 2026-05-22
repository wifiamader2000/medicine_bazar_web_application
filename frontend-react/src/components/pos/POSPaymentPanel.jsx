import React, { useState, useEffect } from 'react';
import { formatPrice } from '../../utils/apiData';
import Button from '../common/Button';
import { Printer, Calculator, Banknote, CreditCard, Smartphone } from 'lucide-react';

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', icon: Banknote },
  { id: 'bkash', label: 'bKash', icon: Smartphone },
  { id: 'nagad', label: 'Nagad', icon: Smartphone },
  { id: 'card', label: 'Card', icon: CreditCard },
];

const POSPaymentPanel = ({ subtotal, discount, setDiscount, customerPhone, setCustomerPhone, onCheckout, loading }) => {
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [tenderedAmount, setTenderedAmount] = useState('');
  
  const [customerData, setCustomerData] = useState(null);
  const [customerLoading, setCustomerLoading] = useState(false);
  
  const total = Math.max(0, subtotal - discount);
  const parsedTendered = tenderedAmount === '' ? total : parseFloat(tenderedAmount) || 0;
  
  const change = Math.max(0, parsedTendered - total);
  const due = Math.max(0, total - parsedTendered);
  
  // Customer Lookup effect
  useEffect(() => {
    const phone = customerPhone.replace(/\D/g, '');
    if (phone.length >= 11) {
      setCustomerLoading(true);
      api.get(`/customers/phone/${phone}`)
        .then(res => setCustomerData(res.data.data))
        .catch(() => setCustomerData(null))
        .finally(() => setCustomerLoading(false));
    } else {
      setCustomerData(null);
    }
  }, [customerPhone]);

  // Keyboard shortcut F9 to checkout
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F9' && total > 0) {
        e.preventDefault();
        handleCheckout();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [total, paymentMethod, tenderedAmount, customerPhone, discount]);

  const handleCheckout = () => {
    if (due > 0 && !customerPhone) {
      alert('Due sale করতে customer select/create করতে হবে। (Phone number is required for due sale)');
      return;
    }
  
    const safeDiscount = Math.min(discount, subtotal);
    onCheckout({
      paymentMethod,
      tenderedAmount: parsedTendered,
      paidAmount: total - due, // Actual paid towards the bill
      dueAmount: due,
      change,
      discount: safeDiscount,
      customerPhone,
      customerId: customerData?.id,
      total
    });
  };

  return (
    <div className="w-[380px] bg-white border-l border-gray-200 flex flex-col h-full shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-20 relative">
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        
        {/* Customer Info */}
        <section>
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex justify-between">
            <span>Customer Phone (F8)</span>
            {customerLoading && <span className="text-primary text-xs">Searching...</span>}
          </label>
          <input
            type="tel"
            className={`w-full rounded-xl border ${due > 0 && !customerPhone ? 'border-rose-400 bg-rose-50 ring-1 ring-rose-400' : 'border-gray-300'} p-3 focus:border-primary focus:ring-1 focus:ring-primary shadow-sm`}
            placeholder="01XXXXXXXXX"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
          />
          {due > 0 && !customerPhone && (
            <div className="text-xs text-rose-600 mt-1 font-bold">Required for Due Sale</div>
          )}
          
          {customerData && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm">
              <div className="font-bold text-blue-900">{customerData.name || 'Walk-in Customer'}</div>
              {customerData.dueBalance > 0 && (
                <div className="text-rose-600 font-bold mt-1">Previous Due: {formatPrice(customerData.dueBalance)}</div>
              )}
            </div>
          )}
          {customerPhone.length >= 11 && !customerData && !customerLoading && (
            <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500">
              New customer will be created automatically.
            </div>
          )}
        </section>

        {/* Calculation */}
        <section className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-600 font-medium">Subtotal</span>
            <span className="font-bold text-gray-900">{formatPrice(subtotal)}</span>
          </div>
          
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-600 font-medium">Discount</span>
            <div className="relative w-24">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 font-medium">৳</span>
              <input
                type="number"
                min="0"
                max={subtotal}
                className="w-full rounded-lg border border-gray-300 py-1.5 pl-6 pr-2 text-right font-bold focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                value={discount === 0 ? '' : discount}
                onChange={(e) => setDiscount(Math.min(parseFloat(e.target.value) || 0, subtotal))}
              />
            </div>
          </div>

          <div className="border-t border-gray-200 my-3 pt-3 flex justify-between items-end">
            <span className="text-gray-900 font-bold text-lg">Total Payable</span>
            <span className="text-3xl font-black text-primary-dark">{formatPrice(total)}</span>
          </div>
        </section>

        {/* Payment Method */}
        <section>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Payment Method</label>
          <div className="grid grid-cols-2 gap-3">
            {PAYMENT_METHODS.map((method) => {
              const Icon = method.icon;
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                    paymentMethod === method.id 
                      ? 'border-primary bg-primary/10 text-primary-dark' 
                      : 'border-gray-200 bg-white text-gray-600 hover:border-primary/40'
                  }`}
                >
                  <Icon size={24} className="mb-2" />
                  <span className="font-semibold text-sm">{method.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Amount Tendered */}
        <section>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Amount Tendered</label>
          <input
            type="number"
            min="0"
            step="any"
            className="w-full rounded-xl border border-gray-300 p-3 text-xl font-bold focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
            placeholder={total.toString()}
            value={tenderedAmount}
            onChange={(e) => setTenderedAmount(e.target.value)}
          />
          
          {change > 0 && (
            <div className="mt-3 bg-emerald-50 text-emerald-800 p-3 rounded-lg border border-emerald-200 flex justify-between items-center">
              <span className="font-medium">Change Due:</span>
              <span className="font-bold text-xl">{formatPrice(change)}</span>
            </div>
          )}

          {due > 0 && (
            <div className="mt-3 bg-rose-50 text-rose-800 p-3 rounded-lg border border-rose-200 flex justify-between items-center">
              <span className="font-medium">Sale Due Amount:</span>
              <span className="font-bold text-xl">{formatPrice(due)}</span>
            </div>
          )}
        </section>

      </div>

      <div className="p-5 bg-white border-t border-gray-200">
        <Button 
          fullWidth 
          size="lg" 
          onClick={handleCheckout} 
          disabled={subtotal === 0 || loading || (due > 0 && !customerPhone)}
          loading={loading}
          className="h-16 text-xl shadow-lg"
        >
          <div className="flex items-center justify-center gap-2">
            <Calculator size={24} />
            PAY {formatPrice(total)} (F9)
          </div>
        </Button>
      </div>
    </div>
  );
};

export default POSPaymentPanel;
