const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  openingTime: {
    type: String, 
    default: "08:00"
  },
  closingTime: {
    type: String, 
    default: "22:00"
  },
  isSystemOpen: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);