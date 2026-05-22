import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, User, PhoneCall, Globe, FileText, MessageCircle, Home, ShoppingBag, ClipboardList, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const PublicLayout = () => {
  const { language, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  // Helper to check active route
  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-background text-text selection:bg-[var(--color-primary)]/20 pb-16 md:pb-0">
      
      {/* 1. Top Mini Trust Bar (Bilingual & Professional) */}
      <div className="bg-[var(--color-primary-dark)] text-white text-[11px] sm:text-xs py-2 px-4 z-50 relative border-b border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1 font-medium">
            <span className="flex items-center gap-1"><ShieldCheck size={13} className="text-[var(--color-teal)]" /> 
              {language === 'en' ? 'Authentic Medicine' : '১০০% আসল ওষুধ'}
            </span>
            <span className="hidden xs:inline">•</span>
            <span>{language === 'en' ? 'Pharmacist Review' : 'ফার্মাসিস্ট ভেরিফাইড'}</span>
            <span className="hidden xs:inline">•</span>
            <span>{language === 'en' ? 'Manual Payment Verification' : 'ম্যানুয়াল পেমেন্ট যাচাই'}</span>
            <span className="hidden xs:inline">•</span>
            <span>{language === 'en' ? 'Fast Support' : 'দ্রুত গ্রাহক সেবা'}</span>
          </div>
          <div className="flex gap-4 items-center">
            <a href="tel:01602444532" className="flex items-center gap-1 hover:text-[var(--color-teal)] transition-colors">
              <PhoneCall size={12} /> 01602444532
            </a>
            <span className="text-white/40">|</span>
            <button 
              onClick={toggleLanguage}
              className="flex items-center gap-1 hover:text-[var(--color-teal)] transition-colors font-bold cursor-pointer"
            >
              <Globe size={12} />
              <span>{language === 'en' ? 'বাংলা' : 'English'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Sticky Glass Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-[var(--color-primary)]/10 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          
          {/* Left: Logo */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-10 h-10 cta-gradient text-white rounded-xl flex items-center justify-center font-black text-xl shadow-md group-hover:scale-105 transition-all">
              MB
            </div>
            <span className="text-2xl font-black text-slate-800 tracking-tight hidden sm:block">
              Medicine<span className="text-[var(--color-primary)]">Bazar</span>
            </span>
          </Link>

          {/* Center: Search Box (Desktop only) */}
          <div className="flex-1 max-w-xl hidden md:block px-4">
            <div 
              onClick={() => navigate('/search')} 
              className="relative group cursor-pointer"
            >
              <input 
                type="text" 
                placeholder={t('common.searchPlaceholder')} 
                className="w-full bg-slate-50 border border-slate-200/80 rounded-full py-2.5 pl-5 pr-12 text-sm text-slate-800 placeholder-slate-400 group-hover:border-[var(--color-primary)]/45 focus:outline-none transition-all cursor-pointer"
                readOnly
              />
              <button className="absolute right-1 top-1 bottom-1 cta-gradient text-white rounded-full w-10 flex items-center justify-center hover:brightness-105 active:scale-95 transition-all">
                <Search size={16} />
              </button>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {/* WhatsApp Support Button */}
            <a 
              href="https://wa.me/8801602444532" 
              target="_blank" 
              rel="noreferrer"
              className="hidden lg:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 font-bold text-xs hover:bg-[#25D366] hover:text-white transition-all shadow-sm shadow-[#25D366]/5"
            >
              <MessageCircle size={14} />
              <span>{language === 'en' ? 'WhatsApp Order' : 'হোয়াটসঅ্যাপ অর্ডার'}</span>
            </a>

            {/* Upload Prescription Button */}
            <Link 
              to="/checkout" 
              className="cta-gradient text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:brightness-105 flex items-center gap-1.5"
            >
              <FileText size={14} />
              <span>{language === 'en' ? 'Upload Rx' : 'প্রেসক্রিপশন আপলোড'}</span>
            </Link>

            {/* Divider */}
            <span className="w-[1px] h-6 bg-slate-200 hidden md:block"></span>

            {/* Cart Icon */}
            <Link to="/checkout" className="relative p-2.5 text-slate-700 hover:text-[var(--color-primary)] transition-colors bg-slate-50 hover:bg-[var(--color-primary)]/5 rounded-xl">
              <ShoppingCart size={20} />
              <span className="absolute -top-1 -right-1 offer-gradient text-white text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold shadow-sm">
                0
              </span>
            </Link>

            {/* Account Icon */}
            <Link to="/account" className="p-2.5 text-slate-700 hover:text-[var(--color-primary)] transition-colors bg-slate-50 hover:bg-[var(--color-primary)]/5 rounded-xl hidden md:flex">
              <User size={20} />
            </Link>
          </div>
        </div>
      </header>

      {/* 3. Navigation Bar */}
      <nav className="bg-white border-b border-slate-100 hidden md:block py-2.5 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-6 text-xs font-extrabold text-slate-600">
          <Link to="/shop" className="hover:text-[var(--color-primary)] transition-colors uppercase tracking-wider">
            {language === 'en' ? 'All Medicines' : 'সব ওষুধ'}
          </Link>
          <span className="text-slate-300">|</span>
          <Link to="/category/diabetic-care" className="hover:text-[var(--color-primary)] transition-colors uppercase tracking-wider">
            {language === 'en' ? 'Diabetic Care' : 'ডায়াবেটিক কেয়ার'}
          </Link>
          <Link to="/category/baby-care" className="hover:text-[var(--color-primary)] transition-colors uppercase tracking-wider">
            {language === 'en' ? 'Baby Care' : 'বেবি কেয়ার'}
          </Link>
          <Link to="/category/devices" className="hover:text-[var(--color-primary)] transition-colors uppercase tracking-wider">
            {language === 'en' ? 'Medical Devices' : 'মেডিকেল ডিভাইস'}
          </Link>
          <Link to="/category/otc" className="hover:text-[var(--color-primary)] transition-colors uppercase tracking-wider">
            {language === 'en' ? 'OTC Medicines' : 'ওটিসি ওষুধ'}
          </Link>
          <span className="ml-auto flex items-center gap-1 text-[var(--color-alert)] font-extrabold uppercase tracking-widest text-[11px] animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-alert)]"></span>
            {language === 'en' ? 'Prescription Only Shop' : 'Rx প্রেসক্রিপশন শপ'}
          </span>
        </div>
      </nav>

      {/* 4. Mobile Sticky Top Search Bar (For Mobile Only) */}
      <div className="md:hidden sticky top-[64px] z-30 bg-white/90 backdrop-blur-md px-4 py-2 border-b border-slate-100 shadow-sm">
        <div 
          onClick={() => navigate('/search')} 
          className="relative flex items-center"
        >
          <input 
            type="text" 
            placeholder={t('common.searchPlaceholder')} 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-4 pr-10 text-xs text-slate-800 placeholder-slate-400"
            readOnly
          />
          <Search size={14} className="absolute right-3.5 text-slate-400" />
        </div>
      </div>

      {/* 5. Main Content Area */}
      <main className="flex-1 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 pt-6 pb-20 md:py-10">
          <Outlet />
        </div>
      </main>

      {/* 6. Premium Responsive Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 pt-16 pb-8 text-sm relative overflow-hidden text-slate-400">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            
            {/* Column 1: Info & Brand */}
            <div className="space-y-5">
              <Link to="/" className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 cta-gradient text-white rounded-lg flex items-center justify-center font-bold shadow-md">
                  MB
                </div>
                <span className="text-xl font-extrabold text-white tracking-tight">
                  Medicine<span className="text-[var(--color-primary)]">Bazar</span>
                </span>
              </Link>
              <p className="text-slate-400 leading-relaxed text-xs">
                {language === 'en' 
                  ? 'Your premium digital pharmacy in Bangladesh. We deliver 100% authentic medicines, OTC items, and healthcare equipment verified by certified pharmacists.' 
                  : 'বাংলাদেশে আপনার বিশ্বস্ত প্রিমিয়াম ডিজিটাল ফার্মেসি। আমরা সার্টিফাইড ফার্মাসিস্ট দ্বারা যাচাইকৃত ১০০% আসল ওষুধ ও স্বাস্থসেবা সামগ্রী পৌঁছে দিই।'}
              </p>
              
              {/* High-Fidelity Social Icons as Inline SVGs (Lucide packages are unstable in Vite) */}
              <div className="flex items-center gap-3 pt-2">
                {/* Facebook */}
                <a 
                  href="https://facebook.com/medicinebazar24" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="p-2 bg-slate-800 rounded-xl border border-slate-700 text-slate-400 hover:border-[var(--color-primary)] hover:text-white hover:bg-[var(--color-primary)]/10 hover:shadow-sm transition-all"
                  title="Follow us on Facebook"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                
                {/* YouTube */}
                <a 
                  href="https://www.youtube.com/@MedicineBazar24" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="p-2 bg-slate-800 rounded-xl border border-slate-700 text-slate-400 hover:border-red-500 hover:text-white hover:bg-red-500/10 hover:shadow-sm transition-all"
                  title="Subscribe to our YouTube Channel"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11C4.483 20.455 12 20.455 12 20.455s7.517 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h4 className="text-white font-extrabold mb-5 uppercase tracking-wider text-xs">{language === 'en' ? 'Quick Links' : 'দ্রুত লিঙ্কসমূহ'}</h4>
              <ul className="space-y-2.5 text-xs">
                <li><Link to="/shop" className="hover:text-white transition-colors">{language === 'en' ? 'Shop All Medicines' : 'সব ওষুধ কিনুন'}</Link></li>
                <li><Link to="/search" className="hover:text-white transition-colors">{t('common.findMedicine')}</Link></li>
                <li><Link to="/checkout" className="hover:text-white transition-colors">{t('checkout.checkout')}</Link></li>
                <li><Link to="/account" className="hover:text-white transition-colors">{language === 'en' ? 'Track Order' : 'অর্ডার ট্র্যাকিং'}</Link></li>
              </ul>
            </div>

            {/* Column 3: Categories */}
            <div>
              <h4 className="text-white font-extrabold mb-5 uppercase tracking-wider text-xs">{language === 'en' ? 'Categories' : 'ক্যাটাগরি সমূহ'}</h4>
              <ul className="space-y-2.5 text-xs">
                <li><Link to="/category/diabetic-care" className="hover:text-white transition-colors">{language === 'en' ? 'Diabetic Care' : 'ডায়াবেটিক কেয়ার'}</Link></li>
                <li><Link to="/category/baby-care" className="hover:text-white transition-colors">{language === 'en' ? 'Baby Care' : 'বেবি কেয়ার'}</Link></li>
                <li><Link to="/category/devices" className="hover:text-white transition-colors">{language === 'en' ? 'Medical Devices' : 'মেডিকেল ডিভাইস'}</Link></li>
                <li><Link to="/category/otc" className="hover:text-white transition-colors">{language === 'en' ? 'OTC Medicines' : 'ওটিসি ওষুধ'}</Link></li>
              </ul>
            </div>

            {/* Column 4: Contact & Channels */}
            <div className="space-y-4">
              <h4 className="text-white font-extrabold mb-2 uppercase tracking-wider text-xs">{language === 'en' ? 'Contact Support' : 'যোগাযোগ ও সাপোর্ট'}</h4>
              <ul className="space-y-3.5 text-xs">
                <li className="flex items-start gap-2.5">
                  <PhoneCall size={16} className="mt-0.5 text-[var(--color-primary)] shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{language === 'en' ? 'Hotline (24/7)' : 'হটলাইন (২৪/৭)'}</p>
                    <p className="font-extrabold text-white text-sm">01602444532</p>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <MessageCircle size={16} className="mt-0.5 text-[#25D366] shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{language === 'en' ? 'WhatsApp / IMO' : 'হোয়াটসঅ্যাপ / ইমো'}</p>
                    <a href="https://wa.me/8801602444532" target="_blank" rel="noreferrer" className="font-extrabold text-[#25D366] hover:underline text-sm">
                      01602444532
                    </a>
                  </div>
                </li>
                <li className="pt-1">
                  <a 
                    href="https://whatsapp.com/channel/0029Vb8A8KwAYlUGFxSkXy01" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-800 rounded-lg hover:bg-slate-700 text-[var(--color-teal)] hover:text-white transition-colors font-bold text-[11px]"
                  >
                    <span>{language === 'en' ? 'Join WhatsApp Channel' : 'আমাদের হোয়াটসঅ্যাপ চ্যানেল'}</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Footer Credits */}
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
            <p>&copy; {new Date().getFullYear()} Medicine Bazar. All rights reserved.</p>
            <div className="flex items-center gap-4 text-[10px] uppercase font-bold text-slate-500">
              <span>{language === 'en' ? 'Manual Verification Checkout' : 'ম্যানুয়াল ভেরিফিকেশন চেকআউট'}</span>
              <span className="text-slate-700">|</span>
              <span className="text-slate-400">bKash | Nagad | Upay</span>
            </div>
          </div>
        </div>
      </footer>

      {/* 7. Mobile Floating Bottom Navigation (Arogga/MedEasy Inspired) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/60 shadow-xl flex items-center justify-around py-2 px-1">
        {/* Home */}
        <Link 
          to="/" 
          className={`flex flex-col items-center gap-0.5 text-center shrink-0 w-14 ${
            isActive('/') ? 'text-[var(--color-primary)] font-extrabold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Home size={20} />
          <span className="text-[10px] tracking-tight">{language === 'en' ? 'Home' : 'হোম'}</span>
        </Link>

        {/* Shop */}
        <Link 
          to="/shop" 
          className={`flex flex-col items-center gap-0.5 text-center shrink-0 w-14 ${
            isActive('/shop') ? 'text-[var(--color-primary)] font-extrabold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <ShoppingBag size={20} />
          <span className="text-[10px] tracking-tight">{language === 'en' ? 'Shop' : 'শপ'}</span>
        </Link>

        {/* Upload Prescription */}
        <Link 
          to="/checkout" 
          className="flex flex-col items-center gap-0.5 text-center shrink-0 w-16 relative -top-3"
        >
          <div className="w-11 h-11 cta-gradient text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/25 border-4 border-white">
            <FileText size={18} />
          </div>
          <span className="text-[9px] font-bold text-slate-600 tracking-tight relative -top-0.5">{language === 'en' ? 'Upload Rx' : 'প্রেসক্রিপশন'}</span>
        </Link>

        {/* Orders (Account Page) */}
        <Link 
          to="/account" 
          className={`flex flex-col items-center gap-0.5 text-center shrink-0 w-14 ${
            isActive('/account') ? 'text-[var(--color-primary)] font-extrabold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <ClipboardList size={20} />
          <span className="text-[10px] tracking-tight">{language === 'en' ? 'Orders' : 'অর্ডার'}</span>
        </Link>

        {/* Profile */}
        <Link 
          to="/account" 
          className={`flex flex-col items-center gap-0.5 text-center shrink-0 w-14 ${
            isActive('/account') ? 'text-[var(--color-primary)] font-extrabold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <User size={20} />
          <span className="text-[10px] tracking-tight">{language === 'en' ? 'Profile' : 'প্রোফাইল'}</span>
        </Link>
      </nav>

    </div>
  );
};

export default PublicLayout;
