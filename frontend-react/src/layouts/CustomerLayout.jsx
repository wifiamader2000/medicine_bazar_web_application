import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getStoredUser } from '../utils/auth';

const CustomerLayout = () => {
  const { token, user } = getStoredUser();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary text-white p-4 font-bold text-xl">CustomerLayout</header>
      <main className="flex-1 bg-background">
        <Outlet />
      </main>
    </div>
  );
};

export default CustomerLayout;
