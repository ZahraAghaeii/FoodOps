const API_DISCOUNTS = 'http://localhost:5000/api/discounts';

document.addEventListener('DOMContentLoaded', () => {
  if (typeof fetchCategories === 'function') {
    fetchCategories();
  }
  loadWorkingHoursAdmin();
  fetchAdminDiscounts();

  // ثبت کد تخفیف جدید توسط ادمین
  const discountForm = document.getElementById('add-discount-form');
  if (discountForm) {
    discountForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const token = localStorage.getItem('token');
      const code = document.getElementById('discount-code').value.trim();
      const discountPercent = Number(document.getElementById('discount-percent').value);
      const expiryDate = document.getElementById('discount-expiry').value;

      try {
        const res = await fetch(API_DISCOUNTS, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ code, discountPercent, expiryDate })
        });
        const data = await res.json();
        if (res.ok) {
          alert('کد تخفیف با موفقیت ایجاد شد! 🎟️');
          discountForm.reset();
          fetchAdminDiscounts();
        } else {
          alert(data.message || 'خطا در ایجاد کد تخفیف');
        }
      } catch (err) {
        console.error(err);
        alert('خطا در ارتباط با سرور');
      }
    });
  }

  // ثبت ساعات کاری
  const workingHoursForm = document.getElementById('working-hours-form');
  if (workingHoursForm) {
    workingHoursForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const token = localStorage.getItem('token');
      const openingTime = document.getElementById('opening-time').value;
      const closingTime = document.getElementById('closing-time').value;
      const isSystemOpen = document.getElementById('system-status').value === 'true';

      try {
        const res = await fetch('http://localhost:5000/api/orders/working-hours', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ openingTime, closingTime, isSystemOpen })
        });
        const data = await res.json();
        if (res.ok) {
          alert('ساعات کاری با موفقیت بروزرسانی شد! ⏰');
        } else {
          alert(data.message || 'خطا در ثبت ساعات کاری');
        }
      } catch (err) {
        console.error(err);
        alert('ارتباط با سرور برقرار نشد.');
      }
    });
  }
});

async function loadWorkingHoursAdmin() {
  try {
    const res = await fetch('http://localhost:5000/api/orders/working-hours');
    const data = await res.json();
    if (data) {
      if (document.getElementById('opening-time')) document.getElementById('opening-time').value = data.openingTime || "08:00";
      if (document.getElementById('closing-time')) document.getElementById('closing-time').value = data.closingTime || "22:00";
      if (document.getElementById('system-status')) document.getElementById('system-status').value = String(data.isSystemOpen);
    }
  } catch (err) {
    console.error(err);
  }
}

// دریافت لیست کدهای تخفیف جهت نمایش در جدول ادمین
async function fetchAdminDiscounts() {
  const token = localStorage.getItem('token');
  const tbody = document.getElementById('discounts-table-body');
  if (!tbody) return;

  try {
    const res = await fetch(API_DISCOUNTS, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const discounts = await res.json();

    tbody.innerHTML = '';
    if (!Array.isArray(discounts) || discounts.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="padding: 10px; text-align: center;">هیچ کد تخفیفی تعریف نشده است.</td></tr>';
      return;
    }

    discounts.forEach(d => {
      const tr = document.createElement('tr');
      const formattedDate = new Date(d.expiryDate).toLocaleDateString('fa-IR');
      tr.innerHTML = `
        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; color: #854d0e;">${d.code}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${d.discountPercent}%</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${formattedDate}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">
          <button onclick="deleteDiscount('${d._id}')" style="background: #dc2626; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;">حذف</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('خطا در دریافت کدهای تخفیف:', err);
  }
}

// حذف کد تخفیف
async function deleteDiscount(id) {
  if (!confirm('آیا از حذف این کد تخفیف اطمینان دارید؟')) return;
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_DISCOUNTS}/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      alert('کد تخفیف حذف شد.');
      fetchAdminDiscounts();
    } else {
      alert('خطا در حذف کد تخفیف');
    }
  } catch (err) {
    console.error(err);
  }
}