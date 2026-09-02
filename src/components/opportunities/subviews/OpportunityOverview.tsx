import React from 'react';
import { Opportunity } from '../../../types';
import { 
  Building2, 
  DollarSign, 
  Calendar, 
  Users, 
  ShieldCheck, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  Cpu, 
  ArrowRight,
  Sparkles,
  TrendingUp,
  FileCheck
} from 'lucide-react';
import { ComplexityBadge, PriorityBadge, StageBadge, TechFitBadge } from '../../common/Badge';

interface OpportunityOverviewProps {
  opportunity: Opportunity;
  onAdvanceStage?: () => void;
  onNavigateSubView: (subview: any) => void;
}

export const OpportunityOverview: React.FC<OpportunityOverviewProps> = ({
  opportunity,
  onAdvanceStage,
  onNavigateSubView,
}) => {
  const pendingActions = opportunity.actionItems.filter(a => !a.isCompleted);
  const openBlockers = opportunity.poc.blockers.filter(b => !b.resolved);
  const verifiedKPIs = opportunity.poc.successCriteria.filter(k => k.verified).length;
  const totalKPIs = opportunity.poc.successCriteria.length;

  return (
    <div className="space-y-4">
      {/* Top Banner KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded p-3">
          <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Total Contract Value</div>
          <div className="text-xl font-bold font-mono text-gray-900 mt-1">
            ${(opportunity.contractValue / 1000).toLocaleString()}k
          </div>
          <div className="text-[11px] text-gray-500 font-mono mt-0.5">
            ARR: ${(opportunity.arr / 1000).toLocaleString()}k/yr
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded p-3">
          <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Win Probability</div>
          <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
            {opportunity.winProbability}%
          </div>
          <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1">
            <TechFitBadge score={opportunity.technicalFitScore} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded p-3">
          <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Expected Close</div>
          <div className="text-base font-bold font-mono text-gray-900 mt-1">
            {opportunity.expectedCloseDate}
          </div>
          <div className="text-[11px] text-gray-500 mt-0.5">
            {opportunity.daysInCurrentStage} days in current stage
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded p-3">
          <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">POC Validation</div>
          <div className="text-base font-bold font-mono text-gray-900 mt-1 flex items-center gap-1.5">
            {verifiedKPIs}/{totalKPIs} KPIs Met
            {openBlockers.length > 0 && (
              <span className="text-[11px] px-1.5 py-0.2 rounded bg-red-100 text-red-700 font-normal">
                {openBlockers.length} Blocker
              </span>
            )}
          </div>
          <div className="text-[11px] text-blue-700 font-medium mt-0.5 cursor-pointer hover:underline" onClick={() => onNavigateSubView('technical')}>
            Review Test Matrix &rarr;
          </div>
        </div>
      </div>

      {/* Main Grid: Architecture & Technical Scope vs Engagement Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Proposed Architecture & Requirements */}
        <div className="lg:col-span-2 space-y-4">
          {/* Solution Architecture Summary Card */}
          <div className="bg-white border border-gray-200 rounded p-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-blue-600" />
                Proposed Target Architecture
              </h3>
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-800 font-mono font-semibold border border-gray-200">
                {opportunity.primaryTechStack}
              </span>
            </div>

            <p className="text-xs text-gray-700 mt-3 leading-relaxed">
              {opportunity.proposedArchitecture}
            </p>

            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Core Technologies & Infrastructure</div>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {opportunity.technologies.map((tech, idx) => (
                  <span key={idx} className="px-2 py-0.5 text-xs font-mono rounded bg-blue-50 text-blue-700 border border-blue-200">
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Legacy / Existing Baseline</div>
              <p className="text-xs text-gray-600 mt-1 font-mono bg-gray-50 p-2 rounded border border-gray-200">
                {opportunity.currentLegacyStack}
              </p>
            </div>
          </div>

          {/* Key Technical Requirements & Compliance */}
          <div className="bg-white border border-gray-200 rounded p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 border-b border-gray-200 pb-2.5">
              Key Technical Requirements & Compliance Mandates
            </h3>

            <div className="mt-3 space-y-2">
              {opportunity.keyTechnicalRequirements.map((req, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-gray-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>{req}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-200 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Required Compliance:</span>
              {opportunity.complianceRequirements.map((c, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-medium">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  {c}
                </span>
              ))}
              <span className="ml-auto text-[11px] font-mono font-semibold text-gray-700">
                Security Review: <strong className="text-emerald-700">{opportunity.securityReviewStatus}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Key People, Pending SLAs & Quick Actions */}
        <div className="space-y-4">
          {/* Owners & Stakeholders */}
          <div className="bg-white border border-gray-200 rounded p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 border-b border-gray-200 pb-2.5">
              Deal Team & Assigned Leads
            </h3>

            <div className="mt-3 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <div className="text-[10px] text-gray-400 uppercase font-semibold">Lead Solution Architect</div>
                  <div className="font-bold text-gray-900">{opportunity.leadSolutionArchitect}</div>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                  Technical Lead
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div>
                  <div className="text-[10px] text-gray-400 uppercase font-semibold">Account Executive / KAM</div>
                  <div className="font-bold text-gray-900">{opportunity.accountExecutive}</div>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                  Commercial
                </span>
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-600">{opportunity.stakeholders.length} Buying Center Stakeholders</span>
                <button 
                  onClick={() => onNavigateSubView('stakeholders')}
                  className="text-xs font-semibold text-blue-700 hover:underline"
                >
                  View Matrix &rarr;
                </button>
              </div>
            </div>
          </div>

          {/* Pending SLA Action Items */}
          <div className="bg-white border border-gray-200 rounded p-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800">
                Action Items ({pendingActions.length})
              </h3>
              <button 
                onClick={() => onNavigateSubView('tasks')}
                className="text-xs font-medium text-blue-700 hover:underline"
              >
                All Tasks &rarr;
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {pendingActions.slice(0, 3).map(task => (
                <div key={task.id} className="p-2 rounded bg-gray-50 border border-gray-200 text-xs">
                  <div className="font-medium text-gray-900">{task.title}</div>
                  <div className="flex items-center justify-between mt-1 text-[11px] text-gray-500">
                    <span>Due: {task.dueDate}</span>
                    <span className="font-mono text-amber-800 font-semibold">{task.category}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sizing & Handover Readiness */}
          <div className="bg-white border border-gray-200 rounded p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 border-b border-gray-200 pb-2.5">
              BOQ & Handover Readiness
            </h3>

            <div className="mt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">BOQ Items Configured:</span>
                <strong className="font-mono text-gray-900">{opportunity.boq.items.length} line items</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Blended Margin:</span>
                <strong className="font-mono text-emerald-700 font-bold">{opportunity.boq.overallMarginPercent}%</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">BOQ Approval:</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200 uppercase font-semibold">
                  {opportunity.boq.approvalStatus}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Runbook Ready:</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${opportunity.handover.technicalRunbookReady ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>
                  {opportunity.handover.technicalRunbookReady ? 'YES' : 'IN DRAFT'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
