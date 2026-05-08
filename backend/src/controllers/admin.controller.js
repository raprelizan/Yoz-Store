const SystemSetting = require('../models/SystemSetting');
const User = require('../models/User');
const oneclick = require('../services/oneclick.service');
const HttpError = require('../utils/httpError');

exports.getSettings = async (req, res) => {
  const settings = await SystemSetting.findOne();
  const safe = settings ? settings.toObject() : null;
  if (safe?.apiKey) safe.apiKey = `${safe.apiKey.slice(0, 4)}••••${safe.apiKey.slice(-4)}`;
  res.json({ success: true, settings: safe });
};

exports.updateSettings = async (req, res) => {
  const settings = await SystemSetting.findOneAndUpdate({}, req.body, { upsert: true, new: true, runValidators: true });
  res.json({ success: true, settings });
};

exports.verifyApi = async (req, res) => res.json({ success: true, validation: await oneclick.validateKey() });

exports.users = async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ success: true, users: users.map((user) => user.toSafeJSON()) });
};

exports.updateUser = async (req, res) => {
  const updates = {};
  if (typeof req.body.balance === 'number') updates.balance = req.body.balance;
  if (typeof req.body.isActive === 'boolean') updates.isActive = req.body.isActive;
  if (!Object.keys(updates).length) throw new HttpError(400, 'No supported updates supplied');

  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!user) throw new HttpError(404, 'User not found');
  res.json({ success: true, user: user.toSafeJSON() });
};
