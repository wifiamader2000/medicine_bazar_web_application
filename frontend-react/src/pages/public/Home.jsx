import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, FileText, MessageCircle, ShieldCheck, Truck, CreditCard, Stethoscope, ArrowRight, Activity, Heart, Eye, Beaker } from 'lucide-react';
import api from '../../services/api';
import ProductCard from '../../components/product/ProductCard';
import Loading from '../../components/common/Loading';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [prescriptionMeds, setPrescriptionMeds] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

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
    { id: 1, name: 'OTC Medicine', icon: '💊', slug: 'otc' },
    { id: 2, name: 'Women Care', icon: '👩', slug: 'women-care' },
    { id: 3, name: 'Baby Care', icon: '👶', slug: 'baby-care' },
    { id: 4, name: 'Personal Care', icon: '🧴', slug: 'personal-care' },
    { id: 5, name: 'Vitamins', icon: '⚡', slug: 'vitamins' },
    { id: 6, name: 'Devices', icon: '🩺', slug: 'devices' }
  ];

  const concerns = [
    { id: 1, name: 'Fever & Pain', icon: <Activity size={24} />, slug: 'fever-pain' },
    { id: 2, name: 'Heart Health', icon: <Heart size={24} />, slug: 'heart-health' },
    { id: 3, name: 'Eye Care', icon: <Eye size={24} />, slug: 'eye-care' },
    { id: 4, name: 'Stomach Care', icon: <Beaker size={24} />, slug: 'stomach' },
  ];

  return (
    <div className="space-y-16 pb-20 font-sans">
      
      {/* 1. Hero Search Section */}
      <section className="relative rounded-3xl overflow-hidden glass-card p-8 md:p-16 bg-hero-gradient">
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-dark tracking-tight">
            Trusted Healthcare, <br />
            <span className="text-primary">Delivered Fast.</span>
          </h1>
          <p className="text-lg mb-10 text-muted font-medium">
            Order authentic medicines, upload prescriptions, and book lab tests from the comfort of your home.
          </p>
          
          <form 
            onSubmit={handleSearch}
            className="glass-panel p-2 rounded-2xl flex max-w-2xl mx-auto mb-6 focus-within:ring-2 ring-primary/20 transition-all duration-300 shadow-soft"
          >
            <input 
              type="text" 
              placeholder="Search for medicines, symptoms, or brands..." 
              className="flex-1 px-6 bg-transparent text-dark focus:outline-none placeholder-muted text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="bg-primary text-white font-bold px-8 py-3 rounded-xl hover:bg-primary-dark transition-colors shadow-soft flex items-center gap-2">
              <Search size={20} />
              Search
            </button>
          </form>
          <p className="text-sm text-muted font-medium">
            Popular: <span className="text-primary cursor-pointer hover:underline">Napa</span>, <span className="text-primary cursor-pointer hover:underline">Sergel</span>, <span className="text-primary cursor-pointer hover:underline">Vitamins</span>
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
            <h3 className="text-xl font-bold text-dark mb-2">Order with Prescription</h3>
            <p className="text-muted mb-4 text-sm">Search prescription medicines and follow pharmacist verification before dispatch.</p>
            <Link to="/search" className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-primary-dark transition-colors inline-block">
              Find Medicine
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
            <h3 className="text-xl font-bold text-dark mb-2">Order via WhatsApp</h3>
            <p className="text-muted mb-4 text-sm">Send us your medicine list directly on WhatsApp anytime.</p>
            <a href="https://wa.me/8801602444532" target="_blank" rel="noreferrer" className="bg-[#25D366] text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-[#1DA851] transition-colors inline-block">
              Chat on WhatsApp
            </a>
          </div>
        </motion.div>
      </section>

      {/* 4 & 5. Shop by Category & Shop by Concern */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div>
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-2xl font-bold text-dark">Shop by Category</h2>
            <Link to="/shop" className="text-secondary font-bold hover:underline text-sm flex items-center gap-1">View All <ArrowRight size={16} /></Link>
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
            <h2 className="text-2xl font-bold text-dark">Shop by Concern</h2>
            <Link to="/shop" className="text-secondary font-bold hover:underline text-sm flex items-center gap-1">View All <ArrowRight size={16} /></Link>
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
                <h2 className="text-2xl font-bold text-dark">Top Featured Medicines</h2>
                <Link to="/shop?sort=featured" className="text-secondary font-bold hover:underline text-sm flex items-center gap-1">View More <ArrowRight size={16} /></Link>
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
                <h2 className="text-2xl font-bold text-dark">Best Sellers</h2>
                <Link to="/shop?sort=bestseller" className="text-secondary font-bold hover:underline text-sm flex items-center gap-1">View More <ArrowRight size={16} /></Link>
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
                <h2 className="text-2xl font-bold text-dark">Prescription Medicines</h2>
                <Link to="/shop?type=prescription" className="text-secondary font-bold hover:underline text-sm flex items-center gap-1">View More <ArrowRight size={16} /></Link>
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
          <h3 className="text-2xl font-bold text-dark mb-4">Need Help Finding Medicine?</h3>
          <p className="text-muted mb-6 text-sm">Search by medicine name, generic, category, or brand to find available products.</p>
          <Link to="/search" className="bg-trust text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors inline-block">
            Search Products
          </Link>
        </div>
        <div className="bg-gradient-to-r from-offer/10 to-offer/5 rounded-2xl p-8 border border-offer/20">
          <h3 className="text-2xl font-bold text-dark mb-4">Manual Payment Checkout</h3>
          <p className="text-muted mb-6 text-sm">Submit mobile banking transaction details for admin verification before order processing.</p>
          <Link to="/checkout" className="bg-offer text-white px-6 py-3 rounded-lg font-bold hover:bg-yellow-600 transition-colors inline-block">
            Go to Checkout
          </Link>
        </div>
      </section>

      {/* 11. Trust Badges */}
      <section className="glass-panel rounded-2xl py-8 px-4 grid grid-cols-2 md:grid-cols-4 gap-6 divide-x divide-gray-200 text-center">
        <div className="px-4">
          <div className="text-primary mb-3 flex justify-center"><ShieldCheck size={36} /></div>
          <h4 className="font-bold text-dark text-sm">100% Genuine</h4>
          <p className="text-xs text-muted mt-1">Authentic sourced medicines</p>
        </div>
        <div className="px-4">
          <div className="text-primary mb-3 flex justify-center"><Truck size={36} /></div>
          <h4 className="font-bold text-dark text-sm">Fast Delivery</h4>
          <p className="text-xs text-muted mt-1">Across all of Bangladesh</p>
        </div>
        <div className="px-4">
          <div className="text-primary mb-3 flex justify-center"><CreditCard size={36} /></div>
          <h4 className="font-bold text-dark text-sm">Manual Payment</h4>
          <p className="text-xs text-muted mt-1">bKash, Nagad, Upay & COD</p>
        </div>
        <div className="px-4">
          <div className="text-primary mb-3 flex justify-center"><Stethoscope size={36} /></div>
          <h4 className="font-bold text-dark text-sm">Expert Pharmacists</h4>
          <p className="text-xs text-muted mt-1">Verified prescriptions</p>
        </div>
      </section>
    </div>
  );
};

export default Home;
