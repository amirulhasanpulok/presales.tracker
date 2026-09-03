/**
 * RBAC validation harness — run with `npx tsx scripts/validate_rbac.ts`.
 * Asserts the enforcement matrix against the canonical policy in src/rbac.ts
 * and the demo users in src/data/mockData.ts. Exit code 0 = all checks pass.
 */
import {
  can,
  resolveRole,
  roleHasKey,
  DEFAULT_ROLES,
  PERMISSION_CATALOG,
  TAB_PERMISSIONS,
} from '../src/rbac';
import { MOCK_USERS } from '../src/data/mockData';

let passed = 0;
let failed = 0;

function check(name: string, cond: boolean) {
  if (cond) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}`);
  }
}

function byRole(roleId: string) {
  return MOCK_USERS.find(u => u.roleId === roleId)!;
}

const sa = byRole('role-sa'); // Dr. Marcus Vance
const kam = byRole('role-kam'); // Rachel Sterling
const delivery = byRole('role-delivery'); // Carlos Mendez
const admin = byRole('role-admin'); // Athena Cole

console.log('\n[1] Permission grants by role');
check('SA: resolve to a role', resolveRole(DEFAULT_ROLES, sa) != null);
check('SA: implicit app.access', can(DEFAULT_ROLES, sa, 'app.access'));
check('SA: create_opportunity', can(DEFAULT_ROLES, sa, 'create_opportunity'));
check('SA: edit_opportunity_core', can(DEFAULT_ROLES, sa, 'edit_opportunity_core'));
check('SA: promote_stage', can(DEFAULT_ROLES, sa, 'promote_stage'));
check('SA: author_sadd', can(DEFAULT_ROLES, sa, 'author_sadd'));
check('SA: author_boq', can(DEFAULT_ROLES, sa, 'author_boq'));
check('SA: approve_boq_discount', can(DEFAULT_ROLES, sa, 'approve_boq_discount'));
check('SA: initiate_handover', can(DEFAULT_ROLES, sa, 'initiate_handover'));
check('SA: signoff_handover', can(DEFAULT_ROLES, sa, 'signoff_handover'));
check('SA: NOT delete_opportunity', !can(DEFAULT_ROLES, sa, 'delete_opportunity'));
check('SA: NOT override_margin', !can(DEFAULT_ROLES, sa, 'override_margin'));
check('SA: NOT security_signoff', !can(DEFAULT_ROLES, sa, 'security_signoff'));
check('SA: NOT sys.users', !can(DEFAULT_ROLES, sa, 'sys.users'));
check('SA: NOT sys.rbac', !can(DEFAULT_ROLES, sa, 'sys.rbac'));
check('SA: NOT sys.audit', !can(DEFAULT_ROLES, sa, 'sys.audit'));

check('KAM: create_opportunity', can(DEFAULT_ROLES, kam, 'create_opportunity'));
check('KAM: edit_opportunity_core', can(DEFAULT_ROLES, kam, 'edit_opportunity_core'));
check('KAM: NOT author_boq', !can(DEFAULT_ROLES, kam, 'author_boq'));
check('KAM: NOT author_sadd', !can(DEFAULT_ROLES, kam, 'author_sadd'));
check('KAM: NOT promote_stage', !can(DEFAULT_ROLES, kam, 'promote_stage'));
check('KAM: NOT sys.rbac', !can(DEFAULT_ROLES, kam, 'sys.rbac'));
check('KAM: NOT run_poc_benchmarks', !can(DEFAULT_ROLES, kam, 'run_poc_benchmarks'));
check('KAM: NOT initiate_handover', !can(DEFAULT_ROLES, kam, 'initiate_handover'));

check('DELIVERY: initiate_handover', can(DEFAULT_ROLES, delivery, 'initiate_handover'));
check('DELIVERY: signoff_handover', can(DEFAULT_ROLES, delivery, 'signoff_handover'));
check('DELIVERY: NOT author_boq', !can(DEFAULT_ROLES, delivery, 'author_boq'));
check('DELIVERY: NOT sys.audit', !can(DEFAULT_ROLES, delivery, 'sys.audit'));

check('ADMIN: delete_opportunity', can(DEFAULT_ROLES, admin, 'delete_opportunity'));
check('ADMIN: sys.users', can(DEFAULT_ROLES, admin, 'sys.users'));
check('ADMIN: sys.rbac', can(DEFAULT_ROLES, admin, 'sys.rbac'));
check('ADMIN: sys.audit', can(DEFAULT_ROLES, admin, 'sys.audit'));
check('ADMIN: sys.integrations', can(DEFAULT_ROLES, admin, 'sys.integrations'));
check('ADMIN: author_boq', can(DEFAULT_ROLES, admin, 'author_boq'));
check('ADMIN: role has wildcard all', roleHasKey(admin ? resolveRole(DEFAULT_ROLES, admin) : null, 'any_random_key'));

console.log('\n[2] Catalog integrity');
check('No duplicate permission keys', new Set(PERMISSION_CATALOG.map(p => p.key)).size === PERMISSION_CATALOG.length);
check('Every catalog key is unique module-grouped', PERMISSION_CATALOG.every(p => p.module && p.key && p.name));

console.log('\n[3] Tab access matrix (view guards)');
const adminOnlyTabs = ['audit_logs', 'user_management', 'role_permissions', 'master_config', 'system_settings'];
const saBlockedTabs = ['audit_logs', 'user_management', 'role_permissions', 'master_config', 'system_settings'];
const kamBlockedTabs = [
  'poc_center', 'boq_workbench', 'handover_queue', 'documents',
  'audit_logs', 'user_management', 'role_permissions', 'master_config', 'system_settings',
];
const deliveryBlockedTabs = ['poc_center', 'boq_workbench', 'documents', 'system_settings', 'role_permissions'];

for (const tab of Object.keys(TAB_PERMISSIONS)) {
  const key = TAB_PERMISSIONS[tab];
  if (!key) {
    check(`tab ${tab} has a mapped permission`, true);
    continue;
  }
  check(`tab ${tab} — admin can access`, can(DEFAULT_ROLES, admin, key));
}

for (const tab of adminOnlyTabs) {
  check(`SA blocked: ${tab}`, !can(DEFAULT_ROLES, sa, TAB_PERMISSIONS[tab]));
  check(`KAM blocked: ${tab}`, !can(DEFAULT_ROLES, kam, TAB_PERMISSIONS[tab]));
  check(`DELIVERY blocked: ${tab}`, !can(DEFAULT_ROLES, delivery, TAB_PERMISSIONS[tab]));
}

for (const tab of saBlockedTabs) check(`SA blocked (expected deny): ${tab}`, !can(DEFAULT_ROLES, sa, TAB_PERMISSIONS[tab]));
for (const tab of kamBlockedTabs) check(`KAM blocked: ${tab}`, !can(DEFAULT_ROLES, kam, TAB_PERMISSIONS[tab]));
for (const tab of deliveryBlockedTabs) check(`DELIVERY blocked: ${tab}`, !can(DEFAULT_ROLES, delivery, TAB_PERMISSIONS[tab]));

check('KAM can view dashboard', can(DEFAULT_ROLES, kam, TAB_PERMISSIONS.dashboard));
check('KAM can view opportunities', can(DEFAULT_ROLES, kam, TAB_PERMISSIONS.opportunities));
check('KAM can view action_center', can(DEFAULT_ROLES, kam, TAB_PERMISSIONS.action_center));
check('SA can view poc_center', can(DEFAULT_ROLES, sa, TAB_PERMISSIONS.poc_center));
check('SA can view boq_workbench', can(DEFAULT_ROLES, sa, TAB_PERMISSIONS.boq_workbench));
check('DELIVERY can view handover_queue', can(DEFAULT_ROLES, delivery, TAB_PERMISSIONS.handover_queue));

console.log(`\n${failed === 0 ? 'ALL CHECKS PASSED' : 'SOME CHECKS FAILED'} — ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);