import { RolePermission, UserAccount } from './types';

export interface PermissionDef {
  key: string;
  name: string;
  module: string;
}

// Canonical permission catalog — single source of truth consumed by both the
// RoleManagementView editor and the runtime access-control layer.
export const PERMISSION_CATALOG: PermissionDef[] = [
  // Opportunities & Deals
  { key: 'create_opportunity', name: 'Create New Opportunity', module: 'Opportunities & Deals' },
  { key: 'edit_opportunity_core', name: 'Edit Core Deal Terms & TCV', module: 'Opportunities & Deals' },
  { key: 'promote_stage', name: 'Promote Opportunity Stage', module: 'Opportunities & Deals' },
  { key: 'delete_opportunity', name: 'Delete / Purge Opportunity', module: 'Opportunities & Deals' },
  // Technical Architecture & SADD
  { key: 'author_sadd', name: 'Author & Publish SADD Blueprints', module: 'Technical Architecture & SADD' },
  { key: 'approve_sadd', name: 'Approve Architecture Design (Lead SA)', module: 'Technical Architecture & SADD' },
  { key: 'run_poc_benchmarks', name: 'Execute POC Benchmark Matrix', module: 'Technical Architecture & SADD' },
  { key: 'security_signoff', name: 'Grant InfoSec & Compliance Waiver', module: 'Technical Architecture & SADD' },
  // BOQ Workbench & Commercial Margin
  { key: 'author_boq', name: 'Build & Modify BOQ Line Items', module: 'BOQ Workbench & Commercial Margin' },
  { key: 'override_margin', name: 'Override Floor Margins (<35%)', module: 'BOQ Workbench & Commercial Margin' },
  { key: 'approve_boq_discount', name: 'Approve Discount Packages', module: 'BOQ Workbench & Commercial Margin' },
  // Implementation & Delivery Handover
  { key: 'initiate_handover', name: 'Initiate Delivery Handover', module: 'Implementation & Delivery Handover' },
  { key: 'signoff_handover', name: 'Sign-off Delivery Readiness', module: 'Implementation & Delivery Handover' },
  // System Configuration & Governance
  { key: 'sys.users', name: 'Manage User Accounts & Roles', module: 'System Configuration & Governance' },
  { key: 'sys.rbac', name: 'Modify RBAC Policy Matrix', module: 'System Configuration & Governance' },
  { key: 'sys.audit', name: 'Access Immutable Audit Trail', module: 'System Configuration & Governance' },
  { key: 'sys.integrations', name: 'Configure CRM / ERP / Cloud Integrations', module: 'System Configuration & Governance' },
];

// Minimum permission required to open each navigation tab.
export const TAB_PERMISSIONS: Record<string, string> = {
  dashboard: 'app.access',
  opportunities: 'app.access',
  board: 'app.access',
  calendar: 'app.access',
  poc_center: 'run_poc_benchmarks',
  boq_workbench: 'author_boq',
  action_center: 'app.access',
  handover_queue: 'initiate_handover',
  team_capacity: 'app.access',
  documents: 'author_sadd',
  analytics: 'app.access',
  clients: 'app.access',
  sales_kams: 'app.access',
  notifications: 'app.access',
  audit_logs: 'sys.audit',
  user_management: 'sys.users',
  role_permissions: 'sys.rbac',
  master_config: 'sys.integrations',
  system_settings: 'sys.integrations',
};

export interface RbacRole {
  id: string;
  roleName: string;
  description: string;
  usersCount: number;
  isSystemRole: boolean;
  matchingRoles: string[];
  permissions: string[];
}

// Baseline default security roles. `permissions: ['all']` = unrestricted
// (System Administrator). Every defined role implicitly carries `app.access`
// (see can() below) so its user can log into the platform.
export const DEFAULT_ROLES: RbacRole[] = [
  {
    id: 'role-sa',
    roleName: 'Presales Lead / Principal Architect',
    description: 'Full authorization over solution designs, technical discovery, and BOQ pricing up to 20% discount.',
    usersCount: 6,
    isSystemRole: true,
    matchingRoles: ['Principal Solutions Architect', 'Presales Lead / Architect', 'presales_architect', 'presales_lead'],
    permissions: [
      'create_opportunity',
      'edit_opportunity_core',
      'promote_stage',
      'author_sadd',
      'approve_sadd',
      'run_poc_benchmarks',
      'author_boq',
      'approve_boq_discount',
      'initiate_handover',
      'signoff_handover',
    ],
  },
  {
    id: 'role-kam',
    roleName: 'Sales KAM / Account Executive',
    description: 'Commercial deal owner with CRM sync, stakeholder engagement, and contract value updates.',
    usersCount: 14,
    isSystemRole: true,
    matchingRoles: ['Sales KAM', 'sales_kam'],
    permissions: ['create_opportunity', 'edit_opportunity_core'],
  },
  {
    id: 'role-delivery',
    roleName: 'Delivery Manager',
    description: 'Owns post-sales technical implementation readiness and SOW handover sign-off.',
    usersCount: 3,
    isSystemRole: true,
    matchingRoles: ['Delivery Manager'],
    permissions: ['create_opportunity', 'initiate_handover', 'signoff_handover'],
  },
  {
    id: 'role-admin',
    roleName: 'System Administrator',
    description: 'Unrestricted enterprise administrative permissions across users, audit logs, and master configurations.',
    usersCount: 2,
    isSystemRole: true,
    matchingRoles: ['System Administrator', 'super_admin'],
    permissions: ['all'],
  },
];

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------
const ROLES_KEY = 'presales_tracker_rbac_roles_v1';
const CURRENT_USER_KEY = 'presales_tracker_rbac_current_user_v1';

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

// Determine whether a role grants a given permission key. Supports both the
// canonical flat string[] form and the legacy object-group form
// ([{ items: [{ key, granted }] }]).
export function roleHasKey(role: RolePermission | RbacRole | null | undefined, key: string): boolean {
  if (!role) return false;
  const perms = (role as unknown as { permissions?: unknown }).permissions;
  if (!Array.isArray(perms)) return false;

  if (perms.length > 0 && typeof perms[0] === 'string') {
    return (perms as string[]).includes('all') || (perms as string[]).includes(key);
  }

  const granted = perms.flatMap((grp: any) =>
    grp && Array.isArray(grp.items) ? grp.items : [],
  );
  return (
    granted.some((p: any) => p && p.key === key && p.granted) ||
    granted.some((p: any) => p && p.key === 'all' && p.granted)
  );
}

// Match a user to a role definition by explicit roleId, else by name aliases.
export function resolveRole(
  roles: (RolePermission | RbacRole)[],
  user?: UserAccount | null,
): RolePermission | RbacRole | null {
  if (!user || !roles || !roles.length) return null;

  const byId = roles.find(r => (r as unknown as { id?: string }).id === user.roleId);
  if (byId) return byId;

  return (
    roles.find(r => {
      const matches = (r as unknown as { matchingRoles?: string[] }).matchingRoles;
      if (Array.isArray(matches)) {
        return matches.some(m => user.role.includes(m) || m.includes(user.role));
      }
      return (r as unknown as { roleName?: string }).roleName === user.role;
    }) || null
  );
}

// Permission check against the active user + current role policy.
// `app.access` (the ability to use the platform at all) is granted implicitly
// to every user whose role resolves.
export function can(
  roles: (RolePermission | RbacRole)[],
  user: UserAccount | null | undefined,
  key: string,
): boolean {
  if (!user) return false;
  const role = resolveRole(roles, user);
  if (!role) return false;
  if (key === 'app.access') return true;
  return roleHasKey(role, key);
}

export function canAny(
  roles: (RolePermission | RbacRole)[],
  user: UserAccount | null | undefined,
  keys: string[],
): boolean {
  return keys.some(k => can(roles, user, k));
}

export function canAll(
  roles: (RolePermission | RbacRole)[],
  user: UserAccount | null | undefined,
  keys: string[],
): boolean {
  return keys.every(k => can(roles, user, k));
}

// ---------------------------------------------------------------------------
// Persistence (guarded so the module can also run in non-DOM contexts)
// ---------------------------------------------------------------------------

export function loadRoles(): (RolePermission | RbacRole)[] {
  if (typeof localStorage === 'undefined') return DEFAULT_ROLES;
  try {
    const raw = localStorage.getItem(ROLES_KEY);
    if (raw) return JSON.parse(raw) as (RolePermission | RbacRole)[];
  } catch {
    /* ignore corrupt storage */
  }
  return DEFAULT_ROLES;
}

export function saveRoles(roles: (RolePermission | RbacRole)[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(ROLES_KEY, JSON.stringify(roles));
  } catch {
    /* storage full / unavailable */
  }
}

export function loadCurrentUser(users: UserAccount[]): UserAccount {
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(CURRENT_USER_KEY);
      if (raw) {
        const parsed = { id: '' } as { id?: string };
        Object.assign(parsed, JSON.parse(raw));
        const found = users.find(u => u.id === parsed.id);
        if (found) return found;
      }
    } catch {
      /* ignore corrupt storage */
    }
  }
  return users[0];
}

export function saveCurrentUser(user: UserAccount): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({ id: user.id }));
  } catch {
    /* ignore */
  }
}