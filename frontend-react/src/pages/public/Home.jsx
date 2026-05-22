import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, MessageCircle, ShieldCheck, Truck, CreditCard, Stethoscope, ArrowRight, Activity, Heart, Eye, Beaker, Zap, Calendar, Sparkles, Share2, Award } from 'lucide-react';
import api from '../../services/api';
import ProductCard from '../../components/product/ProductCard';
import Loading from '../../components/common/Loading';
import { useLanguage } from '../../context/LanguageContext';

const Home = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [prescriptionMeds, setPrescriptionMeds] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const navigate = useNavigate();
  const { language, t } = useLanguage();

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [productsRes, bannersRes] = await Promise.all([
          api.get('/products?limit=160').catch(() => ({ data: [] })),
          api.get('/banners').catch(() => ({ data: { banners: [] } }))
        ]);
        
        const items = productsRes.data?.data || productsRes.data || [];
        setAllProducts(items);
        
        // Populate featured, best sellers, and prescriptions
        setFeaturedProducts(items.slice(0, 12));
        setBestSellers(items.filter(p => (p.soldCount || 0) > 20).slice(0, 12));
        setPrescriptionMeds(items.filter(p => p.prescriptionRequired).slice(0, 12));
        
        const fetchedBanners = bannersRes.data?.banners || [];
        setBanners(fetchedBanners);
      } catch (err) {
        console.error('Error fetching products:', err);
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

  const categories = [
    { id: 1, name: t('nav.otc'), icon: '💊', slug: 'Pain & Fever' },
    { id: 2, name: language === 'en' ? 'Gastrointestinal' : 'গ্যাস্ট্রিক ও লিভার', icon: '🧪', slug: 'Gastrointestinal' },
    { id: 3, name: t('nav.women'), icon: '👩', slug: "Women's Health" },
    { id: 4, name: t('nav.baby'), icon: '👶', slug: 'Baby & Child' },
    { id: 5, name: language === 'en' ? 'Vitamins' : 'ভিটামিন ও সাপ্লিমেন্ট', icon: '⚡', slug: 'Vitamins & Supplements' },
    { id: 6, name: language === 'en' ? 'Personal Care' : 'পার্সোনাল কেয়ার', icon: '🧴', slug: 'Personal Care' },
    { id: 7, name: language === 'en' ? 'Sexual Health' : 'যৌন স্বাস্থ্য', icon: '💖', slug: 'Sexual Health' },
    { id: 8, name: t('nav.devices'), icon: '🩺', slug: 'Medical Devices' }
  ];

  const directoryTabs = [
    { id: 'All', labelEn: 'All Medicines', labelBn: 'সব ওষুধ' },
    { id: 'Pain & Fever', labelEn: 'Pain & Fever', labelBn: 'ব্যথা ও জ্বর' },
    { id: 'Gastrointestinal', labelEn: 'Acidity & Gastric', labelBn: 'গ্যাস্ট্রিক ও অ্যাসিডিটি' },
    { id: 'Respiratory', labelEn: 'Cold & Cough', labelBn: 'সর্দি ও কাশি' },
    { id: 'Vitamins & Supplements', labelEn: 'Vitamins', labelBn: 'ভিটামিনস' },
    { id: 'Sexual Health', labelEn: 'Sexual Wellness', labelBn: 'যৌন সুস্থতা' }
  ];

  // Filter 100-150 medicines for homepage directory
  const filteredDirectory = activeTab === 'All' 
    ? allProducts.slice(0, 120)
    : allProducts.filter(p => p.category === activeTab).slice(0, 100);

  return (
    <div className="space-y-16 pb-24 font-sans text-gray-100">
      
      {/* 1. Hero Search Section (Glassmorphic & Animated) */}
      <section className="relative rounded-3xl overflow-hidden glass-panel p-8 md:p-16 border border-sky/10 bg-hero-gradient relative">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#10B981]/15 rounded-full blur-3xl -z-10"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-md">
            <Sparkles size={16} className="text-secondary animate-pulse" />
            <span className="text-xs font-bold text-gradient uppercase tracking-widest">
              {language === 'en' ? 'Next-Gen Digital Pharmacy' : 'পরবর্তী প্রজন্মের ডিজিটাল ফার্মেসি'}
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight leading-none text-white">
            {language === 'en' ? 'Futuristic Digital Health' : 'ভবিষ্যৎমুখী ডিজিটাল স্বাস্থ্য'} <br />
            <span className="text-gradient font-black">{language === 'en' ? 'Delivered Real-Time.' : 'রিয়েল-টাইম ডেলিভারি।'}</span>
          </h1>
          <p className="text-lg mb-10 text-gray-300 max-w-2xl mx-auto font-medium">
            {language === 'en' 
              ? 'Find cheap generic substitutes, securely upload prescriptions for human-veteran review, and manage smart POS billing instantly.' 
              : 'সাশ্রয়ী বিকল্প ব্র্যান্ড খুঁজুন, অভিজ্ঞ ফার্মাসিস্ট দ্বারা প্রেসক্রিপশন যাচাই করুন এবং তাৎক্ষণিক বিলিং সুবিধা উপভোগ করুন।'}
          </p>
          
          <form 
            onSubmit={handleSearch}
            className="glass-panel p-2.5 rounded-2xl flex max-w-2xl mx-auto mb-8 focus-within:ring-2 ring-primary/40 transition-all duration-500 shadow-soft"
          >
            <input 
              type="text" 
              placeholder={t('common.searchPlaceholder')} 
              className="flex-1 px-6 bg-transparent text-white focus:outline-none placeholder-gray-400 text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="bg-primary hover:bg-primary-dark text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-lg flex items-center gap-2 transform active:scale-95 duration-200">
              <Search size={20} />
              {t('common.search')}
            </button>
          </form>
          
          <div className="flex flex-wrap justify-center items-center gap-3 text-sm text-gray-400">
            <span className="font-semibold">{language === 'en' ? 'Hot Searches' : 'সবচেয়ে বেশি খোঁজা হয়েছে'}:</span>
            {['Napa Extend', 'Sergel 20mg', 'Fexo 120mg', 'Monas 10'].map((kw) => (
              <span 
                key={kw} 
                onClick={() => { setSearchQuery(kw); navigate(`/search?q=${encodeURIComponent(kw)}`); }}
                className="px-3 py-1 rounded-full bg-white/5 border border-white/10 hover:border-primary hover:text-white cursor-pointer transition-all"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Dynamic Promotional Banner Showcases */}
      {banners.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <Zap size={20} className="text-offer" />
            <h2 className="text-xl font-extrabold uppercase tracking-wider text-white">
              {language === 'en' ? 'Active Healthcare Offers' : 'চলতি অফার ও ক্যাম্পেইন'}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banners.map((banner, index) => (
              <motion.div 
                key={banner.id || index}
                whileHover={{ y: -6 }}
                className="relative rounded-2xl overflow-hidden border border-white/5 shadow-2xl group cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent z-10"></div>
                <img 
                  src={banner.imageUrl} 
                  alt={banner.title} 
                  className="w-full h-56 object-cover transform group-hover:scale-110 transition-transform duration-700"
                  onError={(e) => { e.currentTarget.src = '/medicine-bazar-soft-launch-banner.png'; }}
                />
                <div className="absolute bottom-5 left-5 right-5 z-20 space-y-2">
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase font-extrabold bg-offer text-black">
                    {language === 'en' ? 'Soft Launch Promo' : 'সফট লঞ্চ প্রোমো'}
                  </span>
                  <h3 className="text-white font-black text-xl drop-shadow-md">{banner.title}</h3>
                  <p className="text-gray-300 text-xs truncate">{banner.description || (language === 'en' ? 'Premium medicine checkout discounts.' : 'মেডিসিন ক্রয়ে আকর্ষণীয় ক্যাশব্যাক ও ডিসকাউন্ট।')}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* 3. Secure Vetting prescription & WhatsApp Hotlines */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div 
          whileHover={{ y: -4 }}
          className="glass-panel rounded-3xl p-8 flex flex-col md:flex-row items-center gap-6 border border-primary/20 relative overflow-hidden group"
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all"></div>
          <div className="p-5 bg-primary/10 text-primary rounded-full shrink-0">
            <FileText size={48} className="animate-pulse" />
          </div>
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
              {language === 'en' ? 'Verified Review' : 'ফার্মাসিস্ট ভেরিফাইড'}
            </div>
            <h3 className="text-2xl font-black text-white">{t('home.orderPrescription')}</h3>
            <p className="text-gray-300 text-sm leading-relaxed">{t('home.orderPrescriptionDesc')}</p>
            <Link to="/checkout" className="bg-primary hover:bg-primary-dark text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all inline-block shadow-lg">
              {language === 'en' ? 'Upload Secure Prescription' : 'প্রেসক্রিপশন আপলোড করুন'}
            </Link>
          </div>
        </motion.div>
        
        <motion.div 
          whileHover={{ y: -4 }}
          className="glass-panel rounded-3xl p-8 flex flex-col md:flex-row items-center gap-6 border border-[#25D366]/20 relative overflow-hidden group"
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#25D366]/10 rounded-full blur-2xl group-hover:bg-[#25D366]/20 transition-all"></div>
          <div className="p-5 bg-[#25D366]/10 text-[#25D366] rounded-full shrink-0">
            <MessageCircle size={48} />
          </div>
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#25D366]/20 text-[#25D366] text-xs font-bold uppercase tracking-wider">
              {language === 'en' ? 'Instant Chat' : 'সরাসরি চ্যাট'}
            </div>
            <h3 className="text-2xl font-black text-white">{t('home.orderWhatsApp')}</h3>
            <p className="text-gray-300 text-sm leading-relaxed">{t('home.orderWhatsAppDesc')}</p>
            <a href="https://wa.me/8801602444532?text=Hello%20Medicine%20Bazar%2C%20I%20have%20uploaded%20my%20prescription." target="_blank" rel="noreferrer" className="bg-[#25D366] hover:bg-[#1DA851] text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all inline-block shadow-lg">
              {t('home.chatWhatsApp')}
            </a>
          </div>
        </motion.div>
      </section>

      {/* 4. Interactive Category Tiles Grid */}
      <section className="space-y-6">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-white flex items-center gap-2">
              <Activity size={24} className="text-primary" />
              <span>{t('home.shopCategory')}</span>
            </h2>
            <p className="text-gray-400 text-sm">{language === 'en' ? 'Browse medicines by clinical classifications' : 'রোগ ভিত্তিক ও প্রয়োজনীয় ক্যাটাগরি অনুযায়ী ওষুধ খুঁজুন'}</p>
          </div>
          <Link to="/shop" className="text-primary font-bold hover:underline text-sm flex items-center gap-1">
            {t('home.viewAll')} <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {categories.map(cat => (
            <Link 
              key={cat.id} 
              to={`/category/${cat.slug}`} 
              className="glass-card rounded-2xl p-6 flex flex-col items-center justify-center gap-4 hover:border-primary transition-all text-center group"
            >
              <span className="text-4xl transform group-hover:scale-125 group-hover:rotate-12 transition-all duration-300">{cat.icon}</span>
              <span className="font-bold text-gray-200 group-hover:text-white text-xs tracking-wide">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 5. MASSIVE PHARMACEUTICAL DIRECTORY (100-150 ITEMS) */}
      <section className="space-y-8 glass-panel p-8 rounded-3xl border border-white/5 relative">
        <div className="absolute top-4 right-4 animate-pulse text-primary/30">
          <Award size={64} />
        </div>
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
            <Sparkles size={14} />
            <span>{language === 'en' ? 'Active Drug Catalog' : 'চলতি মেডিসিন ক্যাটালগ'}</span>
          </div>
          <h2 className="text-3xl font-black text-white">
            {language === 'en' ? 'Bangladeshi Medicine Directory' : 'বাংলাদেশি ওষুধের ডিরেক্টরি'}
          </h2>
          <p className="text-gray-400 text-sm max-w-2xl">
            {language === 'en'
              ? 'Complete pharmaceutical indexing of active local products including usages, dosages, side effects, and pricing details.'
              : 'সব ধরনের প্রয়োজনীয় ওষুধ, খাওয়ার নিয়ম, উপকারিতা ও রিয়েল-টাইম ডিসকাউন্ট প্রাইসিং সম্বলিত পূর্ণাঙ্গ ডিরেক্টরি।'}
          </p>
        </div>

        {/* Directory Categories Tabs */}
        <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none border-b border-white/5">
          {directoryTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-lg'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {language === 'en' ? tab.labelEn : tab.labelBn}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loading /></div>
        ) : filteredDirectory.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {language === 'en' ? 'No medicines found in this category.' : 'এই ক্যাটাগরিতে কোনো ওষুধ পাওয়া যায়নি।'}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
            {filteredDirectory.map((product) => (
              <ProductCard key={product.id || product._id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 6. Social Media & Digitalization Integration Section */}
      <section className="glass-panel p-8 rounded-3xl border border-white/5 bg-gradient-to-br from-white/5 via-transparent to-transparent">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-trust/10 text-trust text-xs font-bold">
              <Share2 size={14} />
              <span>{language === 'en' ? 'Connect Digitally' : 'ডিজিটাল কানেক্ট'}</span>
            </div>
            <h2 className="text-3xl font-black text-white leading-tight">
              {language === 'en' ? 'Stay Connected on Our Social Channels' : 'আমাদের সোশ্যাল চ্যানেলে যুক্ত থাকুন'}
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              {language === 'en'
                ? 'Follow our social media ecosystems to receive instant updates regarding health notices, drug approvals, weekly discount codes, and live support.'
                : 'স্বাস্থ্য সচেতনতামূলক তথ্য, নতুন ওষুধের আপডেট, সাপ্তাহিক ডিসকাউন্ট কুপন ও ২৪/৭ লাইভ সহায়তার জন্য আমাদের সামাজিক যোগাযোগ মাধ্যমে যুক্ত হোন।'}
            </p>
            <div className="flex flex-wrap gap-4">
              <a 
                href="https://facebook.com/medicinebazar24" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#1877F2]/10 hover:bg-[#1877F2] text-[#1877F2] hover:text-white font-bold text-sm transition-all border border-[#1877F2]/20"
              >
                <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                <span>Facebook Page</span>
              </a>
              <a 
                href="https://www.youtube.com/@MedicineBazar24" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#FF0000]/10 hover:bg-[#FF0000] text-[#FF0000] hover:text-white font-bold text-sm transition-all border border-[#FF0000]/20"
              >
                <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11C4.483 20.455 12 20.455 12 20.455s7.517 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                <span>YouTube Channel</span>
              </a>
              <a 
                href="https://whatsapp.com/channel/0029Vb8A8KwAYlUGFxSkXy01" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366] text-[#25D366] hover:text-white font-bold text-sm transition-all border border-[#25D366]/20"
              >
                <MessageCircle size={18} />
                <span>WhatsApp Channel</span>
              </a>
            </div>
          </div>
          <div className="relative flex justify-center">
            <div className="absolute w-64 h-64 bg-primary/20 rounded-full blur-3xl -z-10 animate-pulse"></div>
            <img 
              src="/logo-3d.png" 
              alt="Medicine Bazar 3D Brand" 
              className="w-full max-w-xs object-contain animate-bounce"
              style={{ animationDuration: '6s' }}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
        </div>
      </section>

      {/* 7. Interactive Trust Badges */}
      <section className="glass-panel rounded-3xl py-8 px-6 grid grid-cols-2 md:grid-cols-4 gap-8 divide-y md:divide-y-0 md:divide-x divide-white/10 text-center">
        <div className="px-4 space-y-2">
          <div className="text-primary flex justify-center"><ShieldCheck size={40} /></div>
          <h4 className="font-extrabold text-white text-base">{t('home.genuine')}</h4>
          <p className="text-xs text-gray-400 leading-relaxed">{t('home.genuineDesc')}</p>
        </div>
        <div className="px-4 space-y-2 pt-6 md:pt-0">
          <div className="text-primary flex justify-center"><Truck size={40} /></div>
          <h4 className="font-extrabold text-white text-base">{t('home.fastDelivery')}</h4>
          <p className="text-xs text-gray-400 leading-relaxed">{t('home.fastDeliveryDesc')}</p>
        </div>
        <div className="px-4 space-y-2 pt-6 md:pt-0">
          <div className="text-primary flex justify-center"><CreditCard size={40} /></div>
          <h4 className="font-extrabold text-white text-base">{t('home.paymentMethod')}</h4>
          <p className="text-xs text-gray-400 leading-relaxed">{t('home.paymentMethodDesc')}</p>
        </div>
        <div className="px-4 space-y-2 pt-6 md:pt-0">
          <div className="text-primary flex justify-center"><Stethoscope size={40} /></div>
          <h4 className="font-extrabold text-white text-base">{t('home.pharmacists')}</h4>
          <p className="text-xs text-gray-400 leading-relaxed">{t('home.pharmacistsDesc')}</p>
        </div>
      </section>
    </div>
  );
};

export default Home;
