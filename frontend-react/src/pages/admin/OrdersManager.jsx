import React, { useEffect, useState } from 'react';
import { PackageCheck, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';

const OrdersManager = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders?limit=50');
      setOrders(res.data?.data || res.data?.orders || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Online Orders</h1>
          <p className="text-sm text-slate-500">Customer checkout, prescription orders, payment verification and delivery follow-up.</p>
        </div>
        <Button onClick={loadOrders} variant="secondary" className="flex items-center gap-2">
          <RefreshCw size={16} /> Refresh
        </Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center"><Loading /></div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <PackageCheck size={42} className="mx-auto mb-3 text-primary" />
            <h2 className="font-bold text-slate-900">No orders yet</h2>
            <p className="text-sm">New website orders will appear here after checkout.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="text-left p-4">Order</th>
                  <th className="text-left p-4">Customer</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Payment</th>
                  <th className="text-right p-4">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr key={order.id || order._id} className="hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-900">{order.orderNumber || order.id}</td>
                    <td className="p-4 text-slate-600">{order.customerName || order.name || order.phone || 'Customer'}</td>
                    <td className="p-4"><span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-bold text-primary-dark">{order.status || 'pending'}</span></td>
                    <td className="p-4 text-slate-600">{order.paymentStatus || order.paymentMethod || 'manual/COD'}</td>
                    <td className="p-4 text-right font-bold">৳{order.total || order.grandTotal || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersManager;
