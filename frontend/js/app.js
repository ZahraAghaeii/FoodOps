const API_MENU = 'http://localhost:5000/api/menu';
const API_ORDERS = 'http://localhost:5000/api/orders';
const API_CATEGORIES = 'http://localhost:5000/api/categories';

let cart = [];

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

  fetchMenu();
  fetchCategories();
};

// خروج از حساب کاربری
function logout() {
  localStorage.clear();
  window.location.href = 'login.html';
}

// دریافت دسته‌بندی‌ها از بک‌اند و پر کردن Dropdown
async function fetchCategories() {
  const categorySelect = document.getElementById('menu-category');
  if (!categorySelect) return;

  try {
    const res = await fetch(API_CATEGORIES);
    const categories = await res.json();

    categorySelect.innerHTML = '<option value="">انتخاب دسته‌بندی...</option>';

    if (!Array.isArray(categories) || categories.length === 0) {
      categorySelect.innerHTML = '<option value="">هیچ دسته‌بندی یافت نشد</option>';
      return;
    }

    categories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat._id;
      option.textContent = cat.name;
      categorySelect.appendChild(option);
    });
  } catch (err) {
    console.error('خطا در دریافت دسته‌بندی‌ها:', err);
    categorySelect.innerHTML = '<option value="">خطا در دریافت دسته‌بندی‌ها</option>';
  }
}

// دریافت منوی غذاها از بک‌اند و نمایش آن‌ها به همراه نام دسته‌بندی
async function fetchMenu() {
  try {
    const res = await fetch(API_MENU);
    const menuItems = await res.json();
    
    const menuGrid = document.getElementById('menuGrid');
    if (!menuGrid) return;

    menuGrid.innerHTML = '';

    if (!Array.isArray(menuItems) || menuItems.length === 0) {
      menuGrid.innerHTML = '<p>هیچ غذایی در منو ثبت نشده است.</p>';
      return;
    }

    menuItems.forEach(item => {
      if (!item.isAvailable) return;

      // بررسی وجود دسته‌بندی و استخراج نام آن (در صورتی که بک‌اند populate کرده باشد)
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
  } catch (err) {
    console.error(err);
    const menuGrid = document.getElementById('menuGrid');
    if (menuGrid) {
      menuGrid.innerHTML = '<p style="color:red;">خطا در دریافت منو از سرور!</p>';
    }
  }
}

// ثبت غذای جدید از طریق فرم فرانت‌اند
document.addEventListener('DOMContentLoaded', () => {
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
          fetchMenu(); // به‌روزرسانی آنی منو در صفحه
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
    return;
  }

  let total = 0;
  cart.forEach(item => {
    total += item.priceAtOrder * item.quantity;
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
    quantity: i.quantity,
    priceAtOrder: i.priceAtOrder
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