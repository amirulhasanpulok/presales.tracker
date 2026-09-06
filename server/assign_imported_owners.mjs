import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({ host: process.env.PGHOST, port: Number(process.env.PGPORT), user: process.env.PGUSER, password: process.env.PGPASSWORD, database: process.env.PGDATABASE, max: 1 });
const canonical = value => String(value || '').toLowerCase().replace(/^(mr|ms|md|mrs)\.?\s+/i, '').replace(/[^a-z0-9]/g, '');
const client = await pool.connect();
try {
  await client.query('BEGIN');
  const users = await client.query("SELECT name, role_id FROM users WHERE status = 'Active' AND role_id IN ('role-kam', 'role-sa') ORDER BY name");
  const kams = users.rows.filter(row => row.role_id === 'role-kam');
  const presales = users.rows.filter(row => row.role_id === 'role-sa');
  if (!kams.length || !presales.length) throw new Error('Active Sales KAM and presales engineer pools are required.');
  const opportunities = await client.query("SELECT id, doc FROM opportunities WHERE doc->'sourceFiles' IS NOT NULL ORDER BY id");
  let fallbackKams = 0; let fallbackPresales = 0; let updated = 0;
  for (let index = 0; index < opportunities.rows.length; index += 1) {
    const row = opportunities.rows[index]; const doc = row.doc || {};
    const kam = kams.find(user => canonical(user.name) === canonical(doc.accountExecutive));
    const sa = presales.find(user => canonical(user.name) === canonical(doc.leadSolutionArchitect));
    const nextKam = kam?.name || kams[index % kams.length].name;
    const nextSa = sa?.name || presales[index % presales.length].name;
    if (!kam) fallbackKams += 1;
    if (!sa) fallbackPresales += 1;
    const next = { ...doc, accountExecutive: nextKam, leadSolutionArchitect: nextSa, region: doc.region || 'APAC (Singapore/Tokyo)', assignmentReviewRequired: !kam || !sa, assignmentSource: !kam || !sa ? 'normalized-user-or-round-robin-fallback' : 'source-matched' };
    await client.query('UPDATE opportunities SET doc = $2, updated_at = now() WHERE id = $1', [row.id, JSON.stringify(next)]);
    updated += 1;
  }
  await client.query('COMMIT');
  console.log(JSON.stringify({ updated, fallbackKams, fallbackPresales, region: 'APAC (Singapore/Tokyo)' }, null, 2));
} catch (error) {
  await client.query('ROLLBACK'); throw error;
} finally {
  client.release(); await pool.end();
}
