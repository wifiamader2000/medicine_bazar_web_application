import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { formatPrice, productPrice, unwrapData } from '../../utils/apiData';

const ProductsManager = () => {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/products', { params: { limit: 50 } })
      .then((response) => setProducts(unwrapData(response, [])))
      .catch((err) => setError(err.response?.data?.message || 'Products could not be loaded.'));
  }, []);

  return (
    <div className="p-4">
      <h1 className="mb-4 text-2xl font-bold">Products</h1>
      {error && <p className="mb-4 rounded border border-alert bg-white p-3 text-alert">{error}</p>}
      <div className="overflow-x-auto rounded bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-panel">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Generic</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Price</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id || product._id} className="border-t">
                <td className="p-3 font-medium">{product.name}</td>
                <td className="p-3 text-gray-600">{product.genericName || '-'}</td>
                <td className="p-3">{product.stockQuantity || 0}</td>
                <td className="p-3">{formatPrice(productPrice(product))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductsManager;
