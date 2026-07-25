const MenuItem = require('../models/MenuItem');

// @desc    دریافت تمام غذاهای منو (امکان فیلتر بر اساس دسته‌بندی)
// @route   GET /api/menu
// @access  Public
exports.getMenuItems = async (req, res) => {
  try {
    const { category } = req.query;
    const query = { isAvailable: true };

    if (category) {
      query.category = category;
    }

    const items = await MenuItem.find(query).populate('category', 'name');
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'خطا در دریافت منوی غذاها', error: error.message });
  }
};

// @desc    ایجاد آیتم جدید در منو
// @route   POST /api/menu
// @access  Private/Admin
exports.createMenuItem = async (req, res) => {
  try {
    const { name, description, price, category, imageUrl, isAvailable } = req.body;

    const menuItem = await MenuItem.create({
      name,
      description,
      price,
      category,
      imageUrl,
      isAvailable
    });

    res.status(201).json(menuItem);
  } catch (error) {
    res.status(500).json({ message: 'خطا در ایجاد آیتم منو', error: error.message });
  }
};

// @desc    ویرایش آیتم منو
// @route   PUT /api/menu/:id
// @access  Private/Admin
exports.updateMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return res.status(404).json({ message: 'آیتم یافت نشد' });
    }

    Object.assign(menuItem, req.body);
    const updatedItem = await menuItem.save();

    res.json(updatedItem);
  } catch (error) {
    res.status(500).json({ message: 'خطا در ویرایش آیتم', error: error.message });
  }
};

// @desc    حذف آیتم منو
// @route   DELETE /api/menu/:id
// @access  Private/Admin
exports.deleteMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return res.status(404).json({ message: 'آیتم یافت نشد' });
    }

    await menuItem.deleteOne();
    res.json({ message: 'آیتم با موفقیت حذف شد' });
  } catch (error) {
    res.status(500).json({ message: 'خطا در حذف آیتم', error: error.message });
  }
};