const servicesContainer = document.getElementById('services');
const serviceSelect = document.getElementById('serviceSelect');
const bookingForm = document.getElementById('bookingForm');
const formMessage = document.getElementById('formMessage');

async function loadServices() {
  const response = await fetch('/api/services');
  const services = await response.json();

  servicesContainer.innerHTML = '';
  serviceSelect.innerHTML = '<option value="">Выберите услугу</option>';

  services.forEach((service) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <h3>${service.title}</h3>
      <p>${service.description}</p>
      <div class="price">${service.price} ₽</div>
    `;
    servicesContainer.appendChild(card);

    const option = document.createElement('option');
    option.value = service.id;
    option.textContent = `${service.title} — ${service.price} ₽`;
    serviceSelect.appendChild(option);
  });
}

bookingForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  formMessage.textContent = 'Отправляем заявку...';
  formMessage.className = 'form-message';

  const formData = new FormData(bookingForm);
  const payload = Object.fromEntries(formData.entries());

  try {
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Ошибка записи.');

    formMessage.textContent = data.message;
    formMessage.className = 'form-message success';
    bookingForm.reset();
  } catch (error) {
    formMessage.textContent = error.message;
    formMessage.className = 'form-message error';
  }
});

loadServices().catch(() => {
  formMessage.textContent = 'Не удалось загрузить услуги.';
  formMessage.className = 'form-message error';
});
