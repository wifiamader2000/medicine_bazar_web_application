import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Check, Info, Shield, ShoppingCart, Truck } from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import ErrorState from '../../components/common/ErrorState';
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
        } else {
          setError('Product not found');
        }
      } catch (err) {
        setError('Failed to load product details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  if (loading) return <Loading fullScreen />;
  if (error || !product) return <ErrorState message={error || 'Product not found'} />;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'uses', label: 'Uses' },
    { id: 'side_effects', label: 'Side Effects' },
    { id: 'warnings', label: 'Warnings' },
  ];
  const requiresPrescription = productRequiresPrescription(product);
  const inStock = (product.stockQuantity || 0) > 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
        <div className="relative bg-gray-50 rounded-xl p-8 flex items-center justify-center">
          {requiresPrescription && (
            <div className="absolute top-4 right-4 z-10">
              <Badge variant="alert">Rx Required</Badge>
            </div>
          )}
          <img
            src={productImage(product)}
            alt={product.name}
            className="max-w-full max-h-[400px] object-contain mix-blend-multiply"
            onError={(event) => { event.currentTarget.src = '/favicon.svg'; }}
          />
        </div>

        <div className="flex flex-col">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {product.name} <span className="text-gray-500 font-normal">{product.strength}</span>
            </h1>
            {(product.nameBn || product.banglaName) && <h2 className="text-xl text-gray-700 mb-2">{product.nameBn || product.banglaName}</h2>}

            <p className="text-[var(--color-primary)] font-medium text-lg mb-2">{product.genericName}</p>
            <p className="text-gray-600 mb-4">{product.manufacturer?.name || product.manufacturer}</p>

            <div className="flex flex-wrap gap-2 mb-6">
              {product.dosageForm && <Badge variant="gray">{product.dosageForm}</Badge>}
              {product.packSize && <Badge variant="gray">Pack size: {product.packSize}</Badge>}
            </div>

            <div className="flex items-end gap-4 mb-6">
              <div className="text-4xl font-bold text-[var(--color-primary)]">
                {formatPrice(productPrice(product))}
              </div>
              {product.discount > 0 && (
                <>
                  <div className="text-xl text-gray-400 line-through mb-1">{formatPrice(product.mrp)}</div>
                  <Badge variant="offer" className="mb-2">Save {product.discount}%</Badge>
                </>
              )}
            </div>

            <div className={`flex items-center gap-2 text-sm mb-8 font-medium ${inStock ? 'text-green-600' : 'text-gray-500'}`}>
              <Check size={18} /> {inStock ? 'In Stock' : 'Out of Stock'}
            </div>

            <div className="flex gap-4">
              <Button size="lg" className="flex-1 gap-2" disabled={!inStock} onClick={() => addProductToCart(product)}>
                <ShoppingCart size={20} /> Add to Cart
              </Button>
              {requiresPrescription && (
                <Button size="lg" variant="outline" className="flex-1">
                  Upload Prescription
                </Button>
              )}
            </div>
          </div>

          <div className="mt-auto pt-6 border-t border-gray-100 grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Shield className="text-[var(--color-primary)]" size={24} />
              <span>100% Genuine Product</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Truck className="text-[var(--color-primary)]" size={24} />
              <span>Fast Home Delivery</span>
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
              <p>{product.description || product.uses || 'No description available for this product.'}</p>

              <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mt-6 flex gap-3 text-sm">
                <Info className="text-yellow-600 shrink-0" size={20} />
                <p className="text-yellow-800">
                  <strong className="block mb-1">Medical Disclaimer</strong>
                  This information is for general knowledge only. Do not take medicine without consulting a physician.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'uses' && <p>{product.uses || product.indication || product.indications || 'Information not available.'}</p>}
          {activeTab === 'side_effects' && <p>{product.sideEffects || 'Information not available.'}</p>}
          {activeTab === 'warnings' && <p>{product.warning || product.warnings || 'Information not available.'}</p>}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
