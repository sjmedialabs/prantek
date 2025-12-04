module.exports = {
  apps: [{
    name: 'prantek-app',
    script: 'npm',
    args: 'run dev',
    cwd: '/www/wwwroot/prantek',
    env: {
      NODE_ENV: 'development',
      PORT: '9080',
      HOST: '0.0.0.0'
    },
    watch: false,
    instances: 1,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
}
