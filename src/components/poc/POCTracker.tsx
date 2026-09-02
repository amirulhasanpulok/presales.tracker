import React from 'react';
import { FlaskConical, CheckCircle2, AlertTriangle, ExternalLink, Clock, ShieldCheck, Plus, Check } from 'lucide-react';
import { Opportunity, POCStatus } from '../../types';
import { POCBadge } from '../common/Badge';

interface POCTrackerProps {
  opportunities: Opportunity[];
  onSelectOpportunity: (opp: Opportunity) => void;
  onUpdateOpportunity: (opp: Opportunity) => void;
}

export const POCTracker: React.FC<POCTrackerProps> = ({
  opportunities,
  onSelectOpportunity,
  onUpdateOpportunity
}) => {
  const pocOpps = opportunities.filter(o => o.poc.status !== 'not_started');
  
  const activeCount = opportunities.filter(o => ['active_testing', 'scoping', 'provisioning', 'validating_kpis'].includes(o.poc.status)).length;
  const passedCount = opportunities.filter(o => o.poc.status === 'passed').length;
  const totalBudget = opportunities.reduce((acc, o) => acc + (o.poc.allocatedBudget || 0), 0);

  const handleToggleCriterion = (opp: Opportunity, critId: string) => {
    const updatedCrit = opp.poc.successCriteria.map(c => 
      c.id === critId ? { ...c, verified: !c.verified, verifiedByCustomer: !c.verified ? opp.leadSolutionArchitect : undefined } : c
    );
    onUpdateOpportunity({
      ...opp,
      poc: { ...opp.poc, successCriteria: updatedCrit },
      updatedAt: new Date().toISOString()
    });
  };

  return (
    <div className="space-y-4">
      
      {/* Top Banner */}
      <div className="bg-white border border-gray-200 rounded p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-amber-600" />
            <div>
              <h1 className="text-base font-bold text-gray-900 tracking-tight">Proof of Concept (POC) & Sandbox Control Hub</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Manage technical validation trials, customer benchmark criteria, lab budgets, and blocker resolutions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
              {activeCount} Active Sandbox Labs
            </span>
            <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
              {passedCount} Verified Passed
            </span>
          </div>
        </div>

        {/* Aggregate Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-gray-100 text-xs font-mono">
          <div className="bg-gray-50 p-2.5 rounded border border-gray-200">
            <span className="text-gray-500 text-[11px] font-sans font-medium">Total Lab Budget Allocated:</span>
            <div className="text-sm font-bold text-gray-900">${totalBudget.toLocaleString()}</div>
          </div>
          <div className="bg-gray-50 p-2.5 rounded border border-gray-200">
            <span className="text-gray-500 text-[11px] font-sans font-medium">Average Validation Duration:</span>
            <div className="text-sm font-bold text-gray-900">22.4 Days</div>
          </div>
          <div className="bg-gray-50 p-2.5 rounded border border-gray-200">
            <span className="text-gray-500 text-[11px] font-sans font-medium">Overall POC-to-Win Conversion:</span>
            <div className="text-sm font-bold text-emerald-700">87.5%</div>
          </div>
        </div>
      </div>

      {/* POC Deal Cards */}
      <div className="space-y-3">
        {pocOpps.length === 0 ? (
          <div className="p-8 text-center text-gray-500 font-mono text-xs bg-white border border-gray-200 rounded">
            No active POCs in the pipeline currently.
          </div>
        ) : (
          pocOpps.map((opp) => {
            const passedCriteria = opp.poc.successCriteria.filter(c => c.verified).length;
            const totalCriteria = opp.poc.successCriteria.length;
            const hasBlocker = opp.poc.blockers.some(b => !b.resolved);

            return (
              <div
                key={opp.id}
                className="bg-white border border-gray-200 rounded p-4 space-y-3 hover:border-gray-300 transition-colors shadow-2xs"
              >
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-700">{opp.code}</span>
                      <POCBadge status={opp.poc.status} />
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                        {opp.primaryTechStack}
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

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectOpportunity(opp)}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-xs font-semibold flex items-center gap-1"
                    >
                      <span>Inspect Lab</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Sandbox Info */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px] bg-gray-50 p-2.5 rounded border border-gray-200">
                  <div>
                    <span className="text-gray-500 font-sans font-medium">Benchmark Window:</span>
                    <div className="text-gray-900 font-semibold mt-0.5">{opp.poc.startDate || 'TBD'} → {opp.poc.targetEndDate || 'TBD'}</div>
                  </div>
                  <div>
                    <span className="text-gray-500 font-sans font-medium">Sandbox Environment:</span>
                    <div className="text-blue-700 truncate mt-0.5">{opp.poc.environmentUrl || 'Internal Cluster'}</div>
                  </div>
                  <div>
                    <span className="text-gray-500 font-sans font-medium">Cloud Lab Budget:</span>
                    <div className="text-emerald-700 font-bold mt-0.5">${opp.poc.allocatedBudget?.toLocaleString()}</div>
                  </div>
                </div>

                {/* Criteria Checklist */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-700">Customer Success Criteria ({passedCriteria}/{totalCriteria} Passed)</span>
                    <span className="text-gray-500 font-mono text-[11px] font-bold">
                      {totalCriteria > 0 ? Math.round((passedCriteria / totalCriteria) * 100) : 0}% Complete
                    </span>
                  </div>

                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                    <div 
                      className="h-full bg-emerald-600 rounded-full transition-all"
                      style={{ width: `${totalCriteria > 0 ? (passedCriteria / totalCriteria) * 100 : 0}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                    {opp.poc.successCriteria.map((crit) => (
                      <div
                        key={crit.id}
                        onClick={() => handleToggleCriterion(opp, crit.id)}
                        className={`p-2 rounded border cursor-pointer flex items-start gap-2 text-xs transition-colors ${
                          crit.verified ? 'bg-emerald-50/70 border-emerald-300' : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border ${
                          crit.verified ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-gray-400 bg-white'
                        }`}>
                          {crit.verified && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium ${crit.verified ? 'text-gray-900 font-semibold' : 'text-gray-800'}`}>{crit.description}</div>
                          <div className="text-[10px] font-mono text-gray-500 mt-0.5">Target: {crit.targetMetric}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Blocker Alert if present */}
                {hasBlocker && (
                  <div className="flex items-center gap-2 p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-800 text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>Active technical blocker detected: {opp.poc.blockers.find(b=>!b.resolved)?.description}</span>
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
