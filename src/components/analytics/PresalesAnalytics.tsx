import React, { useMemo, useState } from 'react';
import { BarChart3, TrendingUp, DollarSign, Clock, ShieldCheck, Cpu, ArrowUpRight, Download, Filter } from 'lucide-react';
import { Opportunity } from '../../types';
import { formatCurrency } from '../../utils/currency';

interface PresalesAnalyticsProps {
  opportunities: Opportunity[];
}

export const PresalesAnalytics: React.FC<PresalesAnalyticsProps> = ({
  opportunities
}) => {
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('all');
  const [kam, setKam] = useState('all');
  const [scope, setScope] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const totalPipeline = opportunities.reduce((acc, o) => acc + o.contractValue, 0);
  const totalARR = opportunities.reduce((acc, o) => acc + o.arr, 0);
  const wonOpps = opportunities.filter(o => o.stage === 'closed_won');
  const wonValue = wonOpps.reduce((acc, o) => acc + o.contractValue, 0);
  const decidedOpps = opportunities.filter(o => ['closed_won', 'closed_lost'].includes(o.stage));
  const liveWinRate = decidedOpps.length ? Math.round((wonOpps.length / decidedOpps.length) * 1000) / 10 : 0;
  const boqOpps = opportunities.filter(o => (o.boq?.items || []).length > 0);
  const liveBOQMargin = boqOpps.length ? Math.round(boqOpps.reduce((total, o) => total + (o.boq?.overallMarginPercent || 0), 0) / boqOpps.length * 10) / 10 : 0;
  const liveDiscoveryCycle = opportunities.length ? Math.round(opportunities.reduce((total, o) => total + (o.daysInCurrentStage || 0), 0) / opportunities.length * 10) / 10 : 0;

  // Group by Stack
  const stackBreakdown: Record<string, { count: number; value: number }> = {};
  opportunities.forEach(o => {
    if (!stackBreakdown[o.primaryTechStack]) {
      stackBreakdown[o.primaryTechStack] = { count: 0, value: 0 };
    }
    stackBreakdown[o.primaryTechStack].count += 1;
    stackBreakdown[o.primaryTechStack].value += o.contractValue;
  });

  const filterOptions = useMemo(() => ({
    stages: [...new Set(opportunities.map(o => o.stage))],
    kams: [...new Set(opportunities.map(o => o.accountExecutive).filter(Boolean))],
    scopes: [...new Set(opportunities.flatMap(o => o.scopes || []))].sort(),
  }), [opportunities]);

  const activityRows = useMemo(() => opportunities.map(opportunity => {
    const latest = [...(opportunity.activities || [])].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    const nextAction = [...(opportunity.actionItems || [])].filter(item => !item.isCompleted).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
    return { opportunity, latest, nextAction };
  }).filter(row => {
    const { opportunity, latest } = row;
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [opportunity.clientName, opportunity.name, opportunity.code, opportunity.accountExecutive, opportunity.leadSolutionArchitect, ...(opportunity.scopes || []), ...(opportunity.boq?.items || []).map(item => `${item.oem || ''} ${item.productName || ''} ${item.model || ''} ${item.partNumber || ''}`)].join(' ').toLowerCase().includes(query);
    const activityDate = latest?.timestamp ? new Date(latest.timestamp) : new Date(opportunity.updatedAt);
    const matchesDate = (!fromDate || activityDate >= new Date(`${fromDate}T00:00:00`)) && (!toDate || activityDate <= new Date(`${toDate}T23:59:59`));
    return matchesSearch && (stage === 'all' || opportunity.stage === stage) && (kam === 'all' || opportunity.accountExecutive === kam) && (scope === 'all' || (opportunity.scopes || []).includes(scope)) && matchesDate;
  }).sort((a, b) => new Date(b.latest?.timestamp || b.opportunity.updatedAt).getTime() - new Date(a.latest?.timestamp || a.opportunity.updatedAt).getTime()), [opportunities, search, stage, kam, scope, fromDate, toDate]);

  const exportActivityReport = () => {
    const csvValue = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const headers = ['Client', 'Opportunity', 'Scope', 'Sales KAM', 'Presales Owner', 'Stage', 'Status', 'Last Update', 'Last Updated By', 'Last Activity Date', 'Next Action', 'Next Follow-up Date'];
    const rows = activityRows.map(({ opportunity, latest, nextAction }) => [
      opportunity.clientName,
      `${opportunity.name} (${opportunity.code})`,
      (opportunity.scopes || []).join('; '),
      opportunity.accountExecutive,
      opportunity.leadSolutionArchitect,
      opportunity.stage,
      opportunity.outcome?.outcome || (opportunity.stage === 'closed_won' ? 'won' : opportunity.stage === 'closed_lost' ? 'lost' : 'active'),
      latest?.summary || '',
      latest?.author || '',
      latest?.timestamp || opportunity.updatedAt,
      nextAction?.title || '',
      nextAction?.dueDate || '',
    ].map(csvValue).join(','));
    const blob = new Blob([[headers.map(csvValue).join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `recent_client_activity_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Group by Industry
  const industryBreakdown: Record<string, { count: number; value: number }> = {};
  opportunities.forEach(o => {
    if (!industryBreakdown[o.clientIndustry]) {
      industryBreakdown[o.clientIndustry] = { count: 0, value: 0 };
    }
    industryBreakdown[o.clientIndustry].count += 1;
    industryBreakdown[o.clientIndustry].value += o.contractValue;
  });

  return (
    <div className="space-y-4">
      
      {/* Top Banner */}
      <div className="bg-white border border-gray-200 rounded p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <div>
              <h1 className="text-base font-bold text-gray-900 tracking-tight">Presales Performance & Deal Velocity Intelligence</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Technical win-rate metrics, cycle velocity by cloud architecture, BOQ margin realization, and POC conversions.
              </p>
            </div>
          </div>
        </div>

        {/* Global Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-gray-100 text-xs font-mono">
          <div className="bg-gray-50 p-2.5 rounded border border-gray-200">
            <span className="text-gray-500 text-[11px] font-sans font-medium">Total Supported TCV:</span>
            <div className="text-base font-bold text-gray-900">{formatCurrency(totalPipeline)}</div>
               <div className="text-[10px] text-emerald-700 flex items-center gap-0.5 mt-0.5 font-sans font-semibold">
               <TrendingUp className="w-3 h-3" /> Live portfolio value
            </div>
          </div>

          <div className="bg-gray-50 p-2.5 rounded border border-gray-200">
            <span className="text-gray-500 text-[11px] font-sans font-medium">Technical Win Rate:</span>
             <div className="text-base font-bold text-emerald-700">{liveWinRate}%</div>
             <div className="text-[10px] text-gray-500 font-sans">Closed deals</div>
          </div>

          <div className="bg-gray-50 p-2.5 rounded border border-gray-200">
            <span className="text-gray-500 text-[11px] font-sans font-medium">Avg Tech Discovery Cycle:</span>
             <div className="text-base font-bold text-gray-900">{liveDiscoveryCycle} Days</div>
             <div className="text-[10px] text-gray-500 font-sans">Current stage average</div>
          </div>

          <div className="bg-gray-50 p-2.5 rounded border border-gray-200">
            <span className="text-gray-500 text-[11px] font-sans font-medium">Average BOQ Margin:</span>
             <div className="text-base font-bold text-purple-700">{liveBOQMargin}%</div>
             <div className="text-[10px] text-gray-500 font-sans">Live BOQ average</div>
          </div>
        </div>
      </div>

      {/* Grid of Analytical Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Breakdown by Primary Cloud / Stack */}
        <div className="bg-white border border-gray-200 rounded p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs text-gray-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-600" />
              Pipeline by Cloud & Tech Stack
            </h3>
             <span className="text-[11px] font-mono text-gray-500">Total Value</span>
          </div>

          <div className="space-y-3 pt-1">
            {Object.entries(stackBreakdown).map(([stack, data]) => {
              const pct = totalPipeline > 0 ? (data.value / totalPipeline) * 100 : 0;

              return (
                <div key={stack} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-900 font-medium">{stack} ({data.count} deals)</span>
                    <span className="text-gray-700 font-mono font-bold">{formatCurrency(data.value)} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Breakdown by Client Industry */}
        <div className="bg-white border border-gray-200 rounded p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Pipeline by Industry Sector
            </h3>
            <span className="text-[11px] font-mono text-gray-500">Deal Concentration</span>
          </div>

          <div className="space-y-3 pt-1">
            {Object.entries(industryBreakdown).map(([industry, data]) => {
              const pct = totalPipeline > 0 ? (data.value / totalPipeline) * 100 : 0;

              return (
                <div key={industry} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-900 font-medium">{industry}</span>
                    <span className="text-gray-700 font-mono font-bold">{formatCurrency(data.value)}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                    <div
                      className="h-full bg-emerald-600 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Recent Client Activity Report */}
      <div className="bg-white border border-gray-200 rounded p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-2.5">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900">Recent Client Activity Report</h2>
              <p className="text-[11px] text-gray-500 mt-0.5">Latest client-facing update and next action across opportunities.</p>
            </div>
          </div>
          <button onClick={exportActivityReport} className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100">
            <Download className="w-3.5 h-3.5" /> Export Excel CSV ({activityRows.length})
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">
          <label className="lg:col-span-2">
            <span className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Search client, opportunity, OEM, product</span>
            <input value={search} onChange={e => setSearch(e.target.value)} className="enterprise-input w-full text-xs" placeholder="Search..." />
          </label>
          <label><span className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Stage</span><select value={stage} onChange={e => setStage(e.target.value)} className="enterprise-select w-full text-xs"><option value="all">All stages</option>{filterOptions.stages.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
          <label><span className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Sales KAM</span><select value={kam} onChange={e => setKam(e.target.value)} className="enterprise-select w-full text-xs"><option value="all">All KAMs</option>{filterOptions.kams.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
          <label><span className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Scope</span><select value={scope} onChange={e => setScope(e.target.value)} className="enterprise-select w-full text-xs"><option value="all">All scopes</option>{filterOptions.scopes.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
          <div className="grid grid-cols-2 gap-2 lg:col-span-6">
            <label><span className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Activity From</span><input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="enterprise-input w-full text-xs" /></label>
            <label><span className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Activity To</span><input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="enterprise-input w-full text-xs" /></label>
          </div>
        </div>

        <div className="overflow-x-auto border border-gray-200 rounded">
          <table className="w-full text-left text-xs min-w-[1050px]">
            <thead className="bg-gray-50 text-[10px] uppercase tracking-wider text-gray-500 border-b border-gray-200">
              <tr><th className="px-3 py-2">Client / Opportunity</th><th className="px-3 py-2">Scope</th><th className="px-3 py-2">Team</th><th className="px-3 py-2">Stage</th><th className="px-3 py-2">Last Update</th><th className="px-3 py-2">Next Action</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {activityRows.slice(0, 20).map(({ opportunity, latest, nextAction }) => <tr key={opportunity.id} className="hover:bg-blue-50/40">
                <td className="px-3 py-2"><div className="font-semibold text-gray-900">{opportunity.clientName}</div><div className="text-[11px] text-blue-700">{opportunity.name} <span className="font-mono text-gray-400">({opportunity.code})</span></div></td>
                <td className="px-3 py-2"><div className="flex flex-wrap gap-1">{(opportunity.scopes || []).slice(0, 3).map(item => <span key={item} className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 text-[10px]">{item}</span>)}</div></td>
                <td className="px-3 py-2"><div className="text-gray-900">{opportunity.accountExecutive}</div><div className="text-[10px] text-gray-500">{opportunity.leadSolutionArchitect}</div></td>
                <td className="px-3 py-2 font-mono text-[11px]">{opportunity.stage}</td>
                <td className="px-3 py-2 max-w-[280px]"><div className="text-gray-800 truncate" title={latest?.summary}>{latest?.summary || 'No activity recorded'}</div><div className="text-[10px] text-gray-500">{latest?.author || 'System'} · {new Date(latest?.timestamp || opportunity.updatedAt).toLocaleString()}</div></td>
                <td className="px-3 py-2"><div className="text-gray-800">{nextAction?.title || 'No open action'}</div><div className="text-[10px] text-amber-700">{nextAction?.dueDate || ''}</div></td>
              </tr>)}
            </tbody>
          </table>
          {activityRows.length === 0 && <div className="p-6 text-center text-xs text-gray-500">No opportunities match the selected report filters.</div>}
          {activityRows.length > 20 && <div className="px-3 py-2 bg-gray-50 text-[11px] text-gray-500">Showing 20 of {activityRows.length} rows. Export includes all filtered rows.</div>}
        </div>
      </div>

    </div>
  );
};
