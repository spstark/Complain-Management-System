const express = require('express');
const Complaint = require('../models/Complaint');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');
const User = require('../models/User'); // Added User model import

const router = express.Router();

router.post('/', authMiddleware, async (req, res) => {
  // Get user details to get their department
  const user = await User.findById(req.user.id);
  const complaint = new Complaint({ 
    ...req.body, 
    createdBy: req.user.id,
    department: user.department || 'General',
    date: new Date()
  });
  await complaint.save();
  // Custom log for add complaint
  const fs = require('fs');
  const path = require('path');
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
  const log = `[${formatted}] ${req.user.username} submitted complaint: '${complaint.title}'\n`;
  fs.appendFileSync(logFile, log);
  // Emit log update
  const io = req.app.get('io');
  io.emit('log_update', log);
  res.json(complaint);
});

router.get('/', authMiddleware, async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : { createdBy: req.user.id };
  const complaints = await Complaint.find(filter).populate('createdBy', 'username');
  res.json(complaints);
});

router.patch('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const complaint = await Complaint.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  // Custom log for change complaint status
  const fs = require('fs');
  const path = require('path');
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
  const log = `[${formatted}] ${req.user.username} changed status of complaint '${complaint.title}' to '${complaint.status}'\n`;
  fs.appendFileSync(logFile, log);
  // Emit log update
  const io = req.app.get('io');
  io.emit('log_update', log);
  res.json(complaint);
});

router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  await Complaint.findByIdAndDelete(req.params.id);
  // Custom log for delete complaint
  const fs = require('fs');
  const path = require('path');
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
  const log = `[${formatted}] ${req.user.username} deleted complaint '${complaint?.title || ''}'\n`;
  fs.appendFileSync(logFile, log);
  // Emit log update
  const io = req.app.get('io');
  io.emit('log_update', log);
  res.json({ message: 'Complaint deleted' });
});

module.exports = router;
