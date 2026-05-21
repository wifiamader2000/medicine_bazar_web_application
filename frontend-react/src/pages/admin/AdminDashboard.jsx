import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { unwrapData } from '../../utils/apiData';
import AdminStatGrid from '../../components/admin/AdminStatGrid';
import AdminChartCard from '../../components/admin/AdminChartCard';
import AdminTaskCenter from '../../components/admin/AdminTaskCenter';
import Button from '../../components/common/Button';
import { Plus, Upload, PlayCircle, BarChart3, Receipt, FileDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then((response) => setStats(unwrapData(response)))
      .catch((err) => setError(err.response?.data?.message || 'Dashboard could not be loaded.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-alert/10 text-alert p-4 rounded-xl font-medium">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Command Center</h1>
          <p className="text-sm text-gray-500">Welcome back. Here's what's happening today.</p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto">
          <Button size="sm" onClick={() => navigate('/admin/products')} className="whitespace-nowrap flex gap-2"><Plus size={16} /> Add Product</Button>
          <Button size="sm" variant="outline" onClick={() => navigate('/admin/import')} className="whitespace-nowrap flex gap-2"><Upload size={16} /> Import</Button>
          <Button size="sm" variant="outline" onClick={() => navigate('/pos')} className="whitespace-nowrap flex gap-2 bg-primary/10 text-primary-dark border-primary/20"><PlayCircle size={16} /> Open POS</Button>
        </div>
      </div>

      {/* Stats Grid */}
      <AdminStatGrid stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts */}
        <div className="lg:col-span-2 space-y-6">
          <AdminChartCard 
            title="Sales Overview (Last 7 Days)" 
            type="bar" 
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Quick Links */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Links</h2>
              <div className="grid grid-cols-2 gap-3">
                <button className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-primary/5 hover:text-primary transition-colors text-gray-600 border border-gray-100">
                  <BarChart3 size={24} className="mb-2" />
                  <span className="text-sm font-medium">View Reports</span>
                </button>
                <button className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-primary/5 hover:text-primary transition-colors text-gray-600 border border-gray-100">
                  <Receipt size={24} className="mb-2" />
                  <span className="text-sm font-medium">Verify Payments</span>
                </button>
                <button className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-primary/5 hover:text-primary transition-colors text-gray-600 border border-gray-100">
                  <Upload size={24} className="mb-2" />
                  <span className="text-sm font-medium">Upload Banner</span>
                </button>
                <button className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-primary/5 hover:text-primary transition-colors text-gray-600 border border-gray-100">
                  <FileDown size={24} className="mb-2" />
                  <span className="text-sm font-medium">Export Data</span>
                </button>
              </div>
            </div>

            {/* Storage Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-lg font-bold text-gray-900 mb-4">System Status</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Database Storage</span>
                    <span className="font-medium">45%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Server Memory</span>
                    <span className="font-medium">62%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '62%' }}></div>
                  </div>
                </div>
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-50 text-green-700 text-xs font-medium border border-green-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    All systems operational
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Tasks */}
        <div className="lg:col-span-1">
          <AdminTaskCenter stats={stats} />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
