const express = require('express');
const router = express.Router();
const {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  updateMenuPrice,
  deleteMenuItem
} = require('../controllers/menuController');
const { protect, authorize } = require('../middleware/authMiddleware');

router
  .route('/')
  .get(getMenuItems)
  .post(protect, authorize('Admin'), createMenuItem);

// مسیر اختصاصی برای ویرایش سریع قیمت توسط ادمین
router
  .route('/:id/price')
  .patch(protect, authorize('Admin'), updateMenuPrice);

router
  .route('/:id')
  .put(protect, authorize('Admin'), updateMenuItem)
  .delete(protect, authorize('Admin'), deleteMenuItem);

module.exports = router;