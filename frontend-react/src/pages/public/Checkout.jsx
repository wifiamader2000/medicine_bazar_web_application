import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Truck, 
  CreditCard, 
  Upload, 
  ShoppingCart, 
  User, 
  MapPin, 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  AlertTriangle,
  Copy,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import api from '../../services/api';
import { formatPrice, productPrice, readCart, unwrapData, productRequiresPrescription } from '../../utils/apiData';
import { getStoredUser } from '../../utils/auth';
import Button from '../../components/common/Button';
import PaymentProofUpload from '../../components/payment/PaymentProofUpload';
import { useLanguage } from '../../context/LanguageContext';
import Badge from '../../components/common/Badge';

const Checkout = () => {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const { token, user } = getStoredUser();

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1); // 1 to 5

  const [cart, setCart] = useState(readCart);
  const [products, setProducts] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [transactionId, setTransactionId] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const [prescriptionUploading, setPrescriptionUploading] = useState(false);
  const [copiedId, setCopiedId] = useState('');

  // Shipping details state
  const [shippingAddress, setShippingAddress] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    address: user?.address || '',
    city: user?.city || '',
    area: user?.area || '', // Upazila/Thana
    note: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Manual payment accounts as specified
  const paymentAccounts = {
    bkash_personal: { name: 'bKash Personal', number: '01602444532', type: 'manual' },
    nagad_personal: { name: 'Nagad Personal', number: '01602444532', type: 'manual' },
    upay_personal: { name: 'Upay Personal', number: '01602444532', type: 'manual' },
    merchant: { 
      name: 'Bismillah Store Merchant', 
      number: '01940826276', 
      type: 'merchant',
      link: 'https://shop.bkash.com/bismillah-store01940826276/paymentlink'
    }
  };

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
  const cartRequiresPrescription = products.some((p) => productRequiresPrescription(p));

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 2000);
  };

  const validateStep = () => {
    setError('');
    if (currentStep === 1) {
      if (cart.length === 0) {
        setError(language === 'bn' ? 'আপনার কার্ট খালি।' : 'Your cart is empty.');
        return false;
      }
      if (cartRequiresPrescription && !prescriptionFile) {
        setError(language === 'bn' ? 'প্রেসক্রিপশন আপলোড করা আবশ্যক।' : 'Prescription file is required for prescription medicines.');
        return false;
      }
    }
    if (currentStep === 2) {
      if (!shippingAddress.name.trim()) {
        setError(language === 'bn' ? 'অনুগ্রহ করে আপনার নাম দিন।' : 'Please enter your name.');
        return false;
      }
      if (!shippingAddress.phone.trim() || shippingAddress.phone.replace(/\D/g, '').length < 11) {
        setError(language === 'bn' ? 'সঠিক ১১-ডিজিটের মোবাইল নম্বর দিন।' : 'Please enter a valid 11-digit phone number.');
        return false;
      }
    }
    if (currentStep === 3) {
      if (!shippingAddress.address.trim()) {
        setError(language === 'bn' ? 'ডেলিভারি ঠিকানা দিন।' : 'Please enter detailed address.');
        return false;
      }
      if (!shippingAddress.city.trim()) {
        setError(language === 'bn' ? 'শহর / জেলা দিন।' : 'Please enter city/district.');
        return false;
      }
      if (!shippingAddress.area.trim()) {
        setError(language === 'bn' ? 'এলাকা / থানা দিন।' : 'Please enter area/thana.');
        return false;
      }
    }
    if (currentStep === 4) {
      if (paymentMethod !== 'cod') {
        if (!transactionId.trim()) {
          setError(language === 'bn' ? 'ম্যানুয়াল পেমেন্টের জন্য ট্রানজেকশন আইডি আবশ্যক।' : 'Transaction ID is required for manual payment verification.');
          return false;
        }
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(prev => Math.min(5, prev + 1));
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    setError('');
    setCurrentStep(prev => Math.max(1, prev - 1));
    window.scrollTo(0, 0);
  };

  const uploadProof = async (orderId) => {
    if (!proofFile?.file) return;
    const formData = new FormData();
    formData.append('proof', proofFile.file);
    await api.post(`/orders/${orderId}/payment-proof`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  };

  const placeOrder = async () => {
    setError('');
    setLoading(true);

    try {
      let prescriptionId = null;

      if (cartRequiresPrescription && prescriptionFile) {
        setPrescriptionUploading(true);
        const formData = new FormData();
        formData.append('prescription', prescriptionFile);
        formData.append('patientName', shippingAddress.name);
        formData.append('note', 'Uploaded during checkout wizard');
        
        try {
          const uploadRes = await api.post('/prescriptions/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          const uploadDataObj = unwrapData(uploadRes);
          prescriptionId = uploadDataObj.id;
        } catch (uploadErr) {
          setError(language === 'en' ? 'Failed to upload prescription.' : 'প্রেসক্রিপশন আপলোড ব্যর্থ হয়েছে।');
          setLoading(false);
          setPrescriptionUploading(false);
          return;
        }
        setPrescriptionUploading(false);
      }

      const orderPayload = {
        items: cart,
        shippingAddress: {
          name: shippingAddress.name,
          phone: shippingAddress.phone,
          address: `${shippingAddress.address}, ${shippingAddress.area}, ${shippingAddress.city}`,
          note: shippingAddress.note
        },
        paymentMethod,
        transactionId: paymentMethod !== 'cod' ? transactionId.trim() : null,
        note: paymentMethod !== 'cod' ? 'Manual mobile banking transaction submitted.' : '',
        prescriptionId: prescriptionId || null,
      };

      const response = await api.post('/orders', orderPayload);
      const order = unwrapData(response);

      if (paymentMethod !== 'cod' && proofFile?.file) {
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
      setError(err.response?.data?.message || 'Failed to place order. Manual payments remain pending until verified.');
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

  if (cart.length === 0 && currentStep === 1) {
    return (
      <div className="bg-white p-12 rounded-[24px] border border-slate-200 text-center shadow-lg max-w-2xl mx-auto my-12 animate-fade-up glass-panel">
        <div className="bg-primary/5 rounded-full h-24 w-24 flex items-center justify-center mx-auto mb-6">
          <ShoppingCart size={40} className="text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-text mb-2">
          {language === 'bn' ? 'আপনার কার্ট খালি' : 'Your Cart is Empty'}
        </h2>
        <p className="text-muted mb-8">
          {language === 'bn' ? 'কার্টে কোনো ওষুধ যোগ করা হয়নি।' : 'Looks like you have not added any medicines to your cart yet.'}
        </p>
        <Button onClick={() => navigate('/shop')} size="lg" className="px-8 pressable">
          {language === 'bn' ? 'ওষুধ কিনুন' : 'Continue Shopping'}
        </Button>
      </div>
    );
  }

  const stepsMeta = [
    { label: language === 'bn' ? 'কার্ট রিভিউ' : 'Cart Review', icon: ShoppingCart },
    { label: language === 'bn' ? 'গ্রাহক তথ্য' : 'Identity Info', icon: User },
    { label: language === 'bn' ? 'ঠিকানা' : 'Address', icon: MapPin },
    { label: language === 'bn' ? 'পেমেন্ট' : 'Payment', icon: CreditCard },
    { label: language === 'bn' ? 'রিভিউ ও নিশ্চিত' : 'Review & Place', icon: ShieldCheck }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-up">
      {/* 5-Step Progress Header Bar */}
      <div className="mb-10">
        <div className="flex items-center justify-between relative max-w-4xl mx-auto">
          {/* Background Connecting Bar */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 z-0 rounded-full"></div>
          
          {/* Active Connecting Bar */}
          <div 
            className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 z-0 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
          ></div>

          {stepsMeta.map((s, index) => {
            const stepNum = index + 1;
            const Icon = s.icon;
            const isCompleted = stepNum < currentStep;
            const isActive = stepNum === currentStep;

            return (
              <div key={stepNum} className="flex flex-col items-center relative z-10">
                <button
                  type="button"
                  disabled={stepNum > currentStep && !validateStep()}
                  onClick={() => {
                    if (stepNum < currentStep || validateStep()) {
                      setCurrentStep(stepNum);
                    }
                  }}
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-2 ${
                    isCompleted 
                      ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                      : isActive 
                        ? 'bg-white border-primary text-primary ring-4 ring-primary/10 shadow-md scale-110' 
                        : 'bg-white border-slate-300 text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check size={18} /> : <Icon size={18} />}
                </button>
                <span className={`text-xs mt-2.5 font-bold ${isActive ? 'text-primary scale-105' : isCompleted ? 'text-text' : 'text-muted'} hidden sm:inline`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-alert p-4 rounded-2xl mb-8 font-semibold border border-red-100 animate-soft-scale flex items-center gap-2.5">
          <AlertTriangle size={20} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Wizard Main Content */}
        <div className="flex-1 w-full space-y-6">
          
          {/* STEP 1: CART REVIEW */}
          {currentStep === 1 && (
            <div className="glass-card p-6 sm:p-8">
              <h3 className="text-xl font-black text-text mb-6 flex items-center gap-2.5">
                <ShoppingCart className="text-primary" />
                {language === 'bn' ? 'ধাপ ১: কার্ট রিভিউ' : 'Step 1: Cart Review'}
              </h3>
              
              <div className="space-y-4 mb-6">
                {products.map((product) => {
                  const limitWarn = product.stock <= 5;
                  const isRx = productRequiresPrescription(product);
                  return (
                    <div key={product.id || product._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/70 border border-slate-100 rounded-2xl gap-4 hover:border-primary/25 transition">
                      <div className="flex gap-4 items-start">
                        {product.imageUrl && (
                          <img src={product.imageUrl} alt={product.name} className="w-16 h-16 object-cover rounded-xl border border-slate-100 shrink-0" />
                        )}
                        <div>
                          <h4 className="font-bold text-text">{product.name}</h4>
                          <p className="text-xs text-muted leading-relaxed">
                            {product.genericName || product.manufacturer}
                          </p>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {isRx && (
                              <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-extrabold tracking-wider uppercase">
                                Rx Requires Prescription
                              </span>
                            )}
                            {limitWarn && (
                              <span className="bg-red-50 text-alert text-[10px] px-2 py-0.5 rounded-full font-bold">
                                Only {product.stock} left in stock!
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6">
                        <div className="flex items-center gap-3 bg-slate-100 p-1 rounded-xl border border-slate-200">
                          <button
                            type="button"
                            onClick={() => updateQuantity(product.id || product._id, -1)}
                            className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center hover:text-primary transition font-bold"
                          >
                            -
                          </button>
                          <span className="w-6 text-center font-bold text-text text-sm">{product.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(product.id || product._id, 1)}
                            className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center hover:text-primary transition font-bold"
                          >
                            +
                          </button>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-extrabold text-primary text-base">
                            {formatPrice(productPrice(product) * product.quantity)}
                          </p>
                          <button
                            type="button"
                            onClick={() => removeItem(product.id || product._id)}
                            className="text-xs font-bold text-alert hover:underline mt-1"
                          >
                            {language === 'bn' ? 'মুছে ফেলুন' : 'Remove'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Step 1 Prescription File Attachment */}
              {cartRequiresPrescription && (
                <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Upload className="text-amber-600" size={22} />
                    <h4 className="font-bold text-amber-900">
                      {language === 'bn' ? 'প্রেসক্রিপশন আপলোড আবশ্যক' : 'Prescription Upload Required'}
                    </h4>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed font-medium">
                    {language === 'bn'
                      ? 'আপনার কার্টে প্রেসক্রিপশন আবশ্যক ওষুধ রয়েছে। অনুগ্রহ করে আপনার ডাক্তারের প্রেসক্রিপশন আপলোড করুন।'
                      : 'Your cart contains prescription-only items. Please attach a clear scan/photo of your prescription.'}
                  </p>
                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 border border-dashed border-amber-300 rounded-xl justify-center">
                    <input
                      type="file"
                      id="wizard-rx-file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      className="hidden"
                      onChange={(e) => setPrescriptionFile(e.target.files[0])}
                    />
                    <label
                      htmlFor="wizard-rx-file"
                      className="cursor-pointer bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-2 shadow-sm"
                    >
                      <Upload size={14} />
                      {language === 'bn' ? 'প্রেসক্রিপশন ফাইল বা ছবি' : 'Browse File'}
                    </label>
                    <div className="text-left text-xs">
                      {prescriptionFile ? (
                        <div>
                          <p className="font-bold text-text max-w-[200px] truncate">{prescriptionFile.name}</p>
                          <p className="text-muted">{(prescriptionFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-muted font-semibold">{language === 'bn' ? 'কোনো ফাইল নেই' : 'No file chosen'}</p>
                          <p className="text-[10px] text-gray-400">JPG, PNG, PDF (Max 5MB)</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: IDENTITY INFO */}
          {currentStep === 2 && (
            <div className="glass-card p-6 sm:p-8">
              <h3 className="text-xl font-black text-text mb-6 flex items-center gap-2.5">
                <User className="text-primary" />
                {language === 'bn' ? 'ধাপ ২: গ্রাহক তথ্য' : 'Step 2: Customer Identity'}
              </h3>
              
              <div className="bg-primary/5 rounded-2xl p-4 mb-6 border border-primary/10 flex items-center gap-3">
                <ShieldCheck className="text-primary shrink-0" />
                <p className="text-xs text-primary-dark font-medium leading-relaxed">
                  {language === 'bn'
                    ? 'আপনি বর্তমানে লগইন আছেন। আপনার অর্ডার অ্যাকাউন্টে সেভ করা হবে।'
                    : 'You are securely logged in. Order details will be recorded under your account profile.'}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-text mb-2">
                    {language === 'bn' ? 'পূর্ণ নাম' : 'Full Name'} *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                    value={shippingAddress.name}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-text mb-2">
                      {language === 'bn' ? 'মোবাইল নম্বর' : 'Phone Number'} *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="017XXXXXXXX"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                      value={shippingAddress.phone}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-text mb-2">
                      {language === 'bn' ? 'ইমেইল অ্যাড্রেস (ঐচ্ছিক)' : 'Email Address (Optional)'}
                    </label>
                    <input
                      type="email"
                      placeholder="name@example.com"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                      value={shippingAddress.email}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, email: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: DELIVERY ADDRESS */}
          {currentStep === 3 && (
            <div className="glass-card p-6 sm:p-8">
              <h3 className="text-xl font-black text-text mb-6 flex items-center gap-2.5">
                <MapPin className="text-primary" />
                {language === 'bn' ? 'ধাপ ৩: ডেলিভারি ঠিকানা' : 'Step 3: Delivery Address'}
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-text mb-2">
                      {language === 'bn' ? 'শহর / জেলা' : 'City / District'} *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dhaka"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-text mb-2">
                      {language === 'bn' ? 'এলাকা / থানা' : 'Area / Thana'} *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dhanmondi"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                      value={shippingAddress.area}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, area: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-text mb-2">
                    {language === 'bn' ? 'বিস্তারিত ঠিকানা' : 'Detailed Address'} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="House, Road, Apartment or Landmark"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                    value={shippingAddress.address}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-text mb-2">
                    {language === 'bn' ? 'বিশেষ নোট (ঐচ্ছিক)' : 'Delivery Note (Optional)'}
                  </label>
                  <textarea
                    placeholder="e.g. Please leave at door, call before delivery"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white h-20 resize-none"
                    value={shippingAddress.note}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, note: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: PAYMENT SELECTION */}
          {currentStep === 4 && (
            <div className="glass-card p-6 sm:p-8">
              <h3 className="text-xl font-black text-text mb-6 flex items-center gap-2.5">
                <CreditCard className="text-primary" />
                {language === 'bn' ? 'ধাপ ৪: পেমেন্ট পদ্ধতি' : 'Step 4: Payment Selection'}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {/* Cash on Delivery */}
                <div 
                  onClick={() => setPaymentMethod('cod')}
                  className={`rounded-2xl p-4 border-2 transition cursor-pointer hover:border-primary/45 ${
                    paymentMethod === 'cod' 
                      ? 'bg-primary/5 border-primary shadow-sm' 
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center shrink-0">
                      {paymentMethod === 'cod' && <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>}
                    </span>
                    <span className="font-extrabold text-text">
                      {language === 'bn' ? 'ক্যাশ অন ডেলিভারি' : 'Cash on Delivery (COD)'}
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-1.5 ml-8">
                    {language === 'bn' ? 'পণ্য হাতে পেয়ে নগদ মূল্য পরিশোধ করুন।' : 'Pay at your doorstep when medicine arrives.'}
                  </p>
                </div>

                {/* bKash Personal */}
                <div 
                  onClick={() => setPaymentMethod('bkash_personal')}
                  className={`rounded-2xl p-4 border-2 transition cursor-pointer hover:border-primary/45 ${
                    paymentMethod === 'bkash_personal' 
                      ? 'bg-primary/5 border-primary shadow-sm' 
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center shrink-0">
                      {paymentMethod === 'bkash_personal' && <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>}
                    </span>
                    <span className="font-extrabold text-[#D12053]">bKash Personal</span>
                  </div>
                  <p className="text-xs text-muted mt-1.5 ml-8">
                    Manual Send Money to {paymentAccounts.bkash_personal.number}
                  </p>
                </div>

                {/* Nagad Personal */}
                <div 
                  onClick={() => setPaymentMethod('nagad_personal')}
                  className={`rounded-2xl p-4 border-2 transition cursor-pointer hover:border-primary/45 ${
                    paymentMethod === 'nagad_personal' 
                      ? 'bg-primary/5 border-primary shadow-sm' 
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center shrink-0">
                      {paymentMethod === 'nagad_personal' && <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>}
                    </span>
                    <span className="font-extrabold text-[#F06222]">Nagad Personal</span>
                  </div>
                  <p className="text-xs text-muted mt-1.5 ml-8">
                    Manual Send Money to {paymentAccounts.nagad_personal.number}
                  </p>
                </div>

                {/* Upay Personal */}
                <div 
                  onClick={() => setPaymentMethod('upay_personal')}
                  className={`rounded-2xl p-4 border-2 transition cursor-pointer hover:border-primary/45 ${
                    paymentMethod === 'upay_personal' 
                      ? 'bg-primary/5 border-primary shadow-sm' 
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center shrink-0">
                      {paymentMethod === 'upay_personal' && <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>}
                    </span>
                    <span className="font-extrabold text-[#1F5AB3]">Upay Personal</span>
                  </div>
                  <p className="text-xs text-muted mt-1.5 ml-8">
                    Manual Send Money to {paymentAccounts.upay_personal.number}
                  </p>
                </div>

                {/* bKash Merchant Account */}
                <div 
                  onClick={() => setPaymentMethod('merchant')}
                  className={`rounded-2xl p-4 border-2 transition cursor-pointer hover:border-primary/45 sm:col-span-2 ${
                    paymentMethod === 'merchant' 
                      ? 'bg-primary/5 border-primary shadow-sm' 
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center shrink-0">
                      {paymentMethod === 'merchant' && <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>}
                    </span>
                    <span className="font-extrabold text-gold flex items-center gap-1.5">
                      bKash Merchant Paylink (Bismillah Store)
                      <span className="bg-primary/10 text-primary text-[9px] px-2 py-0.5 rounded font-extrabold uppercase">
                        Recommended
                      </span>
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-1.5 ml-8">
                    Click paylink, make payment, then copy/paste TrxID below for automated queue review.
                  </p>
                </div>
              </div>

              {/* Render Instructions if manual/merchant payment selected */}
              {paymentMethod !== 'cod' && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mt-6 space-y-6">
                  <div>
                    <h4 className="font-bold text-text text-sm mb-3">
                      How to Complete Manual Payment:
                    </h4>
                    
                    <div className="bg-white rounded-xl p-4 border border-slate-100 space-y-3.5 text-xs text-text">
                      <div className="flex items-start gap-2.5">
                        <span className="bg-primary/10 text-primary font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">1</span>
                        <div>
                          {paymentMethod === 'merchant' ? (
                            <p>
                              Open the official{' '}
                              <a 
                                href={paymentAccounts.merchant.link} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-primary font-extrabold hover:underline inline-flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded"
                              >
                                bKash Merchant Link <ExternalLink size={12} />
                              </a>{' '}
                              and pay the exact amount.
                            </p>
                          ) : (
                            <p>
                              Open your Mobile Banking App and choose <strong>Send Money</strong>.
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <span className="bg-primary/10 text-primary font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">2</span>
                        <div className="flex-1 flex flex-wrap items-center gap-2">
                          <span>Send the payment to the number:</span>
                          <span className="font-mono bg-slate-100 px-2 py-0.5 rounded font-extrabold text-sm tracking-wider text-text">
                            {paymentMethod === 'merchant' ? paymentAccounts.merchant.number : paymentAccounts[paymentMethod].number}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(paymentMethod === 'merchant' ? paymentAccounts.merchant.number : paymentAccounts[paymentMethod].number, paymentMethod)}
                            className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                          >
                            {copiedId === paymentMethod ? <><Check size={10}/> Copied</> : <><Copy size={10}/> Copy</>}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <span className="bg-primary/10 text-primary font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">3</span>
                        <p>
                          Enter the exact total amount: <strong className="text-primary">{formatPrice(total)}</strong>.
                        </p>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <span className="bg-primary/10 text-primary font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">4</span>
                        <p>
                          Copy the Transaction ID (TrxID) and enter it below.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-text mb-2">
                        Transaction ID (TrxID) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 9XBA4V9B"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white tracking-wider font-mono font-bold"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                      />
                      <p className="text-[10px] text-muted mt-1">
                        Found in your payment confirmation SMS or in-app history.
                      </p>
                    </div>

                    <PaymentProofUpload 
                      file={proofFile} 
                      onUpload={(f) => setProofFile(f)} 
                      onRemove={() => setProofFile(null)} 
                    />

                    {/* Manual Payment Verification Warning Banner */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 leading-relaxed font-semibold">
                      ⚠️ Warning: Manual payment orders will be placed with status "Pending Verification". The order will not be marked as PAID or processed until the admin validates the transaction ID.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: FINAL REVIEW & PLACE ORDER */}
          {currentStep === 5 && (
            <div className="glass-card p-6 sm:p-8 space-y-6">
              <h3 className="text-xl font-black text-text mb-4 flex items-center gap-2.5">
                <ShieldCheck className="text-primary" />
                {language === 'bn' ? 'ধাপ ৫: রিভিউ ও নিশ্চিতকরণ' : 'Step 5: Review & Place Order'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Shipping info summary card */}
                <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                  <h4 className="text-xs font-black text-muted uppercase tracking-wider mb-2">
                    Shipping & Identity Info
                  </h4>
                  <p className="text-sm font-bold text-text">{shippingAddress.name}</p>
                  <p className="text-xs text-muted mt-0.5">{shippingAddress.phone}</p>
                  {shippingAddress.email && <p className="text-xs text-muted">{shippingAddress.email}</p>}
                </div>

                {/* Delivery Address summary card */}
                <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                  <h4 className="text-xs font-black text-muted uppercase tracking-wider mb-2">
                    Delivery Address
                  </h4>
                  <p className="text-sm font-bold text-text">
                    {shippingAddress.address}, {shippingAddress.area}, {shippingAddress.city}
                  </p>
                  {shippingAddress.note && (
                    <p className="text-xs text-amber-800 font-semibold mt-1">
                      Note: {shippingAddress.note}
                    </p>
                  )}
                </div>
              </div>

              {/* Payment Summary */}
              <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                <h4 className="text-xs font-black text-muted uppercase tracking-wider mb-2">
                  Payment Method Selection
                </h4>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-primary text-sm uppercase">
                    {paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : paymentMethod.replace('_', ' ')}
                  </span>
                  {paymentMethod !== 'cod' && (
                    <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                      TrxID: {transactionId}
                    </span>
                  )}
                </div>
              </div>

              {/* Prescription indicator */}
              {cartRequiresPrescription && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center gap-2.5 text-xs text-primary-dark font-bold">
                  <ShieldCheck size={16} />
                  <span>Prescription has been successfully selected for upload on submit.</span>
                </div>
              )}
            </div>
          )}

          {/* Stepper Wizard Navigation Buttons */}
          <div className="flex items-center justify-between pt-4">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-6 py-3 border border-slate-300 hover:bg-slate-50 text-text rounded-xl font-bold transition flex items-center gap-2 pressable"
              >
                <ArrowLeft size={16} />
                {language === 'bn' ? 'পূর্ববর্তী' : 'Back'}
              </button>
            ) : (
              <div></div>
            )}

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition flex items-center gap-2 pressable shadow-lg shadow-primary/25"
              >
                {language === 'bn' ? 'পরবর্তী' : 'Continue'}
                <ArrowRight size={16} />
              </button>
            ) : (
              <Button
                onClick={placeOrder}
                disabled={loading}
                className="px-8 py-3.5 font-black text-base shadow-xl flex items-center gap-2 pressable"
              >
                {loading ? (
                  <span>Processing Order...</span>
                ) : (
                  <>
                    <ShieldCheck size={20} />
                    {language === 'bn' ? 'অর্ডার সম্পন্ন করুন' : 'Place Secure Order'}
                  </>
                )}
              </Button>
            )}
          </div>

        </div>

        {/* Floating Side Order Summary Card (Visible always) */}
        <div className="w-full lg:w-96 shrink-0 lg:sticky lg:top-24">
          <div className="glass-card p-6 border border-slate-200">
            <h2 className="text-lg font-bold text-text mb-4 pb-4 border-b border-slate-100 flex justify-between items-center">
              {language === 'bn' ? 'অর্ডার সারসংক্ষেপ' : 'Order Summary'}
              <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-xs font-extrabold">
                {cart.length} {language === 'bn' ? 'টি আইটেম' : 'Items'}
              </span>
            </h2>

            <div className="space-y-3 max-h-[30vh] overflow-y-auto mb-6 pr-1">
              {products.map((product) => (
                <div key={product.id || product._id} className="flex justify-between items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-text leading-tight truncate">{product.name}</h4>
                    <p className="text-[10px] text-muted mt-0.5 truncate">{product.genericName}</p>
                    <p className="text-[10px] text-primary-dark font-extrabold mt-1">
                      Qty: {product.quantity}
                    </p>
                  </div>
                  <div className="font-black text-primary text-xs shrink-0">
                    {formatPrice(productPrice(product) * product.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2.5 pt-4 border-t border-slate-100 mb-4 text-xs font-semibold">
              <div className="flex justify-between text-muted">
                <span>Subtotal</span>
                <span className="text-text">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Delivery Charge</span>
                <span className="text-text">{formatPrice(deliveryCharge)}</span>
              </div>
              {subtotal > 0 && subtotal < 500 && (
                <div className="bg-[#EAF7FF] text-[#1F5AB3] p-2.5 rounded-lg text-[10px] text-center border border-sky mt-2">
                  Add <strong>{formatPrice(500 - subtotal)}</strong> more for <strong>FREE Delivery</strong>.
                </div>
              )}
            </div>

            <div className="flex justify-between items-end pt-4 border-t border-slate-200">
              <span className="font-extrabold text-text text-sm">Total Payable</span>
              <div className="text-right">
                <span className="text-2xl font-black text-primary">{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Checkout;

