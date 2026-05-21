import React from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Settings, LogOut, Package, Calculator, Image as ImageIcon, Box, FileText } from 'lucide-react';
import { getStoredUser, clearStoredAuth } from '../utils/auth';

const AdminLayout = () => {
  const { token, user } = getStoredUser();
  const location = useLocation();
  
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    clearStoredAuth();
    window.location.href = '/login';
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Accounting / ERP', path: '/admin/erp', icon: Calculator },
    { name: 'Prescription Queue', path: '/admin/prescriptions', icon: FileText },
    { name: 'Banners', path: '/admin/banners', icon: ImageIcon },
    { name: 'Inventory & POS', path: '/admin/inventory', icon: Box },
    { name: 'Mega Catalog', path: '/admin/products', icon: Package },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm z-10">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">MB</div>
          <h1 className="font-bold text-gray-900 tracking-tight">Admin System</h1>
        </div>
        
        <nav className="flex-1 p-4 flex flex-col gap-1.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
            return (
              <Link 
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-primary/10 text-primary-dark' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon size={18} className={isActive ? 'text-primary' : 'text-gray-400'} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary-dark font-bold border border-primary/20">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900 leading-tight">{user.name}</div>
                <div className="text-xs text-primary font-medium">{user.role}</div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm z-0">
          <h2 className="text-lg font-bold text-gray-800">
            {navItems.find(item => location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path)))?.name || 'Overview'}
          </h2>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-500 hover:text-alert hover:bg-red-50 px-3 py-1.5 rounded-md text-sm font-medium transition-colors border border-transparent hover:border-red-100"
          >
            <LogOut size={16} /> Logout
          </button>
        </header>
        
        <main className="flex-1 p-8 overflow-y-auto bg-gray-50/50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
