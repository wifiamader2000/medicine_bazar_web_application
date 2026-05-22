import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { unwrapData } from '../../utils/apiData';
import { useLanguage } from '../../context/LanguageContext';

const Login = () => {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState('signin'); // 'signin' | 'signup' | 'forgot'
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Sign In state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign Up state
  const [signUpName, setSignUpName] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [signUpAddress, setSignUpAddress] = useState('');

  // Forgot password state
  const [forgotIdentifier, setForgotIdentifier] = useState('');

  // OTP State structure (placeholder/disabled)
  const [otpPhone, setOtpPhone] = useState('');
  const [showOtpFields, setShowOtpFields] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const roleDefaultPath = (user) => {
    if (user.role === 'admin') return '/admin';
    if (user.role === 'pharmacist') return '/admin/prescriptions';
    if (user.role === 'cashier') return '/pos';
    return '/account';
  };

  const safeRedirectPath = (user) => {
    const redirect = searchParams.get('redirect') || searchParams.get('next');
    if (!redirect || !redirect.startsWith('/') || redirect.startsWith('//')) return roleDefaultPath(user);
    if (redirect.startsWith('/admin') && user.role !== 'admin' && user.role !== 'pharmacist') return roleDefaultPath(user);
    if (redirect.startsWith('/pos') && user.role !== 'admin' && user.role !== 'cashier') return roleDefaultPath(user);
    return redirect;
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', {
        email: signInEmail.trim(),
        password: signInPassword
      });
      const { token, user } = unwrapData(res, {});
      if (!token || !user) {
        throw new Error(
          language === 'bn' 
            ? 'লগইন রেসপন্সে সেশন অন্তর্ভুক্ত ছিল না।' 
            : 'Login response did not include a session.'
        );
      }
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      setSuccess(language === 'bn' ? 'লগইন সফল! রিডাইরেক্ট করা হচ্ছে...' : 'Login successful! Redirecting...');
      setTimeout(() => {
        navigate(safeRedirectPath(user), { replace: true });
      }, 800);
    } catch (err) {
      setError(
        err.response?.data?.messageBn && language === 'bn'
          ? err.response.data.messageBn
          : err.response?.data?.message || err.message || 'Authentication failed'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (signUpPassword !== signUpConfirmPassword) {
      setError(language === 'bn' ? 'পাসওয়ার্ড দুটি মিলছে না।' : 'Passwords do not match.');
      return;
    }

    if (signUpPassword.length < 8) {
      setError(language === 'bn' ? 'পাসওয়ার্ড কমপক্ষে ৮টি অক্ষরের হতে হবে।' : 'Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        name: signUpName.trim(),
        email: signUpEmail.trim().toLowerCase(),
        password: signUpPassword,
        phone: signUpPhone.trim(),
        address: signUpAddress.trim() // Optional address field
      });

      const { token, user } = unwrapData(res, {});
      if (!token || !user) {
        throw new Error(
          language === 'bn' 
            ? 'রেজিস্ট্রেশন সফল হয়েছে কিন্তু সেশন শুরু করা যায়নি।' 
            : 'Registration succeeded, but session token is missing.'
        );
      }
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      setSuccess(language === 'bn' ? 'নিবন্ধন সফল হয়েছে! রিডাইরেক্ট করা হচ্ছে...' : 'Registration successful! Redirecting...');
      setTimeout(() => {
        navigate(safeRedirectPath(user), { replace: true });
      }, 800);
    } catch (err) {
      setError(
        err.response?.data?.messageBn && language === 'bn'
          ? err.response.data.messageBn
          : err.response?.data?.message || err.message || 'Registration failed'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!forgotIdentifier.trim()) {
      setError(language === 'bn' ? 'ইমেইল অথবা মোবাইল নম্বর প্রদান করুন।' : 'Please enter your email or mobile number.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', {
        email: forgotIdentifier.includes('@') ? forgotIdentifier.trim() : undefined,
        identifier: forgotIdentifier.trim()
      });

      setSuccess(
        language === 'bn'
          ? 'যদি অ্যাকাউন্টটি আমাদের সিস্টেমে থাকে, পাসওয়ার্ড রিসেট লিংক ইমেইলে পাঠানো হয়েছে।'
          : 'If an account matches, password reset instructions have been sent.'
      );
    } catch (err) {
      setError(
        err.response?.data?.messageBn && language === 'bn'
          ? err.response.data.messageBn
          : err.response?.data?.message || err.message || 'Reset request failed'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 healthcare-page bg-background animate-fade-up">
      <div className="w-full max-w-lg glass-panel p-8 rounded-[28px] border border-primary/20 shadow-2xl relative overflow-hidden">
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-trust/10 rounded-full blur-2xl -ml-16 -mb-16 pointer-events-none"></div>

        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-3 shadow-inner">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-text tracking-tight">
            {language === 'bn' ? 'মেডিসিন বাজার V3' : 'Medicine Bazar V3'}
          </h2>
          <p className="text-muted text-sm mt-1">
            {language === 'bn' 
              ? 'আপনার বিশ্বস্ত অনলাইন ও অফলাইন ফার্মেসি সেবা' 
              : 'Your Trusted Omnichannel Digital Pharmacy Hub'}
          </p>
        </div>

        {/* Tab Selection */}
        {activeTab !== 'forgot' && (
          <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8 border border-slate-200 shadow-inner">
            <button
              onClick={() => { setActiveTab('signin'); setError(''); setSuccess(''); }}
              className={`flex-1 py-3 text-sm font-semibold rounded-xl transition duration-200 pressable ${
                activeTab === 'signin'
                  ? 'bg-white text-primary shadow-md'
                  : 'text-muted hover:text-text'
              }`}
            >
              {language === 'bn' ? 'লগইন করুন' : 'Sign In'}
            </button>
            <button
              onClick={() => { setActiveTab('signup'); setError(''); setSuccess(''); }}
              className={`flex-1 py-3 text-sm font-semibold rounded-xl transition duration-200 pressable ${
                activeTab === 'signup'
                  ? 'bg-white text-primary shadow-md'
                  : 'text-muted hover:text-text'
              }`}
            >
              {language === 'bn' ? 'নতুন অ্যাকাউন্ট' : 'Sign Up'}
            </button>
          </div>
        )}

        {/* Error/Success Alert Box */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-alert text-alert rounded-xl text-sm font-medium flex items-start gap-2.5 animate-soft-scale">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border-l-4 border-primary text-primary-dark rounded-xl text-sm font-medium flex items-start gap-2.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{success}</span>
          </div>
        )}

        {/* Form Screens */}
        {activeTab === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-text mb-2">
                {language === 'bn' ? 'ইমেইল অ্যাড্রেস' : 'Email Address'}
              </label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white/70"
                placeholder="name@example.com"
                value={signInEmail}
                onChange={(e) => setSignInEmail(e.target.value)}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold text-text">
                  {language === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
                </label>
                <button
                  type="button"
                  onClick={() => { setActiveTab('forgot'); setError(''); setSuccess(''); }}
                  className="text-xs font-semibold text-primary hover:text-primary-dark transition"
                >
                  {language === 'bn' ? 'পাসওয়ার্ড ভুলে গেছেন?' : 'Forgot Password?'}
                </button>
              </div>
              <input
                type="password"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white/70"
                placeholder="••••••••"
                value={signInPassword}
                onChange={(e) => setSignInPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition duration-200 pressable shadow-lg shadow-primary/20 flex items-center justify-center disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                language === 'bn' ? 'লগইন করুন' : 'Sign In'
              )}
            </button>
          </form>
        )}

        {activeTab === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-text mb-1">
                {language === 'bn' ? 'পূর্ণ নাম' : 'Full Name'} *
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary bg-white/70"
                placeholder="Rahman Khan"
                value={signUpName}
                onChange={(e) => setSignUpName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-text mb-1">
                  {language === 'bn' ? 'মোবাইল নম্বর' : 'Phone Number'} *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="017XXXXXXXX"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary bg-white/70"
                  value={signUpPhone}
                  onChange={(e) => setSignUpPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-text mb-1">
                  {language === 'bn' ? 'ইমেইল অ্যাড্রেস' : 'Email Address'} *
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary bg-white/70"
                  placeholder="name@example.com"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-text mb-1">
                  {language === 'bn' ? 'নতুন পাসওয়ার্ড' : 'New Password'} *
                </label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary bg-white/70"
                  placeholder="Min 8 chars"
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-text mb-1">
                  {language === 'bn' ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm Password'} *
                </label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary bg-white/70"
                  placeholder="••••••••"
                  value={signUpConfirmPassword}
                  onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-text mb-1">
                {language === 'bn' ? 'ডেলিভারি ঠিকানা (ঐচ্ছিক)' : 'Delivery Address (Optional)'}
              </label>
              <textarea
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary bg-white/70 h-16 resize-none"
                placeholder={language === 'bn' ? 'বাসা নম্বর, রোড, এলাকা...' : 'House, Road, Area details...'}
                value={signUpAddress}
                onChange={(e) => setSignUpAddress(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition duration-200 pressable shadow-lg shadow-primary/20 flex items-center justify-center disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                language === 'bn' ? 'অ্যাকাউন্ট তৈরি করুন' : 'Create Account'
              )}
            </button>
          </form>
        )}

        {activeTab === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-text mb-2">
                {language === 'bn' ? 'ইমেইল বা ফোন নম্বর' : 'Email or Phone Number'}
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary bg-white/70"
                placeholder={language === 'bn' ? 'ইমেইল বা ১১-ডিজিটের নম্বর' : 'Enter email or 11-digit phone'}
                value={forgotIdentifier}
                onChange={(e) => setForgotIdentifier(e.target.value)}
              />
              <p className="text-xs text-muted mt-1.5">
                {language === 'bn'
                  ? 'আমরা আপনার অ্যাকাউন্টে পাসওয়ার্ড রিসেট লিংক পাঠাবো।'
                  : 'We will search for your account and send standard password reset credentials.'}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition duration-200 pressable shadow-lg shadow-primary/20 flex items-center justify-center disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                language === 'bn' ? 'রিসেট লিংক পাঠান' : 'Send Reset Link'
              )}
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('signin'); setError(''); setSuccess(''); }}
              className="w-full text-center text-sm font-semibold text-muted hover:text-text mt-4 transition block"
            >
              {language === 'bn' ? 'লগইন পেজে ফিরে যান' : 'Back to Login'}
            </button>
          </form>
        )}

        {/* Divider / SSO Options */}
        <div className="relative my-8 text-center">
          <span className="absolute inset-x-0 top-1/2 border-t border-slate-200"></span>
          <span className="relative bg-white px-3 text-xs font-bold text-muted uppercase tracking-wider">
            {language === 'bn' ? 'অথবা' : 'OR'}
          </span>
        </div>

        {/* Third Party / Future Channels Section */}
        <div className="space-y-3">
          {/* OTP Form Layout Hook (Placeholder/Disabled) */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-text flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                {language === 'bn' ? 'ওয়ান-টাইম ওটিপি লগইন' : 'One-Time OTP Login'}
              </span>
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase">
                {language === 'bn' ? 'শীঘ্রই আসছে' : 'Soon'}
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="tel"
                disabled
                placeholder="017XXXXXXXX"
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-100 cursor-not-allowed"
              />
              <button
                type="button"
                disabled
                className="px-3 py-2 text-xs font-bold bg-slate-200 text-slate-400 rounded-xl cursor-not-allowed"
              >
                {language === 'bn' ? 'ওটিপি পাঠান' : 'Send OTP'}
              </button>
            </div>
            <p className="text-[10px] text-muted mt-1 leading-normal">
              {language === 'bn'
                ? '* রিয়েল এসএমএস গেটওয়ে ইন্টিগ্রেশন সম্পন্ন হলে এটি সক্রিয় হবে।'
                : '* Requires SMS provider gateway setup to send verification SMS.'}
            </p>
          </div>

          {/* Google SSO Placeholder */}
          <button
            type="button"
            disabled
            className="w-full py-3 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl text-sm font-semibold transition duration-200 flex items-center justify-center gap-2 cursor-not-allowed opacity-75"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.54 14.98 1 12 1 7.35 1 3.4 3.65 1.48 7.52l3.8 2.94c.9-2.7 3.42-4.42 6.72-4.42z"/>
              <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.42 3.57v2.97h3.89c2.28-2.1 3.56-5.19 3.56-8.69z"/>
              <path fill="#FBBC05" d="M5.28 14.54c-.24-.72-.38-1.5-.38-2.3s.14-1.58.38-2.3L1.48 7.52C.67 9.17.2 11.03.2 13s.47 3.83 1.28 5.48l3.8-2.94z"/>
              <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.89-2.97c-1.08.72-2.47 1.15-4.07 1.15-3.3 0-5.82-1.72-6.72-4.42l-3.8 2.94C3.4 20.35 7.35 23 12 23z"/>
            </svg>
            <span>
              {language === 'bn' 
                ? 'গুগল দিয়ে প্রবেশ করুন — শীঘ্রই আসছে' 
                : 'Continue with Google — Coming Soon'}
            </span>
          </button>
          <p className="text-[10px] text-center text-muted">
            {language === 'bn'
              ? 'গুগল ক্লায়েন্ট আইডি কনফিগার করার পর এটি স্বয়ংক্রিয়ভাবে সক্রিয় হবে।'
              : 'Admin panel dynamic settings → Configure Google Client ID to enable.'}
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;

