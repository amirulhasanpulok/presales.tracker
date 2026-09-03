# Ubuntu Deployment

The `deploy-ubuntu.sh` script performs a repeatable deployment from GitHub.

Run it on a fresh Ubuntu server:

```bash
git clone https://github.com/amirulhasanpulok/presales.tracker.git
cd presales.tracker
sudo DOMAIN=tracker.example.com CERTBOT_EMAIL=admin@example.com ENABLE_TLS=1 ./deploy-ubuntu.sh
```

Optional environment variables:

- `REPO_URL` for a private or forked repository.
- `BRANCH` (default `main`).
- `APP_DIR` (default `/opt/presales.tracker`).
- `WEB_ROOT` (default `/var/www/presales`).
- `DB_NAME`, `DB_USER`, and `DB_PASSWORD`.
- `JWT_SECRET`.
- `API_PORT` (default `4000`).
- `ADMIN_EMAILS` for seeded administrator accounts.
- `ENABLE_TLS=1` and `CERTBOT_EMAIL` to configure HTTPS with Certbot.

The script creates `server/.env` with restrictive permissions. Secrets and
database contents are never committed to Git. The API initializes its schema
and catalog tables on first start.
