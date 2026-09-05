import React, { useState } from 'react';
import { CheckSquare, AlertTriangle, Clock, Plus, Check, Filter, ExternalLink, User } from 'lucide-react';
import { Opportunity, ActionItem } from '../../types';
import { PriorityBadge } from '../common/Badge';

interface ActionCenterProps {
  opportunities: Opportunity[];
  onSelectOpportunity: (opp: Opportunity) => void;
  onUpdateOpportunity: (opp: Opportunity) => void;
}

export const ActionCenter: React.FC<ActionCenterProps> = ({
  opportunities,
  onSelectOpportunity,
  onUpdateOpportunity
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showCompleted, setShowCompleted] = useState<boolean>(false);

  // Flatten all action items with their parent opportunity metadata
  const allActions = opportunities.flatMap(opp => 
    opp.actionItems.map(act => ({
      ...act,
      opportunityId: opp.id,
      opportunityCode: opp.code,
      opportunityName: opp.name,
      clientName: opp.clientName,
      leadSA: opp.leadSolutionArchitect,
      oppRef: opp
    }))
  );

  const filteredActions = allActions.filter(act => {
    if (!showCompleted && act.isCompleted) return false;
    if (filterCategory !== 'all' && act.category !== filterCategory) return false;
    return true;
  }).sort((a, b) => {
    // Sort by overdue first, then due date
    const aOverdue = !a.isCompleted && new Date(a.dueDate) < new Date();
    const bOverdue = !b.isCompleted && new Date(b.dueDate) < new Date();
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const handleToggleTask = (act: typeof allActions[0]) => {
    const targetOpp = act.oppRef;
    const updatedActions = targetOpp.actionItems.map(a => 
      a.id === act.id ? { ...a, isCompleted: !a.isCompleted } : a
    );

    onUpdateOpportunity({
      ...targetOpp,
      actionItems: updatedActions,
      updatedAt: new Date().toISOString()
    });
  };

  const overdueCount = allActions.filter(a => !a.isCompleted && new Date(a.dueDate) < new Date()).length;
  const pendingCount = allActions.filter(a => !a.isCompleted).length;

  return (
    <div className="space-y-4">
      
      {/* Header Banner */}
       <div className="bg-white border border-gray-200 rounded p-3 sm:p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-blue-600" />
            <div>
              <h1 className="text-base font-bold text-gray-900 tracking-tight">Presales Action Center & SLA Task Queue</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Centralized SLA task queue for architecture designs, security questionnaires, BOQ deliveries, and customer commitments.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            {overdueCount > 0 && (
              <span className="px-2.5 py-1 rounded bg-rose-50 text-rose-800 border border-rose-200 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {overdueCount} Overdue Tasks
              </span>
            )}
            <span className="px-2.5 py-1 rounded bg-blue-50 text-blue-800 border border-blue-200 font-semibold">
              {pendingCount} Pending Actions
            </span>
          </div>
        </div>

        {/* Filter controls */}
         <div className="mobile-filter-scroll flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100 text-xs">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="enterprise-select font-mono text-xs py-1"
          >
            <option value="all">Category: All Categories</option>
            <option value="Architecture">Architecture</option>
            <option value="Sizing & BOQ">Sizing & BOQ</option>
            <option value="Security / Compliance">Security / Compliance</option>
            <option value="Customer Follow-up">Customer Follow-up</option>
            <option value="Legal / SOW">Legal / SOW</option>
            <option value="POC Execution">POC Execution</option>
          </select>

          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className={`px-3 py-1 rounded border text-xs font-medium transition-colors ${
              showCompleted 
                ? 'bg-blue-50 text-blue-700 border-blue-300' 
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {showCompleted ? 'Showing Completed' : 'Hide Completed'}
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2.5">
        {filteredActions.length === 0 ? (
          <div className="p-8 text-center text-gray-500 font-mono text-xs bg-white border border-gray-200 rounded">
            No action items match the current filters.
          </div>
        ) : (
          filteredActions.map((act) => {
            const isOverdue = !act.isCompleted && new Date(act.dueDate) < new Date();

            return (
              <div
                key={`${act.opportunityId}-${act.id}`}
                className={`p-3.5 rounded border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs ${
                  act.isCompleted 
                    ? 'bg-gray-50 border-gray-200 opacity-60' 
                    : isOverdue 
                    ? 'bg-rose-50/50 border-rose-200' 
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Left checkbox & title */}
                <div className="flex items-start gap-3 min-w-0">
                  <button
                    onClick={() => handleToggleTask(act)}
                    className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border transition-colors flex-shrink-0 ${
                      act.isCompleted 
                        ? 'bg-blue-600 border-blue-600 text-white' 
                        : isOverdue
                        ? 'border-rose-400 bg-white'
                        : 'border-gray-400 bg-white hover:border-gray-600'
                    }`}
                  >
                    {act.isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-semibold text-xs ${act.isCompleted ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                        {act.title}
                      </span>
                      <PriorityBadge priority={act.priority} />
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                        {act.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-gray-500 font-mono mt-1 flex-wrap">
                      <span className="text-blue-700 font-bold">{act.opportunityCode}</span>
                      <span>•</span>
                      <span className="text-gray-700">{act.clientName}</span>
                      <span>•</span>
                      <span>Assigned: <strong className="text-gray-900">{act.assignedTo}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Right Due date & inspect */}
                <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-100">
                  <div className="text-right font-mono text-xs">
                    <div className={`flex items-center gap-1 ${isOverdue ? 'text-rose-700 font-bold' : 'text-gray-600'}`}>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{act.dueDate}</span>
                    </div>
                    {isOverdue && (
                      <span className="text-[10px] text-rose-700 font-bold uppercase">OVERDUE SLA</span>
                    )}
                  </div>

                  <button
                    onClick={() => onSelectOpportunity(act.oppRef)}
                    className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
                    title="Open Opportunity Details"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
