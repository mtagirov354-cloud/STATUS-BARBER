const adminPasswordInput = document.getElementById('adminPassword');
const loadBookingsBtn = document.getElementById('loadBookingsBtn');
const bookingsList = document.getElementById('bookingsList');
const adminMessage = document.getElementById('adminMessage');

let pollInterval;

function statusLabel(status) {
  switch (status) {
    case 'confirmed': return 'Подтверждено';
    case 'done': return 'Выполнено';
    case 'cancelled': return 'Отменено';
    default: return 'Новая';
  }
}

async function fetchBookings() {
  const password = adminPasswordInput.value.trim();
  if (!password) {
    adminMessage.textContent = 'Введите пароль администратора.';
    adminMessage.className = 'form-message error';
    return;
  }

  const response = await fetch('/api/admin/bookings', {
    headers: { 'x-admin-password': password }
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Не удалось загрузить заявки.');
  }

  renderBookings(data, password);
}

function renderBookings(bookings, password) {
  if (!bookings.length) {
    bookingsList.innerHTML = '<p>Пока заявок нет.</p>';
    return;
  }

  bookingsList.innerHTML = '';

  bookings.forEach((booking) => {
    const item = document.createElement('article');
    item.className = 'booking-item';

    item.innerHTML = `
      <h3>${booking.name} — ${booking.serviceTitle}</h3>
      <small>${new Date(booking.createdAt).toLocaleString('ru-RU')}</small>
      <p><strong>Телефон:</strong> ${booking.phone}</p>
      <p><strong>Дата/время:</strong> ${booking.datetime}</p>
      <p><strong>Комментарий:</strong> ${booking.comment || '—'}</p>
      <p><strong>Стоимость:</strong> ${booking.price} ₽</p>
      <p><strong>Статус:</strong> ${statusLabel(booking.status)}</p>
      <div class="status-row">
        <label for="status-${booking.id}">Изменить статус:</label>
        <select id="status-${booking.id}">
          <option value="new" ${booking.status === 'new' ? 'selected' : ''}>Новая</option>
          <option value="confirmed" ${booking.status === 'confirmed' ? 'selected' : ''}>Подтверждено</option>
          <option value="done" ${booking.status === 'done' ? 'selected' : ''}>Выполнено</option>
          <option value="cancelled" ${booking.status === 'cancelled' ? 'selected' : ''}>Отменено</option>
        </select>
        <button class="btn" data-id="${booking.id}">Сохранить</button>
      </div>
    `;

    const button = item.querySelector('button');
    const select = item.querySelector('select');

    button.addEventListener('click', async () => {
      try {
        const update = await fetch(`/api/admin/bookings/${booking.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-password': password
          },
          body: JSON.stringify({ status: select.value })
        });

        const result = await update.json();
        if (!update.ok) {
          throw new Error(result.message || 'Не удалось обновить статус.');
        }

        adminMessage.textContent = 'Статус обновлён.';
        adminMessage.className = 'form-message success';
        fetchBookings();
      } catch (error) {
        adminMessage.textContent = error.message;
        adminMessage.className = 'form-message error';
      }
    });

    bookingsList.appendChild(item);
  });
}

loadBookingsBtn.addEventListener('click', async () => {
  try {
    await fetchBookings();
    adminMessage.textContent = 'Данные загружены. Автообновление каждые 5 секунд.';
    adminMessage.className = 'form-message success';

    clearInterval(pollInterval);
    pollInterval = setInterval(() => {
      fetchBookings().catch(() => {});
    }, 5000);
  } catch (error) {
    adminMessage.textContent = error.message;
    adminMessage.className = 'form-message error';
  }
});
