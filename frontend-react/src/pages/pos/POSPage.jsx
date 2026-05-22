import React, { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut } from 'lucide-react';
import api from '../../services/api';
import { clearStoredAuth, getStoredUser } from '../../utils/auth';
import POSCart from '../../components/pos/POSCart';
import POSPaymentPanel from '../../components/pos/POSPaymentPanel';
import POSReceipt from '../../components/pos/POSReceipt';
import POSSearch from '../../components/pos/POSSearch';
import Button from '../../components/common/Button';
import { formatPrice, productPrice, unwrapData } from '../../utils/apiData';
import { useLanguage } from '../../context/LanguageContext';

const POSPage = () => {
  const { user, token } = getStoredUser();
  const navigate = useNavigate();
  const { language, t } = useLanguage();

  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [customerPhone, setCustomerPhone] = useState('');
  const [openingCash, setOpeningCash] = useState('0');
  const [session, setSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastOrder, setLastOrder] = useState(null);

  // Held Carts State
  const [heldCarts, setHeldCarts] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('mb_held_carts') || '[]');
    } catch {
      return [];
    }
  });

  // Scanner Interceptor State
  const [scanBuffer, setScanBuffer] = useState('');
  const [lastCharTime, setLastCharTime] = useState(0);

  const receiptRef = useRef(null);

  useEffect(() => {
    if (!token) return;
    api.get('/pos/current-session')
      .then((response) => setSession(unwrapData(response)))
      .catch((err) => setError(err.response?.data?.message || t('pos.unableLoadSession')))
      .finally(() => setSessionLoading(false));
  }, [token, t]);

  // Hold / Recall cart handlers
  const holdCurrentCart = () => {
    if (cart.length === 0) return;
    if (heldCarts.length >= 5) {
      setError('Cannot hold more than 5 parallel carts. Please process or clear existing held carts.');
      return;
    }
    const newHeld = [...heldCarts, {
      id: 'HC-' + Date.now(),
      items: cart,
      discount,
      customerPhone,
      time: new Date().toISOString()
    }];
    setHeldCarts(newHeld);
    localStorage.setItem('mb_held_carts', JSON.stringify(newHeld));
    
    setCart([]);
    setDiscount(0);
    setCustomerPhone('');
    setError('Current cart has been put on hold.');
  };

  const recallCart = (id) => {
    const target = heldCarts.find(hc => hc.id === id);
    if (!target) return;

    setCart(target.items);
    setDiscount(target.discount || 0);
    setCustomerPhone(target.customerPhone || '');

    const remaining = heldCarts.filter(hc => hc.id !== id);
    setHeldCarts(remaining);
    localStorage.setItem('mb_held_carts', JSON.stringify(remaining));
    setError('Cart recalled successfully.');
  };

  // Intercept Keyboard & Barcode Scanners
  useEffect(() => {
    const handleGlobalKeyDown = async (e) => {
      const now = Date.now();

      // Escape key to reset cart
      if (e.key === 'Escape') {
        e.preventDefault();
        setCart([]);
        setDiscount(0);
        setCustomerPhone('');
        setError('Cart cleared.');
        return;
      }

      // Ctrl + H shortcut to hold cart
      if (e.ctrlKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        holdCurrentCart();
        return;
      }

      // F8 Focus Phone
      if (e.key === 'F8') {
        e.preventDefault();
        document.querySelector('input[type="tel"]')?.focus();
        return;
      }

      // F9 Pay / Print
      if (e.key === 'F9') {
        e.preventDefault();
        const payButton = document.querySelector('button[type="submit"]') || document.querySelector('button.h-16');
        payButton?.click();
        return;
      }

      // Barcode interceptor logic
      const isFast = now - lastCharTime < 50 || scanBuffer === '';
      setLastCharTime(now);

      if (e.key === 'Enter') {
        if (scanBuffer.length > 2 && now - lastCharTime < 120) {
          e.preventDefault();
          const barcode = scanBuffer.trim();
          setScanBuffer('');
          try {
            const res = await api.get(`/products?search=${encodeURIComponent(barcode)}`);
            const prods = unwrapData(res, []);
            if (prods.length > 0) {
              handleAddProduct(prods[0]);
              setError(`Scanned & Added: ${prods[0].name}`);
            }
          } catch (err) {
            console.error('Scan error:', err);
          }
        } else {
          setScanBuffer('');
        }
      } else if (e.key.length === 1 && /^[a-zA-Z0-9-]$/.test(e.key)) {
        if (isFast) {
          setScanBuffer(prev => prev + e.key);
        } else {
          setScanBuffer(e.key);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [scanBuffer, lastCharTime, cart, heldCarts, discount, customerPhone]);

  if (!token || (user?.role !== 'admin' && user?.role !== 'cashier')) {
    return <Navigate to="/login" replace />;
  }

  const openSession = async () => {
    setError('');
    setSessionLoading(true);
    try {
      const response = await api.post('/pos/open-session', { openingCash: Number(openingCash || 0) });
      setSession(unwrapData(response));
    } catch (err) {
      setError(err.response?.data?.message || t('pos.failedOpenSession'));
    } finally {
      setSessionLoading(false);
    }
  };

  const handleAddProduct = (product) => {
    if ((product.stockQuantity || 0) <= 0) {
      const prodName = language === 'bn' && product.nameBn ? product.nameBn : product.name;
      setError(`${prodName} ${t('pos.outOfStockErr')}`);
      return;
    }
    setError('');
    setCart((prev) => {
      const productId = product.id || product._id;
      const existing = prev.find((item) => (item.id || item._id) === productId);
      if (existing) {
        const nextQuantity = Math.min((existing.stockQuantity || 0), existing.quantity + 1);
        return prev.map((item) =>
          (item.id || item._id) === productId ? { ...item, quantity: nextQuantity } : item
        );
      }
      return [{ ...product, quantity: 1 }, ...prev];
    });
  };

  const handleUpdateQuantity = (id, delta) => {
    setCart((prev) => prev.map((item) => {
      if ((item.id || item._id) !== id) return item;
      const maxStock = item.stockQuantity || 1;
      return { ...item, quantity: Math.min(maxStock, Math.max(1, item.quantity + delta)) };
    }));
  };

  const handleRemove = (id) => {
    setCart((prev) => prev.filter((item) => (item.id || item._id) !== id));
  };

  const handleCheckout = async (paymentDetails) => {
    setError('');
    if (!session) {
      setError(t('pos.sessionBeforeSale'));
      return;
    }

    setLoading(true);
    try {
      const salePayload = {
        items: cart.map((item) => ({
          productId: item.id || item._id,
          quantity: item.quantity,
          price: productPrice(item),
          unit: item.unitType || item.unit || 'piece',
        })),
        paymentMethod: paymentDetails.paymentMethod,
        customerPhone: paymentDetails.customerPhone,
        discount: paymentDetails.discount,
      };
      const response = await api.post('/pos/sale', salePayload);
      const sale = unwrapData(response);

      setLastOrder({
        ...sale,
        orderNumber: sale.invoiceNumber,
        cashierName: user.name,
        tenderedAmount: paymentDetails.tenderedAmount,
        change: paymentDetails.change,
      });
      setCart([]);
      setDiscount(0);
      setCustomerPhone('');
      setSession((current) => current ? {
        ...current,
        totalSales: (current.totalSales || 0) + (sale.total || 0),
        salesCount: (current.salesCount || 0) + 1,
      } : current);

      setTimeout(() => handlePrint(), 100);
    } catch (err) {
      setError(err.response?.data?.message || t('pos.failedProcessSale'));
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (receiptRef.current) {
      const printContents = receiptRef.current.innerHTML;
      const originalContents = document.body.innerHTML;

      document.body.innerHTML = printContents;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload();
    }
  };

  const handleLogout = () => {
    clearStoredAuth();
    navigate('/login');
  };

  const subtotal = cart.reduce((sum, item) => sum + (productPrice(item) * item.quantity), 0);

  if (!sessionLoading && !session) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 w-full max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('pos.openPOSSession')}</h1>
          <p className="text-gray-500 mb-6">{t('pos.sessionRequired')}</p>
          {error && <div className="mb-4 rounded bg-alert/10 p-3 text-alert">{error}</div>}
          <label className="block text-sm font-semibold text-gray-700 mb-2">{t('pos.openingCash')}</label>
          <input
            type="number"
            min="0"
            className="mb-4 w-full rounded-xl border border-gray-300 p-3"
            value={openingCash}
            onChange={(event) => setOpeningCash(event.target.value)}
          />
          <Button fullWidth size="lg" onClick={openSession} disabled={sessionLoading}>{t('pos.openSession')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0 shadow-sm z-30 relative">
        <div className="flex items-center gap-4">
          {user.role === 'admin' && (
            <button onClick={() => navigate('/admin')} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors" title="Back to Admin">
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">{t('common.appName')} POS</h1>
            <p className="text-xs text-gray-500 font-medium">{t('pos.terminal')} 1 - {t('pos.cashier')}: {user.name}</p>
          </div>
        </div>

        {/* Real-time Session Metrics */}
        {session && (
          <div className="hidden lg:flex items-center gap-6 px-4 py-1.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-semibold">
            <div className="flex flex-col text-slate-500">
              <span>{language === 'bn' ? 'প্রারম্ভিক ক্যাশ:' : 'Starting Cash:'}</span>
              <span className="font-bold text-slate-700">{formatPrice(session.openingCash || 0)}</span>
            </div>
            <div className="h-6 w-px bg-slate-200"></div>
            <div className="flex flex-col text-slate-500">
              <span>{language === 'bn' ? 'আজকের বিক্রয়:' : 'POS Sales:'}</span>
              <span className="font-bold text-emerald-600">+{formatPrice(session.totalSales || 0)}</span>
            </div>
            <div className="h-6 w-px bg-slate-200"></div>
            <div className="flex flex-col text-slate-500">
              <span>{language === 'bn' ? 'ড্রয়ার ব্যালেন্স:' : 'Expected Cash:'}</span>
              <span className="font-bold text-primary-dark">{formatPrice((session.openingCash || 0) + (session.totalSales || 0))}</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-4">
          <span className="text-sm font-medium px-3 py-1 bg-primary/10 text-primary-dark rounded-full">
            {new Date().toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-alert transition-colors p-2 hover:bg-gray-100 rounded-lg">
            <LogOut size={18} />
            {t('pos.exit')}
          </button>
        </div>
      </header>

      {error && <div className="bg-alert/10 px-6 py-3 text-alert font-medium">{error}</div>}

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          <div className="p-4 border-b border-gray-100 shadow-sm z-20">
            <POSSearch onAddProduct={handleAddProduct} />
          </div>

          {/* Hold & Recall Carts Action Bar */}
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex items-center justify-between text-xs font-semibold text-gray-600 gap-4 shrink-0">
            <div className="flex items-center gap-2">
              <span className="bg-primary/10 text-primary-dark px-2 py-0.5 rounded uppercase text-[10px]">Carts</span>
              <button 
                type="button"
                onClick={holdCurrentCart}
                disabled={cart.length === 0}
                className="bg-white border border-gray-200 hover:border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-sm active:bg-gray-50 disabled:opacity-50 font-bold"
              >
                <span>Hold Cart</span>
                <span className="text-[10px] bg-gray-100 text-gray-400 px-1 rounded font-bold">Ctrl+H</span>
              </button>
            </div>
            
            {/* List of Held Carts */}
            <div className="flex items-center gap-2 overflow-x-auto max-w-[60%] py-1">
              {heldCarts.length === 0 ? (
                <span className="text-gray-400 italic">No held carts</span>
              ) : (
                heldCarts.map((hc, idx) => (
                  <button
                    key={hc.id}
                    type="button"
                    onClick={() => recallCart(hc.id)}
                    className="bg-amber-100 hover:bg-amber-200 border border-amber-200 text-amber-800 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all font-bold"
                  >
                    <span>Cart {idx + 1} ({hc.items.length} items)</span>
                    <span className="text-[10px] text-amber-600 font-bold">Recall</span>
                  </button>
                ))
              )}
            </div>
          </div>

          <POSCart items={cart} onUpdateQuantity={handleUpdateQuantity} onRemove={handleRemove} />
        </div>

        <POSPaymentPanel
          subtotal={subtotal}
          discount={discount}
          setDiscount={setDiscount}
          customerPhone={customerPhone}
          setCustomerPhone={setCustomerPhone}
          onCheckout={handleCheckout}
          loading={loading}
        />
      </div>

      <POSReceipt order={lastOrder} componentRef={receiptRef} />
    </div>
  );
};

export default POSPage;
