import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ShieldCheck, Truck, CreditCard, Upload } from 'lucide-react';
import api from '../../services/api';
import { formatPrice, productPrice, readCart, unwrapData, productRequiresPrescription } from '../../utils/apiData';
import { getStoredUser } from '../../utils/auth';
import Button from '../../components/common/Button';
import PaymentMethodCard from '../../components/payment/PaymentMethodCard';
import ManualPaymentForm from '../../components/payment/ManualPaymentForm';
import { useLanguage } from '../../context/LanguageContext';
import Badge from '../../components/common/Badge';

function normalizePaymentMethods(methods) {
  const normalized = Object.entries(methods || {})
    .filter(([, method]) => method?.available)
    .map(([id, method]) => ({
      id,
      name: method.name || id,
      description: method.type === 'link' ? 'Pay with the official payment link' : method.nameBn,
      number: method.number,
      link: method.url,
      type: method.type || (id === 'cod' ? 'cod' : 'manual'),
      disabled: false
    }));
    
  // Add Future Digital Payment Placeholders
  normalized.push(
    {
      id: 'sslcommerz_future',
      name: 'Credit/Debit Cards (SSLCommerz)',
      description: 'Coming Soon: Automated Digital Payments',
      type: 'placeholder',
      disabled: true
    },
    {
      id: 'bkash_automated_future',
      name: 'bKash Auto (Tokenized)',
      description: 'Coming Soon: Instant 1-Click Verification',
      type: 'placeholder',
      disabled: true
    }
  );
  
  return normalized;
}

const Checkout = () => {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const { token, user } = getStoredUser();
  const [cart, setCart] = useState(readCart);
  const [products, setProducts] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [transactionId, setTransactionId] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const [prescriptionUploading, setPrescriptionUploading] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/payment-methods')
      .then((response) => {
        const methods = normalizePaymentMethods(unwrapData(response, {}));
        setPaymentMethods(methods);
        if (methods.length && !methods.some((method) => method.id === paymentMethod)) {
          setPaymentMethod(methods[0].id);
        }
      })
      .catch(() => {
        setPaymentMethods([{ id: 'cod', name: 'Cash on Delivery', description: 'Pay at your doorstep', type: 'cod' }]);
        setPaymentMethod('cod');
      });
  }, []);

  useEffect(() => {
    if (cart.length === 0) {
      setProducts([]);
      return;
    }

    Promise.all(cart.map((item) =>
      api.get(`/products/${encodeURIComponent(item.productId)}`)
        .then((response) => ({ ...unwrapData(response), quantity: item.quantity }))
    ))
      .then(setProducts)
      .catch(() => setError('Failed to load cart items. Please refresh.'));
  }, [cart]);

  if (!token) return <Navigate to="/login?redirect=/checkout" replace />;

  const subtotal = products.reduce((sum, product) => sum + productPrice(product) * product.quantity, 0);
  const deliveryCharge = subtotal >= 500 || subtotal === 0 ? 0 : 60;
  const total = subtotal + deliveryCharge;
  const selectedMethodObj = paymentMethods.find((method) => method.id === paymentMethod) || paymentMethods[0];
  const isManualPayment = selectedMethodObj && selectedMethodObj.id !== 'cod';

  const uploadProof = async (orderId) => {
    if (!proofFile?.file) return;
    const formData = new FormData();
    formData.append('proof', proofFile.file);
    await api.post(`/orders/${orderId}/payment-proof`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  };

  const cartRequiresPrescription = products.some((p) => productRequiresPrescription(p));

  const placeOrder = async (event) => {
    event.preventDefault();
    setError('');

    if (cart.length === 0) {
      setError('Your cart is empty.');
      return;
    }
    if (isManualPayment && !transactionId.trim()) {
      setError('Transaction ID is required for manual payments.');
      return;
    }

    if (cartRequiresPrescription && !prescriptionFile) {
      setError(language === 'en' ? 'Prescription file is required for prescription-only medicines.' : 'প্রেসক্রিপশন-অনলি ওষুধের জন্য প্রেসক্রিপশন ফাইল আপলোড করা আবশ্যক।');
      return;
    }

    setLoading(true);

    try {
      let prescriptionId = null;

      if (cartRequiresPrescription && prescriptionFile) {
        setPrescriptionUploading(true);
        const formData = new FormData();
        formData.append('prescription', prescriptionFile);
        formData.append('patientName', shippingAddress.name);
        formData.append('note', 'Uploaded during checkout');
        
        try {
          const uploadRes = await api.post('/prescriptions/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          const uploadDataObj = unwrapData(uploadRes);
          prescriptionId = uploadDataObj.id;
        } catch (uploadErr) {
          setError(language === 'en' ? 'Failed to upload prescription. Please try again.' : 'প্রেসক্রিপশন আপলোড করতে ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
          setLoading(false);
          setPrescriptionUploading(false);
          return;
        }
        setPrescriptionUploading(false);
      }

      const response = await api.post('/orders', {
        items: cart,
        shippingAddress,
        paymentMethod,
        transactionId: isManualPayment ? transactionId.trim() : null,
        note: isManualPayment ? 'Manual payment submitted. Payment must be verified by admin.' : '',
        prescriptionId: prescriptionId || null,
      });

      const order = unwrapData(response);
      if (isManualPayment && proofFile?.file) {
        await uploadProof(order.id || order._id);
      }

      localStorage.removeItem('cart');
      setCart([]);
      navigate(`/order-success?id=${order.id || order._id || order.orderNumber}`, {
        state: {
          order,
          prescriptionUploaded: !!prescriptionId,
        }
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order or upload proof. Manual payments remain pending until admin verification.');
      setLoading(false);
    }
  };

  const updateQuantity = (id, delta) => {
    const newCart = cart.map((item) => item.productId === id
      ? { ...item, quantity: Math.max(1, item.quantity + delta) }
      : item);
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const removeItem = (id) => {
    const newCart = cart.filter((item) => item.productId !== id);
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  if (cart.length === 0) {
    return (
      <div className="bg-white p-12 rounded-xl border border-gray-200 text-center shadow-sm max-w-2xl mx-auto my-12">
        <div className="bg-gray-50 rounded-full h-24 w-24 flex items-center justify-center mx-auto mb-6">
          <ShoppingCart size={40} className="text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Cart is Empty</h2>
        <p className="text-gray-500 mb-8">Looks like you haven't added any medicines to your cart yet.</p>
        <Button onClick={() => navigate('/shop')} size="lg" className="px-8">
          Continue Shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Secure Checkout</h1>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-8 font-medium border border-red-100">
          {error}
        </div>
      )}

      <form onSubmit={placeOrder} className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-8">
          
          {/* Step 1: Delivery Details */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <span className="bg-primary/10 text-primary h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold">1</span>
              Delivery Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Full Name</label>
                <input required value={shippingAddress.name} onChange={(e) => setShippingAddress({ ...shippingAddress, name: e.target.value })} className="w-full bg-white border border-gray-300 rounded-lg p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Phone Number</label>
                <input required value={shippingAddress.phone} onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })} className="w-full bg-white border border-gray-300 rounded-lg p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Detailed Address</label>
                <input required placeholder="House, Road, Area" value={shippingAddress.address} onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })} className="w-full bg-white border border-gray-300 rounded-lg p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">City / District</label>
                <input required value={shippingAddress.city} onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })} className="w-full bg-white border border-gray-300 rounded-lg p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
              </div>
            </div>
          </section>

          {/* Step 1.5: Prescription Upload */}
          {cartRequiresPrescription && (
            <section className="bg-amber-50/50 border border-amber-200 rounded-xl p-6 sm:p-8 space-y-4">
              <h2 className="text-xl font-bold text-amber-900 flex items-center gap-3">
                <Upload className="text-amber-600" size={24} />
                {language === 'en' ? 'Prescription Upload Required' : 'প্রেসক্রিপশন আপলোড আবশ্যক'}
                <Badge className="ml-2 bg-amber-200 text-amber-800 border-none px-2 py-0.5 rounded text-xs font-semibold">
                  {language === 'en' ? 'Required' : 'আবশ্যক'}
                </Badge>
              </h2>
              <p className="text-sm text-amber-700 font-medium">
                {language === 'en' 
                  ? 'Your order contains prescription-only medicine(s). A valid prescription is legally required before we can dispatch your items.' 
                  : 'আপনার অর্ডারে প্রেসক্রিপশন-অনলি ওষুধ রয়েছে। ওষুধ প্রেরণের পূর্বে একটি বৈধ প্রেসক্রিপশন আপলোড করা আইনগতভাবে বাধ্যতামূলক।'}
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 p-6 bg-white border border-amber-200 border-dashed rounded-lg justify-center text-center">
                <input
                  type="file"
                  id="prescription-file-input"
                  accept=".jpg,.jpeg,.png,.pdf"
                  className="hidden"
                  onChange={(e) => setPrescriptionFile(e.target.files[0])}
                />
                <label
                  htmlFor="prescription-file-input"
                  className="cursor-pointer bg-amber-600 hover:bg-amber-700 text-white px-6 py-2.5 rounded-lg font-bold transition-colors inline-flex items-center gap-2 shadow-sm"
                >
                  <Upload size={18} />
                  {language === 'en' ? 'Select Prescription' : 'প্রেসক্রিপশন নির্বাচন করুন'}
                </label>
                <div className="text-left">
                  {prescriptionFile ? (
                    <div>
                      <p className="text-sm font-semibold text-gray-800 max-w-[250px] truncate">
                        {prescriptionFile.name}
                      </p>
                      <p className="text-xs text-gray-500 font-medium">
                        {(prescriptionFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-500 font-medium">
                        {language === 'en' ? 'No file chosen' : 'কোনো ফাইল নির্বাচন করা হয়নি'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {language === 'en' ? 'Supported: JPG, PNG, PDF (Max 5MB)' : 'সমর্থিত: JPG, PNG, PDF (সর্বোচ্চ ৫ মেগাবাইট)'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Step 2: Payment Method */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <span className="bg-primary/10 text-primary h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold">2</span>
              Payment Method
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {paymentMethods.map((method) => (
                <div 
                  key={method.id} 
                  onClick={() => !method.disabled && setPaymentMethod(method.id)}
                  className={`rounded-xl p-4 border transition-all ${method.disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'cursor-pointer hover:border-gray-300'} ${paymentMethod === method.id ? 'bg-primary/5 border-primary shadow-[0_0_0_1px_var(--color-primary)]' : 'bg-white border-gray-200'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === method.id ? 'border-primary' : 'border-gray-300'}`}>
                      {paymentMethod === method.id && <div className="w-2 h-2 rounded-full bg-primary"></div>}
                    </div>
                    <span className="font-bold text-gray-900">{method.name}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 ml-7">{method.description}</p>
                </div>
              ))}
            </div>

            {selectedMethodObj && selectedMethodObj.id !== 'cod' && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mt-4">
                <ManualPaymentForm
                  method={selectedMethodObj}
                  transactionId={transactionId}
                  setTransactionId={setTransactionId}
                  proofFile={proofFile}
                  setProofFile={setProofFile}
                />
              </div>
            )}
          </section>
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-96">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-4 pb-4 border-b border-gray-100 flex justify-between items-center">
              Order Summary
              <span className="bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full text-xs font-medium">{cart.length} Items</span>
            </h2>

            <div className="space-y-4 max-h-[40vh] overflow-y-auto mb-6 pr-2">
              {products.map((product) => (
                <div key={product.id || product._id} className="flex justify-between items-start gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-900 leading-tight">{product.name}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">{product.genericName || product.category}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <button type="button" onClick={() => updateQuantity(product.id || product._id, -1)} className="w-6 h-6 rounded border border-gray-300 bg-white flex items-center justify-center text-gray-600 hover:border-primary hover:text-primary transition-colors">-</button>
                      <span className="text-sm font-medium text-gray-900 w-4 text-center">{product.quantity}</span>
                      <button type="button" onClick={() => updateQuantity(product.id || product._id, 1)} className="w-6 h-6 rounded border border-gray-300 bg-white flex items-center justify-center text-gray-600 hover:border-primary hover:text-primary transition-colors">+</button>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <div className="font-bold text-primary text-sm">
                      {formatPrice(productPrice(product) * product.quantity)}
                    </div>
                    <button type="button" onClick={() => removeItem(product.id || product._id)} className="mt-2 text-xs text-red-500 hover:text-red-700 font-medium transition-colors">Remove</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 pt-4 border-t border-gray-100 mb-4">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span className="font-medium text-gray-900">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Delivery Charge</span>
                <span className="font-medium text-gray-900">{formatPrice(deliveryCharge)}</span>
              </div>
              {subtotal > 0 && subtotal < 500 && (
                <div className="bg-blue-50 text-blue-700 p-2.5 rounded-lg text-sm text-center border border-blue-100 mt-2">
                  Add <strong>{formatPrice(500 - subtotal)}</strong> more for FREE delivery.
                </div>
              )}
            </div>

            <div className="flex justify-between items-end pt-4 border-t border-gray-200 mb-6">
              <span className="font-bold text-gray-900">Total</span>
              <div className="text-right">
                <span className="text-2xl font-extrabold text-[var(--color-primary)]">{formatPrice(total)}</span>
              </div>
            </div>

            <Button 
              type="submit" 
              fullWidth
              size="lg"
              disabled={loading} 
              className="font-bold flex justify-center gap-2"
            >
              {loading ? (
                <span>Processing...</span>
              ) : (
                <>
                  <ShieldCheck size={20} />
                  {isManualPayment ? 'Verify Payment' : 'Confirm Order'}
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Checkout;
