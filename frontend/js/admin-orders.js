let allSystemOrders = []; // متغیر سراسری برای نگهداری تمام سفارشات

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
            allSystemOrders = await response.json();
            renderKanbanBoard(allSystemOrders); // در ابتدا همه را نمایش بده
        } else {
            alert('خطا در دریافت اطلاعات. آیا شما ادمین هستید؟');
        }
    } catch (err) {
        console.error(err);
        alert('خطا در ارتباط با سرور.');
    }
}

// تابع اعمال فیلتر تاریخ
function applyDateFilter() {
    const selectedDate = document.getElementById('orderDateFilter').value;
    const statusText = document.getElementById('filterStatus');

    if (!selectedDate) {
        alert('لطفاً ابتدا یک تاریخ را از تقویم انتخاب کنید.');
        return;
    }

    // فیلتر کردن آرایه اصلی بر اساس تطابق بخش تاریخ
    const filteredOrders = allSystemOrders.filter(order => {
        const orderDateOnly = new Date(order.createdAt).toISOString().split('T')[0];
        return orderDateOnly === selectedDate;
    });

    statusText.innerText = `نمایش نتایج برای تاریخ: ${selectedDate} (${filteredOrders.length} سفارش)`;
    statusText.style.color = '#27ae60';
    
    renderKanbanBoard(filteredOrders);
}

// تابع پاک کردن فیلتر
function clearDateFilter() {
    document.getElementById('orderDateFilter').value = '';
    const statusText = document.getElementById('filterStatus');
    statusText.innerText = 'در حال نمایش تمام سفارشات';
    statusText.style.color = '#7f8c8d';
    
    renderKanbanBoard(allSystemOrders);
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
                itemsHtml += `<li style="margin-bottom: 4px;">${name} (x${i.quantity})</li>`;
            });
        }

        const cardHtml = `
            <div class="admin-order-card" style="margin-bottom:15px; border:1px solid #ddd; padding:15px; border-radius:8px; background: #fdfefe;">
                <div class="card-header" style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #7f8c8d; font-size: 11px;">
                    <div>کد: <b>${order._id.slice(-5)}</b></div>
                    <div>⏱️ ${dateStr}</div>
                </div>
                <div class="card-customer" style="font-weight: bold; color: #2c3e50; font-size: 14px; margin-bottom: 8px;">👤 ${customerName}</div>
                <ul class="card-items" style="list-style: none; padding: 0; margin: 10px 0; color: #555; border-top: 1px dashed #eee; padding-top: 8px;">${itemsHtml}</ul>
                <div class="card-total" style="font-weight: bold; color: #27ae60; margin-top: 10px;">مبلغ: ${(order.totalPrice || 0).toLocaleString('fa-IR')} تومان</div>
                <button onclick="showOrderLogs('${order._id}')" style="margin-top:12px; background:#3498db; color:white; border:none; padding:8px; border-radius:5px; cursor:pointer; width:100%; font-weight: bold; transition: 0.2s;">مشاهده تاریخچه</button>
            </div>
        `;

        const targetColumn = document.getElementById(`col-${order.status}`);
        if (targetColumn) {
            targetColumn.innerHTML += cardHtml;
        }
    });
}