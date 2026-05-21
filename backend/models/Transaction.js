const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  type: { type: String, required: true, enum: ['income', 'expense'] },
  category: { type: String, required: true }, // sales, purchase, salary, utilities, refund, etc.
  description: { type: String },
  date: { type: Date, default: Date.now },
  referenceId: { type: String }, // e.g. Order ID, POS Session ID, Supplier ID
  paymentMethod: { type: String },
  recordedBy: { type: String } // User ID or Name
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
