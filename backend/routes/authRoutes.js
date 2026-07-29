const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  getMe, 
  logout, 
  updateProfile, 
  getAllUsers, 
  updateUserRole, 
  createStaff 
} = require('../controllers/authController');

const { protect, admin } = require('../middleware/authMiddleware');

// مسیرهای عمومی و پروفایل کاربر
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

// مسیرهای مدیریتی (فقط مخصوص ادمین)
router.get('/users', protect, admin, getAllUsers);
router.patch('/users/:id/role', protect, admin, updateUserRole);
router.post('/staff', protect, admin, createStaff);

module.exports = router;
