const SystemSetting = require('../models/SystemSetting');
const User = require('../models/User');
const oneclick = require('../services/oneclick.service');

exports.getSettings = async (_, res) => res.json(await SystemSetting.findOne());
exports.updateSettings = async (req, res) => res.json(await SystemSetting.findOneAndUpdate({}, req.body, { upsert: true, new: true }));
exports.verifyApi = async (_, res) => res.json(await oneclick.validateKey());
exports.users = async (_, res) => res.json(await User.find().select('-password'));
exports.updateUser = async (req, res) => {
  const { balance, isActive } = req.body;
  res.json(await User.findByIdAndUpdate(req.params.id, { balance, isActive }, { new: true }).select('-password'));
};
