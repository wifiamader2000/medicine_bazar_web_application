const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  customerId: { type: String, required: true },
  customerName: { type: String },
  customerPhone: { type: String },
  fileUrl: { type: String, required: true },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'rejected'], default: 'pending' },
  note: { type: String },
  oldId: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Prescription', prescriptionSchema);
