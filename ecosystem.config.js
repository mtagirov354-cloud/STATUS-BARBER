module.exports = {
  apps: [
    {
      name: 'status-barber',
      script: 'server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        CLIENT_PORT: 3000,
        ADMIN_PORT: 3001,
        CLIENT_HOST: '0.0.0.0',
        ADMIN_HOST: '0.0.0.0',
        ADMIN_PASSWORD: 'BARBERSTATUSADM'
      }
    }
  ]
};
