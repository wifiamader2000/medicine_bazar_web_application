import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import api from '../../services/api';
import { formatPrice, productPrice, unwrapData } from '../../utils/apiData';

const POSSearch = ({ onAddProduct }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'F2') {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return undefined;
    }

    const timer = setTimeout(() => {
      setLoading(true);
      api.get('/search/products', { params: { q: query, limit: 10, inStock: true } })
        .then((response) => setResults(unwrapData(response, [])))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (product) => {
    onAddProduct(product);
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search by name, generic, or barcode (F2)"
          className="w-full h-14 pl-10 pr-12 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 text-lg shadow-sm"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {loading && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-primary animate-spin" size={20} />
        )}
      </div>

      {results.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 max-h-[60vh] overflow-y-auto">
          {results.map((product) => (
            <div
              key={product.id || product._id}
              className="p-4 border-b border-gray-50 hover:bg-primary/5 cursor-pointer flex justify-between items-center"
              onClick={() => handleSelect(product)}
            >
              <div>
                <h4 className="font-bold text-gray-900 text-lg">{product.name}</h4>
                <p className="text-sm text-gray-500">{product.genericName || product.category}</p>
              </div>
              <div className="text-right">
                <span className="font-bold text-primary text-xl">{formatPrice(productPrice(product))}</span>
                <p className="text-xs text-gray-500 mt-1">Stock: {product.stockQuantity || 0}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default POSSearch;
