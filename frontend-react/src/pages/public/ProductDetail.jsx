import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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
    { id: 'uses', label: t('product.uses') },
    { id: 'side_effects', label: t('product.sideEffects') },
    { id: 'warnings', label: t('product.warnings') },
  ];
  const requiresPrescription = productRequiresPrescription(product);
  const inStock = (product.stockQuantity || 0) > 0;

  const displayName = language === 'bn' && product.nameBn ? product.nameBn : product.name;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
        <div className="relative bg-gray-50 rounded-xl p-8 flex items-center justify-center">
          {requiresPrescription && (
            <div className="absolute top-4 right-4 z-10">
              <Badge variant="alert">{t('common.rxRequired')}</Badge>
            </div>
          )}
          <ProductImage product={product} className="w-full max-w-sm aspect-square mix-blend-multiply" />
        </div>

        <div className="flex flex-col">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {displayName} <span className="text-gray-500 font-normal">{product.strength}</span>
            </h1>
            {language === 'en' && product.nameBn && <h2 className="text-xl text-gray-700 mb-2">{product.nameBn}</h2>}
            {language === 'bn' && product.nameBn && product.name !== displayName && <h2 className="text-xl text-gray-700 mb-2">{product.name}</h2>}

            <p className="text-[var(--color-primary)] font-medium text-lg mb-2">{product.genericName}</p>
            <p className="text-gray-600 mb-4">{product.manufacturer?.name || product.manufacturer}</p>

            <div className="flex flex-wrap gap-2 mb-6">
              {product.dosageForm && <Badge variant="gray">{product.dosageForm}</Badge>}
              {product.packSize && <Badge variant="gray">{t('product.packSize')}: {product.packSize}</Badge>}
            </div>

            <div className="flex items-end gap-4 mb-6">
              <div className="text-4xl font-bold text-[var(--color-primary)]">
                {formatPrice(productPrice(product))}
              </div>
              {product.discount > 0 && (
                <>
                  <div className="text-xl text-gray-400 line-through mb-1">{formatPrice(product.mrp)}</div>
                  <Badge variant="offer" className="mb-2">
                    {language === 'en' ? `Save ${product.discount}%` : `${product.discount}% ছাড়`}
                  </Badge>
                </>
              )}
            </div>

            <div className={`flex items-center gap-2 text-sm mb-8 font-medium ${inStock ? 'text-green-600' : 'text-gray-500'}`}>
              <Check size={18} /> {inStock ? t('common.inStock') : t('common.outOfStock')}
            </div>

            <div className="flex gap-4">
              <Button size="lg" className="flex-1 gap-2" disabled={!inStock} onClick={() => addProductToCart(product)}>
                <ShoppingCart size={20} /> {t('common.addToCart')}
              </Button>
              {requiresPrescription && (
                <Button size="lg" variant="outline" className="flex-1" onClick={() => addProductToCart(product)}>
                  {t('common.uploadPrescription')}
                </Button>
              )}
            </div>
          </div>

          <div className="mt-auto pt-6 border-t border-gray-100 grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Shield className="text-[var(--color-primary)]" size={24} />
              <span>{t('home.genuine')}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Truck className="text-[var(--color-primary)]" size={24} />
              <span>{t('home.fastDelivery')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200">
        <div className="flex overflow-x-auto border-b border-gray-200 bg-gray-50 px-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`py-4 px-6 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-8 text-gray-700 leading-relaxed">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <p>{product.description || product.uses || (language === 'en' ? 'No description available for this product.' : 'এই ওষুধের কোনো বিবরণ উপলব্ধ নেই।')}</p>

              <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mt-6 flex gap-3 text-sm">
                <Info className="text-yellow-600 shrink-0" size={20} />
                <p className="text-yellow-800">
                  <strong className="block mb-1">{t('common.disclaimer')}</strong>
                  {product.disclaimer || t('common.defaultDisclaimer')}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'uses' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{language === 'en' ? 'Uses' : 'ব্যবহারসমূহ'}</h3>
                <p>{product.uses || product.indication || product.indications || (language === 'en' ? 'This information has not been added yet. Consult a registered physician.' : 'এই তথ্যটি এখনো যুক্ত করা হয়নি। চিকিৎসকের পরামর্শ নিন।')}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{language === 'en' ? 'Dosage' : 'খাওয়ার নিয়ম'}</h3>
                <p>{product.dosage || (language === 'en' ? 'This information has not been added yet. Consult a registered physician.' : 'এই তথ্যটি এখনো যুক্ত করা হয়নি। চিকিৎসকের পরামর্শ নিন।')}</p>
              </div>
            </div>
          )}
          
          {activeTab === 'side_effects' && (
            <div className="space-y-4">
              <p>{product.sideEffects || (language === 'en' ? 'This information has not been added yet. Consult a registered physician.' : 'এই তথ্যটি এখনো যুক্ত করা হয়নি। চিকিৎসকের পরামর্শ নিন।')}</p>
            </div>
          )}
          
          {activeTab === 'warnings' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{language === 'en' ? 'Warnings' : 'সতর্কতা'}</h3>
                <p>{product.warning || product.warnings || (language === 'en' ? 'This information has not been added yet. Consult a registered physician.' : 'এই তথ্যটি এখনো যুক্ত করা হয়নি। চিকিৎসকের পরামর্শ নিন।')}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{language === 'en' ? 'Precautions' : 'উপদেশ'}</h3>
                <p>{product.precautions || (language === 'en' ? 'This information has not been added yet. Consult a registered physician.' : 'এই তথ্যটি এখনো যুক্ত করা হয়নি। চিকিৎসকের পরামর্শ নিন।')}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{language === 'en' ? 'Pregnancy & Lactation' : 'গর্ভাবস্থা ও স্তন্যদানকালে'}</h3>
                <p>{product.pregnancyWarning || product.lactationWarning || (language === 'en' ? 'This information has not been added yet. Consult a registered physician.' : 'এই তথ্যটি এখনো যুক্ত করা হয়নি। চিকিৎসকের পরামর্শ নিন।')}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {alternatives.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span>{language === 'en' ? 'Alternative Brands' : 'বিকল্প ব্র্যান্ড'}</span>
              <Badge variant="success" className="text-xs font-semibold py-0.5 px-2">
                {language === 'en' ? 'Same Molecule' : 'একই জেনেরিক উপাদান'}
              </Badge>
            </h2>
            <p className="text-gray-500 mt-1">
              {language === 'en'
                ? 'Equivalent medicines with the exact same active generic ingredient, dosage form, and strength.'
                : 'হুবহু একই জেনেরিক উপাদান, ডোজেজ ফর্ম এবং শক্তির সমমানের বিকল্প ওষুধসমূহ।'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alternatives.map((alt) => {
              const altPrice = productPrice(alt);
              const origPrice = productPrice(product);
              const diff = origPrice - altPrice;
              const savingsPercent = origPrice > 0 ? Math.round((diff / origPrice) * 100) : 0;
              const altDisplayName = language === 'bn' && alt.nameBn ? alt.nameBn : alt.name;
              const altInStock = (alt.stockQuantity || 0) > 0;

              return (
                <div key={alt.id || alt._id} className="border border-gray-200 rounded-xl p-4 flex gap-4 hover:border-[var(--color-primary)] transition-all">
                  <div className="w-20 h-20 bg-gray-50 rounded-lg flex-shrink-0 flex items-center justify-center p-2">
                    <img
                      src={productImage(alt)}
                      alt={altDisplayName}
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => { e.currentTarget.src = '/favicon.svg'; }}
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-gray-900 truncate">
                          {altDisplayName} <span className="text-gray-500 font-normal text-sm">{alt.strength}</span>
                        </h3>
                        {savingsPercent > 0 && (
                          <Badge variant="offer" className="shrink-0 text-xs font-semibold py-0.5 px-2">
                            {language === 'en' ? `Save ${savingsPercent}%` : `${savingsPercent}% সাশ্রয়`}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{alt.manufacturer?.name || alt.manufacturer}</p>
                      <p className="text-xs text-[var(--color-primary)] font-medium mt-1">{alt.dosageForm}</p>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div>
                        <span className="text-lg font-bold text-[var(--color-primary)]">{formatPrice(altPrice)}</span>
                        {alt.discount > 0 && (
                          <span className="text-xs text-gray-400 line-through ml-1">{formatPrice(alt.mrp)}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {altInStock ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs py-1.5 hover:bg-[var(--color-primary)] hover:text-white"
                            onClick={() => addProductToCart(alt)}
                          >
                            {t('common.addToCart')}
                          </Button>
                        ) : (
                          <span className="text-xs text-gray-400 font-medium bg-gray-100 py-1 px-2.5 rounded-full">{t('common.outOfStock')}</span>
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
    </div>
  );
};

export default ProductDetail;
