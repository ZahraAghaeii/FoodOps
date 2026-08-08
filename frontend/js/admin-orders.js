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

// تابع جدید برای نمایش تاریخچه سفارش
async function showOrderLogs(orderId) {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_ORDERS}/${orderId}/logs`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const logs = await response.json();
        
        if (logs.length === 0) return alert('هیچ تغییری برای این سفارش ثبت نشده است.');

        let logText = "تاریخچه وضعیت سفارش:\n\n";
        logs.forEach(log => {
            const date = new Date(log.changedAt).toLocaleString('fa-IR');
            logText += `از ${log.oldStatus || 'شروع'} به ${log.newStatus} در تاریخ ${date}\n`;
        });
        alert(logText);
    } catch (err) {
        alert('خطا در دریافت تاریخچه.');
    }
}

function renderKanbanBoard(orders) {
    document.getElementById('col-Pending').innerHTML = '';
    document.getElementById('col-Preparing').innerHTML = '';
    document.getElementById('col-Ready').innerHTML = '';
    document.getElementById('col-Delivered').innerHTML = '';
    document.getElementById('col-Cancelled').innerHTML = '';

    if (orders.length === 0) return;

    orders.forEach(order => {
        const customerName = order.customer ? order.customer.name : 'کاربر نامشخص';
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
            <div class="admin-order-card" style="margin-bottom:10px; border:1px solid #ddd; padding:10px; border-radius:5px;">
                <div class="card-header">
                    <div>کد: ${order._id.slice(-5)}</div>
                    <div>⏱️ ${dateStr}</div>
                </div>
                <div class="card-customer">👤 ${customerName}</div>
                <ul class="card-items">${itemsHtml}</ul>
                <div class="card-total">مبلغ: ${(order.totalPrice || 0).toLocaleString('fa-IR')} تومان</div>
                <button onclick="showOrderLogs('${order._id}')" style="margin-top:5px; background:#3498db; color:white; border:none; padding:5px; border-radius:3px; cursor:pointer; width:100%;">مشاهده تاریخچه</button>
            </div>
        `;

        const targetColumn = document.getElementById(`col-${order.status}`);
        if (targetColumn) {
            targetColumn.innerHTML += cardHtml;
        }
    });
}