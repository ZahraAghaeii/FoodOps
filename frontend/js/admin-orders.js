document.addEventListener("DOMContentLoaded", () => {
    fetchAllSystemOrders();
});

async function fetchAllSystemOrders() {
    const token = localStorage.getItem('token');
    if (!token) return window.location.href = 'login.html';

    try {
        const response = await fetch(`${API_ORDERS}/all`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const orders = await response.json();
            renderKanbanBoard(orders);
        } else {
            alert('خطا در دریافت اطلاعات. آیا شما ادمین هستید؟');
        }
    } catch (err) {
        console.error(err);
        alert('خطا در ارتباط با سرور.');
    }
}

function renderKanbanBoard(orders) {
    // پاک کردن ستون‌ها
    document.getElementById('col-Pending').innerHTML = '';
    document.getElementById('col-Preparing').innerHTML = '';
    document.getElementById('col-Ready').innerHTML = '';
    document.getElementById('col-Delivered').innerHTML = '';
    document.getElementById('col-Cancelled').innerHTML = '';

    if (orders.length === 0) return;

    orders.forEach(order => {
        const customerName = order.customer ? order.customer.name : 'کاربر نامشخص';
        const customerPhone = order.customer && order.customer.phone ? order.customer.phone : 'بدون شماره';

        // فرمت کردن تاریخ و ساعت دقیق
        const dateObj = new Date(order.createdAt);
        const dateStr = dateObj.toLocaleDateString('fa-IR') + ' - ' + dateObj.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

        let itemsHtml = '';
        if (order.items && order.items.length > 0) {
            order.items.forEach(i => {
                const name = i.menuItem ? i.menuItem.name : 'آیتم پاک شده';
                itemsHtml += `<li>${name} (x${i.quantity})</li>`;
            });
        }

        const cardHtml = `
                    <div class="admin-order-card">
                        <div class="card-header" style="display: block; margin-bottom: 8px;">
                            <div>کد: ${order._id.slice(-5)}</div>
                            <div style="margin-top: 4px;">⏱️ ${dateStr}</div>
                        </div>
                        <div class="card-customer">
                            👤 ${customerName} <br>
                            <span style="font-size: 11px; color: #888;">📞 ${customerPhone}</span>
                        </div>
                        <ul class="card-items">
                            ${itemsHtml}
                        </ul>
                        <div class="card-total">
                            مبلغ: ${(order.totalPrice || 0).toLocaleString('fa-IR')} تومان
                        </div>
                    </div>
                `;

        // پیدا کردن ستون مربوطه بر اساس وضعیت سفارش و اضافه کردن کارت به آن
        const targetColumn = document.getElementById(`col-${order.status}`);
        if (targetColumn) {
            targetColumn.innerHTML += cardHtml;
        }
    });
}