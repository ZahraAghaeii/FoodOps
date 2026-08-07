const express = require('express');
const router = express.Router();
const {
  createDiscount,
  getAllDiscounts,
  applyDiscount,
  deleteDiscount,
  getPublicDiscounts
} = require('../controllers/discountController');
const { protect, admin } = require('../middleware/authMiddleware');

// روت عمومی برای دریافت کدهای تخفیف فعال توسط مشتریان
router.get('/public', protect, getPublicDiscounts);

router.post('/apply', protect, applyDiscount);
router.get('/', protect, admin, getAllDiscounts);
router.post('/', protect, admin, createDiscount);
router.delete('/:id', protect, admin, deleteDiscount);

module.exports = router;