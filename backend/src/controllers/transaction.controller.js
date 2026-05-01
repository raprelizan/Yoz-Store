const { v4: uuidv4 } = require('uuid');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const SystemSetting = require('../models/SystemSetting');
const oneclick = require('../services/oneclick.service');
const { calculatePricing } = require('../utils/pricing');

exports.createTopup = async (req, res) => {
  const user = await User.findById(req.user.id);
  const settings = await SystemSetting.findOne();
  if (!settings?.serviceEnabled) return res.status(503).json({ message: 'Service disabled' });

  const amount = req.body.amount || req.body.value;
  const pricing = calculatePricing({ amount, pricingMode: settings.pricingMode, markupPercent: settings.markupPercent, fixedFee: settings.fixedFee });
  if (user.balance < pricing.costToUser) return res.status(400).json({ message: 'Insufficient balance' });

  const ref = req.body.ref || `tx-${uuidv4()}`;
  const payload = req.body.type === 'internet'
    ? { type: req.body.internetType || 'ADSL', number: req.body.number, value: amount, ref }
    : { plan_code: req.body.plan_code, MSSIDN: req.body.MSSIDN, amount, ref };

  user.balance -= pricing.costToUser; await user.save();
  const api = req.body.type === 'internet' ? await oneclick.sendInternet(payload) : await oneclick.sendMobile(payload);

  const tx = await Transaction.create({ user: user._id, type: req.body.type, servicePayload: payload, providerRef: api?.data?.topupRef, providerId: api?.data?.topupId, amount, ...pricing, status: 'PENDING', rawResponse: api });
  res.status(201).json({ transaction: tx, balance: user.balance });
};

exports.myTransactions = async (req, res) => res.json(await Transaction.find({ user: req.user.id }).sort({ createdAt: -1 }));
exports.allTransactions = async (req, res) => {
  const q = {};
  if (req.query.userId) q.user = req.query.userId;
  if (req.query.status) q.status = req.query.status;
  if (req.query.from || req.query.to) q.createdAt = { ...(req.query.from && { $gte: new Date(req.query.from) }), ...(req.query.to && { $lte: new Date(req.query.to) }) };
  res.json(await Transaction.find(q).populate('user', 'name email').sort({ createdAt: -1 }));
};
