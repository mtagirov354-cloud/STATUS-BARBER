# STATUS-BARBER

Проект BARBER STATUS разделён на **2 отдельных сайта**:

1. **Сайт клиента (запись):** `http://localhost:3000`
2. **Сайт администратора (заявки):** `http://localhost:3001`

## Что есть в проекте
- Клиентский сайт с услугами и формой онлайн-записи.
- Админ-сайт с просмотром заявок и изменением статуса.
- После отправки формы заявка сразу сохраняется и отображается на админ-сайте.
- WhatsApp оставлен только как номер для связи (без отправки сообщений).

## Быстрый запуск локально
```bash
npm start
```

## Переменные окружения
Скопируйте пример:
```bash
cp .env.example .env
```

Доступные переменные:
- `CLIENT_PORT` — порт клиентского сайта (по умолчанию `3000`)
- `ADMIN_PORT` — порт админ-сайта (по умолчанию `3001`)
- `CLIENT_HOST` — хост для client bind (по умолчанию `0.0.0.0`)
- `ADMIN_HOST` — хост для admin bind (по умолчанию `0.0.0.0`)
- `ADMIN_PASSWORD` — пароль админ-сайта (по умолчанию `BARBERSTATUSADM`)

## Health-check (для хостинга/мониторинга)
- `GET http://127.0.0.1:3000/health`
- `GET http://127.0.0.1:3001/health`

## Подготовка к хостингу

### Вариант 1: VPS + PM2 (рекомендовано)
1. Установить Node.js 20+ и PM2.
2. Залить проект на сервер.
3. Запустить:
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```
4. Настроить Nginx как reverse proxy (пример: `deploy/nginx.example.conf`).
5. Подключить SSL:
   ```bash
   sudo certbot --nginx -d site.example.com -d admin.example.com
   ```

### Вариант 2: Docker
1. Сборка и запуск:
   ```bash
   docker compose up -d --build
   ```
2. Доступ:
   - `http://SERVER_IP:3000` (клиент)
   - `http://SERVER_IP:3001` (админ)

## Файлы деплоя
- `Dockerfile` — контейнер приложения
- `docker-compose.yml` — запуск контейнера
- `ecosystem.config.js` — запуск через PM2
- `deploy/nginx.example.conf` — пример Nginx-конфига под 2 домена

## Хранение данных
Заявки хранятся в файле `data/bookings.json`.

> Важно: добавьте резервное копирование папки `data/` на хостинге.
