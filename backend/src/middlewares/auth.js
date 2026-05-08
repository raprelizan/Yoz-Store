const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.auth = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user || !user.isActive) return res.status(401).json({ success: false, message: 'Account is inactive or unavailable' });
    req.user = { id: user._id.toString(), role: user.role, email: user.email };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

exports.adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Forbidden' });
  next();
};
