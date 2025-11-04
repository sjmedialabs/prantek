module.exports = {
  apps: [{
    name: 'prantek-app',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p 9080',
    cwd: '/www/wwwroot/prantek',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 9080
    },
    error_file: '/www/wwwroot/prantek/logs/pm2-error.log',
    out_file: '/www/wwwroot/prantek/logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
