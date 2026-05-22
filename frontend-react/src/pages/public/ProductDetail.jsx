import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Check, Info, Shield, ShoppingCart, Truck } from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import ErrorState from '../../components/common/ErrorState';
import ProductImage from '../../components/product/ProductImage';
import { useLanguage } from '../../context/LanguageContext';
import {
  addProductToCart,
  formatPrice,
  productImage,
  productPrice,
  productRequiresPrescription,
  unwrapData,
} from '../../utils/apiData';

const ProductDetail = () => {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [alternatives, setAlternatives] = useState([]);
  const { language, t } = useLanguage();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        let targetProduct = null;

        try {
          const response = await api.get(`/products/${encodeURIComponent(slug)}`);
          targetProduct = unwrapData(response);
        } catch {
          const response = await api.get('/products', { params: { search: slug, limit: 50 } });
          const items = unwrapData(response, []);
          targetProduct = items.find((item) => item.slug === slug || item.id == slug || item._id == slug);
        }

        if (targetProduct) {
          setProduct(targetProduct);
          // Fetch alternatives
          try {
            const altId = targetProduct.id || targetProduct._id || targetProduct.slug;
            const altResponse = await api.get(`/products/${encodeURIComponent(altId)}/alternatives`);
            const alts = unwrapData(altResponse, []);
            setAlternatives(alts);
          } catch (altErr) {
            console.error('Failed to fetch alternatives:', altErr);
          }
        } else {
          setError(language === 'en' ? 'Product not found' : 'ওষুধটি পাওয়া যায়নি');
        }
      } catch (err) {
        setError(language === 'en' ? 'Failed to load product details' : 'ওষুধের বিবরণ লোড করতে ব্যর্থ হয়েছে');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug, language]);

  if (loading) return <Loading fullScreen />;
  if (error || !product) return <ErrorState message={error || (language === 'en' ? 'Product not found' : 'ওষুধটি পাওয়া যায়নি')} />;

  const tabs = [
    { id: 'overview', label: t('product.overview') },
    { id: 'uses', label: t('product.uses') || 'Uses' },
    { id: 'dosage', label: t('product.dosage') || 'Dosage' },
    { id: 'side_effects', label: t('product.sideEffects') || 'Side Effects' },
    { id: 'warnings', label: t('product.warnings') || 'Warnings' },
    { id: 'storage', label: language === 'en' ? 'Storage' : 'সংরক্ষণ' },
    { id: 'reviews', label: language === 'en' ? 'Reviews' : 'রিভিউ' }
  ];

  const requiresPrescription = productRequiresPrescription(product);
  const inStock = (product.stockQuantity || 0) > 0;
  const displayName = language === 'bn' && product.nameBn ? product.nameBn : product.name;

  // Sort alternatives: in-stock first, lowest price second
  const sortedAlternatives = [...alternatives].sort((a, b) => {
    const aStock = (a.stockQuantity || 0) > 0 ? 1 : 0;
    const bStock = (b.stockQuantity || 0) > 0 ? 1 : 0;
    if (aStock !== bStock) return bStock - aStock;
    
    const aPrice = productPrice(a);
    const bPrice = productPrice(b);
    return aPrice - bPrice;
  });

  // Calculate savings for the meter based on the cheapest in-stock alternative
  const currentPrice = productPrice(product);
  const cheapestAlt = sortedAlternatives.find(alt => (alt.stockQuantity || 0) > 0);
  const cheapestAltPrice = cheapestAlt ? productPrice(cheapestAlt) : 0;
  
  const hasSavings = cheapestAlt && currentPrice > cheapestAltPrice;
  const savingsAmount = hasSavings ? currentPrice - cheapestAltPrice : 0;
  const savingsPercent = hasSavings && currentPrice > 0 ? Math.round((savingsAmount / currentPrice) * 100) : 0;

  return (
    <div className="space-y-8 pb-36 md:pb-8">
      {/* Product Details Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
          <div className="relative bg-slate-50/60 rounded-2xl p-8 flex items-center justify-center border border-slate-100">
            {requiresPrescription && (
              <div className="absolute top-4 right-4 z-10">
                <Badge variant="danger" className="font-bold py-1 px-3">Rx</Badge>
              </div>
            )}
            <ProductImage product={product} className="w-full max-w-sm aspect-square" />
          </div>

          <div className="flex flex-col">
            <div className="mb-6">
              <h1 className="text-3xl font-extrabold text-slate-800 mb-2">
                {displayName} <span className="text-slate-400 font-normal text-xl">{product.strength}</span>
              </h1>
              {language === 'en' && product.nameBn && <h2 className="text-lg text-slate-500 font-semibold mb-2">{product.nameBn}</h2>}
              {language === 'bn' && product.nameBn && product.name !== displayName && <h2 className="text-lg text-slate-500 font-semibold mb-2">{product.name}</h2>}

              <p className="text-primary font-bold text-lg mb-1">{product.genericName}</p>
              <p className="text-slate-500 mb-4">{product.manufacturer?.name || product.manufacturer}</p>

              <div className="flex flex-wrap gap-2 mb-6">
                {product.dosageForm && <Badge variant="primary" className="bg-primary/10 text-primary font-semibold">{product.dosageForm}</Badge>}
                {product.packSize && <Badge variant="gray" className="bg-slate-100 text-slate-600 font-semibold">{t('product.packSize') || 'Pack Size'}: {product.packSize}</Badge>}
              </div>

              <div className="flex items-end gap-4 mb-6">
                <div className="text-4xl font-extrabold text-slate-800">
                  {formatPrice(currentPrice)}
                </div>
                {product.discount > 0 && (
                  <>
                    <div className="text-xl text-slate-400 line-through mb-1">{formatPrice(product.mrp)}</div>
                    <Badge variant="offer" className="mb-2 bg-amber-500 text-white font-bold px-2.5 py-0.5">
                      {language === 'en' ? `Save ${product.discount}%` : `${product.discount}% ছাড়`}
                    </Badge>
                  </>
                )}
              </div>

              <div className={`flex items-center gap-2 text-sm mb-8 font-bold ${inStock ? 'text-emerald-600' : 'text-slate-400'}`}>
                <Check size={18} /> {inStock ? t('common.inStock') : t('common.outOfStock')}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <Button size="lg" className="flex-1 gap-2 shadow-sm rounded-xl py-3 pressable hover-lift" disabled={!inStock} onClick={() => addProductToCart(product)}>
                  <ShoppingCart size={20} /> {t('common.addToCart')}
                </Button>
                {requiresPrescription && (
                  <Link to="/prescription-upload" className="flex-1">
                    <Button size="lg" variant="outline" className="w-full rounded-xl py-3 border-emerald-500 text-emerald-600 hover:bg-emerald-50 pressable hover-lift">
                      {t('common.uploadPrescription') || 'Upload Prescription'}
                    </Button>
                  </Link>
                )}
              </div>

              {/* Clinical Rx Warning Alert */}
              {requiresPrescription && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3.5 mb-6 text-sm text-red-800 animate-pulse">
                  <div className="flex gap-2.5 items-start">
                    <span className="font-extrabold px-1.5 py-0.5 bg-red-600 text-white rounded text-xs select-none">Rx</span>
                    <div>
                      <p className="font-bold">{language === 'bn' ? 'প্রেসক্রিপশন আবশ্যক' : 'Prescription Required'}</p>
                      <p className="text-xs text-red-700/90 mt-0.5">
                        {language === 'bn'
                          ? 'এই ওষুধটি কেনার জন্য অবশ্যই একটি রেজিস্টার্ড ডাক্তারের প্রেসক্রিপশন আপলোড করতে হবে।'
                          : 'You must provide a valid doctor\'s prescription. Our certified pharmacist will verify it before dispatch.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Delivery Estimate & Supported Payments */}
              <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100 space-y-3 mb-6">
                <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
                  <span>{language === 'bn' ? 'ডেলিভারি সময়:' : 'Delivery Estimate:'}</span>
                  <span className="font-bold text-slate-700">
                    {language === 'bn' ? 'ঢাকা সিটিতে ২৪ ঘণ্টা, বাইরে ৭২ ঘণ্টা' : 'Dhaka 24h, Outside 72h'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500 font-medium pt-2.5 border-t border-slate-200/60">
                  <span>{language === 'bn' ? 'পেমেন্ট মাধ্যম:' : 'Accepted Payments:'}</span>
                  <div className="flex gap-1.5">
                    <span className="bg-slate-200/80 text-[10px] text-slate-600 px-1.5 py-0.5 rounded font-bold">COD</span>
                    <span className="bg-pink-100 text-[10px] text-pink-700 px-1.5 py-0.5 rounded font-bold">bKash</span>
                    <span className="bg-orange-100 text-[10px] text-orange-700 px-1.5 py-0.5 rounded font-bold">Nagad</span>
                    <span className="bg-blue-100 text-[10px] text-blue-700 px-1.5 py-0.5 rounded font-bold">Upay</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-6 border-t border-slate-100 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                <Shield className="text-primary" size={24} />
                <span>{t('home.genuine')}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                <Truck className="text-primary" size={24} />
                <span>{t('home.fastDelivery')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Clinical Drug Monograph Tabs */}
        <div className="border-t border-slate-100 bg-slate-50/20">
          <div className="flex overflow-x-auto border-b border-slate-100 bg-slate-50/40 px-8 scrollbar-thin">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`py-4 px-6 font-bold text-sm whitespace-nowrap transition-all border-b-2 cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-8 text-slate-700 leading-relaxed">
            {/* Disclaimer Bar (Required Bilingual Banner) */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-6 flex gap-3 text-sm">
              <Info className="text-emerald-600 shrink-0" size={20} />
              <div className="text-emerald-800 font-medium">
                <p className="font-bold mb-1">{language === 'en' ? 'Important Medical Advisory' : 'গুরুত্বপূর্ণ সতর্কতা'}</p>
                <p>
                  {language === 'bn' 
                    ? 'এই তথ্য শুধুমাত্র সাধারণ জ্ঞানের জন্য। চিকিৎসকের পরামর্শ ছাড়া ওষুধ সেবন করবেন না।' 
                    : 'This information is for general educational purposes only. Never consume any medication without direct advice from a registered medical physician.'}
                </p>
              </div>
            </div>

            {activeTab === 'overview' && (
              <div className="space-y-4">
                <p className="font-medium text-slate-800">
                  {product.description || product.uses || (language === 'en' ? 'No monograph description available for this product.' : 'এই ওষুধের কোনো বিবরণ উপলব্ধ নেই।')}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-400 block font-bold uppercase">{language === 'en' ? 'Generic Name' : 'জেনেরিক নাম'}</span>
                    <span className="font-bold text-slate-700">{product.genericName || 'N/A'}</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-400 block font-bold uppercase">{language === 'en' ? 'Drug Class' : 'ওষুধের শ্রেণী'}</span>
                    <span className="font-bold text-slate-700">{product.drugClass || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'uses' && (
              <div className="space-y-4">
                {product.uses || product.indication || product.indications ? (
                  <p className="font-medium text-slate-800">
                    {product.uses || product.indication || (Array.isArray(product.indications) ? product.indications.join(', ') : product.indications)}
                  </p>
                ) : (
                  <p className="text-slate-400 italic">
                    {language === 'en' ? 'Detailed usage information has not been added for this molecule yet. Please consult a registered physician.' : 'নির্দিষ্ট ব্যবহারবিধি এখনো যুক্ত করা হয়নি। চিকিৎসকের পরামর্শ নিন।'}
                  </p>
                )}
              </div>
            )}
            
            {activeTab === 'dosage' && (
              <div className="space-y-4">
                {product.dosage ? (
                  <p className="font-medium text-slate-800">{product.dosage}</p>
                ) : (
                  <p className="text-slate-400 italic">
                    {language === 'en' ? 'Dosage guidance has not been cataloged yet. Follow the directions on your prescription.' : 'খাওয়ার নিয়ম বিবরণী এখনো যুক্ত করা হয়নি। চিকিৎসকের নির্দেশনা অনুসরণ করুন।'}
                  </p>
                )}
              </div>
            )}
            
            {activeTab === 'side_effects' && (
              <div className="space-y-4">
                {product.sideEffects ? (
                  <p className="font-medium text-slate-800">{product.sideEffects}</p>
                ) : (
                  <p className="text-slate-400 italic">
                    {language === 'en' ? 'No adverse drug reactions or side effects cataloged for this product. Consult your pharmacist if you experience symptoms.' : 'এই ওষুধে সচরাচর পার্শ্বপ্রতিক্রিয়ার কোনো তথ্য যুক্ত করা হয়নি। কোনো সমস্যা অনুভূত হলে চিকিৎসকের শরণাপন্ন হোন।'}
                  </p>
                )}
              </div>
            )}
            
            {activeTab === 'warnings' && (
              <div className="space-y-4">
                {(product.warning || product.warnings || product.precautions || product.pregnancyWarning) ? (
                  <div className="space-y-4">
                    {(product.warning || product.warnings) && (
                      <div>
                        <h4 className="font-bold text-slate-800 mb-1">{language === 'en' ? 'Warnings' : 'সতর্কতা'}</h4>
                        <p>{product.warning || product.warnings}</p>
                      </div>
                    )}
                    {product.precautions && (
                      <div>
                        <h4 className="font-bold text-slate-800 mb-1">{language === 'en' ? 'Precautions' : 'সতর্কতা উপদেশ'}</h4>
                        <p>{product.precautions}</p>
                      </div>
                    )}
                    {product.pregnancyWarning && (
                      <div>
                        <h4 className="font-bold text-slate-800 mb-1">{language === 'en' ? 'Pregnancy & Lactation' : 'গর্ভাবস্থা ও স্তন্যদানকালে'}</h4>
                        <p>{product.pregnancyWarning}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">
                    {language === 'en' ? 'No specific clinical warnings or pregnancy warnings cataloged. Always check with your physician.' : 'কোনো বিশেষ সতর্কবার্তা যুক্ত করা হয়নি। চিকিৎসকের পরামর্শ অনুসরণ করুন।'}
                  </p>
                )}
              </div>
            )}

            {activeTab === 'storage' && (
              <div className="space-y-4">
                {product.storage || product.storageConditions ? (
                  <p className="font-medium text-slate-800">{product.storage || product.storageConditions}</p>
                ) : (
                  <p className="font-medium text-slate-800">
                    {language === 'en' 
                      ? 'Store in a cool and dry place below 30°C. Protect from light and moisture. Keep out of reach of children.' 
                      : '৩০ ডিগ্রি সেলসিয়াসের নিচে ঠান্ডা ও শুষ্ক স্থানে সংরক্ষণ করুন। আলো এবং আর্দ্রতা থেকে দূরে রাখুন। শিশুদের নাগালের বাইরে রাখুন।'}
                  </p>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-4">
                {product.reviews && product.reviews.length > 0 ? (
                  <div className="space-y-4">
                    {product.reviews.map((r, idx) => (
                      <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-slate-800">{r.reviewerName || 'Customer'}</span>
                          <span className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-slate-600">{r.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">
                    {language === 'en' ? 'No patient reviews have been submitted for this medicine yet.' : 'এই ওষুধের জন্য এখনো কোনো রিভিউ দেওয়া হয়নি।'}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Generic Savings Meter & Cheaper Alternatives */}
      {sortedAlternatives.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          
          {/* Savings Gauge */}
          {hasSavings && (
            <div className="glass-panel rounded-2xl p-6 mb-8 border border-emerald-500/10 shadow-inner flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-r from-emerald-500/5 to-teal-500/5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 flex items-center justify-center text-emerald-600 font-extrabold text-xl animate-pulse">
                  {savingsPercent}%
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-800 flex items-center gap-2">
                    <span>{language === 'en' ? 'Generic Savings Meter' : 'জেনেরিক সাশ্রয় মিটার'}</span>
                    <Badge variant="success" className="text-[10px] bg-emerald-500 text-white font-bold py-0.5 px-2">
                      {language === 'en' ? 'Best Switch' : 'সেরা বিকল্প'}
                    </Badge>
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {language === 'en'
                      ? `Switching to the cheapest available in-stock brand saves you up to ${savingsPercent}% (${formatPrice(savingsAmount)} per pack).`
                      : `সবচেয়ে সাশ্রয়ী ইন-স্টক ব্র্যান্ডে স্যুইচ করলে আপনার সর্বোচ্চ ${savingsPercent}% (${formatPrice(savingsAmount)} প্রতি প্যাক) অর্থ সাশ্রয় হবে।`}
                  </p>
                </div>
              </div>
              <div className="w-full md:w-48 bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${savingsPercent}%` }}></div>
              </div>
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
              <span>{language === 'en' ? 'Alternative Brands' : 'বিকল্প ব্র্যান্ডসমূহ'}</span>
              <Badge variant="success" className="text-xs font-semibold py-0.5 px-2.5">
                {language === 'en' ? 'Same Molecule' : 'একই জেনেরিক উপাদান'}
              </Badge>
            </h2>
            <p className="text-slate-500 mt-1">
              {language === 'en'
                ? 'Equivalent medicines with the exact same active generic molecule, dosage form, and strength, sorted by availability and best savings.'
                : 'একই জেনেরিক উপাদান, ডোজেজ ফর্ম এবং শক্তির সমমানের বিকল্প ওষুধসমূহ (ইন-স্টক এবং সাশ্রয়ী দামের ভিত্তিতে সাজানো)।'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedAlternatives.map((alt) => {
              const altPrice = productPrice(alt);
              const diff = currentPrice - altPrice;
              const altSavingsPercent = currentPrice > 0 && diff > 0 ? Math.round((diff / currentPrice) * 100) : 0;
              const altDisplayName = language === 'bn' && alt.nameBn ? alt.nameBn : alt.name;
              const altInStock = (alt.stockQuantity || 0) > 0;

              return (
                <div key={alt.id || alt._id} className="border border-slate-200 rounded-xl p-4 flex gap-4 hover:border-primary hover:shadow-sm transition-all bg-white">
                  <div className="w-20 h-20 bg-slate-50 rounded-lg flex-shrink-0 flex items-center justify-center p-2 border border-slate-100">
                    <ProductImage
                      product={alt}
                      alt={altDisplayName}
                      className="max-w-full max-h-full"
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-slate-800 truncate">
                          {altDisplayName} <span className="text-slate-400 font-normal text-sm">{alt.strength}</span>
                        </h3>
                        {altSavingsPercent > 0 && (
                          <Badge variant="offer" className="shrink-0 text-xs font-extrabold py-0.5 px-2 bg-emerald-500 text-white rounded">
                            {language === 'en' ? `Save ${altSavingsPercent}%` : `${altSavingsPercent}% সাশ্রয়`}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{alt.manufacturer?.name || alt.manufacturer}</p>
                      <p className="text-xs text-primary font-bold mt-1">{alt.dosageForm}</p>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div>
                        <span className="text-lg font-extrabold text-slate-800">{formatPrice(altPrice)}</span>
                        {alt.discount > 0 && (
                          <span className="text-xs text-slate-400 line-through ml-1">{formatPrice(alt.mrp)}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {altInStock ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs py-1.5 hover:bg-primary hover:text-white rounded-lg border-emerald-500 text-emerald-600"
                            onClick={() => addProductToCart(alt)}
                          >
                            {t('common.addToCart')}
                          </Button>
                        ) : (
                          <span className="text-xs text-slate-400 font-semibold bg-slate-100 py-1 px-3 rounded-full">{t('common.outOfStock')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mobile Sticky Bottom Action Bar */}
      <div className="fixed bottom-[56px] left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] p-4 md:hidden flex items-center justify-between gap-4 animate-fade-up">
        <div className="flex flex-col">
          <span className="text-xs text-slate-400 font-bold uppercase">{displayName.length > 18 ? displayName.substring(0, 18) + '...' : displayName}</span>
          <span className="text-xl font-extrabold text-slate-800">{formatPrice(currentPrice)}</span>
        </div>
        <div className="flex gap-2 shrink-0">
          {requiresPrescription && (
            <Link to="/prescription-upload">
              <Button size="sm" variant="outline" className="text-xs border-emerald-500 text-emerald-600 font-bold py-2.5 px-3 rounded-lg pressable">
                {language === 'bn' ? 'প্রেসক্রিপশন দিন' : 'Upload Rx'}
              </Button>
            </Link>
          )}
          <Button
            size="sm"
            className="text-xs py-2.5 px-4 rounded-lg font-bold pressable flex items-center gap-1.5 shadow-sm"
            disabled={!inStock}
            onClick={() => addProductToCart(product)}
          >
            <ShoppingCart size={14} /> {t('common.addToCart')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;

