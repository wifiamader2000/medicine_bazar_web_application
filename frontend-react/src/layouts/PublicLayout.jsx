import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Search, ShoppingCart, User, PhoneCall, Globe, Play } from 'lucide-react';

const PublicLayout = () => {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-background text-text selection:bg-primary/20">
      
      {/* Top Bar - Clean Medical Style */}
      <div className="bg-primary-dark text-white text-xs py-2 px-4 flex justify-between items-center z-50 relative">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex gap-4">
            <span className="flex items-center gap-1 font-medium"><PhoneCall size={12} /> 01602444532</span>
            <span className="hidden md:inline text-white/80">Hyper-fast Medicine Delivery in BD</span>
          </div>
          <div className="flex gap-4">
            <Link to="/account" className="hover:text-primary-light transition-colors">Track Order</Link>
            <Link to="/shop" className="hover:text-primary-light transition-colors">Shop</Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all duration-300">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-primary text-white rounded-lg flex items-center justify-center font-bold text-xl shadow-soft group-hover:scale-105 transition-transform">
              MB
            </div>
            <span className="text-2xl font-extrabold text-dark tracking-tight hidden sm:block">
              Medicine<span className="text-primary">Bazar</span>
            </span>
          </Link>

          <div className="flex-1 max-w-2xl hidden md:block px-8">
            <Link to="/search" className="w-full">
              <div className="relative group">
                <input 
                  type="text" 
                  placeholder="Search for medicines, health products..." 
                  className="w-full bg-background border border-gray-200 rounded-full py-2.5 pl-5 pr-12 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-text placeholder-muted transition-all"
                  readOnly
                />
                <button className="absolute right-1 top-1 bottom-1 bg-primary text-white rounded-full w-10 flex items-center justify-center hover:bg-primary-dark transition-colors">
                  <Search size={18} />
                </button>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/search" className="hidden lg:flex items-center gap-2 bg-primary/10 text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-lg text-sm font-bold transition-all border border-primary/20">
              Find Medicine
            </Link>
            <Link to="/checkout" className="relative p-2 text-dark hover:text-primary transition-colors">
              <ShoppingCart size={24} />
              <span className="absolute top-0 right-0 bg-alert text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                0
              </span>
            </Link>
            <Link to="/account" className="p-2 text-dark hover:text-primary transition-colors">
              <User size={24} />
            </Link>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 hidden md:block">
        <div className="container mx-auto px-4 py-3 flex items-center gap-8 text-sm font-bold text-dark">
          <Link to="/category/otc" className="hover:text-primary transition-colors uppercase tracking-wider">OTC Medicine</Link>
          <Link to="/category/women-care" className="hover:text-primary transition-colors uppercase tracking-wider">Women Care</Link>
          <Link to="/category/baby-care" className="hover:text-primary transition-colors uppercase tracking-wider">Baby Care</Link>
          <Link to="/category/devices" className="hover:text-primary transition-colors uppercase tracking-wider">Medical Devices</Link>
          <Link to="/shop?type=prescription" className="text-alert hover:text-alert/80 transition-colors uppercase tracking-wider flex items-center gap-1">
            Prescription Only
          </Link>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 bg-background">
        <div className="container mx-auto px-4 py-8">
          <Outlet />
        </div>
      </main>

      {/* Modern Medical Footer */}
      <footer className="bg-dark-surface border-t border-gray-800 pt-16 pb-8 text-sm relative overflow-hidden text-gray-300">
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            
            <div>
              <Link to="/" className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center font-bold shadow-soft">
                  MB
                </div>
                <span className="text-2xl font-extrabold text-white tracking-tight">
                  Medicine<span className="text-primary">Bazar</span>
                </span>
              </Link>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Your trusted digital pharmacy in Bangladesh. We deliver authentic medicines and healthcare products directly to your doorstep.
              </p>
              <div className="flex items-center gap-4">
                <a href="https://facebook.com/medicinebazar24" target="_blank" rel="noreferrer" className="p-2 bg-white/5 rounded-full hover:bg-trust hover:text-white transition-all">
                  <Globe size={20} />
                </a>
                <a href="https://www.youtube.com/@MedicineBazar24" target="_blank" rel="noreferrer" className="p-2 bg-white/5 rounded-full hover:bg-alert hover:text-white transition-all">
                  <Play size={20} />
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6 uppercase tracking-wider">Quick Links</h4>
              <ul className="space-y-3">
                <li><Link to="/shop" className="hover:text-primary transition-colors">Shop All Medicines</Link></li>
                <li><Link to="/search" className="hover:text-primary transition-colors">Find Medicine</Link></li>
                <li><Link to="/checkout" className="hover:text-primary transition-colors">Checkout</Link></li>
                <li><Link to="/account" className="hover:text-primary transition-colors">My Account</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6 uppercase tracking-wider">Customer Service</h4>
              <ul className="space-y-3">
                <li><Link to="/account" className="hover:text-primary transition-colors">Track Order</Link></li>
                <li><Link to="/shop" className="hover:text-primary transition-colors">Browse Products</Link></li>
                <li><Link to="/search" className="hover:text-primary transition-colors">Search Medicines</Link></li>
                <li><Link to="/checkout" className="hover:text-primary transition-colors">Checkout</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6 uppercase tracking-wider">Contact Us</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <PhoneCall size={16} className="mt-1 text-primary" />
                  <div>
                    <p>Hotline (24/7)</p>
                    <p className="font-bold text-white">01602444532</p>
                  </div>
                </li>
                <li>
                  <a href="https://wa.me/8801602444532" target="_blank" rel="noreferrer" className="text-[#25D366] font-bold hover:underline">
                    WhatsApp Support
                  </a>
                </li>
                <li>
                  <a href="https://whatsapp.com/channel/0029Vb8A8KwAYlUGFxSkXy01" target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    Join our WhatsApp Channel
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
            <p>&copy; {new Date().getFullYear()} Medicine Bazar. All rights reserved.</p>
            <div className="flex gap-4">
              <span>Secure Checkout</span>
              <span className="font-bold text-gray-400">bKash | Nagad | Upay</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
