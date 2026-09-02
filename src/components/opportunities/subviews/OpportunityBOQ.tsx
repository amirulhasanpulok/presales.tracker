import React, { useState } from 'react';
import { Opportunity, BOQItem, ApprovalStatus } from '../../../types';
import { exportBOQCSV } from '../../../utils/exportUtils';
import { 
  Calculator, 
  DollarSign, 
  Percent, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Send,
  Trash2,
  Lock
} from 'lucide-react';

interface OpportunityBOQProps {
  opportunity: Opportunity;
  onUpdateBOQ?: (boq: Opportunity['boq']) => void;
}

export const OpportunityBOQ: React.FC<OpportunityBOQProps> = ({
  opportunity,
  onUpdateBOQ,
}) => {
  const [items, setItems] = useState<BOQItem[]>(opportunity.boq.items);
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>(opportunity.boq.approvalStatus);
  const [showAddRow, setShowAddRow] = useState(false);

  // New item form
  const [category, setCategory] = useState<BOQItem['category']>('Cloud Infrastructure');
  const [itemCode, setItemCode] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState<BOQItem['unit']>('Instances/Mo');
  const [quantity, setQuantity] = useState(1);
  const [unitCost, setUnitCost] = useState(100);
  const [unitListPrice, setUnitListPrice] = useState(150);
  const [discountPercent, setDiscountPercent] = useState(0);

  // Recalculate totals
  const subtotalCost = items.reduce((acc, it) => acc + (it.unitCost * it.quantity), 0);
  const subtotalList = items.reduce((acc, it) => acc + (it.unitListPrice * it.quantity), 0);
  const totalExtended = items.reduce((acc, it) => acc + it.extendedPrice, 0);
  const totalDiscount = subtotalList - totalExtended;
  const overallMargin = totalExtended > 0 ? Math.round(((totalExtended - subtotalCost) / totalExtended) * 100) : 0;

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    const listTotal = unitListPrice * quantity;
    const discountedTotal = listTotal * (1 - discountPercent / 100);
    const itemCostTotal = unitCost * quantity;
    const itemMargin = discountedTotal > 0 ? Math.round(((discountedTotal - itemCostTotal) / discountedTotal) * 100) : 0;

    const newItem: BOQItem = {
      id: `boq-item-${Date.now()}`,
      category,
      itemCode: itemCode || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      description,
      unit,
      quantity,
      unitCost,
      unitListPrice,
      discountPercent,
      extendedPrice: Math.round(discountedTotal),
      marginPercent: itemMargin
    };

    const updated = [...items, newItem];
    setItems(updated);
    updateOpportunity(updated, approvalStatus);

    setDescription('');
    setItemCode('');
    setShowAddRow(false);
  };

  const handleRemoveItem = (id: string) => {
    const updated = items.filter(it => it.id !== id);
    setItems(updated);
    updateOpportunity(updated, approvalStatus);
  };

  const updateOpportunity = (newItems: BOQItem[], status: ApprovalStatus) => {
    const computedCost = newItems.reduce((acc, it) => acc + (it.unitCost * it.quantity), 0);
    const computedList = newItems.reduce((acc, it) => acc + (it.unitListPrice * it.quantity), 0);
    const computedExt = newItems.reduce((acc, it) => acc + it.extendedPrice, 0);
    const computedDisc = computedList - computedExt;
    const computedMargin = computedExt > 0 ? Math.round(((computedExt - computedCost) / computedExt) * 100) : 0;

    const newBOQ = {
      ...opportunity.boq,
      items: newItems,
      subtotalCost: computedCost,
      subtotalListPrice: computedList,
      totalDiscountAmount: computedDisc,
      totalContractValue: computedExt,
      overallMarginPercent: computedMargin,
      approvalStatus: status
    };
    opportunity.boq = newBOQ;
    if (onUpdateBOQ) onUpdateBOQ(newBOQ);
  };

  const requestApproval = () => {
    setApprovalStatus('pending_sa_lead');
    updateOpportunity(items, 'pending_sa_lead');
  };

  const approveBOQ = () => {
    setApprovalStatus('approved');
    updateOpportunity(items, 'approved');
  };

  return (
    <div className="space-y-4">
      {/* Top Commercial Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded p-3">
          <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Total Extended Price (TCV)</div>
          <div className="text-xl font-bold font-mono text-gray-900 mt-1">
            ${totalExtended.toLocaleString()}
          </div>
          <div className="text-[11px] text-gray-500 font-mono">
            List Price: ${subtotalList.toLocaleString()}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded p-3">
          <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Total Discount Given</div>
          <div className="text-xl font-bold font-mono text-amber-800 mt-1">
            ${totalDiscount.toLocaleString()}
          </div>
          <div className="text-[11px] text-gray-500 font-mono">
            {subtotalList > 0 ? Math.round((totalDiscount / subtotalList) * 100) : 0}% aggregate discount
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded p-3">
          <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Blended Gross Margin</div>
          <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
            {overallMargin}%
          </div>
          <div className="text-[11px] text-gray-500 font-mono">
            Direct Cost: ${subtotalCost.toLocaleString()}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded p-3 flex flex-col justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Margin Governance Status</div>
            <div className="mt-1">
              <span className={`text-xs font-mono px-2 py-0.5 rounded font-bold uppercase ${
                approvalStatus === 'approved' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                approvalStatus === 'pending_sa_lead' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                'bg-gray-100 text-gray-800 border border-gray-200'
              }`}>
                {approvalStatus.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
          <div className="flex gap-1.5 mt-2">
            {approvalStatus !== 'approved' ? (
              <>
                <button
                  onClick={requestApproval}
                  className="text-[11px] px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded font-semibold hover:bg-blue-100"
                >
                  Request Signoff
                </button>
                <button
                  onClick={approveBOQ}
                  className="text-[11px] px-2 py-1 bg-emerald-600 text-white rounded font-semibold hover:bg-emerald-700"
                >
                  Approve BOQ
                </button>
              </>
            ) : (
              <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Approved by Presales VP
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Header */}
      <div className="bg-white border border-gray-200 rounded p-3 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
          Bill of Quantities Line Items ({items.length})
        </h3>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportBOQCSV(opportunity)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded shadow-2xs"
            title="Download CSV Pricing Sheet"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            Export CSV
          </button>
          <button
            onClick={() => setShowAddRow(!showAddRow)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Line Item
          </button>
        </div>
      </div>

      {/* Add Row Form */}
      {showAddRow && (
        <form onSubmit={handleAddItem} className="bg-white border border-blue-200 rounded p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">Add BOQ Sizing Line</h4>
            <button type="button" onClick={() => setShowAddRow(false)} className="text-xs text-gray-500 hover:text-gray-800">&times; Cancel</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as BOQItem['category'])}
                className="enterprise-select w-full text-xs"
              >
                <option value="Cloud Infrastructure">Cloud Infrastructure</option>
                <option value="Software Licenses">Software Licenses</option>
                <option value="Hardware">Hardware</option>
                <option value="Professional Services">Professional Services</option>
                <option value="Managed Support">Managed Support</option>
                <option value="Security & Compliance">Security & Compliance</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">SKU / Item Code</label>
              <input
                type="text"
                value={itemCode}
                onChange={(e) => setItemCode(e.target.value)}
                placeholder="e.g. AWS-EKS-FARGATE"
                className="enterprise-input w-full text-xs"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Production Kubernetes Cluster (3 AZs, 64 vCPU, 256GB RAM)"
                className="enterprise-input w-full text-xs"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as BOQItem['unit'])}
                className="enterprise-select w-full text-xs"
              >
                <option value="Instances/Mo">Instances/Mo</option>
                <option value="TB/Mo">TB/Mo</option>
                <option value="Users/Yr">Users/Yr</option>
                <option value="Man-Days">Man-Days</option>
                <option value="Core-Hrs">Core-Hrs</option>
                <option value="Flat Fee">Flat Fee</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="enterprise-input w-full text-xs font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Unit Cost ($)</label>
              <input
                type="number"
                min="0"
                value={unitCost}
                onChange={(e) => setUnitCost(Number(e.target.value))}
                className="enterprise-input w-full text-xs font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Unit List Price ($)</label>
              <input
                type="number"
                min="0"
                value={unitListPrice}
                onChange={(e) => setUnitListPrice(Number(e.target.value))}
                className="enterprise-input w-full text-xs font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Discount (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                className="enterprise-input w-full text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="submit" className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded">
              Add Line Item
            </button>
          </div>
        </form>
      )}

      {/* BOQ Table */}
      <div className="bg-white border border-gray-200 rounded overflow-hidden">
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
          <tbody className="divide-y divide-gray-200 text-gray-800">
            {items.map(it => (
              <tr key={it.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-2.5 px-3">
                  <div className="font-semibold text-gray-900">{it.description}</div>
                  <div className="text-[11px] font-mono text-gray-500">{it.itemCode}</div>
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
                  ${it.unitListPrice.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-right font-mono">
                  {it.discountPercent > 0 ? (
                    <span className="text-amber-800 font-semibold">{it.discountPercent}%</span>
                  ) : (
                    <span className="text-gray-400">0%</span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900">
                  ${it.extendedPrice.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-700">
                  {it.marginPercent}%
                </td>
                <td className="py-2.5 px-3 text-center">
                  <button
                    onClick={() => handleRemoveItem(it.id)}
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
  );
};
