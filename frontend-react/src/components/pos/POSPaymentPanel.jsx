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
  
  const total = Math.max(0, subtotal - discount);
  const change = Math.max(0, (parseFloat(tenderedAmount) || 0) - total);

  // Keyboard shortcut F8 to checkout
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F8' && total > 0) {
        e.preventDefault();
        handleCheckout();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [total, paymentMethod, tenderedAmount, customerPhone, discount]);

  const handleCheckout = () => {
    const safeDiscount = Math.min(discount, subtotal);
    onCheckout({
      paymentMethod,
      tenderedAmount: parseFloat(tenderedAmount) || total,
      change,
      discount: safeDiscount,
      customerPhone,
      total
    });
  };

  return (
    <div className="w-[380px] bg-white border-l border-gray-200 flex flex-col h-full shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-20 relative">
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        
        {/* Customer Info */}
        <section>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Customer Phone (Optional)</label>
          <input
            type="tel"
            className="w-full rounded-xl border border-gray-300 p-3 focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
            placeholder="01XXXXXXXXX"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
          />
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

        {/* Cash Tendered */}
        {paymentMethod === 'cash' && (
          <section>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Amount Tendered</label>
            <input
              type="number"
              className="w-full rounded-xl border border-gray-300 p-3 text-xl font-bold focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
              placeholder={total.toString()}
              value={tenderedAmount}
              onChange={(e) => setTenderedAmount(e.target.value)}
            />
            {tenderedAmount > total && (
              <div className="mt-3 bg-green-50 text-green-800 p-3 rounded-lg border border-green-200 flex justify-between items-center">
                <span className="font-medium">Change Due:</span>
                <span className="font-bold text-xl">{formatPrice(change)}</span>
              </div>
            )}
          </section>
        )}
      </div>

      <div className="p-5 bg-white border-t border-gray-200">
        <Button 
          fullWidth 
          size="lg" 
          onClick={handleCheckout} 
          disabled={subtotal === 0 || loading}
          loading={loading}
          className="h-16 text-xl shadow-lg"
        >
          <div className="flex items-center justify-center gap-2">
            <Calculator size={24} />
            PAY {formatPrice(total)} (F8)
          </div>
        </Button>
      </div>
    </div>
  );
};

export default POSPaymentPanel;
