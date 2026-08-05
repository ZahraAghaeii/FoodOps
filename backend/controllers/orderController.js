const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');

// @desc    ثبت سفارش جدید توسط مشتری (به همراه کسر خودکار موجودی)
// @route   POST /api/orders
// @access  Private (Customer)
exports.createOrder = async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'سبد خرید شما خالی است' });
    }

    let totalPrice = 0;
    const orderItems = [];
    const itemsToUpdate = [];

    // ۱. بررسی موجودی تمامی آیتم‌ها
    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItem);
      if (!menuItem) {
        return res.status(404).json({ message: `آیتم با شناسه ${item.menuItem} یافت نشد` });
      }
      if (!menuItem.isAvailable || menuItem.stock < item.quantity) {
        return res.status(400).json({ 
          message: `موجودی آیتم "${menuItem.name}" کافی نیست (موجودی فعلی: ${menuItem.stock})` 
        });
      }

      totalPrice += menuItem.price * item.quantity;
      orderItems.push({
        menuItem: menuItem._id,
        quantity: item.quantity,
        priceAtOrder: menuItem.price
      });

      itemsToUpdate.push({
        model: menuItem,
        quantity: item.quantity
      });
    }

    // ۲. کسر خودکار موجودی از دیتابیس
    for (const itemObj of itemsToUpdate) {
      itemObj.model.stock -= itemObj.quantity;
      if (itemObj.model.stock <= 0) {
        itemObj.model.stock = 0;
        itemObj.model.isAvailable = false;
      }
      await itemObj.model.save();
    }

    // ۳. ایجاد سفارش
    const order = await Order.create({
      customer: req.user._id,
      items: orderItems,
      totalPrice,
      status: 'Pending'
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
    const role = String(req.user.role || req.user.type || '').toLowerCase().trim();
    const isKitchenAllowed = 
      role.includes('kitchen') || 
      role.includes('staff') || 
      role.includes('cook') || 
      role.includes('chef') || 
      role.includes('admin');

    if (!isKitchenAllowed) {
      return res.status(403).json({ message: 'شما دسترسی لازم برای مشاهده داشبورد آشپزخانه را ندارید.' });
    }

    const orders = await Order.find({ status: { $ne: 'Delivered' } })
      .populate('customer', 'name email')
      .populate('items.menuItem', 'name price')
      .sort({ createdAt: 1 });

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

    order.status = 'Preparing';
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

    order.status = 'Ready';
    const updatedOrder = await order.save();

    res.json({ message: 'سفارش آماده تحویل شد', order: updatedOrder });
  } catch (error) {
    res.status(500).json({ message: 'خطا در تغییر وضعیت سفارش', error: error.message });
  }
};

// @desc    تحویل سفارش به مشتری (توسط صندوق‌دار/تحویل‌دهنده)
// @route   PATCH /api/orders/:id/deliver
// @access  Private (Cashier / Staff / Admin)
exports.deliverOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'سفارش یافت نشد' });
    }

    order.status = 'Delivered';
    const updatedOrder = await order.save();

    res.json({ message: 'سفارش با موفقیت تحویل مشتری شد', order: updatedOrder });
  } catch (error) {
    res.status(500).json({ message: 'خطا در تحویل سفارش', error: error.message });
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

exports.addToCart = async (req, res) => {
    try {
        const { itemId, quantity = 1 } = req.body;
        const item = await MenuItem.findById(itemId);

        if (!item || item.stock < quantity) {
            return res.status(400).json({ message: 'موجودی کافی نیست یا آیتم یافت نشد.' });
        }

        // کسر موجودی از دیتابیس
        item.stock -= quantity;
        await item.save();

        // پیدا کردن سفارشی که هنوز Pending است (سبد خرید)
        let cart = await Order.findOne({ customer: req.user._id, status: 'Pending' });

        if (!cart) {
            cart = new Order({ customer: req.user._id, items: [], status: 'Pending', totalPrice: 0 });
        }

        const existingItemIndex = cart.items.findIndex(i => i.menuItem.toString() === itemId);
        if (existingItemIndex > -1) {
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            cart.items.push({ menuItem: itemId, quantity, priceAtOrder: item.price });
        }

        cart.totalPrice += item.price * quantity;
        await cart.save();

        const totalItemsCount = cart.items.reduce((acc, curr) => acc + curr.quantity, 0);

        res.status(200).json({ message: 'به سبد خرید اضافه شد', totalItemsCount });
    } catch (error) {
        res.status(500).json({ message: 'خطای سرور', error: error.message });
    }
};

// حذف از سبد و بازگشت موجودی
exports.removeFromCart = async (req, res) => {
    try {
        const { itemId } = req.body;
        let cart = await Order.findOne({ customer: req.user._id, status: 'Pending' });

        if (!cart) return res.status(404).json({ message: 'سبد خریدی یافت نشد.' });

        const itemIndex = cart.items.findIndex(i => i.menuItem.toString() === itemId);
        if (itemIndex > -1) {
            const removedQuantity = cart.items[itemIndex].quantity;
            
            const menuItem = await MenuItem.findById(itemId);
            if (menuItem) {
                menuItem.stock += removedQuantity;
                await menuItem.save();
            }

            cart.totalPrice -= cart.items[itemIndex].priceAtOrder * removedQuantity;
            cart.items.splice(itemIndex, 1);
            await cart.save();

            const totalItemsCount = cart.items.reduce((acc, curr) => acc + curr.quantity, 0);
            res.status(200).json({ message: 'آیتم حذف شد و موجودی برگشت', totalItemsCount });
        } else {
            res.status(404).json({ message: 'آیتم در سبد شما نیست.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'خطای سرور' });
    }
};

// دریافت سبد خرید فعلی
exports.getCart = async (req, res) => {
    try {
        const cart = await Order.findOne({ customer: req.user._id, status: 'Pending' })
            .populate('items.menuItem', 'name price');
            
        if (!cart) {
            return res.status(200).json({ items: [], totalPrice: 0 });
        }
        
        res.status(200).json(cart);
    } catch (error) {
        res.status(500).json({ message: 'خطا در دریافت سبد خرید', error: error.message });
    }
};

// نهایی سازی سبد خرید و ارسال به آشپزخانه
exports.checkoutCart = async (req, res) => {
    try {
        // پیدا کردن سبد خرید (سفارش Pending) کاربر
        const cart = await Order.findOne({ customer: req.user._id, status: 'Pending' });

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: 'سبد خرید شما خالی است.' });
        }

        // تغییر وضعیت برای ورود به صف آشپزخانه
        cart.status = 'Preparing'; 
        await cart.save();

        res.status(200).json({ message: 'سفارش با موفقیت ثبت شد و در حال آماده‌سازی است.' });
    } catch (error) {
        res.status(500).json({ message: 'خطا در ثبت نهایی سفارش', error: error.message });
    }
};