const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getKitchenOrders,
  startOrder,
  readyOrder,
  deliverOrder,
  updateOrderStatus
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

// تمامی روت‌ها نیازمند احراز هویت هستند
router.use(protect);

// ثبت سفارش جدید توسط مشتری
router.post('/', createOrder);

// دریافت سفارش‌های کاربر جاری
router.get('/me', getMyOrders);
router.get('/my-orders', getMyOrders);

// روت‌های صف آشپزخانه و تحویل سفارش
router.get('/kitchen', getKitchenOrders);
router.patch('/:id/start', startOrder);
router.patch('/:id/ready', readyOrder);
router.patch('/:id/deliver', deliverOrder);
router.patch('/:id/status', updateOrderStatus);

module.exports = router;