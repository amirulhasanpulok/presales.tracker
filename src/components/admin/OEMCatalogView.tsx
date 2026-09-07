import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Award, Boxes, CheckCircle2, ExternalLink, Factory, Globe2, Pencil, Plus, Search, ShieldCheck, Trash2, X } from 'lucide-react';
import { OEMEntry, ProductCatalogEntry } from '../../types';

interface Props {
  oems: OEMEntry[];
  canManage: boolean;
  products?: ProductCatalogEntry[];
  onCreate: (payload: any) => Promise<any>;
  onUpdate: (id: string, payload: any) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
}

type Tab = 'overview' | 'certifications' | 'products';
type Form = { name: string; website: string; description: string; status: 'Active' | 'Inactive'; partnerPortalUrl: string; partnershipStatus: string; partnerTier: string; salesCertifications: string; presalesCertifications: string; postsalesCertifications: string; requiredCertifications: string };
const blank: Form = { name: '', website: '', description: '', status: 'Active', partnerPortalUrl: '', partnershipStatus: '', partnerTier: '', salesCertifications: '', presalesCertifications: '', postsalesCertifications: '', requiredCertifications: '' };
const list = (value: string) => value.split(',').map(item => item.trim()).filter(Boolean);

export const OEMCatalogView: React.FC<Props> = ({ oems, canManage, products = [], onCreate, onUpdate, onDelete }) => {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [tier, setTier] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [productQuery, setProductQuery] = useState('');
  const [editing, setEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(blank);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const tiers = useMemo(() => [...new Set(oems.map(oem => oem.partner_tier).filter(Boolean))].sort(), [oems]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return oems.filter(oem => (status === 'all' || oem.status === status) && (tier === 'all' || oem.partner_tier === tier) && (!needle || `${oem.name} ${oem.description || ''} ${oem.partner_tier || ''}`.toLowerCase().includes(needle))).sort((a, b) => a.name.localeCompare(b.name));
  }, [oems, query, status, tier]);
  const selected = oems.find(oem => oem.id === selectedId) || filtered[0] || oems[0];
  const selectedProducts = products.filter(product => product.oem_id === selected?.id && (!productQuery || `${product.name} ${product.model || ''} ${product.part_number || ''}`.toLowerCase().includes(productQuery.toLowerCase())));
  const active = oems.filter(oem => oem.status === 'Active').length;
  const linkedProducts = products.filter(product => product.oem_id).length;
  const withPortal = oems.filter(oem => oem.partner_portal_url).length;
  const withCertifications = oems.filter(oem => (oem.required_certifications || []).length).length;

  useEffect(() => { if (!selectedId && selected) setSelectedId(selected.id); }, [selectedId, selected]);

  const beginEdit = (oem?: OEMEntry) => {
    const source = oem || selected;
    setEditingId(source?.id || null);
    setForm(source ? { name: source.name, website: source.website || '', description: source.description || '', status: source.status === 'Inactive' ? 'Inactive' : 'Active', partnerPortalUrl: source.partner_portal_url || '', partnershipStatus: source.partnership_status || '', partnerTier: source.partner_tier || '', salesCertifications: (source.sales_certifications || []).join(', '), presalesCertifications: (source.presales_certifications || []).join(', '), postsalesCertifications: (source.postsales_certifications || []).join(', '), requiredCertifications: (source.required_certifications || []).join(', ') } : blank);
    setEditing(true); setError('');
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return setError('OEM name is required.');
    const payload = { name: form.name.trim(), website: form.website.trim() || undefined, description: form.description.trim() || undefined, status: form.status, partnerPortalUrl: form.partnerPortalUrl.trim() || undefined, partnershipStatus: form.partnershipStatus.trim() || undefined, partnerTier: form.partnerTier.trim() || undefined, salesCertifications: list(form.salesCertifications), presalesCertifications: list(form.presalesCertifications), postsalesCertifications: list(form.postsalesCertifications), requiredCertifications: list(form.requiredCertifications) };
    try { const result = editingId ? await onUpdate(editingId, payload) : await onCreate(payload); setSelectedId(result?.id || editingId || selectedId); setEditing(false); setEditingId(null); setNotice('OEM profile saved.'); window.setTimeout(() => setNotice(''), 2500); } catch (err: any) { setError(err?.message || 'Could not save OEM profile.'); }
  };

  const remove = async () => {
    if (!selected || !window.confirm(`Delete ${selected.name}? Related products will be unlinked.`)) return;
    await onDelete(selected.id); setSelectedId(null); setNotice('OEM removed.');
  };

  return <div className="space-y-4 max-w-7xl mx-auto">
    <section className="rounded-xl overflow-hidden bg-slate-950 text-white border border-slate-800 shadow-lg">
      <div className="p-5 sm:p-7 flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div><div className="text-[10px] tracking-[0.2em] uppercase text-blue-300 font-mono">Partner Operations / Master Data</div><h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-2">OEM Management Center</h1><p className="text-sm text-slate-300 mt-2 max-w-2xl">Manage partner health, certification readiness, portals, and product coverage from one operational workspace.</p></div>
        {canManage && <button onClick={() => { setForm(blank); setEditingId(null); setEditing(true); }} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-400 rounded-lg text-sm font-semibold"><Plus className="w-4 h-4" />Onboard OEM</button>}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-white/10 bg-white/5">
        {[['Active Partners', active, 'of ' + oems.length + ' registered'], ['Product Coverage', linkedProducts, 'catalog links'], ['Portal Coverage', withPortal, 'partner portals'], ['Certification Profiles', withCertifications, 'requirements tracked']].map(([label, value, detail]) => <div key={String(label)} className="p-4 border-r border-white/10 last:border-r-0"><div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{label}</div><div className="text-2xl font-bold font-mono mt-1">{value}</div><div className="text-[10px] text-slate-400 mt-1">{detail}</div></div>)}
      </div>
    </section>

    {notice && <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />{notice}</div>}
    {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{error}</div>}

    <div className="grid grid-cols-1 xl:grid-cols-[340px_minmax(0,1fr)] gap-4">
      <aside className="bg-white border border-gray-200 rounded-xl overflow-hidden h-fit">
        <div className="p-3 border-b border-gray-200 space-y-2"><div className="text-xs font-bold text-gray-900">Partner Directory</div><div className="relative"><Search className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-400" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search partners..." className="enterprise-input w-full pl-8 text-xs" /></div><div className="grid grid-cols-2 gap-2"><select value={status} onChange={event => setStatus(event.target.value)} className="enterprise-select text-xs"><option value="all">All status</option><option value="Active">Active</option><option value="Inactive">Inactive</option></select><select value={tier} onChange={event => setTier(event.target.value)} className="enterprise-select text-xs"><option value="all">All tiers</option>{tiers.map(value => <option key={value} value={value}>{value}</option>)}</select></div></div>
        <div className="max-h-[640px] overflow-y-auto divide-y divide-gray-100">{filtered.map(oem => <button key={oem.id} onClick={() => { setSelectedId(oem.id); setTab('overview'); }} className={`w-full text-left p-3 hover:bg-blue-50 ${selected?.id === oem.id ? 'bg-blue-50 border-l-2 border-blue-600' : ''}`}><div className="flex items-start gap-3"><div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">{oem.name.slice(0, 2).toUpperCase()}</div><div className="min-w-0"><div className="flex items-center gap-1.5"><strong className="text-xs text-gray-900 truncate">{oem.name}</strong><span className="text-[9px] px-1 rounded bg-emerald-50 text-emerald-700">{oem.status}</span></div><div className="text-[10px] text-gray-500 mt-1 truncate">{oem.partner_tier || 'Tier not set'} · {oem.partnership_status || 'Status not set'}</div><div className="text-[10px] text-blue-700 mt-1">{products.filter(product => product.oem_id === oem.id).length} products</div></div></div></button>)}{!filtered.length && <div className="p-8 text-center text-xs text-gray-500">No partners match the filters.</div>}</div>
      </aside>

      <main className="bg-white border border-gray-200 rounded-xl overflow-hidden min-h-[620px]">
        {selected ? <><div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-start justify-between gap-4"><div className="flex items-start gap-3"><div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">{selected.name.slice(0, 2).toUpperCase()}</div><div><div className="text-[10px] uppercase tracking-wider text-gray-500 font-mono">OEM profile</div><h2 className="text-xl font-bold text-gray-900">{selected.name}</h2><div className="text-xs text-gray-500 mt-1">{selected.website || 'Website not configured'} · {selected.partner_tier || 'Tier not set'}</div></div></div><div className="flex gap-2">{canManage && <button onClick={() => beginEdit(selected)} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 rounded-lg"><Pencil className="w-3.5 h-3.5" />Edit Profile</button>}<button onClick={() => selected.website && window.open(selected.website, '_blank', 'noopener,noreferrer')} disabled={!selected.website} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-gray-100 rounded-lg disabled:opacity-40"><ExternalLink className="w-3.5 h-3.5" />Website</button></div></div><div className="flex gap-1 px-5 border-b border-gray-200"><button onClick={() => setTab('overview')} className={`px-3 py-3 text-xs font-semibold border-b-2 ${tab === 'overview' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500'}`}>Overview</button><button onClick={() => setTab('partner')} className={`px-3 py-3 text-xs font-semibold border-b-2 ${tab === 'partner' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500'}`}>Partner & Certifications</button><button onClick={() => setTab('products')} className={`px-3 py-3 text-xs font-semibold border-b-2 ${tab === 'products' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500'}`}>Product Portfolio ({products.filter(product => product.oem_id === selected.id).length})</button></div><div className="p-5">{tab === 'overview' && <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="rounded-lg border border-gray-200 p-4"><div className="text-[10px] uppercase tracking-wider text-gray-500">Relationship</div><div className="grid grid-cols-2 gap-3 mt-3 text-sm"><div><span className="block text-xs text-gray-500">Status</span><strong>{selected.status}</strong></div><div><span className="block text-xs text-gray-500">Tier</span><strong>{selected.partner_tier || 'Not set'}</strong></div><div><span className="block text-xs text-gray-500">Partnership</span><strong>{selected.partnership_status || 'Not set'}</strong></div><div><span className="block text-xs text-gray-500">Products</span><strong>{products.filter(product => product.oem_id === selected.id).length}</strong></div></div></div><div className="rounded-lg border border-gray-200 p-4"><div className="text-[10px] uppercase tracking-wider text-gray-500">Access & Description</div><a className="block text-sm text-blue-700 break-all mt-3" href={selected.partner_portal_url || undefined}>{selected.partner_portal_url || 'Partner portal not configured'}</a><p className="text-sm text-gray-600 mt-3">{selected.description || 'No profile description has been added.'}</p></div></div>}{tab === 'partner' && <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[['Sales', selected.sales_certifications], ['Presales', selected.presales_certifications], ['Postsales', selected.postsales_certifications], ['Required', selected.required_certifications]].map(([label, values]) => <div key={String(label)} className="rounded-lg border border-gray-200 p-4"><div className="text-[10px] uppercase tracking-wider text-gray-500">{label} certifications</div><div className="flex flex-wrap gap-1.5 mt-3">{(values as string[] || []).map(value => <span key={value} className="px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs">{value}</span>)}{!(values as string[] || []).length && <span className="text-xs text-gray-400">Not configured</span>}</div></div>)}</div>}{tab === 'products' && <div><div className="flex items-center gap-2 mb-4"><Boxes className="w-4 h-4 text-blue-600" /><input value={productQuery} onChange={event => setProductQuery(event.target.value)} placeholder="Search this OEM's products..." className="enterprise-input flex-1 text-xs" /></div><div className="grid grid-cols-1 md:grid-cols-2 gap-3">{selectedProducts.map(product => <div key={product.id} className="rounded-lg border border-gray-200 p-3"><div className="text-xs font-bold text-gray-900">{product.name}</div><div className="text-[11px] font-mono text-blue-700 mt-1">{product.model || product.part_number || 'Model not set'}</div><div className="text-xs text-gray-500 mt-2">{product.category} · {product.status}</div></div>)}{!selectedProducts.length && <div className="col-span-full text-center text-xs text-gray-500 py-8">No products match this OEM.</div>}</div></div>}</div></> : <div className="min-h-[620px] flex items-center justify-center text-sm text-gray-500">Select an OEM partner to open its profile.</div>}
      </main>
    </div>

    {editing && <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"><form onSubmit={save} className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 space-y-4"><div className="flex items-center justify-between"><div><div className="text-[10px] uppercase tracking-wider text-gray-500">Partner record</div><h2 className="text-lg font-bold text-gray-900">{selected ? 'Edit OEM Profile' : 'Onboard OEM Partner'}</h2></div><button type="button" onClick={() => setEditing(false)}><X className="w-5 h-5 text-gray-400" /></button></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{[['Name', 'name'], ['Website', 'website'], ['Partner portal URL', 'partnerPortalUrl'], ['Partnership status', 'partnershipStatus'], ['Partner tier', 'partnerTier']].map(([label, key]) => <label key={key} className="text-xs font-semibold text-gray-700">{label}<input value={(form as any)[key]} onChange={event => setForm({ ...form, [key]: event.target.value })} className="enterprise-input w-full text-xs mt-1" /></label>)}<label className="text-xs font-semibold text-gray-700">Status<select value={form.status} onChange={event => setForm({ ...form, status: event.target.value as any })} className="enterprise-select w-full text-xs mt-1"><option>Active</option><option>Inactive</option></select></label></div><label className="text-xs font-semibold text-gray-700">Description<textarea value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} className="enterprise-input w-full text-xs mt-1" rows={3} /></label><div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{[['Sales certifications', 'salesCertifications'], ['Presales certifications', 'presalesCertifications'], ['Postsales certifications', 'postsalesCertifications'], ['Required certifications', 'requiredCertifications']].map(([label, key]) => <label key={key} className="text-xs font-semibold text-gray-700">{label}<input value={(form as any)[key]} onChange={event => setForm({ ...form, [key]: event.target.value })} placeholder="Comma separated" className="enterprise-input w-full text-xs mt-1" /></label>)}</div><div className="flex justify-end gap-2"><button type="button" onClick={() => setEditing(false)} className="px-3 py-2 text-xs bg-gray-100 rounded-lg">Cancel</button><button type="submit" className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg">Save Profile</button></div></form></div>}
  </div>;
};
