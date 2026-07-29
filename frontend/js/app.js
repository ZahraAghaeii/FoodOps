const API_MENU = 'http://localhost:5000/api/menu';
const API_ORDERS = 'http://localhost:5000/api/orders';
const API_CATEGORIES = 'http://localhost:5000/api/categories';

let cart = [];
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
  renderAdminPanels(user); // نمایش/مخفی‌سازی پنل‌های ادمین

  fetchMenu();
  fetchCategories();
};

// کنترل نمایش بخش‌های مدیریت (فقط برای ادمین)
function renderAdminPanels(user) {
  if (!user) return;

  const userRole = String(user.role || user.type || '').toLowerCase().trim();
  const isAdmin = userRole.includes('admin');

  const catSection = document.getElementById('admin-category-section');
  const menuSection = document.getElementById('admin-menu-section');

  if (catSection) catSection.style.display = isAdmin ? 'block' : 'none';
  if (menuSection) menuSection.style.display = isAdmin ? 'block' : 'none';
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
      // ۱. پر کردن Dropdown ثبت غذا
      if (categorySelect) {
        const option = document.createElement('option');
        option.value = cat._id;
        option.textContent = cat.name;
        categorySelect.appendChild(option);
      }

      // ۲. ساخت دکمه فیلتر دسته‌بندی برای منو
      if (filterBar) {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.textContent = cat.name;
        btn.onclick = function() { filterMenu(cat._id, this); };
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

// رندر کردن غذاها در گرید فرانت‌اند
function renderMenuGrid(items) {
  const menuGrid = document.getElementById('menuGrid');
  if (!menuGrid) return;

  menuGrid.innerHTML = '';

  if (!Array.isArray(items) || items.length === 0) {
    menuGrid.innerHTML = '<p>هیچ غذایی در این دسته‌بندی یافت نشد.</p>';
    return;
  }

  items.forEach(item => {
    if (!item.isAvailable) return;

    const categoryName = item.category && item.category.name 
      ? item.category.name 
      : 'بدون دسته‌بندی';

    const card = document.createElement('div');
    card.className = 'food-card';
    card.innerHTML = `
      <div>
        <span style="font-size: 11px; background: #e0e0e0; color: #555; padding: 2px 8px; border-radius: 10px; display: inline-block; margin-bottom: 6px;">
          ${categoryName}
        </span>
        <h3>${item.name}</h3>
        <p>${item.description || 'بدون توضیح'}</p>
      </div>
      <div>
        <div class="food-price">${Number(item.price).toLocaleString('fa-IR')} تومان</div>
        <button class="btn-add" onclick="addToCart('${item._id}', '${item.name}', ${item.price})">افزودن به سبد</button>
      </div>
    `;
    menuGrid.appendChild(card);
  });
}

// فیلتر کردن غذاها بر اساس دسته‌بندی انتخاب‌شده
function filterMenu(categoryId, btnElement) {
  // تغییر دکمه فعال
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

// Listenerها برای فرم‌های ادمین
document.addEventListener('DOMContentLoaded', () => {

  // ۱. ثبت دسته‌بندی جدید توسط ادمین
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
          fetchCategories(); // بروزرسانی لحظه‌ای Dropdown و دکمه‌های فیلتر
        } else {
          alert(`خطا: ${data.message || 'مشکلی در ثبت دسته‌بندی پیش آمد'}`);
        }
      } catch (error) {
        console.error('خطا:', error);
        alert('ارتباط با سرور برقرار نشد.');
      }
    });
  }

  // ۲. ثبت غذای جدید توسط ادمین
  const addMenuForm = document.getElementById('add-menu-form');
  if (addMenuForm) {
    addMenuForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const token = localStorage.getItem('token');
      if (!token) {
        alert('لطفاً ابتدا وارد حساب کاربری خود شوید.');
        return;
      }

      const menuItemData = {
        name: document.getElementById('menu-name').value,
        description: document.getElementById('menu-desc').value,
        price: Number(document.getElementById('menu-price').value),
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

// افزودن آیتم به سبد خرید
function addToCart(id, name, price) {
  const existing = cart.find(i => i.menuItem === id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ menuItem: id, name, priceAtOrder: price, quantity: 1 });
  }
  renderCart();
}

// حذف یا کاهش تعداد آیتم از سبد خرید
function removeFromCart(id) {
  const index = cart.findIndex(i => i.menuItem === id);
  if (index !== -1) {
    if (cart[index].quantity > 1) {
      cart[index].quantity -= 1;
    } else {
      cart.splice(index, 1);
    }
  }
  renderCart();
}

// بروزرسانی بخش سبد خرید در HTML
function renderCart() {
  const cartContainer = document.getElementById('cartItems');
  if (!cartContainer) return;

  cartContainer.innerHTML = '';

  if (cart.length === 0) {
    cartContainer.innerHTML = '<p style="font-size: 13px; color: #888;">سبد خرید شما خالی است.</p>';
    document.getElementById('totalPrice').innerText = '۰ تومان';
    const cartCount = document.getElementById('cart-count');
    if (cartCount) cartCount.innerText = '0';
    return;
  }

  let total = 0;
  let totalCount = 0;
  cart.forEach(item => {
    total += item.priceAtOrder * item.quantity;
    totalCount += item.quantity;
    const li = document.createElement('li');
    li.className = 'cart-item';
    li.innerHTML = `
      <span class="cart-item-title">${item.name}</span>
      <span class="cart-item-qty">x${item.quantity}</span>
      <span>${(item.priceAtOrder * item.quantity).toLocaleString('fa-IR')}</span>
      <button class="btn-remove" onclick="removeFromCart('${item.menuItem}')">✕</button>
    `;
    cartContainer.appendChild(li);
  });

  document.getElementById('totalPrice').innerText = `${total.toLocaleString('fa-IR')} تومان`;
  const cartCount = document.getElementById('cart-count');
  if (cartCount) cartCount.innerText = totalCount;
}

// ثبت نهایی سفارش در بک‌اند
async function submitOrder() {
  if (cart.length === 0) {
    alert('سبد خرید شما خالی است!');
    return;
  }

  const token = localStorage.getItem('token');
  const itemsPayload = cart.map(i => ({
    menuItem: i.menuItem,
    quantity: i.quantity
  }));

  try {
    const res = await fetch(API_ORDERS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ items: itemsPayload })
    });

    const data = await res.json();

    if (res.ok) {
      alert('سفارش شما با موفقیت ثبت شد و به آشپزخانه ارسال شد! 🎉');
      cart = [];
      renderCart();
    } else {
      alert(data.message || 'خطا در ثبت سفارش');
    }
  } catch (err) {
    alert('خطا در ارتباط با سرور');
  }
}