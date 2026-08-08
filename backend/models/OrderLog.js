const mongoose = require('mongoose');

const orderLogSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  oldStatus: { type: String },
  newStatus: { type: String, required: true },
  changedAt: { type: Date, default: Date.now },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // کسی که وضعیت را تغییر داده
});

module.exports = mongoose.model('OrderLog', orderLogSchema);