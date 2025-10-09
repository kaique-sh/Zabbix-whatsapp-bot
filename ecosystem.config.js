module.exports = {
  apps: [{
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
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    // Restart strategies
    min_uptime: '10s',
    max_restarts: 10,
    // Advanced features
    kill_timeout: 5000,
    listen_timeout: 3000,
    // Health monitoring
    health_check_grace_period: 3000
  }]
};
