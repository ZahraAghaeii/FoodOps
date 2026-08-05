let currentTab = 'pending';
let countdownIntervals = {}; // ذخیره تایمرها جهت جلوگیری از تداخل

document.addEventListener("DOMContentLoaded", () => {
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
    
    // پاک کردن تایمرهای قبلی هنگام تعویض تب
    Object.values(countdownIntervals).forEach(interval => clearInterval(interval));
    countdownIntervals = {};

    fetchUserOrders();
}

async function fetchUserOrders() {
    const token = localStorage.getItem('token');
    const listContainer = document.getElementById('ordersList');
    listContainer.innerHTML = '<p style="text-align: center; color: #888; padding: 20px;">در حال دریافت اطلاعات...</p>';

    try {
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

        let cancelBtnHtml = '';
        if (order.status === 'Pending') {
            cancelBtnHtml = `
                <button onclick="cancelOrder('${order._id}')" style="background: #e74c3c; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: bold; transition: 0.2s; width: 30%;">
                    ❌ لغو سفارش
                </button>
            `;
        }

        // بخش تایمر معکوس برای سفارش‌های در حال انجام
        let prepTimerHtml = '';
        const isPendingOrPreparing = ['Pending', 'Preparing'].includes(order.status);
        
        if (isPendingOrPreparing && order.estimatedReadyAt) {
            prepTimerHtml = `
                <div class="prep-timer-box">
                    <span style="color: #b7791f; font-weight: bold;">⏱️ زمان تقریبی آماده‌سازی:</span>
                    <span id="countdown-${order._id}" style="font-weight: bold; color: #d69e2e; direction: ltr;">
                        در حال محاسبه...
                    </span>
                </div>
            `;
        } else if (order.status === 'Ready') {
            prepTimerHtml = `
                <div class="prep-timer-box" style="background: #f0fff4; border-color: #9ae6b4;">
                    <span style="color: #27ae60; font-weight: bold;">🔔 غذا آماده تحویل است!</span>
                    <span style="color: #27ae60; font-weight: bold;">لطفاً به تحویل مراجعه کنید</span>
                </div>
            `;
        }

        card.innerHTML = `
            <div class="order-header">
                <span>کد سفارش: <b>${order._id.slice(-6)}</b></span>
                <span class="badge-status status-${order.status}">${statusText}</span>
            </div>
            <ul class="order-items-list">
                ${itemsHtml}
            </ul>
            ${prepTimerHtml}
            <div class="order-footer">
                <div>
                    <span style="font-size: 14px; color: #555;">مجموع کل:</span>
                    <span style="color: #27ae60; font-size: 16px;">${(order.totalPrice || 0).toLocaleString('fa-IR')} تومان</span>
                </div>
                ${cancelBtnHtml}
            </div>
        `;
        listContainer.appendChild(card);

        // فعال‌سازی تایمر زنده
        if (isPendingOrPreparing && order.estimatedReadyAt) {
            startCountdown(order._id, order.estimatedReadyAt);
        }
    });
}

// تابع محاسبه و بروزرسانی آنلاین تایمر
function startCountdown(orderId, targetDateStr) {
    const targetDate = new Date(targetDateStr).getTime();

    const updateTimer = () => {
        const now = new Date().getTime();
        const distance = targetDate - now;

        const elem = document.getElementById(`countdown-${orderId}`);
        if (!elem) {
            if (countdownIntervals[orderId]) clearInterval(countdownIntervals[orderId]);
            return;
        }

        if (distance <= 0) {
            if (countdownIntervals[orderId]) clearInterval(countdownIntervals[orderId]);
            elem.innerText = 'تقریباً آماده است! 🔔';
            elem.style.color = '#27ae60';
            return;
        }

        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        const formattedSec = seconds < 10 ? `0${seconds}` : seconds;
        elem.innerText = `${minutes}:${formattedSec} باقی‌مانده`;
    };

    updateTimer(); // اجرای آنی نوبت اول
    countdownIntervals[orderId] = setInterval(updateTimer, 1000);
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
            fetchUserOrders();
        } else {
            alert(data.message || 'خطا در لغو سفارش');
        }
    } catch (err) {
        console.error('Error cancelling order:', err);
        alert('خطا در ارتباط با سرور.');
    }
}