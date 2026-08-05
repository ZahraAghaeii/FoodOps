const API_MENU = 'http://localhost:5000/api/menu';
const API_ORDERS = 'http://localhost:5000/api/orders';
const API_CATEGORIES = 'http://localhost:5000/api/categories';

let allMenuItems = []; // ذخیره تمام غذاها جهت فیلتر فرانت‌اند

// چک کردن وضعیت لاگین و فراخوانی منو و دسته‌بندی‌ها هنگام بارگذاری صفحه
window.onload = () => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  if (!token || !user) {
    window.location.href = 'login.html';
    return;
  }

  const userNameElem = document.getElementById('userName');
  if (userNameElem) {
    userNameElem.innerText = `خوش آمدید، ${user.name}`;
  }

  // افزودن دکمه‌های مدیریتی براساس نقش کاربر
  renderKitchenButton(user);
  renderDeliveryButton(user);
  renderAdminOrdersButton(user); // دکمه جدید برای مدیریت کل سفارشات
  renderAdminPanels(user); // نمایش/مخفی‌سازی پنل‌های ادمین و فراخوانی گزارشات

  fetchMenu();
  fetchCategories();
  fetchCartCount();
};

// کنترل نمایش بخش‌های مدیریت (فقط برای ادمین)
function renderAdminPanels(user) {
  if (!user) return;

  const userRole = String(user.role || user.type || '').toLowerCase().trim();
  const isAdmin = userRole.includes('admin');

  const catSection = document.getElementById('admin-category-section');
  const menuSection = document.getElementById('admin-menu-section');
  const reportsSection = document.getElementById('adminReportsSection');

  if (catSection) catSection.style.display = isAdmin ? 'block' : 'none';
  if (menuSection) menuSection.style.display = isAdmin ? 'block' : 'none';

  // نمایش دادن باکس گزارشات و دریافت اطلاعات فقط برای ادمین
  if (reportsSection) {
    if (isAdmin) {
      reportsSection.style.display = 'block';
      fetchAdminReports();
    } else {
      reportsSection.style.display = 'none';
    }
  }
}

// نمایش دکمه مدیریت کل سفارشات (فقط برای ادمین)
function renderAdminOrdersButton(user) {
  if (!user) return;

  const userRole = String(user.role || user.type || '').toLowerCase().trim();
  const isAdmin = userRole.includes('admin');

  if (isAdmin) {
    if (document.getElementById('adminOrdersNavBtn')) return;

    const adminOrdersBtn = document.createElement('a');
    adminOrdersBtn.id = 'adminOrdersNavBtn';
    adminOrdersBtn.href = 'admin-orders.html';
    adminOrdersBtn.innerText = '📋 مدیریت کل سفارشات';
    adminOrdersBtn.style.cssText = `
      background-color: #8e44ad;
      color: white;
      padding: 6px 14px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: bold;
      font-size: 13px;
      margin: 0 5px;
      display: inline-block;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      transition: background 0.2s;
      cursor: pointer;
    `;

    adminOrdersBtn.onmouseover = () => adminOrdersBtn.style.backgroundColor = '#732d91';
    adminOrdersBtn.onmouseout = () => adminOrdersBtn.style.backgroundColor = '#8e44ad';

    injectHeaderBtn(adminOrdersBtn);
  }
}

// نمایش مشروط دکمه صف آشپزخانه برای نقش‌های مجاز
function renderKitchenButton(user) {
  if (!user) return;

  const userRole = String(user.role || user.type || '').toLowerCase().trim();

  const isAllowed = userRole.includes('kitchen') ||
    userRole.includes('staff') ||
    userRole.includes('admin') ||
    userRole.includes('cook') ||
    userRole.includes('chef');

  if (isAllowed) {
    if (document.getElementById('kitchenNavBtn')) return;

    const kitchenBtn = document.createElement('a');
    kitchenBtn.id = 'kitchenNavBtn';
    kitchenBtn.href = 'kitchen.html';
    kitchenBtn.innerText = '👨‍🍳 صف آشپزخانه';
    kitchenBtn.style.cssText = `
      background-color: #ff9800;
      color: white;
      padding: 6px 14px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: bold;
      font-size: 13px;
      margin: 0 5px;
      display: inline-block;
      box-shadow: 0 2px 4px rgba(83, 70, 70, 0.2);
      transition: background 0.2s;
      cursor: pointer;
    `;

    kitchenBtn.onmouseover = () => kitchenBtn.style.backgroundColor = '#e67e22';
    kitchenBtn.onmouseout = () => kitchenBtn.style.backgroundColor = '#ff9800';

    injectHeaderBtn(kitchenBtn);
  }
}

// نمایش مشروط دکمه پنل تحویل برای صندوق‌دار (Cashier) و ادمین (Admin)
function renderDeliveryButton(user) {
  if (!user) return;

  const userRole = String(user.role || user.type || '').toLowerCase().trim();

  const isAllowed = userRole.includes('cashier') ||
    userRole.includes('admin') ||
    userRole.includes('delivery');

  if (isAllowed) {
    if (document.getElementById('deliveryNavBtn')) return;

    const deliveryBtn = document.createElement('a');
    deliveryBtn.id = 'deliveryNavBtn';
    deliveryBtn.href = 'delivery.html';
    deliveryBtn.innerText = '📦 تحویل سفارشات';
    deliveryBtn.style.cssText = `
      background-color: #27ae60;
      color: white;
      padding: 6px 14px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: bold;
      font-size: 13px;
      margin: 0 5px;
      display: inline-block;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      transition: background 0.2s;
      cursor: pointer;
    `;

    deliveryBtn.onmouseover = () => deliveryBtn.style.backgroundColor = '#219150';
    deliveryBtn.onmouseout = () => deliveryBtn.style.backgroundColor = '#27ae60';

    injectHeaderBtn(deliveryBtn);
  }
}

// تابع کمکی برای تزریق دکمه‌ها در هدر پیش از دکمه خروج/نام کاربر
function injectHeaderBtn(buttonElem) {
  const logoutBtn = document.querySelector('button[onclick*="logout"]') ||
    document.getElementById('logoutBtn') ||
    document.querySelector('.btn-danger') ||
    document.querySelector('button');

  const userNameElem = document.getElementById('userName');

  if (logoutBtn && logoutBtn.parentNode) {
    logoutBtn.parentNode.insertBefore(buttonElem, logoutBtn);
  } else if (userNameElem && userNameElem.parentNode) {
    userNameElem.parentNode.insertBefore(buttonElem, userNameElem);
  } else {
    document.body.prepend(buttonElem);
  }
}

// خروج از حساب کاربری
function logout() {
  localStorage.clear();
  window.location.href = 'login.html';
}

// دریافت دسته‌بندی‌ها از بک‌اند و ساخت همزمان Dropdown و دکمه‌های فیلتر
async function fetchCategories() {
  const categorySelect = document.getElementById('menu-category');
  const filterBar = document.getElementById('categoryFilterBar');

  try {
    const res = await fetch(API_CATEGORIES);
    const categories = await res.json();

    if (categorySelect) categorySelect.innerHTML = '<option value="">انتخاب دسته‌بندی...</option>';
    if (filterBar) {
      filterBar.innerHTML = '<button class="filter-btn active" onclick="filterMenu(\'all\', this)">همه</button>';
    }

    if (!Array.isArray(categories) || categories.length === 0) {
      if (categorySelect) categorySelect.innerHTML = '<option value="">هیچ دسته‌بندی یافت نشد</option>';
      return;
    }

    categories.forEach(cat => {
      if (categorySelect) {
        const option = document.createElement('option');
        option.value = cat._id;
        option.textContent = cat.name;
        categorySelect.appendChild(option);
      }

      if (filterBar) {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.textContent = cat.name;
        btn.onclick = function () { filterMenu(cat._id, this); };
        filterBar.appendChild(btn);
      }
    });
  } catch (err) {
    console.error('خطا در دریافت دسته‌بندی‌ها:', err);
    if (categorySelect) categorySelect.innerHTML = '<option value="">خطا در دریافت دسته‌بندی‌ها</option>';
  }
}

// دریافت منوی غذاها از بک‌اند
async function fetchMenu() {
  try {
    const res = await fetch(API_MENU);
    allMenuItems = await res.json();

    renderMenuGrid(allMenuItems);
  } catch (err) {
    console.error(err);
    const menuGrid = document.getElementById('menuGrid');
    if (menuGrid) {
      menuGrid.innerHTML = '<p style="color:red;">خطا در دریافت منو از سرور!</p>';
    }
  }
}

// رندر کردن غذاها در گرید فرانت‌اند (شامل نمایش تصویر اختصاصی ادمین و کنترلرهای تعداد)
function renderMenuGrid(items) {
  const menuGrid = document.getElementById('menuGrid');
  if (!menuGrid) return;

  menuGrid.innerHTML = '';

  if (!Array.isArray(items) || items.length === 0) {
    menuGrid.innerHTML = '<p>هیچ غذایی در این دسته‌بندی یافت نشد.</p>';
    return;
  }

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = String(user.role || user.type || '').toLowerCase().trim();
  const isAdmin = userRole.includes('admin');
  const isCustomer = userRole === 'customer';

  items.forEach(item => {
    const stockCount = item.stock !== undefined ? item.stock : 0;
    const isOutOfStock = !item.isAvailable || stockCount <= 0;

    const categoryName = item.category && item.category.name
      ? item.category.name
      : 'بدون دسته‌بندی';

    const foodImage = (item.imageUrl && item.imageUrl.trim() !== '') ? item.imageUrl : '';

    const card = document.createElement('div');
    card.className = 'food-card';

    // ساخت دکمه‌های کنترل ادمین
    const adminControls = isAdmin ? `
      <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 8px;">
        <button onclick="editPrice('${item._id}', ${item.price})" style="background: #f39c12; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">
          ✏️ ویرایش قیمت
        </button>
        <button onclick="editStock('${item._id}', ${stockCount})" style="background: #3498db; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">
          📦 موجودی (${stockCount})
        </button>
        <button onclick="toggleAvailability('${item._id}', ${item.isAvailable})" style="background: ${item.isAvailable ? '#27ae60' : '#7f8c8d'}; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">
          ${item.isAvailable ? '👁️ فعال' : '🙈 غیرفعال'}
        </button>
        <button onclick="deleteMenuItem('${item._id}', '${item.name}')" style="background: #e74c3c; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">
          🗑️ حذف
        </button>
      </div>
    ` : '';

    let actionButton = '';
    if (isCustomer) {
      if (isOutOfStock) {
        actionButton = `<button class="btn-inline-add" disabled style="background: #e74c3c; cursor: not-allowed; opacity: 0.8; margin-top: 10px;">❌ ناموجود</button>`;
      } else {
        actionButton = `
          <div class="cart-action-row">
            <div class="qty-inline-box">
              <button class="qty-inline-btn-minus" onclick="decreaseQty('${item._id}')">-</button>
              <input type="text" id="qty-${item._id}" class="qty-inline-input" value="1" readonly />
              <button class="qty-inline-btn-plus" onclick="increaseQty('${item._id}', ${stockCount})">+</button>
            </div>
            <button class="btn-inline-add" onclick="addToCartWithQty('${item._id}')">افزودن به سبد</button>
          </div>
        `;
      }
    }

    const imageHtml = foodImage ? `<img src="${foodImage}" alt="${item.name}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 6px; margin-bottom: 10px;" onerror="this.style.display='none'" />` : '';

    card.innerHTML = `
      <div>
        ${imageHtml}
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span style="font-size: 11px; background: #e0e0e0; color: #555; padding: 2px 8px; border-radius: 10px;">
            ${categoryName}
          </span>
          <span style="font-size: 11px; font-weight: bold; color: ${isOutOfStock ? '#e74c3c' : '#27ae60'};">
            ${isOutOfStock ? 'ناموجود' : `موجودی: ${stockCount} عدد`}
          </span>
        </div>
        <h3>${item.name}</h3>
        <p>${item.description || 'بدون توضیح'}</p>
      </div>
      <div>
        <div style="font-weight:bold; font-size: 15px; color: #d35400; margin-bottom: 8px;">
          ${Number(item.price).toLocaleString('fa-IR')} تومان
        </div>
        ${adminControls}
        ${actionButton}
      </div>
    `;
    menuGrid.appendChild(card);
  });
}

// توابع کمکی برای دکمه‌های + و - روی کارت غذا
function decreaseQty(itemId) {
  const input = document.getElementById(`qty-${itemId}`);
  if (!input) return;
  let currentVal = parseInt(input.value) || 1;
  if (currentVal > 1) {
    input.value = currentVal - 1;
  }
}

function increaseQty(itemId, maxStock) {
  const input = document.getElementById(`qty-${itemId}`);
  if (!input) return;
  let currentVal = parseInt(input.value) || 1;
  if (currentVal < maxStock) {
    input.value = currentVal + 1;
  } else {
    alert(`حداکثر موجودی انبار ${maxStock} عدد است.`);
  }
}

// تغییر تعداد موجودی (مخصوص ادمین)
async function editStock(itemId, currentStock) {
  const newStock = prompt('تعداد موجودی جدید را وارد کنید:', currentStock);

  if (newStock === null || newStock.trim() === '') return;

  const stockNum = Number(newStock);
  if (isNaN(stockNum) || stockNum < 0) {
    alert('لطفاً یک عدد معتبر وارد کنید.');
    return;
  }

  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_MENU}/${itemId}/stock`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ stock: stockNum })
    });

    const data = await res.json();

    if (res.ok) {
      alert('موجودی با موفقیت بروزرسانی شد! 📦');
      fetchMenu();
    } else {
      alert(data.message || 'خطا در ویرایش موجودی');
    }
  } catch (err) {
    console.error(err);
    alert('ارتباط با سرور برقرار نشد.');
  }
}

// تغییر وضعیت فعال/غیرفعال بودن آیتم (مخصوص ادمین)
async function toggleAvailability(itemId, currentStatus) {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_MENU}/${itemId}/availability`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ isAvailable: !currentStatus })
    });

    const data = await res.json();

    if (res.ok) {
      fetchMenu();
    } else {
      alert(data.message || 'خطا در تغییر وضعیت');
    }
  } catch (err) {
    console.error(err);
    alert('ارتباط با سرور برقرار نشد.');
  }
}

// ویرایش قیمت (مخصوص ادمین)
async function editPrice(itemId, currentPrice) {
  const newPrice = prompt('قیمت جدید را به تومان وارد کنید:', currentPrice);

  if (newPrice === null || newPrice.trim() === '') return;

  const priceNum = Number(newPrice);
  if (isNaN(priceNum) || priceNum < 0) {
    alert('لطفاً یک عدد معتبر وارد کنید.');
    return;
  }

  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_MENU}/${itemId}/price`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ price: priceNum })
    });

    const data = await res.json();

    if (res.ok) {
      alert('قیمت با موفقیت تغییر کرد! 🎉');
      fetchMenu();
    } else {
      alert(data.message || 'خطا در ویرایش قیمت');
    }
  } catch (err) {
    console.error(err);
    alert('ارتباط با سرور برقرار نشد.');
  }
}

// حذف غذای انتخاب‌شده (مخصوص ادمین)
async function deleteMenuItem(itemId, itemName) {
  const confirmDelete = confirm(`آیا از حذف آیتم «${itemName}» اطمینان دارید؟`);
  if (!confirmDelete) return;

  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_MENU}/${itemId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (res.ok) {
      alert(`آیتم «${itemName}» با موفقیت حذف شد! 🗑️`);
      fetchMenu();
    } else {
      alert(data.message || 'خطا در حذف آیتم');
    }
  } catch (err) {
    console.error(err);
    alert('ارتباط با سرور برقرار نشد.');
  }
}

// فیلتر کردن غذاها بر اساس دسته‌بندی
function filterMenu(categoryId, btnElement) {
  const buttons = document.querySelectorAll('.filter-btn');
  buttons.forEach(b => b.classList.remove('active'));
  if (btnElement) btnElement.classList.add('active');

  if (categoryId === 'all') {
    renderMenuGrid(allMenuItems);
  } else {
    const filtered = allMenuItems.filter(item => {
      const itemCatId = item.category && (item.category._id || item.category);
      return itemCatId === categoryId;
    });
    renderMenuGrid(filtered);
  }
}

// نمایش سبد خرید بر اساس نقش کاربر
document.addEventListener("DOMContentLoaded", () => {
  const userStr = localStorage.getItem("user");
  const cartNavItem = document.getElementById("cart-nav-item");

  if (userStr && cartNavItem) {
    const user = JSON.parse(userStr);
    const userRole = String(user.role || user.type || '').toLowerCase().trim();

    if (userRole === "customer") {
      cartNavItem.style.display = "block";
    } else {
      cartNavItem.style.display = "none";
    }
  }
});

// Listenerها برای فرم‌های ادمین (خواندن خودکار نام عکس از لپ‌تاپ)
document.addEventListener('DOMContentLoaded', () => {

  // ۱. ثبت دسته‌بندی جدید
  const addCategoryForm = document.getElementById('add-category-form');
  if (addCategoryForm) {
    addCategoryForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const token = localStorage.getItem('token');
      if (!token) {
        alert('لطفاً ابتدا وارد حساب کاربری خود شوید.');
        return;
      }

      const categoryName = document.getElementById('category-name').value.trim();
      if (!categoryName) return;

      try {
        const response = await fetch(API_CATEGORIES, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ name: categoryName })
        });

        const data = await response.json();

        if (response.ok) {
          alert(`دسته‌بندی «${categoryName}» با موفقیت ثبت شد! 🎉`);
          addCategoryForm.reset();
          fetchCategories();
        } else {
          alert(`خطا: ${data.message || 'مشکلی در ثبت دسته‌بندی پیش آمد'}`);
        }
      } catch (error) {
        console.error('خطا:', error);
        alert('ارتباط با سرور برقرار نشد.');
      }
    });
  }

  // ۲. ثبت غذای جدید (تبدیل خودکار فایل انتخابی به مسیر images/...)
  const addMenuForm = document.getElementById('add-menu-form');
  if (addMenuForm) {
    addMenuForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const token = localStorage.getItem('token');
      if (!token) {
        alert('لطفاً ابتدا وارد حساب کاربری خود شوید.');
        return;
      }

      const fileInput = document.getElementById('menu-image-file');
      let imagePath = '';

      if (fileInput && fileInput.files && fileInput.files[0]) {
        // نام فایل انتخابی از لپ‌تاپ را می‌خواند و مسیر images/ را به آن اضافه می‌کند
        const fileName = fileInput.files[0].name;
        imagePath = `images/${fileName}`;
      }

      const menuItemData = {
        name: document.getElementById('menu-name').value,
        description: document.getElementById('menu-desc').value,
        price: Number(document.getElementById('menu-price').value),
        stock: Number(document.getElementById('menu-stock').value || 10),
        imageUrl: imagePath, // ذخیره مسیر خودکار عکس
        category: document.getElementById('menu-category').value,
        isAvailable: true
      };

      try {
        const response = await fetch(API_MENU, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(menuItemData)
        });

        const data = await response.json();

        if (response.ok) {
          alert('غذا با موفقیت به منو اضافه شد!');
          addMenuForm.reset();
          fetchMenu();
        } else {
          alert(`خطا: ${data.message || 'مشکلی در ثبت غذا پیش آمد'}`);
        }
      } catch (error) {
        console.error('خطا:', error);
        alert('ارتباط با سرور برقرار نشد.');
      }
    });
  }
});

// افزودن به سبد خرید با در نظر گرفتن تعداد مشخص شده توسط کاربر
async function addToCartWithQty(itemId) {
  const token = localStorage.getItem('token');
  if (!token) return alert('لطفا ابتدا وارد سایت شوید.');

  const qtyInput = document.getElementById(`qty-${itemId}`);
  const quantity = qtyInput ? parseInt(qtyInput.value) || 1 : 1;

  try {
    const response = await fetch(`${API_ORDERS}/cart/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ itemId: itemId, quantity: quantity })
    });

    const data = await response.json();

    if (response.ok) {
      const cartCountElement = document.getElementById('cart-count');
      if (cartCountElement) {
        cartCountElement.innerText = data.totalItemsCount;
      }
      alert(`با موفقیت (${quantity} عدد) به سبد خرید اضافه شد.`);
      fetchMenu();
    } else {
      alert(data.message || 'موجودی کافی نیست.');
    }
  } catch (error) {
    console.error('Error adding to cart:', error);
    alert('ارتباط با سرور برقرار نشد!');
  }
}

// دریافت تعداد آیتم‌های سبد خرید از سرور هنگام لود صفحه
async function fetchCartCount() {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');

  if (!token || !userStr) return;

  const user = JSON.parse(userStr);
  const userRole = String(user.role || user.type || '').toLowerCase().trim();

  // فقط برای مشتریان سبد خرید را چک کن
  if (userRole !== 'customer') return;

  try {
    const response = await fetch(`${API_ORDERS}/cart`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const cart = await response.json();
      const cartCountElement = document.getElementById('cart-count');

      if (cartCountElement && cart.items) {
        const totalItemsCount = cart.items.reduce((acc, curr) => acc + curr.quantity, 0);
        cartCountElement.innerText = totalItemsCount;
      }
    }
  } catch (error) {
    console.error('خطا در دریافت موجودی سبد خرید:', error);
  }
}

// دریافت و نمایش گزارشات فروش ادمین
async function fetchAdminReports() {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const response = await fetch(`${API_ORDERS}/reports`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const data = await response.json();

      // آپدیت گزارش روزانه
      document.getElementById('dailySales').innerText = `${(data.daily?.totalSales || 0).toLocaleString('fa-IR')} تومان`;
      document.getElementById('dailyCount').innerText = `تعداد سفارش: ${data.daily?.orderCount || 0}`;

      // آپدیت گزارش هفتگی
      document.getElementById('weeklySales').innerText = `${(data.weekly?.totalSales || 0).toLocaleString('fa-IR')} تومان`;
      document.getElementById('weeklyCount').innerText = `تعداد سفارش: ${data.weekly?.orderCount || 0}`;

      // آپدیت گزارش ماهانه
      document.getElementById('monthlySales').innerText = `${(data.monthly?.totalSales || 0).toLocaleString('fa-IR')} تومان`;
      document.getElementById('monthlyCount').innerText = `تعداد سفارش: ${data.monthly?.orderCount || 0}`;
    } else {
      console.error('خطا در دریافت گزارشات از سرور');
    }
  } catch (error) {
    console.error('خطا در ارتباط با سرور برای گزارشات:', error);
  }
}