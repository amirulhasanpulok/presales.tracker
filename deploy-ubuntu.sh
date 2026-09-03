#!/usr/bin/env bash
set -Eeuo pipefail

# Repeatable Ubuntu deployment for Presales Tracker.
# Usage: sudo ./deploy-ubuntu.sh

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this script with sudo or as root." >&2
  exit 1
fi

REPO_URL="${REPO_URL:-https://github.com/amirulhasanpulok/presales.tracker.git}"
BRANCH="${BRANCH:-main}"
APP_DIR="${APP_DIR:-/opt/presales.tracker}"
WEB_ROOT="${WEB_ROOT:-/var/www/presales}"
DOMAIN="${DOMAIN:-_}"
DB_NAME="${DB_NAME:-presales}"
DB_USER="${DB_USER:-presales}"
DB_PASSWORD="${DB_PASSWORD:-}"
JWT_SECRET="${JWT_SECRET:-}"
API_PORT="${API_PORT:-4000}"
ENABLE_TLS="${ENABLE_TLS:-0}"
ADMIN_EMAILS="${ADMIN_EMAILS:-}"

if [[ -z "$DB_PASSWORD" ]]; then
  DB_PASSWORD="$(openssl rand -hex 24)"
fi
if [[ -z "$JWT_SECRET" ]]; then
  JWT_SECRET="$(openssl rand -hex 64)"
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y git curl ca-certificates build-essential postgresql nginx openssl

if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

if ! command -v pm2 >/dev/null 2>&1; then
  npm install --global pm2
fi

install -d -m 0755 "$(dirname "$APP_DIR")" "$WEB_ROOT"
if [[ -d "$APP_DIR/.git" ]]; then
  git -C "$APP_DIR" fetch origin "$BRANCH"
  git -C "$APP_DIR" checkout "$BRANCH"
  git -C "$APP_DIR" pull --ff-only origin "$BRANCH"
else
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
fi

sudo -u postgres psql -v ON_ERROR_STOP=1 \
  -v db_name="$DB_NAME" -v db_user="$DB_USER" -v db_password="$DB_PASSWORD" <<'SQL'
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', :'db_user', :'db_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'db_user')\gexec
ALTER ROLE :"db_user" WITH LOGIN PASSWORD :'db_password';
SELECT format('CREATE DATABASE %I OWNER %I', :'db_name', :'db_user')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = :'db_name')\gexec
SQL

umask 077
cat > "$APP_DIR/server/.env" <<EOF
PORT=$API_PORT
PGHOST=127.0.0.1
PGPORT=5432
PGUSER=$DB_USER
PGPASSWORD=$DB_PASSWORD
PGDATABASE=$DB_NAME
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=12h
CORS_ORIGIN=
ADMIN_EMAILS=$ADMIN_EMAILS
EOF

cd "$APP_DIR"
npm ci
cd "$APP_DIR/server"
npm ci
cd "$APP_DIR"
npm run build

rm -rf "$WEB_ROOT/assets"
cp -a "$APP_DIR/dist/." "$WEB_ROOT/"
chown -R www-data:www-data "$WEB_ROOT"

cat > /etc/nginx/sites-available/presales-tracker <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;
    root $WEB_ROOT;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:$API_PORT/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF
ln -sfn /etc/nginx/sites-available/presales-tracker /etc/nginx/sites-enabled/presales-tracker
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable --now nginx postgresql
systemctl reload nginx

if pm2 describe presales-api >/dev/null 2>&1; then
  pm2 restart presales-api --update-env
else
  pm2 start "$APP_DIR/server/index.js" --name presales-api --cwd "$APP_DIR/server"
fi
pm2 save
pm2 startup systemd -u "${SUDO_USER:-root}" --hp "$(getent passwd "${SUDO_USER:-root}" | cut -d: -f6)" >/tmp/presales-pm2-startup.txt || true

if [[ "$ENABLE_TLS" == "1" && "$DOMAIN" != "_" ]]; then
  apt-get install -y certbot python3-certbot-nginx
  certbot --nginx --non-interactive --agree-tos --redirect -m "${CERTBOT_EMAIL:?Set CERTBOT_EMAIL for TLS}" -d "$DOMAIN"
fi

echo "Deployment complete."
echo "App directory: $APP_DIR"
echo "Web root: $WEB_ROOT"
echo "API: http://127.0.0.1:$API_PORT/api/health"
echo "Public URL: http://${DOMAIN}/"
