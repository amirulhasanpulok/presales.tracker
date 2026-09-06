import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { query, DEFAULT_WORKFLOW_STAGES } from './db.js';
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
function fallbackWorkflow() {
  return DEFAULT_WORKFLOW_STAGES.map(([id, label, shortLabel, description, requiresScope, requiresApprovedBOQ]) => ({ id, label, shortLabel, description, requiresScope, requiresApprovedBOQ }));
}

function parseWorkflow(value) {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) && parsed.length ? parsed.filter(stage => stage && typeof stage.id === 'string') : fallbackWorkflow();
  } catch {
    return fallbackWorkflow();
  }
}

function parsePolicy(value) {
  try {
    const policy = JSON.parse(value || '{}');
    return {
      minMarginFloor: Math.min(Math.max(Number(policy.minMarginFloor) || 35, 0), 100),
      slaWarningThresholdDays: Math.min(Math.max(Number(policy.slaWarningThresholdDays) || 14, 1), 365),
      sessionTimeoutMinutes: Math.min(Math.max(Number(policy.sessionTimeoutMinutes) || 60, 5), 1440),
      requireMFA: Boolean(policy.requireMFA),
      enableSlackWebhooks: Boolean(policy.enableSlackWebhooks),
      slackWebhookUrl: typeof policy.slackWebhookUrl === 'string' ? policy.slackWebhookUrl.slice(0, 500) : '',
      autoArchiveDays: Math.min(Math.max(Number(policy.autoArchiveDays) || 90, 1), 3650),
    };
  } catch {
    return { minMarginFloor: 35, slaWarningThresholdDays: 14, sessionTimeoutMinutes: 60, requireMFA: true, enableSlackWebhooks: false, slackWebhookUrl: '', autoArchiveDays: 90 };
  }
}

async function getWorkflowStages() {
  const result = await query("SELECT setting_value FROM system_settings WHERE setting_key = 'workflow_stages'");
  return parseWorkflow(result.rows[0]?.setting_value);
}

function canAccessOpportunity(req, doc) {
  if (can(req.role, req.user, 'sys.users') || can(req.role, req.user, 'sys.rbac')) return true;
  const roleId = req.user?.roleId || req.user?.role_id;
  if (roleId === 'role-kam') return doc.accountExecutive === req.user?.name;
  if (roleId === 'role-sa') return doc.leadSolutionArchitect === req.user?.name || doc.presalesEngineerSecondary === req.user?.name || (doc.supportingPresalesEngineers || []).includes(req.user?.name);
  if (roleId === 'role-delivery' || roleId === 'role-postsales') return doc.stage === 'closed_won' || doc.handover?.isHandedOver;
  return false;
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

function stagePrerequisites(doc, nextStage, workflow = fallbackWorkflow()) {
  const missing = [];
  const stage = workflow.find(item => item.id === nextStage);
  if (stage?.requiresScope && !(doc.scopes || []).length) missing.push('At least one solution scope');
  if (stage?.requiresApprovedBOQ && !['approved', 'finalized'].includes(doc.boq?.approvalStatus)) missing.push('Approved BOQ');
  return missing;
}

function changed(previous, next, field) {
  return JSON.stringify(previous?.[field] ?? null) !== JSON.stringify(next?.[field] ?? null);
}

function validateOpportunityChanges(req, previous, next) {
  if (changed(previous, next, 'stage') && !can(req.role, req.user, 'promote_stage')) return 'promote_stage';
  if (changed(previous, next, 'boq')) {
    if (!can(req.role, req.user, 'author_boq')) return 'author_boq';
    if (previous.boq?.approvalStatus !== next.boq?.approvalStatus && !can(req.role, req.user, 'approve_boq_discount')) return 'approve_boq_discount';
    if (previous.boq?.overallMarginPercent !== next.boq?.overallMarginPercent && Number(next.boq?.overallMarginPercent) < 35 && !can(req.role, req.user, 'override_margin')) return 'override_margin';
  }
  if (changed(previous, next, 'poc') && !can(req.role, req.user, 'run_poc_benchmarks')) return 'run_poc_benchmarks';
  if (changed(previous, next, 'handover')) {
    if (previous.handover?.isHandedOver !== next.handover?.isHandedOver && !can(req.role, req.user, 'signoff_handover')) return 'signoff_handover';
    if (previous.handover?.isHandedOver === next.handover?.isHandedOver && !can(req.role, req.user, 'initiate_handover')) return 'initiate_handover';
  }
  return null;
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
  if (attempts.size > 10000) {
    for (const [storedKey, stored] of attempts) {
      if (stored.resetAt < now) attempts.delete(storedKey);
    }
  }
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
  const scope = isAdministrator
    ? { sql: null, params: [] }
    : roleId === 'role-kam'
      ? { sql: "o.doc->>'accountExecutive' = $1", params: [req.user?.name] }
      : roleId === 'role-sa'
        ? { sql: "(o.doc->>'leadSolutionArchitect' = $1 OR o.doc->>'presalesEngineerSecondary' = $1 OR o.doc->'supportingPresalesEngineers' ? $1)", params: [req.user?.name] }
        : roleId === 'role-delivery' || roleId === 'role-postsales'
          ? { sql: "(o.doc->>'stage' = 'closed_won' OR COALESCE((o.doc->'handover'->>'isHandedOver')::boolean, false) = true)", params: [] }
          : { sql: 'false', params: [] };
  const opportunityQuery = isAdministrator
    ? { text: 'SELECT * FROM opportunities ORDER BY updated_at DESC', params: [] }
    : { text: `SELECT * FROM opportunities o WHERE ${scope.sql} ORDER BY updated_at DESC`, params: scope.params };
  const clientQuery = isAdministrator
    ? { text: 'SELECT * FROM clients ORDER BY updated_at DESC', params: [] }
    : { text: `SELECT c.* FROM clients c WHERE EXISTS (SELECT 1 FROM opportunities o WHERE o.doc->>'clientName' = c.doc->>'name' AND ${scope.sql}) ORDER BY c.updated_at DESC`, params: scope.params };
  const [roles, opportunities, clients, users, auditLogs, scopes, oems, products, systemSettings] = await Promise.all([
    can(req.role, req.user, 'sys.rbac') ? query('SELECT * FROM roles ORDER BY role_name') : Promise.resolve({ rows: [] }),
    query(opportunityQuery.text, opportunityQuery.params),
    query(clientQuery.text, clientQuery.params),
    can(req.role, req.user, 'sys.users') ? query('SELECT id, name, email, role, role_id, department, sales_team, phone, manager, skills, certifications, status, mfa_enabled, avatar, region, last_login_at, created_at FROM users ORDER BY name') : Promise.resolve({ rows: [] }),
    can(req.role, req.user, 'sys.audit') ? query('SELECT id, actor_id, actor_email, action, target_type, target_id, meta, ip, actor_role, request_id, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 200') : Promise.resolve({ rows: [] }),
    query('SELECT id, name, category, description, status, sort_order FROM scope_catalog ORDER BY sort_order, name'),
    query('SELECT id, name, website, description, status, partner_portal_url, partnership_status, partner_tier, sales_certifications, presales_certifications, postsales_certifications, required_certifications FROM oems ORDER BY name'),
    query(
      `SELECT p.id, p.oem_id, o.name AS oem_name, p.name, p.category, p.product_line,
              p.model, p.part_number, p.description, p.unit, p.status
       FROM product_catalog p LEFT JOIN oems o ON p.oem_id = o.id
       ORDER BY o.name, p.name`,
    ),
     query("SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('currency', 'activity_types', 'tech_stacks', 'industries', 'regions', 'workflow_stages', 'policy_config')"),
  ]);
  const scopedOpportunityDocs = (opportunities.rows || []).map(o => o.doc).filter(doc => isAdministrator || canAccessOpportunity(req, doc));
  const scopedClientDocs = (clients.rows || []).map(c => c.doc);

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
     taxonomies: Object.fromEntries(['tech_stacks', 'industries', 'regions'].map(key => {
       try { const value = JSON.parse(systemSettings.rows.find(s => s.setting_key === key)?.setting_value || '[]'); return [key, Array.isArray(value) ? value : []]; } catch { return [key, []]; }
     })),
     workflow: parseWorkflow(systemSettings.rows.find(s => s.setting_key === 'workflow_stages')?.setting_value),
     policies: can(req.role, req.user, 'sys.integrations') ? parsePolicy(systemSettings.rows.find(s => s.setting_key === 'policy_config')?.setting_value) : undefined,
    users: can(req.role, req.user, 'sys.users') ? (users.rows || []) : [req.user],
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

router.put('/settings/taxonomy', authenticate, requirePermission('sys.integrations'), async (req, res) => {
  const clean = value => Array.isArray(value)
    ? [...new Set(value.map(item => String(item).trim()).filter(Boolean))].slice(0, 200)
    : [];
  const taxonomies = {
    techStacks: clean(req.body?.techStacks),
    industries: clean(req.body?.industries),
    regions: clean(req.body?.regions),
  };
  if (!taxonomies.techStacks.length || !taxonomies.industries.length || !taxonomies.regions.length) {
    return res.status(400).json({ error: 'invalid_taxonomy' });
  }
  await query(`INSERT INTO system_settings (setting_key, setting_value, updated_at)
    VALUES ('tech_stacks', $1, now()), ('industries', $2, now()), ('regions', $3, now())
    ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = now()`, [
    JSON.stringify(taxonomies.techStacks), JSON.stringify(taxonomies.industries), JSON.stringify(taxonomies.regions),
  ]);
  await audit({ req, action: 'settings.taxonomy.update', targetType: 'system_settings', targetId: 'taxonomy', meta: { counts: Object.fromEntries(Object.entries(taxonomies).map(([key, values]) => [key, values.length])) } });
  res.json(taxonomies);
});

router.put('/settings/policies', authenticate, requirePermission('sys.integrations'), async (req, res) => {
  const policy = parsePolicy(JSON.stringify(req.body || {}));
  if (policy.enableSlackWebhooks && policy.slackWebhookUrl && !/^https:\/\//i.test(policy.slackWebhookUrl)) return res.status(400).json({ error: 'invalid_webhook_url' });
  await query("INSERT INTO system_settings (setting_key, setting_value, updated_at) VALUES ('policy_config', $1, now()) ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = now()", [JSON.stringify(policy)]);
  await audit({ req, action: 'settings.policies.update', targetType: 'system_settings', targetId: 'policy_config', meta: { ...policy, slackWebhookUrl: policy.slackWebhookUrl ? '[configured]' : '' } });
  res.json(policy);
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
  res.status(201).json(stripDocumentContent(out));
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
  const workflow = await getWorkflowStages();
  const allowedStages = new Set(workflow.map(stage => stage.id));
  if (!doc || typeof doc !== 'object' || doc.id !== req.params.id) {
    return res.status(400).json({ error: 'invalid_opportunity' });
  }
  if (doc.stage !== undefined && !allowedStages.has(String(doc.stage))) {
    return res.status(422).json({ error: 'unsupported_stage', allowed: [...allowedStages] });
  }
  const current = await query('SELECT doc FROM opportunities WHERE id = $1', [req.params.id]);
  if (!current.rowCount) return res.status(404).json({ error: 'not_found' });
  const previousDoc = current.rows[0].doc || {};
  if (!canAccessOpportunity(req, previousDoc)) return res.status(403).json({ error: 'opportunity_scope_forbidden' });
  const deniedPermission = validateOpportunityChanges(req, previousDoc, doc);
  if (deniedPermission) return res.status(403).json({ error: 'field_permission_required', required: deniedPermission });
  if (doc.stage !== undefined && doc.stage !== previousDoc.stage) {
    const missing = stagePrerequisites(previousDoc, String(doc.stage), workflow);
    if (missing.length) return res.status(422).json({ error: 'stage_prerequisites_incomplete', stage: doc.stage, missing });
  }
  if (previousDoc.handover?.isHandedOver !== doc.handover?.isHandedOver) return res.status(403).json({ error: 'handover_signoff_required' });
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
  res.json(stripDocumentContent(out));
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
  res.status(201).json(stripDocumentContent(out));
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
  if (document.fileData && (!/^data:[\w.+-]+\/[\w.+-]+;base64,[A-Za-z0-9+/=]+$/.test(String(document.fileData)) || String(document.fileData).length > 7_000_000)) {
    return res.status(413).json({ error: 'invalid_or_oversized_document' });
  }
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
  res.status(201).json(stripDocumentContent(out));
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

router.post('/opportunities/:id/handover/signoff', authenticate, requirePermission('signoff_handover'), async (req, res) => {
  const current = await query('SELECT doc FROM opportunities WHERE id = $1', [req.params.id]);
  if (!current.rowCount) return res.status(404).json({ error: 'not_found' });
  const previous = current.rows[0].doc || {};
  if (!canAccessOpportunity(req, previous)) return res.status(403).json({ error: 'opportunity_scope_forbidden' });
  const handover = previous.handover || {};
  const missing = ['technicalRunbookReady', 'credentialsSecurelyTransferred', 'customerTechKickoffScheduled'].filter(field => !handover[field]);
  if (missing.length) return res.status(422).json({ error: 'handover_gates_incomplete', missing });
  const updatedHandover = {
    ...handover,
    ...(req.body || {}),
    isHandedOver: true,
    status: 'handed_over',
    handoverDate: new Date().toISOString().slice(0, 10),
    handedOverBy: req.user?.name || req.user?.email || 'Unknown',
  };
  const activity = makeActivity({ req, type: 'Handover Sign-off', title: 'Sales handover signed off', summary: `Handover signed off by ${updatedHandover.handedOverBy}.` });
  const out = { ...previous, handover: updatedHandover, activities: prependActivities(previous, [activity]), updatedAt: new Date().toISOString() };
  await query('UPDATE opportunities SET doc = $2, updated_at = now() WHERE id = $1', [req.params.id, JSON.stringify(out)]);
  await audit({ req, action: 'opportunity.handover.signoff', targetType: 'opportunity', targetId: req.params.id, meta: { previous: handover, next: updatedHandover } });
  res.json(stripDocumentContent(out));
});

router.post('/opportunities/:id/stage', authenticate, requirePermission('promote_stage'), async (req, res) => {
  const { stage } = req.body || {};
  const workflow = await getWorkflowStages();
  const allowedStages = new Set(workflow.map(item => item.id));
  if (!stage) return res.status(400).json({ error: 'invalid_stage' });
  if (!allowedStages.has(String(stage))) return res.status(422).json({ error: 'unsupported_stage', allowed: [...allowedStages] });
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
  const missing = stagePrerequisites(cur.rows[0].doc, String(stage), workflow);
  if (missing.length) return res.status(422).json({ error: 'stage_prerequisites_incomplete', stage, missing });
  doc.activities = prependActivities(doc, [entry]);
  const result = await query('UPDATE opportunities SET doc = $2, updated_at = now() WHERE id = $1 RETURNING doc', [
    req.params.id,
    JSON.stringify(doc),
  ]);
  await audit({ req, action: 'opportunity.stage', targetType: 'opportunity', targetId: req.params.id, meta: { stage } });
  res.json(result.rows[0].doc);
});

router.delete('/opportunities/:id', authenticate, requirePermission('delete_opportunity'), async (req, res) => {
  const current = await query('SELECT doc FROM opportunities WHERE id = $1', [req.params.id]);
  if (!current.rowCount) return res.status(404).json({ error: 'not_found' });
  if (!canAccessOpportunity(req, current.rows[0].doc || {})) return res.status(403).json({ error: 'opportunity_scope_forbidden' });
  const result = await query('DELETE FROM opportunities WHERE id = $1 RETURNING id', [req.params.id]);
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

router.post('/bulk-import', authenticate, requirePermission('sys.integrations'), async (req, res) => {
  const { entity, rows } = req.body || {};
  const allowed = ['users', 'clients', 'opportunities', 'opportunity_updates'];
  if (!allowed.includes(entity) || !Array.isArray(rows) || rows.length > 1000) return res.status(400).json({ error: 'invalid_bulk_import' });
  let created = 0; let updated = 0; const errors = [];
  for (const row of rows) {
    try {
      if (!row || typeof row !== 'object') throw new Error('row is not an object');
      if (entity === 'users') {
        if (!row.name || !row.email) throw new Error('name and email are required');
        const role = await query('SELECT id FROM roles WHERE id = $1 OR lower(role_name) = lower($2) LIMIT 1', [row.roleId || row.role_id || null, row.role || 'Sales KAM']);
        if (!role.rowCount) throw new Error('role not found');
        const exists = await query('SELECT id FROM users WHERE lower(email) = lower($1)', [String(row.email)]);
        if (exists.rowCount) { updated += 1; continue; }
         const importedPassword = String(row.password || '');
         if (!importedPassword || validatePassword(importedPassword).length) throw new Error('a strong row password is required');
         await query("INSERT INTO users (id,name,email,password_hash,role,role_id,department,sales_team,status,region,must_change_password) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'Active',$9,true)", [`bulk-user-${Date.now()}-${created}`, String(row.name).trim(), String(row.email).trim(), await hashPassword(importedPassword), String(row.role || 'Sales KAM'), role.rows[0].id, row.department || null, row.salesTeam || row.sales_team || null, row.region || null]);
        created += 1;
      } else if (entity === 'clients') {
        if (!row.name && !row['Subscriber Name']) throw new Error('client name is required');
        const name = String(row.name || row['Subscriber Name']).trim();
        const code = String(row.code || row['Subscriber ID'] || `BULK-${Date.now()}-${created}`).trim();
        const existing = await query("SELECT id FROM clients WHERE doc->>'code' = $1 OR lower(doc->>'name') = lower($2) LIMIT 1", [code, name]);
        const doc = { ...row, id: existing.rows[0]?.id || `bulk-client-${Date.now()}-${created}`, code, name, source: row.source || 'bulk_excel', lastUpdated: new Date().toISOString() };
        if (existing.rowCount) { await query('UPDATE clients SET doc=$2, updated_at=now() WHERE id=$1', [existing.rows[0].id, JSON.stringify(doc)]); updated += 1; } else { await query('INSERT INTO clients (id,doc,updated_at) VALUES ($1,$2,now())', [doc.id, JSON.stringify(doc)]); created += 1; }
      } else if (entity === 'opportunities') {
        if (!row.name || !row.clientName) throw new Error('name and clientName are required');
        const id = String(row.id || `bulk-opp-${Date.now()}-${created}`); const doc = { ...row, id, code: row.code || `BULK-${Date.now()}-${created}`, name: String(row.name), clientName: String(row.clientName), stage: row.stage || 'qualification', priority: row.priority || 'p2_medium', activities: [], stakeholders: [], technologies: [], scopes: [], contractValue: Number(row.contractValue || 0), arr: Number(row.arr || 0), winProbability: Number(row.winProbability || 0), leadSolutionArchitect: row.leadSolutionArchitect || 'Unassigned', accountExecutive: row.accountExecutive || 'Unassigned', boq: { items: [], subtotalCost: 0, subtotalListPrice: 0, totalDiscountAmount: 0, totalContractValue: 0, annualRecurringRevenue: 0, oneTimeServicesValue: 0, overallMarginPercent: 0, approvalStatus: 'draft', version: 1 }, poc: { status: 'not_started', allocatedBudget: 0, successCriteria: [], blockers: [] }, handover: { isHandedOver: false, technicalRunbookReady: false, credentialsSecurelyTransferred: false, customerTechKickoffScheduled: false, knownTechnicalDebtOrRisks: [], specialSLAsAgreed: [] }, actionItems: [], stakeholders: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), lastContactedAt: new Date().toISOString(), daysInCurrentStage: 0 };
        await query('INSERT INTO opportunities (id,doc,updated_at) VALUES ($1,$2,now()) ON CONFLICT (id) DO UPDATE SET doc=$2,updated_at=now()', [id, JSON.stringify(doc)]); created += 1;
      } else {
        const target = await query("SELECT id,doc FROM opportunities WHERE id=$1 OR doc->>'code'=$1 LIMIT 1", [String(row.opportunityId || row.opportunityCode || row.code || '')]);
        if (!target.rowCount) throw new Error('opportunity not found');
        if (!canAccessOpportunity(req, target.rows[0].doc || {})) throw new Error('opportunity scope forbidden');
        const doc = target.rows[0].doc || {}; const activity = { id: `bulk-activity-${Date.now()}-${updated}`, type: row.type || row.activityType || 'Other', title: row.title || row.type || 'Imported update', timestamp: new Date().toISOString(), author: req.user?.name || 'Bulk Import', summary: row.summary || row.description || row.note || '', durationMinutes: Number(row.durationMinutes || 0), attendees: [], nextAction: row.nextAction || '', nextFollowUpDate: row.nextFollowUpDate || '' };
        await query('UPDATE opportunities SET doc=$2,updated_at=now() WHERE id=$1', [target.rows[0].id, JSON.stringify({ ...doc, activities: [activity, ...(doc.activities || [])], updatedAt: new Date().toISOString() })]); updated += 1;
      }
    } catch (error) { errors.push(`${entity} row ${errors.length + created + updated + 1}: ${error.message}`); }
  }
  await audit({ req, action: `bulk_import.${entity}`, targetType: entity, meta: { rows: rows.length, created, updated, errors: errors.length } });
  res.json({ created, updated, errors });
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
    'SELECT id, name, email, role, role_id, department, sales_team, phone, manager, skills, certifications, status, mfa_enabled, avatar, region, last_login_at, created_at FROM users ORDER BY name',
  );
  res.json(rows);
});

router.post('/users', authenticate, requirePermission('sys.users'), async (req, res) => {
  const { name, email, role, roleId, department, salesTeam, phone, manager, skills, certifications, region, password } = req.body || {};
  if (!name || !email || !role || !roleId) {
    return res.status(400).json({ error: 'missing_fields' });
  }
  if (typeof password !== 'string' || validatePassword(password).length) {
    return res.status(400).json({ error: 'weak_password', hints: validatePassword(String(password || '')) });
  }
  const finalPassword = password;
  const exists = await query('SELECT 1 FROM users WHERE lower(email) = lower($1)', [String(email)]);
  if (exists.rows.length) return res.status(409).json({ error: 'email_taken' });
  const id = `usr-${Date.now()}`;
  await query(
    'INSERT INTO users (id, name, email, password_hash, role, role_id, department, sales_team, phone, manager, skills, certifications, region, status, must_change_password) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12::jsonb,$13,\'Active\',true)',
    [id, String(name), String(email), await hashPassword(finalPassword), String(role), String(roleId), department || null, salesTeam || null, phone || null, manager || null, JSON.stringify(skills || []), JSON.stringify(certifications || []), region || null],
  );
  await audit({ req, action: 'user.create', targetType: 'user', targetId: id });
  res.status(201).json({ id, name, email, role, roleId, department: department ?? null, salesTeam: salesTeam ?? null, phone: phone ?? null, manager: manager ?? null, skills: skills || [], certifications: certifications || [], region: region ?? null, status: 'Active', mfaEnabled: false, mustChangePassword: true });
});

router.put('/users/:id', authenticate, requirePermission('sys.users'), async (req, res) => {
  const { name, email, role, roleId, department, salesTeam, phone, manager, skills, certifications, region, status, password } = req.body || {};
  const fields = [];
  const values = [];
  if (name !== undefined) { values.push(String(name)); fields.push(`name = $${values.length}`); }
  if (email !== undefined) { values.push(String(email)); fields.push(`email = $${values.length}`); }
  if (role !== undefined) { values.push(String(role)); fields.push(`role = $${values.length}`); }
  if (roleId !== undefined) { values.push(String(roleId)); fields.push(`role_id = $${values.length}`); }
  if (department !== undefined) { values.push(String(department)); fields.push(`department = $${values.length}`); }
  if (region !== undefined) { values.push(String(region)); fields.push(`region = $${values.length}`); }
  if (salesTeam !== undefined) { values.push(String(salesTeam)); fields.push(`sales_team = $${values.length}`); }
  if (phone !== undefined) { values.push(String(phone)); fields.push(`phone = $${values.length}`); }
  if (manager !== undefined) { values.push(String(manager)); fields.push(`manager = $${values.length}`); }
  if (skills !== undefined) { values.push(JSON.stringify(Array.isArray(skills) ? skills : [])); fields.push(`skills = $${values.length}::jsonb`); }
  if (certifications !== undefined) { values.push(JSON.stringify(Array.isArray(certifications) ? certifications : [])); fields.push(`certifications = $${values.length}::jsonb`); }
  if (status !== undefined) { values.push(String(status)); fields.push(`status = $${values.length}`); }
  if (password !== undefined) {
    const passwordReasons = validatePassword(String(password));
    if (passwordReasons.length) return res.status(400).json({ error: 'weak_password', hints: passwordReasons });
    values.push(await hashPassword(String(password)));
    fields.push(`password_hash = $${values.length}`);
    values.push(true);
    fields.push(`must_change_password = $${values.length}`);
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
  const { rows } = await query('SELECT id, name, website, description, status, partner_portal_url, partnership_status, partner_tier, sales_certifications, presales_certifications, postsales_certifications, required_certifications FROM oems ORDER BY name');
  res.json(rows);
});

router.post('/oems', authenticate, requirePermission('manage_oem_catalog'), async (req, res) => {
  const { name, website, description, status, partnerPortalUrl, partnershipStatus, partnerTier, salesCertifications, presalesCertifications, postsalesCertifications, requiredCertifications } = req.body || {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'invalid_oem' });
  }
  const finalName = String(name).trim();
  const finalStatus = /^(Active|Inactive)$/.test(String(status)) ? String(status) : 'Active';
  const conflict = await query('SELECT 1 FROM oems WHERE lower(name) = lower($1)', [finalName]);
  if (conflict.rows.length) return res.status(409).json({ error: 'duplicate_oem', name: finalName });
  const id = `oem-${Date.now()}`;
  await query(
    `INSERT INTO oems (id, name, website, description, status, partner_portal_url, partnership_status, partner_tier, sales_certifications, presales_certifications, postsales_certifications, required_certifications) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, $11::jsonb, $12::jsonb)`,
    [id, finalName, website ?? null, description ?? null, finalStatus, partnerPortalUrl ?? null, partnershipStatus ?? null, partnerTier ?? null, JSON.stringify(salesCertifications || []), JSON.stringify(presalesCertifications || []), JSON.stringify(postsalesCertifications || []), JSON.stringify(requiredCertifications || [])],
  );
  await audit({ req, action: 'oem.create', targetType: 'oems', targetId: id, meta: { name: finalName } });
  res.status(201).json({ id, name: finalName, website: website ?? null, description: description ?? null, status: finalStatus, partner_portal_url: partnerPortalUrl ?? null, partnership_status: partnershipStatus ?? null, partner_tier: partnerTier ?? null, sales_certifications: salesCertifications || [], presales_certifications: presalesCertifications || [], postsales_certifications: postsalesCertifications || [], required_certifications: requiredCertifications || [] });
});

router.put('/oems/:id', authenticate, requirePermission('manage_oem_catalog'), async (req, res) => {
  const { name, website, description, status, partnerPortalUrl, partnershipStatus, partnerTier, salesCertifications, presalesCertifications, postsalesCertifications, requiredCertifications } = req.body || {};
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
    `UPDATE oems SET name = $1, website = $2, description = $3, status = $4, partner_portal_url = COALESCE($5, partner_portal_url), partnership_status = COALESCE($6, partnership_status), partner_tier = COALESCE($7, partner_tier), sales_certifications = COALESCE($8::jsonb, sales_certifications), presales_certifications = COALESCE($9::jsonb, presales_certifications), postsales_certifications = COALESCE($10::jsonb, postsales_certifications), required_certifications = COALESCE($11::jsonb, required_certifications), updated_at = now() WHERE id = $12`,
    [finalName, finalWebsite, finalDesc, finalStatus, partnerPortalUrl ?? null, partnershipStatus ?? null, partnerTier ?? null, salesCertifications ? JSON.stringify(salesCertifications) : null, presalesCertifications ? JSON.stringify(presalesCertifications) : null, postsalesCertifications ? JSON.stringify(postsalesCertifications) : null, requiredCertifications ? JSON.stringify(requiredCertifications) : null, req.params.id],
  );
  await audit({ req, action: 'oem.update', targetType: 'oems', targetId: req.params.id, meta: { name: finalName, status: finalStatus } });
  res.json({ ...prev, id: req.params.id, name: finalName, website: finalWebsite, description: finalDesc, status: finalStatus, partner_portal_url: partnerPortalUrl ?? prev.partner_portal_url, partnership_status: partnershipStatus ?? prev.partnership_status, partner_tier: partnerTier ?? prev.partner_tier, sales_certifications: salesCertifications ?? prev.sales_certifications, presales_certifications: presalesCertifications ?? prev.presales_certifications, postsales_certifications: postsalesCertifications ?? prev.postsales_certifications, required_certifications: requiredCertifications ?? prev.required_certifications });
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
    [Math.min(Math.max(Number(req.query.limit) || 200, 1), 200)],
  );
  res.json(rows);
});

router.get('/health', async (req, res) => {
  try {
    await query('SELECT 1');
    res.json({ ok: true, service: 'presales-api', db: 'connected', time: new Date().toISOString() });
  } catch (err) {
    console.error('health check failed:', err.message);
    res.status(503).json({ ok: false, service: 'presales-api', db: 'error' });
  }
});

export default router;
