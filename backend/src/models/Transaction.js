const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['mobile', 'internet'], required: true },
  servicePayload: { type: Object, required: true },
  providerRef: String,
  providerId: String,
  amount: Number,
  costToUser: Number,
  profitMode: { type: String, enum: ['percent', 'fixed'] },
  profitValue: Number,
  profitAmount: Number,
  status: { type: String, default: 'PENDING' },
  rawResponse: Object
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
