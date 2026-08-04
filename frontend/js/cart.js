// frontend/js/cart.js

document.addEventListener("DOMContentLoaded", () => {
    fetchCartItems();
});

// دریافت محتویات سبد خرید (وضعیت Pending) از بک‌اند
async function fetchCartItems() {
    const token = localStorage.getItem('token');
    if (!token) return window.location.href = 'login.html';

    try {
        // تغییر آدرس به API_ORDERS
        const response = await fetch(`${API_ORDERS}/cart`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const cartData = await response.json();
            renderCartPage(cartData);
        } else {
            document.getElementById('cartItems').innerHTML = '<p style="color:red;">خطا در دریافت سبد خرید.</p>';
        }
    } catch (error) {
        console.error('Fetch cart error:', error);
        document.getElementById('cartItems').innerHTML = '<p style="color:red;">خطا در ارتباط با سرور.</p>';
    }
}

// نمایش اطلاعات در صفحه HTML
function renderCartPage(cart) {
    const cartContainer = document.getElementById('cartItems');
    const checkoutBtn = document.getElementById('checkoutBtn');
    cartContainer.innerHTML = '';

    if (!cart.items || cart.items.length === 0) {
        cartContainer.innerHTML = '<p style="font-size: 14px; color: #888; text-align: center; padding: 20px 0;">سبد خرید شما خالی است. برای انتخاب غذا به صفحه اصلی برگردید.</p>';
        document.getElementById('totalPrice').innerText = '۰ تومان';
        checkoutBtn.disabled = true;
        checkoutBtn.style.opacity = "0.5";
        return;
    }

    // فعال کردن دکمه پرداخت
    checkoutBtn.disabled = false;
    checkoutBtn.style.opacity = "1";

    // ساخت لیست آیتم‌ها
    cart.items.forEach(item => {
        const itemName = item.menuItem ? item.menuItem.name : 'آیتم نامشخص';
        const itemId = item.menuItem ? item.menuItem._id : null;
        const itemTotalPrice = item.priceAtOrder * item.quantity;

        const li = document.createElement('li');
        li.className = 'cart-item';
        li.innerHTML = `
            <span class="cart-item-title">${itemName}</span>
            <span class="cart-item-qty">${item.quantity} عدد</span>
            <span class="cart-item-price">${itemTotalPrice.toLocaleString('fa-IR')} تومان</span>
            <button class="btn-remove" onclick="removeItemFromCart('${itemId}')" title="حذف یک عدد">✕</button>
        `;
        cartContainer.appendChild(li);
    });

    // آپدیت جمع کل
    document.getElementById('totalPrice').innerText = `${(cart.totalPrice || 0).toLocaleString('fa-IR')} تومان`;
}

// حذف آیتم و کسر از بک‌اند
async function removeItemFromCart(itemId) {
    if (!itemId) return;
    
    const token = localStorage.getItem('token');
    try {
        // تغییر آدرس به API_ORDERS
        const response = await fetch(`${API_ORDERS}/cart/remove`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ itemId })
        });

        if (response.ok) {
            // آپدیت عدد سبد خرید در هدر
            if(typeof fetchCartCount === 'function') fetchCartCount();
            
            // رفرش کردن لیست صفحه
            fetchCartItems();
        } else {
            alert('خطا در حذف آیتم');
        }
    } catch (error) {
        console.error('Error removing item:', error);
    }
}

// نهایی سازی سفارش
async function checkoutOrder() {
    const token = localStorage.getItem('token');
    
    try {
        // تغییر آدرس به API_ORDERS
        const response = await fetch(`${API_ORDERS}/checkout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            alert('سفارش شما با موفقیت ثبت و به آشپزخانه ارسال شد! 👨‍🍳');
            window.location.href = 'orders.html?tab=pending'; 
        } else {
            const data = await response.json();
            alert(data.message || 'خطا در نهایی سازی سفارش');
        }
    } catch (error) {
        console.error('Checkout error:', error);
    }
}