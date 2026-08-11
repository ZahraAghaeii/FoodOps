const Category = require('../models/Category');

// دریافت تمام دسته‌بندی‌ها
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'خطا در دریافت دسته‌بندی‌ها', error: error.message });
  }
};

//  ایجاد دسته‌بندی جدید
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

//  ویرایش دسته‌بندی
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

//  حذف دسته‌بندی
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