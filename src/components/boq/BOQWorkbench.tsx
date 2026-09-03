import React, { useState } from 'react';
import { 
  Calculator, 
  Plus, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Trash2, 
  ExternalLink, 
  ShieldCheck, 
  TrendingUp, 
  Percent, 
  Check,
  FileSpreadsheet,
  Search
} from 'lucide-react';
import { Opportunity, BOQItem, BOQSummary, ProductCatalogEntry, OEMEntry } from '../../types';
import { exportBOQCSV } from '../../utils/exportUtils';
import { formatCurrency } from '../../utils/currency';

// Map a product catalog category to a BOQ line-item category bucket.
function mapProductCategory(cat: string): BOQItem['category'] {
  const c = (cat || '').toLowerCase();
  if (c.includes('security')) return 'Security & Compliance';
  if (c.includes('software') || c.includes('license')) return 'Software Licenses';
  if (c.includes('hardware') || c.includes('server') || c.includes('storage') || c.includes('networking') || c.includes('switch') || c.includes('firewall')) return 'Hardware';
  if (c.includes('service') || c.includes('managed')) return 'Managed Support';
  if (c.includes('pro')) return 'Professional Services';
  return 'Cloud Infrastructure';
}

interface BOQWorkbenchProps {
  opportunities: Opportunity[];
  onUpdateOpportunity: (opp: Opportunity) => void;
  onSelectOpportunity: (opp: Opportunity) => void;
  products?: ProductCatalogEntry[];
  oems?: OEMEntry[];
}

export const BOQWorkbench: React.FC<BOQWorkbenchProps> = ({
  opportunities,
  onUpdateOpportunity,
  onSelectOpportunity,
  products = [],
  oems = []
}) => {
  // Select active opportunity for BOQ modeling
  const [selectedOppId, setSelectedOppId] = useState<string>(opportunities[0]?.id || '');
  const activeOpp = opportunities.find(o => o.id === selectedOppId) || opportunities[0];

  const [newItem, setNewItem] = useState<Partial<BOQItem>>({
    category: 'Cloud Infrastructure',
    itemCode: 'INF-CUSTOM',
    description: '',
    unit: 'Instances/Mo',
    quantity: 1,
    unitCost: 0,
    unitListPrice: 0,
    discountPercent: 0
  });
  const [productQuery, setProductQuery] = useState('');
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [showRevisions, setShowRevisions] = useState(false);

  if (!activeOpp) {
    return (
      <div className="p-8 text-center text-gray-500 font-mono text-xs">
        No active opportunities found for BOQ modeling.
      </div>
    );
  }

  const snapshotBOQ = (boq: BOQSummary): BOQSummary => ({
    ...boq,
    items: [...(boq.items || [])],
    revisions: undefined,
  });

  const withRevision = (previous: BOQSummary, next: BOQSummary): BOQSummary => ({
    ...next,
    revisions: [
      ...(previous.revisions || []),
      {
        id: `boq-revision-${Date.now()}`,
        version: previous.version || 1,
        savedAt: new Date().toISOString(),
        status: previous.approvalStatus,
        snapshot: snapshotBOQ(previous),
      },
    ],
  });

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.description || !newItem.unitCost || !newItem.unitListPrice) return;

    const qty = Number(newItem.quantity) || 1;
    const listPrice = Number(newItem.unitListPrice) || 0;
    const cost = Number(newItem.unitCost) || 0;
    const discount = Number(newItem.discountPercent) || 0;
    
    const discountedUnitPrice = listPrice * (1 - discount / 100);
    const extendedPrice = discountedUnitPrice * qty;
    const totalCost = cost * qty;
    const marginPercent = extendedPrice > 0 ? ((extendedPrice - totalCost) / extendedPrice) * 100 : 0;

    const item: BOQItem = {
      id: `boq-${Date.now()}`,
      category: newItem.category as any || 'Cloud Infrastructure',
      itemCode: newItem.itemCode || 'CUSTOM-ITEM',
      description: newItem.description || '',
      unit: newItem.unit as any || 'Instances/Mo',
      quantity: qty,
      unitCost: cost,
      unitListPrice: listPrice,
      discountPercent: discount,
      extendedPrice: Math.round(extendedPrice),
      marginPercent: Math.round(marginPercent * 10) / 10,
      oem: newItem.oem,
      productName: newItem.productName,
      model: newItem.model,
      partNumber: newItem.partNumber
    };

    const updatedItems = [...(activeOpp.boq?.items || []), item];
    const subtotalCost = updatedItems.reduce((acc, i) => acc + (i.unitCost * i.quantity), 0);
    const subtotalListPrice = updatedItems.reduce((acc, i) => acc + (i.unitListPrice * i.quantity), 0);
    const totalContractValue = updatedItems.reduce((acc, i) => acc + i.extendedPrice, 0);
    const totalDiscountAmount = subtotalListPrice - totalContractValue;
    const overallMarginPercent = totalContractValue > 0 ? Math.round(((totalContractValue - subtotalCost) / totalContractValue) * 1000) / 10 : 0;

    onUpdateOpportunity({
      ...activeOpp,
       boq: withRevision(activeOpp.boq, {
         ...activeOpp.boq,
        items: updatedItems,
        subtotalCost,
        subtotalListPrice,
        totalContractValue,
        totalDiscountAmount,
        overallMarginPercent,
         version: (activeOpp.boq?.version || 0) + 1
       }),
      updatedAt: new Date().toISOString()
    });

    setShowAddForm(false);
  };

  const handleDeleteItem = (itemId: string) => {
    const updatedItems = (activeOpp.boq?.items || []).filter(i => i.id !== itemId);
    const subtotalCost = updatedItems.reduce((acc, i) => acc + (i.unitCost * i.quantity), 0);
    const subtotalListPrice = updatedItems.reduce((acc, i) => acc + (i.unitListPrice * i.quantity), 0);
    const totalContractValue = updatedItems.reduce((acc, i) => acc + i.extendedPrice, 0);
    const totalDiscountAmount = subtotalListPrice - totalContractValue;
    const overallMarginPercent = totalContractValue > 0 ? Math.round(((totalContractValue - subtotalCost) / totalContractValue) * 1000) / 10 : 0;

    onUpdateOpportunity({
      ...activeOpp,
       boq: withRevision(activeOpp.boq, {
         ...activeOpp.boq,
        items: updatedItems,
        subtotalCost,
        subtotalListPrice,
        totalContractValue,
        totalDiscountAmount,
        overallMarginPercent,
         version: (activeOpp.boq?.version || 0) + 1
       }),
      updatedAt: new Date().toISOString()
    });
  };

  const handleApprove = () => {
    onUpdateOpportunity({
      ...activeOpp,
       boq: withRevision(activeOpp.boq, {
         ...activeOpp.boq,
        approvalStatus: 'approved',
        approvedBy: 'Elena Rostova (Lead SA Signoff)',
        approvedDate: new Date().toISOString().slice(0, 10)
       }),
      updatedAt: new Date().toISOString()
    });
  };

  return (
    <div className="space-y-4">
      
      {/* Top Banner & Selector */}
      <div className="bg-white border border-gray-200 rounded p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-purple-600" />
              <h1 className="text-base font-bold text-gray-900 tracking-tight">Bill of Quantities (BOQ) & Pricing Workbench</h1>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Multi-tier cost modeling, margin governance, discount approval matrices, and commercial SOW generation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700">Target Opportunity:</label>
            <select
              value={selectedOppId}
              onChange={(e) => setSelectedOppId(e.target.value)}
              className="enterprise-select font-mono text-xs py-1"
            >
              {opportunities.map(o => (
                <option key={o.id} value={o.id}>
                  {o.code} - {o.clientName} ({formatCurrency(o.contractValue)})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Global Financial KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-gray-100 text-xs font-mono">
          <div className="bg-gray-50 p-2.5 rounded border border-gray-200">
            <span className="text-gray-500 text-[11px] font-sans font-medium">Active Opportunity TCV:</span>
            <div className="text-base font-bold text-gray-900">{formatCurrency(activeOpp.boq.totalContractValue)}</div>
            <div className="text-[10px] text-gray-500">List: {formatCurrency(activeOpp.boq.subtotalListPrice)}</div>
          </div>

          <div className="bg-gray-50 p-2.5 rounded border border-gray-200">
            <span className="text-gray-500 text-[11px] font-sans font-medium">Realized Gross Margin:</span>
            <div className="text-base font-bold text-emerald-700">{activeOpp.boq.overallMarginPercent}%</div>
            <div className="text-[10px] text-gray-500">Target: &gt;30% margin</div>
          </div>

          <div className="bg-gray-50 p-2.5 rounded border border-gray-200">
            <span className="text-gray-500 text-[11px] font-sans font-medium">Discount Concession:</span>
            <div className="text-base font-bold text-amber-800">{formatCurrency(activeOpp.boq.totalDiscountAmount)}</div>
            <div className="text-[10px] text-gray-500">
              {activeOpp.boq.subtotalListPrice > 0 ? ((activeOpp.boq.totalDiscountAmount / activeOpp.boq.subtotalListPrice) * 100).toFixed(1) : 0}% aggregate discount
            </div>
          </div>

          <div className="bg-gray-50 p-2.5 rounded border border-gray-200">
            <span className="text-gray-500 text-[11px] font-sans font-medium">Governance Status:</span>
            <div className="text-xs font-bold text-purple-700 uppercase mt-0.5">{activeOpp.boq.approvalStatus.replace(/_/g, ' ')}</div>
            <div className="text-[10px] text-gray-500">v{activeOpp.boq.version} revision</div>
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="bg-white border border-gray-200 rounded p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-xs shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add BOQ Line Item</span>
          </button>

          <button
            onClick={() => setShowRevisions(value => !value)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded font-medium text-xs shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-purple-600" />
            <span>Revision History ({activeOpp.boq.revisions?.length || 0})</span>
          </button>

          <button
            onClick={() => exportBOQCSV(activeOpp)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded font-medium text-xs shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export BOQ CSV</span>
          </button>

          {activeOpp.boq.approvalStatus !== 'approved' && (
            <button
              onClick={handleApprove}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium text-xs shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Simulate Leadership Approval</span>
            </button>
          )}
        </div>

        <button
          onClick={() => onSelectOpportunity(activeOpp)}
          className="flex items-center gap-1 text-xs text-blue-700 hover:underline font-medium"
        >
          <span>Open Full Opportunity Workspace</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      {showRevisions && (
        <div className="bg-white border border-purple-200 rounded p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-gray-200 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">BOQ Revision History</h3>
            <span className="text-[11px] text-gray-500">Current: v{activeOpp.boq.version}</span>
          </div>
          {(activeOpp.boq.revisions || []).length === 0 ? (
            <p className="text-xs text-gray-500">No previous revisions are recorded yet. Future edits will preserve the prior BOQ snapshot here.</p>
          ) : (
            <div className="space-y-2">
              {[...(activeOpp.boq.revisions || [])].reverse().map(revision => (
                <div key={revision.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-gray-50 border border-gray-200 rounded text-xs">
                  <div><span className="font-mono font-bold text-purple-700">v{revision.version}</span><span className="ml-2 text-gray-700">{revision.snapshot.items.length} line items</span><span className="ml-2 text-gray-500">{new Date(revision.savedAt).toLocaleString()}</span></div>
                  <div className="flex items-center gap-3"><span className="uppercase font-mono text-[10px] text-gray-500">{revision.status.replace(/_/g, ' ')}</span><span className="font-mono font-semibold text-gray-800">{formatCurrency(revision.snapshot.totalContractValue)}</span></div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <form onSubmit={handleAddItem} className="bg-white border border-blue-200 rounded p-4 space-y-3 shadow-sm">
          <div className="font-bold text-gray-900 text-xs">Add New BOQ Item to {activeOpp.code} ({activeOpp.clientName})</div>

          {/* Catalog-driven product search (Section 11) */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">Search Product Catalog (optional)</label>
            <div className="relative">
              <div
                className="w-full enterprise-input cursor-pointer flex items-center gap-2 text-xs"
                onClick={() => setProductDropdownOpen(v => !v)}
              >
                <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="flex-1 truncate text-gray-700">
                  {newItem.productName
                    ? `${newItem.oem || ''} ${newItem.productName}${newItem.model ? ` (${newItem.model})` : ''}`
                    : 'Select from catalog or enter manually...'}
                </span>
                <span className="text-gray-400">{productDropdownOpen ? '▲' : '▼'}</span>
              </div>
              {productDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-y-auto">
                  <input
                    value={productQuery}
                    onChange={(e) => setProductQuery(e.target.value)}
                    placeholder="Search by product, model, part #, OEM..."
                    className="w-full px-3 py-2 border-b border-gray-200 text-xs font-mono focus:outline-none"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                  {(products || [])
                    .filter(p => p.status !== 'Inactive')
                    .filter(p => !productQuery.trim()
                      || p.name.toLowerCase().includes(productQuery.trim().toLowerCase())
                      || (p.model || '').toLowerCase().includes(productQuery.trim().toLowerCase())
                      || (p.part_number || '').toLowerCase().includes(productQuery.trim().toLowerCase())
                      || (p.oem_name || '').toLowerCase().includes(productQuery.trim().toLowerCase()))
                    .map(p => (
                      <button
                        type="button"
                        key={p.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setNewItem({
                            ...newItem,
                            oem: p.oem_name || undefined,
                            productName: p.name,
                            model: p.model || undefined,
                            partNumber: p.part_number || undefined,
                            description: p.description || p.name,
                            category: mapProductCategory(p.category),
                            unit: (p.unit as any) || newItem.unit,
                            itemCode: p.part_number || p.model || undefined
                          });
                          setProductDropdownOpen(false);
                          setProductQuery('');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-blue-50 transition-colors"
                      >
                        <span className="flex-1 min-w-0">
                          <span className="block font-medium text-gray-800 truncate">{p.oem_name} {p.name}</span>
                          <span className="block text-[10px] text-gray-400">{p.model} · {p.part_number}</span>
                        </span>
                        <span className="text-[9px] font-mono uppercase text-gray-400">{p.category}</span>
                      </button>
                    ))}
                  {(products || []).length === 0 && (
                    <div className="p-3 text-[11px] text-gray-400">No products in catalog yet.</div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">Category</label>
              <select
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value as any })}
                className="w-full enterprise-select text-xs"
              >
                <option value="Cloud Infrastructure">Cloud Infrastructure</option>
                <option value="Software Licenses">Software Licenses</option>
                <option value="Professional Services">Professional Services</option>
                <option value="Managed Support">Managed Support</option>
                <option value="Security & Compliance">Security & Compliance</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">Item Code / SKU</label>
              <input
                type="text"
                value={newItem.itemCode}
                onChange={(e) => setNewItem({ ...newItem, itemCode: e.target.value })}
                className="w-full enterprise-input font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">Unit Model</label>
              <select
                value={newItem.unit}
                onChange={(e) => setNewItem({ ...newItem, unit: e.target.value as any })}
                className="w-full enterprise-select font-mono text-xs"
              >
                <option value="Instances/Mo">Instances/Mo</option>
                <option value="TB/Mo">TB/Mo</option>
                <option value="Users/Yr">Users/Yr</option>
                <option value="Man-Days">Man-Days</option>
                <option value="Core-Hrs">Core-Hrs</option>
                <option value="Flat Fee">Flat Fee</option>
                <option value="License/Yr">License/Yr</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">Description</label>
            <input
              type="text"
              required
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              placeholder="e.g. Multi-Region Istio Service Mesh License & Node Clusters"
              className="w-full enterprise-input text-xs"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
            <div>
              <label className="block text-[11px] text-gray-600 mb-1 font-sans font-medium">Quantity</label>
              <input
                type="number"
                value={newItem.quantity}
                onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                className="w-full enterprise-input"
              />
            </div>
            <div>
                  <label className="block text-[11px] text-gray-600 mb-1 font-sans font-medium">Unit Cost</label>
              <input
                type="number"
                value={newItem.unitCost}
                onChange={(e) => setNewItem({ ...newItem, unitCost: Number(e.target.value) })}
                className="w-full enterprise-input"
              />
            </div>
            <div>
                  <label className="block text-[11px] text-gray-600 mb-1 font-sans font-medium">Unit List Price</label>
              <input
                type="number"
                value={newItem.unitListPrice}
                onChange={(e) => setNewItem({ ...newItem, unitListPrice: Number(e.target.value) })}
                className="w-full enterprise-input"
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-600 mb-1 font-sans font-medium">Discount %</label>
              <input
                type="number"
                value={newItem.discountPercent}
                onChange={(e) => setNewItem({ ...newItem, discountPercent: Number(e.target.value) })}
                className="w-full enterprise-input"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded font-medium text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-xs"
            >
              Insert Item
            </button>
          </div>
        </form>
      )}

      {/* BOQ Line Items Table */}
      <div className="bg-white border border-gray-200 rounded overflow-x-auto">
        <div className="bg-gray-50 px-3.5 py-2.5 border-b border-gray-200 flex items-center justify-between">
          <div className="text-xs font-bold text-gray-900 font-mono">
            {activeOpp.code} Line Item Sizing ({(activeOpp.boq?.items || []).length} items)
          </div>
          <div className="text-[11px] text-gray-500 font-mono">
             Direct Cost: {formatCurrency(activeOpp.boq?.subtotalCost || 0)} | TCV: {formatCurrency(activeOpp.boq?.totalContractValue || 0)}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 border-b border-gray-200 text-[11px] font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3">Item / SKU</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-right">Qty & Unit</th>
                <th className="py-2.5 px-3 text-right">Unit List</th>
                <th className="py-2.5 px-3 text-right">Disc %</th>
                <th className="py-2.5 px-3 text-right">Extended Price</th>
                <th className="py-2.5 px-3 text-right">Margin %</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-800">
              {(activeOpp.boq?.items || []).map(it => (
                <tr key={it.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-gray-900">{it.description}</div>
                    <div className="text-[11px] font-mono text-gray-500">{it.itemCode}</div>
                    {it.oem && (
                      <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1">
                        <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-100 font-semibold">{it.oem}</span>
                        {it.model && <span className="font-mono">{it.model}</span>}
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="inline-flex items-center text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-800 font-mono border border-gray-200">
                      {it.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono">
                    <strong>{it.quantity}</strong> {it.unit}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-gray-600">
                     {formatCurrency(it.unitListPrice)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono">
                    {it.discountPercent > 0 ? (
                      <span className="text-amber-800 font-semibold">{it.discountPercent}%</span>
                    ) : (
                      <span className="text-gray-400">0%</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900">
                     {formatCurrency(it.extendedPrice)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-700">
                    {it.marginPercent}%
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => handleDeleteItem(it.id)}
                      className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-gray-100"
                      title="Remove line"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
