const API_URL = 'http://localhost:5000/api';

// مدیریت فرم ورود
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

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
        alert('ورود با موفقیت انجام شد');
        window.location.href = 'index.html';
      } else {
        alert(data.message || 'خطا در ورود');
      }
    } catch (err) {
      alert('ارتباط با سرور برقرار نشد');
    }
  });
}

// مدیریت فرم ثبت‌نام
const registerForm = document.getElementById('register-form');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const role = document.getElementById('reg-role').value;

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
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
      alert('ارتباط با سرور برقرار نشد');
    }
  });
}

// خروج از حساب
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}