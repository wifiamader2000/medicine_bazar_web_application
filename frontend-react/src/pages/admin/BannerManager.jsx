import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/common/Button';

const BannerManager = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    imageUrl: '',
    link: '',
    position: 0,
    active: true
  });

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const res = await api.get('/banners/all');
      setBanners(res.data?.banners || []);
    } catch (err) {
      setError('Failed to fetch banners.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const openModal = (banner = null) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        title: banner.title || '',
        imageUrl: banner.imageUrl || '',
        link: banner.link || '',
        position: banner.position || 0,
        active: banner.active !== false
      });
    } else {
      setEditingBanner(null);
      setFormData({ title: '', imageUrl: '', link: '', position: 0, active: true });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBanner(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBanner) {
        await api.put(`/banners/${editingBanner.id || editingBanner._id}`, formData);
      } else {
        await api.post('/banners', formData);
      }
      closeModal();
      fetchBanners();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this banner?')) {
      try {
        await api.delete(`/banners/${id}`);
        fetchBanners();
      } catch (err) {
        setError('Failed to delete banner');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Banner Manager</h1>
          <p className="text-sm text-gray-500 mt-1">Manage homepage slider banners</p>
        </div>
        <Button onClick={() => openModal()} className="flex items-center gap-2">
          <Plus size={18} /> Add Banner
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm font-medium border border-red-100">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners.map((banner) => (
            <div key={banner.id || banner._id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
              <div className="h-40 bg-gray-100 relative group">
                <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display='none'; }} />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-2">
                    <button onClick={() => openModal(banner)} className="p-2 bg-white rounded-full text-blue-600 hover:bg-blue-50 transition-colors">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(banner.id || banner._id)} className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-900 line-clamp-1" title={banner.title}>{banner.title}</h3>
                  {banner.active ? <CheckCircle size={18} className="text-green-500 flex-shrink-0" /> : <XCircle size={18} className="text-red-500 flex-shrink-0" />}
                </div>
                <p className="text-xs text-gray-500 break-all mb-4">{banner.link || 'No link'}</p>
                <div className="mt-auto text-xs font-medium bg-gray-100 text-gray-600 self-start px-2 py-1 rounded">
                  Pos: {banner.position}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">{editingBanner ? 'Edit Banner' : 'New Banner'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input required type="url" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Link (Optional)</label>
                <input type="text" value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                  <input type="number" value={formData.position} onChange={e => setFormData({...formData, position: parseInt(e.target.value) || 0})} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.active} onChange={e => setFormData({...formData, active: e.target.checked})} className="w-4 h-4 rounded text-primary focus:ring-primary" />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </label>
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <Button type="button" variant="outline" onClick={closeModal} className="flex-1">Cancel</Button>
                <Button type="submit" className="flex-1">Save Banner</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BannerManager;
