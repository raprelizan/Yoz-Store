const { v4: uuidv4 } = require('uuid');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const SystemSetting = require('../models/SystemSetting');
const oneclick = require('../services/oneclick.service');
const { calculatePricing } = require('../utils/pricing');
const HttpError = require('../utils/httpError');

const terminalStatuses = ['FULFILLED', 'REFUNDED', 'FAILED', 'UNKNOWN_ERROR'];

exports.createTopup = async (req, res) => {
  const settings = await SystemSetting.findOne();
  if (!settings?.serviceEnabled) throw new HttpError(503, 'Top-up service is currently disabled');

  const amount = req.body.type === 'internet' ? req.body.value : req.body.amount;
  const pricing = calculatePricing({
    amount,
    pricingMode: settings.pricingMode,
    markupPercent: settings.markupPercent,
    fixedFee: settings.fixedFee
  });

  const ref = req.body.ref || `yoz-${uuidv4()}`;
  const payload = req.body.type === 'internet'
    ? { type: req.body.internetType, number: req.body.number, value: pricing.amount, ref }
    : { plan_code: req.body.plan_code, MSSIDN: req.body.MSSIDN, amount: pricing.amount, ref };

  const user = await User.findOneAndUpdate(
    { _id: req.user.id, balance: { $gte: pricing.costToUser }, isActive: true },
    { $inc: { balance: -pricing.costToUser } },
    { new: true }
  );
  if (!user) throw new HttpError(400, 'Insufficient balance or inactive account');

  let tx;
  try {
    tx = await Transaction.create({ user: user._id, type: req.body.type, servicePayload: payload, providerRef: ref, ...pricing, status: 'PENDING' });
  } catch (error) {
    await User.findByIdAndUpdate(req.user.id, { $inc: { balance: pricing.costToUser } });
    throw error;
  }

  try {
    const api = req.body.type === 'internet' ? await oneclick.sendInternet(payload) : await oneclick.sendMobile(payload);
    tx.providerRef = api?.data?.topupRef || ref;
    tx.providerId = api?.data?.topupId;
    tx.rawResponse = api;
    tx.status = 'HANDLING';
    await tx.save();
    const balance = (await User.findById(req.user.id)).balance;
    return res.status(201).json({ success: true, transaction: tx, balance });
  } catch (error) {
    await User.findByIdAndUpdate(req.user.id, { $inc: { balance: pricing.costToUser } });
    tx.status = 'FAILED';
    tx.errorMessage = error.message;
    tx.rawResponse = error.response?.data;
    await tx.save();
    throw error;
  }
};

exports.myTransactions = async (req, res) => {
  const transactions = await Transaction.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(100);
  res.json({ success: true, transactions });
};

exports.allTransactions = async (req, res) => {
  const q = {};
  if (req.query.userId) q.user = req.query.userId;
  if (req.query.status) q.status = req.query.status;
  if (req.query.type) q.type = req.query.type;
  if (req.query.from || req.query.to) {
    q.createdAt = {
      ...(req.query.from && { $gte: new Date(req.query.from) }),
      ...(req.query.to && { $lte: new Date(req.query.to) })
    };
  }
  const transactions = await Transaction.find(q).populate('user', 'name email').sort({ createdAt: -1 }).limit(500);
  res.json({ success: true, transactions });
};

exports.checkStatus = async (req, res) => {
  const tx = await Transaction.findById(req.params.id);
  if (!tx) throw new HttpError(404, 'Transaction not found');
  if (req.user.role !== 'admin' && tx.user.toString() !== req.user.id) throw new HttpError(403, 'Forbidden');
  if (!tx.providerRef) throw new HttpError(400, 'Transaction reference is missing');

  const result = tx.type === 'internet' ? await oneclick.checkInternetByRef(tx.providerRef) : await oneclick.checkMobileByRef(tx.providerRef);
  const providerStatus = result?.data?.status;
  tx.statusResponse = result;
  if (providerStatus) tx.status = providerStatus;
  await tx.save();

  if (tx.status === 'REFUNDED' && !tx.refundProcessed) {
    await User.findByIdAndUpdate(tx.user, { $inc: { balance: tx.costToUser } });
    tx.refundProcessed = true;
    await tx.save();
  }

  res.json({ success: true, transaction: tx, terminal: terminalStatuses.includes(tx.status) });
};

exports.adminStats = async (req, res) => {
  const [summary] = await Transaction.aggregate([
    { $group: { _id: null, revenue: { $sum: '$costToUser' }, profit: { $sum: '$profitAmount' }, count: { $sum: 1 } } }
  ]);
  const users = await User.countDocuments();
  const activeUsers = await User.countDocuments({ isActive: true });
  res.json({ success: true, stats: { revenue: summary?.revenue || 0, profit: summary?.profit || 0, transactions: summary?.count || 0, users, activeUsers } });
};
