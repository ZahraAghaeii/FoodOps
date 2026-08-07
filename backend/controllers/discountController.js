const Discount = require('../models/Discount');

// @desc    تعریف کد تخفیف جدید (مخصوص ادمین)
exports.createDiscount = async (req, res) => {
  try {
    const { code, discountPercent, expiryDate } = req.body;

    const existing = await Discount.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ message: 'این کد تخفیف قبلاً تعریف شده است.' });
    }

    const discount = await Discount.create({
      code,
      discountPercent,
      expiryDate
    });

    res.status(201).json({ message: 'کد تخفیف با موفقیت ایجاد شد', discount });
  } catch (error) {
    res.status(500).json({ message: 'خطا در ایجاد کد تخفیف', error: error.message });
  }
};

// @desc    دریافت لیست کدهای تخفیف (مخصوص ادمین)
exports.getAllDiscounts = async (req, res) => {
  try {
    const discounts = await Discount.find().sort({ createdAt: -1 });
    res.json(discounts);
  } catch (error) {
    res.status(500).json({ message: 'خطا در دریافت کدهای تخفیف' });
  }
};

// @desc    دریافت کدهای تخفیف فعال برای نمایش به مشتریان
exports.getPublicDiscounts = async (req, res) => {
  try {
    const now = new Date();
    const discounts = await Discount.find({ 
      isActive: true, 
      expiryDate: { $gte: now } 
    }).select('code discountPercent expiryDate');
    
    res.json(discounts);
  } catch (error) {
    res.status(500).json({ message: 'خطا در دریافت کدهای تخفیف' });
  }
};

// @desc    بررسی و اعمال کد تخفیف توسط مشتری
exports.applyDiscount = async (req, res) => {
  try {
    const { code, cartTotal } = req.body;

    const discount = await Discount.findOne({ code: code.toUpperCase(), isActive: true });
    if (!discount) {
      return res.status(404).json({ message: 'کد تخفیف نامعتبر است یا وجود ندارد.' });
    }

    // بررسی تاریخ انقضا
    if (new Date() > new Date(discount.expiryDate)) {
      return res.status(400).json({ message: 'تاریخ انقضای این کد تخفیف به پایان رسیده است.' });
    }

    const discountAmount = (cartTotal * discount.discountPercent) / 100;
    const finalPrice = cartTotal - discountAmount;

    res.json({
      message: 'کد تخفیف با موفقیت اعمال شد!',
      discountPercent: discount.discountPercent,
      discountAmount,
      finalPrice
    });
  } catch (error) {
    res.status(500).json({ message: 'خطا در بررسی کد تخفیف', error: error.message });
  }
};

// @desc    حذف کد تخفیف (مخصوص ادمین)
exports.deleteDiscount = async (req, res) => {
  try {
    await Discount.findByIdAndDelete(req.params.id);
    res.json({ message: 'کد تخفیف حذف شد.' });
  } catch (error) {
    res.status(500).json({ message: 'خطا در حذف کد تخفیف' });
  }
};