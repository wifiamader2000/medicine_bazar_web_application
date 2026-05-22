const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subtitle: { type: String },
  titleBn: { type: String },
  subtitleBn: { type: String },
  imageUrl: { type: String, required: true },
  mobileImageUrl: { type: String },
  desktopImageUrl: { type: String },
  type: { 
    type: String, 
    enum: ['hero', 'offer', 'category', 'prescription', 'lab-test', 'payment', 'footer', 'homepage', 'campaign'],
    default: 'hero' 
  },
  link: { type: String },
  targetUrl: { type: String },
  ctaText: { type: String },
  ctaUrl: { type: String },
  priority: { type: Number, default: 0 },
  backgroundGradient: { type: String },
  active: { type: Boolean, default: true },
  startDate: { type: Date },
  endDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Banner', bannerSchema);

