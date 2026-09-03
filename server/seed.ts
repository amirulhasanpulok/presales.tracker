import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { query, initSchema } from './db.js';
import { hashPassword } from './auth.js';
import { MOCK_ROLES, MOCK_USERS, INITIAL_OPPORTUNITIES, MOCK_CLIENTS, MOCK_AUDIT_LOGS } from '../src/data/mockData.ts';

const SEED_PASSWORD = process.env.SEED_PASSWORD || 'ChangeMe@2026';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log('Initializing schema...');
  await initSchema();

  console.log('Seeding roles...');
  await query('DELETE FROM users');
  await query('DELETE FROM roles');
  for (const r of MOCK_ROLES) {
    await query(
      `INSERT INTO roles (id, role_name, name, description, users_count, is_system_role, matching_roles, permissions)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb)`,
      [
        r.id,
        r.roleName ?? r.name ?? r.role_name,
        r.name ?? r.roleName ?? null,
        r.description ?? '',
        r.usersCount ?? 0,
        r.isSystemRole ?? true,
        JSON.stringify(r.matchingRoles ?? []),
        JSON.stringify(r.permissions ?? []),
      ],
    );
  }

  console.log('Seeding users...');
  await query('DELETE FROM users');
  for (const u of MOCK_USERS) {
    const roleRow = MOCK_ROLES.find(r => r.id === u.roleId);
    await query(
      `INSERT INTO users (id, name, email, password_hash, role, role_id, department, status, mfa_enabled, avatar, region, must_change_password)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true)`,
      [
        u.id,
        u.name,
        u.email,
        await hashPassword(SEED_PASSWORD),
        u.role,
        u.roleId ?? null,
        u.department ?? null,
        u.status ?? 'Active',
        u.mfaEnabled ?? false,
        u.avatar ?? null,
        u.region ?? null,
      ],
    );
    if (!u.roleId && !roleRow) {
      console.warn(`User ${u.email} has no matching role — RBAC lookup will fail for them.`);
    }
  }

  console.log('Seeding opportunities...');
  await query('DELETE FROM opportunities');
  for (const o of INITIAL_OPPORTUNITIES) {
    await query('INSERT INTO opportunities (id, doc, updated_at) VALUES ($1, $2, now())', [o.id, JSON.stringify(o)]);
  }

  console.log('Seeding clients...');
  await query('DELETE FROM clients');
  for (const c of (MOCK_CLIENTS || [])) {
    await query('INSERT INTO clients (id, doc, updated_at) VALUES ($1, $2, now())', [c.id, JSON.stringify(c)]);
  }

  console.log('Seeding audit trail...');
  await query('DELETE FROM audit_logs');
  for (const a of (MOCK_AUDIT_LOGS || [])) {
    const meta = { actor: a.actor, actorRole: a.actorRole, targetName: a.targetName, details: a.details, ...(a.meta || {}) };
    await query(
      `INSERT INTO audit_logs (actor_email, action, target_type, target_id, meta, ip, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7::timestamptz, now()))`,
      [a.actorEmail ?? null, a.action ?? 'seed', a.targetType ?? null, a.targetId ?? null, meta ? JSON.stringify(meta) : null, a.ipAddress ?? null, a.timestamp ?? a.createdAt ?? null],
    );
  }

  console.log('Writing seed cache for runtime reset...');
  writeFileSync(path.join(__dirname, 'seed-cache.json'), JSON.stringify({ opportunities: INITIAL_OPPORTUNITIES }, null, 2));

  console.log(`Seed complete. ${MOCK_ROLES.length} roles, ${MOCK_USERS.length} users, ${INITIAL_OPPORTUNITIES.length} opportunities, ${(MOCK_CLIENTS || []).length} clients.`);
  console.log(`Initial password for all seeded users: ${SEED_PASSWORD} — each user must change it at first login.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});