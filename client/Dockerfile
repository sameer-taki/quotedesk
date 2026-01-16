# Production Stage (Serve Pre-built Assets)
FROM nginx:1.23-alpine

# Copy local build artifacts directly
COPY dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
