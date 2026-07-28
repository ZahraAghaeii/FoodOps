document.addEventListener('DOMContentLoaded', () => {
  const API_URL = 'http://localhost:5000/api/orders';
  const token = localStorage.getItem('token');
  const ordersContainer = document.getElementById('delivery-orders-list');

  if (!token) {
    alert('لطفا ابتدا وارد حساب کاربری خود شوید.');
    window.location.href = 'login.html';
    return;
  }

  // دریافت سفارش‌های آماده تحویل
  async function fetchReadyOrders() {
    try {
      const response = await fetch(`${API_URL}/kitchen`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('خطا در دریافت لیست سفارشات');
      }

      const orders = await response.json();
      
      // فقط سفارش‌هایی که وضعیت Ready دارند
      const readyOrders = orders.filter(order => order.status === 'Ready');

      renderOrders(readyOrders);
    } catch (error) {
      console.error('Error fetching delivery orders:', error);
      ordersContainer.innerHTML = `<p style="color:red;">${error.message}</p>`;
    }
  }

  // رندر کردن سفارش‌ها با کلاس‌های CSS پروژه
  function renderOrders(orders) {
    if (orders.length === 0) {
      ordersContainer.innerHTML = '<p>هیچ سفارشی در انتظار تحویل نیست. 🎉</p>';
      return;
    }

    ordersContainer.innerHTML = orders.map(order => {
      const customerName = order.customer ? order.customer.name : 'مشتری ناشناس';
      
      const itemsList = order.items.map(i => {
        const itemName = i.menuItem ? i.menuItem.name : 'آیتم حذف شده';
        return `<li>${itemName} - ${i.quantity} عدد</li>`;
      }).join('');

      return `
        <div class="order-card status-ready" id="order-${order._id}">
          <h3>سفارش #${order._id.slice(-6)}</h3>
          <p><strong>مشتری:</strong> ${customerName}</p>
          <p><strong>محتویات سفارش:</strong></p>
          <ul>
            ${itemsList}
          </ul>
          <p class="price">مبلغ کل: ${order.totalPrice.toLocaleString()} تومان</p>
          <div class="card-actions">
            <button class="btn-deliver" onclick="markAsDelivered('${order._id}')">📦 تحویل به مشتری</button>
          </div>
        </div>
      `;
    }).join('');
  }

  // تغییر وضعیت به Delivered
  window.markAsDelivered = async (orderId) => {
    try {
      const response = await fetch(`${API_URL}/${orderId}/deliver`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'خطا در تغییر وضعیت سفارش');
      }

      fetchReadyOrders();
    } catch (error) {
      alert(`خطا: ${error.message}`);
    }
  };

  fetchReadyOrders();
});