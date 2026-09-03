import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { query } from './db.js';
import { signToken, verifyPassword, hashPassword, authenticate, loadPrincipal, validatePassword } from './auth.js';
import { can, requirePermission, requireAnyEditPermission } from './rbac.js';
import { audit } from './audit.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadSeedCache() {
  const file = path.join(__dirname, 'seed-cache.json');
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (err) {
    console.error('Failed to read seed-cache.json:', err);
    return null;
  }
}

const router = express.Router();
const ALLOWED_OPPORTUNITY_STAGES = new Set([
  'qualification',
  'tech_discovery',
  'solution_design',
  'poc_demo',
  'proposal_boq',
  'commercial_negotiation',
  'closed_won',
  'closed_lost',
  'on_hold',
  'cancelled',
]);

function canAccessOpportunity(req, doc) {
  if (can(req.role, req.user, 'sys.users') || can(req.role, req.user, 'sys.rbac')) return true;
  const roleId = req.user?.roleId || req.user?.role_id;
  if (roleId === 'role-kam') return doc.accountExecutive === req.user?.name;
  if (roleId === 'role-sa') return doc.leadSolutionArchitect === req.user?.name || doc.presalesEngineerSecondary === req.user?.name || (doc.supportingPresalesEngineers || []).includes(req.user?.name);
  if (roleId === 'role-delivery') return doc.stage === 'closed_won' || doc.handover?.isHandedOver;
  return true;
}

function stripDocumentContent(doc) {
  if (!Array.isArray(doc?.documents)) return doc;
  return {
    ...doc,
    documents: doc.documents.map(({ fileData, ...metadata }) => metadata),
  };
}

async function canAccessClient(req, clientDoc) {
  if (can(req.role, req.user, 'sys.users') || can(req.role, req.user, 'sys.rbac')) return true;
  const opportunities = await query('SELECT doc FROM opportunities WHERE doc->>\'clientName\' = $1', [clientDoc.name]);
  return (opportunities.rows || []).some(row => canAccessOpportunity(req, row.doc || {}));
}

// ---------------------------------------------------------------------------
// Login rate limiting (simple in-memory; enough for a single VPS)
// ---------------------------------------------------------------------------
const attempts = new Map();
function rateLimitLogin(key) {
  const now = Date.now();
  const rec = attempts.get(key) || { count: 0, resetAt: now + 15 * 60 * 1000 };
  if (now > rec.resetAt) {
    rec.count = 0;
    rec.resetAt = now + 15 * 60 * 1000;
  }
  rec.count += 1;
  attempts.set(key, rec);
  if (rec.count > 5) {
    return { blocked: true, retryAfterSec: Math.ceil((rec.resetAt - now) / 1000) };
  }
  return { blocked: false };
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'invalid_request' });
  }

  const ipLock = rateLimitLogin(`ip:${req.ip || 'unknown'}`);
  const emailLock = rateLimitLogin(`email:${String(email).toLowerCase()}`);
  if (ipLock.blocked || emailLock.blocked) {
    return res.status(429).json({
      error: 'too_many_attempts',
      retryAfterSec: Math.max(ipLock.retryAfterSec, emailLock.retryAfterSec),
    });
  }

  const { rows } = await query('SELECT * FROM users WHERE lower(email) = lower($1)', [String(email)]);
  const row = rows[0];
  if (!row) {
    return res.status(401).json({ error: 'invalid_credentials' });
  }
  if (row.status === 'Inactive') {
    return res.status(403).json({ error: 'account_disabled' });
  }
  if (row.locked_until && new Date(row.locked_until).getTime() > Date.now()) {
    return res.status(429).json({ error: 'too_many_attempts', retryAfterSec: Math.ceil((new Date(row.locked_until).getTime() - Date.now()) / 1000) });
  }
  const ok = await verifyPassword(String(password), row.password_hash);
  if (!ok) {
    await query(`UPDATE users SET login_attempts = login_attempts + 1,
      locked_until = CASE WHEN login_attempts + 1 >= 5 THEN now() + interval '15 minutes' ELSE locked_until END
      WHERE id = $1`, [row.id]);
    return res.status(401).json({ error: 'invalid_credentials' });
  }

  await query('UPDATE users SET last_login_at = now(), login_attempts = 0, locked_until = NULL WHERE id = $1', [row.id]);
  attempts.delete(`ip:${req.ip || 'unknown'}`);
  attempts.delete(`email:${String(email).toLowerCase()}`);
  const token = signToken(row);

  const principal = await loadPrincipal(row.id);
  await audit({ req, action: 'auth.login', targetType: 'user', targetId: row.id, actorEmail: row.email, actorId: row.id, actorRole: principal.role?.roleName || row.role });
  return res.json({ token, user: principal.user, role: principal.role });
});

router.get('/auth/me', authenticate, (req, res) => {
  res.json({ user: req.user, role: req.role });
});

// Self-service password change. Used on first login (must_change_password)
// and any time the user wishes to rotate credentials.
router.post('/auth/change-password', authenticate, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
    return res.status(400).json({ error: 'invalid_request' });
  }

  const { rows } = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
  const current = rows[0];
  if (!current) return res.status(401).json({ error: 'unauthorized' });

  const ok = await verifyPassword(String(currentPassword), current.password_hash);
  if (!ok) {
    await audit({ req, action: 'auth.password_change_failed', targetType: 'user', targetId: req.user.id });
    return res.status(401).json({ error: 'invalid_current_password' });
  }

  const same = await verifyPassword(String(newPassword), current.password_hash);
  if (same) {
    return res.status(400).json({ error: 'password_same_as_current' });
  }

  const reasons = validatePassword(String(newPassword));
  if (reasons.length) {
    return res.status(400).json({ error: 'weak_password', hints: reasons });
  }

  await query('UPDATE users SET password_hash = $2, must_change_password = false, login_attempts = 0 WHERE id = $1', [
    req.user.id,
    await hashPassword(String(newPassword)),
  ]);
  await audit({ req, action: 'auth.password_change', targetType: 'user', targetId: req.user.id });
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Bootstrap: everything the signed-in principal can see / needs to render the
// shell. Server-side role filtering decides which collections are exposed.
// ---------------------------------------------------------------------------
router.get('/bootstrap', authenticate, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const roleId = req.user?.roleId || req.user?.role_id;
  const isAdministrator = can(req.role, req.user, 'sys.users') || can(req.role, req.user, 'sys.rbac');
  const opportunityQuery = isAdministrator
    ? { text: 'SELECT * FROM opportunities ORDER BY updated_at DESC', params: [] }
    : roleId === 'role-kam'
      ? { text: "SELECT * FROM opportunities WHERE doc->>'accountExecutive' = $1 ORDER BY updated_at DESC", params: [req.user?.name] }
      : roleId === 'role-sa'
        ? { text: "SELECT * FROM opportunities WHERE doc->>'leadSolutionArchitect' = $1 OR doc->>'presalesEngineerSecondary' = $1 OR doc->'supportingPresalesEngineers' ? $1 ORDER BY updated_at DESC", params: [req.user?.name] }
        : roleId === 'role-delivery'
          ? { text: "SELECT * FROM opportunities WHERE doc->>'stage' = 'closed_won' OR COALESCE((doc->'handover'->>'isHandedOver')::boolean, false) = true ORDER BY updated_at DESC", params: [] }
          : { text: 'SELECT * FROM opportunities ORDER BY updated_at DESC', params: [] };
  const [roles, opportunities, clients, users, auditLogs, scopes, oems, products, systemSettings] = await Promise.all([
    can(req.role, req.user, 'sys.rbac') ? query('SELECT * FROM roles ORDER BY role_name') : Promise.resolve({ rows: [] }),
    query(opportunityQuery.text, opportunityQuery.params),
    query('SELECT * FROM clients ORDER BY updated_at DESC'),
    can(req.role, req.user, 'sys.users') ? query('SELECT id, name, email, role, role_id, department, status, mfa_enabled, avatar, region, last_login_at, created_at FROM users ORDER BY name') : Promise.resolve({ rows: [] }),
    can(req.role, req.user, 'sys.audit') ? query('SELECT id, actor_id, actor_email, action, target_type, target_id, meta, ip, actor_role, request_id, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 200') : Promise.resolve({ rows: [] }),
    query('SELECT id, name, category, description, status, sort_order FROM scope_catalog ORDER BY sort_order, name'),
    query('SELECT id, name, website, description, status FROM oems ORDER BY name'),
    query(
      `SELECT p.id, p.oem_id, o.name AS oem_name, p.name, p.category, p.product_line,
              p.model, p.part_number, p.description, p.unit, p.status
       FROM product_catalog p LEFT JOIN oems o ON p.oem_id = o.id
       ORDER BY o.name, p.name`,
    ),
    query("SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('currency', 'activity_types')"),
  ]);
  const allOpportunityDocs = (opportunities.rows || []).map(o => o.doc);
  const scopedOpportunityDocs = isAdministrator ? allOpportunityDocs : roleId === 'role-kam'
    ? allOpportunityDocs.filter(o => o.accountExecutive === req.user?.name)
    : roleId === 'role-sa'
      ? allOpportunityDocs.filter(o => o.leadSolutionArchitect === req.user?.name || o.presalesEngineerSecondary === req.user?.name || (o.supportingPresalesEngineers || []).includes(req.user?.name))
      : roleId === 'role-delivery'
        ? allOpportunityDocs.filter(o => o.stage === 'closed_won' || o.handover?.isHandedOver)
        : allOpportunityDocs;
  const visibleClientNames = new Set(scopedOpportunityDocs.map(o => o.clientName).filter(Boolean));
  const scopedClientDocs = isAdministrator ? (clients.rows || []).map(c => c.doc) : (clients.rows || []).map(c => c.doc).filter(c => visibleClientNames.has(c.name));

  res.json({
    user: req.user,
    role: req.role,
    // Non-admins need their own role policy to render permitted navigation;
    // they do not need visibility into other role definitions.
    roles: can(req.role, req.user, 'sys.rbac') ? (roles.rows || []) : [req.role],
    opportunities: scopedOpportunityDocs.map(stripDocumentContent),
    clients: scopedClientDocs,
    scopes: scopes.rows || [],
    oems: oems.rows || [],
    products: products.rows || [],
    currency: systemSettings.rows.find(s => s.setting_key === 'currency')?.setting_value || 'BDT',
    activityTypes: (() => { try { const value = JSON.parse(systemSettings.rows.find(s => s.setting_key === 'activity_types')?.setting_value || '[]'); return Array.isArray(value) ? value : []; } catch { return []; } })(),
    users: can(req.role, req.user, 'sys.users') ? (users.rows || []) : [],
    auditLogs: can(req.role, req.user, 'sys.audit') ? (auditLogs.rows || []) : [],
  });
});

router.put('/settings/currency', authenticate, requirePermission('sys.integrations'), async (req, res) => {
  const currency = String(req.body?.currency || '').toUpperCase();
  if (!['BDT', 'USD', 'EUR'].includes(currency)) return res.status(400).json({ error: 'invalid_currency' });
  await query("INSERT INTO system_settings (setting_key, setting_value, updated_at) VALUES ('currency', $1, now()) ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = now()", [currency]);
  await audit({ req, action: 'settings.currency.update', targetType: 'system_settings', targetId: 'currency', meta: { currency } });
  res.json({ currency });
});

router.put('/settings/activity-types', authenticate, requirePermission('sys.integrations'), async (req, res) => {
  const activityTypes = Array.isArray(req.body?.activityTypes) ? req.body.activityTypes.map(value => String(value).trim()).filter(Boolean).slice(0, 100) : [];
  if (!activityTypes.length) return res.status(400).json({ error: 'invalid_activity_types' });
  await query("INSERT INTO system_settings (setting_key, setting_value, updated_at) VALUES ('activity_types', $1, now()) ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = now()", [JSON.stringify([...new Set(activityTypes)])]);
  await audit({ req, action: 'settings.activity_types.update', targetType: 'system_settings', targetId: 'activity_types', meta: { activityTypes } });
  res.json({ activityTypes });
});

// ---------------------------------------------------------------------------
// Opportunities
// ---------------------------------------------------------------------------
router.post('/opportunities', authenticate, requirePermission('create_opportunity'), async (req, res) => {
  const doc = req.body;
  if (!doc || typeof doc !== 'object' || !doc.id) {
    return res.status(400).json({ error: 'invalid_opportunity' });
  }
  const conflict = await query('SELECT 1 FROM opportunities WHERE id = $1', [doc.id]);
  if (conflict.rows.length) {
    return res.status(409).json({ error: 'duplicate_opportunity', id: doc.id });
  }
  const out = {
    ...doc,
    activities: prependActivities(doc, [
      makeActivity({ req, type: 'Created', title: 'Opportunity created', summary: `Opportunity created by ${req.user?.name || 'Unknown'}.` }),
    ]),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await query('INSERT INTO opportunities (id, doc, owner_id, updated_at) VALUES ($1, $2, $3, now())', [
    out.id,
    JSON.stringify(out),
    req.user.id,
  ]);
  await audit({ req, action: 'opportunity.create', targetType: 'opportunity', targetId: out.id });
  res.status(201).json(out);
});

// Build a timestamped history entry stamped with the authenticating user so
// team-member updates are attributable to the real person (server-authoritative).
function makeActivity({ req, type, title, summary, meta }) {
  const now = new Date().toISOString();
  return {
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    title: title || 'Update',
    timestamp: now,
    author: req.user?.name || 'Unknown',
    authorId: req.user?.id || null,
    authorEmail: req.user?.email || null,
    summary: summary || '',
    ...(meta || {}),
  };
}

function prependActivities(doc, activities) {
  const existing = Array.isArray(doc.activities) ? doc.activities : [];
  return [...activities, ...existing];
}

router.put('/opportunities/:id', authenticate, requireAnyEditPermission(), async (req, res) => {
  const doc = req.body;
  if (!doc || typeof doc !== 'object' || doc.id !== req.params.id) {
    return res.status(400).json({ error: 'invalid_opportunity' });
  }
  if (doc.stage !== undefined && !ALLOWED_OPPORTUNITY_STAGES.has(String(doc.stage))) {
    return res.status(422).json({ error: 'unsupported_stage', allowed: [...ALLOWED_OPPORTUNITY_STAGES] });
  }
  const current = await query('SELECT doc FROM opportunities WHERE id = $1', [req.params.id]);
  if (!current.rowCount) return res.status(404).json({ error: 'not_found' });
  const previousDoc = current.rows[0].doc || {};
  if (!canAccessOpportunity(req, previousDoc)) return res.status(403).json({ error: 'opportunity_scope_forbidden' });
  const note = (doc.updateNote || '').trim();
  const incoming = Array.isArray(doc.activities) ? doc.activities : [];
  const clientAdded = incoming.find((a) => a && a._clientAdded);
  let out;
  if (clientAdded) {
    // Frontend explicitly added a work-update entry -> stamp the real author and
    // persist it (no duplicate auto-generated entry).
    const stamped = {
      ...clientAdded,
      type: clientAdded.type || 'Work Update',
      title: clientAdded.title || note || 'Work update',
      timestamp: new Date().toISOString(),
      author: req.user?.name || clientAdded.author || 'Unknown',
      authorId: req.user?.id || null,
      authorEmail: req.user?.email || null,
      summary: clientAdded.summary || note || '',
    };
    delete stamped._clientAdded;
    out = {
      ...doc,
      id: req.params.id,
      activities: [stamped, ...incoming.filter((a) => a !== clientAdded)],
      updatedAt: new Date().toISOString(),
    };
  } else {
    const entry = makeActivity({
      req,
      type: 'Work Update',
      title: note || 'Opportunity updated',
      summary: note || 'Opportunity details were updated.',
    });
    out = {
      ...doc,
      id: req.params.id,
      activities: prependActivities(doc, [entry]),
      updatedAt: new Date().toISOString(),
    };
  }
  delete out.updateNote;
  const result = await query('UPDATE opportunities SET doc = $2, updated_at = now() WHERE id = $1 RETURNING id', [
    req.params.id,
    JSON.stringify(out),
  ]);
  if (!result.rowCount) return res.status(404).json({ error: 'not_found' });
  const trackedFields = ['stage', 'scopes', 'tender', 'outcome', 'handover', 'boq'];
  const changes = trackedFields.reduce((acc, field) => {
    const before = previousDoc[field];
    const after = out[field];
    if (JSON.stringify(before) !== JSON.stringify(after)) acc[field] = { previous: before ?? null, next: after ?? null };
    return acc;
  }, {});
  await audit({
    req,
    action: 'opportunity.update',
    targetType: 'opportunity',
    targetId: out.id,
    meta: { changedFields: Object.keys(changes), changes },
  });
  res.json(out);
});

router.post('/opportunities/:id/activities', authenticate, requireAnyEditPermission(), async (req, res) => {
  const activity = req.body;
  if (!activity || typeof activity !== 'object' || !String(activity.title || '').trim() || !String(activity.summary || '').trim()) {
    return res.status(400).json({ error: 'invalid_activity', hint: 'Activity title and summary are required.' });
  }
  const current = await query('SELECT doc FROM opportunities WHERE id = $1', [req.params.id]);
  if (!current.rowCount) return res.status(404).json({ error: 'not_found' });
  const doc = current.rows[0].doc || {};
  if (!canAccessOpportunity(req, doc)) return res.status(403).json({ error: 'opportunity_scope_forbidden' });
  const entry = makeActivity({
    req,
    type: String(activity.type || 'Other'),
    title: String(activity.title).trim(),
    summary: String(activity.summary).trim(),
    meta: {
      currentStage: doc.stage,
      nextAction: activity.nextAction || '',
      nextFollowUpDate: activity.nextFollowUpDate || '',
      attendees: Array.isArray(activity.attendees) ? activity.attendees : [],
      deliverables: Array.isArray(activity.deliverables) ? activity.deliverables : [],
      attachments: Array.isArray(activity.attachments) ? activity.attachments : [],
      durationMinutes: Number(activity.durationMinutes) || 0,
    },
  });
  const out = { ...doc, id: req.params.id, activities: prependActivities(doc, [entry]), updatedAt: new Date().toISOString() };
  await query('UPDATE opportunities SET doc = $2, updated_at = now() WHERE id = $1', [req.params.id, JSON.stringify(out)]);
  await audit({ req, action: 'opportunity.activity.create', targetType: 'opportunity', targetId: req.params.id, meta: { activityId: entry.id, activityType: entry.type, title: entry.title } });
  res.status(201).json(out);
});

router.post('/opportunities/:id/outcome', authenticate, requireAnyEditPermission(), async (req, res) => {
  const requested = req.body;
  const allowed = ['open', 'won', 'lost', 'on_hold', 'cancelled'];
  if (!requested || !allowed.includes(requested.outcome)) return res.status(400).json({ error: 'invalid_outcome' });
  if (requested.outcome === 'lost' && !String(requested.lostReason || '').trim()) return res.status(400).json({ error: 'lost_reason_required' });
  const current = await query('SELECT doc FROM opportunities WHERE id = $1', [req.params.id]);
  if (!current.rowCount) return res.status(404).json({ error: 'not_found' });
  const previous = current.rows[0].doc || {};
  if (!canAccessOpportunity(req, previous)) return res.status(403).json({ error: 'opportunity_scope_forbidden' });
  const stageByOutcome = {
    won: 'closed_won',
    lost: 'closed_lost',
    on_hold: 'on_hold',
    cancelled: 'cancelled',
  };
  const stage = stageByOutcome[requested.outcome] || (['closed_won', 'closed_lost', 'on_hold', 'cancelled'].includes(previous.stage) ? 'qualification' : previous.stage);
  const outcome = { ...requested, outcome: requested.outcome };
  const entry = makeActivity({ req, type: 'Deal Outcome', title: `Opportunity marked ${requested.outcome}`, summary: `Deal outcome changed to ${requested.outcome} by ${req.user?.name || 'Unknown'}.` });
  const out = { ...previous, id: req.params.id, stage, outcome, activities: prependActivities(previous, [entry]), updatedAt: new Date().toISOString() };
  await query('UPDATE opportunities SET doc = $2, updated_at = now() WHERE id = $1', [req.params.id, JSON.stringify(out)]);
  await audit({ req, action: `opportunity.outcome.${requested.outcome}`, targetType: 'opportunity', targetId: req.params.id, meta: { previous: { stage: previous.stage, outcome: previous.outcome || null }, next: { stage, outcome } } });
  res.status(200).json(out);
});

router.post('/opportunities/:id/documents', authenticate, requireAnyEditPermission(), async (req, res) => {
  const document = req.body;
  if (!document || typeof document !== 'object' || !String(document.title || '').trim()) return res.status(400).json({ error: 'invalid_document' });
  if (document.fileData && String(document.fileData).length > 7_000_000) return res.status(413).json({ error: 'document_too_large' });
  const current = await query('SELECT doc FROM opportunities WHERE id = $1', [req.params.id]);
  if (!current.rowCount) return res.status(404).json({ error: 'not_found' });
  const previous = current.rows[0].doc || {};
  if (!canAccessOpportunity(req, previous)) return res.status(403).json({ error: 'opportunity_scope_forbidden' });
  const savedDocument = {
    ...document,
    id: String(document.id || `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
    title: String(document.title).trim(),
    uploadedBy: req.user?.name || req.user?.email || 'Unknown',
    uploadedAt: new Date().toISOString().slice(0, 10),
    status: document.status || 'In Review',
  };
  const out = { ...previous, id: req.params.id, documents: [savedDocument, ...(previous.documents || [])], updatedAt: new Date().toISOString() };
  await query('UPDATE opportunities SET doc = $2, updated_at = now() WHERE id = $1', [req.params.id, JSON.stringify(out)]);
  await audit({ req, action: 'opportunity.document.upload', targetType: 'opportunity', targetId: req.params.id, meta: { documentId: savedDocument.id, title: savedDocument.title, version: savedDocument.version } });
  res.status(201).json(out);
});

router.get('/opportunities/:id/documents/:documentId', authenticate, async (req, res) => {
  const result = await query('SELECT doc FROM opportunities WHERE id = $1', [req.params.id]);
  if (!result.rowCount) return res.status(404).json({ error: 'not_found' });
  const opportunity = result.rows[0].doc || {};
  if (!canAccessOpportunity(req, opportunity)) return res.status(403).json({ error: 'opportunity_scope_forbidden' });
  const document = (opportunity.documents || []).find(item => item.id === req.params.documentId);
  if (!document) return res.status(404).json({ error: 'document_not_found' });
  if (!document.fileData) return res.status(404).json({ error: 'file_content_unavailable' });
  res.json({ fileName: document.fileName || document.title, fileData: document.fileData });
});

router.post('/opportunities/:id/stage', authenticate, requirePermission('promote_stage'), async (req, res) => {
  const { stage } = req.body || {};
  if (!stage) return res.status(400).json({ error: 'invalid_stage' });
  if (!ALLOWED_OPPORTUNITY_STAGES.has(String(stage))) return res.status(422).json({ error: 'unsupported_stage', allowed: [...ALLOWED_OPPORTUNITY_STAGES] });
  const entry = makeActivity({
    req,
    type: 'Stage Change',
    title: `Stage moved to ${stage}`,
    summary: `Opportunity stage changed to ${stage} by ${req.user?.name || 'Unknown'}.`,
    meta: { stage },
  });
  const cur = await query('SELECT doc FROM opportunities WHERE id = $1', [req.params.id]);
  if (!cur.rowCount) return res.status(404).json({ error: 'not_found' });
  const doc = { ...cur.rows[0].doc, stage: String(stage), updatedAt: new Date().toISOString() };
  if (!canAccessOpportunity(req, cur.rows[0].doc)) return res.status(403).json({ error: 'opportunity_scope_forbidden' });
  doc.activities = prependActivities(doc, [entry]);
  const result = await query('UPDATE opportunities SET doc = $2, updated_at = now() WHERE id = $1 RETURNING doc', [
    req.params.id,
    JSON.stringify(doc),
  ]);
  await audit({ req, action: 'opportunity.stage', targetType: 'opportunity', targetId: req.params.id, meta: { stage } });
  res.json(result.rows[0].doc);
});

router.delete('/opportunities/:id', authenticate, requirePermission('delete_opportunity'), async (req, res) => {
  const result = await query('DELETE FROM opportunities WHERE id = $1 RETURNING id', [req.params.id]);
  if (!result.rowCount) return res.status(404).json({ error: 'not_found' });
  await audit({ req, action: 'opportunity.delete', targetType: 'opportunity', targetId: req.params.id });
  res.json({ ok: true });
});

router.post('/clients', authenticate, requireAnyEditPermission(), async (req, res) => {
  const client = req.body;
  if (!client || typeof client !== 'object' || !String(client.name || '').trim()) {
    return res.status(400).json({ error: 'invalid_client', hint: 'Client name is required.' });
  }
  const id = String(client.id || `client-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  const doc = {
    ...client,
    id,
    name: String(client.name).trim(),
    code: String(client.code || `CL-${Date.now().toString().slice(-6)}`).trim(),
    createdDate: client.createdDate || new Date().toISOString().slice(0, 10),
    createdBy: req.user?.name || req.user?.email || 'Unknown',
    lastUpdated: new Date().toISOString(),
  };
  try {
    const result = await query('INSERT INTO clients (id, doc, created_at, updated_at) VALUES ($1, $2, now(), now()) RETURNING doc', [id, JSON.stringify(doc)]);
    await audit({ req, action: 'client.create', targetType: 'client', targetId: id, meta: { targetName: doc.name, entityCode: doc.code } });
    res.status(201).json(result.rows[0].doc);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'duplicate_client', hint: 'A client with this ID or code already exists.' });
    console.error('client create failed:', err.message);
    res.status(500).json({ error: 'client_create_failed' });
  }
});

router.put('/clients/:id', authenticate, requireAnyEditPermission(), async (req, res) => {
  const incoming = req.body;
  if (!incoming || typeof incoming !== 'object' || !String(incoming.name || '').trim()) return res.status(400).json({ error: 'invalid_client' });
  const current = await query('SELECT doc FROM clients WHERE id = $1', [req.params.id]);
  if (!current.rowCount) return res.status(404).json({ error: 'not_found' });
  const previous = current.rows[0].doc || {};
  if (!(await canAccessClient(req, previous))) return res.status(403).json({ error: 'client_scope_forbidden' });
  const doc = { ...previous, ...incoming, id: req.params.id, name: String(incoming.name).trim(), lastUpdated: new Date().toISOString() };
  try {
    const result = await query('UPDATE clients SET doc = $2, updated_at = now() WHERE id = $1 RETURNING doc', [req.params.id, JSON.stringify(doc)]);
    await audit({ req, action: 'client.update', targetType: 'client', targetId: req.params.id, meta: { targetName: doc.name, previous, next: doc } });
    res.json(result.rows[0].doc);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'duplicate_client_code' });
    res.status(500).json({ error: 'client_update_failed' });
  }
});

// Admin-only reset: restores seed opportunities from the seed cache.
router.post('/opportunities/reset', authenticate, requirePermission('sys.integrations'), async (req, res) => {
  const cache = loadSeedCache();
  if (!cache || !Array.isArray(cache.opportunities)) {
    return res.status(500).json({ error: 'seed_cache_missing', hint: 'Run npm run seed first' });
  }
  await query('DELETE FROM opportunities');
  for (const o of cache.opportunities) {
    await query('INSERT INTO opportunities (id, doc, updated_at) VALUES ($1, $2, now())', [o.id, JSON.stringify(o)]);
  }
  await audit({ req, action: 'opportunity.reset', targetType: 'system', targetId: null, meta: { count: cache.opportunities.length } });
  res.json({ ok: true, count: cache.opportunities.length });
});

// ---------------------------------------------------------------------------
// Users & roles (admin)
// ---------------------------------------------------------------------------
router.get('/users', authenticate, requirePermission('sys.users'), async (req, res) => {
  const { rows } = await query(
    'SELECT id, name, email, role, role_id, department, status, mfa_enabled, avatar, region, last_login_at, created_at FROM users ORDER BY name',
  );
  res.json(rows);
});

router.post('/users', authenticate, requirePermission('sys.users'), async (req, res) => {
  const { name, email, role, roleId, department, password } = req.body || {};
  if (!name || !email || !role || !roleId) {
    return res.status(400).json({ error: 'missing_fields' });
  }
  const finalPassword = typeof password === 'string' && password.length >= 8
    ? password
    : `Temp-${Buffer.from(Math.random().toString(36) + Date.now().toString(36)).toString('hex').slice(0, 10)}`;
  const exists = await query('SELECT 1 FROM users WHERE lower(email) = lower($1)', [String(email)]);
  if (exists.rows.length) return res.status(409).json({ error: 'email_taken' });
  const id = `usr-${Date.now()}`;
  await query(
    'INSERT INTO users (id, name, email, password_hash, role, role_id, department, status) VALUES ($1,$2,$3,$4,$5,$6,$7,\'Active\')',
    [id, String(name), String(email), await hashPassword(finalPassword), String(role), String(roleId), department || null],
  );
  await audit({ req, action: 'user.create', targetType: 'user', targetId: id });
  const generated = typeof password !== 'string' || password.length < 8;
  res.status(201).json({ id, name, email, role, roleId, department: department ?? null, status: 'Active', tempPassword: generated ? finalPassword : undefined });
});

router.put('/users/:id', authenticate, requirePermission('sys.users'), async (req, res) => {
  const { name, email, role, roleId, department, status, password } = req.body || {};
  const fields = [];
  const values = [];
  if (name !== undefined) { values.push(String(name)); fields.push(`name = $${values.length}`); }
  if (email !== undefined) { values.push(String(email)); fields.push(`email = $${values.length}`); }
  if (role !== undefined) { values.push(String(role)); fields.push(`role = $${values.length}`); }
  if (roleId !== undefined) { values.push(String(roleId)); fields.push(`role_id = $${values.length}`); }
  if (department !== undefined) { values.push(String(department)); fields.push(`department = $${values.length}`); }
  if (status !== undefined) { values.push(String(status)); fields.push(`status = $${values.length}`); }
  if (password !== undefined) {
    values.push(await hashPassword(String(password)));
    fields.push(`password_hash = $${values.length}`);
  }
  if (!fields.length) return res.status(400).json({ error: 'nothing_to_update' });
  values.push(req.params.id);
  const result = await query(`UPDATE users SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING id`, values);
  if (!result.rowCount) return res.status(404).json({ error: 'not_found' });
  await audit({ req, action: 'user.update', targetType: 'user', targetId: req.params.id });
  res.json({ ok: true });
});

router.get('/roles', authenticate, requirePermission('sys.rbac'), async (req, res) => {
  const { rows } = await query('SELECT * FROM roles ORDER BY role_name');
  res.json(rows);
});

router.post('/roles', authenticate, requirePermission('sys.rbac'), async (req, res) => {
  const { roleName, name, description, permissions } = req.body || {};
  if (!roleName || !Array.isArray(permissions)) {
    return res.status(400).json({ error: 'invalid_role' });
  }
  const id = `role-${Date.now()}`;
  await query(
    `INSERT INTO roles (id, role_name, name, description, users_count, is_system_role, matching_roles, permissions)
     VALUES ($1, $2, $3, $4, 0, false, '[]'::jsonb, $5::jsonb)`,
    [id, String(roleName), name ?? String(roleName), description ?? 'Custom Presales Role', JSON.stringify(permissions)],
  );
  await audit({ req, action: 'rbac.create', targetType: 'role', targetId: id });
  res.status(201).json({ id, role_name: String(roleName), name: name ?? String(roleName), description: description ?? 'Custom Presales Role', users_count: 0, is_system_role: false, matching_roles: [], permissions });
});

router.put('/roles/:id', authenticate, requirePermission('sys.rbac'), async (req, res) => {
  const { description, permissions } = req.body || {};
  if (!Array.isArray(permissions)) return res.status(400).json({ error: 'invalid_permissions' });
  const result = await query('UPDATE roles SET description = COALESCE($2, description), permissions = $3 WHERE id = $1 RETURNING id', [
    req.params.id,
    description ?? null,
    JSON.stringify(permissions),
  ]);
  if (!result.rowCount) return res.status(404).json({ error: 'not_found' });
  await audit({ req, action: 'rbac.update', targetType: 'role', targetId: req.params.id, meta: { permissions } });
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Scope / Solution Catalog (Section 5)
// ---------------------------------------------------------------------------
router.get('/scopes', authenticate, async (req, res) => {
  const { rows } = await query('SELECT id, name, category, description, status, sort_order FROM scope_catalog ORDER BY sort_order, name');
  res.json(rows);
});

router.post('/scopes', authenticate, requirePermission('manage_scope_catalog'), async (req, res) => {
  const { name, category, description, status, sortOrder } = req.body || {};
  if (!name || !String(name).trim() || !category || !String(category).trim()) {
    return res.status(400).json({ error: 'invalid_scope' });
  }
  const finalStatus = /^(Active|Inactive)$/.test(String(status)) ? String(status) : 'Active';
  const finalName = String(name).trim();
  const conflict = await query('SELECT 1 FROM scope_catalog WHERE lower(name) = lower($1)', [finalName]);
  if (conflict.rows.length) return res.status(409).json({ error: 'duplicate_scope', name: finalName });
  const id = `scope-${Date.now()}`;
  await query(
    `INSERT INTO scope_catalog (id, name, category, description, status, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, finalName, String(category).trim(), description ?? null, finalStatus, Number(sortOrder) || 0],
  );
  await audit({ req, action: 'scope.create', targetType: 'scope_catalog', targetId: id, meta: { name: finalName, category: String(category).trim() } });
  res.status(201).json({ id, name: finalName, category: String(category).trim(), description: description ?? null, status: finalStatus, sort_order: Number(sortOrder) || 0 });
});

router.put('/scopes/:id', authenticate, requirePermission('manage_scope_catalog'), async (req, res) => {
  const { name, category, description, status, sortOrder } = req.body || {};
  const cur = await query('SELECT * FROM scope_catalog WHERE id = $1', [req.params.id]);
  if (!cur.rowCount) return res.status(404).json({ error: 'not_found' });
  const prev = cur.rows[0];
  const finalName = name !== undefined ? String(name).trim() : prev.name;
  const finalCategory = category !== undefined ? String(category).trim() : prev.category;
  if (finalName !== prev.name) {
    const dup = await query('SELECT 1 FROM scope_catalog WHERE lower(name) = lower($1) AND id <> $2', [finalName, req.params.id]);
    if (dup.rows.length) return res.status(409).json({ error: 'duplicate_scope', name: finalName });
  }
  const finalStatus = status !== undefined && /^(Active|Inactive)$/.test(String(status)) ? String(status) : prev.status;
  const finalOrder = sortOrder !== undefined ? Number(sortOrder) : prev.sort_order;
  const finalDesc = description !== undefined ? (description ?? null) : (prev.description ?? null);
  await query(
    `UPDATE scope_catalog
     SET name = $1, category = $2, description = $3, status = $4, sort_order = $5, updated_at = now()
     WHERE id = $6`,
    [finalName, finalCategory, finalDesc, finalStatus, finalOrder, req.params.id],
  );
  await audit({ req, action: 'scope.update', targetType: 'scope_catalog', targetId: req.params.id, meta: { from: { name: prev.name, category: prev.category, status: prev.status }, to: { name: finalName, category: finalCategory, status: finalStatus } } });
  res.json({ id: req.params.id, name: finalName, category: finalCategory, description: finalDesc, status: finalStatus, sort_order: finalOrder });
});

router.delete('/scopes/:id', authenticate, requirePermission('manage_scope_catalog'), async (req, res) => {
  const result = await query('DELETE FROM scope_catalog WHERE id = $1 RETURNING id, name', [req.params.id]);
  if (!result.rowCount) return res.status(404).json({ error: 'not_found' });
  await audit({ req, action: 'scope.delete', targetType: 'scope_catalog', targetId: req.params.id, meta: { name: result.rows[0].name } });
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// OEM Management (Section 10)
// ---------------------------------------------------------------------------
router.get('/oems', authenticate, async (req, res) => {
  const { rows } = await query('SELECT id, name, website, description, status FROM oems ORDER BY name');
  res.json(rows);
});

router.post('/oems', authenticate, requirePermission('manage_oem_catalog'), async (req, res) => {
  const { name, website, description, status } = req.body || {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'invalid_oem' });
  }
  const finalName = String(name).trim();
  const finalStatus = /^(Active|Inactive)$/.test(String(status)) ? String(status) : 'Active';
  const conflict = await query('SELECT 1 FROM oems WHERE lower(name) = lower($1)', [finalName]);
  if (conflict.rows.length) return res.status(409).json({ error: 'duplicate_oem', name: finalName });
  const id = `oem-${Date.now()}`;
  await query(
    `INSERT INTO oems (id, name, website, description, status) VALUES ($1, $2, $3, $4, $5)`,
    [id, finalName, website ?? null, description ?? null, finalStatus],
  );
  await audit({ req, action: 'oem.create', targetType: 'oems', targetId: id, meta: { name: finalName } });
  res.status(201).json({ id, name: finalName, website: website ?? null, description: description ?? null, status: finalStatus });
});

router.put('/oems/:id', authenticate, requirePermission('manage_oem_catalog'), async (req, res) => {
  const { name, website, description, status } = req.body || {};
  const cur = await query('SELECT * FROM oems WHERE id = $1', [req.params.id]);
  if (!cur.rowCount) return res.status(404).json({ error: 'not_found' });
  const prev = cur.rows[0];
  const finalName = name !== undefined ? String(name).trim() : prev.name;
  if (finalName !== prev.name) {
    const dup = await query('SELECT 1 FROM oems WHERE lower(name) = lower($1) AND id <> $2', [finalName, req.params.id]);
    if (dup.rows.length) return res.status(409).json({ error: 'duplicate_oem', name: finalName });
  }
  const finalStatus = status !== undefined && /^(Active|Inactive)$/.test(String(status)) ? String(status) : prev.status;
  const finalWebsite = website !== undefined ? (website ?? null) : (prev.website ?? null);
  const finalDesc = description !== undefined ? (description ?? null) : (prev.description ?? null);
  await query(
    `UPDATE oems SET name = $1, website = $2, description = $3, status = $4, updated_at = now() WHERE id = $5`,
    [finalName, finalWebsite, finalDesc, finalStatus, req.params.id],
  );
  await audit({ req, action: 'oem.update', targetType: 'oems', targetId: req.params.id, meta: { name: finalName, status: finalStatus } });
  res.json({ id: req.params.id, name: finalName, website: finalWebsite, description: finalDesc, status: finalStatus });
});

router.delete('/oems/:id', authenticate, requirePermission('manage_oem_catalog'), async (req, res) => {
  const result = await query('DELETE FROM oems WHERE id = $1 RETURNING id, name', [req.params.id]);
  if (!result.rowCount) return res.status(404).json({ error: 'not_found' });
  await audit({ req, action: 'oem.delete', targetType: 'oems', targetId: req.params.id, meta: { name: result.rows[0].name } });
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Product Catalog (Section 11)
// ---------------------------------------------------------------------------
router.get('/products', authenticate, async (req, res) => {
  const { rows } = await query(
    `SELECT p.id, p.oem_id, o.name AS oem_name, p.name, p.category, p.product_line,
            p.model, p.part_number, p.description, p.unit, p.status
     FROM product_catalog p LEFT JOIN oems o ON p.oem_id = o.id
     ORDER BY o.name, p.name`,
  );
  res.json(rows);
});

router.post('/products', authenticate, requirePermission('manage_oem_catalog'), async (req, res) => {
  const { oemId, name, category, productLine, model, partNumber, description, unit, status } = req.body || {};
  if (!name || !String(name).trim() || !category || !String(category).trim()) {
    return res.status(400).json({ error: 'invalid_product' });
  }
  const finalModel = String(model || '').trim();
  const finalStatus = /^(Active|Inactive)$/.test(String(status)) ? String(status) : 'Active';
  if (finalModel) {
    const dup = await query('SELECT 1 FROM product_catalog WHERE lower(model) = lower($1)', [finalModel]);
    if (dup.rows.length) return res.status(409).json({ error: 'duplicate_product', model: finalModel });
  }
  const id = `prod-${Date.now()}`;
  await query(
    `INSERT INTO product_catalog (id, oem_id, name, category, product_line, model, part_number, description, unit, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [id, oemId ?? null, String(name).trim(), String(category).trim(), productLine ?? null, finalModel || null, partNumber ?? null, description ?? null, unit ?? 'Units', finalStatus],
  );
  await audit({ req, action: 'product.create', targetType: 'product_catalog', targetId: id, meta: { name: String(name).trim(), model: finalModel } });
  res.status(201).json({ id, oem_id: oemId ?? null, name: String(name).trim(), category: String(category).trim(), product_line: productLine ?? null, model: finalModel || null, part_number: partNumber ?? null, description: description ?? null, unit: unit ?? 'Units', status: finalStatus });
});

router.put('/products/:id', authenticate, requirePermission('manage_oem_catalog'), async (req, res) => {
  const { oemId, name, category, productLine, model, partNumber, description, unit, status } = req.body || {};
  const cur = await query('SELECT * FROM product_catalog WHERE id = $1', [req.params.id]);
  if (!cur.rowCount) return res.status(404).json({ error: 'not_found' });
  const prev = cur.rows[0];
  const finalModel = model !== undefined ? String(model).trim() : (prev.model ?? '');
  if (finalModel && finalModel !== (prev.model ?? '')) {
    const dup = await query('SELECT 1 FROM product_catalog WHERE lower(model) = lower($1) AND id <> $2', [finalModel, req.params.id]);
    if (dup.rows.length) return res.status(409).json({ error: 'duplicate_product', model: finalModel });
  }
  const finalStatus = status !== undefined && /^(Active|Inactive)$/.test(String(status)) ? String(status) : prev.status;
  const finalName = name !== undefined ? String(name).trim() : prev.name;
  const finalCategory = category !== undefined ? String(category).trim() : prev.category;
  const finalOemId = oemId !== undefined ? (oemId ?? null) : (prev.oem_id ?? null);
  const finalProductLine = productLine !== undefined ? (productLine ?? null) : (prev.product_line ?? null);
  const finalPartNumber = partNumber !== undefined ? (partNumber ?? null) : (prev.part_number ?? null);
  const finalDesc = description !== undefined ? (description ?? null) : (prev.description ?? null);
  const finalUnit = unit !== undefined ? (unit ?? 'Units') : (prev.unit ?? 'Units');
  await query(
    `UPDATE product_catalog SET oem_id=$1, name=$2, category=$3, product_line=$4, model=$5, part_number=$6, description=$7, unit=$8, status=$9, updated_at=now() WHERE id=$10`,
    [finalOemId, finalName, finalCategory, finalProductLine, finalModel || null, finalPartNumber, finalDesc, finalUnit, finalStatus, req.params.id],
  );
  await audit({ req, action: 'product.update', targetType: 'product_catalog', targetId: req.params.id, meta: { name: finalName, model: finalModel } });
  res.json({ id: req.params.id, oem_id: finalOemId, name: finalName, category: finalCategory, product_line: finalProductLine, model: finalModel || null, part_number: finalPartNumber, description: finalDesc, unit: finalUnit, status: finalStatus });
});

router.delete('/products/:id', authenticate, requirePermission('manage_oem_catalog'), async (req, res) => {
  const result = await query('DELETE FROM product_catalog WHERE id = $1 RETURNING id, name', [req.params.id]);
  if (!result.rowCount) return res.status(404).json({ error: 'not_found' });
  await audit({ req, action: 'product.delete', targetType: 'product_catalog', targetId: req.params.id, meta: { name: result.rows[0].name } });
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Audit trail
// ---------------------------------------------------------------------------
router.get('/audit-logs', authenticate, requirePermission('sys.audit'), async (req, res) => {
  const { rows } = await query(
    'SELECT id, actor_id, actor_email, action, target_type, target_id, meta, ip, actor_role, request_id, created_at FROM audit_logs ORDER BY created_at DESC LIMIT $1',
    [Number(req.query.limit) || 200],
  );
  res.json(rows);
});

router.get('/health', async (req, res) => {
  try {
    await query('SELECT 1');
    res.json({ ok: true, service: 'presales-api', db: 'connected', time: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ ok: false, service: 'presales-api', db: 'error', error: err.message });
  }
});

export default router;
