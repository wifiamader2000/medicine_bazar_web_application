/**
 * BaseSearchAdapter
 * Abstract class defining the contract for search adapters.
 */
class BaseSearchAdapter {
  constructor(name) {
    this.name = name;
  }

  /**
   * Search for products
   * @param {string} query The search query string
   * @param {object} options Filter and sorting options
   * @returns {Promise<Array>} List of matching products
   */
  async searchProducts(query, options = {}) {
    throw new Error('Method searchProducts() not implemented');
  }

  /**
   * Fetch autocomplete suggestions
   * @param {string} query The query string
   * @param {number} limit Maximum suggestions to return
   * @returns {Promise<Array>} List of suggestion objects
   */
  async getSuggestions(query, limit = 10) {
    throw new Error('Method getSuggestions() not implemented');
  }
}

module.exports = BaseSearchAdapter;
