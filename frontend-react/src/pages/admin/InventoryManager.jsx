import React, { useState, useEffect } from 'react';
import { Package, Search, Edit2 } from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/common/Button';

const InventoryManager = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [editingStock, setEditingStock] = useState(null);
  const [newStock, setNewStock] = useState('');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/products?page=${page}&limit=20&search=${encodeURIComponent(search)}`);
      setProducts(res.data?.data || res.data || []);
      setTotalPages(res.data?.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch inventory', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, search]);

  const handleUpdateStock = async (e) => {
    e.preventDefault();
    if (!editingStock) return;
    
    try {
      await api.put(`/products/${editingStock.id || editingStock._id}`, {
        stockQuantity: parseInt(newStock) || 0
      });
      setEditingStock(null);
      setNewStock('');
      fetchProducts();
    } catch (err) {
      alert('Failed to update stock');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="text-primary" /> Inventory Manager
          </h1>
          <p className="text-sm text-gray-500 mt-1">Monitor and adjust product stock levels</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-4 font-bold text-sm text-gray-700">Product Name</th>
                <th className="p-4 font-bold text-sm text-gray-700">Category</th>
                <th className="p-4 font-bold text-sm text-gray-700">Price</th>
                <th className="p-4 font-bold text-sm text-gray-700">Current Stock</th>
                <th className="p-4 font-bold text-sm text-gray-700">Status</th>
                <th className="p-4 font-bold text-sm text-gray-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">Loading inventory...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">No products found.</td>
                </tr>
              ) : (
                products.map((product) => {
                  const stock = product.stockQuantity || 0;
                  const isLow = stock > 0 && stock <= 10;
                  const isOut = stock === 0;
                  
                  return (
                    <tr key={product.id || product._id} className="hover:bg-gray-50/50">
                      <td className="p-4">
                        <div className="font-bold text-gray-900">{product.name}</div>
                        <div className="text-xs text-gray-500">{product.genericName || '-'}</div>
                      </td>
                      <td className="p-4 text-sm text-gray-600">{product.category}</td>
                      <td className="p-4 text-sm font-medium text-gray-900">৳{product.price || product.mrp}</td>
                      <td className="p-4 text-sm font-bold text-gray-900">{stock}</td>
                      <td className="p-4">
                        {isOut ? (
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">Out of Stock</span>
                        ) : isLow ? (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded">Low Stock</span>
                        ) : (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">In Stock</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => { setEditingStock(product); setNewStock(stock.toString()); }}
                          className="text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-50 transition-colors inline-flex items-center justify-center"
                          title="Adjust Stock"
                        >
                          <Edit2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex justify-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
            <span className="flex items-center px-4 text-sm font-medium text-gray-600">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
          </div>
        )}
      </div>

      {/* Stock Edit Modal */}
      {editingStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">Update Stock</h2>
              <button onClick={() => setEditingStock(null)} className="text-gray-400 hover:text-gray-600 transition-colors">&times;</button>
            </div>
            <form onSubmit={handleUpdateStock} className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-4">Product: <strong className="text-gray-900">{editingStock.name}</strong></p>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Stock Quantity</label>
                <input required type="number" min="0" value={newStock} onChange={e => setNewStock(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
              </div>
              <div className="pt-4 flex gap-3">
                <Button type="button" variant="outline" onClick={() => setEditingStock(null)} className="flex-1">Cancel</Button>
                <Button type="submit" className="flex-1">Update</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManager;
