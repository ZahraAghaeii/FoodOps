const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Settings = require('../models/Settings');
const Discount = require('../models/Discount');
const OrderLog = require('../models/OrderLog'); 

//  ثبت لاگ تغییر وضعیت سفارش
const addOrderLog = async (orderId, oldStatus, newStatus, userId) => {
  try {
    await OrderLog.create({
      orderId,
      oldStatus,
      newStatus,
      changedBy: userId
    });
  } catch (err) {
    console.error('خطا در ثبت لاگ سفارش:', err);
  }
};

// بررسی باز بودن سیستم در زمان فعلی
const checkIsWorkingHours = async () => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({ openingTime: "08:00", closingTime: "22:00", isSystemOpen: true });
  }

  if (!settings.isSystemOpen) {
    return { isOpen: false, message: 'سفارش‌گیری در حال حاضر توسط ادمین غیرفعال شده است.' };
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [openHour, openMin] = settings.openingTime.split(':').map(Number);
  const [closeHour, closeMin] = settings.closingTime.split(':').map(Number);

  const openMinutes = openHour * 60 + openMin;
  const closeMinutes = closeHour * 60 + closeMin;

  if (currentMinutes < openMinutes || currentMinutes > closeMinutes) {
    return {
      isOpen: false,
      message: `سفارش‌گیری خارج از ساعات کاری است. (ساعات کاری: از ${settings.openingTime} تا ${settings.closingTime})`
    };
  }

  return { isOpen: true };
};

// دریافت ساعات کاری سیستم
exports.getWorkingHours = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({ openingTime: "08:00", closingTime: "22:00", isSystemOpen: true });
    }
    const check = await checkIsWorkingHours();
    res.json({ 
      ...settings._doc, 
      isOpenNow: check.isOpen, 
      statusMessage: check.message || 'سفارش‌گیری فعال است' 
    });
  } catch (error) {
    res.status(500).json({ message: 'خطا در دریافت تنظیمات' });
  }
};

// آپدیت ساعات کاری توسط ادمین
exports.updateWorkingHours = async (req, res) => {
  try {
    const { openingTime, closingTime, isSystemOpen } = req.body;
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }
    if (openingTime) settings.openingTime = openingTime;
    if (closingTime) settings.closingTime = closingTime;
    if (isSystemOpen !== undefined) settings.isSystemOpen = isSystemOpen;

    await settings.save();
    res.json({ message: 'ساعات کاری با موفقیت بروزرسانی شد', settings });
  } catch (error) {
    res.status(500).json({ message: 'خطا در بروزرسانی ساعات کاری' });
  }
};

// ثبت سفارش جدید توسط مشتری
exports.createOrder = async (req, res) => {
  try {
    const workingCheck = await checkIsWorkingHours();
    if (!workingCheck.isOpen) {
      return res.status(400).json({ message: workingCheck.message });
    }

    const { items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'سبد خرید شما خالی است' });
    }

    let totalPrice = 0;
    const orderItems = [];
    const itemsToUpdate = [];
    let maxPrepTime = 15;

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

      const itemPrepTime = menuItem.prepTime || 15;
      if (itemPrepTime > maxPrepTime) {
        maxPrepTime = itemPrepTime;
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

    for (const itemObj of itemsToUpdate) {
      itemObj.model.stock -= itemObj.quantity;
      if (itemObj.model.stock <= 0) {
        itemObj.model.stock = 0;
        itemObj.model.isAvailable = false;
      }
      await itemObj.model.save();
    }

    const estimatedReadyAt = new Date(Date.now() + maxPrepTime * 60 * 1000);

    const order = await Order.create({
      customer: req.user._id,
      items: orderItems,
      totalPrice,
      status: 'Pending',
      prepTimeMinutes: maxPrepTime,
      estimatedReadyAt: estimatedReadyAt
    });

    // ثبت لاگ ایجاد سفارش اولیه
    await addOrderLog(order._id, null, 'Pending', req.user._id);

    res.status(201).json(order);
  } catch (error) {
    console.error('خطا در ثبت سفارش:', error);
    res.status(500).json({ message: 'خطا در ثبت سفارش', error: error.message });
  }
};

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

exports.startOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'سفارش یافت نشد' });

    const oldStatus = order.status;
    order.status = 'Preparing';
    const updatedOrder = await order.save();

    // ثبت لاگ تغییر وضعیت
    await addOrderLog(order._id, oldStatus, 'Preparing', req.user._id);

    res.json({ message: 'وضعیت سفارش به در حال آماده‌سازی تغییر یافت', order: updatedOrder });
  } catch (error) {
    res.status(500).json({ message: 'خطا در تغییر وضعیت سفارش', error: error.message });
  }
};

exports.readyOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'سفارش یافت نشد' });

    const oldStatus = order.status;
    order.status = 'Ready';
    const updatedOrder = await order.save();

    // ثبت لاگ تغییر وضعیت
    await addOrderLog(order._id, oldStatus, 'Ready', req.user._id);

    res.json({ message: 'سفارش آماده تحویل شد', order: updatedOrder });
  } catch (error) {
    res.status(500).json({ message: 'خطا در تغییر وضعیت سفارش', error: error.message });
  }
};

exports.deliverOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'سفارش یافت نشد' });

    const oldStatus = order.status;
    order.status = 'Delivered';
    const updatedOrder = await order.save();

    // ثبت لاگ تغییر وضعیت
    await addOrderLog(order._id, oldStatus, 'Delivered', req.user._id);

    res.json({ message: 'سفارش با موفقیت تحویل مشتری شد', order: updatedOrder });
  } catch (error) {
    res.status(500).json({ message: 'خطا در تحویل سفارش', error: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['Pending', 'Preparing', 'Ready', 'Delivered', 'Cancelled'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'وضعیت وارد شده نامعتبر است' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'سفارش یافت نشد' });

    const oldStatus = order.status;
    order.status = status;
    const updatedOrder = await order.save();

    // ثبت لاگ تغییر وضعیت
    await addOrderLog(order._id, oldStatus, status, req.user._id);

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: 'خطا در تغییر وضعیت سفارش', error: error.message });
  }
};

exports.addToCart = async (req, res) => {
    try {
        const workingCheck = await checkIsWorkingHours();
        if (!workingCheck.isOpen) {
          return res.status(400).json({ message: workingCheck.message });
        }

        const { itemId, quantity = 1 } = req.body;
        const item = await MenuItem.findById(itemId);

        if (!item || item.stock < quantity) {
            return res.status(400).json({ message: 'موجودی کافی نیست یا آیتم یافت نشد.' });
        }

        item.stock -= quantity;
        await item.save();

        let cart = await Order.findOne({ customer: req.user._id, status: 'cart' });

        if (!cart) {
            cart = new Order({ customer: req.user._id, items: [], status: 'cart', totalPrice: 0 });
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

exports.removeFromCart = async (req, res) => {
    try {
        const { itemId } = req.body;
        const cart = await Order.findOne({ customer: req.user._id, status: 'cart' });

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

exports.getCart = async (req, res) => {
    try {
        const cart = await Order.findOne({ customer: req.user._id, status: 'cart' })
            .populate('items.menuItem', 'name price');
            
        if (!cart) {
            return res.status(200).json({ items: [], totalPrice: 0 });
        }
        
        res.status(200).json(cart);
    } catch (error) {
        res.status(500).json({ message: 'خطا در دریافت سبد خرید', error: error.message });
    }
};

// نهایی سازی سفارش 
exports.checkoutCart = async (req, res) => {
    try {
        const workingCheck = await checkIsWorkingHours();
        if (!workingCheck.isOpen) {
          return res.status(400).json({ message: workingCheck.message });
        }

        const { discountCode } = req.body;
        const cart = await Order.findOne({ customer: req.user._id, status: 'cart' });

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: 'سبد خرید شما خالی است.' });
        }

        let finalPrice = cart.totalPrice;

        // اعمال تخفیف در صورت ارسال کد
        if (discountCode && discountCode.trim() !== '') {
          const discount = await Discount.findOne({ code: discountCode.toUpperCase(), isActive: true });
          if (!discount) {
            return res.status(400).json({ message: 'کد تخفیف نامعتبر است.' });
          }
          if (new Date() > new Date(discount.expiryDate)) {
            return res.status(400).json({ message: 'تاریخ انقضای کد تخفیف به پایان رسیده است.' });
          }
          const discountAmount = (cart.totalPrice * discount.discountPercent) / 100;
          finalPrice = cart.totalPrice - discountAmount;
        }

        let maxPrepTime = 15;
        for (const item of cart.items) {
            const menuItem = await MenuItem.findById(item.menuItem);
            if (menuItem && menuItem.prepTime && menuItem.prepTime > maxPrepTime) {
                maxPrepTime = menuItem.prepTime;
            }
        }

        const estimatedReadyAt = new Date(Date.now() + maxPrepTime * 60 * 1000);

        const oldStatus = cart.status; 
        cart.status = 'Pending';
        cart.totalPrice = finalPrice; 
        cart.prepTimeMinutes = maxPrepTime;
        cart.estimatedReadyAt = estimatedReadyAt;
        
        await cart.save();

        // ثبت لاگ تبدیل سبد خرید به سفارش Pending
        await addOrderLog(cart._id, oldStatus, 'Pending', req.user._id);

        res.status(200).json({ message: 'سفارش با موفقیت ثبت شد و به آشپزخانه ارسال گردید.' });
    } catch (error) {
        res.status(500).json({ message: 'خطا در ثبت نهایی سفارش', error: error.message });
    }
};

exports.getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ customer: req.user._id, status: { $ne: 'cart' } })
            .populate('items.menuItem', 'name price prepTime')
            .sort({ createdAt: -1 });

        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: 'خطا در دریافت تاریخچه سفارشات', error: error.message });
    }
};

exports.cancelOrderCustomer = async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await Order.findOne({ _id: orderId, customer: req.user._id });

        if (!order) return res.status(404).json({ message: 'سفارش یافت نشد.' });

        if (order.status !== 'Pending') {
            return res.status(400).json({ message: 'این سفارش وارد مرحله آماده‌سازی شده و دیگر قابل لغو نیست.' });
        }

        const oldStatus = order.status;
        order.status = 'Cancelled';
        await order.save();

        // ثبت لاگ لغو سفارش
        await addOrderLog(order._id, oldStatus, 'Cancelled', req.user._id);

        for (const item of order.items) {
            const menuItem = await MenuItem.findById(item.menuItem);
            if (menuItem) {
                menuItem.stock += item.quantity;
                await menuItem.save();
            }
        }

        res.status(200).json({ message: 'سفارش با موفقیت لغو شد.' });
    } catch (error) {
        res.status(500).json({ message: 'خطا در لغو سفارش', error: error.message });
    }
};

exports.getSalesReports = async (req, res) => {
    try {
        const userRole = String(req.user.role).toLowerCase();
        if (userRole !== 'admin') return res.status(403).json({ message: 'عدم دسترسی' });

        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(startOfDay);
        startOfWeek.setDate(startOfDay.getDate() - 7);
        const startOfMonth = new Date(startOfDay);
        startOfMonth.setMonth(startOfDay.getMonth() - 1);

        const getStats = async (startDate) => {
            const result = await Order.aggregate([
                { $match: { createdAt: { $gte: startDate }, status: 'Delivered' } },
                { $group: { _id: null, totalSales: { $sum: '$totalPrice' }, orderCount: { $sum: 1 } } }
            ]);
            return result.length > 0 ? result[0] : { totalSales: 0, orderCount: 0 };
        };

        const daily = await getStats(startOfDay);
        const weekly = await getStats(startOfWeek);
        const monthly = await getStats(startOfMonth);

        res.status(200).json({ daily, weekly, monthly });
    } catch (error) {
        res.status(500).json({ message: 'خطا در دریافت گزارشات', error: error.message });
    }
};

exports.getAllOrders = async (req, res) => {
    try {
        const userRole = String(req.user.role).toLowerCase();
        if (userRole !== 'admin') return res.status(403).json({ message: 'عدم دسترسی' });

        const orders = await Order.find({ status: { $ne: 'cart' } })
            .populate('customer', 'name phone')
            .populate('items.menuItem', 'name price')
            .sort({ createdAt: -1 });

        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: 'خطا در دریافت سفارشات سیستم', error: error.message });
    }
};

exports.getPublicReadyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ status: 'Ready' })
      .populate('customer', 'name')
      .populate('items.menuItem', 'name')
      .sort({ updatedAt: -1 })
      .limit(20);

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'خطا در دریافت سفارش‌های آماده', error: error.message });
  }
};