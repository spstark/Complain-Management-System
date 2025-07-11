const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'employee' },
  department: { type: String, default: 'General' },
  resetPasswordToken: String,
  resetPasswordExpires: Date
});
module.exports = mongoose.model('User', userSchema);
