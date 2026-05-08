const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, unique: true, required: true, lowercase: true, trim: true, index: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
  balance: { type: Number, default: 0, min: 0 },
  isActive: { type: Boolean, default: true, index: true }
}, { timestamps: true });

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    balance: this.balance,
    isActive: this.isActive,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('User', userSchema);
