module.exports = {
  apps: [
    {
      name: 'zabbix-whatsapp-bot',
      script: 'index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/bot-err.log',
      out_file: './logs/bot-out.log',
      log_file: './logs/bot-combined.log',
      time: true,
      // Restart strategies
      min_uptime: '10s',
      max_restarts: 10,
      // Advanced features
      kill_timeout: 5000,
      listen_timeout: 3000,
      // Health monitoring
      health_check_grace_period: 3000
    },
    {
      name: 'voetur-web-admin',
      script: 'web-admin/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        WEB_ADMIN_PORT: 4000
      },
      env_production: {
        NODE_ENV: 'production',
        WEB_ADMIN_PORT: 4000
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/web-err.log',
      out_file: './logs/web-out.log',
      log_file: './logs/web-combined.log',
      time: true,
      // Restart strategies
      min_uptime: '5s',
      max_restarts: 5,
      // Advanced features
      kill_timeout: 3000,
      listen_timeout: 2000,
      // Health monitoring
      health_check_grace_period: 2000
    }
  ]
};
