import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, FileText, MessageCircle, ShieldCheck, Truck, CreditCard, Stethoscope, ArrowRight, Activity, Heart, Eye, Beaker } from 'lucide-react';
import api from '../../services/api';
import ProductCard from '../../components/product/ProductCard';
import Loading from '../../components/common/Loading';
import { useLanguage } from '../../context/LanguageContext';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [prescriptionMeds, setPrescriptionMeds] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { language, t } = useLanguage();

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [productsRes, bannersRes] = await Promise.all([
          api.get('/products?limit=20').catch(() => ({ data: [] })),
          api.get('/banners').catch(() => ({ data: { banners: [] } }))
        ]);
        
        const items = productsRes.data?.data || productsRes.data || [];
        setFeaturedProducts(items.slice(0, 8));
        setBestSellers(items.slice(8, 14));
        setPrescriptionMeds(items.slice(14, 20));
        
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
    { id: 1, name: t('nav.otc'), icon: '💊', slug: 'otc' },
    { id: 2, name: t('nav.women'), icon: '👩', slug: 'women-care' },
    { id: 3, name: t('nav.baby'), icon: '👶', slug: 'baby-care' },
    { id: 4, name: language === 'en' ? 'Personal Care' : 'পার্সোনাল কেয়ার', icon: '🧴', slug: 'personal-care' },
    { id: 5, name: language === 'en' ? 'Vitamins' : 'ভিটামিন', icon: '⚡', slug: 'vitamins' },
    { id: 6, name: t('nav.devices'), icon: '🩺', slug: 'devices' }
  ];

  const concerns = [
    { id: 1, name: language === 'en' ? 'Fever & Pain' : 'জ্বর ও ব্যথা', icon: <Activity size={24} />, slug: 'fever-pain' },
    { id: 2, name: language === 'en' ? 'Heart Health' : 'হৃদরোগের স্বাস্থ্য', icon: <Heart size={24} />, slug: 'heart-health' },
    { id: 3, name: language === 'en' ? 'Eye Care' : 'চোখের যত্ন', icon: <Eye size={24} />, slug: 'eye-care' },
    { id: 4, name: language === 'en' ? 'Stomach Care' : 'পেটের সমস্যা', icon: <Beaker size={24} />, slug: 'stomach' },
  ];

  return (
    <div className="space-y-16 pb-20 font-sans">
      
      {/* 1. Hero Search Section */}
      <section className="relative rounded-3xl overflow-hidden glass-card p-8 md:p-16 bg-hero-gradient">
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-dark tracking-tight leading-tight">
            {language === 'en' ? 'Trusted Healthcare,' : 'বিশ্বস্ত স্বাস্থ্যসেবা,'} <br />
            <span className="text-primary">{language === 'en' ? 'Delivered Fast.' : 'দ্রুত ডেলিভারি।'}</span>
          </h1>
          <p className="text-lg mb-10 text-muted font-medium">
            {t('home.heroSubtitle')}
          </p>
          
          <form 
            onSubmit={handleSearch}
            className="glass-panel p-2 rounded-2xl flex max-w-2xl mx-auto mb-6 focus-within:ring-2 ring-primary/20 transition-all duration-300 shadow-soft"
          >
            <input 
              type="text" 
              placeholder={t('common.searchPlaceholder')} 
              className="flex-1 px-6 bg-transparent text-dark focus:outline-none placeholder-muted text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="bg-primary text-white font-bold px-8 py-3 rounded-xl hover:bg-primary-dark transition-colors shadow-soft flex items-center gap-2">
              <Search size={20} />
              {t('common.search')}
            </button>
          </form>
          <p className="text-sm text-muted font-medium">
            {language === 'en' ? 'Popular' : 'জনপ্রিয়'}: <span className="text-primary cursor-pointer hover:underline">Napa</span>, <span className="text-primary cursor-pointer hover:underline">Sergel</span>, <span className="text-primary cursor-pointer hover:underline">Vitamins</span>
          </p>
        </div>
      </section>

      {/* 1.5 Dynamic Banners */}
      {banners.length > 0 && (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners.map((banner, index) => (
            <a 
              key={banner.id || index} 
              href={banner.link || '#'} 
              className="block rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative group"
            >
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors z-10 rounded-2xl"></div>
              <img 
                src={banner.imageUrl} 
                alt={banner.title} 
                className="w-full h-48 object-cover transform group-hover:scale-105 transition-transform duration-500"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <div className="absolute bottom-4 left-4 z-20">
                <h3 className="text-white font-bold text-lg drop-shadow-md">{banner.title}</h3>
              </div>
            </a>
          ))}
        </section>
      )}

      {/* 2 & 3. Upload Prescription & WhatsApp CTAs */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <motion.div 
          whileHover={{ translateY: -4 }}
          className="glass-card rounded-2xl p-8 flex items-center gap-6 group border border-primary/10"
        >
          <div className="p-4 bg-primary/10 rounded-full text-primary">
            <FileText size={40} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-dark mb-2">{t('home.orderPrescription')}</h3>
            <p className="text-muted mb-4 text-sm">{t('home.orderPrescriptionDesc')}</p>
            <Link to="/search" className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-primary-dark transition-colors inline-block">
              {t('common.findMedicine')}
            </Link>
          </div>
        </motion.div>
        
        <motion.div 
          whileHover={{ translateY: -4 }}
          className="glass-card rounded-2xl p-8 flex items-center gap-6 group border border-[#25D366]/10"
        >
          <div className="p-4 bg-[#25D366]/10 rounded-full text-[#25D366]">
            <MessageCircle size={40} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-dark mb-2">{t('home.orderWhatsApp')}</h3>
            <p className="text-muted mb-4 text-sm">{t('home.orderWhatsAppDesc')}</p>
            <a href="https://wa.me/8801602444532" target="_blank" rel="noreferrer" className="bg-[#25D366] text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-[#1DA851] transition-colors inline-block">
              {t('home.chatWhatsApp')}
            </a>
          </div>
        </motion.div>
      </section>

      {/* 4 & 5. Shop by Category & Shop by Concern */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div>
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-2xl font-bold text-dark">{t('home.shopCategory')}</h2>
            <Link to="/shop" className="text-secondary font-bold hover:underline text-sm flex items-center gap-1">{t('home.viewAll')} <ArrowRight size={16} /></Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {categories.map(cat => (
              <Link key={cat.id} to={`/category/${cat.slug}`} className="glass-card rounded-xl p-4 flex flex-col items-center justify-center gap-3 hover:border-primary transition-all text-center">
                <span className="text-4xl">{cat.icon}</span>
                <span className="font-bold text-dark text-sm">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-2xl font-bold text-dark">{t('home.shopConcern')}</h2>
            <Link to="/shop" className="text-secondary font-bold hover:underline text-sm flex items-center gap-1">{t('home.viewAll')} <ArrowRight size={16} /></Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {concerns.map(con => (
              <Link key={con.id} to={`/search?q=${encodeURIComponent(con.name)}`} className="glass-card rounded-xl p-4 flex items-center gap-4 hover:border-secondary transition-all">
                <div className="p-3 bg-secondary/10 text-secondary rounded-lg">{con.icon}</div>
                <span className="font-bold text-dark text-sm">{con.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex justify-center py-10"><Loading /></div>
      ) : (
        <>
          {/* 6. Top Featured Medicines */}
          {featuredProducts.length > 0 && (
            <section>
              <div className="flex justify-between items-end mb-6">
                <h2 className="text-2xl font-bold text-dark">{t('home.featured')}</h2>
                <Link to="/shop?sort=featured" className="text-secondary font-bold hover:underline text-sm flex items-center gap-1">{t('home.viewMore')} <ArrowRight size={16} /></Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-6">
                {featuredProducts.map((product) => (
                  <ProductCard key={product.id || product._id} product={product} />
                ))}
              </div>
            </section>
          )}

          {/* 7. Best Sellers */}
          {bestSellers.length > 0 && (
            <section className="bg-primary/5 rounded-3xl p-8 border border-primary/10">
              <div className="flex justify-between items-end mb-6">
                <h2 className="text-2xl font-bold text-dark">{t('home.bestSellers')}</h2>
                <Link to="/shop?sort=bestseller" className="text-secondary font-bold hover:underline text-sm flex items-center gap-1">{t('home.viewMore')} <ArrowRight size={16} /></Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                {bestSellers.map((product) => (
                  <ProductCard key={product.id || product._id} product={product} />
                ))}
              </div>
            </section>
          )}

          {/* 8. Prescription Medicines */}
          {prescriptionMeds.length > 0 && (
            <section>
              <div className="flex justify-between items-end mb-6">
                <h2 className="text-2xl font-bold text-dark">{t('home.prescriptionMeds')}</h2>
                <Link to="/shop?type=prescription" className="text-secondary font-bold hover:underline text-sm flex items-center gap-1">{t('home.viewMore')} <ArrowRight size={16} /></Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                {prescriptionMeds.map((product) => (
                  <ProductCard key={product.id || product._id} product={product} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* 9 & 10. Support CTAs */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gradient-to-r from-trust/10 to-trust/5 rounded-2xl p-8 border border-trust/20">
          <h3 className="text-2xl font-bold text-dark mb-4">{t('home.helpTitle')}</h3>
          <p className="text-muted mb-6 text-sm">{t('home.helpDesc')}</p>
          <Link to="/search" className="bg-trust text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors inline-block">
            {t('common.findMedicine')}
          </Link>
        </div>
        <div className="bg-gradient-to-r from-offer/10 to-offer/5 rounded-2xl p-8 border border-offer/20">
          <h3 className="text-2xl font-bold text-dark mb-4">{t('home.manualPaymentTitle')}</h3>
          <p className="text-muted mb-6 text-sm">{t('home.manualPaymentDesc')}</p>
          <Link to="/checkout" className="bg-offer text-white px-6 py-3 rounded-lg font-bold hover:bg-yellow-600 transition-colors inline-block">
            {t('home.goCheckout')}
          </Link>
        </div>
      </section>

      {/* 11. Trust Badges */}
      <section className="glass-panel rounded-2xl py-8 px-4 grid grid-cols-2 md:grid-cols-4 gap-6 divide-x divide-gray-200 text-center">
        <div className="px-4">
          <div className="text-primary mb-3 flex justify-center"><ShieldCheck size={36} /></div>
          <h4 className="font-bold text-dark text-sm">{t('home.genuine')}</h4>
          <p className="text-xs text-muted mt-1">{t('home.genuineDesc')}</p>
        </div>
        <div className="px-4">
          <div className="text-primary mb-3 flex justify-center"><Truck size={36} /></div>
          <h4 className="font-bold text-dark text-sm">{t('home.fastDelivery')}</h4>
          <p className="text-xs text-muted mt-1">{t('home.fastDeliveryDesc')}</p>
        </div>
        <div className="px-4">
          <div className="text-primary mb-3 flex justify-center"><CreditCard size={36} /></div>
          <h4 className="font-bold text-dark text-sm">{t('home.paymentMethod')}</h4>
          <p className="text-xs text-muted mt-1">{t('home.paymentMethodDesc')}</p>
        </div>
        <div className="px-4">
          <div className="text-primary mb-3 flex justify-center"><Stethoscope size={36} /></div>
          <h4 className="font-bold text-dark text-sm">{t('home.pharmacists')}</h4>
          <p className="text-xs text-muted mt-1">{t('home.pharmacistsDesc')}</p>
        </div>
      </section>
    </div>
  );
};

export default Home;
