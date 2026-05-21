import React, { useState, useEffect, useRef } from 'react';
import { Upload, Save, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import { unwrapData } from '../../utils/apiData';
import Button from '../../components/common/Button';

const Settings = () => {
  const [settings, setSettings] = useState({
    siteName: '',
    supportPhone: '',
    whatsapp: '',
    headerLogo: '',
    footerLogo: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fileInputRef = useRef(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/settings');
      setSettings(unwrapData(res, {}));
    } catch (err) {
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.put('/admin/settings', settings);
      setSettings(unwrapData(res, settings));
      setSuccessMsg('Settings saved successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingLogo(true);
    const formData = new FormData();
    formData.append('logo', file);
    formData.append('type', 'headerLogo');

    try {
      const res = await api.post('/admin/settings/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const data = unwrapData(res);
      setSettings(prev => ({ ...prev, headerLogo: data.url }));
      setSuccessMsg('Logo updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) return <div className="p-8">Loading settings...</div>;

  const logoUrl = settings.headerLogo || '/favicon.svg';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-sm text-gray-500">Manage branding, logo, and general configurations.</p>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">{error}</div>}
      {successMsg && (
        <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm border border-green-100 flex items-center gap-2">
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Branding & Logo */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Site Logo</h2>
            
            <div className="flex flex-col items-center justify-center p-6 bg-gray-50 border border-gray-100 rounded-lg mb-4">
              <img 
                src={logoUrl} 
                alt="Site Logo" 
                className="max-h-24 max-w-full object-contain mb-2"
                onError={(e) => { e.target.src = '/favicon.svg' }}
              />
              <span className="text-xs text-gray-500">Current Logo</span>
            </div>

            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleLogoUpload}
            />
            <Button 
              variant="outline" 
              fullWidth 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingLogo}
              className="flex justify-center gap-2"
            >
              {uploadingLogo ? 'Uploading...' : <><Upload size={16} /> Upload New Logo</>}
            </Button>
            <p className="text-xs text-gray-500 mt-3 text-center">Recommended size: 200x50px (PNG)</p>
          </div>
        </div>

        {/* General Settings */}
        <div className="md:col-span-2">
          <form onSubmit={handleSave} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">General Settings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Site Name</label>
                <input 
                  value={settings.siteName || ''} 
                  onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                  className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Support Phone</label>
                <input 
                  value={settings.supportPhone || ''} 
                  onChange={(e) => setSettings({...settings, supportPhone: e.target.value})}
                  className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">WhatsApp Number</label>
                <input 
                  value={settings.whatsapp || ''} 
                  onChange={(e) => setSettings({...settings, whatsapp: e.target.value})}
                  className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <Button type="submit" disabled={saving} className="flex gap-2 items-center">
                <Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
