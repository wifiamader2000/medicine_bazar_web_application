const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nameBn: { type: String },
  genericName: { type: String },
  strength: { type: String },
  dosageForm: { type: String },
  manufacturer: { type: String },
  category: { type: String },
  mrp: { type: Number, default: 0 },
  sellingPrice: { type: Number, default: 0 },
  unitType: { type: String },
  packSize: { type: String },
  prescriptionRequired: { type: Boolean, default: false },
  uses: { type: String },
  dosage: { type: String },
  sideEffects: { type: String },
  warning: { type: String },
  precautions: { type: String },
  contraindications: { type: String },
  storage: { type: String },
  pregnancyWarning: { type: String },
  lactationWarning: { type: String },
  alternatives: [{ type: String }],
  disclaimer: { type: String },
  aliases: [{ type: String }],
  searchKeywords: [{ type: String }],
  stockQuantity: { type: Number, default: 0 },
  batchNumber: { type: String },
  expiryDate: { type: String },
  active: { type: Boolean, default: true },
  featured: { type: Boolean, default: false },
  soldCount: { type: Number, default: 0 },
  imageUrl: { type: String },
  images: [{ type: String }],
  slug: { type: String },
  mediaId: { type: String },
  oldId: { type: String, default: null }
}, { timestamps: true });

productSchema.index({ name: 'text', nameBn: 'text', genericName: 'text', aliases: 'text', searchKeywords: 'text' });

module.exports = mongoose.model('Product', productSchema);
