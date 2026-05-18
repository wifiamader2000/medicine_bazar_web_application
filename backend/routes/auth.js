const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { generateToken, authenticate, logAudit } = require('../middleware/auth');
const DataService = require('../services/DataService');
const config = require('../config');

const loginAttempts = new Map();
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function sanitizeUser(user) {
  if (!user) return user;
  const {
    password,
    resetPasswordTokenHash,
    resetPasswordExpiresAt,
    resetPasswordRequestedAt,
    resetPasswordUsedAt,
    ...safeUser
  } = user;
  return safeUser;
}

function isStrongPassword(password) {
  return typeof password === 'string'
    && password.length >= 8
    && /[a-z]/.test(password)
    && /[A-Z]/.test(password)
    && /\d/.test(password)
    && /[^A-Za-z0-9]/.test(password);
}

function checkLoginRateLimit(identifier) {
  const now = Date.now();
  const record = loginAttempts.get(identifier);
  if (!record) return { allowed: true, remaining: config.security.loginRateLimit.max };
  const windowStart = now - config.security.loginRateLimit.windowMs;
  record.attempts = record.attempts.filter(t => t > windowStart);
  if (record.attempts.length >= config.security.loginRateLimit.max) {
    return { allowed: false, remaining: 0, retryAfter: Math.ceil((record.attempts[0] + config.security.loginRateLimit.windowMs - now) / 1000) };
  }
  return { allowed: true, remaining: config.security.loginRateLimit.max - record.attempts.length };
}

function recordLoginAttempt(identifier) {
  if (!loginAttempts.has(identifier)) {
    loginAttempts.set(identifier, { attempts: [] });
  }
  loginAttempts.get(identifier).attempts.push(Date.now());
}

router.post('/register', asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email and password are required', messageBn: 'নাম, ইমেইল এবং পাসওয়ার্ড প্রয়োজন' });
  }
  if (password.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters', messageBn: 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষর হতে হবে' });
  }
  const existing = DataService.get('users').findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ success: false, message: 'Email already registered', messageBn: 'এই ইমেইল ইতিমধ্যে নিবন্ধিত' });
  }
  const hashedPassword = await bcrypt.hash(password, config.security.bcryptRounds);
  const user = DataService.get('users').create({
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    phone: phone || '',
    role: 'customer',
    active: true,
    emailVerified: false,
    avatar: null,
    loyaltyPoints: 0,
  });
  const token = generateToken(user);
  logAudit(req, 'register', { userId: user.id, email: user.email });
  res.status(201).json({ success: true, message: 'Registration successful', messageBn: 'নিবন্ধন সফল', data: { user: sanitizeUser(user), token } });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required', messageBn: 'ইমেইল এবং পাসওয়ার্ড প্রয়োজন' });
  }
  const rateLimit = checkLoginRateLimit(email.toLowerCase());
  if (!rateLimit.allowed) {
    logAudit(req, 'login_rate_limited', { email });
    return res.status(429).json({
      success: false, message: `Too many login attempts. Try again in ${rateLimit.retryAfter} seconds`,
      messageBn: `অনেক বেশি লগইন চেষ্টা। ${rateLimit.retryAfter} সেকেন্ড পরে আবার চেষ্টা করুন`,
      needsCaptcha: true,
    });
  }
  const user = DataService.get('users').findOne({ email: email.toLowerCase() });
  if (!user || !user.active) {
    recordLoginAttempt(email.toLowerCase());
    logAudit(req, 'login_failed', { email, reason: 'user_not_found' });
    return res.status(401).json({ success: false, message: 'Invalid email or password', messageBn: 'ভুল ইমেইল বা পাসওয়ার্ড' });
  }
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    recordLoginAttempt(email.toLowerCase());
    logAudit(req, 'login_failed', { email, reason: 'wrong_password' });
    const failedCount = loginAttempts.get(email.toLowerCase())?.attempts.length || 0;
    return res.status(401).json({
      success: false, message: 'Invalid email or password', messageBn: 'ভুল ইমেইল বা পাসওয়ার্ড',
      needsCaptcha: failedCount >= config.security.captchaAfterFailedAttempts,
    });
  }
  const token = generateToken(user);
  DataService.get('users').update(user.id, { lastLogin: new Date().toISOString() });
  logAudit(req, 'login_success', { userId: user.id, email: user.email, role: user.role });
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.isProduction(),
    maxAge: 24 * 60 * 60 * 1000,
  });
  res.json({ success: true, message: 'Login successful', messageBn: 'লগইন সফল', data: { user: sanitizeUser(user), token } });
}));

router.get('/me', authenticate, asyncHandler(async (req, res) => {
  const user = DataService.get('users').findById(req.user.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, data: sanitizeUser(user) });
}));

router.put('/profile', authenticate, asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  const updates = {};
  if (name) updates.name = name;
  if (phone !== undefined) updates.phone = phone;
  const user = DataService.get('users').update(req.user.id, updates);
  res.json({ success: true, message: 'Profile updated', messageBn: 'প্রোফাইল আপডেট হয়েছে', data: sanitizeUser(user) });
}));

router.put('/change-password', authenticate, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Current and new password required' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
  }
  const user = DataService.get('users').findById(req.user.id);
  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) {
    return res.status(401).json({ success: false, message: 'Current password is incorrect', messageBn: 'বর্তমান পাসওয়ার্ড ভুল' });
  }
  const hashed = await bcrypt.hash(newPassword, config.security.bcryptRounds);
  DataService.get('users').update(req.user.id, { password: hashed });
  logAudit(req, 'password_changed', { userId: req.user.id });
  res.json({ success: true, message: 'Password changed successfully', messageBn: 'পাসওয়ার্ড পরিবর্তন সফল' });
}));

router.post('/forgot-password', asyncHandler(async (req, res) => {
  const identifier = String(req.body.email || req.body.identifier || '').trim().toLowerCase();
  if (!identifier) {
    logAudit(req, 'password_reset_request_failed', { reason: 'missing_identifier' });
    return res.status(400).json({ success: false, message: 'Email or mobile number is required', messageBn: 'ইমেইল অথবা মোবাইল নম্বর প্রয়োজন' });
  }

  const users = DataService.get('users');
  const user = identifier.includes('@')
    ? users.findOne({ email: identifier })
    : users.findAll({}).find(u => String(u.phone || '').replace(/\D/g, '') === identifier.replace(/\D/g, ''));

  const response = {
    success: true,
    message: 'If an account matches, password reset instructions will be sent.',
    messageBn: 'অ্যাকাউন্ট মিললে পাসওয়ার্ড রিসেট নির্দেশনা পাঠানো হবে।',
  };

  if (!user || !user.active) {
    logAudit(req, 'password_reset_requested', { identifierType: identifier.includes('@') ? 'email' : 'phone', matched: false });
    return res.json(response);
  }

  const token = crypto.randomBytes(32).toString('hex');
  users.update(user.id, {
    resetPasswordTokenHash: hashResetToken(token),
    resetPasswordExpiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString(),
    resetPasswordRequestedAt: new Date().toISOString(),
    resetPasswordUsedAt: null,
  });
  logAudit(req, 'password_reset_requested', { userId: user.id, email: user.email, identifierType: identifier.includes('@') ? 'email' : 'phone', matched: true });

  if (!config.isProduction() && req.body.debug === true) {
    response.data = { resetLink: `/reset-password.html?token=${token}` };
  }
  res.json(response);
}));

router.post('/reset-password', asyncHandler(async (req, res) => {
  const token = String(req.body.token || '').trim();
  const newPassword = String(req.body.password || req.body.newPassword || '');
  const confirmPassword = String(req.body.confirmPassword || '');

  if (!token || !newPassword || !confirmPassword) {
    logAudit(req, 'password_reset_failed', { reason: 'missing_fields' });
    return res.status(400).json({ success: false, message: 'Token, new password and confirmation are required' });
  }
  if (newPassword !== confirmPassword) {
    logAudit(req, 'password_reset_failed', { reason: 'password_mismatch' });
    return res.status(400).json({ success: false, message: 'Passwords do not match' });
  }
  if (!isStrongPassword(newPassword)) {
    logAudit(req, 'password_reset_failed', { reason: 'weak_password' });
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters and include uppercase, lowercase, number and symbol' });
  }

  const tokenHash = hashResetToken(token);
  const users = DataService.get('users');
  const user = users.findAll({}).find(u => u.resetPasswordTokenHash === tokenHash);
  if (!user || !user.resetPasswordExpiresAt || new Date(user.resetPasswordExpiresAt).getTime() < Date.now()) {
    logAudit(req, 'password_reset_failed', { reason: 'invalid_or_expired_token' });
    return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
  }

  const hashed = await bcrypt.hash(newPassword, config.security.bcryptRounds);
  users.update(user.id, {
    password: hashed,
    resetPasswordTokenHash: null,
    resetPasswordExpiresAt: null,
    resetPasswordUsedAt: new Date().toISOString(),
  });
  logAudit(req, 'password_reset_success', { userId: user.id, email: user.email });
  res.clearCookie('token');
  res.json({ success: true, message: 'Password reset successful. You can now login.' });
}));

router.post('/logout', authenticate, asyncHandler(async (req, res) => {
  logAudit(req, 'logout', { userId: req.user.id });
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully', messageBn: 'সফলভাবে লগআউট হয়েছে' });
}));

module.exports = router;
