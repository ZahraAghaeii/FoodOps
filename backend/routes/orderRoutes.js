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
  checkoutCart,
  cancelOrderCustomer,
  getSalesReports,
  getAllOrders,
  getWorkingHours,
  updateWorkingHours
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

// روت عمومی دریافت ساعات کاری
router.get('/working-hours', getWorkingHours);

// تمامی روت‌های زیر نیازمند احراز هویت هستند
router.use(protect);

// آپدیت ساعات کاری توسط ادمین
router.patch('/working-hours', authorize('Admin'), updateWorkingHours);

// ثبت سفارش جدید توسط مشتری
router.post('/', createOrder);

// دریافت سفارش‌های کاربر جاری
router.get('/me', getMyOrders);
router.get('/my-orders', getMyOrders);

// روت‌های صف آشپزخانه
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

// روت‌های تحویل سفارش
router.patch('/:id/deliver', authorize('Cashier', 'Admin'), deliverOrder);
router.patch('/:id/status', authorize('Cashier', 'Admin'), updateOrderStatus);

// مسیرهای جدید سبد خرید
router.post('/cart/add', authorize('Customer'), addToCart);
router.post('/cart/remove', authorize('Customer'), removeFromCart);
router.get('/cart', authorize('Customer'), getCart);
router.post('/checkout', authorize('Customer'), checkoutCart);
router.post('/:id/cancel', authorize('Customer'), cancelOrderCustomer);
router.get('/reports', authorize('Admin'), getSalesReports);
router.get('/all', authorize('Admin'), getAllOrders);

module.exports = router;