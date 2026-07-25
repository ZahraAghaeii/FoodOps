const Category = require('../models/Category');

// @desc    دریافت تمام دسته‌بندی‌ها
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'خطا در دریافت دسته‌بندی‌ها', error: error.message });
  }
};

// @desc    ایجاد دسته‌بندی جدید
// @route   POST /api/categories
// @access  Private/Admin
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    const categoryExists = await Category.findOne({ name });
    if (categoryExists) {
      return res.status(400).json({ message: 'دسته‌بندی با این نام قبلاً ثبت شده است' });
    }

    const category = await Category.create({ name, description });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: 'خطا در ایجاد دسته‌بندی', error: error.message });
  }
};

// @desc    ویرایش دسته‌بندی
// @route   PUT /api/categories/:id
// @access  Private/Admin
exports.updateCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'دسته‌بندی یافت نشد' });
    }

    category.name = name || category.name;
    category.description = description || category.description;

    const updatedCategory = await category.save();
    res.json(updatedCategory);
  } catch (error) {
    res.status(500).json({ message: 'خطا در ویرایش دسته‌بندی', error: error.message });
  }
};

// @desc    حذف دسته‌بندی
// @route   DELETE /api/categories/:id
// @access  Private/Admin
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'دسته‌بندی یافت نشد' });
    }

    await category.deleteOne();
    res.json({ message: 'دسته‌بندی با موفقیت حذف شد' });
  } catch (error) {
    res.status(500).json({ message: 'خطا در حذف دسته‌بندی', error: error.message });
  }
};