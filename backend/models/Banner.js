const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  imageUrl: { type: String, required: true },
  link: { type: String },
  active: { type: Boolean, default: true },
  type: { type: String, default: 'homepage' }, // homepage, category, offer, campaign
  startDate: { type: Date },
  endDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Banner', bannerSchema);
