FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

# Create data directory for SQLite
RUN mkdir -p data

EXPOSE 5000

CMD ["npm", "start"]
