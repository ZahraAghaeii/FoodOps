const jwt = require('jsonwebtoken');
const User = require('../models/User');

// بررسی داشتن توکن معتبر
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // گرفتن توکن از Header
      token = req.headers.authorization.split(' ')[1];

      // رمزگشایی توکن (استفاده از fallback برای جلوگیری از خطای نبود env)
      const secret = process.env.JWT_SECRET || 'fallback_secret_key_12345';
      const decoded = jwt.verify(token, secret);

      // پیدا کردن کاربر بدون بازگرداندن پسورد
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'کاربری با این توکن یافت نشد' });
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'توکن نامعتبر است یا انقضای آن تمام شده' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'دسترسی غیرمجاز؛ توکن ارسال نشده است' });
  }
};

// بررسی عمومی نقش کاربر (RBAC)
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `نقش کاربری (${req.user ? req.user.role : 'نامشخص'}) اجازه دسترسی به این بخش را ندارد`
      });
    }
    next();
  };
};

// میدلور اختصاصی ادمین برای حل مشکل ورود به بخش‌های مدیریتی
const admin = (req, res, next) => {
  if (req.user && req.user.role && req.user.role.toLowerCase() === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'دسترسی غیرمجاز! فقط کاربر ادمین اجازه دسترسی دارد' });
  }
};

module.exports = { protect, authorize, admin };
