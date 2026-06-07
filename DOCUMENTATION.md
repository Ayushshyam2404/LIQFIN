# LIQIFIN Operations & Systems Documentation

This document provides system operators, developers, and administrators with instructions for deploying, configuring, monitoring, and maintaining the LIQIFIN personal finance dashboard.

---

## 1. Environment Variable Reference

### Backend Configurations (`backend/.env`)

| Variable Name | Environment | Required | Default Value | Description |
| :--- | :---: | :---: | :--- | :--- |
| `PORT` | All | Yes | `5001` | The HTTP port the API server binds to. |
| `MONGODB_URI` | All | Yes | `mongodb://127.0.0.1:27017/liquid-finance` | Database connection URI. |
| `JWT_SECRET` | All | Yes | `N/A` | Secret key used to encrypt and sign session Access Tokens. |
| `JWT_REFRESH_SECRET` | All | Yes | `N/A` | Secret key used to encrypt and sign Refresh Tokens. |
| `JWT_ACCESS_EXPIRY` | All | No | `15m` | Lifetime of an access token. Format: `15m`, `1h`. |
| `JWT_REFRESH_EXPIRY`| All | No | `7d` | Lifetime of a refresh token. |
| `NODE_ENV` | All | Yes | `development` | Deployment target context. `development`, `staging`, or `production`. |
| `FRONTEND_URL` | All | Yes | `http://localhost:5173` | Allowed CORS origin pointing to the frontend dashboard. |
| `SENTRY_DSN` | Production | No | `N/A` | Sentry Error Tracking hook URL. |

### Frontend Configurations (`frontend/.env`)

| Variable Name | Environment | Required | Default Value | Description |
| :--- | :--- | :---: | :--- | :--- |
| `VITE_API_URL` | All | Yes | `http://localhost:5001` | Backend API gateway host path. |

---

## 2. Deployment Guide

### Option A: Cloud Container Orchestration (Recommended)
LIQIFIN is package-ready for containerized architectures (Kubernetes, AWS ECS, GCP Cloud Run):
1. **Database Service**: provision a managed MongoDB database (e.g., **MongoDB Atlas**). Obtain the connection URI.
2. **Build and Tag Images**:
   ```bash
   docker build -t yourregistry/liqifin-api:latest ./backend
   docker build -t yourregistry/liqifin-web:latest ./frontend
   ```
3. **Push to Container Registry**:
   ```bash
   docker push yourregistry/liqifin-api:latest
   docker push yourregistry/liqifin-web:latest
   ```
4. **Deploy Containers**: Deploy the api and web images to your container hosting platforms, injecting the production environment variables during run.

### Option B: Bare-Metal / VM Deployment (Ubuntu/macOS)
1. **Prerequisites**: Install Node.js v20+, npm, and MongoDB local community service.
2. **Backend Setup**:
   ```bash
   cd backend
   npm install --production --legacy-peer-deps
   npm run build
   pm2 start dist/index.js --name "liqifin-api"
   ```
3. **Frontend Nginx Configuration**:
   - Compile frontend assets:
     ```bash
     cd frontend
     npm install --legacy-peer-deps
     npm run build
     ```
   - Copy the compiled `/dist` directory to your Nginx root server path: `/var/www/liqifin`.
   - Configure Nginx server blocks to serve `index.html` on fallback routes and redirect API requests to the PM2 backend service (port 5001).

---

## 3. API Documentation & Schema Headers

All endpoints accept and return `application/json` bodies. Private routes require authentication tokens passed as a Bearer string in the request authorization header:
`Authorization: Bearer <your_jwt_access_token>`

### Core Response Schemas

#### A. Standard Success
```json
{
  "success": true,
  "data": { ... }
}
```

#### B. Standard Error Response
```json
{
  "success": false,
  "message": "Error description statement",
  "stack": "Stack trace details (Development only)"
}
```

### Rate Limiting Limits
* **General API Endpoints**: 1,000 requests per 15-minute window per IP in production.
* **Authentication Routes (`/api/auth/*`)**: 100 requests per 15-minute window per IP.

---

## 4. Admin & Operator Manual

### A. Database Seeding
To purge old states and seed clean high-fidelity demo users, cards, and budgeting accounts:
```bash
cd backend
npm run seed
```

### B. Live Health Check Monitoring
Query `GET /health` to audit system conditions:
* **UP**: Returns `200 OK` with platform information, CPU load, process uptime, memory allocations, and MongoDB connectivity.
* **DEGRADED**: Returns `503 Service Unavailable` if MongoDB drops offline.

### C. Manual Version Rollback
To rollback the active service to a previous Docker container tag:
```bash
./scripts/rollback.sh [frontend|backend|all] [tag_name]
```

### D. System Backups & Disaster Recovery
* **Manual Database Backup**: Run [db_backup.sh](file:///Users/caliber/private/exp-trc/backend/scripts/db_backup.sh). Generates timestamped BSON files in `backend/backups/`.
* **Database Restoration**: Run [db_restore.sh](file:///Users/caliber/private/exp-trc/backend/scripts/db_restore.sh) with target folder path:
  ```bash
  ./backend/scripts/db_restore.sh ./backend/backups/YYYY-MM-DD_HH-MM-SS/liquid-finance
  ```

---

## 5. Incident Response Playbook

### Incident 1: API Server Unreachable (`ERR_CONNECTION_REFUSED`)
* **Symptom**: Frontend console prints network errors to port 5001; users cannot authenticate.
* **Diagnosis Steps**:
  1. Check if the port is bound by another process: `lsof -i :5001`.
  2. Inspect backend logs: `pm2 logs liqifin-api` or check container logs.
  3. Confirm MongoDB is active: `lsof -i :27017` or `brew services list`.
* **Resolution**:
  - If MongoDB is down: Restart database service using `brew services start mongodb-community` or start the database container.
  - If backend crashed: Free port 5001 if locked (`kill -9 <PID>`) and run `npm run dev` or start PM2 thread.

### Incident 2: High CPU / Memory Exhaustion Crash
* **Symptom**: PM2 crashes, container restarts frequently, response latency increases, `/health` endpoint memory readings exceed thresholds.
* **Diagnosis Steps**:
  1. Verify RAM allocation leaks: Compare heap size trends.
  2. Inspect system load: check loadavg inside `GET /health` response payload.
* **Resolution**:
  - Run Node garbage collector triggers or PM2 cluster mode to load balance across multiple CPU threads.
  - Upgrade VM RAM allocation.

### Incident 3: CORS Warnings Block Requests
* **Symptom**: Browser throws CORS origin block warning on AJAX requests.
* **Diagnosis Steps**:
  1. Confirm request headers match allowed origins.
  2. Inspect `FRONTEND_URL` in `backend/.env`.
* **Resolution**:
  - Adjust `FRONTEND_URL` to match the exact protocol, port, and domain of your client dashboard interface. Restart the API server.
