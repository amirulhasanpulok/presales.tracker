import React, { useState } from 'react';
import { SalesKAM, Opportunity } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { 
  Briefcase, 
  Search, 
  DollarSign, 
  TrendingUp, 
  Mail, 
  Phone, 
  Users, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

interface SalesKAMDirectoryProps {
  salesKAMs: SalesKAM[];
  opportunities: Opportunity[];
  onSelectOpportunity?: (opp: Opportunity) => void;
}

export const SalesKAMDirectory: React.FC<SalesKAMDirectoryProps> = ({
  salesKAMs,
  opportunities,
  onSelectOpportunity,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTerritory, setFilterTerritory] = useState<string>('all');

  const filteredKAMs = salesKAMs.filter(kam => {
    const q = (searchTerm || '').toLowerCase();
    const matchesSearch = (kam.name || '').toLowerCase().includes(q) ||
                          (kam.email || '').toLowerCase().includes(q);
    const matchesTerritory = filterTerritory === 'all' || kam.region === filterTerritory;
    return matchesSearch && matchesTerritory;
  });

  const totalQuota = salesKAMs.reduce((acc, k) => acc + (k.quotaTarget || 0), 0);
  const totalAttainment = salesKAMs.reduce((acc, k) => acc + (k.achievedPipeline || 0), 0);
  const territoryOptions = [...new Set(salesKAMs.map(kam => kam.region).filter(Boolean))].sort();

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white border border-gray-200 rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-gray-900 tracking-tight">Sales Key Account Managers (KAM) Directory</h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
              {salesKAMs.length} Account Executives
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Territory quotas, current attainment %, presales alignment, and active pipeline values.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-gray-50 p-2 rounded border border-gray-200">
          <div className="text-right">
             <div className="text-[10px] uppercase font-semibold text-gray-500">{totalQuota > 0 ? 'Total Quota Attainment' : 'Live Pipeline Coverage'}</div>
            <div className="text-sm font-bold font-mono text-emerald-700">
               {totalQuota > 0 ? `${Math.round((totalAttainment / totalQuota) * 100)}% (${formatCurrency(totalAttainment)} / ${formatCurrency(totalQuota)})` : formatCurrency(totalAttainment)}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
       <div className="mobile-filter-scroll bg-white border border-gray-200 rounded p-3 flex flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by KAM name or email..."
              className="enterprise-input w-full pl-8 text-xs py-1.5"
            />
          </div>
        </div>

        <select
          value={filterTerritory}
          onChange={(e) => setFilterTerritory(e.target.value)}
          className="enterprise-select text-xs py-1.5"
        >
          <option value="all">All Territories</option>
          {territoryOptions.map(region => <option key={region} value={region}>{region}</option>)}
        </select>
      </div>

      {/* KAM Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredKAMs.length === 0 && <div className="md:col-span-2 lg:col-span-3 bg-white border border-dashed border-gray-300 rounded p-10 text-center"><Users className="w-8 h-8 mx-auto text-gray-300" /><h3 className="mt-2 text-sm font-semibold text-gray-800">No Sales KAMs found</h3><p className="mt-1 text-xs text-gray-500">Add Sales KAM users from User Management to populate this directory.</p></div>}
        {filteredKAMs.map(kam => {
           const attainmentPercent = kam.quotaTarget > 0 ? Math.round((kam.achievedPipeline / kam.quotaTarget) * 100) : null;
          return (
            <div key={kam.id} className="bg-white border border-gray-200 rounded p-4 space-y-3 hover:border-gray-300 transition-colors">
              <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-gray-900">{kam.name}</h3>
                    <div className="text-[11px] text-gray-500 font-mono">{kam.region} · {kam.salesTeam || 'Unassigned team'}</div>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">
                  {kam.accountsCount} Accounts
                </span>
              </div>

              {/* Attainment progress bar */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-gray-500">Annual Quota Progress:</span>
                   <span className="font-bold text-emerald-700">{attainmentPercent === null ? 'N/A' : `${attainmentPercent}%`}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1 overflow-hidden">
                  <div 
                    className="bg-emerald-600 h-1.5 rounded-full" 
                     style={{ width: `${Math.min(attainmentPercent || 0, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono mt-0.5">
                   <span>{formatCurrency(kam.achievedPipeline || 0)} Pipeline</span>
                   <span>{kam.quotaTarget > 0 ? `Target: ${formatCurrency(kam.quotaTarget)}` : 'Quota not configured'}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Presales SA Partner:</span>
                  <strong className="text-gray-900 font-semibold">{kam.assignedLeadSA}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Active Pipeline TCV:</span>
                  <strong className="font-mono text-gray-900">{formatCurrency(kam.achievedPipeline || 0)}</strong>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500 font-mono">
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3 text-gray-400" />
                  {kam.email}
                </span>

                {onSelectOpportunity && (
                  <button
                    onClick={() => {
                      const kamDeals = opportunities.filter(o => o.accountExecutive === kam.name);
                      if (kamDeals.length > 0) {
                        onSelectOpportunity(kamDeals[0]);
                      }
                    }}
                    className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-0.5 hover:underline"
                  >
                    View Deals <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
