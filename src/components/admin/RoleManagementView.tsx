import React, { useState } from 'react';
import { RolePermission } from '../../types';
import { PERMISSION_CATALOG, roleHasKey } from '../../rbac';
import { 
  ShieldCheck, 
  X, 
  Plus, 
  Users,
  CheckCircle2,
  Lock
} from 'lucide-react';

interface RoleManagementViewProps {
  roles: RolePermission[];
  onRolesChange?: (roles: RolePermission[]) => void;
}

export const RoleManagementView: React.FC<RoleManagementViewProps> = ({
  roles,
  onRolesChange,
}) => {
  const [selectedRole, setSelectedRole] = useState<RolePermission>(() =>
    roles[0] || ({ id: 'role-empty', permissions: [] } as RolePermission),
  );
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // New role form state
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');

  const roleName = (r: RolePermission) => (r.roleName ?? r.name) || '(unnamed role)';

  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    const newRole: RolePermission = {
      id: `role-${Date.now()}`,
      roleName: newRoleName,
      name: newRoleName,
      description: newRoleDesc || 'Custom Presales Role',
      isSystemRole: false,
      usersCount: 0,
      permissions: ['create_opportunity']
    };

    const updated = [...roles, newRole];
    onRolesChange?.(updated);
    setSelectedRole(newRole);
    setShowCreateModal(false);
    setNewRoleName('');
    setNewRoleDesc('');
  };

  const handleSavePermissions = () => {
    onRolesChange?.(roles);
    setSaveSuccessMsg(`Security permissions policy for "${roleName(selectedRole)}" successfully updated & enforced.`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const permissionModules = (() => {
    const grouped = new Map<string, typeof PERMISSION_CATALOG>();
    for (const p of PERMISSION_CATALOG) {
      if (!grouped.has(p.module)) grouped.set(p.module, []);
      grouped.get(p.module)!.push(p);
    }
    return Array.from(grouped.entries()).map(([module, perms]) => ({ module, permissions: perms }));
  })();

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white border border-gray-200 rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-gray-900 tracking-tight">Role-Based Access Control (RBAC) & Permissions Matrix</h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-semibold border border-purple-200">
              {roles.length} System Security Roles
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure granular functional permissions, approval limits, and architectural governance gates across presales personas.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Create Custom Role
        </button>
      </div>

      {saveSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Main Split: Role Selector & Permissions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left 1 Col: Roles List */}
        <div className="bg-white border border-gray-200 rounded p-3 space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">Available Roles</div>
          {roles.map(r => {
            const isSelected = selectedRole.id === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setSelectedRole(r)}
                className={`w-full text-left p-2.5 rounded transition-all border ${
                  isSelected ? 'bg-blue-50 text-blue-900 border-blue-200 shadow-2xs font-semibold' : 'bg-gray-50/60 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{roleName(r)}</span>
                  {r.isSystemRole && (
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-gray-200 text-gray-700">
                      System
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5 truncate">{r.description}</div>
                <div className="text-[10px] font-mono text-gray-400 mt-1 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {r.usersCount} Active Users
                </div>
              </button>
            );
          })}
        </div>

        {/* Right 3 Cols: Permissions Matrix */}
        <div className="lg:col-span-3 bg-white border border-gray-200 rounded p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-900">{roleName(selectedRole)}</h3>
                <span className="text-xs font-mono text-gray-500">({selectedRole.id})</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{selectedRole.description}</p>
            </div>

            <button
              onClick={handleSavePermissions}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs"
            >
              Save Permission Changes
            </button>
          </div>

          <div className="space-y-4">
            {permissionModules.map(mod => (
              <div key={mod.module} className="border border-gray-200 rounded overflow-hidden">
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-800">{mod.module}</h4>
                </div>

                <div className="divide-y divide-gray-100">
                  {mod.permissions.map(perm => {
                    const isGranted = roleHasKey(selectedRole, perm.key);
                    const isUnrestricted = roleHasKey(selectedRole, 'all');
                    return (
                      <div key={perm.key} className="p-2.5 flex items-center justify-between hover:bg-gray-50 text-xs">
                        <div>
                          <span className="font-semibold text-gray-900">{perm.name}</span>
                          <span className="font-mono text-[10px] text-gray-400 ml-2">({perm.key})</span>
                        </div>

                        <label className="inline-flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isGranted}
                            disabled={isUnrestricted}
                            onChange={() => {
                              if (isUnrestricted) return;
                              const currentList = Array.isArray(selectedRole.permissions)
                                ? selectedRole.permissions.filter(p => typeof p === 'string') as string[]
                                : [];
                              const updatedPerms = isGranted
                                ? currentList.filter(p => p !== perm.key)
                                : [...currentList, perm.key];
                              const updatedRole = { ...selectedRole, permissions: updatedPerms };
                              setSelectedRole(updatedRole);
                              onRolesChange?.(roles.map(r => r.id === selectedRole.id ? updatedRole : r));
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className={`text-[11px] font-mono font-bold ${isGranted ? 'text-emerald-700' : 'text-gray-400'}`}>
                            {isGranted ? 'GRANTED' : 'DENIED'}
                          </span>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Role Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-md overflow-hidden animate-in fade-in duration-150">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-gray-900">Create Custom Security Role</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Role Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Regional Cloud Security Lead"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description & Scope</label>
                <textarea
                  rows={2}
                  placeholder="Defines specific governance authority..."
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5"
                />
              </div>

              <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded border border-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs"
                >
                  Create & Configure Permissions
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
