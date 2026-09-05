import React, { useMemo, useState } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  Save,
  AlertTriangle,
} from 'lucide-react';
import { ProductCatalogEntry, OEMEntry } from '../../types';

interface ProductCatalogViewProps {
  products: ProductCatalogEntry[];
  oems: OEMEntry[];
  canManage: boolean;
  onCreate: (payload: any) => Promise<any>;
  onUpdate: (productId: string, payload: any) => Promise<any>;
  onDelete: (productId: string) => Promise<any>;
}

type ProductForm = {
  oemId: string;
  name: string;
  category: string;
  productLine: string;
  model: string;
  partNumber: string;
  description: string;
  unit: string;
  status: 'Active' | 'Inactive';
};

const emptyForm: ProductForm = {
  oemId: '',
  name: '',
  category: '',
  productLine: '',
  model: '',
  partNumber: '',
  description: '',
  unit: 'Units',
  status: 'Active',
};

export const ProductCatalogView: React.FC<ProductCatalogViewProps> = ({
  products,
  oems,
  canManage,
  onCreate,
  onUpdate,
  onDelete,
}) => {
  const [query, setQuery] = useState('');
  const [oemFilter, setOemFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [savedMsg, setSavedMsg] = useState('');
  const [error, setError] = useState('');

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => set.add(p.category));
    return Array.from(set).sort();
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter(p => oemFilter === 'all' || p.oem_id === oemFilter)
      .filter(p => categoryFilter === 'all' || p.category === categoryFilter)
      .filter(p => !q
        || p.name.toLowerCase().includes(q)
        || (p.model || '').toLowerCase().includes(q)
        || (p.part_number || '').toLowerCase().includes(q)
        || (p.oem_name || '').toLowerCase().includes(q))
      .sort((a, b) => ((a.oem_name || '').localeCompare(b.oem_name || '')) || a.name.localeCompare(b.name));
  }, [products, query, oemFilter, categoryFilter]);

  const showMsg = (msg: string) => {
    setSavedMsg(msg);
    setError('');
    window.setTimeout(() => setSavedMsg(''), 3000);
  };

  const showError = (code: string) => {
    setError(code === 'duplicate_product' ? 'A product with this model already exists.' : 'Action failed. Please try again.');
    setSavedMsg('');
  };

  const resetForm = () => {
    setEditing(null);
    setForm(emptyForm);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.category.trim()) return;
    try {
      if (editing) {
        await onUpdate(editing, {
          oemId: form.oemId || undefined,
          name: form.name.trim(),
          category: form.category.trim(),
          productLine: form.productLine.trim() || undefined,
          model: form.model.trim() || undefined,
          partNumber: form.partNumber.trim() || undefined,
          description: form.description.trim() || undefined,
          unit: form.unit.trim() || 'Units',
          status: form.status,
        });
        showMsg('Product updated.');
      } else {
        await onCreate({
          oemId: form.oemId || undefined,
          name: form.name.trim(),
          category: form.category.trim(),
          productLine: form.productLine.trim() || undefined,
          model: form.model.trim() || undefined,
          partNumber: form.partNumber.trim() || undefined,
          description: form.description.trim() || undefined,
          unit: form.unit.trim() || 'Units',
          status: form.status,
        });
        showMsg('Product added to catalog.');
      }
      resetForm();
    } catch (err: any) {
      showError(err?.code);
    }
  };

  const startEdit = (p: ProductCatalogEntry) => {
    setEditing(p.id);
    setForm({
      oemId: p.oem_id || '',
      name: p.name || '',
      category: p.category || '',
      productLine: p.product_line || '',
      model: p.model || '',
      partNumber: p.part_number || '',
      description: p.description || '',
      unit: p.unit || 'Units',
      status: p.status === 'Inactive' ? 'Inactive' : 'Active',
    });
    setError('');
  };

  const handleDelete = async (p: ProductCatalogEntry) => {
    if (!window.confirm(`Delete product "${p.name}"?`)) return;
    try {
      await onDelete(p.id);
      if (editing === p.id) resetForm();
      showMsg('Product deleted.');
    } catch {
      showError('');
    }
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <div className="bg-white border border-gray-200 rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-gray-900 tracking-tight">Product Catalog</h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
              CATALOG
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Searchable product catalog linked to OEMs — powers the BOQ builder.
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold font-mono text-gray-900">{products.length}</div>
          <div className="text-[10px] uppercase font-semibold text-gray-500">products</div>
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
             <div className="flex flex-nowrap sm:flex-wrap items-center gap-2 overflow-x-auto sm:overflow-visible pb-1 sm:pb-0">
               <div className="relative flex-1 min-w-0 sm:min-w-[160px]">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by product, model, part #, OEM..."
                  className="enterprise-input pl-8 text-xs py-1.5 w-full"
                />
              </div>
               <select value={oemFilter} onChange={(e) => setOemFilter(e.target.value)} className="enterprise-input text-xs py-1.5 w-full sm:w-auto">
                <option value="all">All OEMs</option>
                {oems.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
               <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="enterprise-input text-xs py-1.5 w-full sm:w-auto">
                <option value="all">All categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
             <table className="hidden md:table w-full text-left">
              <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                <tr className="text-[10px] uppercase tracking-wider text-gray-500 font-mono">
                  <th className="px-3 py-2">OEM</th>
                  <th className="px-3 py-2">Product</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Model</th>
                  <th className="px-3 py-2">Part #</th>
                  <th className="px-3 py-2">Unit</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-xs text-gray-400">No products match your filters.</td></tr>
                )}
                {filtered.map(p => (
                  <tr key={p.id} className={p.status === 'Inactive' ? 'opacity-50' : ''}>
                    <td className="px-3 py-2 text-xs font-semibold text-gray-700">{p.oem_name || '—'}</td>
                    <td className="px-3 py-2 text-xs font-bold text-gray-900">{p.name}</td>
                    <td className="px-3 py-2 text-[11px] text-gray-500">{p.category}</td>
                    <td className="px-3 py-2 text-xs font-mono text-gray-600">{p.model || '—'}</td>
                    <td className="px-3 py-2 text-xs font-mono text-gray-500">{p.part_number || '—'}</td>
                    <td className="px-3 py-2 text-[11px] text-gray-500">{p.unit || '—'}</td>
                    <td className="px-3 py-2 text-right">
                      {canManage && (
                        <div className="inline-flex items-center gap-1">
                          <button onClick={() => startEdit(p)} title="Edit" className="p-1 text-gray-400 hover:text-blue-600">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(p)} title="Delete" className="p-1 text-gray-400 hover:text-red-600">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
             </table>
             <div className="md:hidden p-2 space-y-2">
               {filtered.map(p => (
                 <article key={p.id} className={`border border-gray-200 rounded p-3 space-y-2 ${p.status === 'Inactive' ? 'opacity-60' : ''}`}>
                   <div className="flex items-start justify-between gap-2"><div className="min-w-0"><div className="text-[10px] uppercase text-gray-500 font-semibold">{p.oem_name || 'No OEM'}</div><h3 className="text-sm font-bold text-gray-900 break-words">{p.name}</h3></div><span className="text-[10px] font-mono text-gray-600">{p.status}</span></div>
                   <div className="grid grid-cols-2 gap-2 text-[11px]"><div><span className="block text-gray-500">Category</span><strong>{p.category}</strong></div><div><span className="block text-gray-500">Unit</span><strong>{p.unit || '—'}</strong></div><div><span className="block text-gray-500">Model</span><strong className="font-mono">{p.model || '—'}</strong></div><div><span className="block text-gray-500">Part #</span><strong className="font-mono">{p.part_number || '—'}</strong></div></div>
                   {canManage && <div className="flex justify-end gap-2 border-t border-gray-100 pt-2"><button onClick={() => startEdit(p)} className="inline-flex items-center gap-1 px-2 py-1 text-[11px] text-blue-700 bg-blue-50 rounded"><Pencil className="w-3 h-3" /> Edit</button><button onClick={() => handleDelete(p)} className="inline-flex items-center gap-1 px-2 py-1 text-[11px] text-red-700 bg-red-50 rounded"><Trash2 className="w-3 h-3" /> Delete</button></div>}
                 </article>
               ))}
               {filtered.length === 0 && <div className="py-8 text-center text-xs text-gray-500">No products match your filters.</div>}
             </div>
           </div>
        </div>

        <div className="bg-white border border-gray-200 rounded p-4 h-fit">
          <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
            {editing ? <Pencil className="w-4 h-4 text-blue-600" /> : <Plus className="w-4 h-4 text-emerald-600" />}
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
              {editing ? 'Edit Product' : 'Add Product'}
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="mt-3 space-y-2.5">
            <div>
              <label className="text-[10px] uppercase font-semibold text-gray-500">OEM</label>
              <select
                value={form.oemId}
                onChange={(e) => setForm({ ...form, oemId: e.target.value })}
                className="enterprise-input text-xs py-1.5 mt-1 w-full"
                disabled={!canManage}
              >
                <option value="">— Select OEM —</option>
                {oems.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-semibold text-gray-500">Product Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. FortiGate 200F"
                className="enterprise-input text-xs py-1.5 mt-1 w-full"
                disabled={!canManage}
              />
            </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] uppercase font-semibold text-gray-500">Category *</label>
                <input
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="e.g. Security"
                  className="enterprise-input text-xs py-1.5 mt-1 w-full"
                  disabled={!canManage}
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-semibold text-gray-500">Product Line</label>
                <input
                  value={form.productLine}
                  onChange={(e) => setForm({ ...form, productLine: e.target.value })}
                  placeholder="e.g. Firewall"
                  className="enterprise-input text-xs py-1.5 mt-1 w-full"
                  disabled={!canManage}
                />
              </div>
            </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] uppercase font-semibold text-gray-500">Model / Part Number</label>
                <input
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  placeholder="e.g. FGT-200F"
                  className="enterprise-input text-xs py-1.5 mt-1 w-full"
                  disabled={!canManage}
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-semibold text-gray-500">Unit</label>
                <input
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  placeholder="e.g. Units"
                  className="enterprise-input text-xs py-1.5 mt-1 w-full"
                  disabled={!canManage}
                />
              </div>
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
                rows={2}
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
                  {editing ? 'Save Changes' : 'Add Product'}
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
                      onClick={() => { const p = products.find(x => x.id === editing); if (p) handleDelete(p); }}
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
