import React from 'react';
import { Opportunity, PresalesFilterState, ActiveTab } from '../../types';
import { 
  DollarSign, 
  FlaskConical, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  ArrowUpRight, 
  CheckCircle2, 
  Layers, 
  ChevronRight, 
  FileText, 
  Users, 
  Calendar,
  ShieldCheck,
  Building2,
  Cpu
} from 'lucide-react';
import { PriorityBadge, StageBadge } from '../common/Badge';
import { formatCurrency } from '../../utils/currency';

interface ExecutiveDashboardProps {
  opportunities: Opportunity[];
  onSelectOpportunity: (opp: Opportunity) => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenNewModal?: () => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  opportunities,
  onSelectOpportunity,
  onNavigateTab,
}) => {
  // Calculations
  const totalPipelineTCV = opportunities.reduce((acc, o) => acc + (!['closed_lost', 'cancelled'].includes(o?.stage) ? (o.contractValue || 0) : 0), 0);
  const totalARR = opportunities.reduce((acc, o) => acc + (!['closed_lost', 'cancelled'].includes(o?.stage) ? (o.arr || 0) : 0), 0);
  const activePocCount = opportunities.filter(o => o?.poc && (o.poc.status === 'active_testing' || o.poc.status === 'validating_kpis')).length;
  const activePocValue = opportunities
    .filter(o => o?.poc && (o.poc.status === 'active_testing' || o.poc.status === 'validating_kpis'))
    .reduce((acc, o) => acc + (o.contractValue || 0), 0);

  const pendingHandoverCount = opportunities.filter(o => o?.stage === 'closed_won' && o?.handover && !o.handover.isHandedOver).length;
  const pendingHandoverValue = opportunities
    .filter(o => o?.stage === 'closed_won' && o?.handover && !o.handover.isHandedOver)
    .reduce((acc, o) => acc + (o.contractValue || 0), 0);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const now = new Date();
  const totalClients = new Set(opportunities.map(o => o.clientName).filter(Boolean)).size;
  const newOpportunitiesThisMonth = opportunities.filter(o => new Date(o.createdAt) >= monthStart).length;
  const activeOpportunities = opportunities.filter(o => !['closed_won', 'closed_lost', 'on_hold', 'cancelled'].includes(o.stage)).length;
  const wonOpportunities = opportunities.filter(o => o.stage === 'closed_won' || o.outcome?.outcome === 'won').length;
  const lostOpportunities = opportunities.filter(o => o.stage === 'closed_lost' || o.outcome?.outcome === 'lost').length;
  const onHoldOpportunities = opportunities.filter(o => o.outcome?.outcome === 'on_hold').length;
  const pendingFollowUps = opportunities.reduce((total, o) => total + (o.actionItems || []).filter(a => !a.isCompleted).length, 0);
  const pendingBOQs = opportunities.filter(o => ['draft', 'pending_sa_lead', 'pending_sales_vp', 'pending_finance'].includes(o.boq?.approvalStatus || '')).length;
  const completedBOQs = opportunities.filter(o => o.boq?.approvalStatus === 'approved').length;
  const proposalsSubmitted = opportunities.filter(o => (o.activities || []).some(a => a.type === 'RFP / RFI Response') || ['commercial_negotiation', 'closed_won', 'closed_lost'].includes(o.stage)).length;
  const upcomingTenderDeadlines = opportunities.filter(o => {
    const deadline = o.tender?.submissionDeadline ? new Date(o.tender.submissionDeadline) : null;
    return !!o.tender?.isTender && !!deadline && deadline >= now;
  }).length;
  const pocCriteria = opportunities.flatMap(o => o.poc?.successCriteria || []);
  const pocKpiPassRate = pocCriteria.length ? Math.round((pocCriteria.filter(criteria => criteria.verified).length / pocCriteria.length) * 100) : 0;
  const decidedDeals = opportunities.filter(o => ['closed_won', 'closed_lost'].includes(o.stage));
  const technicalWinRate = decidedDeals.length ? Math.round((decidedDeals.filter(o => o.stage === 'closed_won').length / decidedDeals.length) * 1000) / 10 : 0;
  const averageStageDays = opportunities.length ? Math.round(opportunities.reduce((total, o) => total + (o.daysInCurrentStage || 0), 0) / opportunities.length) : 0;

  // Critical deals needing attention
  const needsAttentionDeals = opportunities.filter(o =>
    o.priority === 'p0_urgent' ||
    (o.daysInCurrentStage || 0) > 14 ||
    (o.poc?.blockers || []).some(b => !b.resolved) ||
    (o.actionItems || []).some(a => !a.isCompleted && new Date(a.dueDate || 0) < new Date())
  );

  // Domain breakdown
  const cloudBreakdown: Record<string, { count: number; tcv: number }> = {};
  opportunities.forEach(o => {
    if (!cloudBreakdown[o.primaryTechStack]) {
      cloudBreakdown[o.primaryTechStack] = { count: 0, tcv: 0 };
    }
    cloudBreakdown[o.primaryTechStack].count += 1;
    cloudBreakdown[o.primaryTechStack].tcv += o.contractValue;
  });

  return (
    <div className="space-y-4">
      {/* Top Banner / Executive Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-gray-200 rounded p-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-gray-900 tracking-tight">Presales Solutions Engineering Executive Hub</h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              LIVE TELEMETRY
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time pipeline health, technical validation gates, BOQ margins, and Professional Services delivery handover.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('calendar')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors shadow-2xs"
          >
            <Calendar className="w-3.5 h-3.5 text-gray-500" />
            Calendar
          </button>
          <button
            onClick={() => onNavigateTab('action_center')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors shadow-2xs"
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            SLAs ({needsAttentionDeals.length})
          </button>
          <button
            onClick={() => onNavigateTab('opportunities')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors shadow-2xs font-semibold"
          >
            <Layers className="w-3.5 h-3.5" />
            Pipeline Tracker
          </button>
        </div>
      </div>

      {/* KPI Row (5 high-density cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Card 1: Pipeline TCV */}
        <div className="bg-white border border-gray-200 rounded p-3.5 flex flex-col justify-between hover:border-gray-300 transition-colors">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Active Pipeline TCV</span>
            <div className="w-6 h-6 rounded bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono text-gray-900">
              {formatCurrency(totalPipelineTCV)}
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px]">
              <span className="text-gray-500">ARR: <strong className="font-mono text-gray-700">{formatCurrency(totalARR)}</strong></span>
              <span className="text-emerald-700 font-semibold flex items-center">
                Live portfolio
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Active POCs */}
        <div className="bg-white border border-gray-200 rounded p-3.5 flex flex-col justify-between hover:border-gray-300 transition-colors">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Lab POCs Active</span>
            <div className="w-6 h-6 rounded bg-amber-50 text-amber-700 flex items-center justify-center">
              <FlaskConical className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono text-gray-900">
              {activePocCount} <span className="text-xs font-normal text-gray-500 font-sans">Engagements</span>
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px]">
              <span className="text-gray-500">Sizing: <strong className="font-mono text-gray-700">{formatCurrency(activePocValue)}</strong></span>
              <span className="text-blue-700 font-medium">{pocKpiPassRate}% KPI Pass</span>
            </div>
          </div>
        </div>

        {/* Card 3: Technical Win Rate */}
        <div className="bg-white border border-gray-200 rounded p-3.5 flex flex-col justify-between hover:border-gray-300 transition-colors">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Tech Win Rate</span>
            <div className="w-6 h-6 rounded bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono text-emerald-700">
              {technicalWinRate}%
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px]">
              <span className="text-gray-500">Avg Stage: <strong className="font-mono text-gray-700">{averageStageDays} Days</strong></span>
              <span className="text-emerald-700 font-semibold">Live</span>
            </div>
          </div>
        </div>

        {/* Card 4: PS Handover Backlog */}
        <div className="bg-white border border-gray-200 rounded p-3.5 flex flex-col justify-between hover:border-gray-300 transition-colors">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Delivery Handover</span>
            <div className="w-6 h-6 rounded bg-purple-50 text-purple-700 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono text-gray-900">
              {pendingHandoverCount} <span className="text-xs font-normal text-gray-500 font-sans">Pending</span>
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px]">
              <span className="text-gray-500">Value: <strong className="font-mono text-gray-700">{formatCurrency(pendingHandoverValue)}</strong></span>
              <button 
                onClick={() => onNavigateTab('handover_queue')}
                className="text-purple-700 hover:underline font-semibold"
              >
                Queue &rarr;
              </button>
            </div>
          </div>
        </div>

        {/* Card 5: Critical SLA Alerts */}
        <div className="bg-white border border-gray-200 rounded p-3.5 flex flex-col justify-between hover:border-gray-300 transition-colors">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Needs Attention</span>
            <div className="w-6 h-6 rounded bg-red-50 text-red-700 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono text-red-700">
              {needsAttentionDeals.length} <span className="text-xs font-normal text-gray-500 font-sans">Deals</span>
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px]">
              <span className="text-gray-500">Overdue SLAs</span>
              <button 
                onClick={() => onNavigateTab('action_center')}
                className="text-red-700 hover:underline font-semibold"
              >
                Review &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio KPI Snapshot */}
      <div className="bg-white border border-gray-200 rounded p-4">
        <div className="flex items-center justify-between border-b border-gray-200 pb-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-800">Presales Portfolio Snapshot</h2>
          <span className="text-[10px] uppercase tracking-wider font-mono text-gray-500">Live from opportunity records</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mt-3">
          {[
            { label: 'Total Clients', value: totalClients, tone: 'text-gray-900' },
            { label: 'New This Month', value: newOpportunitiesThisMonth, tone: 'text-blue-700' },
            { label: 'Active Opportunities', value: activeOpportunities, tone: 'text-blue-700' },
            { label: 'Won / Matured', value: wonOpportunities, tone: 'text-emerald-700' },
            { label: 'Lost', value: lostOpportunities, tone: 'text-red-700' },
            { label: 'On Hold', value: onHoldOpportunities, tone: 'text-amber-700' },
            { label: 'Pending Follow-ups', value: pendingFollowUps, tone: 'text-amber-700' },
            { label: 'Pending BOQs', value: pendingBOQs, tone: 'text-purple-700' },
            { label: 'BOQs Completed', value: completedBOQs, tone: 'text-emerald-700' },
            { label: 'Proposals Submitted', value: proposalsSubmitted, tone: 'text-blue-700' },
            { label: 'Tender Deadlines', value: upcomingTenderDeadlines, tone: 'text-red-700' },
          ].map(metric => (
            <div key={metric.label} className="bg-gray-50 border border-gray-200 rounded p-2.5">
              <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">{metric.label}</div>
              <div className={`text-xl font-bold font-mono mt-1 ${metric.tone}`}>{metric.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Split Layout: Critical Action Deals + Tech Domains & Quick Sizing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Critical Deals Requiring Presales Intervention */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-800">Critical Opportunities & SLA Gates</h2>
              <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-red-50 text-red-700 font-semibold border border-red-200">
                {needsAttentionDeals.length} Action Items
              </span>
            </div>
            <button 
              onClick={() => onNavigateTab('opportunities')}
              className="text-xs font-medium text-blue-700 hover:underline flex items-center gap-1"
            >
              View Full Tracker <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 border-b border-gray-200 text-[11px] font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Opportunity / Client</th>
                  <th className="py-2.5 px-3">Stage</th>
                  <th className="py-2.5 px-3">Primary Tech</th>
                  <th className="py-2.5 px-3 text-right">TCV / ARR</th>
                  <th className="py-2.5 px-3">Lead SA</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-gray-800">
                {needsAttentionDeals.slice(0, 5).map(opp => (
                  <tr 
                    key={opp.id}
                    onClick={() => onSelectOpportunity(opp)}
                    className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                  >
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <PriorityBadge priority={opp.priority} />
                        <div>
                          <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                            {opp.name}
                            <span className="font-mono text-[10px] text-gray-400">({opp.code})</span>
                          </div>
                          <div className="text-[11px] text-gray-500">{opp.clientName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <StageBadge stage={opp.stage} size="sm" />
                      <div className="text-[10px] font-mono text-gray-400 mt-0.5">
                        {opp.daysInCurrentStage}d in stage
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-mono border border-gray-200">
                        {opp.primaryTechStack}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono">
                      <div className="font-bold text-gray-900">{formatCurrency(opp.contractValue)}</div>
                      <div className="text-[10px] text-gray-500">{formatCurrency(opp.arr)}/yr</div>
                    </td>
                    <td className="py-2 px-3">
                      <div className="text-[11px] font-medium text-gray-900">{opp.leadSolutionArchitect}</div>
                      <div className="text-[10px] text-gray-500">{opp.accountExecutive} (KAM)</div>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectOpportunity(opp);
                        }}
                        className="p-1 rounded text-gray-400 hover:text-blue-700 hover:bg-gray-100"
                        title="Open Full Detail"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-600 flex items-center justify-between">
            <span className="text-[11px] text-gray-500">Showing top 5 high-urgency deals requiring immediate architectural or commercial review</span>
            <button 
              onClick={() => onNavigateTab('action_center')}
              className="text-xs font-semibold text-blue-700 hover:underline"
            >
              Go to Action Center &rarr;
            </button>
          </div>
        </div>

        {/* Right 1 Col: Tech Stack Sizing Distribution & Presales Shortcuts */}
        <div className="space-y-4">
          {/* Tech Stack Distribution */}
          <div className="bg-white border border-gray-200 rounded p-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-blue-600" />
                Pipeline by Cloud & Tech Stack
              </h3>
              <span className="text-[11px] font-mono text-gray-500 font-semibold">{opportunities.length} Deals</span>
            </div>

            <div className="mt-3 space-y-2.5">
              {Object.entries(cloudBreakdown).map(([stack, data]) => {
                const percent = Math.round((data.tcv / (totalPipelineTCV || 1)) * 100);
                return (
                  <div key={stack} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-gray-800">{stack} ({data.count})</span>
                       <span className="font-mono text-gray-600 font-bold">{formatCurrency(data.tcv)} ({percent}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full" 
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Presales Hub Quick Modules */}
          <div className="bg-white border border-gray-200 rounded p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 border-b border-gray-200 pb-2.5">
              Core Presales Workspaces
            </h3>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button 
                onClick={() => onNavigateTab('boq_workbench')}
                className="p-2.5 text-left rounded border border-gray-200 hover:border-blue-300 hover:bg-blue-50/40 transition-colors"
              >
                <div className="text-xs font-semibold text-gray-900">BOQ Workbench</div>
                <div className="text-[10px] text-gray-500 mt-0.5">Margin & Sizing</div>
              </button>
              <button 
                onClick={() => onNavigateTab('poc_center')}
                className="p-2.5 text-left rounded border border-gray-200 hover:border-amber-300 hover:bg-amber-50/40 transition-colors"
              >
                <div className="text-xs font-semibold text-gray-900">POC Sandbox</div>
                <div className="text-[10px] text-gray-500 mt-0.5">KPIs & Benchmarks</div>
              </button>
              <button 
                onClick={() => onNavigateTab('team_capacity')}
                className="p-2.5 text-left rounded border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/40 transition-colors"
              >
                <div className="text-xs font-semibold text-gray-900">Presales Capacity</div>
                <div className="text-[10px] text-gray-500 mt-0.5">SA Skills Matrix</div>
              </button>
              <button 
                onClick={() => onNavigateTab('documents')}
                className="p-2.5 text-left rounded border border-gray-200 hover:border-purple-300 hover:bg-purple-50/40 transition-colors"
              >
                <div className="text-xs font-semibold text-gray-900">Knowledge Base</div>
                <div className="text-[10px] text-gray-500 mt-0.5">RFPs & Blueprints</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
