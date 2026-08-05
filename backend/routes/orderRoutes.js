const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getKitchenOrders,
  startOrder,
  readyOrder,
  deliverOrder,
  updateOrderStatus,
  addToCart,
  removeFromCart,
  getCart,
  checkoutCart
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

// تمامی روت‌ها نیازمند احراز هویت هستند
router.use(protect);

// ثبت سفارش جدید توسط مشتری
router.post('/', createOrder);

// دریافت سفارش‌های کاربر جاری
router.get('/me', getMyOrders);
router.get('/my-orders', getMyOrders);

// روت‌های صف آشپزخانه (شامل تمام عناوین شغلی آشپزخانه)
router.get(
  '/kitchen',
  authorize('Kitchen Staff', 'Kitchen', 'Cook', 'Chef', 'Admin', 'Cashier'),
  getKitchenOrders
);
router.patch(
  '/:id/start',
  authorize('Kitchen Staff', 'Kitchen', 'Cook', 'Chef', 'Admin'),
  startOrder
);
router.patch(
  '/:id/ready',
  authorize('Kitchen Staff', 'Kitchen', 'Cook', 'Chef', 'Admin'),
  readyOrder
);

// روت‌های تحویل سفارش (فقط مخصوص صندوق‌دار و ادمین)
router.patch('/:id/deliver', authorize('Cashier', 'Admin'), deliverOrder);
router.patch('/:id/status', authorize('Cashier', 'Admin'), updateOrderStatus);

// مسیرهای جدید سبد خرید (مخصوص مشتری)
router.post('/cart/add', authorize('Customer'), addToCart);
router.post('/cart/remove', authorize('Customer'), removeFromCart);
router.get('/cart', authorize('Customer'), getCart);
router.post('/checkout', authorize('Customer'), checkoutCart);

module.exports = router;