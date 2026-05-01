const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  apiKey: String,
  baseUrl: String,
  serviceEnabled: { type: Boolean, default: true },
  pricingMode: { type: String, enum: ['percent', 'fixed'], default: 'percent' },
  markupPercent: { type: Number, default: 10 },
  fixedFee: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('SystemSetting', schema);
