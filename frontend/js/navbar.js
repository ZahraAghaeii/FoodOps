// گارد امنیتی: بررسی اجباری رمز موقت در تمام صفحات
(function checkTempPasswordGuard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const currentPage = window.location.pathname.split('/').pop();

  if (user && user.isPasswordTemp && currentPage !== 'change-password.html') {
    window.location.href = 'change-password.html';
  }
})();

function renderDynamicSidebar() {
  const sidebar = document.getElementById('main-sidebar');
  if (!sidebar) return;

  const user = JSON.parse(localStorage.getItem('user'));
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const cartCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  let menuItems = '';

  if (!user) {
    // کاربر مهمان
    menuItems = `
      <li><a href="index.html">🍽️ منوی غذاها</a></li>
      <li><a href="public-display.html" target="_blank">📺 نمایشگر سلف (آماده‌ها)</a></li>
      <li><a href="login.html">🔑 ورود به حساب</a></li>
      <li><a href="register.html">📝 ثبت‌نام</a></li>
    `;
  } else {
    const role = user.role || 'Customer';

    if (role === 'Admin') {
      menuItems = `
        <li><a href="index.html">🍽️ مشاهده منوی اصلی</a></li>
        <li><a href="admin-manage-menu.html">➕ افزودن غذا و دسته‌بندی</a></li>
        <li><a href="admin-reports.html">📊 گزارشات فروش</a></li>
        <li><a href="admin-orders.html">📋 مدیریت جامع سفارشات</a></li>
        <li><a href="kitchen.html">👨‍🍳 صف آشپزخانه</a></li>
        <li><a href="delivery.html">🚀 پنل تحویل سفارش</a></li>
        <li><a href="public-display.html" target="_blank">📺 نمایشگر سلف (آماده‌ها)</a></li>
        <li><a href="profile.html">👤 مدیریت کاربران و پروفایل</a></li>
      `;
    } else if (role === 'Kitchen Staff') {
      menuItems = `
        <li><a href="kitchen.html">👨‍🍳 صف آشپزخانه</a></li>
        <li><a href="public-display.html" target="_blank">📺 نمایشگر سلف (آماده‌ها)</a></li>
        <li><a href="profile.html">👤 پروفایل من</a></li>
      `;
    } else if (role === 'Cashier') {
      menuItems = `
        <li><a href="delivery.html">🚀 پنل تحویل سفارش</a></li>
        <li><a href="public-display.html" target="_blank">📺 نمایشگر سلف (آماده‌ها)</a></li>
        <li><a href="profile.html">👤 پروفایل من</a></li>
      `;
    } else {
      // مشتری (Customer)
      menuItems = `
        <li><a href="index.html">🍽️ منوی غذاها</a></li>
        <li>
          <a href="cart.html">
            🛒 سبد خرید 
            <span class="cart-badge-inline" id="cart-count">${cartCount}</span>
          </a>
        </li>
        <li><a href="orders.html">📜 سفارشات من</a></li>
        <li><a href="public-display.html" target="_blank">📺 نمایشگر سلف (آماده‌ها)</a></li>
        <li><a href="profile.html">👤 پروفایل من</a></li>
      `;
    }
  }

  const userInfoHtml = user ? `
    <div class="sidebar-user">
      👋 خوش آمدید، <strong>${user.name || 'کاربر'}</strong><br>
      <small style="opacity:0.8;">نقش: ${user.role || 'Customer'}</small>
    </div>
  ` : '';

  const logoutBtnHtml = user ? `
    <li style="margin-top: auto;"><button class="nav-link-btn" onclick="logoutUser()">🚪 خروج از حساب</button></li>
  ` : '';

  sidebar.innerHTML = `
    <div class="sidebar-logo" onclick="window.location.href='index.html'">FoodOps 🍽️</div>
    ${userInfoHtml}
    <ul class="sidebar-menu">
      ${menuItems}
      ${logoutBtnHtml}
    </ul>
  `;
}

function logoutUser() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', renderDynamicSidebar);