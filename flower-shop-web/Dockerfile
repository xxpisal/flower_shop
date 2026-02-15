FROM node:20-alpine

WORKDIR /app

# Copy package files and install deps
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY server.js ./
COPY public/ ./public/

# Expose port
EXPOSE 8222

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:8222/api/health || exit 1

# Start server
CMD ["node", "server.js"]
