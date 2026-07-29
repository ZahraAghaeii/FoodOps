const express = require('express');
const router = express.Router();
const {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  updateMenuPrice,
  updateStock,
  toggleAvailability,
  deleteMenuItem
} = require('../controllers/menuController');
const { protect, authorize } = require('../middleware/authMiddleware');

router
  .route('/')
  .get(getMenuItems)
  .post(protect, authorize('Admin'), createMenuItem);

// مسیرهای اختصاصی ادمین برای مدیریت قیمت و موجودی
router
  .route('/:id/price')
  .patch(protect, authorize('Admin'), updateMenuPrice);

router
  .route('/:id/stock')
  .patch(protect, authorize('Admin'), updateStock);

router
  .route('/:id/availability')
  .patch(protect, authorize('Admin'), toggleAvailability);

router
  .route('/:id')
  .put(protect, authorize('Admin'), updateMenuItem)
  .delete(protect, authorize('Admin'), deleteMenuItem);

module.exports = router;