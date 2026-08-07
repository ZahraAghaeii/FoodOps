const API_URL = 'http://localhost:5000/api';

// مدیریت فرم ورود
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm') || document.getElementById('login-form');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const emailElem = document.getElementById('loginEmail') || document.getElementById('email');
      const passElem = document.getElementById('loginPassword') || document.getElementById('password');

      const email = emailElem ? emailElem.value.trim() : '';
      const password = passElem ? passElem.value.trim() : '';

      try {
        const res = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        if (res.ok) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));

          // بررسی دقیق فیلد isPasswordTemp برای هدایت اجباری به صفحه تغییر رمز
          if (data.user && (data.user.isPasswordTemp === true || data.user.isPasswordTemp === 'true')) {
            alert('شما با رمز عبور موقت وارد شده‌اید. جهت حفظ امنیت، لطفاً یک رمز جدید تعیین کنید.');
            window.location.href = 'change-password.html';
          } else {
            alert('ورود با موفقیت انجام شد');
            window.location.href = 'index.html';
          }
        } else {
          alert(data.message || 'خطا در ورود');
        }
      } catch (err) {
        console.error(err);
        alert('ارتباط با سرور برقرار نشد');
      }
    });
  }
});

// مدیریت فرم ثبت‌نام عمومی
document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('registerForm') || document.getElementById('register-form');

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nameElem = document.getElementById('regName') || document.getElementById('reg-name');
      const emailElem = document.getElementById('regEmail') || document.getElementById('reg-email');
      const passElem = document.getElementById('regPassword') || document.getElementById('reg-password');

      const name = nameElem ? nameElem.value.trim() : '';
      const email = emailElem ? emailElem.value.trim() : '';
      const password = passElem ? passElem.value.trim() : '';

      try {
        const res = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });

        const data = await res.json();
        if (res.ok) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          alert('ثبت‌نام با موفقیت انجام شد');
          window.location.href = 'index.html';
        } else {
          alert(data.message || 'خطا در ثبت‌نام');
        }
      } catch (err) {
        console.error(err);
        alert('ارتباط با سرور برقرار نشد');
      }
    });
  }
});

// خروج از حساب
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}