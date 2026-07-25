const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

// دریافت سفارش‌های کاربر جاری و ثبت سفارش جدید
router
  .route('/')
  .post(protect, createOrder)
  .get(protect, authorize('Staff', 'Admin'), getAllOrders);

router.get('/my-orders', protect, getMyOrders);

// تغییر وضعیت سفارش توسط پرسنل/ادمین
router.put('/:id/status', protect, authorize('Staff', 'Admin'), updateOrderStatus);

module.exports = router;