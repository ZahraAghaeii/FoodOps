const User = require('../models/User');
const jwt = require('jsonwebtoken');

// تابع کمکی برای تولید توکن JWT
const generateToken = (id) => {
  return jwt.sign(
    { id }, 
    process.env.JWT_SECRET || 'fallback_secret_key_12345', 
    { expiresIn: '30d' }
  );
};

// @desc    ثبت‌نام کاربر جدید
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // بررسی تکراری نبودن ایمیل
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'کاربری با این ایمیل قبلاً ثبت‌نام کرده است' });
    }

    // ساخت کاربر (پسورد خودکار در Hook پیش از ذخیره در مدل هش می‌شود)
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'Customer'
    });

    res.status(201).json({
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Register Error Details:', error);
    res.status(500).json({ 
      message: error.message || 'خطای سرور در ثبت‌نام', 
      error: error.message 
    });
  }
};

// @desc    ورود کاربر
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // پیدا کردن کاربر
    const user = await User.findOne({ email });

    // بررسی وجود کاربر و درستی پسورد
    if (user && (await user.matchPassword(password))) {
      res.json({
        token: generateToken(user._id),
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } else {
      res.status(401).json({ message: 'ایمیل یا رمز عبور اشتباه است' });
    }
  } catch (error) {
    console.error('Login Error Details:', error);
    res.status(500).json({ 
      message: error.message || 'خطای سرور در ورود', 
      error: error.message 
    });
  }
};

// @desc    دریافت اطلاعات کاربر فعلی
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    console.error('GetMe Error Details:', error);
    res.status(500).json({ 
      message: error.message || 'خطای سرور در دریافت اطلاعات', 
      error: error.message 
    });
  }
};

// @desc    خروج کاربر
// @route   POST /api/auth/logout
exports.logout = async (req, res) => {
  res.json({ message: 'خروج با موفقیت انجام شد' });
};