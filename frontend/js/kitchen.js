const API_ORDERS = 'http://localhost:5000/api/orders';

window.onload = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }
  fetchKitchenOrders();
  
  // به‌روزرسانی خودکار صف هر ۱۰ ثانیه یکبار
  setInterval(fetchKitchenOrders, 10000);
};

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
  const container = document.getElementById('kitchenOrdersContainer');
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
    const itemsList = order.items.map(i => 
      `<li>${i.menuItem ? i.menuItem.name : 'آیتم حذف شده'} × ${i.quantity}</li>`
    ).join('');

    // ساخت دکمه مدیریت وضعیت بر اساس وضعیت فعلی
    let actionButton = '';
    if (order.status === 'Pending') {
      actionButton = `<button style="background: #2196F3; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; width: 100%; font-family: inherit; font-weight: bold;" onclick="updateOrderStatus('${order._id}', 'start')">شروع آماده‌سازی</button>`;
    } else if (order.status === 'Preparing') {
      actionButton = `<button style="background: #2ecc71; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; width: 100%; font-family: inherit; font-weight: bold;" onclick="updateOrderStatus('${order._id}', 'ready')">آماده تحویل</button>`;
    } else if (order.status === 'Ready') {
      actionButton = `<button style="background: #9b59b6; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; width: 100%; font-family: inherit; font-weight: bold;" onclick="updateOrderStatus('${order._id}', 'deliver')">تحویل داده شد</button>`;
    }

    const customerName = order.customer ? order.customer.name : 'مشتری';

    card.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px;">سفارش کد: ${order._id.slice(-4)}</div>
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
  
  let endpoint = `${API_ORDERS}/${orderId}/${action}`;
  let method = 'PATCH';
  let bodyData = null;

  // اگر مرحله تحویل نهایی باشد، از روت status استفاده می‌شود
  if (action === 'deliver') {
    endpoint = `${API_ORDERS}/${orderId}/status`;
    bodyData = JSON.stringify({ status: 'Delivered' });
  }

  try {
    const res = await fetch(endpoint, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: bodyData
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