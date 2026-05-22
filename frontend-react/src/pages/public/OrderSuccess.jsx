import React from 'react';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, ClipboardCheck, Package, Truck, MessageSquare, ArrowRight, Printer, QrCode } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { formatPrice } from '../../utils/apiData';
import Button from '../../components/common/Button';

const OrderSuccess = () => {
  const { language, t } = useLanguage();
  const [searchParams] = useSearchParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const orderId = searchParams.get('id') || '';
  const order = state?.order || {};
  const prescriptionUploaded = state?.prescriptionUploaded || !!order.prescriptionId;

  const orderNumber = order.orderNumber || orderId;
  const totalAmount = order.total || 0;
  const items = order.items || [];

  // Formulate WhatsApp message with dynamic Order ID
  const whatsappNumber = '8801602444532';
  const whatsappText = encodeURIComponent(
    language === 'en'
      ? `Hello Medicine Bazar, I have completed my order. Order ID: ${orderNumber}. Please review my manual payment/prescription.`
      : `হ্যালো মেডিসিন বাজার, আমি আমার অর্ডারটি সম্পন্ন করেছি। অর্ডার আইডি: ${orderNumber}। অনুগ্রহ করে আমার পেমেন্ট ও প্রেসক্রিপশন রিভিউ করুন।`
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappText}`;

  const handlePrint = () => {
    window.print();
  };

  // Timeline Steps
  const steps = [
    {
      titleEn: 'Order Placed',
      titleBn: 'অর্ডার প্লেসড',
      descEn: 'Your order has been recorded in our system',
      descBn: 'আপনার অর্ডারটি আমাদের সিস্টেমে যুক্ত করা হয়েছে',
      status: 'completed',
      icon: CheckCircle,
    },
    {
      titleEn: 'Prescription Uploaded',
      titleBn: 'প্রেসক্রিপশন আপলোড সম্পন্ন',
      descEn: 'File successfully uploaded for review',
      descBn: 'রিভিউ এর জন্য প্রেসক্রিপশন ফাইল সফলভাবে আপলোড করা হয়েছে',
      status: prescriptionUploaded ? 'completed' : 'pending',
      icon: ClipboardCheck,
    },
    {
      titleEn: 'Pharmacist Review',
      titleBn: 'ফার্মাসিস্ট রিভিউ',
      descEn: 'Manual safety audit by registered pharmacist',
      descBn: 'রেজিস্টার্ড ফার্মাসিস্ট দ্বারা ম্যানুয়াল নিরাপত্তা যাচাইকরণ',
      status: 'active',
      icon: Clock,
    },
    {
      titleEn: 'Packaging',
      titleBn: 'প্যাকেজিং ও প্রস্তুতি',
      descEn: 'Secure packaging and batch verification',
      descBn: 'নিরাপদ প্যাকেজিং এবং ব্যাচ নম্বর যাচাইকরণ',
      status: 'pending',
      icon: Package,
    },
    {
      titleEn: 'On The Way',
      titleBn: 'ডেলিভারির জন্য রওনা',
      descEn: 'Handed over to our swift delivery agents',
      descBn: 'আমাদের দ্রুতগামী ডেলিভারি এজেন্টের কাছে হস্তান্তর করা হয়েছে',
      status: 'pending',
      icon: Truck,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      {/* Inject print-specific styling directly */}
      <style>{`
        @media print {
          body {
            background-color: white !important;
            background-image: none !important;
            color: #000 !important;
          }
          header, footer, nav, .print-hidden, button, a:not(.print-show) {
            display: none !important;
          }
          .print-area {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
        }
      `}</style>

      {/* Visual Header - Hidden during print */}
      <div className="text-center space-y-4 mb-12 print-hidden">
        <div className="inline-flex items-center justify-center bg-emerald-100 text-emerald-600 rounded-full p-4 mb-2 animate-bounce">
          <CheckCircle size={48} />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {language === 'en' ? 'Thank You for Your Order!' : 'আপনার অর্ডারের জন্য ধন্যবাদ!'}
        </h1>
        <p className="text-lg text-slate-600 max-w-xl mx-auto">
          {language === 'en'
            ? 'We have received your request. Medicine Bazar registered pharmacists are auditing your items for maximum safety.'
            : 'আমরা আপনার অর্ডারটি পেয়েছি। সর্বাধিক সুরক্ষার জন্য মেডিসিন বাজারের রেজিস্টার্ড ফার্মাসিস্টগণ আপনার ওষুধগুলো নিরীক্ষা করছেন।'}
        </p>
      </div>

      {/* Printable Invoice & Details Container */}
      <div className="print-area bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-8 mb-8">
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-emerald-500 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                MB
              </div>
              <span className="text-xl font-extrabold text-slate-800 tracking-tight">
                Medicine<span className="text-emerald-500">Bazar</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Digital Pharmacy Verification License</p>
            <p className="text-xs text-slate-400 font-medium">Hotline: 01602444532 | Support: support@medicinebazar.com</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Elegant SVG QR code for verification marker */}
            <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-lg p-1.5 flex items-center justify-center" title="Verify Order Receipt">
              <svg className="w-full h-full text-slate-800" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Outer bounds */}
                <rect x="5" y="5" width="25" height="25" stroke="currentColor" strokeWidth="6" rx="2" />
                <rect x="12.5" y="12.5" width="10" height="10" fill="currentColor" />
                
                <rect x="70" y="5" width="25" height="25" stroke="currentColor" strokeWidth="6" rx="2" />
                <rect x="77.5" y="12.5" width="10" height="10" fill="currentColor" />
                
                <rect x="5" y="70" width="25" height="25" stroke="currentColor" strokeWidth="6" rx="2" />
                <rect x="12.5" y="77.5" width="10" height="10" fill="currentColor" />
                
                {/* Random QR structures representation */}
                <rect x="40" y="5" width="10" height="10" fill="currentColor" />
                <rect x="55" y="15" width="10" height="10" fill="currentColor" />
                <rect x="45" y="35" width="15" height="5" fill="currentColor" />
                <rect x="70" y="40" width="10" height="15" fill="currentColor" />
                <rect x="35" y="55" width="20" height="10" fill="currentColor" />
                <rect x="65" y="65" width="10" height="10" fill="currentColor" />
                <rect x="80" y="80" width="15" height="15" fill="currentColor" />
                <rect x="45" y="80" width="15" height="10" fill="currentColor" />
                <rect x="80" y="55" width="10" height="10" fill="currentColor" />
                
                {/* Center dot */}
                <circle cx="50" cy="50" r="4" fill="#10B981" />
              </svg>
            </div>
            <div className="text-right sm:text-left">
              <span className="text-xs text-slate-400 block uppercase font-bold tracking-wider">Invoice Date</span>
              <span className="text-sm font-bold text-slate-800">{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-sm">
          <div>
            <span className="text-xs text-slate-400 block uppercase font-bold tracking-wider mb-1">Order Identifier</span>
            <span className="font-extrabold text-slate-800 text-base">{orderNumber}</span>
          </div>

          <div>
            <span className="text-xs text-slate-400 block uppercase font-bold tracking-wider mb-1">Billing Amount</span>
            <span className="font-extrabold text-emerald-600 text-lg">{formatPrice(totalAmount)}</span>
          </div>

          <div>
            <span className="text-xs text-slate-400 block uppercase font-bold tracking-wider mb-1">Payment Status</span>
            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded border ${
              order.paymentMethod === 'cod'
                ? 'bg-slate-100 text-slate-800 border-slate-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              {order.paymentMethod === 'cod' 
                ? (language === 'en' ? 'Cash On Delivery' : 'ক্যাশ অন ডেলিভারি')
                : (language === 'en' ? 'Pending MFS Verification' : 'পেমেন্ট যাচাইকরণ পেন্ডিং')}
            </span>
          </div>
        </div>

        {/* Customer Address Details */}
        {order.shippingAddress && (
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-sm">
            <h3 className="font-bold text-slate-800 mb-2">{language === 'en' ? 'Shipping Destination' : 'ডেলিভারি ঠিকানা'}</h3>
            <p className="font-semibold text-slate-700">{order.shippingAddress.name}</p>
            <p className="text-slate-600 mt-0.5">{order.shippingAddress.address}, {order.shippingAddress.city}</p>
            <p className="text-slate-500 mt-1 font-mono text-xs">Phone: {order.shippingAddress.phone}</p>
          </div>
        )}

        {/* Invoice Item List Table */}
        {items.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">
              {language === 'en' ? 'Prescribed Items List' : 'ওষুধের তালিকা'}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold text-xs uppercase">
                    <th className="py-2">Item Name / generic</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-right">Unit Price</th>
                    <th className="py-2 text-right">Total Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <tr key={idx} className="text-slate-700">
                      <td className="py-3">
                        <span className="font-bold block text-slate-800">{item.name || `Medicine SKU: ${item.productId}`}</span>
                        {item.genericName && <span className="text-xs text-slate-400 font-medium block mt-0.5">{item.genericName}</span>}
                      </td>
                      <td className="py-3 text-center font-semibold font-mono">{item.quantity}</td>
                      <td className="py-3 text-right font-medium">{formatPrice(item.price)}</td>
                      <td className="py-3 text-right font-bold text-slate-800">{formatPrice(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations summaries */}
            <div className="flex flex-col items-end pt-4 space-y-2 border-t border-slate-100">
              <div className="flex gap-8 text-xs text-slate-500 font-medium">
                <span>Subtotal:</span>
                <span className="w-24 text-right">{formatPrice(order.subtotal || totalAmount - (order.deliveryCharge || 0))}</span>
              </div>
              <div className="flex gap-8 text-xs text-slate-500 font-medium">
                <span>Delivery Charge:</span>
                <span className="w-24 text-right">{formatPrice(order.deliveryCharge || 0)}</span>
              </div>
              <div className="flex gap-8 text-sm font-extrabold text-slate-800 pt-2 border-t border-slate-200">
                <span>Grand Total:</span>
                <span className="w-24 text-right text-emerald-600">{formatPrice(totalAmount)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grid: Order Info & Visual Timeline - Hidden during print */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print-hidden">
        
        {/* Timeline Block */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-4">
            {language === 'en' ? 'Order Verification Timeline' : 'অর্ডার ভেরিফিকেশন টাইমলাইন'}
          </h2>
 
          <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-8 py-2">
            {steps.map((step, idx) => {
              const StepIcon = step.icon;
              const isCompleted = step.status === 'completed';
              const isActive = step.status === 'active';
 
              return (
                <div key={idx} className="relative">
                  {/* Visual Node */}
                  <span className={`absolute -left-10 top-0.5 rounded-full w-8 h-8 flex items-center justify-center ring-4 ring-white ${
                    isCompleted ? 'bg-emerald-500 text-white' :
                    isActive ? 'bg-amber-500 text-white animate-pulse' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <StepIcon size={16} />
                  </span>
 
                  <div className="space-y-1">
                    <h3 className={`text-base font-bold flex items-center gap-2 ${
                      isCompleted ? 'text-emerald-700' :
                      isActive ? 'text-amber-700' : 'text-slate-500'
                    }`}>
                      {language === 'en' ? step.titleEn : step.titleBn}
                      {isActive && (
                        <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded font-semibold animate-pulse">
                          {language === 'en' ? 'In Progress' : 'চলমান'}
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {language === 'en' ? step.descEn : step.descBn}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Invoice Actions Panel */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 flex flex-col justify-between print-hidden">
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 pb-2 border-b border-slate-100">
              {language === 'en' ? 'Actions Console' : 'একশন প্যানেল'}
            </h2>
            
            <p className="text-xs text-slate-500 font-medium">
              {language === 'en' 
                ? 'Print this digital invoice for safe dosage records, or confirm verification on WhatsApp.' 
                : 'ওষুধের মাত্রা রেকর্ডের জন্য এই ডিজিটাল রসিদটি প্রিন্ট করতে পারেন, অথবা সরাসরি হোয়াটসঅ্যাপে যোগাযোগ করুন।'}
            </p>
          </div>

          <div className="space-y-3 pt-6 border-t border-slate-100">
            {/* Print Receipt Button */}
            <button
              onClick={handlePrint}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md transform hover:-translate-y-0.5 cursor-pointer text-sm"
            >
              <Printer size={18} />
              {language === 'en' ? 'Print Clean Receipt' : 'রসিদ প্রিন্ট করুন'}
            </button>

            {/* WhatsApp Contact Button */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md transform hover:-translate-y-0.5 text-sm print-show"
            >
              <MessageSquare size={18} />
              {language === 'en' ? 'Confirm on WhatsApp' : 'হোয়াটসঅ্যাপে নিশ্চিত করুন'}
            </a>

            <button
              onClick={() => navigate('/shop')}
              className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-1 transition-colors border border-slate-200 text-sm cursor-pointer"
            >
              {language === 'en' ? 'Continue Shopping' : 'আরো কেনাকাটা করুন'}
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Safety Notice Block - Hidden during print */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mt-8 flex gap-4 items-start print-hidden">
        <Clock className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
        <div className="space-y-1">
          <h4 className="font-bold text-blue-900 text-sm">
            {language === 'en' ? 'MANDATORY SAFETY STANDARDS' : 'বাধ্যতামূলক নিরাপত্তা নীতিমালা'}
          </h4>
          <p className="text-xs text-blue-800 leading-relaxed font-medium">
            {language === 'en'
              ? 'As a certified digital pharmacy, Medicine Bazar never dispenses Rx-only medicines without full registered pharmacist authorization. Our team will verify your prescription details within 15-30 minutes. Orders lacking a valid prescription will be held or modified safely.'
              : 'একটি সার্টিফাইড ডিজিটাল ফার্মেসি হিসেবে, মেডিসিন বাজার রেজিস্টার্ড ফার্মাসিস্টের অনুমোদন ব্যতীত কোনো প্রেসক্রিপশন-অনলি ওষুধ সরবরাহ করে না। আমাদের টিম ১৫-৩০ মিনিটের মধ্যে আপনার প্রেসক্রিপশনটি যাচাই করবে। কোনো অবৈধ প্রেসক্রিপশন পাওয়া গেলে সংশ্লিষ্ট অর্ডারটি হোল্ড বা পরিবর্তন করা হবে।'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;

