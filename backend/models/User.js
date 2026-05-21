const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, default: '' },
  role: { type: String, enum: ['admin', 'manager', 'pharmacist', 'cashier', 'customer'], default: 'customer' },
  active: { type: Boolean, default: true },
  emailVerified: { type: Boolean, default: false },
  lastLogin: { type: Date },
  resetPasswordTokenHash: { type: String, default: null },
  resetPasswordExpiresAt: { type: Date, default: null },
  resetPasswordRequestedAt: { type: Date, default: null },
  resetPasswordUsedAt: { type: Date, default: null },
  oldId: { type: String, default: null } // To store the original JSON ID
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
