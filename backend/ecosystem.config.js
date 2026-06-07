module.exports = {
  apps: [
    {
      name: 'liquid-finance-api',
      script: 'dist/index.js',
      instances: 'max',            // Use cluster mode across all available CPUs
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',    // Automatic restart if memory exceeds 1GB
      autorestart: true,           // Automatic restart on failure
      exp_backoff_restart_delay: 100, // Wait longer between crashed restarts to prevent loops
      error_file: 'logs/pm2-error.log',
      out_file: 'logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ]
};
