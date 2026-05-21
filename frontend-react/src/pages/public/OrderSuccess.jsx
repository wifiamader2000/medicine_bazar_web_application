import React from 'react';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, ClipboardCheck, Package, Truck, MessageSquare, ArrowRight } from 'lucide-react';
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

  // Formulate WhatsApp message with dynamic Order ID
  const whatsappNumber = '8801602444532';
  const whatsappText = encodeURIComponent(
    language === 'en'
      ? `Hello Medicine Bazar, I have completed my order. Order ID: ${orderNumber}. Please review my prescription.`
      : `হ্যালো মেডিসিন বাজার, আমি আমার অর্ডারটি সম্পন্ন করেছি। অর্ডার আইডি: ${orderNumber}। অনুগ্রহ করে আমার প্রেসক্রিপশনটি রিভিউ করুন।`
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappText}`;

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
      {/* Visual Header */}
      <div className="text-center space-y-4 mb-12">
        <div className="inline-flex items-center justify-center bg-emerald-100 text-emerald-600 rounded-full p-4 mb-2 animate-bounce">
          <CheckCircle size={48} />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
          {language === 'en' ? 'Thank You for Your Order!' : 'আপনার অর্ডারের জন্য ধন্যবাদ!'}
        </h1>
        <p className="text-lg text-gray-600 max-w-xl mx-auto">
          {language === 'en'
            ? 'We have received your request. Medicine Bazar registered pharmacists are auditing your items for maximum safety.'
            : 'আমরা আপনার অর্ডারটি পেয়েছি। সর্বাধিক সুরক্ষার জন্য মেডিসিন বাজারের রেজিস্টার্ড ফার্মাসিস্টগণ আপনার ওষুধগুলো নিরীক্ষা করছেন।'}
        </p>
      </div>

      {/* Grid: Order Info & Visual Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Timeline Block */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-4">
            {language === 'en' ? 'Order Verification Timeline' : 'অর্ডার ভেরিফিকেশন টাইমলাইন'}
          </h2>

          <div className="relative border-l-2 border-gray-200 ml-4 pl-6 space-y-8 py-2">
            {steps.map((step, idx) => {
              const StepIcon = step.icon;
              const isCompleted = step.status === 'completed';
              const isActive = step.status === 'active';

              return (
                <div key={idx} className="relative">
                  {/* Visual Node */}
                  <span className={`absolute -left-10 top-0.5 rounded-full w-8 h-8 flex items-center justify-center ring-4 ring-white ${
                    isCompleted ? 'bg-emerald-500 text-white' :
                    isActive ? 'bg-amber-500 text-white animate-pulse' : 'bg-gray-100 text-gray-400'
                  }`}>
                    <StepIcon size={16} />
                  </span>

                  <div className="space-y-1">
                    <h3 className={`text-base font-bold flex items-center gap-2 ${
                      isCompleted ? 'text-emerald-700' :
                      isActive ? 'text-amber-700' : 'text-gray-500'
                    }`}>
                      {language === 'en' ? step.titleEn : step.titleBn}
                      {isActive && (
                        <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded font-semibold animate-pulse">
                          {language === 'en' ? 'In Progress' : 'চলমান'}
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {language === 'en' ? step.descEn : step.descBn}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Details & Summary Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 pb-2 border-b border-gray-100">
              {language === 'en' ? 'Order Details' : 'অর্ডারের বিবরণ'}
            </h2>
            
            <div className="space-y-3.5">
              <div>
                <span className="text-xs text-gray-400 block uppercase font-bold tracking-wider">
                  {language === 'en' ? 'Order ID' : 'অর্ডার আইডি'}
                </span>
                <span className="text-base font-extrabold text-gray-800 tracking-tight">
                  {orderNumber}
                </span>
              </div>

              <div>
                <span className="text-xs text-gray-400 block uppercase font-bold tracking-wider">
                  {language === 'en' ? 'Total Bill' : 'মোট বিল'}
                </span>
                <span className="text-xl font-extrabold text-primary">
                  {formatPrice(totalAmount)}
                </span>
              </div>

              <div>
                <span className="text-xs text-gray-400 block uppercase font-bold tracking-wider">
                  {language === 'en' ? 'Safety Verification' : 'নিরাপত্তা যাচাইকরণ'}
                </span>
                <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded mt-1 ${
                  prescriptionUploaded
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}>
                  {prescriptionUploaded
                    ? (language === 'en' ? 'Pending Pharmacist Audit' : 'ফার্মাসিস্ট অনুমোদনের অপেক্ষায়')
                    : (language === 'en' ? 'No Prescription Needed' : 'প্রেসক্রিপশন প্রয়োজন নেই')}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-6 border-t border-gray-100">
            {/* WhatsApp Contact Button */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md transform hover:-translate-y-0.5"
            >
              <MessageSquare size={18} />
              {language === 'en' ? 'Confirm on WhatsApp' : 'হোয়াটসঅ্যাপে নিশ্চিত করুন'}
            </a>

            <button
              onClick={() => navigate('/shop')}
              className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-1 transition-colors border border-gray-200 text-sm"
            >
              {language === 'en' ? 'Continue Shopping' : 'আরো কেনাকাটা করুন'}
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Safety Notice Block */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mt-8 flex gap-4 items-start">
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
