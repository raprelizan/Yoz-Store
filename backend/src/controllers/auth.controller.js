const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const HttpError = require('../utils/httpError');

function sign(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  const exists = await User.findOne({ email });
  if (exists) throw new HttpError(409, 'Email is already registered');
  const hashed = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, password: hashed });
  res.status(201).json({ success: true, token: sign(user), user: user.toSafeJSON() });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await bcrypt.compare(password, user.password))) throw new HttpError(401, 'Invalid credentials');
  if (!user.isActive) throw new HttpError(403, 'Account is blocked');
  res.json({ success: true, token: sign(user), user: user.toSafeJSON() });
};

exports.me = async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json({ success: true, user: user.toSafeJSON() });
};
