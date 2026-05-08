const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  apiKey: { type: String, required: true },
  baseUrl: { type: String, required: true, default: 'https://api.oneclickdz.com' },
  serviceEnabled: { type: Boolean, default: true },
  pricingMode: { type: String, enum: ['percent', 'fixed'], default: 'percent' },
  markupPercent: { type: Number, default: 10, min: 0, max: 100 },
  fixedFee: { type: Number, default: 0, min: 0 }
}, { timestamps: true });

module.exports = mongoose.model('SystemSetting', schema);
