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
- `ADMIN_EMAILS`: reserved for future bootstrap provisioning; use the seed/admin provisioning command explicitly.
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
# Team workflow

Sales creates an opportunity using Client, Opportunity, Requirement and Sales owner. Budget, closing date and scopes are optional. New leads wait for review; they are not assigned automatically.

An administrator assigns the **Presales Team Lead** role under Advanced tools & settings → User Management. This role reviews all leads and chooses primary/supporting engineers. Engineers see only assigned opportunities; Sales sees its own opportunities. Existing user roles are not automatically promoted.

Accept & assign starts a **four calendar day / 96-hour SLA**. The workspace shows the deadline in Dhaka time and highlights overdue work. Presales may request more time with a reason and requested deadline. The opportunity's Sales owner or an administrator approves/rejects it; the original deadline stays in history.

Use Requirements & solution, BOQ and Documents to prepare the solution. Submit solution to Sales freezes a version of the solution, BOQ and document references. Sales records when it sends this version to the client. Both Sales and Presales may log Client, Sales and OEM follow-ups and next follow-up dates until closure.

Client requested changes opens a new cycle with an explicit deadline. Edit the working solution/BOQ and submit another version. Previous submitted versions remain available for download and review.

Sales closes won/lost with notes. Won deals require an active Postsales owner. Postsales accepts handover, starts delivery and records client acceptance. Add Postsales users before assigning won deals.

The clean Team workspace includes review, overdue SLA, extension, follow-up and delivery queues. Advanced modules remain available under the navigation toggle. Use the header refresh button for the latest shared updates; stale/concurrent writes are rejected instead of overwriting another team member's changes.

Existing opportunities and their history remain unchanged. A lead/admin can explicitly start team workflow on an existing open opportunity; closed historical deals cannot be restarted by assignment. The new SLA begins when assigned, never retroactively.

Validation: `npm run lint`, `npm run build`, `npm run validate:rbac`, `npm run test:workflow`. For API checks, configure database/JWT environment then run `npm run test:workflow:api`; it creates and removes an isolated temporary PostgreSQL schema. The database account must have schema creation permission. Never run the destructive demo seed command on production.
