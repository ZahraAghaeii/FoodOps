// فایل: backend/config/seed.js

// توجه: چون فایل seed در پوشه config است، برای رسیدن به models باید یک پوشه به عقب برگردیم (../)
const Category = require('../models/Category'); 

const seedDefaultCategories = async () => {
    try {
        const count = await Category.countDocuments();
        
        if (count === 0) { // اگر هیچ دسته‌بندی‌ای وجود نداشت
            const defaultCategories = [
                { name: 'غذای اصلی', description: 'انواع غذاهای ایرانی و فرنگی' },
                { name: 'نوشیدنی', description: 'انواع نوشیدنی‌های گرم و سرد' },
                { name: 'دسر', description: 'انواع کیک و شیرینی' },
                { name: 'پیش‌غذا', description: 'سالاد، سیب‌زمینی و...' }
            ];

            await Category.insertMany(defaultCategories);
            console.log("Category tests was added successfully!!");
        }
    } catch (error) {
        console.error('Error in adding categories.', error);
    }
};

// این تابع را خروجی می‌گیریم تا در server.js بتوانیم از آن استفاده کنیم
module.exports = seedDefaultCategories;