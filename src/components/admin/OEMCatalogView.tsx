import React, { useMemo, useState } from 'react';
import {
  Factory,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  Save,
  AlertTriangle,
} from 'lucide-react';
import { OEMEntry } from '../../types';

interface OEMCatalogViewProps {
  oems: OEMEntry[];
  canManage: boolean;
  onCreate: (payload: { name: string; website?: string; description?: string; status?: string }) => Promise<any>;
  onUpdate: (oemId: string, payload: { name?: string; website?: string; description?: string; status?: string }) => Promise<any>;
  onDelete: (oemId: string) => Promise<any>;
}

type OEMForm = {
  name: string;
  website: string;
  description: string;
  status: 'Active' | 'Inactive';
};

const emptyForm: OEMForm = { name: '', website: '', description: '', status: 'Active' };

export const OEMCatalogView: React.FC<OEMCatalogViewProps> = ({
  oems,
  canManage,
  onCreate,
  onUpdate,
  onDelete,
}) => {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<OEMForm>(emptyForm);
  const [savedMsg, setSavedMsg] = useState('');
  const [error, setError] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return oems
      .filter(s => statusFilter === 'all' || s.status === statusFilter)
      .filter(s => !q || s.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [oems, query, statusFilter]);

  const showMsg = (msg: string) => {
    setSavedMsg(msg);
    setError('');
    window.setTimeout(() => setSavedMsg(''), 3000);
  };

  const showError = (code: string) => {
    setError(code === 'duplicate_oem' ? 'An OEM with this name already exists.' : 'Action failed. Please try again.');
    setSavedMsg('');
  };

  const resetForm = () => {
    setEditing(null);
    setForm(emptyForm);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    try {
      if (editing) {
        await onUpdate(editing, {
          name: form.name.trim(),
          website: form.website.trim() || undefined,
          description: form.description.trim() || undefined,
          status: form.status,
        });
        showMsg('OEM updated.');
      } else {
        await onCreate({
          name: form.name.trim(),
          website: form.website.trim() || undefined,
          description: form.description.trim() || undefined,
          status: form.status,
        });
        showMsg('OEM added to catalog.');
      }
      resetForm();
    } catch (err: any) {
      showError(err?.code);
    }
  };

  const startEdit = (o: OEMEntry) => {
    setEditing(o.id);
    setForm({
      name: o.name,
      website: o.website || '',
      description: o.description || '',
      status: o.status === 'Inactive' ? 'Inactive' : 'Active',
    });
    setError('');
  };

  const handleDelete = async (o: OEMEntry) => {
    if (!window.confirm(`Delete OEM "${o.name}"? Associated products will be unlinked.`)) return;
    try {
      await onDelete(o.id);
      if (editing === o.id) resetForm();
      showMsg('OEM deleted.');
    } catch {
      showError('');
    }
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div className="bg-white border border-gray-200 rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-gray-900 tracking-tight">OEM Management</h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
              PARTNERS
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Centrally managed OEM partners that supply products for BOQ line items.
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold font-mono text-gray-900">{oems.length}</div>
          <div className="text-[10px] uppercase font-semibold text-gray-500">OEM partners</div>
        </div>
      </div>

      {savedMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {savedMsg}
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-0 sm:min-w-[160px]">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search OEMs..."
                  className="enterprise-input pl-8 text-xs py-1.5 w-full"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                 className="enterprise-input text-xs py-1.5 w-full sm:w-auto"
              >
                <option value="all">All statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="divide-y divide-gray-100 max-h-[560px] overflow-y-auto">
            {filtered.length === 0 && (
              <div className="p-8 text-center text-xs text-gray-400">No OEM partners match your filters.</div>
            )}
            {filtered.map(o => (
              <div key={o.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-gray-50">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                    {o.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${o.status === 'Inactive' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{o.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${o.status === 'Inactive' ? 'bg-gray-100 text-gray-500' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                        {o.status}
                      </span>
                    </div>
                    {o.website && <div className="text-[11px] text-gray-500 truncate">{o.website}</div>}
                    {o.description && <div className="text-[11px] text-gray-400 truncate">{o.description}</div>}
                  </div>
                </div>
                {canManage && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => startEdit(o)} title="Edit" className="p-1.5 text-gray-400 hover:text-blue-600 rounded">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(o)} title="Delete" className="p-1.5 text-gray-400 hover:text-red-600 rounded">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded p-4 h-fit">
          <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
            {editing ? <Pencil className="w-4 h-4 text-blue-600" /> : <Plus className="w-4 h-4 text-emerald-600" />}
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
              {editing ? 'Edit OEM' : 'Add OEM'}
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="mt-3 space-y-3">
            <div>
              <label className="text-[10px] uppercase font-semibold text-gray-500">Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Fortinet"
                className="enterprise-input text-xs py-1.5 mt-1 w-full"
                disabled={!canManage}
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-semibold text-gray-500">Website</label>
              <input
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://..."
                className="enterprise-input text-xs py-1.5 mt-1 w-full"
                disabled={!canManage}
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-semibold text-gray-500">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                className="enterprise-input text-xs py-1.5 mt-1 w-full"
                disabled={!canManage}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-semibold text-gray-500">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="enterprise-input text-xs py-1.5 mt-1 w-full resize-none"
                disabled={!canManage}
              />
            </div>

            {canManage && (
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  {editing ? 'Save Changes' : 'Add OEM'}
                </button>
                {editing && (
                  <>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => { const o = oems.find(x => x.id === editing); if (o) handleDelete(o); }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </>
                )}
              </div>
            )}
          </form>

          {!canManage && (
            <div className="mt-3 p-2.5 bg-gray-50 border border-gray-200 rounded text-[11px] text-gray-500">
              Your role can view the catalog but not modify it.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
