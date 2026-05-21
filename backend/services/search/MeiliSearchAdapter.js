const BaseSearchAdapter = require('./BaseSearchAdapter');

/**
 * MeiliSearchAdapter
 * Placeholder for future Meilisearch engine integration.
 */
class MeiliSearchAdapter extends BaseSearchAdapter {
  constructor() {
    super('meilisearch');
    console.log('[Search] MeiliSearch Adapter loaded (Placeholder).');
  }

  async searchProducts(query, options = {}) {
    console.log(`[Search Placeholder] Searching for products via Meilisearch: "${query}"`);
    // Future implementation will connect to Meilisearch client
    // client.index('products').search(query, options)
    return [];
  }

  async getSuggestions(query, limit = 10) {
    console.log(`[Search Placeholder] Getting suggestions via Meilisearch for: "${query}"`);
    return [];
  }
}

module.exports = MeiliSearchAdapter;
