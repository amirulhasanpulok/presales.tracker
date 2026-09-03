// Server-side RBAC mirror of src/rbac.ts. Roles are loaded from the database
// (roles.permissions is a flat string[] or ['all']). Permission checks here are
// the authoritative enforcement layer — the browser UI is just a convenience.

export function roleHasKey(role, key) {
  if (!role) return false;
  const perms = role.permissions;
  if (!Array.isArray(perms)) return false;
  if (perms.length > 0 && typeof perms[0] === 'string') {
    return perms.includes('all') || perms.includes(key);
  }
  const granted = perms.flatMap((grp) =>
    grp && Array.isArray(grp.items) ? grp.items : [],
  );
  return (
    granted.some((p) => p && p.key === key && p.granted) ||
    granted.some((p) => p && p.key === 'all' && p.granted)
  );
}

export function can(role, user, key) {
  if (!role || !user) return false;
  if (key === 'app.access') return true;
  return roleHasKey(role, key);
}

// Express middleware: requires the request to carry an authenticated user whose
// role grants `permission`.
export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user || !req.role) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    if (!can(req.role, req.user, permission)) {
      return res.status(403).json({
        error: 'forbidden',
        required: permission,
      });
    }
    next();
  };
}

// Any one of several edit permissions grants write access to an opportunity
// document. Destructive (create/delete/stage) operations are gated separately.
export function requireAnyEditPermission() {
  return (req, res, next) => {
    if (!req.user || !req.role) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    const edit = ['edit_opportunity_core', 'author_boq', 'run_poc_benchmarks', 'promote_stage', 'initiate_handover', 'signoff_handover'];
    if (edit.some((k) => can(req.role, req.user, k))) return next();
    return res.status(403).json({ error: 'forbidden', required: 'edit_opportunity_core' });
  };
}