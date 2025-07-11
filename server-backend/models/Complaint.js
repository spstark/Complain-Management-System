const mongoose = require('mongoose');
const complaintSchema = new mongoose.Schema({
  title: String,
  description: String,
  department: String,
  status: { type: String, default: 'Pending' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Complaint', complaintSchema);
