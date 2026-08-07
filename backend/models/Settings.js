const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  openingTime: {
    type: String, // فرمت "HH:MM" مثلاً "08:00"
    default: "08:00"
  },
  closingTime: {
    type: String, // فرمت "HH:MM" مثلاً "22:00"
    default: "22:00"
  },
  isSystemOpen: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);