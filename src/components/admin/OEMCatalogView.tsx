import React, { useEffect, useMemo, useState } from 'react';
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
import { OEMEntry, ProductCatalogEntry } from '../../types';

interface OEMCatalogViewProps {
  oems: OEMEntry[];
  canManage: boolean;
  onCreate: (payload: { name: string; website?: string; description?: string; status?: string }) => Promise<any>;
  onUpdate: (oemId: string, payload: { name?: string; website?: string; description?: string; status?: string }) => Promise<any>;
  onDelete: (oemId: string) => Promise<any>;
  products?: ProductCatalogEntry[];
}

type OEMForm = {
  name: string;
  website: string;
  description: string;
  status: 'Active' | 'Inactive';
  partnerPortalUrl: string;
  partnershipStatus: string;
  partnerTier: string;
  salesCertifications: string;
  presalesCertifications: string;
  postsalesCertifications: string;
  requiredCertifications: string;
};

const emptyForm: OEMForm = { name: '', website: '', description: '', status: 'Active', partnerPortalUrl: '', partnershipStatus: '', partnerTier: '', salesCertifications: '', presalesCertifications: '', postsalesCertifications: '', requiredCertifications: '' };

export const OEMCatalogView: React.FC<OEMCatalogViewProps> = ({
  oems,
  canManage,
  onCreate,
  onUpdate,
  onDelete,
  products = [],
}) => {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [partnershipFilter, setPartnershipFilter] = useState('all');
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<OEMForm>(emptyForm);
  const [savedMsg, setSavedMsg] = useState('');
  const [error, setError] = useState('');
  const [selectedOEM, setSelectedOEM] = useState<OEMEntry | null>(null);
  const [profileTab, setProfileTab] = useState<'overview' | 'partner' | 'products'>('overview');
  const [productQuery, setProductQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return oems
      .filter(s => statusFilter === 'all' || s.status === statusFilter)
      .filter(s => tierFilter === 'all' || s.partner_tier === tierFilter)
      .filter(s => partnershipFilter === 'all' || s.partnership_status === partnershipFilter)
      .filter(s => !q || s.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [oems, query, statusFilter, tierFilter, partnershipFilter]);

  const tiers = useMemo(() => [...new Set(oems.map(oem => oem.partner_tier).filter(Boolean))].sort(), [oems]);
  const partnershipStatuses = useMemo(() => [...new Set(oems.map(oem => oem.partnership_status).filter(Boolean))].sort(), [oems]);

  useEffect(() => {
    if (!selectedOEM && filtered[0]) setSelectedOEM(filtered[0]);
  }, [filtered, selectedOEM]);

  const activeCount = oems.filter(oem => oem.status === 'Active').length;
  const portalCoverage = oems.filter(oem => oem.partner_portal_url).length;
  const certificationProfiles = oems.filter(oem => (oem.required_certifications || []).length > 0).length;
  const linkedProducts = products.filter(product => product.oem_id).length;

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
          partnerPortalUrl: form.partnerPortalUrl.trim() || undefined,
          partnershipStatus: form.partnershipStatus.trim() || undefined,
          partnerTier: form.partnerTier.trim() || undefined,
          salesCertifications: form.salesCertifications.split(',').map(value => value.trim()).filter(Boolean),
          presalesCertifications: form.presalesCertifications.split(',').map(value => value.trim()).filter(Boolean),
          postsalesCertifications: form.postsalesCertifications.split(',').map(value => value.trim()).filter(Boolean),
          requiredCertifications: form.requiredCertifications.split(',').map(value => value.trim()).filter(Boolean),
        });
        showMsg('OEM updated.');
      } else {
        await onCreate({
          name: form.name.trim(),
          website: form.website.trim() || undefined,
          description: form.description.trim() || undefined,
          status: form.status,
          partnerPortalUrl: form.partnerPortalUrl.trim() || undefined,
          partnershipStatus: form.partnershipStatus.trim() || undefined,
          partnerTier: form.partnerTier.trim() || undefined,
          salesCertifications: form.salesCertifications.split(',').map(value => value.trim()).filter(Boolean),
          presalesCertifications: form.presalesCertifications.split(',').map(value => value.trim()).filter(Boolean),
          postsalesCertifications: form.postsalesCertifications.split(',').map(value => value.trim()).filter(Boolean),
          requiredCertifications: form.requiredCertifications.split(',').map(value => value.trim()).filter(Boolean),
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
      partnerPortalUrl: o.partner_portal_url || '',
      partnershipStatus: o.partnership_status || '',
      partnerTier: o.partner_tier || '',
      salesCertifications: (o.sales_certifications || []).join(', '),
      presalesCertifications: (o.presales_certifications || []).join(', '),
      postsalesCertifications: (o.postsales_certifications || []).join(', '),
      requiredCertifications: (o.required_certifications || []).join(', '),
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
            <h1 className="text-base font-bold text-gray-900 tracking-tight">OEM Management Center</h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
              PARTNERS
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Govern partner relationships, certification readiness, portals, and product coverage from one workspace.
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold font-mono text-gray-900">{oems.length}</div>
          <div className="text-[10px] uppercase font-semibold text-gray-500">OEM partners</div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded p-3"><div className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">Active Partners</div><div className="text-2xl font-bold font-mono text-emerald-700 mt-1">{activeCount}</div><div className="text-[10px] text-gray-500">of {oems.length} registered OEMs</div></div>
        <div className="bg-white border border-gray-200 rounded p-3"><div className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">Product Coverage</div><div className="text-2xl font-bold font-mono text-blue-700 mt-1">{linkedProducts}</div><div className="text-[10px] text-gray-500">catalog products linked to OEMs</div></div>
        <div className="bg-white border border-gray-200 rounded p-3"><div className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">Portal Coverage</div><div className="text-2xl font-bold font-mono text-purple-700 mt-1">{portalCoverage}</div><div className="text-[10px] text-gray-500">partner portals configured</div></div>
        <div className="bg-white border border-gray-200 rounded p-3"><div className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">Certification Profiles</div><div className="text-2xl font-bold font-mono text-amber-700 mt-1">{certificationProfiles}</div><div className="text-[10px] text-gray-500">profiles with requirements</div></div>
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
               <select value={tierFilter} onChange={e => setTierFilter(e.target.value)} className="enterprise-input text-xs py-1.5 w-full sm:w-auto"><option value="all">All partner tiers</option>{tiers.map(tier => <option key={tier} value={tier}>{tier}</option>)}</select>
               <select value={partnershipFilter} onChange={e => setPartnershipFilter(e.target.value)} className="enterprise-input text-xs py-1.5 w-full sm:w-auto"><option value="all">All partnership statuses</option>{partnershipStatuses.map(status => <option key={status} value={status}>{status}</option>)}</select>
            </div>
          </div>

          <div className="divide-y divide-gray-100 max-h-[560px] overflow-y-auto">
            {filtered.length === 0 && (
              <div className="p-8 text-center text-xs text-gray-400">No OEM partners match your filters.</div>
            )}
            {filtered.map(o => (
              <div key={o.id} onClick={() => { setSelectedOEM(o); setProfileTab('overview'); setProductQuery(''); }} className={`p-3.5 flex items-center justify-between gap-3 hover:bg-gray-50 cursor-pointer ${selectedOEM?.id === o.id ? 'bg-blue-50/60' : ''}`}>
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
                     {(o.partner_tier || o.partnership_status) && <div className="text-[10px] text-blue-700 font-mono mt-1">{o.partner_tier || 'Partner'} · {o.partnership_status || 'Status not set'}</div>}
                     {(o.required_certifications || []).length > 0 && <div className="text-[10px] text-amber-700 mt-0.5">Required: {o.required_certifications.join(', ')}</div>}
                  </div>
                </div>
                {canManage && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                   <button onClick={(e) => { e.stopPropagation(); startEdit(o); }} title="Edit" className="p-1.5 text-gray-400 hover:text-blue-600 rounded">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                   <button onClick={(e) => { e.stopPropagation(); handleDelete(o); }} title="Delete" className="p-1.5 text-gray-400 hover:text-red-600 rounded">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

         <div className="space-y-4 h-fit">
          {selectedOEM && <div className="bg-white border border-blue-200 rounded p-4 space-y-3"><div className="flex items-center justify-between"><div><div className="text-[10px] uppercase font-semibold text-gray-500">OEM Profile</div><h2 className="text-sm font-bold text-gray-900">{selectedOEM.name}</h2></div><div className="flex gap-1"><button onClick={() => startEdit(selectedOEM)} className="p-1.5 text-blue-700 bg-blue-50 rounded" title="Edit OEM"><Pencil className="w-3.5 h-3.5" /></button><button onClick={() => handleDelete(selectedOEM)} className="p-1.5 text-red-700 bg-red-50 rounded" title="Delete OEM"><Trash2 className="w-3.5 h-3.5" /></button></div></div><div className="flex gap-1 border-b border-gray-200 pb-2"><button onClick={() => setProfileTab('overview')} className={`px-2 py-1 text-[10px] font-semibold rounded ${profileTab === 'overview' ? 'bg-blue-50 text-blue-700' : 'text-gray-500'}`}>Overview</button><button onClick={() => setProfileTab('partner')} className={`px-2 py-1 text-[10px] font-semibold rounded ${profileTab === 'partner' ? 'bg-blue-50 text-blue-700' : 'text-gray-500'}`}>Partner & Certs</button><button onClick={() => setProfileTab('products')} className={`px-2 py-1 text-[10px] font-semibold rounded ${profileTab === 'products' ? 'bg-blue-50 text-blue-700' : 'text-gray-500'}`}>Products ({products.filter(product => product.oem_id === selectedOEM.id).length})</button></div>{profileTab === 'overview' && <div className="grid grid-cols-2 gap-2 text-[11px]"><div><span className="block text-gray-500">Status</span><strong>{selectedOEM.status}</strong></div><div><span className="block text-gray-500">Partnership</span><strong>{selectedOEM.partnership_status || 'Not set'}</strong></div><div><span className="block text-gray-500">Partner Tier</span><strong>{selectedOEM.partner_tier || 'Not set'}</strong></div><div className="col-span-2"><span className="block text-gray-500">Website</span><span className="text-blue-700 break-all">{selectedOEM.website || 'Not set'}</span></div><div className="col-span-2"><span className="block text-gray-500">Partner Portal</span><span className="text-blue-700 break-all">{selectedOEM.partner_portal_url || 'Not set'}</span></div><div className="col-span-2 text-gray-600">{selectedOEM.description || 'No OEM profile description.'}</div></div>}{profileTab === 'partner' && <div className="space-y-2 text-[11px]"><div><span className="block text-gray-500">Sales certifications</span><strong>{(selectedOEM.sales_certifications || []).join(', ') || 'None recorded'}</strong></div><div><span className="block text-gray-500">Presales certifications</span><strong>{(selectedOEM.presales_certifications || []).join(', ') || 'None recorded'}</strong></div><div><span className="block text-gray-500">Postsales certifications</span><strong>{(selectedOEM.postsales_certifications || []).join(', ') || 'None recorded'}</strong></div><div><span className="block text-gray-500">Required certifications</span><strong>{(selectedOEM.required_certifications || []).join(', ') || 'None recorded'}</strong></div></div>}{profileTab === 'products' && <div className="space-y-2"><input value={productQuery} onChange={event => setProductQuery(event.target.value)} placeholder="Search this OEM's products..." className="enterprise-input text-xs w-full" />{products.filter(product => product.oem_id === selectedOEM.id && (!productQuery || `${product.name} ${product.model || ''} ${product.part_number || ''}`.toLowerCase().includes(productQuery.toLowerCase()))).map(product => <div key={product.id} className="text-[11px] p-2 rounded bg-gray-50 border border-gray-200"><strong>{product.name}</strong><span className="ml-1 text-gray-500">{product.model || product.part_number || ''}</span><div className="text-[10px] text-gray-500">{product.category} · {product.status}</div></div>)}{!products.some(product => product.oem_id === selectedOEM.id) && <div className="text-[11px] text-gray-400">No related products linked.</div>}</div>}</div>}
         <div className="bg-white border border-gray-200 rounded p-4 h-fit">
          <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
            {editing ? <Pencil className="w-4 h-4 text-blue-600" /> : <Plus className="w-4 h-4 text-emerald-600" />}
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
              {editing ? 'Edit OEM Profile' : 'Onboard OEM'}
            </h3>
         </div></div>

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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label><span className="text-[10px] uppercase font-semibold text-gray-500">Partner Portal URL</span><input value={form.partnerPortalUrl} onChange={e => setForm({ ...form, partnerPortalUrl: e.target.value })} placeholder="https://partner..." className="enterprise-input text-xs py-1.5 mt-1 w-full" disabled={!canManage} /></label>
              <label><span className="text-[10px] uppercase font-semibold text-gray-500">Partnership Status</span><input value={form.partnershipStatus} onChange={e => setForm({ ...form, partnershipStatus: e.target.value })} placeholder="Active / Pending / Expired" className="enterprise-input text-xs py-1.5 mt-1 w-full" disabled={!canManage} /></label>
              <label><span className="text-[10px] uppercase font-semibold text-gray-500">Partner Tier</span><input value={form.partnerTier} onChange={e => setForm({ ...form, partnerTier: e.target.value })} placeholder="Gold / Silver / Registered" className="enterprise-input text-xs py-1.5 mt-1 w-full" disabled={!canManage} /></label>
              <label><span className="text-[10px] uppercase font-semibold text-gray-500">Required Certifications</span><input value={form.requiredCertifications} onChange={e => setForm({ ...form, requiredCertifications: e.target.value })} placeholder="Comma separated" className="enterprise-input text-xs py-1.5 mt-1 w-full" disabled={!canManage} /></label>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <label><span className="text-[10px] uppercase font-semibold text-gray-500">Sales Certifications</span><input value={form.salesCertifications} onChange={e => setForm({ ...form, salesCertifications: e.target.value })} placeholder="Comma separated certifications" className="enterprise-input text-xs py-1.5 mt-1 w-full" disabled={!canManage} /></label>
              <label><span className="text-[10px] uppercase font-semibold text-gray-500">Presales Certifications</span><input value={form.presalesCertifications} onChange={e => setForm({ ...form, presalesCertifications: e.target.value })} placeholder="Comma separated certifications" className="enterprise-input text-xs py-1.5 mt-1 w-full" disabled={!canManage} /></label>
              <label><span className="text-[10px] uppercase font-semibold text-gray-500">Postsales Certifications</span><input value={form.postsalesCertifications} onChange={e => setForm({ ...form, postsalesCertifications: e.target.value })} placeholder="Comma separated certifications" className="enterprise-input text-xs py-1.5 mt-1 w-full" disabled={!canManage} /></label>
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
                  {editing ? 'Save OEM Profile' : 'Onboard OEM'}
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
