# Presales Tracker

Enterprise presales opportunity, activity, BOQ, document, client, catalog,
handover, reporting, and governance platform.

## Automated Ubuntu Deployment

The repository includes an idempotent deployment script for Ubuntu servers.
It installs required packages, configures PostgreSQL, creates the application
environment, builds the frontend, configures Nginx, starts the API with PM2,
and optionally provisions HTTPS with Certbot.

```bash
git clone https://github.com/amirulhasanpulok/presales.tracker.git
cd presales.tracker
sudo DOMAIN=tracker.example.com \
  CERTBOT_EMAIL=admin@example.com \
  ENABLE_TLS=1 \
  ./deploy-ubuntu.sh
```

For a complete variable reference, see [`DEPLOY_UBUNTU.md`](./DEPLOY_UBUNTU.md).

Important deployment variables:

- `DOMAIN`: public hostname; defaults to `_` for HTTP-only deployment.
- `CERTBOT_EMAIL`: required when `ENABLE_TLS=1`.
- `DB_PASSWORD`: generated automatically if omitted.
- `JWT_SECRET`: generated automatically if omitted.
- `ADMIN_EMAILS`: comma-separated bootstrap administrator emails.
- `APP_DIR`: application path; defaults to `/opt/presales.tracker`.
- `WEB_ROOT`: Nginx web root; defaults to `/var/www/presales`.

Secrets are written to `server/.env`, which is ignored by Git. Database rows,
uploaded documents, and user passwords must be migrated separately when moving
an existing installation.

## Local Development

Install dependencies and run the frontend:

```bash
npm install
npm run dev
```

Run the API separately:

```bash
cd server
npm install
node index.js
```

Create `server/.env` from `server/.env.example` before starting the API.

Production checks:

```bash
npm run lint
npm run build
```

## Architecture

- Frontend: React, TypeScript, Vite, Tailwind CSS.
- API: Node.js, Express, PostgreSQL.
- Authentication: JWT bearer sessions.
- Authorization: permission-based RBAC with scoped opportunity access.
- Process management: PM2.
- Reverse proxy: Nginx.
- Database schema and catalog seed data initialize on API startup.
