import React, { useState } from 'react';
import { UserAccount, RolePermission } from '../../types';
import { 
  Users, 
  Search, 
  Plus, 
  ShieldCheck, 
  Mail, 
  CheckCircle2, 
  XCircle,
  Clock,
  KeyRound,
  X,
  Edit2
} from 'lucide-react';

interface UserManagementViewProps {
  users: UserAccount[];
  onCreateUser?: (payload: {
    name: string;
    email: string;
    role: string;
    department?: string;
    region?: string;
  }) => Promise<any>;
  onUpdateUser?: (user: UserAccount) => Promise<any>;
  roles?: RolePermission[];
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  users: initialUsers,
  onCreateUser,
  onUpdateUser,
  roles = [],
}) => {
  const roleOptions = roles.map(role => ({ value: role.roleName || role.name || '', label: role.name || role.roleName || '' })).filter(role => role.value);
  const [users, setUsers] = useState<UserAccount[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // New user form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserAccount['role']>(roleOptions[0]?.value || 'presales_architect');
  const [newDepartment, setNewDepartment] = useState('Solutions Engineering');
  const [newRegion, setNewRegion] = useState('US East');
  const resetInviteForm = () => {
    setNewName(''); setNewEmail(''); setNewRole(roleOptions[0]?.value || 'presales_architect');
    setNewDepartment('Solutions Engineering'); setNewRegion('');
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;
    setNotice(null);

    const created: UserAccount = {
      id: `user-${Date.now()}`,
      name: newName,
      email: newEmail,
      role: newRole,
      department: newDepartment,
      region: newRegion,
      status: 'Active',
      mfaEnabled: false,
      createdAt: new Date().toISOString().split('T')[0],
      lastLoginAt: 'Just now'
    };

    let serverUser: UserAccount = created;
    if (onCreateUser) {
      try {
        const resp = await onCreateUser({
          name: newName,
          email: newEmail,
          role: newRole,
          department: newDepartment,
          region: newRegion,
        });
        if (resp?.tempPassword) {
          setNotice(`Invite created for ${newEmail}. Temporary password: ${resp.tempPassword}`);
        }
        if (resp?.id) serverUser = { ...created, ...resp, status: resp.status || created.status, mfaEnabled: resp.mfaEnabled ?? created.mfaEnabled };
      } catch (err: any) {
        setNotice(err?.message || 'Could not create the user on the server.');
        return;
      }
    }

    setUsers([serverUser, ...users.filter(user => user.id !== serverUser.id)]);
    setShowInviteModal(false);
    resetInviteForm();
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      await onUpdateUser?.(editingUser);
      setUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
    } catch {
      window.alert('Could not save user changes. Please try again.');
      return;
    }
    setEditingUser(null);
  };

  const filteredUsers = users.filter(u => {
    const q = (searchTerm || '').toLowerCase();
    const matchesSearch = (u.name || '').toLowerCase().includes(q) ||
                          (u.email || '').toLowerCase().includes(q) ||
                          (u.department || '').toLowerCase().includes(q);
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white border border-gray-200 rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-gray-900 tracking-tight">Presales Solutions Engineering User Management</h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
              {users.length} Active System Users
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage Solutions Architects, Sales Account Executives, Presales Managers, and Delivery Engineers.
          </p>
        </div>

        <button
           onClick={() => { resetInviteForm(); setShowInviteModal(true); }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Invite Presales Member
        </button>
      </div>

      {notice && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded text-xs flex items-center gap-2">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="ml-auto text-blue-400 hover:text-blue-700">✕</button>
        </div>
      )}

      {/* Filter Bar */}
       <div className="mobile-filter-scroll bg-white border border-gray-200 rounded p-3 flex flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, department..."
              className="enterprise-input w-full pl-8 text-xs py-1.5"
            />
          </div>
        </div>

        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="enterprise-select text-xs py-1.5"
        >
          <option value="all">All Roles</option>
                     {roleOptions.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-gray-200 rounded overflow-x-auto">
         <table className="hidden md:table w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 border-b border-gray-200 text-[11px] font-semibold uppercase tracking-wider">
              <th className="py-2.5 px-3">User</th>
              <th className="py-2.5 px-3">Role</th>
              <th className="py-2.5 px-3">Department & Region</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">MFA</th>
              <th className="py-2.5 px-3">Last Active</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-gray-800">
            {filteredUsers.map(user => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                      {user.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{user.name}</div>
                      <div className="text-[11px] text-gray-500 font-mono">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  <span className="inline-flex items-center text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-800 font-mono border border-gray-200 font-semibold">
                    {user.role.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="py-2.5 px-3">
                  <div className="font-medium text-gray-900">{user.department}</div>
                  <div className="text-[10px] text-gray-500 font-mono">{user.region}</div>
                </td>
                <td className="py-2.5 px-3">
                  <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded font-mono font-semibold ${
                     user.status?.toLowerCase() === 'active' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-gray-100 text-gray-600'
                  }`}>
                     {user.status?.toLowerCase() === 'active' ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3" />}
                    {user.status.toUpperCase()}
                  </span>
                </td>
                <td className="py-2.5 px-3 font-mono">
                  {user.mfaEnabled ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <KeyRound className="w-3 h-3 text-emerald-600" /> Enabled
                    </span>
                  ) : (
                    <span className="text-red-600">Disabled</span>
                  )}
                </td>
                <td className="py-2.5 px-3 font-mono text-gray-500 text-[11px]">
                  {user.lastLoginAt}
                </td>
                <td className="py-2.5 px-3 text-right">
                  <button 
                    onClick={() => setEditingUser(user)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 px-2 py-1 rounded border border-blue-200"
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit Access
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
         </table>
         <div className="md:hidden p-2 space-y-2">
           {filteredUsers.map(user => <article key={user.id} className="border border-gray-200 rounded p-3 bg-white space-y-2">
             <div className="flex items-start justify-between gap-2"><div className="min-w-0"><div className="font-bold text-sm text-gray-900 break-words">{user.name}</div><div className="text-[11px] text-gray-500 font-mono break-all">{user.email}</div></div><span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${user.status?.toLowerCase() === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{user.status}</span></div>
             <div className="grid grid-cols-2 gap-2 text-[11px]"><div><span className="block text-gray-500">Role</span><strong>{user.role.replace(/_/g, ' ')}</strong></div><div><span className="block text-gray-500">MFA</span><strong className={user.mfaEnabled ? 'text-emerald-700' : 'text-red-600'}>{user.mfaEnabled ? 'Enabled' : 'Disabled'}</strong></div><div><span className="block text-gray-500">Department</span><strong>{user.department || '—'}</strong></div><div><span className="block text-gray-500">Last Active</span><strong className="font-mono">{user.lastLoginAt || '—'}</strong></div></div>
             <button onClick={() => setEditingUser(user)} className="w-full inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded"><Edit2 className="w-3 h-3" /> Edit Access</button>
           </article>)}
           {filteredUsers.length === 0 && <div className="py-8 text-center text-xs text-gray-500">No users match your filters.</div>}
         </div>
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-lg overflow-hidden animate-in fade-in duration-150">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-gray-900">Invite Presales Team Member</h3>
              </div>
              <button
                 onClick={() => { setShowInviteModal(false); resetInviteForm(); }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInvite} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Alexander Wright"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Work Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="alexander.wright@enterprise.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">System Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserAccount['role'])}
                    className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5"
                  >
                   {roleOptions.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Region</label>
                  <input
                    type="text"
                    value={newRegion}
                    onChange={(e) => setNewRegion(e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Department</label>
                <input
                  type="text"
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5"
                />
              </div>

              <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                   onClick={() => { setShowInviteModal(false); resetInviteForm(); }}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded border border-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs"
                >
                  Send Invitation & Provision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Access Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-md overflow-hidden animate-in fade-in duration-150">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-gray-900">Edit User Access & Permissions</h3>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">User Name</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Assigned Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                  className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5"
                >
                  {!['presales_architect', 'sales_kam', 'presales_lead', 'super_admin'].includes(editingUser.role) && <option value={editingUser.role}>{editingUser.role.replace(/_/g, ' ')}</option>}
                  <option value="presales_architect">Solutions Architect</option>
                  <option value="sales_kam">Sales KAM</option>
                  <option value="presales_lead">Presales Lead</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Account Status</label>
                  <select
                    value={editingUser.status}
                    onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as any })}
                    className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive / Suspended</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">MFA Enforcement</label>
                  <select
                    value={editingUser.mfaEnabled ? 'true' : 'false'}
                    onChange={(e) => setEditingUser({ ...editingUser, mfaEnabled: e.target.value === 'true' })}
                    className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5"
                  >
                    <option value="true">Enforced (Active)</option>
                    <option value="false">Disabled</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded border border-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs"
                >
                  Save Access Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
