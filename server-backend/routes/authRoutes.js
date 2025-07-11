const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !await bcrypt.compare(password, user.password)) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user._id, role: user.role, username: user.username }, process.env.JWT_SECRET);
  // Custom log for login
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formatted = `(${day}/${month}/${year}) ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  const log = `[${formatted}] ${user.username} logged in\n`;
  fs.appendFileSync(path.join(__dirname, '../log.txt'), log);
  // Emit log update
  const io = req.app.get('io');
  io.emit('log_update', log);
  res.json({ token, role: user.role, username: user.username });
});

router.post('/logout', authMiddleware, (req, res) => {
  // Try to get username from req.user if available, else 'Guest'
  const user = req.user?.username || 'Guest';
  // Custom log message for logout
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formatted = `(${day}/${month}/${year}) ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  const log = `[${formatted}] ${user} logged out\n`;
  fs.appendFileSync(path.join(__dirname, '../log.txt'), log);
  // Emit log update
  const io = req.app.get('io');
  io.emit('log_update', log);
  res.json({ message: 'Logged out successfully' });
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'No user with that email' });

  // Generate token
  const token = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 1000 * 60 * 60; // 1 hour
  await user.save();

  // Send email
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${token}`;
  await transporter.sendMail({
    from: 'CMS <cms@example.com>',
    to: user.email,
    subject: 'Password Reset Request',
    html: `<p>You requested a password reset. Click <a href="${resetUrl}">here</a> to reset your password. This link is valid for 1 hour.</p>`
  });

  // Log the request
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formatted = `(${day}/${month}/${year}) ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  const log = `[${formatted}] ${user.username} requested password reset\n`;
  fs.appendFileSync(path.join(__dirname, '../log.txt'), log);
  const io = req.app.get('io');
  io.emit('log_update', log);

  res.json({ message: 'Password reset email sent' });
});

// Reset Password
router.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });
  if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

  user.password = await bcrypt.hash(password, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  // Log the password change
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formatted = `(${day}/${month}/${year}) ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  const log = `[${formatted}] ${user.username} changed password via reset\n`;
  fs.appendFileSync(path.join(__dirname, '../log.txt'), log);
  const io = req.app.get('io');
  io.emit('log_update', log);

  res.json({ message: 'Password has been reset' });
});

module.exports = router;
