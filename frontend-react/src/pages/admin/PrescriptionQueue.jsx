import React, { useEffect, useState } from 'react';
import { 
  FileText, Search, Plus, Trash2, CheckCircle2, XCircle, 
  ZoomIn, ZoomOut, RotateCcw, User, Phone, FileQuestion, ShoppingBag
} from 'lucide-react';
import api from '../../services/api';
import { unwrapData, formatPrice } from '../../utils/apiData';
import { getStoredUser } from '../../utils/auth';
import { useLanguage } from '../../context/LanguageContext';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';

const PrescriptionQueue = () => {
  const { language } = useLanguage();
  const { token } = getStoredUser();

  // State
  const [queue, setQueue] = useState([]);
  const [selectedRx, setSelectedRx] = useState(null);
  const [selectedRxBlobUrl, setSelectedRxBlobUrl] = useState('');
  const [rxLoading, setRxLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [zoomScale, setZoomScale] = useState(1);
  const [pharmacistNote, setPharmacistNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [linkedOrder, setLinkedOrder] = useState(null);

  // Search & Cart Builder State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [draftCart, setDraftCart] = useState([]);
  const [discountPercent, setDiscountPercent] = useState(0);

  // Fetch queue
  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/prescriptions/queue?status=${statusFilter}`);
      const data = unwrapData(res, []);
      setQueue(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [statusFilter]);

  // Fetch prescription image blob securely
  useEffect(() => {
    if (!selectedRx) {
      setSelectedRxBlobUrl('');
      return;
    }

    setRxLoading(true);
    // Fetch blob with authorization header
    fetch(`/api/v1/prescriptions/view/${selectedRx.id || selectedRx._id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch file');
        return response.blob();
      })
      .then(blob => {
        const objectUrl = URL.createObjectURL(blob);
        setSelectedRxBlobUrl(objectUrl);
        setRxLoading(false);
      })
      .catch(err => {
        console.error('Error loading prescription secure image:', err);
        setRxLoading(false);
      });

    // Check if there is an existing linked order in database
    api.get('/orders')
      .then(res => {
        const allOrders = unwrapData(res, []);
        const matched = allOrders.find(o => o.prescriptionId === (selectedRx.id || selectedRx._id));
        setLinkedOrder(matched || null);
        if (matched) {
          // prefill draft cart with items from original order
          setDraftCart(matched.items.map(item => ({
            productId: item.productId,
            name: item.name,
            nameBn: item.nameBn,
            price: item.price,
            quantity: item.quantity,
            mrp: item.mrp || item.price
          })));
        } else {
          setDraftCart([]);
        }
      })
      .catch(err => console.error('Error loading linked orders:', err));

    setPharmacistNote(selectedRx.pharmacistNote || '');
    setZoomScale(1);

  }, [selectedRx, token]);

  // Search product API
  const handleProductSearch = async (val) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await api.get(`/products?search=${encodeURIComponent(val)}`);
      setSearchResults(unwrapData(res, []));
    } catch (err) {
      console.error(err);
    }
  };

  const addToDraftCart = (prod) => {
    const exists = draftCart.find(item => item.productId === (prod.id || prod._id));
    if (exists) {
      setDraftCart(draftCart.map(item => item.productId === (prod.id || prod._id) 
        ? { ...item, quantity: item.quantity + 1 } 
        : item
      ));
    } else {
      setDraftCart([...draftCart, {
        productId: prod.id || prod._id,
        name: prod.name,
        nameBn: prod.nameBn,
        price: prod.sellingPrice || prod.mrp || 0,
        quantity: 1,
        mrp: prod.mrp || prod.sellingPrice || 0
      }]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const updateDraftQty = (productId, delta) => {
    setDraftCart(draftCart.map(item => item.productId === productId
      ? { ...item, quantity: Math.max(1, item.quantity + delta) }
      : item
    ));
  };

  const removeDraftItem = (productId) => {
    setDraftCart(draftCart.filter(item => item.productId !== productId));
  };

  const subtotal = draftCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const totalAmount = subtotal - discountAmount;

  // Process manual pharmacist approval decision
  const handleReview = async (newStatus) => {
    if (!selectedRx) return;
    try {
      setLoading(true);
      await api.put(`/prescriptions/${selectedRx.id || selectedRx._id}/review`, {
        status: newStatus,
        pharmacistNote
      });

      // If linked order exists, update its status accordingly or keep it pending
      if (linkedOrder && newStatus === 'completed') {
        await api.put(`/orders/${linkedOrder.id || linkedOrder._id}/status`, {
          orderStatus: 'processing',
          note: `Prescription approved by pharmacist. Note: ${pharmacistNote}`
        });
      }

      setSelectedRx(null);
      fetchQueue();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4">
      {/* Visual Stats Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <FileText className="text-primary" size={28} />
            {language === 'en' ? 'Prescription Verification Queue' : 'প্রেসক্রিপশন ভেরিফিকেশন কিউ'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {language === 'en' 
              ? 'Human Pharmacist Vetting Desk — Inspect Rx requests and match drafts.' 
              : 'হিউম্যান ফার্মাসিস্ট যাচাইকরণ ডেস্ক — প্রেসক্রিপশন নিরীক্ষা এবং ড্রাফট অর্ডার করুন।'}
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
          {['pending', 'completed', 'rejected', 'clarification'].map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setSelectedRx(null);
              }}
              className={`px-4 py-2 rounded-lg font-bold text-xs uppercase transition-all ${
                statusFilter === status 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {status === 'pending' ? (language === 'en' ? 'Pending Audit' : 'অপেক্ষমান') : 
               status === 'completed' ? (language === 'en' ? 'Verified' : 'যাচাইকৃত') : 
               status === 'clarification' ? (language === 'en' ? 'Clarify Needed' : 'স্পষ্টীকরণ') : 
               (language === 'en' ? 'Rejected' : 'প্রত্যাখ্যাত')}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Left sidebar queue, right inspection block */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Queue List Sidebar (3 cols) */}
        <div className="lg:col-span-3 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm h-[75vh] overflow-y-auto space-y-3">
          <h2 className="text-sm font-bold text-gray-400 block uppercase tracking-wider mb-2">
            {language === 'en' ? `Inbox (${queue.length})` : `ইনবক্স (${queue.length})`}
          </h2>
          {queue.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FileQuestion size={36} className="mx-auto mb-2 opacity-50" />
              <p className="text-xs font-semibold">
                {language === 'en' ? 'No items in queue' : 'কোনো প্রেসক্রিপশন নেই'}
              </p>
            </div>
          ) : (
            queue.map((rx) => (
              <div
                key={rx.id || rx._id}
                onClick={() => setSelectedRx(rx)}
                className={`p-4 rounded-xl border transition-all cursor-pointer text-left space-y-2 ${
                  selectedRx?.id === rx.id 
                    ? 'border-primary bg-primary/5 shadow-sm' 
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-bold text-gray-900 truncate max-w-[150px]">
                    {rx.patientName || rx.customerName}
                  </h4>
                  <Badge variant={rx.status === 'pending' ? 'warning' : rx.status === 'completed' ? 'success' : rx.status === 'clarification' ? 'info' : 'danger'} className="text-[10px] uppercase font-bold">
                    {rx.status}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500">
                  {new Date(rx.createdAt).toLocaleDateString(language === 'en' ? 'en-US' : 'bn-BD', {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
                {rx.note && (
                  <p className="text-[11px] text-gray-400 italic truncate mt-1">
                    "{rx.note}"
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Inspection Panel (9 cols) */}
        <div className="lg:col-span-9 space-y-6">
          {!selectedRx ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center shadow-sm h-[75vh] flex flex-col justify-center items-center">
              <div className="bg-primary/10 text-primary rounded-full p-4 mb-4">
                <FileText size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {language === 'en' ? 'Select Prescription to Inspect' : 'যাচাই করতে একটি প্রেসক্রিপশন সিলেক্ট করুন'}
              </h3>
              <p className="text-gray-500 max-w-sm text-sm">
                {language === 'en' 
                  ? 'Select a prescription file from the inbox. View doctor details, check dosage forms, and compile safe order verification drafts.' 
                  : 'ইনবক্স থেকে একটি প্রেসক্রিপশন নির্বাচন করুন। ডাক্তারের বিবরণ দেখুন এবং নিরাপদ ড্রাফট অর্ডার করুন।'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[75vh]">
              
              {/* Prescription Image Zoom Block (Left side of inspector) */}
              <div className="bg-gray-950 rounded-2xl relative border border-gray-800 flex flex-col justify-between overflow-hidden">
                {/* Canvas controls */}
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                  <button 
                    onClick={() => setZoomScale(prev => Math.min(prev + 0.25, 3))}
                    className="bg-black/60 hover:bg-black/80 text-white p-2 rounded-lg transition-colors border border-white/10"
                    title="Zoom In"
                  >
                    <ZoomIn size={16} />
                  </button>
                  <button 
                    onClick={() => setZoomScale(prev => Math.max(prev - 0.25, 0.5))}
                    className="bg-black/60 hover:bg-black/80 text-white p-2 rounded-lg transition-colors border border-white/10"
                    title="Zoom Out"
                  >
                    <ZoomOut size={16} />
                  </button>
                  <button 
                    onClick={() => setZoomScale(1)}
                    className="bg-black/60 hover:bg-black/80 text-white p-2 rounded-lg transition-colors border border-white/10"
                    title="Reset Zoom"
                  >
                    <RotateCcw size={16} />
                  </button>
                </div>

                {/* Secure Image Container */}
                <div className="flex-1 flex items-center justify-center overflow-auto p-4 max-h-[60vh]">
                  {rxLoading ? (
                    <div className="text-white text-sm flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div>
                      <span>Loading secure file...</span>
                    </div>
                  ) : selectedRxBlobUrl ? (
                    selectedRx.mimeType === 'application/pdf' ? (
                      <iframe 
                        src={selectedRxBlobUrl} 
                        className="w-full h-full min-h-[50vh] rounded-lg"
                        title="Prescription PDF"
                      />
                    ) : (
                      <img 
                        src={selectedRxBlobUrl} 
                        alt="Prescription Upload" 
                        className="max-w-full max-h-full rounded transition-transform shadow-lg object-contain"
                        style={{ transform: `scale(${zoomScale})` }}
                      />
                    )
                  ) : (
                    <span className="text-gray-500 text-xs">No preview available</span>
                  )}
                </div>

                {/* Footer metadata */}
                <div className="bg-black/40 border-t border-white/10 p-4 flex justify-between items-center text-xs text-gray-400">
                  <span>MIME: {selectedRx.mimeType || 'image/jpeg'}</span>
                  <span>Size: {(selectedRx.fileSize / 1024).toFixed(1)} KB</span>
                </div>
              </div>

              {/* Patient Details & Draft Builder (Right side of inspector) */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between overflow-y-auto">
                <div className="space-y-6">
                  {/* Customer Info Section */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 flex justify-between items-center">
                      {language === 'en' ? 'Vetting Information' : 'যাচাইকরণের তথ্য'}
                      {linkedOrder && (
                        <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 border border-blue-200">
                          <ShoppingBag size={10} />
                          {linkedOrder.orderNumber}
                        </span>
                      )}
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-gray-400 font-bold block uppercase">{language === 'en' ? 'Patient Name' : 'রোগীর নাম'}</span>
                        <span className="font-semibold text-gray-800 flex items-center gap-1 mt-0.5">
                          <User size={12} className="text-gray-400" />
                          {selectedRx.patientName || selectedRx.customerName}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 font-bold block uppercase">{language === 'en' ? 'Phone Number' : 'ফোন নম্বর'}</span>
                        <span className="font-semibold text-gray-800 flex items-center gap-1 mt-0.5">
                          <Phone size={12} className="text-gray-400" />
                          {selectedRx.customerPhone || 'N/A'}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-400 font-bold block uppercase">{language === 'en' ? 'Customer Note' : 'গ্রাহকের নোট'}</span>
                        <p className="text-gray-600 bg-gray-50 p-2.5 rounded border border-gray-100 italic mt-1 font-medium">
                          "{selectedRx.note || (language === 'en' ? 'No upload remarks' : 'কোনো রিমার্ক নেই')}"
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Draft Order Compiler / Dispensation Builder */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider block">
                      {language === 'en' ? 'Verify Dispensation Items' : 'ওষুধ এবং ডোজ মেলাক'}
                    </h4>

                    {/* Live search input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-3.5 text-gray-400" size={16} />
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => handleProductSearch(e.target.value)}
                        placeholder={language === 'en' ? 'Search matching products...' : 'ওষুধ খুঁজুন...'} 
                        className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                      />

                      {/* Dropdown overlay */}
                      {searchResults.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                          {searchResults.map(prod => (
                            <div 
                              key={prod.id || prod._id} 
                              onClick={() => addToDraftCart(prod)}
                              className="p-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center text-xs border-b border-gray-100"
                            >
                              <div>
                                <span className="font-bold text-gray-800">{prod.name}</span>
                                <span className="text-gray-400 ml-2">({prod.genericName || prod.category})</span>
                              </div>
                              <span className="font-bold text-primary">{formatPrice(prod.sellingPrice || prod.mrp)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Draft List */}
                    <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1">
                      {draftCart.length === 0 ? (
                        <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl text-xs text-gray-400">
                          {language === 'en' ? 'No medicines mapped yet.' : 'এখনো কোনো ওষুধ ড্রাফটে যুক্ত হয়নি।'}
                        </div>
                      ) : (
                        draftCart.map(item => (
                          <div key={item.productId} className="flex justify-between items-center p-2.5 bg-gray-50 border border-gray-150 rounded-lg text-xs gap-3">
                            <div className="flex-1">
                              <p className="font-bold text-gray-800 truncate max-w-[160px]">
                                {language === 'en' ? item.name : (item.nameBn || item.name)}
                              </p>
                              <p className="text-[10px] text-gray-400 mt-0.5">{formatPrice(item.price)} each</p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <button onClick={() => updateDraftQty(item.productId, -1)} className="w-5 h-5 rounded bg-white border border-gray-300 flex items-center justify-center font-bold text-gray-600 hover:border-primary hover:text-primary transition-colors">-</button>
                              <span className="font-bold text-gray-900 w-4 text-center">{item.quantity}</span>
                              <button onClick={() => updateDraftQty(item.productId, 1)} className="w-5 h-5 rounded bg-white border border-gray-300 flex items-center justify-center font-bold text-gray-600 hover:border-primary hover:text-primary transition-colors">+</button>
                            </div>

                            <button onClick={() => removeDraftItem(item.productId)} className="text-red-500 hover:text-red-700 transition-colors p-1">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {draftCart.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-gray-100 text-xs text-gray-500">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span className="font-semibold text-gray-800">{formatPrice(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-gray-900 font-bold border-t border-gray-100 pt-1">
                          <span>Verified Total:</span>
                          <span className="text-primary">{formatPrice(totalAmount)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Note block */}
                  <div className="space-y-1.5 pt-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                      {language === 'en' ? 'Pharmacist Note' : 'ফার্মাসিস্ট নোট'}
                    </label>
                    <textarea
                      value={pharmacistNote}
                      onChange={(e) => setPharmacistNote(e.target.value)}
                      placeholder={language === 'en' ? 'Add clinical remarks, dose changes, or signature...' : 'ডোজ সম্পর্কিত নোট বা রিমার্ক যোগ করুন...'}
                      className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors h-16 resize-none"
                    />
                  </div>
                </div>

                {/* Final controls */}
                <div className="flex flex-wrap gap-2 pt-6 border-t border-gray-100">
                  <button
                    onClick={() => handleReview('rejected')}
                    disabled={loading}
                    className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 transition-colors border border-red-200 cursor-pointer"
                  >
                    <XCircle size={14} />
                    {language === 'en' ? 'Reject' : 'প্রত্যাখ্যান'}
                  </button>
                  <button
                    onClick={() => handleReview('clarification')}
                    disabled={loading}
                    className="flex-1 bg-amber-50 text-amber-600 hover:bg-amber-100 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 transition-colors border border-amber-200 cursor-pointer"
                  >
                    <FileQuestion size={14} />
                    {language === 'en' ? 'Clarify' : 'স্পষ্টীকরণ'}
                  </button>
                  <button
                    onClick={() => handleReview('completed')}
                    disabled={loading || draftCart.length === 0}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    <CheckCircle2 size={15} />
                    {language === 'en' ? 'Verify & Approve' : 'যাচাই ও অনুমোদন'}
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default PrescriptionQueue;
