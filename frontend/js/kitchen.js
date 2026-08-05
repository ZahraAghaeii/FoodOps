const API_ORDERS = 'http://localhost:5000/api/orders';

window.onload = () => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token || !user) {
    window.location.href = 'login.html';
    return;
  }

  // بررسی جامع نقش کاربر جهت دسترسی به آشپزخانه
  const role = String(user.role || user.type || '').toLowerCase().trim();
  const isKitchenAllowed = 
    role.includes('kitchen') || 
    role.includes('staff') || 
    role.includes('cook') || 
    role.includes('chef') || 
    role.includes('admin');

  if (!isKitchenAllowed) {
    alert('شما دسترسی لازم برای مشاهده داشبورد آشپزخانه را ندارید.');
    window.location.href = 'index.html';
    return;
  }

  fetchKitchenOrders();
  
  // به‌روزرسانی خودکار صف هر ۱۰ ثانیه یکبار
  setInterval(fetchKitchenOrders, 10000);
};

// تابع تبدیل تاریخ ایجاد به ساعت و دقیقه فارسی (مثلاً ۱۴:۳۵)
function formatOrderTime(dateString) {
  if (!dateString) return 'نامشخص';
  const date = new Date(dateString);
  return date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
}

// دریافت سفارش‌های صف آشپزخانه
async function fetchKitchenOrders() {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_ORDERS}/kitchen`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        alert('شما دسترسی لازم برای مشاهده داشبورد آشپزخانه را ندارید.');
        window.location.href = 'index.html';
        return;
      }
      throw new Error('خطا در دریافت سفارش‌ها');
    }

    const orders = await res.json();
    renderKitchenOrders(orders);
  } catch (err) {
    console.error('خطا در دریافت سفارش‌ها:', err);
  }
}

// رندر کردن کارت‌های سفارش در صفحه
function renderKitchenOrders(orders) {
  const container = document.getElementById('kitchenOrdersContainer') || document.getElementById('ordersContainer');
  if (!container) return;

  container.innerHTML = '';

  if (!Array.isArray(orders) || orders.length === 0) {
    container.innerHTML = '<p style="text-align:center; color:#777; width: 100%;">هیچ سفارشی در صف آشپزخانه نیست.</p>';
    return;
  }

  orders.forEach(order => {
    const card = document.createElement('div');
    card.className = 'order-card';
    card.style.cssText = 'background: #fff; padding: 15px; margin: 10px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); width: 300px; display: inline-block; vertical-align: top; border: 1px solid #ddd;';

    // لیست آیتم‌های سفارش
    const itemsList = (order.items || []).map(i => 
      `<li>${i.menuItem ? i.menuItem.name : 'آیتم حذف شده'} × ${i.quantity}</li>`
    ).join('');

    // دریافت و فرمت زمان ثبت سفارش
    const orderTime = formatOrderTime(order.createdAt);

    // ساخت دکمه مدیریت وضعیت (محدود به آشپزخانه: فقط شروع و آماده تحویل)
    let actionButton = '';
    const status = String(order.status || '').toLowerCase();

    if (status === 'pending') {
      actionButton = `<button style="background: #2196F3; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; width: 100%; font-family: inherit; font-weight: bold;" onclick="updateOrderStatus('${order._id}', 'start')">شروع آماده‌سازی</button>`;
    } else if (status === 'preparing' || status === 'in_preparation') {
      actionButton = `<button style="background: #2ecc71; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; width: 100%; font-family: inherit; font-weight: bold;" onclick="updateOrderStatus('${order._id}', 'ready')">آماده تحویل</button>`;
    } else if (status === 'ready') {
      actionButton = `<div style="background: #f1f2f6; color: #2c3e50; padding: 8px 12px; border-radius: 4px; text-align: center; font-weight: bold; font-size: 13px; border: 1px dashed #bdc3c7;">⏳ در انتظار تحویل توسط صندوق‌دار</div>`;
    } else return

    const customerName = order.customer ? order.customer.name : (order.user ? order.user.name : 'مشتری');

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="font-weight: bold;">سفارش کد: ${order._id.slice(-4)}</span>
        <span style="font-size: 12px; color: #555; background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-weight: bold;">⏰ ${orderTime}</span>
      </div>
      <div style="font-size: 13px; color: #555; margin-bottom: 5px;">مشتری: ${customerName}</div>
      <div style="font-size: 13px; color: #555; margin-bottom: 10px;">وضعیت: <span style="color: #e67e22; font-weight: bold;">${order.status}</span></div>
      <ul style="padding-right: 20px; font-size: 14px; margin-bottom: 15px; line-height: 1.6;">${itemsList}</ul>
      ${actionButton}
    `;

    container.appendChild(card);
  });
}

// ارسال درخواست تغییر وضعیت به بک‌اند
async function updateOrderStatus(orderId, action) {
  const token = localStorage.getItem('token');
  const endpoint = `${API_ORDERS}/${orderId}/${action}`;

  try {
    const res = await fetch(endpoint, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (res.ok) {
      fetchKitchenOrders(); // بروزرسانی آنی صفحه
    } else {
      alert(data.message || 'خطا در تغییر وضعیت سفارش');
    }
  } catch (err) {
    console.error('خطا:', err);
    alert('ارتباط با سرور برقرار نشد.');
  }
}