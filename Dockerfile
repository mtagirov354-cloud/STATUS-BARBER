FROM node:22-alpine

WORKDIR /app

COPY package.json ./
COPY server.js ./
COPY public-client ./public-client
COPY public-admin ./public-admin
COPY data ./data

ENV NODE_ENV=production
ENV CLIENT_HOST=0.0.0.0
ENV ADMIN_HOST=0.0.0.0
ENV CLIENT_PORT=3000
ENV ADMIN_PORT=3001

EXPOSE 3000 3001

CMD ["node", "server.js"]
