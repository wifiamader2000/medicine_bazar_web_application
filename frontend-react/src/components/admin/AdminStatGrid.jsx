import React from 'react';

const AdminStatGrid = ({ stats }) => {
  const StatBox = ({ title, value, subtitle, colorClass }) => (
    <div className={`bg-white rounded-xl p-5 shadow-sm border border-gray-100 border-l-4 ${colorClass}`}>
      <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
      <StatBox title="Today's Sales" value={`৳${stats?.todaySales || 0}`} colorClass="border-l-primary" />
      <StatBox title="Monthly Sales" value={`৳${stats?.monthlySales || 0}`} colorClass="border-l-blue-500" />
      <StatBox title="Total Products" value={stats?.totalProducts || 0} colorClass="border-l-indigo-500" />
      <StatBox title="Stocked Products" value={stats?.stockedProducts || 0} colorClass="border-l-teal-500" />
      
      <StatBox title="Pending Orders" value={stats?.pendingOrders || 0} colorClass="border-l-amber-500" />
      <StatBox title="Pending Payments" value={stats?.pendingPaymentVerification || 0} colorClass="border-l-orange-500" />
      <StatBox title="Low Stock Items" value={stats?.lowStock || 0} colorClass="border-l-red-500" />
      <StatBox title="POS Sales (Today)" value={`৳${stats?.posSales || 0}`} colorClass="border-l-purple-500" />
    </div>
  );
};

export default AdminStatGrid;
