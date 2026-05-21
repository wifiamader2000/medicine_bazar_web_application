const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  nameBn: { type: String },
  genericName: { type: String },
  quantity: { type: Number, required: true },
  unit: { type: String },
  price: { type: Number, required: true },
  mrp: { type: Number, required: true },
  total: { type: Number, required: true }
}, { _id: false });

const orderStatusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  note: { type: String }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  customerId: { type: String, required: true },
  customerName: { type: String },
  customerEmail: { type: String },
  items: [orderItemSchema],
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  couponCode: { type: String, default: null },
  deliveryCharge: { type: Number, default: 0 },
  total: { type: Number, required: true },
  shippingAddress: {
    name: { type: String },
    phone: { type: String },
    address: { type: String },
    city: { type: String }
  },
  paymentMethod: { type: String, default: 'cod' },
  transactionId: { type: String },
  paymentStatus: { type: String, default: 'pending' },
  orderStatus: { type: String, default: 'pending' },
  note: { type: String },
  statusHistory: [orderStatusHistorySchema],
  paymentProofUrl: { type: String },
  paymentVerifiedBy: { type: String },
  paymentVerifiedAt: { type: Date },
  oldId: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
