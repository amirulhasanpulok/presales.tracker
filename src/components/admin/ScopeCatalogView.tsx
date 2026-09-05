import React, { useMemo, useState } from 'react';
import {
  Layers,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  Save,
  AlertTriangle,
} from 'lucide-react';
import { ScopeCatalogEntry, SCOPE_CATEGORIES } from '../../types';

interface ScopeCatalogViewProps {
  scopes: ScopeCatalogEntry[];
  canManage: boolean;
  onCreate: (payload: { name: string; category: string; description?: string; status?: string; sortOrder?: number }) => Promise<any>;
  onUpdate: (scopeId: string, payload: { name?: string; category?: string; description?: string; status?: string; sortOrder?: number }) => Promise<any>;
  onDelete: (scopeId: string) => Promise<any>;
}

type ScopeForm = {
  name: string;
  category: string;
  description: string;
  status: 'Active' | 'Inactive';
};

const emptyForm: ScopeForm = { name: '', category: SCOPE_CATEGORIES[0], description: '', status: 'Active' };

export const ScopeCatalogView: React.FC<ScopeCatalogViewProps> = ({
  scopes,
  canManage,
  onCreate,
  onUpdate,
  onDelete,
}) => {
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<ScopeForm>(emptyForm);
  const [savedMsg, setSavedMsg] = useState('');
  const [error, setError] = useState('');

  const categories = useMemo(() => {
    const set = new Set<string>(SCOPE_CATEGORIES as unknown as string[]);
    scopes.forEach(s => set.add(s.category));
    return Array.from(set).sort();
  }, [scopes]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scopes
      .filter(s =>
        (categoryFilter === 'all' || s.category === categoryFilter) &&
        (statusFilter === 'all' || s.status === statusFilter)
      )
      .filter(s => !q || s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q))
      .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  }, [scopes, query, categoryFilter, statusFilter]);

  const showMsg = (msg: string) => {
    setSavedMsg(msg);
    setError('');
    window.setTimeout(() => setSavedMsg(''), 3000);
  };

  const showError = (code: string) => {
    setError(code === 'duplicate_scope' ? 'A scope with this name already exists.' : 'Action failed. Please try again.');
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
          category: form.category,
          description: form.description.trim() || undefined,
          status: form.status,
        });
        showMsg('Scope updated.');
      } else {
        await onCreate({
          name: form.name.trim(),
          category: form.category,
          description: form.description.trim() || undefined,
          status: form.status,
        });
        showMsg('Scope added to catalog.');
      }
      resetForm();
    } catch (err: any) {
      showError(err?.code);
    }
  };

  const startEdit = (s: ScopeCatalogEntry) => {
    setEditing(s.id);
    setForm({
      name: s.name,
      category: s.category,
      description: s.description || '',
      status: s.status === 'Inactive' ? 'Inactive' : 'Active',
    });
    setError('');
  };

  const handleDelete = async (s: ScopeCatalogEntry) => {
    if (!window.confirm(`Delete scope "${s.name}"? This cannot be undone.`)) return;
    try {
      await onDelete(s.id);
      if (editing === s.id) resetForm();
      showMsg('Scope deleted.');
    } catch {
      showError('');
    }
  };

  const grouped = useMemo(() => {
    const map: Record<string, ScopeCatalogEntry[]> = {};
    filtered.forEach(s => {
      (map[s.category] = map[s.category] || []).push(s);
    });
    return map;
  }, [filtered]);

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div className="bg-white border border-gray-200 rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-gray-900 tracking-tight">Scope / Solution Catalog</h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
              MASTER TAXONOMY
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Centrally managed multi-select solution scopes used to tag opportunities.
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold font-mono text-gray-900">{scopes.length}</div>
          <div className="text-[10px] uppercase font-semibold text-gray-500">scopes in catalog</div>
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
        {/* Catalog list */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 space-y-2.5">
             <div className="flex flex-nowrap sm:flex-wrap items-center gap-2 overflow-x-auto sm:overflow-visible pb-1 sm:pb-0">
              <div className="relative flex-1 min-w-0 sm:min-w-[160px]">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search scopes..."
                  className="enterprise-input pl-8 text-xs py-1.5 w-full"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                 className="enterprise-input text-xs py-1.5 w-full sm:w-auto"
              >
                <option value="all">All categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
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
            {Object.keys(grouped).length === 0 && (
              <div className="p-8 text-center text-xs text-gray-400">No scopes match your filters.</div>
            )}
            {(Object.entries(grouped) as [string, ScopeCatalogEntry[]][]).map(([category, items]) => (
              <div key={category} className="px-4 py-3">
                <div className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold mb-2">
                  {category} <span className="text-gray-300">· {items.length}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {items.map(s => (
                    <span
                      key={s.id}
                      className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded border font-medium ${
                        s.status === 'Inactive'
                          ? 'bg-gray-50 text-gray-400 border-gray-200 line-through'
                          : 'bg-gray-50 text-gray-800 border-gray-200'
                      }`}
                    >
                      {s.name}
                      {canManage && (
                        <button onClick={() => startEdit(s)} title="Edit" className="text-gray-400 hover:text-blue-600">
                          <Pencil className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add / Edit form */}
        <div className="bg-white border border-gray-200 rounded p-4 h-fit">
          <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
            {editing ? <Pencil className="w-4 h-4 text-blue-600" /> : <Plus className="w-4 h-4 text-emerald-600" />}
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
              {editing ? 'Edit Scope' : 'Add Scope'}
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="mt-3 space-y-3">
            <div>
              <label className="text-[10px] uppercase font-semibold text-gray-500">Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Firewall"
                className="enterprise-input text-xs py-1.5 mt-1 w-full"
                disabled={!canManage}
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-semibold text-gray-500">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="enterprise-input text-xs py-1.5 mt-1 w-full"
                disabled={!canManage}
              >
                {SCOPE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                {!SCOPE_CATEGORIES.includes(form.category as any) && (
                  <option value={form.category}>{form.category}</option>
                )}
              </select>
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
              <label className="text-[10px] uppercase font-semibold text-gray-500">Description (optional)</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What this scope covers..."
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
                  {editing ? 'Save Changes' : 'Add Scope'}
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
                      onClick={() => {
                        const s = scopes.find(x => x.id === editing);
                        if (s) handleDelete(s);
                      }}
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
