const User = require('../models/User');
const jwt = require('jsonwebtoken');

// تابع کمکی تولید توکن JWT
const generateToken = (id) => {
  return jwt.sign(
    { id }, 
    process.env.JWT_SECRET || 'fallback_secret_key_12345', 
    { expiresIn: '30d' }
  );
};

// تابع تولید رمز عبور رندوم ۸ کاراکتری
const generateRandomPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#@!';
  let tempPass = '';
  for (let i = 0; i < 8; i++) {
    tempPass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return tempPass;
};

// ثبت‌نام کاربر جدید 
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'کاربری با این ایمیل قبلاً ثبت‌نام کرده است' });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone: phone || '',
      role: 'Customer',
      isPasswordTemp: false
    });

    res.status(201).json({
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isPasswordTemp: false
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

//  ورود کاربر
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      const isTemp = user.isPasswordTemp === true;

      res.json({
        token: generateToken(user._id),
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          role: user.role,
          isPasswordTemp: isTemp
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

// دریافت اطلاعات کاربر فعلی
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

// ویرایش اطلاعات پروفایل شخص
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
      user.isPasswordTemp = false;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
      isPasswordTemp: updatedUser.isPasswordTemp
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ message: 'خطا در بروزرسانی اطلاعات پروفایل' });
  }
};

//  تغییر رمز موقت به رمز دائمی
exports.changePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.trim().length < 6) {
      return res.status(400).json({ message: 'رمز عبور جدید باید حداقل ۶ کاراکتر باشد' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'کاربر یافت نشد' });
    }

    user.password = newPassword;
    user.isPasswordTemp = false;
    await user.save();

    res.json({ message: 'رمز عبور با موفقیت تغییر کرد' });
  } catch (error) {
    console.error('Change Password Error:', error);
    res.status(500).json({ message: 'خطا در تغییر رمز عبور' });
  }
};

//  دریافت لیست تمامی کاربران (مخصوص ادمین)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Get All Users Error:', error);
    res.status(500).json({ message: 'خطا در دریافت لیست کاربران' });
  }
};

//  تغییر نقش کاربر توسط ادمین
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    
    const allowedRoles = ['Admin', 'Kitchen Staff', 'Kitchen', 'Cashier'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'انتخاب این نقش مجاز نمی‌باشد' });
    }

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

// ثبت‌نام پرسنل جدید توسط ادمین با رمز رندوم
exports.createStaff = async (req, res) => {
  try {
    const { name, email, phone, role } = req.body;

    const allowedRoles = ['Admin', 'Kitchen Staff', 'Kitchen', 'Cashier'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'ادمین فقط مجاز به تعریف پرسنل (ادمین، آشپزخانه، صندوق‌دار) است' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'کاربری با این ایمیل قبلاً ثبت‌نام کرده است' });
    }

    const generatedPassword = generateRandomPassword();

    const newStaff = await User.create({
      name,
      email,
      password: generatedPassword,
      phone: phone || '',
      role: role || 'Kitchen Staff',
      isPasswordTemp: true
    });

    res.status(201).json({
      message: 'پرسنل جدید با موفقیت ثبت شد',
      generatedPassword: generatedPassword,
      user: {
        _id: newStaff._id,
        name: newStaff.name,
        email: newStaff.email,
        phone: newStaff.phone,
        role: newStaff.role,
        isPasswordTemp: true
      }
    });
  } catch (error) {
    console.error('Create Staff Error:', error);
    res.status(500).json({ message: 'خطا در ایجاد کاربر پرسنل' });
  }
};

// حذف کاربر توسط ادمین
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'کاربر مورد نظر یافت نشد' });
    }

    // جلوگیری از حذف حساب جاری خود ادمین
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'شما نمی‌توانید حساب کاربری خودتان را حذف کنید!' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'کاربر با موفقیت حذف شد' });
  } catch (error) {
    console.error('Delete User Error:', error);
    res.status(500).json({ message: 'خطا در حذف کاربر' });
  }
};

//  خروج کاربر
exports.logout = async (req, res) => {
  res.json({ message: 'خروج با موفقیت انجام شد' });
};