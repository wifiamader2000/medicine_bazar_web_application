import React from 'react';
import { Trash2, Plus, Minus } from 'lucide-react';
import { formatPrice, productPrice } from '../../utils/apiData';

const POSCart = ({ items, onUpdateQuantity, onRemove }) => {
  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
        <svg className="w-16 h-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <p className="text-lg font-medium">No items in cart</p>
        <p className="text-sm">Scan barcode or search (F2) to add items</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <table className="w-full text-left border-collapse">
        <thead className="sticky top-0 bg-gray-50 shadow-sm z-10 text-xs uppercase text-gray-500">
          <tr>
            <th className="py-3 px-4 font-medium">Item</th>
            <th className="py-3 px-4 font-medium text-center">Qty</th>
            <th className="py-3 px-4 font-medium text-right">Price</th>
            <th className="py-3 px-4 font-medium text-right">Total</th>
            <th className="py-3 px-4 w-12"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((item, index) => {
            const price = productPrice(item);
            const total = price * item.quantity;
            
            return (
              <tr key={`${item.id || item._id}-${index}`} className="hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4">
                  <div className="font-semibold text-gray-900">{item.name}</div>
                  <div className="text-xs text-gray-500">{item.genericName || 'Medicine'}</div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-center gap-1 bg-white border border-gray-200 rounded-lg overflow-hidden w-24 mx-auto">
                    <button 
                      className="p-1.5 hover:bg-gray-100 text-gray-600 transition-colors"
                      onClick={() => onUpdateQuantity(item.id || item._id, -1)}
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-8 text-center font-bold text-gray-900">{item.quantity}</span>
                    <button 
                      className="p-1.5 hover:bg-gray-100 text-gray-600 transition-colors"
                      onClick={() => onUpdateQuantity(item.id || item._id, 1)}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </td>
                <td className="py-3 px-4 text-right text-gray-600">
                  {formatPrice(price)}
                </td>
                <td className="py-3 px-4 text-right font-bold text-gray-900">
                  {formatPrice(total)}
                </td>
                <td className="py-3 px-4 text-center">
                  <button 
                    className="p-2 text-gray-400 hover:text-alert hover:bg-alert/10 rounded-lg transition-colors"
                    onClick={() => onRemove(item.id || item._id)}
                    title="Remove item"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default POSCart;
