import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { unwrapData } from '../../utils/apiData';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const roleDefaultPath = (user) => {
    if (user.role === 'admin') return '/admin';
    if (user.role === 'cashier') return '/pos';
    return '/account';
  };

  const safeRedirectPath = (user) => {
    const redirect = searchParams.get('redirect') || searchParams.get('next');
    if (!redirect || !redirect.startsWith('/') || redirect.startsWith('//')) return roleDefaultPath(user);
    if (redirect.startsWith('/admin') && user.role !== 'admin') return roleDefaultPath(user);
    if (redirect.startsWith('/pos') && user.role !== 'admin' && user.role !== 'cashier') return roleDefaultPath(user);
    return redirect;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = unwrapData(res, {});
      if (!token || !user) {
        throw new Error('Login response did not include a session');
      }
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      navigate(safeRedirectPath(user), { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-primary mb-6 text-center">Login</h2>
        {error && <p className="text-alert mb-4 text-center">{error}</p>}
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Email</label>
            <input 
              type="email" 
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required 
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Password</label>
            <input 
              type="password" 
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required 
            />
          </div>
          <button type="submit" className="w-full bg-primary text-white p-2 rounded hover:bg-primary-dark transition">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
