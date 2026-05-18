const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const DataService = require('../services/DataService');

const SEARCH_FIELDS = [
  'name', 'nameBn', 'genericName', 'manufacturer', 'category', 'strength', 'dosageForm', 'sku', 'barcode',
  'aliases', 'uses', 'searchKeywords', 'drugClass', 'indication', 'indications', 'pharmacology',
];

function includes(value, query) {
  if (!value) return false;
  if (Array.isArray(value)) return value.some(item => includes(item, query));
  return String(value).toLowerCase().includes(query);
}

function entitySuggestions(storeName, fields, q, type, limit) {
  const query = q.toLowerCase();
  return DataService.get(storeName).findAll({})
    .filter(item => item.active !== false && fields.some(field => includes(item[field], query)))
    .slice(0, limit)
    .map(item => ({
      id: item.id,
      type,
      name: item.name || item.genericName,
      label: item.name || item.genericName,
      genericName: item.genericName || '',
      drugClass: item.drugClass || '',
      indication: item.indication || '',
      manufacturer: item.name || '',
      href: type === 'manufacturer' ? `/brand/${item.slug || item.name}` : `/search?q=${encodeURIComponent(item.name || item.genericName)}`,
    }));
}

router.get('/suggestions', asyncHandler(async (req, res) => {
  const { q, limit = 10 } = req.query;
  if (!q || q.trim().length < 1) {
    return res.json({ success: true, data: [] });
  }
  const max = parseInt(limit);
  const results = DataService.get('products').search(SEARCH_FIELDS, q, max);
  const productSuggestions = results
    .filter(p => p.active !== false)
    .map(p => ({
      id: p.id,
      type: 'product',
      label: `${p.name}${p.strength ? ' ' + p.strength : ''}`,
      name: p.name,
      nameBn: p.nameBn || '',
      genericName: p.genericName || '',
      strength: p.strength || '',
      dosageForm: p.dosageForm || '',
      manufacturer: p.manufacturer || '',
      drugClass: p.drugClass || '',
      indication: p.indication || '',
      sellingPrice: p.sellingPrice || p.mrp || 0,
      mrp: p.mrp || 0,
      imageUrl: p.imageUrl || '/assets/images/medicine-placeholder.svg',
      inStock: (p.stockQuantity || 0) > 0,
      prescriptionRequired: p.prescriptionRequired || false,
      href: `/product/${p.id}`,
    }));
  const genericSuggestions = entitySuggestions('generics', ['name', 'genericName', 'drugClass', 'indication', 'indications'], q, 'generic', max);
  const manufacturerSuggestions = entitySuggestions('manufacturers', ['name'], q, 'manufacturer', max);
  const indicationSuggestions = entitySuggestions('indications', ['name'], q, 'indication', max);
  const drugClassSuggestions = entitySuggestions('drugClasses', ['name'], q, 'drug_class', max);
  const seen = new Set();
  const suggestions = [...productSuggestions, ...genericSuggestions, ...manufacturerSuggestions, ...indicationSuggestions, ...drugClassSuggestions]
    .filter(item => {
      const key = `${item.type}:${String(item.name || '').toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, max);
  res.json({ success: true, data: suggestions });
}));

router.get('/products', asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 20, category, brand, minPrice, maxPrice, sort, inStock, prescriptionRequired } = req.query;
  if (!q || q.trim().length === 0) {
    return res.json({ success: true, data: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } });
  }

  let results = DataService.get('products').search(SEARCH_FIELDS, q, 1000);
  results = results.filter(p => p.active !== false);

  if (category) results = results.filter(p => p.category?.toLowerCase() === category.toLowerCase() || p.categorySlug === category);
  if (brand) results = results.filter(p => p.manufacturer?.toLowerCase() === brand.toLowerCase());
  if (minPrice) results = results.filter(p => (p.sellingPrice || p.mrp || 0) >= parseFloat(minPrice));
  if (maxPrice) results = results.filter(p => (p.sellingPrice || p.mrp || 0) <= parseFloat(maxPrice));
  if (inStock === 'true') results = results.filter(p => (p.stockQuantity || 0) > 0);
  if (prescriptionRequired === 'true') results = results.filter(p => p.prescriptionRequired);

  if (sort) {
    const [field, order] = sort.split(':');
    results.sort((a, b) => order === 'desc' ? (b[field] > a[field] ? 1 : -1) : (a[field] > b[field] ? 1 : -1));
  }

  const total = results.length;
  const p = parseInt(page);
  const l = parseInt(limit);
  const data = results.slice((p - 1) * l, p * l);

  if (total === 0) {
    DataService.get('searchLogs').create({ query: q, resultCount: 0, filters: { category, brand } });
  }

  res.json({ success: true, data, pagination: { total, page: p, limit: l, totalPages: Math.ceil(total / l) } });
}));

router.get('/filters', asyncHandler(async (req, res) => {
  const products = DataService.get('products').findAll({}).filter(p => p.active !== false);
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))].sort();
  const brands = [...new Set(products.map(p => p.manufacturer).filter(Boolean))].sort();
  const generics = [...new Set(products.map(p => p.genericName).filter(Boolean))].sort();
  const dosageForms = [...new Set(products.map(p => p.dosageForm).filter(Boolean))].sort();
  const drugClasses = [...new Set(products.map(p => p.drugClass).filter(Boolean))].sort();
  const indications = [...new Set(products.flatMap(p => [p.indication, ...(p.indications || [])]).filter(Boolean))].sort();
  const priceRange = {
    min: Math.min(...products.map(p => p.sellingPrice || p.mrp || 0).filter(v => v > 0), 0),
    max: Math.max(...products.map(p => p.sellingPrice || p.mrp || 0), 0),
  };
  res.json({ success: true, data: { categories, brands, manufacturers: brands, generics, dosageForms, drugClasses, indications, priceRange } });
}));

module.exports = router;
