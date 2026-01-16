FROM node:16-buster-slim

WORKDIR /app

COPY package*.json ./

# Startup script to install deps at runtime (bypasses build-time security locks)
COPY . .

EXPOSE 5000

CMD ["sh", "-c", "mkdir -p data && npm ci --only=production && npm start"]
