import React from 'react';
import { ArrowRightLeft, CheckCircle2, Clock, AlertTriangle, ExternalLink, ShieldCheck, Check, UserCheck } from 'lucide-react';
import { Opportunity } from '../../types';
import { formatCurrency } from '../../utils/currency';

interface HandoverQueueProps {
  opportunities: Opportunity[];
  onSelectOpportunity: (opp: Opportunity) => void;
  onUpdateOpportunity: (opp: Opportunity) => void;
}

export const HandoverQueue: React.FC<HandoverQueueProps> = ({
  opportunities,
  onSelectOpportunity,
  onUpdateOpportunity
}) => {
  // Won deals or deals in negotiation approaching handover
  const candidateOpps = opportunities.filter(o => o.stage === 'closed_won' || o.stage === 'commercial_negotiation');

  const pendingHandoverCount = candidateOpps.filter(o => !o.handover.isHandedOver).length;
  const completedCount = candidateOpps.filter(o => o.handover.isHandedOver).length;

  const handleToggleHandoverItem = (opp: Opportunity, field: keyof Opportunity['handover']) => {
    onUpdateOpportunity({
      ...opp,
      handover: {
        ...opp.handover,
        [field]: !opp.handover[field]
      },
      updatedAt: new Date().toISOString()
    });
  };

  return (
    <div className="space-y-4">
      
      {/* Top Banner */}
      <div className="bg-white border border-gray-200 rounded p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-emerald-600" />
            <div>
              <h1 className="text-base font-bold text-gray-900 tracking-tight">Post-Sales Technical Implementation Handover Queue</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Technical knowledge transfer gate from Presales to Professional Services, Delivery, and Customer Success.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
              {pendingHandoverCount} Gates Pending
            </span>
            <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
              {completedCount} Fully Handed Over
            </span>
          </div>
        </div>

        {/* Informational Guidance Box */}
        <div className="bg-gray-50 p-2.5 rounded border border-gray-200 text-xs text-gray-700 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>
            <strong>Strict Handover Criteria:</strong> Architectural Runbooks must be uploaded, AWS/GCP IAM credentials securely transferred to Delivery Leads, and Customer Technical Kickoff booked before deals transition out of Presales accountability.
          </span>
        </div>
      </div>

      {/* Handover Cards */}
      <div className="space-y-3">
        {candidateOpps.length === 0 ? (
          <div className="p-8 text-center text-gray-500 font-mono text-xs bg-white border border-gray-200 rounded">
            No closed-won or late-stage opportunities pending delivery handover.
          </div>
        ) : (
          candidateOpps.map((opp) => {
            const isHandedOver = opp.handover.isHandedOver;

            return (
              <div
                key={opp.id}
                className={`bg-white border rounded p-4 space-y-3 transition-colors shadow-2xs ${
                  isHandedOver ? 'border-emerald-200 bg-emerald-50/20' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-700">{opp.code}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${
                        isHandedOver ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {isHandedOver ? 'HANDOVER COMPLETED' : 'HANDOVER IN PROGRESS'}
                      </span>
                      <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-gray-100 text-gray-700 border border-gray-200">
                         {formatCurrency(opp.contractValue)} TCV
                      </span>
                    </div>

                    <h3
                      onClick={() => onSelectOpportunity(opp)}
                      className="text-sm font-bold text-gray-900 mt-1 hover:text-blue-700 cursor-pointer transition-colors"
                    >
                      {opp.name}
                    </h3>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Client: <strong className="text-gray-800">{opp.clientName}</strong> • Lead SA: <strong className="text-gray-800">{opp.leadSolutionArchitect}</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectOpportunity(opp)}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-xs font-semibold flex items-center gap-1"
                  >
                    <span>Inspect Handover</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                {/* Assigned Delivery Leads */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px] bg-gray-50 p-2.5 rounded border border-gray-200">
                  <div>
                    <span className="text-gray-500 font-sans font-medium">Assigned PS Delivery Lead:</span>
                    <div className="text-gray-900 font-semibold mt-0.5">{opp.handover.assignedDeliveryLead || 'Unassigned'}</div>
                  </div>
                  <div>
                    <span className="text-gray-500 font-sans font-medium">Customer Kickoff Date:</span>
                    <div className="text-emerald-700 font-bold mt-0.5">{opp.handover.kickoffDate || 'Pending Scheduling'}</div>
                  </div>
                  <div>
                    <span className="text-gray-500 font-sans font-medium">Target Tech Stack:</span>
                    <div className="text-blue-700 truncate mt-0.5">{opp.primaryTechStack} ({opp.secondaryTechnologies?.slice(0, 2).join(', ')})</div>
                  </div>
                </div>

                {/* Interactive Checklist */}
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-gray-700 mb-1">Presales Technical Handover Checklist</div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { key: 'technicalRunbookReady' as const, label: 'Technical SOW & Architectural Runbook Documented' },
                      { key: 'credentialsSecurelyTransferred' as const, label: 'Cloud IAM / Sandbox Credentials Transferred' },
                      { key: 'customerTechKickoffScheduled' as const, label: 'Customer Technical Kickoff Meeting Scheduled' },
                      { key: 'isHandedOver' as const, label: 'Formal Presales Sign-off & Delivery Accepted' }
                    ].map(item => {
                      const checked = !!opp.handover[item.key];
                      return (
                        <div
                          key={item.key}
                          onClick={() => handleToggleHandoverItem(opp, item.key)}
                          className={`p-2.5 rounded border cursor-pointer flex items-center gap-2.5 text-xs transition-colors ${
                            checked ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-medium' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                            checked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-gray-400 bg-white'
                          }`}>
                            {checked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="font-medium text-gray-800">{item.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
