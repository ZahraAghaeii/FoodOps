const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  imageUrl: {
    type: String,
    default: ''
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  stock: {
    type: Number,
    default: 100
  },
  prepTime: {
    type: Number,
    default: 15 // زمان آماده‌سازی به دقیقه (پیش‌فرض ۱۵ دقیقه)
  }
}, { timestamps: true });

module.exports = mongoose.model('MenuItem', menuItemSchema);