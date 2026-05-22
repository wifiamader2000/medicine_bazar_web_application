import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Camera, ShieldAlert, CheckCircle, Clock, FileCheck, ArrowRight, LogIn } from 'lucide-react';
import api from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { unwrapData } from '../../utils/apiData';
import Button from '../../components/common/Button';

const PrescriptionUpload = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  
  // Auth state
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [currentUser, setCurrentUser] = useState(null);
  const [authTab, setAuthTab] = useState('signin'); // 'signin' | 'signup'
  
  // Auth Form State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signUpName, setSignUpName] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Upload Form State
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [note, setNote] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [createdPrescription, setCreatedPrescription] = useState(null);

  // Load user info if token exists
  useEffect(() => {
    if (token) {
      try {
        const stored = localStorage.getItem('user');
        if (stored) {
          const parsed = JSON.parse(stored);
          setCurrentUser(parsed);
          setPatientName(parsed.name || '');
          setPhone(parsed.phone || '');
          setDeliveryAddress(parsed.address || '');
        }
      } catch (err) {
        console.error('Error loading stored user:', err);
      }
    }
  }, [token]);

  // Auth Submit Handlers
  const handleSignIn = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setAuthLoading(true);
    try {
      const res = await api.post('/auth/login', {
        email: signInEmail.trim(),
        password: signInPassword
      });
      const { token: jwtToken, user } = unwrapData(res, {});
      if (!jwtToken || !user) {
        throw new Error(language === 'bn' ? 'লগইন রেসপন্সে সেশন পাওয়া যায়নি।' : 'Session not returned.');
      }
      localStorage.setItem('token', jwtToken);
      localStorage.setItem('user', JSON.stringify(user));
      setToken(jwtToken);
      setAuthSuccess(language === 'bn' ? 'লগইন সফল!' : 'Login successful!');
    } catch (err) {
      setAuthError(err.response?.data?.messageBn && language === 'bn' ? err.response.data.messageBn : err.response?.data?.message || err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    if (signUpPassword !== signUpConfirmPassword) {
      setAuthError(language === 'bn' ? 'পাসওয়ার্ড দুটি মিলছে না।' : 'Passwords do not match.');
      return;
    }
    setAuthLoading(true);
    try {
      const res = await api.post('/auth/register', {
        name: signUpName.trim(),
        phone: signUpPhone.trim(),
        email: signUpEmail.trim() || undefined,
        password: signUpPassword
      });
      const { token: jwtToken, user } = unwrapData(res, {});
      if (!jwtToken || !user) {
        throw new Error(language === 'bn' ? 'রেজিস্ট্রেশন রেসপন্সে সেশন পাওয়া যায়নি।' : 'Session not returned.');
      }
      localStorage.setItem('token', jwtToken);
      localStorage.setItem('user', JSON.stringify(user));
      setToken(jwtToken);
      setAuthSuccess(language === 'bn' ? 'নিবন্ধন সফল!' : 'Registration successful!');
    } catch (err) {
      setAuthError(err.response?.data?.messageBn && language === 'bn' ? err.response.data.messageBn : err.response?.data?.message || err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Upload Logic
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (file) => {
    setFileError('');
    if (!file) return;

    // Size limit check: 5MB
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setFileError(language === 'bn' ? 'ফাইলের আকার ৫ মেগাবাইটের কম হতে হবে।' : 'File size must be under 5MB.');
      setSelectedFile(null);
      return;
    }

    // MIME type check
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setFileError(language === 'bn' ? 'শুধুমাত্র JPG, PNG বা PDF ফাইল আপলোড করা যাবে।' : 'Only JPG, PNG, or PDF files are allowed.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setFileError(language === 'bn' ? 'অনুগ্রহ করে একটি প্রেসক্রিপশন ফাইল আপলোড করুন।' : 'Please upload a prescription file.');
      return;
    }

    setUploadLoading(true);
    setFileError('');

    try {
      const formData = new FormData();
      formData.append('prescription', selectedFile);
      formData.append('patientName', patientName);
      formData.append('phone', phone);
      formData.append('doctorName', doctorName);
      formData.append('note', `${note} [Delivery Address: ${deliveryAddress}]`);

      const res = await api.post('/prescriptions/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const responseData = unwrapData(res, {});
      setCreatedPrescription(responseData.data || responseData);
      setUploadSuccess(true);
    } catch (err) {
      setFileError(err.response?.data?.messageBn && language === 'bn' ? err.response.data.messageBn : err.response?.data?.message || err.message || 'Upload failed');
    } finally {
      setUploadLoading(false);
    }
  };

  if (uploadSuccess) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 animate-fade-up">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl text-center space-y-6">
          <div className="inline-flex items-center justify-center bg-emerald-50 text-emerald-500 rounded-full p-6 animate-float-slow">
            <CheckCircle size={64} className="stroke-[1.5]" />
          </div>
          
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
              {language === 'bn' ? 'প্রেসক্রিপশন সফলভাবে আপলোড হয়েছে' : 'Prescription Uploaded Successfully'}
            </h1>
            <p className="text-slate-600 font-semibold leading-relaxed text-sm sm:text-base bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
              {language === 'bn'
                ? 'আমাদের সার্টিফাইড ফার্মাসিস্ট আপনার প্রেসক্রিপশনটি যাচাই করছে। আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।'
                : 'Our certified pharmacist is verifying your prescription. We will contact you shortly.'}
            </p>
          </div>

          <div className="border-t border-slate-100 pt-6 text-left text-sm space-y-2 text-slate-600">
            <div className="flex justify-between">
              <span className="font-semibold">{language === 'bn' ? 'রোগীর নাম:' : 'Patient Name:'}</span>
              <span className="font-bold text-slate-800">{patientName}</span>
            </div>
            {doctorName && (
              <div className="flex justify-between">
                <span className="font-semibold">{language === 'bn' ? 'ডাক্তারের নাম:' : 'Doctor Name:'}</span>
                <span className="font-bold text-slate-800">{doctorName}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="font-semibold">{language === 'bn' ? 'ফাইল নাম:' : 'Filename:'}</span>
              <span className="font-mono text-xs text-slate-500 max-w-[200px] truncate">{selectedFile?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">{language === 'bn' ? 'তারিখ ও সময়:' : 'Date & Time:'}</span>
              <span className="font-medium text-slate-500">{new Date().toLocaleString()}</span>
            </div>
          </div>

          <div className="pt-6 space-y-3 print-hidden">
            <button
              onClick={() => navigate('/shop')}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md transform hover:-translate-y-0.5 cursor-pointer text-sm"
            >
              {language === 'bn' ? 'দোকানে ফিরে যান' : 'Go Back to Shop'}
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 animate-fade-up">
      {/* Visual Header */}
      <div className="text-center space-y-3 mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {language === 'bn' ? 'ডিজিটাল প্রেসক্রিপশন আপলোড' : 'Digital Prescription Upload'}
        </h1>
        <p className="text-slate-600 max-w-xl mx-auto text-sm sm:text-base font-medium">
          {language === 'bn'
            ? 'আপনার প্রেসক্রিপশনটি আপলোড করুন। আমাদের রেজিস্টার্ড ফার্মাসিস্ট যাচাই করে ওষুধ প্রস্তুত করবেন।'
            : 'Upload your prescription file. Our registered pharmacists will manually verify and dispense.'}
        </p>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-4 text-xs font-bold text-slate-500">
          <span className="flex items-center gap-1 bg-white border border-slate-100 rounded-full px-3 py-1 shadow-sm">
            <Clock size={14} className="text-emerald-500 animate-pulse" />
            {language === 'bn' ? '১৫-৩০ মিনিটে যাচাই' : '15-30 Min Verification'}
          </span>
          <span className="flex items-center gap-1 bg-white border border-slate-100 rounded-full px-3 py-1 shadow-sm">
            <FileCheck size={14} className="text-emerald-500" />
            {language === 'bn' ? 'সার্টিফাইড ফার্মাসিস্ট টিম' : 'Certified Pharmacist Team'}
          </span>
        </div>
      </div>

      {!token ? (
        /* Glassmorphic Inline Authentication Container if unauthenticated */
        <div className="max-w-md mx-auto bg-white/70 backdrop-blur-md border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-full p-3 mb-1">
              <ShieldAlert size={28} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              {language === 'bn' ? 'নিরাপদ অ্যাকাউন্ট যাচাইকরণ' : 'Secure Account Verification'}
            </h2>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              {language === 'bn'
                ? 'আপনার চিকিৎসার প্রেসক্রিপশনটি অত্যন্ত গোপনীয় ও সুরক্ষিত রাখতে অনুগ্রহ করে লগইন বা সাইনআপ করুন।'
                : 'To protect your private health files, please sign in or register to upload prescriptions safely.'}
            </p>
          </div>

          {/* Toggle Tab */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => { setAuthTab('signin'); setAuthError(''); }}
              className={`flex-1 text-center font-bold text-xs py-2.5 rounded-lg transition-all cursor-pointer ${
                authTab === 'signin' ? 'bg-white text-emerald-600 shadow' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {language === 'bn' ? 'লগইন' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={() => { setAuthTab('signup'); setAuthError(''); }}
              className={`flex-1 text-center font-bold text-xs py-2.5 rounded-lg transition-all cursor-pointer ${
                authTab === 'signup' ? 'bg-white text-emerald-600 shadow' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {language === 'bn' ? 'নতুন অ্যাকাউন্ট' : 'Sign Up'}
            </button>
          </div>

          {authError && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center text-xs text-red-600 font-bold">
              {authError}
            </div>
          )}

          {authSuccess && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center text-xs text-emerald-600 font-bold">
              {authSuccess}
            </div>
          )}

          {authTab === 'signin' ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">{language === 'bn' ? 'ইমেইল ঠিকানা' : 'Email Address'}</label>
                <input
                  type="email"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500 font-medium"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">{language === 'bn' ? 'পাসওয়ার্ড' : 'Password'}</label>
                <input
                  type="password"
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500 font-medium"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md text-xs cursor-pointer disabled:opacity-50"
              >
                <LogIn size={16} />
                {authLoading ? (language === 'bn' ? 'যাচাই করা হচ্ছে...' : 'Authenticating...') : (language === 'bn' ? 'লগইন সম্পন্ন করুন' : 'Confirm Sign In')}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">{language === 'bn' ? 'পূর্ণ নাম' : 'Full Name'}</label>
                <input
                  type="text"
                  value={signUpName}
                  onChange={(e) => setSignUpName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500 font-medium"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">{language === 'bn' ? 'ফোন নম্বর' : 'Phone Number'}</label>
                <input
                  type="tel"
                  value={signUpPhone}
                  onChange={(e) => setSignUpPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500 font-medium"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">{language === 'bn' ? 'ইমেইল (ঐচ্ছিক)' : 'Email (Optional)'}</label>
                <input
                  type="email"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">{language === 'bn' ? 'পাসওয়ার্ড' : 'Password'}</label>
                <input
                  type="password"
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500 font-medium"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">{language === 'bn' ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm Password'}</label>
                <input
                  type="password"
                  value={signUpConfirmPassword}
                  onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500 font-medium"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md text-xs cursor-pointer disabled:opacity-50"
              >
                {authLoading ? (language === 'bn' ? 'নিবন্ধন করা হচ্ছে...' : 'Registering...') : (language === 'bn' ? 'অ্যাকাউন্ট তৈরি সম্পন্ন করুন' : 'Register Account')}
              </button>
            </form>
          )}
        </div>
      ) : (
        /* High-fidelity upload form once authenticated */
        <div className="max-w-5xl mx-auto bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-lg grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* Left Column: Form Info */}
          <form onSubmit={handleFormSubmit} className="lg:col-span-3 space-y-5">
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2 mb-2">
              {language === 'bn' ? 'রোগী ও ডেলিভারি বিবরণ' : 'Patient & Delivery Details'}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  {language === 'bn' ? 'রোগীর নাম (বাধ্যতামূলক)' : 'Patient Name (Required)'}
                </label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500 font-semibold text-slate-700"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  {language === 'bn' ? 'মোবাইল নম্বর (বাধ্যতামূলক)' : 'Mobile Phone (Required)'}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500 font-mono text-slate-700 font-bold"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  {language === 'bn' ? 'ডাক্তারের নাম (ঐচ্ছিক)' : 'Doctor Name (Optional)'}
                </label>
                <input
                  type="text"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500 font-semibold text-slate-700"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  {language === 'bn' ? 'ডেলিভারি ঠিকানা (ঐচ্ছিক)' : 'Delivery Address (Optional)'}
                </label>
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500 font-semibold text-slate-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                {language === 'bn' ? 'বিশেষ নির্দেশনা বা ওষুধের নাম' : 'Special Instructions / Notes'}
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={language === 'bn' ? 'যেমন: ১৫ দিনের সম্পূর্ণ ডোজ প্রয়োজন, অথবা কোনো বিশেষ ব্রান্ডের নির্দেশ...' : 'Example: I need 15 days full dose, or specific brand instructions...'}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500 font-semibold text-slate-700 min-h-[90px]"
              />
            </div>

            {fileError && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-600 font-bold text-center">
                {fileError}
              </div>
            )}

            <button
              type="submit"
              disabled={uploadLoading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md text-sm cursor-pointer disabled:opacity-50"
            >
              <Upload size={18} />
              {uploadLoading ? (language === 'bn' ? 'আপলোড করা হচ্ছে...' : 'Uploading...') : (language === 'bn' ? 'প্রেসক্রিপশন আপলোড সম্পন্ন করুন' : 'Confirm & Upload Prescription')}
            </button>
          </form>

          {/* Right Column: File Target */}
          <div className="lg:col-span-2 flex flex-col justify-center">
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">
              {language === 'bn' ? 'প্রেসক্রিপশন ফাইল আপলোড' : 'Prescription File Target'}
            </h2>

            {/* Drag & Drop Target container */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-3xl p-6 text-center flex flex-col items-center justify-center min-h-[260px] transition-all ${
                dragActive ? 'border-emerald-500 bg-emerald-50/50 scale-[1.02]' : 'border-slate-300 bg-slate-50/30 hover:border-slate-400'
              }`}
            >
              <input
                type="file"
                id="prescription-file-input"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
              
              {selectedFile ? (
                <div className="space-y-4 animate-soft-scale">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                    {selectedFile.type === 'application/pdf' ? <FileText size={32} /> : <FileCheck size={32} />}
                  </div>
                  
                  <div className="space-y-1">
                    <p className="font-bold text-slate-700 text-sm max-w-[200px] truncate mx-auto">{selectedFile.name}</p>
                    <p className="text-xs text-slate-400 font-mono">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="text-xs text-red-500 font-bold hover:underline cursor-pointer"
                  >
                    {language === 'bn' ? 'পরিবর্তন করুন' : 'Change File'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                    <Upload size={32} className="stroke-[1.5]" />
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-700">
                      {language === 'bn' ? 'প্রেসক্রিপশন ফাইল ড্র্যাগ করুন' : 'Drag & Drop Prescription'}
                    </p>
                    <p className="text-xs text-slate-400 font-medium">
                      {language === 'bn' ? 'অথবা কম্পিউটার/মোবাইল গ্যালারি থেকে নির্বাচন করুন' : 'or browse files from your device'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => document.getElementById('prescription-file-input').click()}
                      className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold py-2 px-4 rounded-xl transition-all shadow-sm cursor-pointer"
                    >
                      {language === 'bn' ? 'ফাইল খুঁজুন' : 'Browse File'}
                    </button>
                    
                    {/* Native mobile camera capture trigger */}
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('prescription-file-input');
                        input.setAttribute('capture', 'environment');
                        input.click();
                      }}
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100 text-xs font-bold py-2 px-4 rounded-xl transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                    >
                      <Camera size={14} />
                      {language === 'bn' ? 'ক্যামেরা' : 'Camera'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mt-6 text-xs text-amber-800 leading-relaxed font-semibold">
              {language === 'bn' ? (
                <span>⚠️ অনুগ্রহ করে নিশ্চিত করুন যে প্রেসক্রিপশনটি পরিষ্কার এবং সহজে পাঠযোগ্য। সর্বোচ্চ ফাইলের আকার: ৫ মেগাবাইট (JPG, PNG, PDF)।</span>
              ) : (
                <span>⚠️ Please ensure the uploaded prescription image is clear and readable. Max file size: 5MB (JPG, PNG, PDF format).</span>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default PrescriptionUpload;
