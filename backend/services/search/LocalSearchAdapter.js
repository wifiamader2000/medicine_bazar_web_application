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
    const text = String(value || '').toLowerCase().trim();
    const q = String(query || '').toLowerCase().trim();
    if (!text || !q) return 0;
    
    // 1. Exact Match
    if (text === q) return 200;
    
    // 2. Starts with query
    if (text.startsWith(q)) {
      return 180 - Math.min(30, text.length - q.length);
    }
    
    // 3. Word starts with query
    const words = text.split(/\s+/);
    if (words.some(word => word.startsWith(q))) {
      return 150 - Math.min(30, text.length - q.length);
    }
    
    // 4. Substring match
    if (text.includes(q)) {
      return 100 - Math.min(40, text.indexOf(q)) - Math.min(20, text.length - q.length);
    }
    
    // 5. Ordered character subsequence
    let qi = 0;
    for (let i = 0; i < text.length && qi < q.length; i++) {
      if (text[i] === q[qi]) qi++;
    }
    if (qi === q.length) return 45;
    
    // 6. Levenshtein edit distance fuzzy match (for queries >= 3 chars to avoid noise)
    if (q.length >= 3) {
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
    
    return 0;
  }

  _productScore(product, q) {
    let maxScore = 0;
    
    const weights = {
      name: 1.0,
      nameBn: 1.0,
      genericName: 0.95,
      sku: 0.95,
      barcode: 0.95,
      aliases: 0.85,
      searchKeywords: 0.85,
      category: 0.8,
      manufacturer: 0.8,
      strength: 0.6,
      dosageForm: 0.6,
      uses: 0.6,
      drugClass: 0.6,
      indication: 0.6,
      indications: 0.6,
      pharmacology: 0.6
    };
    
    for (const field of SEARCH_FIELDS) {
      const value = product[field];
      if (!value) continue;
      const weight = weights[field] || 0.5;
      
      if (Array.isArray(value)) {
        for (const item of value) {
          const score = this._fuzzyScore(item, q) * weight;
          if (score > maxScore) maxScore = score;
        }
      } else {
        const score = this._fuzzyScore(value, q) * weight;
        if (score > maxScore) maxScore = score;
      }
    }
    
    return maxScore;
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
