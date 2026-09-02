import React from 'react';
import { Opportunity, OpportunityStage } from '../../types';
import { STAGE_CONFIG } from '../../data/mockData';
import { PriorityBadge, POCBadge, ComplexityBadge } from '../common/Badge';
import { Clock, AlertTriangle, ArrowRight, DollarSign, User } from 'lucide-react';

interface OpportunityBoardProps {
  opportunities: Opportunity[];
  onSelectOpportunity: (opp: Opportunity) => void;
  onUpdateStage: (oppId: string, newStage: OpportunityStage) => void;
}

export const OpportunityBoard: React.FC<OpportunityBoardProps> = ({
  opportunities,
  onSelectOpportunity,
  onUpdateStage
}) => {
  const stages: OpportunityStage[] = [
    'qualification',
    'tech_discovery',
    'solution_design',
    'poc_demo',
    'proposal_boq',
    'commercial_negotiation',
    'closed_won'
  ];

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`;
    return `$${(amount / 1000).toFixed(0)}k`;
  };

  return (
    <div className="flex-1 overflow-x-auto bg-gray-100/70 p-4">
      <div className="flex gap-3 min-w-[1750px] h-full">
        {stages.map((stageKey) => {
          const config = STAGE_CONFIG[stageKey];
          const stageOpps = opportunities.filter(o => o.stage === stageKey);
          const stageValue = stageOpps.reduce((acc, o) => acc + o.contractValue, 0);

          return (
            <div
              key={stageKey}
              className="flex-1 flex flex-col min-w-[245px] max-w-[270px] bg-gray-50 border border-gray-200 rounded-md overflow-hidden shadow-xs"
            >
              {/* Stage Header */}
              <div className="p-2.5 bg-white border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`w-2 h-2 rounded-full ${config.color.replace('text-', 'bg-')}`} />
                    <h3 className="text-xs font-mono font-bold text-gray-900 truncate">
                      {config.shortLabel}
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-gray-100 text-gray-700 border border-gray-200 font-semibold">
                    {stageOpps.length}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-gray-500 mt-1">
                  <span>Total Pipeline:</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(stageValue)}</span>
                </div>
              </div>

              {/* Opportunity Cards List */}
              <div className="flex-1 p-2 overflow-y-auto space-y-2">
                {stageOpps.length === 0 ? (
                  <div className="h-32 border border-dashed border-gray-300 rounded flex flex-col items-center justify-center text-gray-400 text-xs font-mono">
                    <span>No active deals</span>
                  </div>
                ) : (
                  stageOpps.map((opp) => {
                    const hasOverdueActions = opp.actionItems.some(a => !a.isCompleted && new Date(a.dueDate) < new Date());

                    return (
                      <div
                        key={opp.id}
                        onClick={() => onSelectOpportunity(opp)}
                        className="bg-white hover:bg-blue-50/40 border border-gray-200 hover:border-blue-300 rounded p-2.5 text-xs transition-all cursor-pointer shadow-2xs group"
                      >
                        {/* Top Code & Priority */}
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="font-mono text-[11px] font-bold text-blue-700">
                            {opp.code}
                          </span>
                          <PriorityBadge priority={opp.priority} />
                        </div>

                        {/* Deal Name & Client */}
                        <h4 className="font-semibold text-gray-900 text-xs group-hover:text-blue-700 transition-colors line-clamp-2 leading-snug">
                          {opp.name}
                        </h4>
                        <div className="text-[11px] font-medium text-gray-600 mt-0.5 truncate">
                          {opp.clientName}
                        </div>

                        {/* Tech Stack pills */}
                        <div className="flex flex-wrap items-center gap-1 mt-2">
                          <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                            {opp.primaryTechStack}
                          </span>
                          <ComplexityBadge complexity={opp.dealComplexity} />
                        </div>

                        {/* POC Badge if active */}
                        {opp.poc.status !== 'not_started' && (
                          <div className="mt-2">
                            <POCBadge status={opp.poc.status} />
                          </div>
                        )}

                        {/* Financials & Win % */}
                        <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-100 text-[11px] font-mono">
                          <div className="font-semibold text-gray-900">
                            ${opp.contractValue.toLocaleString()}
                          </div>
                          <div className="text-emerald-700 font-semibold">
                            {opp.winProbability}% Win
                          </div>
                        </div>

                        {/* Footer: Lead SA & Stage Aging */}
                        <div className="flex items-center justify-between pt-1.5 mt-1 text-[10px] text-gray-500">
                          <div className="flex items-center gap-1">
                            {opp.leadArchitectAvatar ? (
                              <img
                                src={opp.leadArchitectAvatar}
                                alt={opp.leadSolutionArchitect}
                                className="w-4 h-4 rounded-full object-cover"
                              />
                            ) : (
                              <User className="w-3 h-3 text-gray-400" />
                            )}
                            <span className="truncate max-w-[90px] font-medium text-gray-700">{opp.leadSolutionArchitect.split(' ')[0]}</span>
                          </div>

                          <div className="flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span>{opp.daysInCurrentStage}d</span>
                          </div>
                        </div>

                        {/* SLA Warning */}
                        {hasOverdueActions && (
                          <div className="mt-1.5 flex items-center gap-1 text-[10px] font-mono text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Overdue Action SLA</span>
                          </div>
                        )}

                        {/* Fast Move Trigger */}
                        <div className="mt-2 pt-1.5 border-t border-gray-100 flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={opp.stage}
                            onChange={(e) => onUpdateStage(opp.id, e.target.value as OpportunityStage)}
                            aria-label={`Advance stage for ${opp.code}`}
                            className="bg-gray-50 border border-gray-200 text-gray-600 hover:text-gray-900 text-[10px] font-mono px-1.5 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="" disabled>Advance stage...</option>
                            {Object.entries(STAGE_CONFIG).map(([k, v]) => (
                              <option key={k} value={k}>{v.shortLabel}</option>
                            ))}
                          </select>
                        </div>

                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
