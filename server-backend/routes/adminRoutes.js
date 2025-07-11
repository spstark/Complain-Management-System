const express = require('express');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const bcrypt = require('bcryptjs');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

const router = express.Router();

router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find({}, '-password'); // Exclude password field
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

router.delete('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    await User.findByIdAndDelete(req.params.id);
    // Custom log for delete user
    const logFile = path.join(__dirname, '../log.txt');
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
    const log = `[${formatted}] ${req.user.username} deleted user ${user.username}\n`;
    fs.appendFileSync(logFile, log);
    // Emit log update
    const io = req.app.get('io');
    io.emit('log_update', log);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

router.put('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const { username, email, password } = req.body;
    user.username = username;
    user.email = email;
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }
    await user.save();
    // Custom log for update user
    const logFile = path.join(__dirname, '../log.txt');
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
    const log = `[${formatted}] ${req.user.username} updated user ${username}\n`;
    fs.appendFileSync(logFile, log);
    // Emit log update
    const io = req.app.get('io');
    io.emit('log_update', log);
    res.json({ message: 'User updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update user' });
  }
});

router.post('/create-user', authMiddleware, adminMiddleware, async (req, res) => {
  const { username, email, password, department } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const newUser = new User({ username, email, password: hash, department });
  await newUser.save();
  // Custom log for add user
  const logFile = path.join(__dirname, '../log.txt');
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
  const log = `[${formatted}] ${req.user.username} added user ${username}\n`;
  fs.appendFileSync(logFile, log);
  // Emit log update
  const io = req.app.get('io');
  io.emit('log_update', log);
  res.json({ message: 'User created successfully' });
});

router.get('/stats', authMiddleware, adminMiddleware, async (req, res) => {
  const totalComplaints = await Complaint.countDocuments();
  const statusAgg = await Complaint.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  const departmentAgg = await Complaint.aggregate([
    { $group: { _id: '$department', count: { $sum: 1 } } }
  ]);
  const mostActiveUsersAgg = await Complaint.aggregate([
    { $group: { _id: '$createdBy', count: { $sum: 1 } } },
    { $sort: { count: -1 } }, { $limit: 5 }
  ]);
  // Populate usernames for mostActiveUsers, but exclude admins
  const userIds = mostActiveUsersAgg.map(u => u._id);
  const users = await User.find({ _id: { $in: userIds } });
  const mostActiveUsers = mostActiveUsersAgg
    .map(u => {
      const user = users.find(user => user._id.equals(u._id));
      return user && user.role !== 'admin' ? { username: user.username, count: u.count } : null;
    })
    .filter(Boolean);

  const statusCounts = {};
  statusAgg.forEach(s => { statusCounts[s._id] = s.count; });
  const departmentCounts = {};
  departmentAgg.forEach(d => { departmentCounts[d._id] = d.count; });

  res.json({
    totalComplaints,
    statusCounts,
    departmentCounts,
    mostActiveUsers
  });
});

router.get('/logs', authMiddleware, adminMiddleware, (req, res) => {
  const logData = fs.readFileSync(path.join(__dirname, '../log.txt'), 'utf-8');
  res.json({ logs: logData.split('\n').slice(-20).reverse() }); // recent logs
});

module.exports = router;
