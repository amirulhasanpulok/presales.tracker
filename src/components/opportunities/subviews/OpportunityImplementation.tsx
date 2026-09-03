import React, { useState } from 'react';
import { Opportunity, HandoverDetails } from '../../../types';
import { 
  Layers, 
  CheckCircle2, 
  Circle, 
  User, 
  Calendar, 
  FileCheck, 
  ShieldCheck, 
  AlertTriangle,
  ArrowRight,
  Send,
  Save
} from 'lucide-react';

interface OpportunityImplementationProps {
  opportunity: Opportunity;
  onUpdateOpportunity?: (opp: Opportunity) => void;
}

export const OpportunityImplementation: React.FC<OpportunityImplementationProps> = ({
  opportunity,
  onUpdateOpportunity,
}) => {
  const [handover, setHandover] = useState<HandoverDetails>(opportunity.handover);
  const [deliveryLead, setDeliveryLead] = useState(handover.assignedDeliveryLead || '');
  const [csm, setCsm] = useState(handover.assignedCustomerSuccessManager || '');
  const [handedOverBy, setHandedOverBy] = useState(handover.handedOverBy || '');
  const [salesKAM, setSalesKAM] = useState(handover.salesKAM || opportunity.accountExecutive || '');
  const [boqVersion, setBoqVersion] = useState(handover.boqVersion || `v${opportunity.boq?.version || 1}`);
  const [technicalNotes, setTechnicalNotes] = useState(handover.technicalNotes || '');
  const [attachedDocuments, setAttachedDocuments] = useState((handover.attachedDocuments || []).join(', '));
  const [saved, setSaved] = useState(false);

  const toggleCheck = (field: 'technicalRunbookReady' | 'credentialsSecurelyTransferred' | 'customerTechKickoffScheduled') => {
    const updated = {
      ...handover,
      [field]: !handover[field]
    };
    setHandover(updated);
    if (onUpdateOpportunity) onUpdateOpportunity({ ...opportunity, handover: updated });
  };

  const completeHandover = () => {
    const updated: HandoverDetails = {
      ...handover,
      isHandedOver: true,
      status: 'handed_over',
      handoverDate: new Date().toISOString().split('T')[0],
      handedOverBy: handedOverBy || opportunity.leadSolutionArchitect,
      salesKAM,
      boqVersion,
      technicalNotes,
      attachedDocuments: attachedDocuments.split(',').map(value => value.trim()).filter(Boolean),
      assignedDeliveryLead: deliveryLead,
      assignedCustomerSuccessManager: csm,
      technicalRunbookReady: true,
      credentialsSecurelyTransferred: true,
      customerTechKickoffScheduled: true
    };
    setHandover(updated);
    if (onUpdateOpportunity) onUpdateOpportunity({ ...opportunity, handover: updated });
  };

  const saveHandover = () => {
    const updated: HandoverDetails = {
      ...handover,
      status: handover.isHandedOver ? 'handed_over' : 'ready',
      assignedDeliveryLead: deliveryLead,
      assignedCustomerSuccessManager: csm,
      handedOverBy,
      salesKAM,
      boqVersion,
      technicalNotes,
      attachedDocuments: attachedDocuments.split(',').map(value => value.trim()).filter(Boolean),
    };
    setHandover(updated);
    if (onUpdateOpportunity) onUpdateOpportunity({ ...opportunity, handover: updated, updatedAt: new Date().toISOString() });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Top Handover Status Banner */}
      <div className={`border rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        handover.isHandedOver ? 'bg-emerald-50/60 border-emerald-200' : 'bg-white border-gray-200'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
              Professional Services & Delivery Handover
            </h3>
            {handover.isHandedOver ? (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                HANDED OVER ({handover.handoverDate})
              </span>
            ) : (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold border border-amber-200">
                PENDING DELIVERY KICKOFF
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Formal technical knowledge transfer from Presales Solutions Engineering to Implementation & Customer Success.
          </p>
        </div>

        {!handover.isHandedOver && (
          <button
            onClick={completeHandover}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Complete Formal Handover
          </button>
        )}
      </div>

      {/* Sales handover record */}
      <div className="bg-white border border-gray-200 rounded p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">Sales Handover Record</h4>
          <span className="text-[10px] uppercase font-mono text-gray-500">Presales to Sales</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
          <label>
            <span className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Handed Over By</span>
            <input value={handedOverBy} onChange={e => setHandedOverBy(e.target.value)} className="enterprise-input w-full text-xs" placeholder="Presales engineer" />
          </label>
          <label>
            <span className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Sales KAM</span>
            <input value={salesKAM} onChange={e => setSalesKAM(e.target.value)} className="enterprise-input w-full text-xs" placeholder="Account executive" />
          </label>
          <label>
            <span className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">BOQ Version</span>
            <input value={boqVersion} onChange={e => setBoqVersion(e.target.value)} className="enterprise-input w-full text-xs font-mono" placeholder="v1" />
          </label>
          <label>
            <span className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Status</span>
            <select value={handover.status || (handover.isHandedOver ? 'handed_over' : 'pending')} onChange={e => setHandover({ ...handover, status: e.target.value as HandoverDetails['status'] })} className="enterprise-select w-full text-xs">
              <option value="pending">Pending</option>
              <option value="ready">Ready for Handover</option>
              <option value="handed_over">Handed Over</option>
            </select>
          </label>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 text-xs">
          <label>
            <span className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Technical Notes</span>
            <textarea value={technicalNotes} onChange={e => setTechnicalNotes(e.target.value)} rows={3} className="enterprise-input w-full text-xs resize-none" placeholder="Technical context and sales handoff notes..." />
          </label>
          <label>
            <span className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Attached Documents</span>
            <textarea value={attachedDocuments} onChange={e => setAttachedDocuments(e.target.value)} rows={3} className="enterprise-input w-full text-xs resize-none" placeholder="Document names or IDs, comma separated" />
          </label>
        </div>
        <div className="flex justify-end items-center gap-2">
          {saved && <span className="text-xs text-emerald-700 font-semibold">Saved</span>}
          <button type="button" onClick={saveHandover} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded">
            <Save className="w-3.5 h-3.5" /> Save Handover Record
          </button>
        </div>
      </div>

      {/* Handover Checklist and Delivery Assignments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Readiness Checklist */}
        <div className="bg-white border border-gray-200 rounded p-4 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-2">
            Technical Handover Gates & Criteria
          </h4>

          <div className="space-y-2.5">
            <div 
              onClick={() => toggleCheck('technicalRunbookReady')}
              className="flex items-center justify-between p-2 rounded bg-gray-50 border border-gray-200 cursor-pointer hover:bg-gray-100/80 transition-colors"
            >
              <div className="flex items-center gap-2 text-xs">
                {handover.technicalRunbookReady ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Circle className="w-4 h-4 text-gray-400" />
                )}
                <span className="font-medium text-gray-900">Technical Architecture Runbook Completed</span>
              </div>
              <span className="text-[11px] font-mono text-gray-500">SADD v2.1</span>
            </div>

            <div 
              onClick={() => toggleCheck('credentialsSecurelyTransferred')}
              className="flex items-center justify-between p-2 rounded bg-gray-50 border border-gray-200 cursor-pointer hover:bg-gray-100/80 transition-colors"
            >
              <div className="flex items-center gap-2 text-xs">
                {handover.credentialsSecurelyTransferred ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Circle className="w-4 h-4 text-gray-400" />
                )}
                <span className="font-medium text-gray-900">Lab & Cloud Sandbox Accounts Transferred</span>
              </div>
              <span className="text-[11px] font-mono text-gray-500">KMS / Vault</span>
            </div>

            <div 
              onClick={() => toggleCheck('customerTechKickoffScheduled')}
              className="flex items-center justify-between p-2 rounded bg-gray-50 border border-gray-200 cursor-pointer hover:bg-gray-100/80 transition-colors"
            >
              <div className="flex items-center gap-2 text-xs">
                {handover.customerTechKickoffScheduled ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Circle className="w-4 h-4 text-gray-400" />
                )}
                <span className="font-medium text-gray-900">Customer Engineering Kickoff Scheduled</span>
              </div>
              <span className="text-[11px] font-mono text-gray-500">Apr 09</span>
            </div>
          </div>
        </div>

        {/* Assigned Team & Risks */}
        <div className="bg-white border border-gray-200 rounded p-4 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-2">
            Delivery Leadership & Known Risks
          </h4>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Assigned Delivery Lead (PS Lead)</label>
              <input
                type="text"
                value={deliveryLead}
                onChange={(e) => setDeliveryLead(e.target.value)}
                className="enterprise-input w-full text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Customer Success Manager (CSM)</label>
              <input
                type="text"
                value={csm}
                onChange={(e) => setCsm(e.target.value)}
                className="enterprise-input w-full text-xs"
              />
            </div>

              <div className="pt-2 border-t border-gray-100">
                <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-1">Known Architecture Nuances / Risks</div>
                {handover.knownTechnicalDebtOrRisks.length > 0 ? <div className="space-y-1">{handover.knownTechnicalDebtOrRisks.map((risk, index) => <p key={index} className="text-xs text-gray-600 bg-amber-50/50 p-2 rounded border border-amber-200">{risk}</p>)}</div> : <p className="text-xs text-gray-400 italic">No delivery risks recorded.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
