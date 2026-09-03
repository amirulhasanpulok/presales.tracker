import { query } from './db.js';

// Append an immutable audit trail entry for a governed action.
export async function audit({ req, action, targetType = null, targetId = null, meta = null, actorEmail = null, actorId = null, actorRole = null }) {
  try {
    await query(
      `INSERT INTO audit_logs (actor_id, actor_email, action, target_type, target_id, meta, ip, actor_role, request_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        actorId ?? req?.user?.id ?? null,
        actorEmail ?? req?.user?.email ?? null,
        action,
        targetType,
        targetId,
        meta ? JSON.stringify(meta) : null,
        req?.ip || null,
        actorRole || req?.role?.roleName || req?.role?.role_name || req?.role?.name || req?.user?.role || null,
        req?.requestId || null,
      ],
    );
  } catch (err) {
    console.error('audit write failed:', err.message);
  }
}

export async function listAuditLogs(limit = 200) {
  const { rows } = await query(
    `SELECT id, actor_id, actor_email, action, target_type, target_id, meta, ip, actor_role, request_id, created_at
       FROM audit_logs
      ORDER BY created_at DESC
      LIMIT $1`,
    [limit],
  );
  return rows;
}
