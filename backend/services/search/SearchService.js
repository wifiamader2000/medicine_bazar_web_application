const path = require('path');
const config = require('../../config');
const DataService = require('../DataService');

const LocalSearchAdapter = require('./LocalSearchAdapter');
const MeiliSearchAdapter = require('./MeiliSearchAdapter');
const AlgoliaSearchAdapter = require('./AlgoliaSearchAdapter');

// Load provider from configuration
const provider = config.search.provider || 'local';

let activeAdapter;

switch (provider.toLowerCase()) {
  case 'meilisearch':
    activeAdapter = new MeiliSearchAdapter();
    break;
  case 'algolia':
  case 'typesense':
    activeAdapter = new AlgoliaSearchAdapter();
    break;
  case 'local':
  default:
    activeAdapter = new LocalSearchAdapter();
    break;
}

class SearchService {
  /**
   * Get the name of the currently active search adapter
   * @returns {string} Name of active provider
   */
  static getProviderName() {
    return activeAdapter.name;
  }

  /**
   * Search for products and log search details
   * @param {string} query Search input
   * @param {object} options Category/brand/price filters
   * @returns {Promise<Array>} Matching products
   */
  static async searchProducts(query, options = {}) {
    const q = (query || '').trim();
    const results = await activeAdapter.searchProducts(q, options);
    
    // Asynchronously log search details
    try {
      const resultCount = results.length;
      DataService.get('searchLogs').create({
        query: q,
        resultCount,
        noResultTerm: resultCount === 0 ? q : null,
        timestamp: new Date().toISOString(),
        filters: options,
        source: 'search_products'
      });
    } catch (err) {
      console.error('[SearchService] Error saving search log:', err.message);
    }

    return results;
  }

  /**
   * Fetch autocomplete suggestions
   * @param {string} query Search query
   * @param {number} limit Max suggestions
   * @returns {Promise<Array>} Enriched autocomplete suggestion objects
   */
  static async getSuggestions(query, limit = 10) {
    const q = (query || '').trim();
    const results = await activeAdapter.getSuggestions(q, limit);
    
    // Log suggestions query (with low count if it yielded nothing)
    try {
      const resultCount = results.length;
      DataService.get('searchLogs').create({
        query: q,
        resultCount,
        noResultTerm: resultCount === 0 ? q : null,
        timestamp: new Date().toISOString(),
        source: 'search_suggestions'
      });
    } catch (err) {
      // Quiet fail to not disrupt autocomplete response times
    }

    return results;
  }

  /**
   * Fetch all queries that returned zero matches
   * @returns {Array} List of logged search queries with zero results
   */
  static getNoResultSearches() {
    try {
      const logs = DataService.get('searchLogs').findAll({});
      // Filter logs with zero results and group or sort them
      return logs
        .filter(log => log.resultCount === 0 || log.noResultTerm)
        .map(log => ({
          query: log.query || log.noResultTerm,
          timestamp: log.timestamp,
          source: log.source,
          filters: log.filters || {}
        }))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (err) {
      console.error('[SearchService] Error loading search logs:', err.message);
      return [];
    }
  }
}

module.exports = SearchService;
