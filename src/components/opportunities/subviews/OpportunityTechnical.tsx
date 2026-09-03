import React, { useState } from 'react';
import { Opportunity } from '../../../types';
import { 
  Cpu, 
  ShieldCheck, 
  CheckCircle2, 
  FlaskConical, 
  AlertTriangle, 
  Server, 
  Layers,
  Lock,
  Plus
} from 'lucide-react';
import { POCBadge, TechFitBadge } from '../../common/Badge';

interface OpportunityTechnicalProps {
  opportunity: Opportunity;
  onUpdateOpportunity?: (opp: Opportunity) => void;
}

export const OpportunityTechnical: React.FC<OpportunityTechnicalProps> = ({
  opportunity,
  onUpdateOpportunity,
}) => {
  const [poc, setPoc] = useState(() => ({
    status: 'not_started',
    successCriteria: [],
    blockers: [],
    ...(opportunity.poc || {}),
  }));
  const [secReviewStatus, setSecReviewStatus] = useState(opportunity.securityReviewStatus);

  const toggleKPI = (kpiId: string) => {
    const updatedCriteria = poc.successCriteria.map(k => 
      k.id === kpiId ? { ...k, verified: !k.verified } : k
    );
    const updatedPOC = { ...poc, successCriteria: updatedCriteria };
    setPoc(updatedPOC);
    if (onUpdateOpportunity) onUpdateOpportunity({ ...opportunity, poc: updatedPOC });
  };

  const resolveBlocker = (blockerId: string) => {
    const updatedBlockers = poc.blockers.map(b => 
      b.id === blockerId ? { ...b, resolved: !b.resolved } : b
    );
    const updatedPOC = { ...poc, blockers: updatedBlockers };
    setPoc(updatedPOC);
    if (onUpdateOpportunity) onUpdateOpportunity({ ...opportunity, poc: updatedPOC });
  };

  return (
    <div className="space-y-4">
      {/* Top Architecture Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-gray-200 rounded p-3">
          <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Primary Platform & Cloud</div>
          <div className="text-base font-bold font-mono text-gray-900 mt-1 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-600" />
            {opportunity.primaryTechStack}
          </div>
          <div className="text-[11px] text-gray-500 mt-0.5">
            Region: {opportunity.region}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded p-3">
          <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Technical Fit & Feasibility</div>
          <div className="mt-1.5">
            <TechFitBadge score={opportunity.technicalFitScore} />
          </div>
          <div className="text-[11px] text-gray-500 mt-1">
            Complexity Level: <strong className="uppercase font-mono text-gray-700">{opportunity.dealComplexity}</strong>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded p-3">
          <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">InfoSec Clearance</div>
          <div className="text-base font-bold font-mono text-emerald-700 mt-1 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            {secReviewStatus}
          </div>
          <div className="text-[11px] text-gray-500 mt-0.5">
            {opportunity.complianceRequirements.join(', ')}
          </div>
        </div>
      </div>

      {/* Target Architecture Specification */}
      <div className="bg-white border border-gray-200 rounded p-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-2.5 flex items-center justify-between">
          <span>Target Architecture Blueprint</span>
          <span className="text-[11px] font-mono text-blue-700 font-medium">SADD Specification v2.4</span>
        </h3>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Proposed Solution Details</div>
            <p className="text-xs text-gray-700 mt-1 leading-relaxed bg-gray-50 p-3 rounded border border-gray-200">
              {opportunity.proposedArchitecture}
            </p>
          </div>

          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Current Legacy Stack & Migration Bottlenecks</div>
            <p className="text-xs text-gray-700 mt-1 leading-relaxed bg-gray-50 p-3 rounded border border-gray-200">
              {opportunity.currentLegacyStack}
            </p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Validated Tech Stack Components</div>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {opportunity.technologies.map((t, idx) => (
              <span key={idx} className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 font-mono text-xs font-semibold border border-blue-200">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* POC / Sandbox Validation Test Matrix */}
      <div className="bg-white border border-gray-200 rounded p-4">
        <div className="flex items-center justify-between border-b border-gray-200 pb-2.5">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
              <FlaskConical className="w-3.5 h-3.5 text-amber-600" />
              POC Benchmark Matrix & Success Criteria
            </h3>
          </div>
          <POCBadge status={poc.status} />
        </div>

        {/* Success Criteria Items */}
        <div className="mt-3 overflow-x-auto border border-gray-200 rounded">
           <table className="hidden md:table w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 border-b border-gray-200 text-[11px] font-semibold uppercase tracking-wider">
                <th className="py-2 px-3 w-10 text-center">Verified</th>
                <th className="py-2 px-3">Category</th>
                <th className="py-2 px-3">Criteria Description</th>
                <th className="py-2 px-3">Target Threshold</th>
                <th className="py-2 px-3">Customer Benchmark Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-800">
              {poc.successCriteria.map(kpi => (
                <tr 
                  key={kpi.id} 
                  onClick={() => toggleKPI(kpi.id)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="py-2 px-3 text-center" onClick={(e) => { e.stopPropagation(); toggleKPI(kpi.id); }}>
                    <input
                      type="checkbox"
                      checked={kpi.verified}
                      onChange={() => toggleKPI(kpi.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <span className="inline-flex items-center text-[11px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-800 font-mono border border-gray-200">
                      {kpi.category}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-semibold text-gray-900">
                    {kpi.description}
                  </td>
                  <td className="py-2 px-3 font-mono text-gray-600">
                    {kpi.targetMetric}
                  </td>
                  <td className="py-2 px-3 font-mono font-bold text-emerald-700">
                    {kpi.actualMetric || (kpi.verified ? 'Passed' : 'In Progress')}
                  </td>
                </tr>
              ))}
            </tbody>
           </table>
           <div className="md:hidden p-2 space-y-2">
             {poc.successCriteria.map(kpi => <article key={kpi.id} onClick={() => toggleKPI(kpi.id)} className={`border rounded p-3 space-y-2 ${kpi.verified ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white border-gray-200'}`}>
               <div className="flex items-start gap-2"><input type="checkbox" checked={kpi.verified} onChange={() => toggleKPI(kpi.id)} onClick={e => e.stopPropagation()} className="mt-0.5 rounded border-gray-300 text-blue-600" /><div className="min-w-0 flex-1"><div className="text-[10px] uppercase text-gray-500 font-mono">{kpi.category}</div><div className="text-xs font-semibold text-gray-900 break-words">{kpi.description}</div></div></div>
               <div className="grid grid-cols-2 gap-2 text-[11px]"><div><span className="block text-gray-500">Target</span><strong className="font-mono">{kpi.targetMetric}</strong></div><div><span className="block text-gray-500">Result</span><strong className="font-mono text-emerald-700">{kpi.actualMetric || (kpi.verified ? 'Passed' : 'In Progress')}</strong></div></div>
             </article>)}
           </div>
        </div>

        {/* POC Blockers */}
        {poc.blockers.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-red-700 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Active Technical Lab Blockers ({poc.blockers.filter(b => !b.resolved).length})
            </h4>

            <div className="mt-2 space-y-2">
              {poc.blockers.map(blocker => (
                <div 
                  key={blocker.id}
                  onClick={() => resolveBlocker(blocker.id)}
                  className={`p-2.5 rounded border text-xs cursor-pointer flex items-center justify-between ${
                    blocker.resolved ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-red-50/60 border-red-200 text-red-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={blocker.resolved}
                      onChange={() => resolveBlocker(blocker.id)}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className={blocker.resolved ? 'line-through text-gray-500' : 'font-semibold'}>
                      {blocker.description}
                    </span>
                  </div>

                  <div className="text-[11px] font-mono flex items-center gap-2">
                    <span className="text-gray-500">Owner: {blocker.owner}</span>
                    <span className={`px-1.5 py-0.2 rounded font-bold uppercase ${
                      blocker.resolved ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {blocker.resolved ? 'Resolved' : blocker.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
