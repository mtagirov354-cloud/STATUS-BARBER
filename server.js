const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const CLIENT_PORT = process.env.CLIENT_PORT || 3000;
const ADMIN_PORT = process.env.ADMIN_PORT || 3001;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'BARBERSTATUSADM';

const clientDir = path.join(__dirname, 'public-client');
const adminDir = path.join(__dirname, 'public-admin');
const dataDir = path.join(__dirname, 'data');
const bookingsFile = path.join(dataDir, 'bookings.json');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(bookingsFile)) fs.writeFileSync(bookingsFile, JSON.stringify([], null, 2), 'utf8');

const services = [
  { id: 'kids-haircut', title: 'Детская стрижка', description: 'Детская стрижка в барбершопе — аккуратно, быстро и комфортно. Подберём форму под возраст и тип волос, создадим стильный образ без стресса для ребёнка. Опытный барбер и дружелюбная атмосфера.', price: 500 },
  { id: 'biocurl', title: 'Биозавивка', description: 'Биозавивка в барбершопе — стойкий объём и естественные локоны без вреда для волос. Мягкий состав, аккуратная техника и результат, подчёркивающий стиль и индивидуальность. Подходит для мужских стрижек любой длины.', price: 4000 },
  { id: 'straight-razor-shave', title: 'Бритье опасным лезвием', description: 'Бритьё опасным лезвием в барбершопе — идеально гладкая кожа и чёткие контуры. Классическая техника, горячие полотенца и профессиональные средства обеспечивают комфорт, точность и настоящий мужской ритуал.', price: 500 },
  { id: 'mens-haircut', title: 'Мужская стрижка', description: 'Мужская стрижка в барбершопе — это точная работа барбера, стиль и аккуратность. Подберём форму под тип лица, учтём рост волос и тренды. Классика или современный образ — качественно и со вкусом.', price: 800 },
  { id: 'barber-course', title: 'Обучение «Барбер с нуля»', description: 'Обучение барбера с нуля — практический курс в барбершопе для начинающих. Освоите мужские стрижки, бритьё, работу с бородой и инструментами. Опытные наставники, практика на моделях и уверенный старт в профессии.', price: 1 },
  { id: 'gray-camouflage', title: 'Камуфляж Седины', description: 'Камуфляж седины в барбершопе — естественный результат без эффекта окрашивания. Мягко выравниваем тон волос и бороды, сохраняем мужской стиль и ухоженный вид. Быстро, аккуратно и профессионально.', price: 500 },
  { id: 'face-care', title: 'Уход за кожей лица', description: 'Уход за кожей лица в барбершопе — очищение, увлажнение и восстановление мужской кожи. Профессиональные средства, расслабляющая процедура и заметный результат: свежий, ухоженный и здоровый вид.', price: 400 },
  { id: 'beard-modeling', title: 'Моделирование бороды / бритье', description: 'Моделирование бороды и усов / бритьё в барбершопе — чёткие линии, аккуратная форма и ухоженный вид. Барбер подберёт стиль под лицо, выполнит классическое или королевское бритьё с профессиональными средствами.', price: 500 },
  { id: 'wax-correction', title: 'Коррекция воском', description: 'Коррекция воском в барбершопе — быстрое и эффективное удаление нежелательных волос. Чёткие линии, аккуратный результат и длительный эффект. Подходит для бровей, ушей, носа и зоны бороды.', price: 200 }
];

function readBookings() {
  try {
    return JSON.parse(fs.readFileSync(bookingsFile, 'utf8'));
  } catch {
    return [];
  }
}

function writeBookings(bookings) {
  fs.writeFileSync(bookingsFile, JSON.stringify(bookings, null, 2), 'utf8');
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1e6) {
        reject(new Error('Payload too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.html') return 'text/html; charset=utf-8';
  if (ext === '.css') return 'text/css; charset=utf-8';
  if (ext === '.js') return 'application/javascript; charset=utf-8';
  if (ext === '.json') return 'application/json; charset=utf-8';
  return 'text/plain; charset=utf-8';
}

function serveStatic(req, res, pathname, rootDir) {
  const requested = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.normalize(path.join(rootDir, requested));

  if (!filePath.startsWith(rootDir)) return sendJson(res, 403, { message: 'Forbidden' });

  fs.readFile(filePath, (err, data) => {
    if (err) return sendJson(res, 404, { message: 'Not found' });
    res.writeHead(200, { 'Content-Type': contentType(filePath) });
    res.end(data);
  });
}

async function handleClientApi(req, res, pathname) {
  if (req.method === 'GET' && pathname === '/api/services') {
    sendJson(res, 200, services);
    return true;
  }

  if (req.method === 'POST' && pathname === '/api/bookings') {
    try {
      const { name, phone, serviceId, datetime, comment } = await parseBody(req);
      if (!name || !phone || !serviceId || !datetime) {
        sendJson(res, 400, { message: 'Заполните имя, телефон, услугу и дату/время.' });
        return true;
      }

      const service = services.find((item) => item.id === serviceId);
      if (!service) {
        sendJson(res, 400, { message: 'Услуга не найдена.' });
        return true;
      }

      const booking = {
        id: Date.now(),
        createdAt: new Date().toISOString(),
        status: 'new',
        name,
        phone,
        serviceId,
        serviceTitle: service.title,
        price: service.price,
        datetime,
        comment: comment || ''
      };

      const bookings = readBookings();
      bookings.unshift(booking);
      writeBookings(bookings);

      sendJson(res, 201, { message: 'Вы успешно записаны. Администратор уже получил заявку.', bookingId: booking.id });
      return true;
    } catch {
      sendJson(res, 400, { message: 'Некорректный формат заявки.' });
      return true;
    }
  }

  return false;
}

async function handleAdminApi(req, res, pathname) {
  if (req.headers['x-admin-password'] !== ADMIN_PASSWORD) {
    sendJson(res, 401, { message: 'Неверный пароль администратора.' });
    return true;
  }

  if (req.method === 'GET' && pathname === '/api/admin/bookings') {
    sendJson(res, 200, readBookings());
    return true;
  }

  if (req.method === 'PATCH' && pathname.startsWith('/api/admin/bookings/')) {
    const bookingId = Number(pathname.split('/').pop());
    const allowedStatuses = ['new', 'confirmed', 'done', 'cancelled'];

    try {
      const { status } = await parseBody(req);
      if (!allowedStatuses.includes(status)) {
        sendJson(res, 400, { message: 'Недопустимый статус.' });
        return true;
      }

      const bookings = readBookings();
      const booking = bookings.find((item) => item.id === bookingId);
      if (!booking) {
        sendJson(res, 404, { message: 'Заявка не найдена.' });
        return true;
      }

      booking.status = status;
      writeBookings(bookings);
      sendJson(res, 200, { message: 'Статус обновлён.' });
      return true;
    } catch {
      sendJson(res, 400, { message: 'Некорректный формат запроса.' });
      return true;
    }
  }

  return false;
}

const clientServer = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const { pathname } = parsedUrl;

  const handled = await handleClientApi(req, res, pathname);
  if (handled) return;

  serveStatic(req, res, pathname, clientDir);
});

const adminServer = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const { pathname } = parsedUrl;

  if (pathname.startsWith('/api/admin/')) {
    const handled = await handleAdminApi(req, res, pathname);
    if (handled) return;
    return sendJson(res, 404, { message: 'Not found' });
  }

  serveStatic(req, res, pathname, adminDir);
});

clientServer.listen(CLIENT_PORT, () => {
  console.log(`Client site: http://localhost:${CLIENT_PORT}`);
});

adminServer.listen(ADMIN_PORT, () => {
  console.log(`Admin site: http://localhost:${ADMIN_PORT}`);
  console.log(`Admin password: ${ADMIN_PASSWORD}`);
});
