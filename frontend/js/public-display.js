const API_PUBLIC_READY = 'http://localhost:5000/api/orders/public-ready';

async function fetchPublicReadyOrders() {
  try {
    const res = await fetch(API_PUBLIC_READY);
    const orders = await res.json();
    const grid = document.getElementById('readyGrid');

    if (!Array.isArray(orders) || orders.length === 0) {
      grid.innerHTML = '<div class="empty-display">در حال حاضر سفارشی آماده تحویل نمی‌باشد. گرسنه‌ها صبور باشید! 🍽️</div>';
      return;
    }

    grid.innerHTML = '';
    orders.forEach(order => {
      const customerName = order.customer ? order.customer.name : 'مشتری عزیز';
      const shortCode = order._id.slice(-5);

      const card = document.createElement('div');
      card.className = 'ready-card';
      card.innerHTML = `
        <div class="ready-code">کد: ${shortCode}</div>
        <div class="ready-name">👤 ${customerName}</div>
        <div class="ready-status">🟢 آماده تحویل</div>
      `;
      grid.appendChild(card);
    });
  } catch (err) {
    console.error('خطا در بروزرسانی نمایشگر:', err);
  }
}

// لود اولیه و سپس هر ۵ ثانیه بروزرسانی خودکار
fetchPublicReadyOrders();
setInterval(fetchPublicReadyOrders, 5000);