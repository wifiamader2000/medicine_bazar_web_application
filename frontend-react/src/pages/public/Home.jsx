import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, FileText, MessageCircle, ShieldCheck, Truck, CreditCard, Stethoscope, ArrowRight, Activity, Heart, Eye, Beaker, Zap, Calendar, Sparkles, Share2, Award, Phone, CheckCircle, HelpCircle } from 'lucide-react';
import api from '../../services/api';
import ProductCard from '../../components/product/ProductCard';
import Loading from '../../components/common/Loading';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { useLanguage } from '../../context/LanguageContext';

const Home = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { language, t } = useLanguage();

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const productsRes = await api.get('/products?limit=100').catch(() => ({ data: [] }));
        const items = productsRes.data?.data || productsRes.data || [];
        setAllProducts(items);
        setFeaturedProducts(items.slice(0, 20));

        const bannersRes = await api.get('/banners').catch(() => ({ data: { banners: [] } }));
        setBanners(bannersRes.data?.banners || []);
      } catch (err) {
        console.error('Error fetching products/banners:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Filter Active Banners respecting start/end date and sorting by priority
  const now = new Date();
  const activeBanners = banners.filter(b => {
    if (b.active === false) return false;
    if (b.startDate && new Date(b.startDate) > now) return false;
    if (b.endDate && new Date(b.endDate) < now) return false;
    return true;
  });

  const heroBanners = activeBanners.filter(b => b.type === 'hero').sort((a, b) => (b.priority || 0) - (a.priority || 0));
  const offerBanners = activeBanners.filter(b => b.type === 'offer').sort((a, b) => (b.priority || 0) - (a.priority || 0));
  const paymentBanners = activeBanners.filter(b => b.type === 'payment').sort((a, b) => (b.priority || 0) - (a.priority || 0));
  const rxBanners = activeBanners.filter(b => b.type === 'prescription').sort((a, b) => (b.priority || 0) - (a.priority || 0));

  // Slider Auto Rotation
  useEffect(() => {
    if (heroBanners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroBanners.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [heroBanners.length]);

  // 4. Shop by Category (Inspired by premium pharmacy platforms)
  const mainCategories = [
    { nameEn: 'Prescription Medicine', nameBn: 'প্রেসক্রিপশন মেডিসিন', icon: '📝', slug: 'Prescription Medicine', bg: 'bg-emerald-50' },
    { nameEn: 'OTC Medicine', nameBn: 'ওটিসি ওষুধ', icon: '💊', slug: 'OTC Medicine', bg: 'bg-teal-50' },
    { nameEn: 'Baby Care', nameBn: 'বেবি কেয়ার', icon: '👶', slug: 'Baby Care', bg: 'bg-amber-50' },
    { nameEn: 'Diabetic Care', nameBn: 'ডায়াবেটিক কেয়ার', icon: '🩸', slug: 'Diabetic Care', bg: 'bg-red-50' },
    { nameEn: 'Devices & Equipment', nameBn: 'মেডিকেল ডিভাইস', icon: '🩺', slug: 'Devices', bg: 'bg-blue-50' },
    { nameEn: 'Personal Care', nameBn: 'পার্সোনাল কেয়ার', icon: '🧴', slug: 'Personal Care', bg: 'bg-pink-50' },
    { nameEn: 'Sexual Wellness', nameBn: 'যৌন সুস্থতা', icon: '💖', slug: 'Sexual Wellness', bg: 'bg-purple-50' },
    { nameEn: 'Hygiene & Safety', nameBn: 'হাইজিন ও সেফটি', icon: '🧼', slug: 'Hygiene', bg: 'bg-sky-50' },
    { nameEn: 'Supplements & Vitamins', nameBn: 'ভিটামিন ও সাপ্লিমেন্ট', icon: '⚡', slug: 'Supplement', bg: 'bg-yellow-50' },
    { nameEn: 'Skin Care', nameBn: 'স্কিন কেয়ার', icon: '✨', slug: 'Skin Care', bg: 'bg-indigo-50' },
    { nameEn: 'Dental Care', nameBn: 'ডেন্টাল কেয়ার', icon: '🪥', slug: 'Dental Care', bg: 'bg-slate-50' },
    { nameEn: 'Lab Test Packages', nameBn: 'ল্যাব টেস্ট বুকিং', icon: '🧪', slug: 'Lab Test', bg: 'bg-cyan-50' }
  ];

  // 5. Shop by Health Concern
  const healthConcerns = [
    { nameEn: 'Fever & Pain', nameBn: 'জ্বর ও ব্যথা', icon: '🔥', slug: 'Pain & Fever' },
    { nameEn: 'Gastric & Acidity', nameBn: 'গ্যাস্ট্রিক ও বুকজ্বালা', icon: '🧪', slug: 'Gastrointestinal' },
    { nameEn: 'Cough & Cold', nameBn: 'সর্দি ও কাশি', icon: '💨', slug: 'Respiratory' },
    { nameEn: 'Allergy & Asthma', nameBn: 'অ্যালার্জি ও হাঁপানি', icon: '🌾', slug: 'Allergies' },
    { nameEn: 'Diabetes Control', nameBn: 'ডায়াবেটিস নিয়ন্ত্রণ', icon: '🍬', slug: 'Diabetes' },
    { nameEn: 'Blood Pressure', nameBn: 'উচ্চ রক্তচাপ', icon: '❤️', slug: 'Hypertension' },
    { nameEn: 'Skin Issues', nameBn: 'ত্বকের সমস্যা', icon: '🧴', slug: 'Skin Diseases' },
    { nameEn: 'Baby Health', nameBn: 'শিশুর স্বাস্থ্য', icon: '🍼', slug: 'Pediatric' },
    { nameEn: 'Women’s Health', nameBn: 'নারীদের স্বাস্থ্য', icon: '🌸', slug: "Women's Health" },
    { nameEn: 'Digestive Health', nameBn: 'হজম শক্তি', icon: '🍏', slug: 'Digestive' }
  ];

  // 9. Health Tips / Blog Preview
  const healthTips = [
    { titleEn: '5 Essential Tips for Managing Diabetes Naturally', titleBn: 'প্রাকৃতিক উপায়ে ডায়াবেটিস নিয়ন্ত্রণের ৫টি উপায়', readTime: '3 min', date: 'May 22, 2026', img: '🧪', descEn: 'Control blood sugar levels through balanced nutrition, light exercises and timely glucose checks.', descBn: 'সুষম খাবার, নিয়মিত হাঁটাচলা এবং সময়মতো রক্তের গ্লুকোজ পরীক্ষার মাধ্যমে ডায়াবেটিস নিয়ন্ত্রণে রাখুন।' },
    { titleEn: 'Understanding Your Prescription: What Do Rx Terms Mean?', titleBn: 'প্রেসক্রিপশন পড়ার নিয়ম: ওডি বা বিডি মানে কী?', readTime: '5 min', date: 'May 18, 2026', img: '📝', descEn: 'Decode common medical abbreviations used by doctors to denote dosages and schedules.', descBn: 'ডাক্তারদের ব্যবহৃত ওডি, বিডি, টিডিএস এর মতো গুরুত্বপূর্ণ ওষুধের ডোজ পরিভাষা সম্পর্কে জানুন।' },
    { titleEn: 'First Aid Kit checklist: Medical Devices You Need at Home', titleBn: 'ফার্স্ট এইড বক্স চেকলিস্ট: বাসায় যেসব ডিভাইস রাখা জরুরি', readTime: '4 min', date: 'May 15, 2026', img: '🩺', descEn: 'Keep a digital blood pressure monitor, pulse oximeter, and contact-free thermometer ready.', descBn: 'একটি ডিজিটাল ব্লাড প্রেসার মনিটর, পালস অক্সিমিটার এবং ইনফ্রারেড থার্মোমিটার বাসায় প্রস্তুত রাখুন।' }
  ];

  const renderHeroSection = () => {
    if (heroBanners.length === 0) {
      return (
        <section className="relative rounded-3xl overflow-hidden hero-gradient p-8 md:p-14 text-white shadow-xl animate-fade-up">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            
            {/* Left Hero Content */}
            <div className="lg:col-span-7 space-y-6 animate-fade-up">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/10 backdrop-blur-md">
                <Sparkles size={14} className="text-[var(--color-teal)] animate-pulse" />
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[var(--color-mint)]">
                  {language === 'en' ? 'Verified Online Digital Pharmacy' : 'ভেরিফাইড অনলাইন ডিজিটাল ফার্মেসি'}
                </span>
              </div>

              <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
                {language === 'en' ? 'Authentic Medicine' : 'ঘরে বসেই বিশ্বস্ত'} <br className="hidden md:inline" />
                <span className="text-[var(--color-teal)]">{language === 'en' ? 'Delivered Fast' : 'ফার্মেসি সেবা'}</span>
              </h1>
              
              <p className="text-sm md:text-base text-slate-200 font-medium max-w-xl">
                {language === 'en' 
                  ? 'Order medicines, upload prescriptions, and manage healthcare products from Medicine Bazar. Fast delivery and real pharmacist support.'
                  : 'প্রেসক্রিপশন আপলোড করে বা সার্চ করে সহজেই ওষুধ কিনুন। সরাসরি বিশ্বস্ত সোর্স থেকে সংগৃহীত ওষুধ ও ক্যাশিয়ার পিওএস সুবিধা।'}
              </p>

              {/* Bilingual Search Box */}
              <form onSubmit={handleSearch} className="bg-white p-1.5 rounded-2xl flex shadow-lg max-w-lg ring-4 ring-white/10">
                <input 
                  type="text" 
                  placeholder={language === 'en' ? "Search medicines, generics, brands..." : "ওষুধ, জেনেরিক, কোম্পানি বা রোগের নাম লিখুন..."} 
                  className="flex-1 px-4 text-slate-800 focus:outline-none placeholder-slate-400 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button type="submit" variant="primary" size="sm" className="font-bold flex items-center gap-1">
                  <Search size={16} />
                  <span>{language === 'en' ? 'Search' : 'খুঁজুন'}</span>
                </Button>
              </form>

              {/* Hero CTAs */}
              <div className="flex flex-wrap gap-3 pt-2">
                <Button onClick={() => navigate('/shop')} variant="secondary" size="sm" className="font-bold text-white border-white hover:bg-white/10 hover-lift">
                  {language === 'en' ? 'Shop Medicines' : 'ওষুধ কিনুন'}
                </Button>
                <Button onClick={() => navigate('/prescription-upload')} variant="primary" size="sm" className="font-bold text-white bg-slate-900 border-slate-900 hover:bg-slate-800 hover-lift">
                  {language === 'en' ? 'Upload Prescription' : 'প্রেসক্রিপশন আপলোড'}
                </Button>
                <a href="https://wa.me/8801602444532" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center font-bold px-4 py-1.5 rounded-[12px] bg-[#25D366] text-white hover:bg-[#20ba56] text-sm shadow-sm transition-all hover-lift">
                  <MessageCircle size={15} className="mr-1.5" />
                  <span>{language === 'en' ? 'WhatsApp Order' : 'হোয়াটসঅ্যাপ অর্ডার'}</span>
                </a>
              </div>
            </div>

            {/* Right Hero Graphic Card */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="glass-panel text-slate-800 rounded-3xl p-6 w-full max-w-sm border border-white/20 shadow-2xl relative overflow-hidden bg-white/95 animate-soft-scale">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--color-primary)]/5 rounded-full blur-xl"></div>
                
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">{language === 'en' ? 'Quick Store Insights' : 'একনজরে মেডিসিন বাজার'}</h3>
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-primary)] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--color-primary)]"></span>
                  </span>
                </div>

                <div className="space-y-4 text-xs font-bold text-slate-700">
                  <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-[var(--color-mint)] border border-[var(--color-primary)]/10">
                    <span className="text-2xl animate-float-slow">📦</span>
                    <div>
                      <p className="text-[var(--color-primary-dark)] text-lg font-black leading-none">2,350+</p>
                      <p className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">{language === 'en' ? 'Cataloged Products' : 'নিবন্ধিত ওষুধ সামগ্রী'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-[var(--color-sky)] border border-[var(--color-trust)]/10">
                    <span className="text-2xl">👨‍⚕️</span>
                    <div>
                      <p className="text-[var(--color-trust)] text-base font-black leading-none">{language === 'en' ? 'Pharmacist Checked' : 'ফার্মাসিস্ট যাচাইকৃত'}</p>
                      <p className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">{language === 'en' ? '100% Secure Monograph' : 'নিরাপদ প্রেসক্রিপশন রিভিউ'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-amber-50/60 border border-amber-500/10">
                    <span className="text-2xl">⚡</span>
                    <div>
                      <p className="text-amber-600 text-base font-black leading-none">{language === 'en' ? 'POS + Online Integrated' : 'POS ও অনলাইন সমন্বিত স্টক'}</p>
                      <p className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">{language === 'en' ? 'Real-Time Sync' : 'ইনস্ট্যান্ট বিলিং ও রিফান্ড'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-200/60">
                    <span className="text-2xl">🔒</span>
                    <div>
                      <p className="text-slate-900 text-base font-black leading-none">{language === 'en' ? 'Manual Verification' : 'ম্যানুয়াল পেমেন্ট যাচাই'}</p>
                      <p className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">{language === 'en' ? 'Secure bKash/Nagad Link' : 'বিকাশ/নগদ ম্যানুয়াল প্রমাণ'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>
      );
    }

    const currentBanner = heroBanners[activeSlide];
    const bannerTitle = language === 'bn' && currentBanner.titleBn ? currentBanner.titleBn : currentBanner.title;
    const bannerSubtitle = language === 'bn' && currentBanner.subtitleBn ? currentBanner.subtitleBn : currentBanner.subtitle;
    
    const styleObj = currentBanner.backgroundGradient
      ? { background: currentBanner.backgroundGradient }
      : currentBanner.imageUrl
        ? { backgroundImage: `url(${currentBanner.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: 'linear-gradient(135deg, #075E54 0%, #05463f 50%, #022a25 100%)' };

    return (
      <section 
        style={styleObj}
        className="relative rounded-3xl overflow-hidden min-h-[420px] p-8 md:p-14 text-white shadow-xl transition-all duration-500 ease-in-out animate-fade-up flex items-center"
      >
        {currentBanner.imageUrl && (
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px]"></div>
        )}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10 w-full">
          {/* Left Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/10 backdrop-blur-md">
              <Sparkles size={14} className="text-[var(--color-teal)] animate-pulse" />
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[var(--color-mint)]">
                {language === 'en' ? 'Premium Offer For You' : 'আপনার জন্য বিশেষ অফার'}
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight animate-fade-up">
              {bannerTitle}
            </h1>
            
            {bannerSubtitle && (
              <p className="text-sm md:text-base text-slate-200 font-medium max-w-xl animate-fade-up">
                {bannerSubtitle}
              </p>
            )}

            <form onSubmit={handleSearch} className="bg-white p-1.5 rounded-2xl flex shadow-lg max-w-lg ring-4 ring-white/10 animate-fade-up">
              <input 
                type="text" 
                placeholder={language === 'en' ? "Search medicines, generics, brands..." : "ওষুধ, জেনেরিক, কোম্পানি বা রোগের নাম লিখুন..."} 
                className="flex-1 px-4 text-slate-800 focus:outline-none placeholder-slate-400 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button type="submit" variant="primary" size="sm" className="font-bold flex items-center gap-1 animate-pressable">
                <Search size={16} />
                <span>{language === 'en' ? 'Search' : 'খুঁজুন'}</span>
              </Button>
            </form>

            <div className="flex flex-wrap gap-3 pt-2 animate-fade-up">
              {currentBanner.ctaText && (
                <Button 
                  onClick={() => {
                    const target = currentBanner.ctaUrl || currentBanner.targetUrl || '/shop';
                    navigate(target);
                  }} 
                  variant="primary" 
                  size="sm" 
                  className="font-bold text-white bg-slate-900 border-slate-900 hover:bg-slate-800 hover-lift"
                >
                  {currentBanner.ctaText}
                </Button>
              )}
              <Button onClick={() => navigate('/shop')} variant="secondary" size="sm" className="font-bold text-white border-white hover:bg-white/10 hover-lift">
                {language === 'en' ? 'Shop Medicines' : 'ওষুধ কিনুন'}
              </Button>
              <Button onClick={() => navigate('/prescription-upload')} variant="primary" size="sm" className="font-bold text-white bg-slate-900 border-slate-900 hover:bg-slate-800 hover-lift">
                {language === 'en' ? 'Upload Prescription' : 'প্রেসক্রিপশন আপলোড'}
              </Button>
            </div>
          </div>

          {/* Right graphics or details */}
          <div className="lg:col-span-5 hidden lg:flex justify-center">
            {currentBanner.desktopImageUrl ? (
              <img 
                src={currentBanner.desktopImageUrl} 
                alt="Banner Graphic" 
                className="max-h-72 object-contain rounded-2xl animate-soft-scale shadow-lg border border-white/10"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <div className="glass-panel text-slate-800 rounded-3xl p-6 w-full max-w-sm border border-white/20 shadow-2xl relative overflow-hidden bg-white/95 animate-soft-scale">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--color-primary)]/5 rounded-full blur-xl"></div>
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">{language === 'en' ? 'Campaign Verified' : 'ক্যাম্পেইন নিশ্চিতকৃত'}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">ACTIVE</span>
                </div>
                <p className="text-xs text-slate-500 font-bold leading-relaxed mb-4">
                  {language === 'en' ? 'Medicine Bazar provides 100% authentic medicine directly from legal channels.' : 'মেডিসিন বাজার শতভাগ আসল ওষুধ সরাসরি আউটলেট থেকে সরবরাহ করে।'}
                </p>
                <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  🔥 {language === 'en' ? 'Priority verified prescription dispatch' : 'অগ্রাধিকার ভিত্তিতে প্রেসক্রিপশন ডেলিভারি'}
                </div>
              </div>
            )}
          </div>
        </div>

        {heroBanners.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
            {heroBanners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSlide(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${activeSlide === idx ? 'bg-white w-6' : 'bg-white/40 hover:bg-white/60'}`}
                aria-label={`Slide ${idx + 1}`}
              ></button>
            ))}
          </div>
        )}
      </section>
    );
  };

  return (
    <div className="space-y-16 pb-24 text-slate-800">
      
      {/* 1. HERO BANNER CAROUSEL */}
      {renderHeroSection()}

      {/* Dynamic Offer Strip */}
      {offerBanners.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl p-4 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-up hover-lift">
          <div className="flex items-center gap-3">
            <span className="text-2xl animate-bounce">🎁</span>
            <div>
              <h4 className="font-extrabold text-sm sm:text-base">
                {language === 'bn' && offerBanners[0].titleBn ? offerBanners[0].titleBn : offerBanners[0].title}
              </h4>
              {offerBanners[0].subtitle && (
                <p className="text-[11px] sm:text-xs text-slate-100 font-semibold">
                  {language === 'bn' && offerBanners[0].subtitleBn ? offerBanners[0].subtitleBn : offerBanners[0].subtitle}
                </p>
              )}
            </div>
          </div>
          {(offerBanners[0].ctaText && (offerBanners[0].ctaUrl || offerBanners[0].targetUrl)) ? (
            <Button 
              onClick={() => navigate(offerBanners[0].ctaUrl || offerBanners[0].targetUrl)} 
              variant="secondary" 
              size="sm" 
              className="bg-slate-900 border-slate-900 text-white font-bold hover:bg-slate-800 shrink-0 hover-lift"
            >
              {offerBanners[0].ctaText}
            </Button>
          ) : (
            <Button 
              onClick={() => navigate('/shop')} 
              variant="secondary" 
              size="sm" 
              className="bg-slate-900 border-slate-900 text-white font-bold hover:bg-slate-800 shrink-0 hover-lift"
            >
              {language === 'en' ? 'Claim Offer' : 'অফারটি লুফে নিন'}
            </Button>
          )}
        </div>
      )}

      {/* 2. TRUST BADGE ROW (Show 4 premium cards) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="trust-card p-5 text-center flex flex-col items-center hover-lift">
          <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center mb-3">
            <ShieldCheck size={24} />
          </div>
          <h4 className="font-extrabold text-slate-800 text-sm mb-1">{language === 'en' ? 'Authentic Medicine' : '১০০% আসল ওষুধ'}</h4>
          <p className="text-[11px] text-slate-400 leading-normal">{language === 'en' ? 'Verified directly from top drug companies' : 'দেশের সেরা কোম্পানি থেকে সরাসরি সংগৃহীত'}</p>
        </div>

        <div className="trust-card p-5 text-center flex flex-col items-center hover-lift">
          <div className="w-12 h-12 rounded-full bg-[var(--color-trust)]/10 text-[var(--color-trust)] flex items-center justify-center mb-3">
            <Stethoscope size={24} />
          </div>
          <h4 className="font-extrabold text-slate-800 text-sm mb-1">{language === 'en' ? 'Pharmacist Checked' : 'ফার্মাসিস্ট চেকড'}</h4>
          <p className="text-[11px] text-slate-400 leading-normal">{language === 'en' ? 'Every prescription reviewed manually' : 'অভিজ্ঞ টিম দ্বারা প্রতিটি প্রেসক্রিপশন রিভিউ'}</p>
        </div>

        <div className="trust-card p-5 text-center flex flex-col items-center hover-lift">
          <div className="w-12 h-12 rounded-full bg-[var(--color-teal)]/10 text-[var(--color-teal)] flex items-center justify-center mb-3">
            <FileText size={24} />
          </div>
          <h4 className="font-extrabold text-slate-800 text-sm mb-1">{language === 'en' ? 'Secure Prescription' : 'নিরাপদ প্রেসক্রিপশন'}</h4>
          <p className="text-[11px] text-slate-400 leading-normal">{language === 'en' ? 'Encrypted cloud storage for clinical data' : 'আপনার গোপনীয় তথ্য সর্বোচ্চ সুরক্ষায় সংরক্ষিত'}</p>
        </div>

        <div className="trust-card p-5 text-center flex flex-col items-center hover-lift">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mb-3">
            <CreditCard size={24} />
          </div>
          <h4 className="font-extrabold text-slate-800 text-sm mb-1">{language === 'en' ? 'Manual payment verified' : 'ম্যানুয়াল পেমেন্ট ভেরিফাইড'}</h4>
          <p className="text-[11px] text-slate-400 leading-normal">{language === 'en' ? 'Secure bKash transfer manually checked' : 'ম্যানুয়াল ট্রানজেকশন যাচাই করে ডেলিভারি'}</p>
        </div>
      </section>

      {/* 3. QUICK ACTION BENTO GRID (Large Cards) */}
      <section className="space-y-6">
        <h3 className="section-title">{language === 'en' ? 'Quick Actions' : 'দ্রুত সেবা সমূহ'}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Bento Card 1: Prescription Upload (Dynamic if prescription banner exists) */}
          {rxBanners.length > 0 ? (
            <div 
              style={rxBanners[0].backgroundGradient ? { background: rxBanners[0].backgroundGradient } : {}}
              className="glass-card p-6 border-l-4 border-l-[var(--color-primary)] flex flex-col justify-between h-56 relative overflow-hidden animate-fade-up hover-lift"
            >
              {rxBanners[0].imageUrl && (
                <div className="absolute right-0 bottom-0 opacity-10 w-24 h-24">
                  <img src={rxBanners[0].imageUrl} alt="Prescription" className="object-contain" />
                </div>
              )}
              <div className="space-y-2 relative z-10">
                <span className="text-3xl">📝</span>
                <h4 className="font-black text-slate-800 text-lg leading-tight">
                  {language === 'bn' && rxBanners[0].titleBn ? rxBanners[0].titleBn : rxBanners[0].title}
                </h4>
                <p className="text-xs text-slate-500 font-bold leading-relaxed">
                  {language === 'bn' && rxBanners[0].subtitleBn ? rxBanners[0].subtitleBn : rxBanners[0].subtitle}
                </p>
              </div>
              <div className="pt-4 relative z-10">
                <Button onClick={() => navigate(rxBanners[0].ctaUrl || rxBanners[0].targetUrl || '/prescription-upload')} variant="primary" size="sm" className="font-bold flex items-center gap-1 hover-lift">
                  <span>{rxBanners[0].ctaText || (language === 'en' ? 'Upload Now' : 'এখনই আপলোড করুন')}</span>
                  <ArrowRight size={14} />
                </Button>
              </div>
            </div>
          ) : (
            <div className="glass-card p-6 border-l-4 border-l-[var(--color-primary)] flex flex-col justify-between h-56 hover-lift animate-fade-up">
              <div className="space-y-2">
                <span className="text-3xl">📝</span>
                <h4 className="font-black text-slate-800 text-lg leading-tight">{language === 'en' ? 'Upload Clinical Prescription' : 'প্রেসক্রিপশন আপলোড করুন'}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{language === 'en' ? 'Upload clear prescription photo. Pharmacist will manually verify and add items to your cart.' : 'ডাক্তারের প্রেসক্রিপশনের ছবি তুলে এখানে সাবমিট করুন। আমাদের ফার্মাসিস্ট যাচাই করে মেডিসিন যোগ করে দিবেন।'}</p>
              </div>
              <div className="pt-4">
                <Button onClick={() => navigate('/prescription-upload')} variant="primary" size="sm" className="font-bold flex items-center gap-1 hover-lift">
                  <span>{language === 'en' ? 'Upload Prescription' : 'প্রেসক্রিপশন আপলোড'}</span>
                  <ArrowRight size={14} />
                </Button>
              </div>
            </div>
          )}

          {/* Bento Card 2: Call/WhatsApp Order */}
          <div className="glass-card p-6 border-l-4 border-l-[#25D366] flex flex-col justify-between h-56 hover-lift animate-fade-up">
            <div className="space-y-2">
              <span className="text-3xl">💬</span>
              <h4 className="font-black text-slate-800 text-lg leading-tight">{language === 'en' ? 'Call or WhatsApp Order' : 'সরাসরি কল বা হোয়াটসঅ্যাপ'}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{language === 'en' ? 'Order instantly by calling our support hotline or uploading image to WhatsApp.' : 'আমাদের কাস্টমার কেয়ারে কল করে অথবা প্রেসক্রিপশন হোয়াটসঅ্যাপে মেসেজ পাঠিয়ে ওষুধ অর্ডার করতে পারেন।'}</p>
            </div>
            <div className="pt-4 flex gap-2">
              <a href="https://wa.me/8801602444532" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center font-bold px-4 py-1.5 rounded-[12px] bg-[#25D366] text-white hover:bg-[#1fbc53] text-sm shadow-sm transition-all min-h-[38px] hover-lift">
                <MessageCircle size={14} className="mr-1.5" />
                <span>WhatsApp</span>
              </a>
              <a href="tel:01602444532" className="inline-flex items-center justify-center font-bold px-4 py-1.5 rounded-[12px] bg-slate-800 text-white hover:bg-slate-700 text-sm shadow-sm transition-all min-h-[38px] hover-lift">
                <Phone size={14} className="mr-1.5" />
                <span>01602444532</span>
              </a>
            </div>
          </div>

          {/* Bento Card 3: POS/Offline Store */}
          <div className="glass-card p-6 border-l-4 border-l-[var(--color-trust)] flex flex-col justify-between h-56 hover-lift animate-fade-up">
            <div className="space-y-2">
              <span className="text-3xl">🏪</span>
              <h4 className="font-black text-slate-800 text-lg leading-tight">{language === 'en' ? 'Medicine Bazar Retail Store' : 'অফলাইন শপ ও পিওএস বিলিং'}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{language === 'en' ? 'Real-time billing, instant POS sales integration and corporate store ledger.' : 'আমাদের অফলাইন আউটলেটে এসে সরাসরি দেখে ওষুধ ও হেলথকেয়ার সামগ্রী ক্রয় ও ইনস্ট্যান্ট ক্যাশিয়ার রিসিট সংগ্রহ করুন।'}</p>
            </div>
            <div className="pt-4">
              <Button onClick={() => navigate('/shop')} variant="secondary" size="sm" className="font-bold flex items-center gap-1 border-[var(--color-trust)] text-[var(--color-trust)] hover:bg-[var(--color-trust)]/5 hover-lift">
                <span>{language === 'en' ? 'Find Retail Shop' : 'মেডিসিন শপ'}</span>
                <ArrowRight size={14} />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SHOP BY CATEGORY (Arogga Inspired structured category sections) */}
      <section className="space-y-6">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <h3 className="section-title">{t('home.shopCategory')}</h3>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{language === 'en' ? 'Browse medicines by clinical classifications' : 'রোগ ভিত্তিক ও প্রয়োজনীয় ক্যাটাগরি অনুযায়ী ওষুধ খুঁজুন'}</p>
          </div>
          <Link to="/shop" className="text-[var(--color-primary)] font-extrabold hover:underline text-xs flex items-center gap-1">
            <span>{language === 'en' ? 'View All Categories' : 'সব ক্যাটাগরি'}</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          {mainCategories.map((cat, idx) => (
            <Link 
              key={idx}
              to={`/category/${encodeURIComponent(cat.slug)}`}
              className={`glass-card p-5 flex flex-col items-center justify-center text-center gap-3.5 ${cat.bg} hover:border-[var(--color-primary)]/40 transition-all`}
            >
              <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-3xl transform group-hover:scale-110 transition-transform duration-300">
                {cat.icon}
              </div>
              <span className="font-extrabold text-slate-800 text-xs sm:text-sm leading-snug">
                {language === 'en' ? cat.nameEn : cat.nameBn}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 5. SHOP BY HEALTH CONCERN */}
      <section className="space-y-6">
        <div className="space-y-1">
          <h3 className="section-title">{language === 'en' ? 'Shop by Health Concern' : 'স্বাস্থ্য বিষয়ক সমস্যা অনুযায়ী ওষুধ'}</h3>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{language === 'en' ? 'Find substitutes based on common pharmaceutical concerns' : 'সবচেয়ে প্রচলিত শারীরিক সমস্যা অনুযায়ী ওষুধের বিকল্প খুজুন'}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          {healthConcerns.map((concern, idx) => (
            <Link 
              key={idx}
              to={`/category/${encodeURIComponent(concern.slug)}`}
              className="px-4 py-2.5 bg-white/70 backdrop-blur-sm border border-slate-200/80 rounded-full hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 text-slate-700 hover:text-[var(--color-primary)] transition-all text-xs font-bold flex items-center gap-2 shadow-sm"
            >
              <span className="text-sm">{concern.icon}</span>
              <span>{language === 'en' ? concern.nameEn : concern.nameBn}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 6. FEATURED PRODUCTS (Max 20 Items Grid) */}
      <section className="space-y-6">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <h3 className="section-title">{language === 'en' ? 'Trending Medicines' : 'জনপ্রিয় ওষুধ ও সামগ্রী'}</h3>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{language === 'en' ? 'Most ordered medicines, verified and cataloged' : 'সবচেয়ে বেশি বিক্রিত এবং চিকিৎসকদের নির্দেশিত নির্ভরযোগ্য ওষুধ সামগ্রী'}</p>
          </div>
          <Link to="/shop" className="text-[var(--color-primary)] font-extrabold hover:underline text-xs flex items-center gap-1">
            <span>{language === 'en' ? 'Browse Shop' : 'সব ওষুধ দেখুন'}</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loading /></div>
        ) : featuredProducts.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-medium">
            {language === 'en' ? 'No medicines registered inside catalog.' : 'ওষুধ ডিরেক্টরি ক্যাটালগে কোনো ওষুধ পাওয়া যায়নি।'}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id || product._id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 7. PRESCRIPTION WORKFLOW SECTION (4 Steps) */}
      <section className="glass-panel p-8 rounded-3xl border border-[var(--color-primary)]/10 space-y-8 bg-gradient-to-br from-[var(--color-mint)]/40 to-transparent">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h3 className="text-2xl font-black text-slate-900 leading-tight">
            {language === 'en' ? 'How Prescription Verification Works' : 'প্রেসক্রিপশন ভেরিফিকেশন প্যানেল'}
          </h3>
          <p className="text-xs text-slate-400 font-semibold">
            {language === 'en' ? 'Get verified in 4 simple pharmacist steps' : '৪টি সহজ ধাপে ফার্মাসিস্ট দ্বারা নিশ্চিত হয়ে ওষুধ সংগ্রহ করুন'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          <div className="space-y-2.5 p-4 relative">
            <span className="w-8 h-8 rounded-full cta-gradient text-white flex items-center justify-center font-bold text-xs mx-auto mb-2">1</span>
            <h4 className="font-extrabold text-slate-800 text-sm">{language === 'en' ? 'Upload Photo' : 'ছবি আপলোড'}</h4>
            <p className="text-xs text-slate-400 leading-relaxed">{language === 'en' ? 'Upload a clear image of prescription during checkout.' : 'চেকআউটের সময় চিকিৎসকের দেওয়া প্রেসক্রিপশনের ছবি আপলোড করুন।'}</p>
          </div>
          <div className="space-y-2.5 p-4 relative">
            <span className="w-8 h-8 rounded-full cta-gradient text-white flex items-center justify-center font-bold text-xs mx-auto mb-2">2</span>
            <h4 className="font-extrabold text-slate-800 text-sm">{language === 'en' ? 'Pharmacist Review' : 'ফার্মাসিস্ট রিভিউ'}</h4>
            <p className="text-xs text-slate-400 leading-relaxed">{language === 'en' ? 'Our licensed pharmacists review the drug monograph.' : 'আমাদের নিবন্ধিত ফার্মাসিস্টরা প্রেসক্রিপশনের মাত্রা ও ব্যবহারের নির্দেশিকা রিভিউ করবেন।'}</p>
          </div>
          <div className="space-y-2.5 p-4 relative">
            <span className="w-8 h-8 rounded-full cta-gradient text-white flex items-center justify-center font-bold text-xs mx-auto mb-2">3</span>
            <h4 className="font-extrabold text-slate-800 text-sm">{language === 'en' ? 'Order Confirmation' : 'অর্ডার নিশ্চিতকরণ'}</h4>
            <p className="text-xs text-slate-400 leading-relaxed">{language === 'en' ? 'We call/SMS you to review generic substitute savings.' : 'ওষুধের স্টক নিশ্চিত করে ডিসকাউন্ট বিকল্প সম্পর্কে ফোন করে জানানো হবে।'}</p>
          </div>
          <div className="space-y-2.5 p-4 relative">
            <span className="w-8 h-8 rounded-full cta-gradient text-white flex items-center justify-center font-bold text-xs mx-auto mb-2">4</span>
            <h4 className="font-extrabold text-slate-800 text-sm">{language === 'en' ? 'Fast Delivery' : 'ফার্স্ট ডেলিভারি'}</h4>
            <p className="text-xs text-slate-400 leading-relaxed">{language === 'en' ? 'We deliver authentic medicines directly to your door.' : 'অনুমোদিত আসল ওষুধ সিলগালা প্যাকেজে আপনার ঠিকানায় অতি দ্রুত ডেলিভারি।'}</p>
          </div>
        </div>
      </section>

      {/* 8. PAYMENT SECTION (COD & MFS Manual verification instructions) */}
      <section className="glass-card p-6 border-2 border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-600 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
            <CreditCard size={12} />
            <span>{language === 'en' ? 'Manual MFS Payment Gateway' : 'ম্যানুয়াল পেমেন্ট গেটওয়ে'}</span>
          </div>
          <h4 className="font-black text-slate-900 text-lg leading-tight">{language === 'en' ? 'Direct Mobile Financial Service' : 'নিরাপদ মোবাইল পেমেন্ট নির্দেশিকা'}</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            {language === 'en' 
              ? 'We support COD, Nagad, bKash Personal & Upay. All manual payments require entering transaction proof which will be verified manually by admin before confirming.' 
              : 'আমরা ক্যাশ অন ডেলিভারি, বিকাশ, নগদ এবং রকেট ব্যক্তিগত ট্রানজেকশন সাপোর্ট করি। ম্যানুয়াল পেমেন্ট ট্রানজেকশন আইডি আপলোড করার পর এডমিন দ্বারা যাচাই করে অর্ডার প্রস্তুত করা হয়।'}
          </p>
        </div>
        
        {/* Support logos placeholders */}
        <div className="flex flex-wrap items-center gap-4 shrink-0 font-extrabold text-xs text-slate-500 bg-slate-50 p-4 rounded-2xl border border-slate-200/60 shadow-inner">
          <span className="text-[#E2125B]">bKash</span>
          <span className="text-[#F57F20]">Nagad</span>
          <span className="text-[#005FA9]">Upay</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500">{language === 'en' ? 'COD' : 'ক্যাশ অন ডেলিভারি'}</span>
        </div>
      </section>

      {/* 9. HEALTH TIPS / BLOG PREVIEW */}
      <section className="space-y-6">
        <div className="space-y-1">
          <h3 className="section-title">{language === 'en' ? 'Health Tips & Articles' : 'স্বাস্থ্য সচেতনতামূলক টিপস ও আর্টিকেল'}</h3>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{language === 'en' ? 'Read health and medicine insights verified by clinical experts' : 'আমাদের অভিজ্ঞ ডাক্তার ও ফার্মাসিস্টদের পরামর্শ ও নির্দেশিকাগুলো পড়ুন'}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {healthTips.map((tip, idx) => (
            <Card key={idx} hover className="flex flex-col justify-between h-full p-5 space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1"><Calendar size={12} /> {tip.date}</span>
                  <span>• {tip.readTime}</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-3xl shrink-0 p-2 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center w-12 h-12">{tip.img}</span>
                  <h4 className="font-extrabold text-slate-800 text-sm leading-snug group-hover:text-[var(--color-primary)] transition-colors">
                    {language === 'en' ? tip.titleEn : tip.titleBn}
                  </h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                  {language === 'en' ? tip.descEn : tip.descBn}
                </p>
              </div>
              <div className="pt-2 text-xs font-bold text-[var(--color-primary)] hover:underline cursor-pointer flex items-center gap-1">
                <span>{language === 'en' ? 'Read Article' : 'বিস্তারিত পড়ুন'}</span>
                <ArrowRight size={12} />
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 10. FINAL CTA SECTION (Need help finding medicine?) */}
      <section className="glass-panel p-8 rounded-3xl border border-[var(--color-primary)]/10 text-center space-y-6 relative overflow-hidden bg-gradient-to-br from-[var(--color-mint)]/45 to-transparent">
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-[var(--color-primary)]/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-[var(--color-trust)]/5 rounded-full blur-3xl"></div>

        <div className="max-w-xl mx-auto space-y-3 relative z-10">
          <HelpCircle size={44} className="mx-auto text-[var(--color-primary)] animate-bounce" />
          <h3 className="text-2xl font-black text-slate-900 leading-tight">
            {language === 'en' ? 'Need Help Finding Your Medicine?' : 'কাঙ্ক্ষিত ওষুধ খুঁজে পাচ্ছেন না?'}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            {language === 'en' 
              ? 'Do not worry! Upload your prescription or chat with our pharmacist. We will immediately find the drug or suggest cheaper generic alternates.' 
              : 'চিন্তা করবেন না! আপনার প্রেসক্রিপশনের ছবি আপলোড করুন অথবা সরাসরি হোয়াটসঅ্যাপে ফার্মাসিস্টের সাথে কথা বলুন। আমরা দ্রুত ওষুধ খুঁজে দিতে সাহায্য করব।'}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 relative z-10">
          <a href="https://wa.me/8801602444532" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center font-bold px-5 py-2.5 rounded-[16px] bg-[#25D366] text-white hover:bg-[#1dba52] text-sm shadow-md shadow-[#25D366]/10 transition-all min-h-[44px]">
            <MessageCircle size={16} className="mr-1.5" />
            <span>{language === 'en' ? 'WhatsApp Support' : 'হোয়াটসঅ্যাপে মেসেজ পাঠান'}</span>
          </a>
          <Button onClick={() => navigate('/checkout')} variant="primary" size="md" className="font-bold flex items-center gap-1">
            <FileText size={16} />
            <span>{language === 'en' ? 'Upload Prescription' : 'প্রেসক্রিপশন আপলোড করুন'}</span>
          </Button>
          <a href="tel:01602444532" className="inline-flex items-center justify-center font-bold px-5 py-2.5 rounded-[16px] bg-slate-900 text-white hover:bg-slate-800 text-sm shadow-md transition-all min-h-[44px]">
            <Phone size={16} className="mr-1.5" />
            <span>{language === 'en' ? 'Call Pharmacist' : 'কল করুন'}</span>
          </a>
        </div>
      </section>

    </div>
  );
};

export default Home;
