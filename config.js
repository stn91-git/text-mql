module.exports = {
    apps: [
      {
        name: "blackcard-backend", // PM2 process name
        script: "dist/main.js",    // compiled NestJS entry point
        cwd: "/home/ubuntu/blackcard_backend_service", // working directory
        watch: false,               // disable file watching in production
        env: {
          NODE_ENV: "production",
          PORT: 5001,
          HOST: "127.0.0.1"
        },
        error_file: "/home/ubuntu/blackcard_backend_service/logs/error.log",
        out_file: "/home/ubuntu/blackcard_backend_service/logs/out.log",
        log_date_format: "YYYY-MM-DD HH:mm:ss Z"
      },
      {
        name: "pluto-website",
        cwd: "/home/ubuntu/pluto-website",
        // Run Astro preview in production
        script: "./node_modules/.bin/astro",
        args: "preview --host 127.0.0.1 --port 4321",
        watch: false,
        interpreter: "/bin/bash",
        env: {
          NODE_ENV: "production",
          HOST: "127.0.0.1",
          PORT: 4321
        },
        error_file: "/home/ubuntu/pluto-website/logs/error.log",
        out_file: "/home/ubuntu/pluto-website/logs/out.log",
        log_date_format: "YYYY-MM-DD HH:mm:ss Z",
        autorestart: true,
        max_restarts: 10
      },

      {
        name: "text-to-mql-app-frontend",
        cwd: "/home/ubuntu/text-mql/frontend",
        // Run Astro preview in production
        script: "./node_modules/.bin/astro",
        args: "preview --host 127.0.0.1 --port 4324",
        watch: false,
        interpreter: "/bin/bash",
        env: {
          NODE_ENV: "production",
          HOST: "127.0.0.1",
          PORT: 4324
        },
        error_file: "/home/ubuntu/text-mql/frontend/logs/error.log",
        out_file: "/home/ubuntu/text-mql/frontend/logs/out.log",
        log_date_format: "YYYY-MM-DD HH:mm:ss Z",
        autorestart: true,
        max_restarts: 10
      },
      {
        name: "pluto-money-client",
        cwd: "/home/ubuntu/pluto-money-client",
        script: "npm",
        args: "start -- -p 3000 -H 127.0.0.1",
        watch: false,
        env: {
          NODE_ENV: "production",
          HOST: "127.0.0.1",
          PORT: 3000
        },
        error_file: "/home/ubuntu/pluto-money-client/logs/error.log",
        out_file: "/home/ubuntu/pluto-money-client/logs/out.log",
        log_date_format: "YYYY-MM-DD HH:mm:ss Z",
        autorestart: true,
        max_restarts: 10
      },
      {
        name: "AURA",
        cwd: "/home/ubuntu/AURA",
        script: "npm",
        args: "start -- -p 5100 -H 127.0.0.1",
        watch: false,
        env: {
          NODE_ENV: "production",
          HOST: "127.0.0.1",
          PORT: 5100
        },
        error_file: "/home/ubuntu/AURA/logs/error.log",
        out_file: "/home/ubuntu/AURA/logs/out.log",
        log_date_format: "YYYY-MM-DD HH:mm:ss Z",
        autorestart: true,
        max_restarts: 10
      },
      {
        name: "AURA-BACKEND-SERVICE",
        cwd: "/home/ubuntu/aura-backend-service",
        script: "npm",
        args: "start -- --port=5200 --host=127.0.0.1",
        watch: false,
        env: {
          NODE_ENV: "production",
          HOST: "127.0.0.1",
          PORT: 5200
        },
        error_file: "/home/ubuntu/aura-backend-service/logs/error.log",
        out_file: "/home/ubuntu/aura-backend-service/logs/out.log",
        log_date_format: "YYYY-MM-DD HH:mm:ss Z",
        autorestart: true,
        max_restarts: 10
      }
    ]
  };