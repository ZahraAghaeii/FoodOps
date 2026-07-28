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

    // محاسبه قیمت کل و صحت‌سنجی آیتم‌ها در سمت سرور
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
        priceAtOrder: menuItem.price
      });
    }

    // اصلاح فیلد customer و status مطابق با مدل دیتابیس
    const order = await Order.create({
      customer: req.user._id, // تغییر user به customer
      items: orderItems,
      totalPrice,
      status: 'Pending' // تغییر به Pending با حرف اول بزرگ
    });

    res.status(201).json(order);
  } catch (error) {
    console.error('خطا در ثبت سفارش:', error);
    res.status(500).json({ message: 'خطا در ثبت سفارش', error: error.message });
  }
};

// @desc    مشاهده سفارش‌های کاربر جاری
// @route   GET /api/orders/me
// @access  Private (Customer)
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user._id })
      .populate('items.menuItem', 'name price imageUrl')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'خطا در دریافت سفارش‌ها', error: error.message });
  }
};

// @desc    مشاهده تمام سفارش‌ها (مشاهده صف آشپزخانه)
// @route   GET /api/orders/kitchen
// @access  Private (Kitchen Staff / Admin)
exports.getKitchenOrders = async (req, res) => {
  try {
    const orders = await Order.find({ status: { $ne: 'Delivered' } })
      .populate('customer', 'name email') // تغییر user به customer
      .populate('items.menuItem', 'name price')
      .sort({ createdAt: 1 }); // سفارش‌های قدیمی‌تر اول صف قرار می‌گیرند

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'خطا در دریافت صف آشپزخانه', error: error.message });
  }
};

// @desc    شروع آماده‌سازی سفارش (توسط پرسنل آشپزخانه)
// @route   PATCH /api/orders/:id/start
// @access  Private (Kitchen Staff / Admin)
exports.startOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'سفارش یافت نشد' });
    }

    order.status = 'Preparing'; // هماهنگ با Enum مدل
    const updatedOrder = await order.save();

    res.json({ message: 'وضعیت سفارش به در حال آماده‌سازی تغییر یافت', order: updatedOrder });
  } catch (error) {
    res.status(500).json({ message: 'خطا در تغییر وضعیت سفارش', error: error.message });
  }
};

// @desc    تغییر وضعیت سفارش به آماده تحویل
// @route   PATCH /api/orders/:id/ready
// @access  Private (Kitchen Staff / Admin)
exports.readyOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'سفارش یافت نشد' });
    }

    order.status = 'Ready'; // هماهنگ با Enum مدل
    const updatedOrder = await order.save();

    res.json({ message: 'سفارش آماده تحویل شد', order: updatedOrder });
  } catch (error) {
    res.status(500).json({ message: 'خطا در تغییر وضعیت سفارش', error: error.message });
  }
};

// @desc    تغییر وضعیت دستی/عمومی سفارش
// @route   PATCH /api/orders/:id/status
// @access  Private (Staff / Admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['Pending', 'Preparing', 'Ready', 'Delivered', 'Cancelled'];

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