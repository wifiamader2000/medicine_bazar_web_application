import React from 'react';
import { formatPrice, productPrice } from '../../utils/apiData';

const POSReceipt = ({ order, componentRef }) => {
  if (!order) return null;

  return (
    <div className="hidden">
      <div ref={componentRef} className="p-8 bg-white text-black max-w-[80mm] mx-auto text-sm font-mono" style={{ fontFamily: 'monospace' }}>
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold mb-1">MEDICINE BAZAR</h2>
          <p className="text-xs">123 Pharmacy Road, Dhaka</p>
          <p className="text-xs">Phone: +880 1234 567890</p>
        </div>

        <div className="mb-4 text-xs border-b border-black border-dashed pb-4">
          <div className="flex justify-between">
            <span>Date:</span>
            <span>{new Date(order.createdAt).toLocaleString()}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Receipt No:</span>
            <span>{order.orderNumber || order.id || order._id}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Cashier:</span>
            <span>{order.cashierName || 'Admin'}</span>
          </div>
          {order.customerPhone && (
            <div className="flex justify-between mt-1">
              <span>Customer:</span>
              <span>{order.customerPhone}</span>
            </div>
          )}
        </div>

        <table className="w-full mb-4 text-xs">
          <thead>
            <tr className="border-b border-black border-dashed">
              <th className="text-left py-2">Item</th>
              <th className="text-center py-2">Qty</th>
              <th className="text-right py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item, index) => (
              <tr key={index}>
                <td className="py-2 pr-2">
                  <div className="font-bold">{item.name}</div>
                  <div className="text-[10px]">{formatPrice(productPrice(item))}</div>
                </td>
                <td className="py-2 text-center align-top">{item.quantity}</td>
                <td className="py-2 text-right align-top">
                  {formatPrice(productPrice(item) * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t border-black border-dashed pt-4 mb-6">
          <div className="flex justify-between mb-1">
            <span>Subtotal:</span>
            <span>{formatPrice(order.subtotal || 0)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between mb-1">
              <span>Discount:</span>
              <span>-{formatPrice(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold mt-2 pt-2 border-t border-black">
            <span>TOTAL:</span>
            <span>{formatPrice(order.total || 0)}</span>
          </div>
          <div className="flex justify-between mt-2 text-xs">
            <span>Payment Method:</span>
            <span className="uppercase">{order.paymentMethod || 'CASH'}</span>
          </div>
          {(order.tenderedAmount && order.tenderedAmount > 0) ? (
            <>
              <div className="flex justify-between mt-1 text-xs">
                <span>Tendered:</span>
                <span>{formatPrice(order.tenderedAmount)}</span>
              </div>
              <div className="flex justify-between mt-1 text-xs">
                <span>Change:</span>
                <span>{formatPrice(order.change || 0)}</span>
              </div>
            </>
          ) : null}
        </div>

        <div className="text-center text-xs mt-8">
          <p className="font-bold mb-1">Thank you for visiting!</p>
          <p>Please bring receipt for any returns.</p>
          <p className="mt-4">Software by Antigravity</p>
        </div>
      </div>
    </div>
  );
};

export default POSReceipt;
