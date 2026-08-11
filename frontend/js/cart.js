// frontend/js/cart.js

let appliedDiscountCode = ''; // ذخیره کد تخفیف معتبر
let rawCartTotal = 0;        // ذخیره مبلغ واقعی بدون تخفیف

document.addEventListener("DOMContentLoaded", () => {
    fetchCartItems();
});

// دریافت محتویات سبد خرید از بک‌اند
async function fetchCartItems() {
    const token = localStorage.getItem('token');
    if (!token) return window.location.href = 'login.html';

    try {
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
    
    // ۱. بررسی سبد خالی
    if (!cart.items || cart.items.length === 0) {
        cartContainer.innerHTML = '<p style="text-align:center;">سبد خرید شما خالی است.</p>';
        document.getElementById('totalPrice').innerText = '۰ تومان';
        rawCartTotal = 0;
        
        // غیرفعال کردن دکمه
        checkoutBtn.disabled = true;
        checkoutBtn.style.opacity = "0.5";
        return;
    }

    // ۲. فعال کردن دکمه تایید (این بخش حذف شده بود!)
    checkoutBtn.disabled = false;
    checkoutBtn.style.opacity = "1";

    // ۳. ذخیره مبلغ و پر کردن لیست
    rawCartTotal = cart.totalPrice || 0;
    cartContainer.innerHTML = ''; // پاک کردن محتوای قبلی

    cart.items.forEach(item => {
        const li = document.createElement('li');
        li.className = 'cart-row'; 
        li.innerHTML = `
            <div class="item-info">
                <span class="item-name">${item.menuItem.name}</span>
                <span class="item-price">(${item.quantity} عدد - ${(item.priceAtOrder * item.quantity).toLocaleString('fa-IR')} تومان)</span>
            </div>
            <button class="btn-remove" onclick="removeItemFromCart('${item.menuItem._id}')" title="حذف">✕</button>
        `;
        cartContainer.appendChild(li);
    });

    // ۴. آپدیت قیمت نهایی
    document.getElementById('totalPrice').innerText = `${rawCartTotal.toLocaleString('fa-IR')} تومان`;
}
// function renderCartPage(cart) {
//     const cartContainer = document.getElementById('cartItems');
//     const checkoutBtn = document.getElementById('checkoutBtn');
//     cartContainer.innerHTML = '';

//     if (!cart.items || cart.items.length === 0) {
//         cartContainer.innerHTML = '<p style="font-size: 14px; color: #888; text-align: center; padding: 20px 0;">سبد خرید شما خالی است. برای انتخاب غذا به صفحه اصلی برگردید.</p>';
//         document.getElementById('totalPrice').innerText = '۰ تومان';
//         rawCartTotal = 0;
//         checkoutBtn.disabled = true;
//         checkoutBtn.style.opacity = "0.5";
//         return;
//     }

//     // فعال کردن دکمه پرداخت
//     checkoutBtn.disabled = false;
//     checkoutBtn.style.opacity = "1";

//     // ذخیره مبلغ خام سبد خرید
//     rawCartTotal = cart.totalPrice || 0;

//     // ساخت لیست آیتم‌ها
//     cart.items.forEach(item => {
//         const itemName = item.menuItem ? item.menuItem.name : 'آیتم نامشخص';
//         const itemId = item.menuItem ? item.menuItem._id : null;
//         const itemTotalPrice = item.priceAtOrder * item.quantity;

//         const li = document.createElement('li');
//         li.className = 'cart-item';
//         li.innerHTML = `
//             <span class="cart-item-title">${itemName}</span>
//             <span class="cart-item-qty">${item.quantity} عدد</span>
//             <span class="cart-item-price">${itemTotalPrice.toLocaleString('fa-IR')} تومان</span>
//             <button class="btn-remove" onclick="removeItemFromCart('${itemId}')" title="حذف یک عدد">✕</button>
//         `;
//         cartContainer.appendChild(li);
//     });

//     // آپدیت جمع کل با مقدار امن rawCartTotal
//     document.getElementById('totalPrice').innerText = `${rawCartTotal.toLocaleString('fa-IR')} تومان`;
// }


// بررسی و اعمال کد تخفیف
async function applyDiscountCode() {
    const codeInput = document.getElementById('discountCodeInput');
    const msgElement = document.getElementById('discountMessage');
    const code = codeInput ? codeInput.value.trim() : '';

    if (!code) {
        msgElement.style.color = '#dc2626';
        msgElement.innerText = 'لطفاً یک کد تخفیف وارد کنید.';
        return;
    }

    if (rawCartTotal <= 0) {
        msgElement.style.color = '#dc2626';
        msgElement.innerText = 'سبد خرید شما خالی است.';
        return;
    }

    const token = localStorage.getItem('token');

    try {
        const response = await fetch('http://localhost:5000/api/discounts/apply', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ code, cartTotal: rawCartTotal })
        });

        const data = await response.json();

        if (response.ok) {
            appliedDiscountCode = code;
            msgElement.style.color = '#16a34a';
            msgElement.innerText = `${data.message} (${data.discountPercent}% تخفیف)`;
            // نمایش مبلغ جدید پس از تخفیف به همراه کلمه تومان
            document.getElementById('totalPrice').innerText = `${Math.round(data.finalPrice).toLocaleString('fa-IR')} تومان`;
        } else {
            appliedDiscountCode = '';
            msgElement.style.color = '#dc2626';
            msgElement.innerText = data.message || 'کد تخفیف نامعتبر است.';
        }
    } catch (error) {
        console.error('Discount error:', error);
        msgElement.style.color = '#dc2626';
        msgElement.innerText = 'خطا در ارتباط با سرور.';
    }
}

// حذف آیتم و کسر از بک‌اند
async function removeItemFromCart(itemId) {
    if (!itemId) return;
    
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_ORDERS}/cart/remove`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ itemId })
        });

        if (response.ok) {
            if(typeof fetchCartCount === 'function') fetchCartCount();
            fetchCartItems();
        } else {
            alert('خطا در حذف آیتم');
        }
    } catch (error) {
        console.error('Error removing item:', error);
    }
}

// نهایی سازی سفارش (به همراه ارسال کد تخفیف در صورت وجود)
async function checkoutOrder() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_ORDERS}/checkout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ discountCode: appliedDiscountCode })
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

// دریافت و نمایش کدهای تخفیف فعال برای مشتری در صفحه سبد خرید
async function fetchPublicDiscounts() {
    const token = localStorage.getItem('token');
    const container = document.getElementById('publicDiscountsContainer');
    if (!container) return;

    try {
        const response = await fetch('http://localhost:5000/api/discounts/public', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const discounts = await response.json();

        container.innerHTML = '';
        if (!Array.isArray(discounts) || discounts.length === 0) {
            container.innerHTML = '<span style="font-size: 12px; color: #888;">در حال حاضر کد تخفیف فعالی وجود ندارد.</span>';
            return;
        }

        discounts.forEach(d => {
            const badge = document.createElement('button');
            badge.type = 'button';
            badge.style.cssText = 'background: #fef3c7; border: 1px solid #f59e0b; color: #92400e; padding: 4px 10px; border-radius: 20px; font-size: 12px; cursor: pointer; font-weight: bold;';
            badge.innerHTML = `🎫 ${d.code} (${d.discountPercent}%)`;
            badge.title = 'برای استفاده کلیک کنید';
            badge.onclick = () => {
                document.getElementById('discountCodeInput').value = d.code;
            };
            container.appendChild(badge);
        });
    } catch (err) {
        console.error('خطا در دریافت کدهای تخفیف عمومی:', err);
    }
}

// اضافه کردن فراخوانی این تابع به رویداد لود صفحه سبد خرید
document.addEventListener("DOMContentLoaded", () => {
    fetchCartItems();
    fetchPublicDiscounts(); // <-- دریافت کدهای تخفیف فعال هنگام باز شدن سبد خرید
});