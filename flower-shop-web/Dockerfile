FROM node:20-alpine

WORKDIR /app

# Copy package files and install deps
COPY package*.json ./
RUN npm install --omit=dev

# Copy application code
COPY server.js ./
COPY public/ ./public/

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:8000/api/health || exit 1

# Start server
CMD ["node", "server.js"]
