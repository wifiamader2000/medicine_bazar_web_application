import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import CustomerLayout from './layouts/CustomerLayout';
import AdminLayout from './layouts/AdminLayout';
import POSLayout from './layouts/POSLayout';

// Public Pages
import Home from './pages/public/Home';
import Shop from './pages/public/Shop';
import Search from './pages/public/Search';
import ProductDetail from './pages/public/ProductDetail';
import Category from './pages/public/Category';
import Brand from './pages/public/Brand';
import Checkout from './pages/public/Checkout';
import NotFound from './pages/public/NotFound';

// Auth Pages
import Login from './pages/auth/Login';

// Customer Pages
import Dashboard from './pages/customer/Dashboard';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ProductsManager from './pages/admin/ProductsManager';
import ProductImport from './pages/admin/ProductImport';
import ERPDashboard from './pages/admin/ERPDashboard';
import BannerManager from './pages/admin/BannerManager';
import InventoryManager from './pages/admin/InventoryManager';

import Settings from './pages/admin/Settings';

// POS Page
import POSPage from './pages/pos/POSPage';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/search" element={<Search />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/category/:slug" element={<Category />} />
          <Route path="/brand/:slug" element={<Brand />} />
          <Route path="/checkout" element={<Checkout />} />
          
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Customer Protected Routes */}
        <Route path="/account" element={<CustomerLayout />}>
          <Route index element={<Dashboard />} />
        </Route>

        {/* Admin Protected Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<ProductsManager />} />
          <Route path="import" element={<ProductImport />} />
          <Route path="erp" element={<ERPDashboard />} />
          <Route path="banners" element={<BannerManager />} />
          <Route path="inventory" element={<InventoryManager />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* POS Route */}
        <Route path="/pos" element={<POSLayout />}>
          <Route index element={<POSPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
