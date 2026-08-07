const API_AUTH = 'http://localhost:5000/api/auth';

window.onload = () => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token || !user) {
    window.location.href = 'login.html';
    return;
  }

  fetchProfile();

  const userRole = String(user.role || user.type || '').toLowerCase().trim();
  if (userRole.includes('admin')) {
    const staffSec = document.getElementById('admin-create-staff-section');
    const usersSec = document.getElementById('admin-users-list-section');

    if (staffSec) staffSec.style.display = 'block';
    if (usersSec) usersSec.style.display = 'block';

    fetchAllUsers();
  }
};

async function fetchProfile() {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_AUTH}/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    if (res.ok) {
      document.getElementById('prof-name').value = data.name || '';
      document.getElementById('prof-email').value = data.email || '';
      document.getElementById('prof-phone').value = data.phone || '';
    }
  } catch (err) {
    console.error('خطا در دریافت پروفایل:', err);
  }
}

document.getElementById('profile-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const token = localStorage.getItem('token');

  const payload = {
    name: document.getElementById('prof-name').value,
    email: document.getElementById('prof-email').value,
    phone: document.getElementById('prof-phone').value
  };

  const pass = document.getElementById('prof-password').value;
  if (pass.trim() !== '') {
    payload.password = pass;
  }

  try {
    const res = await fetch(`${API_AUTH}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (res.ok) {
      alert('اطلاعات پروفایل شما با موفقیت بروزرسانی شد! 🎉');
      localStorage.setItem('user', JSON.stringify(data));
      document.getElementById('prof-password').value = '';
    } else {
      alert(data.message || 'خطا در ویرایش پروفایل');
    }
  } catch (err) {
    console.error(err);
    alert('ارتباط با سرور برقرار نشد.');
  }
});

async function fetchAllUsers() {
  const token = localStorage.getItem('token');
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  try {
    const res = await fetch(`${API_AUTH}/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const users = await res.json();

    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!Array.isArray(users) || users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6">هیچ کاربری یافت نشد.</td></tr>';
      return;
    }

    users.forEach(u => {
      const tr = document.createElement('tr');
      const roleStr = String(u.role || 'Customer');
      const roleLower = roleStr.toLowerCase().replace(/\s+/g, '');
      const isSelf = u._id === currentUser._id;

      tr.innerHTML = `
        <td>${u.name} ${isSelf ? ' <small style="color: #27ae60;">(شما)</small>' : ''}</td>
        <td>${u.email}</td>
        <td>${u.phone || 'ثبت نشده'}</td>
        <td><span class="role-badge role-${roleLower}">${roleStr}</span></td>
        <td>
          <select onchange="changeUserRole('${u._id}', this.value)" style="padding: 4px; border-radius: 4px; font-family: inherit;">
            <option value="Customer" ${roleStr === 'Customer' ? 'selected' : ''}>مشتری (Customer)</option>
            <option value="Kitchen Staff" ${roleStr === 'Kitchen Staff' || roleStr === 'Kitchen' ? 'selected' : ''}>آشپزخانه (Kitchen Staff)</option>
            <option value="Cashier" ${roleStr === 'Cashier' ? 'selected' : ''}>صندوق‌دار (Cashier)</option>
            <option value="Admin" ${roleStr === 'Admin' ? 'selected' : ''}>ادمین (Admin)</option>
          </select>
        </td>
        <td>
          ${isSelf ? '<span style="color: #aaa; font-size: 11px;">غیرقابل حذف</span>' : `
            <button onclick="deleteUser('${u._id}', '${u.name}')" style="background: #dc2626; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 12px; width: auto !important;">
              🗑️ حذف
            </button>
          `}
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('خطا در دریافت کاربران:', err);
  }
}

async function changeUserRole(userId, newRole) {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_AUTH}/users/${userId}/role`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ role: newRole })
    });

    const data = await res.json();
    if (res.ok) {
      alert('نقش کاربر با موفقیت تغییر کرد! 🎉');
      fetchAllUsers();
    } else {
      alert(data.message || 'خطا در تغییر نقش');
    }
  } catch (err) {
    console.error(err);
    alert('خطا در ارتباط با سرور');
  }
}

// حذف کاربر توسط ادمین
async function deleteUser(userId, userName) {
  const confirmDelete = confirm(`آیا از حذف کاربر «${userName}» اطمینان دارید؟`);
  if (!confirmDelete) return;

  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_AUTH}/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await res.json();
    if (res.ok) {
      alert(`کاربر «${userName}» با موفقیت حذف شد! 🗑️`);
      fetchAllUsers();
    } else {
      alert(data.message || 'خطا در حذف کاربر');
    }
  } catch (err) {
    console.error(err);
    alert('خطا در ارتباط با سرور');
  }
}

// ثبت پرسنل و نمایش رمز موقت در باکس اختصاصی روی صفحه
document.getElementById('create-staff-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const token = localStorage.getItem('token');

  const payload = {
    name: document.getElementById('staff-name').value,
    email: document.getElementById('staff-email').value,
    phone: document.getElementById('staff-phone').value,
    role: document.getElementById('staff-role').value
  };

  try {
    const res = await fetch(`${API_AUTH}/staff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (res.ok) {
      const box = document.getElementById('temp-password-box');
      const val = document.getElementById('temp-pass-val');
      
      if (box && val) {
        val.innerText = data.generatedPassword;
        box.style.display = 'block';
      }

      document.getElementById('create-staff-form').reset();
      fetchAllUsers();
    } else {
      alert(data.message || 'خطا در ثبت پرسنل');
    }
  } catch (err) {
    console.error(err);
    alert('خطا در ارتباط با سرور');
  }
});

function copyTempPassword() {
  const val = document.getElementById('temp-pass-val')?.innerText;
  if (val && val !== '---') {
    navigator.clipboard.writeText(val);
    alert('رمز عبور موقت در حافظه کپی شد! 📋');
  }
}