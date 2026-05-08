const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['mobile', 'internet'], required: true, index: true },
  servicePayload: { type: Object, required: true },
  providerRef: { type: String, index: true },
  providerId: String,
  amount: { type: Number, required: true },
  costToUser: { type: Number, required: true },
  profitMode: { type: String, enum: ['percent', 'fixed'], required: true },
  profitValue: { type: Number, required: true },
  profitAmount: { type: Number, required: true },
  status: { type: String, enum: ['PENDING', 'HANDLING', 'FULFILLED', 'REFUNDED', 'FAILED', 'UNKNOWN_ERROR'], default: 'PENDING', index: true },
  rawResponse: Object,
  statusResponse: Object,
  errorMessage: String,
  refundProcessed: { type: Boolean, default: false }
}, { timestamps: true });

transactionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
