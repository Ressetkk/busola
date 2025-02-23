# ---- Base Alpine with Node ----
FROM alpine:3.15.0 AS builder
RUN apk add --update nodejs npm

WORKDIR /app

# Install global dependencies
RUN apk update && \
  apk upgrade && \
  apk add --no-cache curl make

# Set env variables
ENV PRODUCTION true
ENV CI true

COPY . /app

RUN make resolve
RUN make validate
RUN make pull-licenses

RUN npm test 2>&1 && npm run build:docker

# ---- Serve ----
FROM nginxinc/nginx-unprivileged:1.21
WORKDIR /app

# apps
COPY --from=builder /app/build /app/core-ui

# nginx
COPY --from=builder /app/nginx/nginx.conf /etc/nginx/
COPY --from=builder /app/nginx/mime.types /etc/nginx/

EXPOSE 8080
ENTRYPOINT ["nginx", "-g", "daemon off;"]
