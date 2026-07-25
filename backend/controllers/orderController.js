const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');

// @desc    ثبت سفارش جدید توسط مشتری
// @route   POST /api/orders
// @access  Private (Customer)
exports.createOrder = async (req, res) => {
  try {
    const { items } = req.body; // items: [{ menuItem: "ID", quantity: 2 }]

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'سبد خرید شما خالی است' });
    }

    let totalPrice = 0;
    const orderItems = [];

    // محاسبه قیمت کل و صحت‌سنجی آیتم‌ها
    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItem);
      if (!menuItem) {
        return res.status(404).json({ message: `آیتم با شناسه ${item.menuItem} یافت نشد` });
      }
      if (!menuItem.isAvailable) {
        return res.status(400).json({ message: `آیتم ${menuItem.name} در حال حاضر موجود نیست` });
      }

      totalPrice += menuItem.price * item.quantity;
      orderItems.push({
        menuItem: menuItem._id,
        quantity: item.quantity,
        price: menuItem.price
      });
    }

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      totalPrice,
      status: 'Pending'
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: 'خطا در ثبت سفارش', error: error.message });
  }
};

// @desc    مشاهده سفارش‌های کاربر جاری
// @route   GET /api/orders/my-orders
// @access  Private (Customer)
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('items.menuItem', 'name price imageUrl')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'خطا در دریافت سفارش‌ها', error: error.message });
  }
};

// @desc    مشاهده تمام سفارش‌ها (مشاهده صف آشپزخانه)
// @route   GET /api/orders
// @access  Private (Staff / Admin)
exports.getAllOrders = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    const orders = await Order.find(filter)
      .populate('user', 'name email')
      .populate('items.menuItem', 'name price')
      .sort({ createdAt: 1 }); // سفارش‌های قدیمی‌تر اول صف قرار می‌گیرند

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'خطا در دریافت صف آشپزخانه', error: error.message });
  }
};

// @desc    تغییر وضعیت سفارش (توسط پرسنل آشپزخانه)
// @route   PUT /api/orders/:id/status
// @access  Private (Staff / Admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body; // 'Pending' | 'Preparing' | 'Ready' | 'Completed' | 'Cancelled'
    const allowedStatuses = ['Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'وضعیت وارد شده نامعتبر است' });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'سفارش یافت نشد' });
    }

    order.status = status;
    const updatedOrder = await order.save();

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: 'خطا در تغییر وضعیت سفارش', error: error.message });
  }
};