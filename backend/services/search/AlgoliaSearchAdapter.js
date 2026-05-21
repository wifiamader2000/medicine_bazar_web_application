const BaseSearchAdapter = require('./BaseSearchAdapter');

/**
 * AlgoliaSearchAdapter
 * Placeholder for future Algolia or Typesense integration.
 */
class AlgoliaSearchAdapter extends BaseSearchAdapter {
  constructor() {
    super('algolia');
    console.log('[Search] Algolia Search Adapter loaded (Placeholder).');
  }

  async searchProducts(query, options = {}) {
    console.log(`[Search Placeholder] Searching for products via Algolia: "${query}"`);
    // Future implementation will connect to Algolia algoliasearch client
    // index.search(query, options)
    return [];
  }

  async getSuggestions(query, limit = 10) {
    console.log(`[Search Placeholder] Getting suggestions via Algolia for: "${query}"`);
    return [];
  }
}

module.exports = AlgoliaSearchAdapter;
