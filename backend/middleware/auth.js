const jwt = require('jsonwebtoken');
const config = require('../config');
const DataService = require('../services/DataService');

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: '24h' }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch {
    return null;
  }
}

function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return req.cookies?.token || req.query?.token || null;
}

function authenticate(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required', messageBn: 'লগইন প্রয়োজন' });
  }
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token', messageBn: 'অবৈধ বা মেয়াদোত্তীর্ণ টোকেন' });
  }
  const user = DataService.get('users').findById(decoded.id);
  if (!user || !user.active) {
    return res.status(401).json({ success: false, message: 'Account not found or disabled', messageBn: 'অ্যাকাউন্ট পাওয়া যায়নি বা নিষ্ক্রিয়' });
  }
  req.user = { id: user.id, email: user.email, role: user.role, name: user.name };
  next();
}

function optionalAuth(req, res, next) {
  const token = extractToken(req);
  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      const user = DataService.get('users').findById(decoded.id);
      if (user && user.active) {
        req.user = { id: user.id, email: user.email, role: user.role, name: user.name };
      }
    }
  }
  next();
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      logAudit(req, 'unauthorized_access', { requiredRoles: roles, userRole: req.user.role });
      return res.status(403).json({ success: false, message: 'Access denied', messageBn: 'প্রবেশাধিকার নেই' });
    }
    next();
  };
}

function adminOnly(req, res, next) {
  return authorize('admin')(req, res, next);
}

function staffOnly(req, res, next) {
  return authorize('admin', 'manager', 'pharmacist', 'cashier')(req, res, next);
}

function pharmacistAccess(req, res, next) {
  return authorize('admin', 'manager', 'pharmacist')(req, res, next);
}

function cashierAccess(req, res, next) {
  return authorize('admin', 'manager', 'cashier')(req, res, next);
}

function managerAccess(req, res, next) {
  return authorize('admin', 'manager')(req, res, next);
}

function logAudit(req, action, details = {}) {
  try {
    DataService.get('auditLogs').create({
      action,
      userId: req.user?.id || null,
      userEmail: req.user?.email || null,
      userRole: req.user?.role || null,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent'],
      path: req.originalUrl,
      method: req.method,
      details,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
}

module.exports = {
  generateToken,
  verifyToken,
  extractToken,
  authenticate,
  optionalAuth,
  authorize,
  adminOnly,
  staffOnly,
  pharmacistAccess,
  cashierAccess,
  managerAccess,
  logAudit,
};
