let currentTab = 'pending';

document.addEventListener("DOMContentLoaded", () => {
    // خواندن تب از URL (اگر از صفحه سبد خرید با پارامتر آمده باشد)
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam === 'history') {
        switchTab('history');
    } else {
        switchTab('pending');
    }
    if (typeof fetchCartCount === 'function') fetchCartCount();
});

function switchTab(tab) {
    currentTab = tab;
    document.getElementById('btnPending').classList.toggle('active', tab === 'pending');
    document.getElementById('btnHistory').classList.toggle('active', tab === 'history');
    fetchUserOrders();
}

async function fetchUserOrders() {
    const token = localStorage.getItem('token');
    const listContainer = document.getElementById('ordersList');
    listContainer.innerHTML = '<p style="text-align: center; color: #888; padding: 20px;">در حال دریافت اطلاعات...</p>';

    try {
        // درخواست به روت سفارشات کاربر
        const response = await fetch(`${API_ORDERS}/my-orders`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const orders = await response.json();
            renderOrders(orders);
        } else {
            listContainer.innerHTML = '<p style="text-align: center; color: red; padding: 20px;">خطا در دریافت سفارشات.</p>';
        }
    } catch (err) {
        console.error(err);
        listContainer.innerHTML = '<p style="text-align: center; color: red; padding: 20px;">خطا در ارتباط با سرور.</p>';
    }
}

function renderOrders(orders) {
    const listContainer = document.getElementById('ordersList');
    listContainer.innerHTML = '';

    // فیلتر کردن سفارشات بر اساس تب انتخابی
    const filteredOrders = orders.filter(order => {
        if (currentTab === 'pending') {
            return ['Pending', 'Preparing', 'Ready'].includes(order.status);
        } else {
            return ['Delivered', 'Cancelled'].includes(order.status);
        }
    });

    if (filteredOrders.length === 0) {
        listContainer.innerHTML = `<p style="text-align: center; color: #888; padding: 30px;">هیچ سفارشی در این بخش یافت نشد.</p>`;
        return;
    }

    filteredOrders.forEach(order => {
        const card = document.createElement('div');
        card.className = `order-card status-${order.status.toLowerCase()}`;

        // ترجمه وضعیت‌ها به فارسی
        let statusText = order.status;
        if (order.status === 'Pending') statusText = 'ثبت شده / در انتظار';
        else if (order.status === 'Preparing') statusText = 'در حال آماده‌سازی در آشپزخانه';
        else if (order.status === 'Ready') statusText = 'آماده تحویل';
        else if (order.status === 'Delivered') statusText = 'تحویل داده شده';
        else if (order.status === 'Cancelled') statusText = 'لغو شده';

        let itemsHtml = '';
        if (order.items && order.items.length > 0) {
            order.items.forEach(i => {
                const name = i.menuItem ? i.menuItem.name : 'آیتم';
                itemsHtml += `<li><span>${name} (x${i.quantity})</span> <span>${(i.priceAtOrder * i.quantity).toLocaleString('fa-IR')} تومان</span></li>`;
            });
        }

        // ایجاد دکمه لغو منحصراً برای سفارشات Pending
        let cancelBtnHtml = '';
        if (order.status === 'Pending') {
            cancelBtnHtml = `
                <button onclick="cancelOrder('${order._id}')" style="background: #e74c3c; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: bold; transition: 0.2s; width: 30%;">
                    ❌ لغو سفارش
                </button>
            `;
        }

        // جایگذاری المان‌ها در کارت با اضافه شدن دکمه لغو
        card.innerHTML = `
            <div class="order-header">
                <span>کد سفارش: <b>${order._id.slice(-6)}</b></span>
                <span class="badge-status status-${order.status}">${statusText}</span>
            </div>
            <ul class="order-items-list">
                ${itemsHtml}
            </ul>
            <div class="order-footer">
                <div>
                    <span style="font-size: 14px; color: #555;">مجموع کل:</span>
                    <span style="color: #27ae60; font-size: 16px;">${(order.totalPrice || 0).toLocaleString('fa-IR')} تومان</span>
                </div>
                ${cancelBtnHtml}
            </div>
        `;
        listContainer.appendChild(card);
    });
}

// تابع لغو سفارش (ارتباط با سرور)
async function cancelOrder(orderId) {
    const confirmCancel = confirm("آیا از لغو این سفارش اطمینان دارید؟");
    if (!confirmCancel) return;

    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_ORDERS}/${orderId}/cancel`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            alert('سفارش شما با موفقیت لغو شد.');
            // رفرش کردن لیست سفارشات برای انتقال سفارش لغو شده به تاریخچه
            fetchUserOrders();
        } else {
            alert(data.message || 'خطا در لغو سفارش');
        }
    } catch (err) {
        console.error('Error cancelling order:', err);
        alert('خطا در ارتباط با سرور.');
    }
}