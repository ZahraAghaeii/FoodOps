const MenuItem = require('../models/MenuItem');
const Category = require('../models/Category');

// @desc    دریافت تمام غذاهای منو (امکان فیلتر بر اساس دسته‌بندی)
// @route   GET /api/menu
// @access  Public
exports.getMenuItems = async (req, res) => {
  try {
    const { category } = req.query;
    const query = {};

    if (category) {
      query.category = category;
    }

    const items = await MenuItem.find(query).populate('category', 'name');
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'خطا در دریافت منوی غذاها', error: error.message });
  }
};

// @desc    ایجاد آیتم جدید در منو (همراه با دریافت آدرس عکس دلخواه ادمین)
// @route   POST /api/menu
// @access  Private/Admin
exports.createMenuItem = async (req, res) => {
  try {
    const { name, description, price, category, imageUrl, isAvailable, stock } = req.body;

    const menuItem = await MenuItem.create({
      name,
      description,
      price,
      category,
      imageUrl: imageUrl || '', // اگر ادمین آدرس عکس را وارد نکرد، خالی بماند
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      stock: stock !== undefined ? Number(stock) : 100
    });

    res.status(201).json(menuItem);
  } catch (error) {
    res.status(500).json({ message: 'خطا در ایجاد آیتم منو', error: error.message });
  }
};

// @desc    ویرایش کامل آیتم منو
// @route   PUT /api/menu/:id
// @access  Private/Admin
exports.updateMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return res.status(404).json({ message: 'آیتم یافت نشد' });
    }

    Object.assign(menuItem, req.body);
    
    if (menuItem.stock === 0) {
      menuItem.isAvailable = false;
    }

    const updatedItem = await menuItem.save();

    res.json(updatedItem);
  } catch (error) {
    res.status(500).json({ message: 'خطا در ویرایش آیتم', error: error.message });
  }
};

// @desc    ویرایش قیمت آیتم منو (مخصوص ادمین)
// @route   PATCH /api/menu/:id/price
// @access  Private/Admin
exports.updateMenuPrice = async (req, res) => {
  try {
    const { price } = req.body;

    if (price === undefined || price === null || price < 0) {
      return res.status(400).json({ message: 'قیمت وارد شده معتبر نیست.' });
    }

    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return res.status(404).json({ message: 'آیتم یافت نشد' });
    }

    menuItem.price = Number(price);
    const updatedItem = await menuItem.save();

    res.json({ message: 'قیمت با موفقیت بروزرسانی شد', item: updatedItem });
  } catch (error) {
    res.status(500).json({ message: 'خطا در بروزرسانی قیمت', error: error.message });
  }
};

// @desc    ویرایش تعداد موجودی آیتم (مخصوص ادمین)
// @route   PATCH /api/menu/:id/stock
// @access  Private/Admin
exports.updateStock = async (req, res) => {
  try {
    const { stock } = req.body;

    if (stock === undefined || stock < 0) {
      return res.status(400).json({ message: 'تعداد موجودی معتبر نیست' });
    }

    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return res.status(404).json({ message: 'آیتم یافت نشد' });
    }

    menuItem.stock = Number(stock);
    menuItem.isAvailable = menuItem.stock > 0;
    const updatedItem = await menuItem.save();

    res.json({ message: 'موجودی با موفقیت بروزرسانی شد', item: updatedItem });
  } catch (error) {
    res.status(500).json({ message: 'خطا در بروزرسانی موجودی', error: error.message });
  }
};

// @desc    تغییر وضعیت فعال/غیرفعال بودن آیتم (مخصوص ادمین)
// @route   PATCH /api/menu/:id/availability
// @access  Private/Admin
exports.toggleAvailability = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return res.status(404).json({ message: 'آیتم یافت نشد' });
    }

    menuItem.isAvailable = req.body.isAvailable !== undefined ? req.body.isAvailable : !menuItem.isAvailable;
    const updatedItem = await menuItem.save();

    res.json({ message: 'وضعیت فعال بودن تغییر کرد', item: updatedItem });
  } catch (error) {
    res.status(500).json({ message: 'خطا در تغییر وضعیت موجودی', error: error.message });
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