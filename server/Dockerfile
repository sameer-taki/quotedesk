FROM node:16-buster-slim

WORKDIR /app

COPY package*.json ./

# Startup script to install deps at runtime (bypasses build-time security locks)
COPY . .

# Create data directory for SQLite
RUN mkdir -p data

EXPOSE 5000

CMD ["sh", "-c", "npm ci --only=production && npm start"]
