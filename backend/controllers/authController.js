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
    const { name, email, password, phone, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'کاربری با این ایمیل قبلاً ثبت‌نام کرده است' });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone: phone || '',
      role: role || 'Customer'
    });

    res.status(201).json({
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
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

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        token: generateToken(user._id),
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone || '',
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

// @desc    ویرایش اطلاعات پروفایل شخص
// @route   PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'کاربر یافت نشد' });
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;

    if (req.body.password && req.body.password.trim() !== '') {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ message: 'خطا در بروزرسانی اطلاعات پروفایل' });
  }
};

// @desc    دریافت لیست تمامی کاربران (مخصوص ادمین)
// @route   GET /api/auth/users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Get All Users Error:', error);
    res.status(500).json({ message: 'خطا در دریافت لیست کاربران' });
  }
};

// @desc    تغییر نقش کاربر توسط ادمین
// @route   PATCH /api/auth/users/:id/role
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'کاربر مورد نظر یافت نشد' });
    }

    user.role = role;
    await user.save();

    res.json({ message: 'نقش کاربر با موفقیت تغییر کرد', user: { _id: user._id, name: user.name, role: user.role } });
  } catch (error) {
    console.error('Update Role Error:', error);
    res.status(500).json({ message: 'خطا در تغییر نقش کاربر' });
  }
};

// @desc    ثبت‌نام مستقیم پرسنل جدید توسط ادمین
// @route   POST /api/auth/staff
exports.createStaff = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'کاربری با این ایمیل قبلاً ثبت‌نام کرده است' });
    }

    const newStaff = await User.create({
      name,
      email,
      password,
      phone: phone || '',
      role: role || 'Kitchen Staff'
    });

    res.status(201).json({
      message: 'پرسنل جدید با موفقیت ثبت شد',
      user: {
        _id: newStaff._id,
        name: newStaff.name,
        email: newStaff.email,
        phone: newStaff.phone,
        role: newStaff.role
      }
    });
  } catch (error) {
    console.error('Create Staff Error:', error);
    res.status(500).json({ message: 'خطا در ایجاد کاربر پرسنل' });
  }
};

// @desc    خروج کاربر
// @route   POST /api/auth/logout
exports.logout = async (req, res) => {
  res.json({ message: 'خروج با موفقیت انجام شد' });
};

