const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const DataService = require('../services/DataService');
const SearchService = require('../services/search/SearchService');

router.get('/suggestions', asyncHandler(async (req, res) => {
  const { q, limit = 10 } = req.query;
  if (!q || q.trim().length < 1) {
    return res.json({ success: true, data: [] });
  }
  const max = parseInt(limit);
  const suggestions = await SearchService.getSuggestions(q, max);
  res.json({ success: true, data: suggestions });
}));

router.get('/products', asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 20, category, brand, minPrice, maxPrice, sort, inStock, prescriptionRequired } = req.query;
  if (!q || q.trim().length === 0) {
    return res.json({ success: true, data: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } });
  }

  let results = await SearchService.searchProducts(q, { category, brand, minPrice, maxPrice, sort, inStock, prescriptionRequired });

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
