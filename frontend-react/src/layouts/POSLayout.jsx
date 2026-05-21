import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getStoredUser } from '../utils/auth';

const POSLayout = () => {
  const { token, user } = getStoredUser();
  
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin' && user.role !== 'cashier') {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="bg-trust text-white p-3 flex justify-between items-center shadow-md">
        <h1 className="font-bold text-lg">Medicine Bazar POS</h1>
        <span className="text-sm">{user.name} ({user.role})</span>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default POSLayout;
