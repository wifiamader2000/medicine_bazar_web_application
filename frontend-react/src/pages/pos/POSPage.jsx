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
import { productPrice, unwrapData } from '../../utils/apiData';

const POSPage = () => {
  const { user, token } = getStoredUser();
  const navigate = useNavigate();

  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [customerPhone, setCustomerPhone] = useState('');
  const [openingCash, setOpeningCash] = useState('0');
  const [session, setSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastOrder, setLastOrder] = useState(null);

  const receiptRef = useRef(null);

  useEffect(() => {
    if (!token) return;
    api.get('/pos/current-session')
      .then((response) => setSession(unwrapData(response)))
      .catch((err) => setError(err.response?.data?.message || 'Unable to load POS session.'))
      .finally(() => setSessionLoading(false));
  }, [token]);

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
      setError(err.response?.data?.message || 'Failed to open POS session.');
    } finally {
      setSessionLoading(false);
    }
  };

  const handleAddProduct = (product) => {
    if ((product.stockQuantity || 0) <= 0) {
      setError(`${product.name} is out of stock.`);
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
      setError('Open a POS session before completing a sale.');
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
      setError(err.response?.data?.message || 'Failed to process POS sale.');
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Open POS Session</h1>
          <p className="text-gray-500 mb-6">A cashier session is required before sales can be recorded.</p>
          {error && <div className="mb-4 rounded bg-alert/10 p-3 text-alert">{error}</div>}
          <label className="block text-sm font-semibold text-gray-700 mb-2">Opening Cash</label>
          <input
            type="number"
            min="0"
            className="mb-4 w-full rounded-xl border border-gray-300 p-3"
            value={openingCash}
            onChange={(event) => setOpeningCash(event.target.value)}
          />
          <Button fullWidth size="lg" onClick={openSession} disabled={sessionLoading}>Open Session</Button>
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
            <h1 className="text-xl font-bold text-gray-900 leading-tight">Medicine Bazar POS</h1>
            <p className="text-xs text-gray-500 font-medium">Terminal 1 - Cashier: {user.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium px-3 py-1 bg-primary/10 text-primary-dark rounded-full">
            {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-alert transition-colors p-2 hover:bg-gray-100 rounded-lg">
            <LogOut size={18} />
            Exit
          </button>
        </div>
      </header>

      {error && <div className="bg-alert/10 px-6 py-3 text-alert font-medium">{error}</div>}

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          <div className="p-4 border-b border-gray-100 shadow-sm z-20">
            <POSSearch onAddProduct={handleAddProduct} />
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
