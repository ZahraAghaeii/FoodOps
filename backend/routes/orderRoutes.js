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
const { protect, authorize } = require('../middleware/authMiddleware');

// تمامی روت‌ها نیازمند احراز هویت هستند
router.use(protect);

// ثبت سفارش جدید توسط مشتری
router.post('/', createOrder);

// دریافت سفارش‌های کاربر جاری
router.get('/me', getMyOrders);
router.get('/my-orders', getMyOrders);

// روت‌های صف آشپزخانه
router.get('/kitchen', authorize('Kitchen', 'Admin', 'Cashier'), getKitchenOrders);
router.patch('/:id/start', authorize('Kitchen', 'Admin'), startOrder);
router.patch('/:id/ready', authorize('Kitchen', 'Admin'), readyOrder);

// روت‌های تحویل سفارش (فقط مخصوص صندوق‌دار و ادمین)
router.patch('/:id/deliver', authorize('Cashier', 'Admin'), deliverOrder);
router.patch('/:id/status', authorize('Cashier', 'Admin'), updateOrderStatus);

module.exports = router;