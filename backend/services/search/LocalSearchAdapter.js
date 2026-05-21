const BaseSearchAdapter = require('./BaseSearchAdapter');
const DataService = require('../DataService');

const SEARCH_FIELDS = [
  'name', 'nameBn', 'genericName', 'manufacturer', 'category', 'strength', 'dosageForm', 'sku', 'barcode',
  'aliases', 'uses', 'searchKeywords', 'drugClass', 'indication', 'indications', 'pharmacology',
];

class LocalSearchAdapter extends BaseSearchAdapter {
  constructor() {
    super('local');
  }

  _includes(value, query) {
    if (!value) return false;
    if (Array.isArray(value)) return value.some(item => this._includes(item, query));
    return String(value).toLowerCase().includes(query);
  }

  _fuzzyScore(value, query) {
    const text = String(value || '').toLowerCase();
    const q = String(query || '').toLowerCase();
    if (!text || !q) return 0;
    if (text.includes(q)) return 100 - Math.min(40, text.indexOf(q));
    
    let qi = 0;
    for (let i = 0; i < text.length && qi < q.length; i++) {
      if (text[i] === q[qi]) qi++;
    }
    if (qi === q.length) return 45;
    
    const maxDistance = Math.max(1, Math.ceil(q.length * 0.34));
    if (Math.abs(text.length - q.length) > Math.max(8, q.length)) return 0;
    
    const prev = Array.from({ length: q.length + 1 }, (_, i) => i);
    for (let i = 1; i <= text.length; i++) {
      let left = i;
      let diagonal = i - 1;
      for (let j = 1; j <= q.length; j++) {
        const old = prev[j];
        const cost = text[i - 1] === q[j - 1] ? 0 : 1;
        prev[j] = Math.min(prev[j] + 1, left + 1, diagonal + cost);
        left = prev[j];
        diagonal = old;
      }
    }
    return prev[q.length] <= maxDistance ? 35 - prev[q.length] : 0;
  }

  _productScore(product, q) {
    const fields = SEARCH_FIELDS.flatMap(field => {
      const value = product[field];
      return Array.isArray(value) ? value : [value];
    }).filter(Boolean);
    return Math.max(0, ...fields.map(value => this._fuzzyScore(value, q)));
  }

  async searchProducts(query, options = {}) {
    const q = (query || '').trim();
    if (!q) return [];

    let results = DataService.get('products').findAll({})
      .map(product => ({ product, score: this._productScore(product, q) }))
      .filter(item => item.product.active !== false && item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.product);

    return results;
  }

  _entitySuggestions(storeName, fields, q, type, limit) {
    const query = q.toLowerCase();
    return DataService.get(storeName).findAll({})
      .filter(item => item.active !== false && fields.some(field => this._includes(item[field], query)))
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

  async getSuggestions(query, limit = 10) {
    const q = (query || '').trim();
    if (!q) return [];

    const results = await this.searchProducts(q);
    const productSuggestions = results
      .slice(0, limit)
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

    const genericSuggestions = this._entitySuggestions('generics', ['name', 'genericName', 'drugClass', 'indication', 'indications'], q, 'generic', limit);
    const manufacturerSuggestions = this._entitySuggestions('manufacturers', ['name'], q, 'manufacturer', limit);
    const indicationSuggestions = this._entitySuggestions('indications', ['name'], q, 'indication', limit);
    const drugClassSuggestions = this._entitySuggestions('drugClasses', ['name'], q, 'drug_class', limit);

    const seen = new Set();
    const suggestions = [...productSuggestions, ...genericSuggestions, ...manufacturerSuggestions, ...indicationSuggestions, ...drugClassSuggestions]
      .filter(item => {
        const key = `${item.type}:${String(item.name || '').toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, limit);

    return suggestions;
  }
}

module.exports = LocalSearchAdapter;
