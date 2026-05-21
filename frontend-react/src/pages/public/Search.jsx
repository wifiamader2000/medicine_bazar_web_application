import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search as SearchIcon } from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/common/Button';
import ErrorState from '../../components/common/ErrorState';
import Loading from '../../components/common/Loading';
import ProductGrid from '../../components/product/ProductGrid';
import { formatPrice, productImage, productPrice, productRouteId, unwrapData } from '../../utils/apiData';
import { useLanguage } from '../../context/LanguageContext';

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(urlQuery);
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { language, t } = useLanguage();

  const boldMatch = (text, queryText) => {
    if (!text || !queryText) return <span>{text}</span>;
    const regex = new RegExp(`(${queryText.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) => 
          regex.test(part) ? <strong key={i} className="font-extrabold text-primary">{part}</strong> : <span key={i}>{part}</span>
        )}
      </span>
    );
  };

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setSuggestions([]);
      return undefined;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const response = await api.get('/search/suggestions', { params: { q: term } });
        setSuggestions(unwrapData(response, []));
      } catch (err) {
        console.error(err);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  useEffect(() => {
    setQuery(urlQuery);
    setError('');

    if (!urlQuery.trim()) {
      setResults([]);
      return undefined;
    }

    let active = true;
    setLoading(true);
    api.get('/search/products', { params: { q: urlQuery, limit: 24 } })
      .then((response) => {
        if (active) setResults(unwrapData(response, []));
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || 'Search failed.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [urlQuery]);

  const handleSearch = (event) => {
    event.preventDefault();
    const term = query.trim();
    setShowSuggestions(false);
    setSearchParams(term ? { q: term } : {});
  };

  return (
    <div>
      <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
        <form onSubmit={handleSearch} className="relative max-w-3xl mx-auto">
          <div className="flex shadow-sm rounded-lg border-2 border-primary overflow-hidden relative">
            <input
              type="text"
              className="flex-1 px-4 py-3 focus:outline-none"
              placeholder={t('common.searchPlaceholder')}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
            />
            <Button type="submit" className="rounded-none px-6 rounded-r-sm">
              <SearchIcon size={20} className="mr-2" /> {t('common.search')}
            </Button>
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 shadow-xl rounded-lg z-50 overflow-hidden">
              <ul className="max-h-80 overflow-y-auto">
                {suggestions.map((item) => {
                  const routeId = productRouteId(item);
                  return (
                    <li key={routeId || item.name}>
                      <Link
                        to={routeId ? `/product/${routeId}` : '/shop'}
                        className="flex items-center gap-4 p-3 hover:bg-gray-50 border-b border-gray-100 transition-colors"
                        onClick={() => setShowSuggestions(false)}
                      >
                        <div className="w-10 h-10 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center p-1">
                          <img
                            src={productImage(item)}
                            alt=""
                            className="max-w-full max-h-full object-contain"
                            onError={(event) => { event.currentTarget.src = '/favicon.svg'; }}
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5 flex-wrap">
                            {boldMatch(language === 'bn' && item.nameBn ? item.nameBn : item.name, query)}
                            {item.strength && <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium">{item.strength}</span>}
                            {item.prescriptionRequired && <span className="px-1.5 py-0.5 bg-red-50 text-alert rounded text-[10px] font-medium border border-red-100">Rx</span>}
                          </h4>
                          {language === 'bn' && item.nameBn && (
                            <span className="text-[11px] text-gray-400 block font-normal -mt-0.5">{item.name}</span>
                          )}
                          <p className="text-xs text-gray-500 font-medium truncate mt-0.5">{boldMatch(item.genericName, query)}</p>
                          {item.manufacturer && <span className="text-[10px] text-gray-400 font-normal">{boldMatch(item.manufacturer, query)}</span>}
                        </div>
                        <div className="text-sm font-bold text-primary">{formatPrice(productPrice(item))}</div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </form>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          {urlQuery ? `${t('common.searchResults')} "${urlQuery}"` : t('common.findMedicine')}
        </h2>
        <div className="text-sm text-gray-500">{results.length} {t('common.productsFound')}</div>
      </div>

      {error ? (
        <ErrorState message={error} />
      ) : loading ? (
        <Loading />
      ) : (
        <ProductGrid products={results} className="lg:grid-cols-5" />
      )}
    </div>
  );
};

export default Search;
