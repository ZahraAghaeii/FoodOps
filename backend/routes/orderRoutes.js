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
  updateWorkingHours,
  getPublicReadyOrders
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');
const OrderLog = require('../models/OrderLog'); // وارد کردن مدل لاگ

// روت‌های عمومی
router.get('/working-hours', getWorkingHours);
router.get('/public-ready', getPublicReadyOrders);

router.use(protect);

// روت جدید برای دریافت لاگ یک سفارش
router.get('/:id/logs', authorize('Admin', 'Kitchen Staff', 'Cashier'), async (req, res) => {
  try {
    const logs = await OrderLog.find({ orderId: req.params.id })
      .populate('changedBy', 'name role')
      .sort({ changedAt: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'خطا در دریافت لاگ‌ها' });
  }
});

router.patch('/working-hours', authorize('Admin'), updateWorkingHours);
router.post('/', createOrder);
router.get('/me', getMyOrders);
router.get('/my-orders', getMyOrders);

router.get('/kitchen', authorize('Kitchen Staff', 'Kitchen', 'Cook', 'Chef', 'Admin', 'Cashier'), getKitchenOrders);
router.patch('/:id/start', authorize('Kitchen Staff', 'Kitchen', 'Cook', 'Chef', 'Admin'), startOrder);
router.patch('/:id/ready', authorize('Kitchen Staff', 'Kitchen', 'Cook', 'Chef', 'Admin'), readyOrder);
router.patch('/:id/deliver', authorize('Cashier', 'Admin'), deliverOrder);
router.patch('/:id/status', authorize('Cashier', 'Admin'), updateOrderStatus);

router.post('/cart/add', authorize('Customer'), addToCart);
router.post('/cart/remove', authorize('Customer'), removeFromCart);
router.get('/cart', authorize('Customer'), getCart);
router.post('/checkout', authorize('Customer'), checkoutCart);
router.post('/:id/cancel', authorize('Customer'), cancelOrderCustomer);
router.get('/reports', authorize('Admin'), getSalesReports);
router.get('/all', authorize('Admin'), getAllOrders);

module.exports = router;