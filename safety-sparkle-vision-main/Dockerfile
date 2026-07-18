# ── Stage 1: Build React Frontend ──────────────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY package*.json ./
RUN npm ci --prefer-offline || npm install
COPY . .
RUN npm run build

# ── Stage 2: Final Backend Image ───────────────────────────────────────────
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies (Redis, Supervisord, SQLite)
RUN apt-get update && apt-get install -y \
    redis-server \
    supervisor \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt aiosqlite

# Copy backend code
COPY backend ./backend

# Copy built frontend into backend/dist
COPY --from=frontend-builder /app/frontend/dist ./backend/dist

# Copy supervisord config
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# We will use the PORT environment variable provided by CloudPilot
ENV PORT=80
EXPOSE 80

# Start supervisor
CMD ["/usr/bin/supervisord", "-n", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
