import 'dotenv/config';
import { query } from './db.js';
import { hashPassword } from './auth.js';
import { audit } from './audit.js';

const people = ['Mahade Hasan', 'Zubayer Alam', 'Manjuda Akter', 'Al Owaled'];
const allPeople = [...people, 'Amirul Hasan Pulok'];
const key = value => value.toLowerCase().replace(/[^a-z0-9]/g, '');
const canonical = new Map(allPeople.map(name => [key(name), name]));

await query('BEGIN');
try {
  for (const name of people) {
    await query("UPDATE users SET role = 'Principal Solutions Architect', role_id = 'role-sa', department = 'Solutions Engineering', sales_team = NULL WHERE lower(name) = lower($1)", [name]);
  }

  const passwordHash = await hashPassword(process.env.PRESALES_TEMP_PASSWORD || 'ChangeMe@2026');
  await query("INSERT INTO users (id, name, email, password_hash, role, role_id, department, status, region, must_change_password) VALUES ('usr-presales-amirul', 'Amirul Hasan Pulok', 'amirul.hasan.pulok@link3.net', $1, 'Principal Solutions Architect', 'role-sa', 'Solutions Engineering', 'Active', 'Bangladesh', true) ON CONFLICT (id) DO NOTHING", [passwordHash]);

  const opportunities = await query('SELECT id, doc FROM opportunities');
  let changed = 0;
  for (const row of opportunities.rows) {
    const owner = canonical.get(key(row.doc?.accountExecutive || ''));
    if (!owner) continue;
    const doc = { ...row.doc, leadSolutionArchitect: owner, accountExecutive: 'Unassigned', updatedAt: new Date().toISOString() };
    await query('UPDATE opportunities SET doc = $2, updated_at = now() WHERE id = $1', [row.id, JSON.stringify(doc)]);
    changed += 1;
  }

  await audit({ action: 'data.presales_role_conversion', targetType: 'system', targetId: 'presales-team', meta: { converted: people, created: 'amirul.hasan.pulok@link3.net', opportunitiesChanged: changed } });
  await query('COMMIT');
  console.log(`Converted ${people.length} users and updated ${changed} opportunities.`);
} catch (error) {
  await query('ROLLBACK');
  throw error;
}
