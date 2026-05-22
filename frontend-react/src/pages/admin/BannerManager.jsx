import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, CheckCircle, XCircle, Layout, Eye, Calendar, ArrowRight, Image as ImageIcon } from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/common/Button';

const BannerManager = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [selectedPlacement, setSelectedPlacement] = useState('all');
  
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    titleBn: '',
    subtitleBn: '',
    imageUrl: '',
    mobileImageUrl: '',
    desktopImageUrl: '',
    type: 'hero',
    link: '',
    targetUrl: '',
    ctaText: '',
    ctaUrl: '',
    priority: 0,
    backgroundGradient: '',
    active: true,
    startDate: '',
    endDate: ''
  });

  const placements = [
    { value: 'all', label: 'All Placements' },
    { value: 'hero', label: 'Hero Slider' },
    { value: 'offer', label: 'Offer Strip' },
    { value: 'category', label: 'Category Page Banner' },
    { value: 'prescription', label: 'Prescription Upload Callout' },
    { value: 'lab-test', label: 'Lab Test Banner' },
    { value: 'payment', label: 'Payment Discount Strip' },
    { value: 'footer', label: 'Footer Banner' }
  ];

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
        subtitle: banner.subtitle || '',
        titleBn: banner.titleBn || '',
        subtitleBn: banner.subtitleBn || '',
        imageUrl: banner.imageUrl || '',
        mobileImageUrl: banner.mobileImageUrl || '',
        desktopImageUrl: banner.desktopImageUrl || '',
        type: banner.type || 'hero',
        link: banner.link || '',
        targetUrl: banner.targetUrl || '',
        ctaText: banner.ctaText || '',
        ctaUrl: banner.ctaUrl || '',
        priority: banner.priority || 0,
        backgroundGradient: banner.backgroundGradient || '',
        active: banner.active !== false,
        startDate: banner.startDate ? banner.startDate.substring(0, 10) : '',
        endDate: banner.endDate ? banner.endDate.substring(0, 10) : ''
      });
    } else {
      setEditingBanner(null);
      setFormData({
        title: '',
        subtitle: '',
        titleBn: '',
        subtitleBn: '',
        imageUrl: '',
        mobileImageUrl: '',
        desktopImageUrl: '',
        type: 'hero',
        link: '',
        targetUrl: '',
        ctaText: '',
        ctaUrl: '',
        priority: 0,
        backgroundGradient: 'linear-gradient(135deg, #0F9D76 0%, #075E54 100%)',
        active: true,
        startDate: '',
        endDate: ''
      });
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
    if (window.confirm('Are you sure you want to permanently delete this banner?')) {
      try {
        await api.delete(`/banners/${id}`);
        fetchBanners();
      } catch (err) {
        setError('Failed to delete banner');
      }
    }
  };

  const filteredBanners = selectedPlacement === 'all'
    ? banners
    : banners.filter(b => b.type === selectedPlacement);

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-teal-100 shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Layout className="text-primary" /> Dynamic Banner Manager
          </h1>
          <p className="text-sm text-gray-500 mt-1">Control advertisement and campaign banners dynamically across the storefront</p>
        </div>
        <Button onClick={() => openModal()} className="flex items-center gap-2 hover-lift pressable bg-primary text-white px-5 py-2.5 rounded-xl font-semibold">
          <Plus size={18} /> New Campaign Banner
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">&times;</button>
        </div>
      )}

      {/* Placement Tab Bar */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {placements.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setSelectedPlacement(tab.value)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
              selectedPlacement === tab.value
                ? 'bg-teal-50 text-teal-800 border-teal-300 shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-white rounded-2xl border border-gray-100 skeleton-shimmer" />
          ))}
        </div>
      ) : filteredBanners.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="text-gray-400" size={28} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No Banners Found</h3>
          <p className="text-gray-500 text-sm mt-1">Add banners to this placement slot to draw attention and boost sales.</p>
          <Button onClick={() => openModal()} className="mt-4 inline-flex items-center gap-2">
            <Plus size={16} /> Add First Banner
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBanners.map((banner) => (
            <div key={banner.id || banner._id} className="bg-white rounded-2xl border border-gray-200 hover:border-teal-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col group hover-lift">
              <div 
                className="h-44 bg-gray-100 relative overflow-hidden flex items-center justify-center"
                style={{ background: banner.backgroundGradient || undefined }}
              >
                {banner.imageUrl && !banner.backgroundGradient && (
                  <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                )}
                {banner.backgroundGradient && (
                  <div className="absolute inset-0 p-6 flex flex-col justify-center text-white bg-opacity-40">
                    <span className="text-xs uppercase tracking-wider font-bold opacity-80">{banner.subtitle || banner.subtitleBn}</span>
                    <h4 className="text-lg font-extrabold leading-tight mt-1">{banner.title || banner.titleBn}</h4>
                    {banner.ctaText && (
                      <span className="mt-3 text-xs bg-white/20 hover:bg-white/30 backdrop-blur-sm self-start px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all">
                        {banner.ctaText} <ArrowRight size={12} />
                      </span>
                    )}
                  </div>
                )}
                
                {/* Float Type Badge */}
                <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm border border-teal-100 text-teal-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase shadow-sm">
                  {banner.type}
                </div>

                {/* Edit overlay */}
                <div className="absolute inset-0 bg-teal-950/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="flex gap-3">
                    <button onClick={() => openModal(banner)} className="p-3 bg-white hover:bg-teal-50 rounded-xl text-teal-700 shadow-lg transition-all hover:scale-110 pressable">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleDelete(banner.id || banner._id)} className="p-3 bg-white hover:bg-red-50 rounded-xl text-red-600 shadow-lg transition-all hover:scale-110 pressable">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2 gap-2">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-1" title={banner.title}>{banner.title}</h3>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">{banner.titleBn || 'Bengali title not set'}</p>
                  </div>
                  {banner.active ? (
                    <span className="flex items-center gap-1 text-green-600 text-xs font-semibold bg-green-50 px-2.5 py-1 rounded-full">
                      <CheckCircle size={12} /> Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-gray-500 text-xs font-semibold bg-gray-50 px-2.5 py-1 rounded-full">
                      <XCircle size={12} /> Inactive
                    </span>
                  )}
                </div>

                {/* Date Limiters */}
                {(banner.startDate || banner.endDate) && (
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-500 my-2.5 bg-gray-50 p-2 rounded-lg">
                    <Calendar size={12} className="text-teal-600" />
                    <span>
                      {banner.startDate ? new Date(banner.startDate).toLocaleDateString() : 'Start'}
                      {' - '}
                      {banner.endDate ? new Date(banner.endDate).toLocaleDateString() : 'Forever'}
                    </span>
                  </div>
                )}

                <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-medium">Priority: <strong className="text-gray-700 font-bold">{banner.priority}</strong></span>
                  <span className="text-primary font-semibold break-all max-w-[150px] truncate" title={banner.ctaUrl || banner.targetUrl || banner.link}>
                    {banner.ctaUrl || banner.targetUrl || banner.link || 'Static'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden animate-soft-scale">
            <div className="px-6 py-4 border-b border-teal-50 flex justify-between items-center bg-teal-50/50">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{editingBanner ? 'Update Campaign Banner' : 'Create Custom Banner'}</h2>
                <p className="text-xs text-gray-500 mt-0.5">Define coordinates, visual overrides and localized texts</p>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto scrollbar-thin">
              
              {/* Bilingual Titles & Subtitles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-wide text-teal-800 border-b border-teal-100 pb-1">English Metadata</h3>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">English Title *</label>
                    <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-teal-100 focus:border-primary outline-none" placeholder="e.g. Up to 15% off on Diabetes" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">English Subtitle</label>
                    <input type="text" value={formData.subtitle} onChange={e => setFormData({...formData, subtitle: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-teal-100 focus:border-primary outline-none" placeholder="e.g. Certified insulin and devices" />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-wide text-amber-800 border-b border-amber-100 pb-1">Bangla Localization</h3>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Bangla Title</label>
                    <input type="text" value={formData.titleBn} onChange={e => setFormData({...formData, titleBn: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-teal-100 focus:border-primary outline-none" placeholder="যেমন: ডায়াবেটিস কেয়ারে ১৫% পর্যন্ত ছাড়" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Bangla Subtitle</label>
                    <input type="text" value={formData.subtitleBn} onChange={e => setFormData({...formData, subtitleBn: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-teal-100 focus:border-primary outline-none" placeholder="যেমন: সার্টিফাইড ইনসুলিন ও ডায়াবেটিক গিয়ার" />
                  </div>
                </div>
              </div>

              {/* Dynamic Placements & Priority */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Placement / Type</label>
                  <select 
                    value={formData.type} 
                    onChange={e => setFormData({...formData, type: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-teal-100 focus:border-primary outline-none bg-white"
                  >
                    {placements.filter(p => p.value !== 'all').map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Display Priority Weight</label>
                  <input type="number" value={formData.priority} onChange={e => setFormData({...formData, priority: parseInt(e.target.value) || 0})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-teal-100 focus:border-primary outline-none" />
                </div>
                <div className="flex items-end pb-3">
                  <label className="flex items-center gap-2 cursor-pointer select-none bg-gray-50 hover:bg-teal-50 px-4 py-2.5 rounded-xl border border-gray-200 hover:border-teal-200 w-full transition-all">
                    <input type="checkbox" checked={formData.active} onChange={e => setFormData({...formData, active: e.target.checked})} className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500" />
                    <span className="text-xs font-bold text-gray-700">Make Active Now</span>
                  </label>
                </div>
              </div>

              {/* Responsive Image URLs */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wide text-gray-700 border-b border-gray-100 pb-1 flex items-center gap-1.5">
                  <ImageIcon size={14} className="text-teal-600" /> Visual Assets Configuration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Primary Image URL *</label>
                    <input required type="url" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-teal-100 focus:border-primary outline-none" placeholder="https://..." />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Mobile Image URL (Optional)</label>
                    <input type="url" value={formData.mobileImageUrl} onChange={e => setFormData({...formData, mobileImageUrl: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-teal-100 focus:border-primary outline-none" placeholder="https://..." />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Desktop Image URL (Optional)</label>
                    <input type="url" value={formData.desktopImageUrl} onChange={e => setFormData({...formData, desktopImageUrl: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-teal-100 focus:border-primary outline-none" placeholder="https://..." />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Background Gradient CSS (Fallback)</label>
                    <input type="text" value={formData.backgroundGradient} onChange={e => setFormData({...formData, backgroundGradient: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-teal-100 focus:border-primary outline-none" placeholder="e.g. linear-gradient(135deg, #0F9D76 0%, #075E54 100%)" />
                  </div>
                </div>
              </div>

              {/* Target & Call to Action Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-teal-50/20 p-4 rounded-2xl border border-teal-50">
                <div>
                  <h4 className="text-xs font-bold text-teal-800 mb-2">Campaign Action Destination</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Target Link / Route *</label>
                      <input required type="text" value={formData.link || formData.targetUrl} onChange={e => setFormData({...formData, link: e.target.value, targetUrl: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-teal-100 focus:border-primary outline-none bg-white" placeholder="e.g. /shop?category=diabetes" />
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-800 mb-2">Call To Action (CTA) Buttons</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">CTA Label</label>
                      <input type="text" value={formData.ctaText} onChange={e => setFormData({...formData, ctaText: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-teal-100 focus:border-primary outline-none bg-white" placeholder="e.g. Order Now / কিনুন" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">CTA Link</label>
                      <input type="text" value={formData.ctaUrl} onChange={e => setFormData({...formData, ctaUrl: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-teal-100 focus:border-primary outline-none bg-white" placeholder="e.g. /shop?category=diabetes" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Date Limits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Start Date (Auto Publish)</label>
                  <input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-teal-100 focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">End Date (Auto Expire)</label>
                  <input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-teal-100 focus:border-primary outline-none" />
                </div>
              </div>

              {/* Real-time preview component */}
              <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50">
                <h4 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                  <Eye size={14} className="text-teal-600" /> Live Interactive Preview
                </h4>
                <div 
                  className="h-28 rounded-xl p-4 flex flex-col justify-center text-white relative overflow-hidden"
                  style={{ background: formData.backgroundGradient || 'linear-gradient(135deg, #0F9D76 0%, #075E54 100%)' }}
                >
                  {formData.imageUrl && !formData.backgroundGradient && (
                    <img src={formData.imageUrl} alt="preview" className="absolute inset-0 w-full h-full object-cover z-0" onError={(e) => { e.currentTarget.style.display='none'; }} />
                  )}
                  <div className="relative z-10">
                    <span className="text-[9px] uppercase tracking-wider font-bold opacity-90">{formData.subtitle || 'Subtitle / সাবটাইটেল'}</span>
                    <h5 className="text-sm font-extrabold leading-snug">{formData.title || 'Title / শিরোনাম'}</h5>
                    {formData.ctaText && (
                      <span className="mt-2 text-[9px] bg-white/20 backdrop-blur-sm self-start px-2 py-1 rounded flex items-center gap-1 font-bold w-max">
                        {formData.ctaText} <ArrowRight size={10} />
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3 border-t border-gray-100">
                <Button type="button" variant="outline" onClick={closeModal} className="flex-1 rounded-xl">Cancel</Button>
                <Button type="submit" className="flex-1 rounded-xl bg-primary text-white font-bold hover-lift pressable">Save Banner Campaign</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BannerManager;
