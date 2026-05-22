import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Search, ShoppingCart, User, PhoneCall, Globe, Play } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const PublicLayout = () => {
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col font-sans bg-background text-text selection:bg-primary/20">
      
      {/* Top Bar - Clean Medical Style */}
      <div className="bg-primary-dark text-white text-xs py-2 px-4 flex justify-between items-center z-50 relative">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex gap-4">
            <span className="flex items-center gap-1 font-medium"><PhoneCall size={12} /> 01602444532</span>
            <span className="hidden md:inline text-white/80">{language === 'en' ? 'Hyper-fast Medicine Delivery in BD' : 'বাংলাদেশে অতি দ্রুত মেডিসিন ডেলিভারি'}</span>
          </div>
          <div className="flex gap-4">
            <Link to="/account" className="hover:text-primary-light transition-colors">{t('common.trackOrder')}</Link>
            <Link to="/shop" className="hover:text-primary-light transition-colors">{t('common.shop')}</Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 glass-panel border-b border-primary/10 shadow-sm transition-all duration-300">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-primary text-white rounded-lg flex items-center justify-center font-bold text-xl shadow-md group-hover:scale-105 transition-all">
              MB
            </div>
            <span className="text-2xl font-extrabold text-slate-800 tracking-tight hidden sm:block">
              Medicine<span className="text-primary">Bazar</span>
            </span>
          </Link>

          <div className="flex-1 max-w-2xl hidden md:block px-8">
            <Link to="/search" className="w-full">
              <div className="relative group">
                <input 
                  type="text" 
                  placeholder={t('common.searchPlaceholder')} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-full py-2.5 pl-5 pr-12 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-slate-800 placeholder-muted transition-all"
                  readOnly
                />
                <button className="absolute right-1 top-1 bottom-1 bg-primary text-white rounded-full w-10 flex items-center justify-center hover:bg-primary-dark transition-colors">
                  <Search size={18} />
                </button>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {/* Language Toggle Button */}
            <button 
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 hover:border-primary text-xs font-bold text-slate-700 hover:text-primary transition-all cursor-pointer bg-white shadow-sm"
              title={language === 'en' ? 'বাংলায় দেখুন' : 'View in English'}
            >
              <Globe size={14} />
              <span>{language === 'en' ? 'বাংলা' : 'EN'}</span>
            </button>

            <Link to="/search" className="hidden lg:flex items-center gap-2 bg-primary/10 text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-lg text-sm font-bold transition-all border border-primary/20 shadow-sm">
              {t('common.findMedicine')}
            </Link>
            <Link to="/checkout" className="relative p-2 text-slate-700 hover:text-primary transition-colors">
              <ShoppingCart size={24} />
              <span className="absolute top-0 right-0 bg-alert text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                0
              </span>
            </Link>
            <Link to="/account" className="p-2 text-slate-700 hover:text-primary transition-colors">
              <User size={24} />
            </Link>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white/60 backdrop-blur-md border-b border-slate-100 hidden md:block">
        <div className="container mx-auto px-4 py-3 flex items-center gap-8 text-sm font-bold text-slate-700">
          <Link to="/category/otc" className="hover:text-primary transition-colors uppercase tracking-wider">{t('nav.otc')}</Link>
          <Link to="/category/women-care" className="hover:text-primary transition-colors uppercase tracking-wider">{t('nav.women')}</Link>
          <Link to="/category/baby-care" className="hover:text-primary transition-colors uppercase tracking-wider">{t('nav.baby')}</Link>
          <Link to="/category/devices" className="hover:text-primary transition-colors uppercase tracking-wider">{t('nav.devices')}</Link>
          <Link to="/shop?type=prescription" className="text-alert hover:text-alert/80 transition-colors uppercase tracking-wider flex items-center gap-1">
            {t('nav.prescriptionOnly')}
          </Link>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 bg-transparent">
        <div className="container mx-auto px-4 py-8">
          <Outlet />
        </div>
      </main>

      {/* Modern Medical Footer */}
      <footer className="bg-slate-50 border-t border-slate-200/60 pt-16 pb-8 text-sm relative overflow-hidden text-slate-600">
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            
            <div>
              <Link to="/" className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center font-bold shadow-md">
                  MB
                </div>
                <span className="text-2xl font-extrabold text-slate-800 tracking-tight">
                  Medicine<span className="text-primary">Bazar</span>
                </span>
              </Link>
              <p className="text-slate-500 mb-6 leading-relaxed">
                {language === 'en' 
                  ? 'Your trusted digital pharmacy in Bangladesh. We deliver authentic medicines and healthcare products directly to your doorstep.' 
                  : 'বাংলাদেশে আপনার বিশ্বস্ত ডিজিটাল ফার্মেসি। আমরা আপনার দোরগোড়ায় আসল ওষুধ এবং স্বাস্থ্যসেবা পণ্য পৌঁছে দিই।'}
              </p>
              <div className="flex items-center gap-4">
                <a href="https://facebook.com/medicinebazar24" target="_blank" rel="noreferrer" className="p-2 bg-white rounded-full border border-slate-200 text-slate-500 hover:border-primary hover:text-primary hover:shadow-sm transition-all">
                  <Globe size={20} />
                </a>
                <a href="https://www.youtube.com/@MedicineBazar24" target="_blank" rel="noreferrer" className="p-2 bg-white rounded-full border border-slate-200 text-slate-500 hover:border-alert hover:text-white hover:bg-alert hover:shadow-sm transition-all">
                  <Play size={20} />
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-slate-800 font-bold mb-6 uppercase tracking-wider">{language === 'en' ? 'Quick Links' : 'দ্রুত লিঙ্কসমূহ'}</h4>
              <ul className="space-y-3">
                <li><Link to="/shop" className="hover:text-primary transition-colors">{language === 'en' ? 'Shop All Medicines' : 'সব ওষুধ কিনুন'}</Link></li>
                <li><Link to="/search" className="hover:text-primary transition-colors">{t('common.findMedicine')}</Link></li>
                <li><Link to="/checkout" className="hover:text-primary transition-colors">{t('checkout.checkout')}</Link></li>
                <li><Link to="/account" className="hover:text-primary transition-colors">{language === 'en' ? 'My Account' : 'আমার অ্যাকাউন্ট'}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-slate-800 font-bold mb-6 uppercase tracking-wider">{language === 'en' ? 'Customer Service' : 'গ্রাহক সেবা'}</h4>
              <ul className="space-y-3">
                <li><Link to="/account" className="hover:text-primary transition-colors">{t('common.trackOrder')}</Link></li>
                <li><Link to="/shop" className="hover:text-primary transition-colors">{language === 'en' ? 'Browse Products' : 'পণ্য খুঁজুন'}</Link></li>
                <li><Link to="/search" className="hover:text-primary transition-colors">{t('common.findMedicine')}</Link></li>
                <li><Link to="/checkout" className="hover:text-primary transition-colors">{t('checkout.checkout')}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-slate-800 font-bold mb-6 uppercase tracking-wider">{language === 'en' ? 'Contact Us' : 'যোগাযোগ করুন'}</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <PhoneCall size={16} className="mt-1 text-primary" />
                  <div>
                    <p className="text-xs text-slate-400">{language === 'en' ? 'Hotline (24/7)' : 'হটলাইন (২৪/৭)'}</p>
                    <p className="font-bold text-slate-800">01602444532</p>
                  </div>
                </li>
                <li>
                  <a href="https://wa.me/8801602444532" target="_blank" rel="noreferrer" className="text-[#25D366] font-bold hover:underline">
                    {t('home.chatWhatsApp')}
                  </a>
                </li>
                <li>
                  <a href="https://whatsapp.com/channel/0029Vb8A8KwAYlUGFxSkXy01" target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    {language === 'en' ? 'Join our WhatsApp Channel' : 'আমাদের হোয়াটসঅ্যাপ চ্যানেলে যুক্ত হোন'}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-200/60 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
            <p>&copy; {new Date().getFullYear()} Medicine Bazar. All rights reserved.</p>
            <div className="flex gap-4">
              <span>{language === 'en' ? 'Secure Checkout' : 'নিরাপদ চেকআউট'}</span>
              <span className="font-bold text-slate-600">bKash | Nagad | Upay</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;

