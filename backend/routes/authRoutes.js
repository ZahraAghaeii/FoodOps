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
  createStaff,
  changePassword,
  deleteUser
} = require('../controllers/authController');

const { protect, admin } = require('../middleware/authMiddleware');

// مسیرهای عمومی و پروفایل کاربر
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/change-password', protect, changePassword);

// مسیرهای مدیریتی (فقط مخصوص ادمین)
router.get('/users', protect, admin, getAllUsers);
router.patch('/users/:id/role', protect, admin, updateUserRole);
router.post('/staff', protect, admin, createStaff);
router.delete('/users/:id', protect, admin, deleteUser);

module.exports = router;