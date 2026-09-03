import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Download, 
  ExternalLink, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight, 
  Layers, 
  Cpu, 
  SlidersHorizontal,
  X,
  Plus
} from 'lucide-react';
import { Opportunity, OpportunityStage, CloudProvider, DealComplexity, DealPriority } from '../../types';
import { StageBadge, PriorityBadge, ComplexityBadge, POCBadge, TechFitBadge } from '../common/Badge';
import { STAGE_CONFIG } from '../../config/workflow';
import { exportPipelineCSV } from '../../utils/exportUtils';
import { formatCurrency } from '../../utils/currency';

interface OpportunityTableProps {
  opportunities: Opportunity[];
  onSelectOpportunity: (opp: Opportunity) => void;
  onUpdateStage: (oppId: string, newStage: OpportunityStage) => void;
  onOpenNewModal: () => void;
  density: 'compact' | 'dense' | 'spacious';
}

export const OpportunityTable: React.FC<OpportunityTableProps> = ({
  opportunities,
  onSelectOpportunity,
  onUpdateStage,
  onOpenNewModal,
  density
}) => {
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [techStackFilter, setTechStackFilter] = useState<string>('all');
  const [architectFilter, setArchitectFilter] = useState<string>('all');
  const [complexityFilter, setComplexityFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [onlyOverdue, setOnlyOverdue] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Sorting
  const [sortField, setSortField] = useState<keyof Opportunity>('contractValue');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Extract unique Tech stacks and Architects for filter dropdowns
  const techStacks = useMemo(() => {
    return Array.from(new Set(opportunities.map(o => o.primaryTechStack))).filter(Boolean);
  }, [opportunities]);

  const architects = useMemo(() => {
    return Array.from(new Set(opportunities.map(o => o.leadSolutionArchitect))).filter(Boolean);
  }, [opportunities]);

  // Filter and Search logic
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesCode = (opp.code || '').toLowerCase().includes(q);
        const matchesName = (opp.name || '').toLowerCase().includes(q);
        const matchesClient = (opp.clientName || '').toLowerCase().includes(q);
        const matchesArch = (opp.leadSolutionArchitect || '').toLowerCase().includes(q);
        const matchesTech = (opp.primaryTechStack || '').toLowerCase().includes(q) || (opp.technologies || []).some(t => (t || '').toLowerCase().includes(q));
        if (!matchesCode && !matchesName && !matchesClient && !matchesArch && !matchesTech) {
          return false;
        }
      }

      // Dropdown Filters
      if (stageFilter !== 'all' && opp.stage !== stageFilter) return false;
      if (techStackFilter !== 'all' && opp.primaryTechStack !== techStackFilter) return false;
      if (architectFilter !== 'all' && opp.leadSolutionArchitect !== architectFilter) return false;
      if (complexityFilter !== 'all' && opp.dealComplexity !== complexityFilter) return false;
      if (priorityFilter !== 'all' && opp.priority !== priorityFilter) return false;

      // Overdue SLA Filter
      if (onlyOverdue) {
        const hasOverdue = (opp.actionItems || []).some(a => !a.isCompleted && new Date(a.dueDate) < new Date());
        if (!hasOverdue) return false;
      }

      return true;
    }).sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortAsc ? (valA || '').localeCompare(valB || '') : (valB || '').localeCompare(valA || '');
      }

      return 0;
    });
  }, [
    opportunities,
    searchQuery,
    stageFilter,
    techStackFilter,
    architectFilter,
    complexityFilter,
    priorityFilter,
    onlyOverdue,
    sortField,
    sortAsc
  ]);

  const handleSort = (field: keyof Opportunity) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredOpportunities.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredOpportunities.map(o => o.id));
    }
  };

  const toggleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const hasActiveFilters = stageFilter !== 'all' || techStackFilter !== 'all' || architectFilter !== 'all' || complexityFilter !== 'all' || priorityFilter !== 'all' || onlyOverdue || searchQuery !== '';

  const resetFilters = () => {
    setSearchQuery('');
    setStageFilter('all');
    setTechStackFilter('all');
    setArchitectFilter('all');
    setComplexityFilter('all');
    setPriorityFilter('all');
    setOnlyOverdue(false);
  };

  // Density Class helper
  const cellPadding = density === 'compact' ? 'py-1.5 px-2.5 text-xs' : density === 'spacious' ? 'py-3 px-4 text-sm' : 'py-2 px-3 text-xs';

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded overflow-hidden shadow-2xs">
      
      {/* Control & Filter Bar */}
      <div className="p-3 border-b border-gray-200 bg-white space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          
          {/* Search Box */}
          <div className="relative flex-1 min-w-0 w-full sm:min-w-[260px] max-w-md">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search code, customer, technology, or SA..."
              className="w-full pl-8 pr-8 py-1.5 bg-white border border-gray-300 text-gray-900 text-xs rounded focus:outline-none focus:border-blue-500 placeholder-gray-400 font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Stats & Action buttons */}
          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded font-mono font-medium">
                <span>{selectedIds.length} Selected</span>
                <button
                  onClick={() => setSelectedIds([])}
                  className="text-gray-500 hover:text-gray-900 ml-1 font-bold"
                >
                  Clear
                </button>
              </div>
            )}

            <button
              onClick={() => exportPipelineCSV(filteredOpportunities)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded text-xs transition-colors font-medium shadow-2xs"
              title="Export Current Table as CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={onOpenNewModal}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Opportunity</span>
            </button>
          </div>
        </div>

        {/* Dropdown Filters Row */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          
          {/* Stage Filter */}
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            aria-label="Filter by presales stage"
            className="enterprise-select font-mono text-xs py-1"
          >
            <option value="all">Stage: All Stages</option>
            {Object.entries(STAGE_CONFIG).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>

          {/* Tech Stack Filter */}
          <select
            value={techStackFilter}
            onChange={(e) => setTechStackFilter(e.target.value)}
            aria-label="Filter by technology stack"
            className="enterprise-select font-mono text-xs py-1"
          >
            <option value="all">Stack: All Cloud / Tech</option>
            {techStacks.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* Lead SA Filter */}
          <select
            value={architectFilter}
            onChange={(e) => setArchitectFilter(e.target.value)}
            aria-label="Filter by lead architect"
            className="enterprise-select font-mono text-xs py-1"
          >
            <option value="all">Lead SA: All Architects</option>
            {architects.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          {/* Complexity Filter */}
          <select
            value={complexityFilter}
            onChange={(e) => setComplexityFilter(e.target.value)}
            aria-label="Filter by deal complexity"
            className="enterprise-select font-mono text-xs py-1"
          >
            <option value="all">Complexity: All</option>
            <option value="critical">Critical / Multi-Tier</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            aria-label="Filter by deal priority"
            className="enterprise-select font-mono text-xs py-1"
          >
            <option value="all">Priority: All</option>
            <option value="p0_urgent">P0 - Urgent</option>
            <option value="p1_high">P1 - High</option>
            <option value="p2_medium">P2 - Medium</option>
            <option value="p3_low">P3 - Low</option>
          </select>

          {/* Overdue SLA Toggle */}
          <button
            onClick={() => setOnlyOverdue(!onlyOverdue)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded border text-xs font-mono transition-colors ${
              onlyOverdue 
                ? 'bg-rose-50 text-rose-800 border-rose-300 font-semibold' 
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Overdue Actions Only</span>
          </button>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-blue-700 hover:underline text-xs font-mono font-medium ml-auto"
            >
              Reset Filters
            </button>
          )}

        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto bg-white">
        <table className="hidden md:table w-full text-left border-collapse text-gray-900">
          <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200 text-[11px] font-mono text-gray-500 uppercase select-none">
            <tr>
              <th className="w-8 py-2.5 px-3 text-center">
                <input
                  type="checkbox"
                  checked={selectedIds.length > 0 && selectedIds.length === filteredOpportunities.length}
                  onChange={toggleSelectAll}
                  aria-label="Select all opportunities"
                  className="rounded border-gray-300 text-blue-600 focus:ring-0 cursor-pointer"
                />
              </th>
              
              <th 
                onClick={() => handleSort('code')}
                className="py-2.5 px-3 cursor-pointer hover:text-gray-900 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Code</span>
                  {sortField === 'code' && (sortAsc ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />)}
                </div>
              </th>

              <th 
                onClick={() => handleSort('name')}
                className="py-2.5 px-3 cursor-pointer hover:text-gray-900 transition-colors min-w-[240px]"
              >
                <div className="flex items-center gap-1">
                  <span>Opportunity & Customer</span>
                  {sortField === 'name' && (sortAsc ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />)}
                </div>
              </th>

              <th className="py-2.5 px-3 min-w-[160px]">Stage</th>

              <th className="py-2.5 px-3">Primary Tech Stack</th>

              <th 
                onClick={() => handleSort('contractValue')}
                className="py-2.5 px-3 cursor-pointer hover:text-gray-900 transition-colors text-right"
              >
                <div className="flex items-center justify-end gap-1">
                   <span>TCV</span>
                  {sortField === 'contractValue' && (sortAsc ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />)}
                </div>
              </th>

              <th 
                onClick={() => handleSort('winProbability')}
                className="py-2.5 px-3 cursor-pointer hover:text-gray-900 transition-colors text-center"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Win %</span>
                  {sortField === 'winProbability' && (sortAsc ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />)}
                </div>
              </th>

              <th className="py-2.5 px-3">POC Status</th>

              <th className="py-2.5 px-3">Lead Architect</th>

              <th 
                onClick={() => handleSort('expectedCloseDate')}
                className="py-2.5 px-3 cursor-pointer hover:text-gray-900 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Target Close</span>
                  {sortField === 'expectedCloseDate' && (sortAsc ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />)}
                </div>
              </th>

              <th className="py-2.5 px-3 text-right">Inspect</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 text-xs font-sans">
            {filteredOpportunities.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-gray-500">
                  <div className="max-w-sm mx-auto space-y-2">
                    <Layers className="w-8 h-8 mx-auto text-gray-400" />
                    <p className="font-semibold text-gray-800">No opportunities match the current criteria</p>
                    <p className="text-xs text-gray-500">Try adjusting your filters or search keywords.</p>
                    <button
                      onClick={resetFilters}
                      className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-xs font-medium"
                    >
                      Clear All Filters
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredOpportunities.map((opp) => {
                const isSelected = selectedIds.includes(opp.id);
                const hasOverdueActions = opp.actionItems.some(a => !a.isCompleted && new Date(a.dueDate) < new Date());
                 const formatTCV = (val: number) => formatCurrency(val);

                return (
                  <tr
                    key={opp.id}
                    onClick={() => onSelectOpportunity(opp)}
                    className={`cursor-pointer transition-colors group ${
                      isSelected
                        ? 'bg-blue-50/70 hover:bg-blue-50'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* Select Checkbox */}
                    <td className={`text-center ${cellPadding}`} onClick={(e) => toggleSelectOne(opp.id, e)}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        aria-label={`Select opportunity ${opp.code}`}
                        className="rounded border-gray-300 text-blue-600 focus:ring-0 cursor-pointer"
                      />
                    </td>

                    {/* Deal Code & Priority */}
                    <td className={`font-mono text-gray-900 font-semibold whitespace-nowrap ${cellPadding}`}>
                      <div className="flex items-center gap-1.5">
                        <span className="text-blue-700 font-bold hover:underline">{opp.code}</span>
                        <PriorityBadge priority={opp.priority} />
                      </div>
                    </td>

                    {/* Name & Client */}
                    <td className={cellPadding}>
                      <div className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors leading-tight">
                        {opp.name}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                        <span className="font-semibold text-gray-700">{opp.clientName}</span>
                        <span>•</span>
                        <span>{opp.clientIndustry}</span>
                        {hasOverdueActions && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-rose-700 font-mono bg-rose-50 border border-rose-200 px-1 rounded font-semibold">
                            <AlertTriangle className="w-2.5 h-2.5" /> SLA Risk
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Stage with Inline Quick Transition */}
                    <td className={cellPadding} onClick={(e) => e.stopPropagation()}>
                      <select
                        value={opp.stage}
                        onChange={(e) => onUpdateStage(opp.id, e.target.value as OpportunityStage)}
                        aria-label={`Update stage for ${opp.code}`}
                        className="bg-white border border-gray-300 hover:border-blue-500 text-gray-800 text-[11px] font-mono py-1 px-1.5 rounded focus:outline-none cursor-pointer"
                      >
                        {Object.entries(STAGE_CONFIG).map(([sKey, sVal]) => (
                          <option key={sKey} value={sKey}>{sVal.shortLabel}</option>
                        ))}
                      </select>
                      <div className="text-[10px] font-mono text-gray-500 mt-0.5 pl-1">
                        {opp.daysInCurrentStage}d in stage
                      </div>
                    </td>

                    {/* Tech Stack & Badges */}
                    <td className={cellPadding}>
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono bg-gray-100 text-gray-800 border border-gray-200">
                          {opp.primaryTechStack}
                        </span>
                        <ComplexityBadge complexity={opp.dealComplexity} />
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono mt-0.5 truncate max-w-[180px]">
                        {opp.secondaryTechnologies?.slice(0, 3).join(', ')}
                        {opp.secondaryTechnologies && opp.secondaryTechnologies.length > 3 && ` +${opp.secondaryTechnologies.length - 3}`}
                      </div>
                    </td>

                    {/* TCV / Value */}
                    <td className={`text-right font-mono font-bold text-gray-900 ${cellPadding}`}>
                      <div>{formatTCV(opp.contractValue)}</div>
                      <div className="text-[10px] text-gray-500 font-normal">
                        ARR: {formatTCV(opp.arr)}
                      </div>
                    </td>

                    {/* Win % */}
                    <td className={`text-center font-mono ${cellPadding}`}>
                      <div className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {opp.winProbability}%
                      </div>
                      <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mt-1 overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full"
                          style={{ width: `${opp.winProbability}%` }}
                        />
                      </div>
                    </td>

                    {/* POC status */}
                    <td className={cellPadding}>
                      <POCBadge status={opp.poc.status} />
                    </td>

                    {/* Lead SA */}
                    <td className={cellPadding}>
                      <div className="flex items-center gap-1.5">
                        {opp.leadArchitectAvatar && (
                          <img
                            src={opp.leadArchitectAvatar}
                            alt={opp.leadSolutionArchitect}
                            className="w-5 h-5 rounded-full object-cover border border-gray-200"
                          />
                        )}
                        <span className="text-gray-900 font-medium whitespace-nowrap">
                          {opp.leadSolutionArchitect}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono">
                        AE: {opp.accountExecutive}
                      </div>
                    </td>

                    {/* Close Date */}
                    <td className={`font-mono text-gray-700 text-[11px] whitespace-nowrap ${cellPadding}`}>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span>{opp.expectedCloseDate}</span>
                      </div>
                    </td>

                    {/* Inspect Arrow */}
                    <td className={`text-right ${cellPadding}`}>
                      <div className="p-1 rounded text-gray-400 group-hover:text-blue-600 group-hover:bg-blue-50 inline-flex items-center transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <div className="md:hidden p-2 space-y-2">
          {filteredOpportunities.length === 0 ? (
            <div className="py-10 text-center text-xs text-gray-500">No opportunities match the current criteria.</div>
          ) : filteredOpportunities.map(opp => {
            const isSelected = selectedIds.includes(opp.id);
            const overdue = (opp.actionItems || []).some(a => !a.isCompleted && new Date(a.dueDate) < new Date());
            return <article key={opp.id} onClick={() => onSelectOpportunity(opp)} className={`border rounded p-3 space-y-2 ${isSelected ? 'border-blue-300 bg-blue-50/50' : 'border-gray-200 bg-white'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  <input type="checkbox" checked={isSelected} onChange={() => {}} onClick={e => toggleSelectOne(opp.id, e)} className="mt-1 rounded border-gray-300 text-blue-600" aria-label={`Select opportunity ${opp.code}`} />
                  <div className="min-w-0"><div className="text-[10px] font-mono font-bold text-blue-700">{opp.code}</div><h3 className="font-bold text-sm text-gray-900 break-words">{opp.name}</h3><div className="text-xs text-gray-500 break-words">{opp.clientName}</div></div>
                </div>
                <PriorityBadge priority={opp.priority} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div><div className="text-gray-500 uppercase text-[9px] font-semibold">Stage</div><select value={opp.stage} onChange={e => { e.stopPropagation(); onUpdateStage(opp.id, e.target.value as OpportunityStage); }} onClick={e => e.stopPropagation()} className="enterprise-select w-full text-[11px] py-1">{Object.entries(STAGE_CONFIG).map(([key, value]) => <option key={key} value={key}>{value.shortLabel}</option>)}</select></div>
                <div><div className="text-gray-500 uppercase text-[9px] font-semibold">TCV / Win</div><div className="font-mono font-bold text-gray-900">{formatCurrency(opp.contractValue)}</div><div className="text-emerald-700 font-mono">{opp.winProbability}% win</div></div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-gray-500"><span className="px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200 font-mono">{opp.primaryTechStack}</span><span>SA: {opp.leadSolutionArchitect}</span>{overdue && <span className="text-rose-700 font-semibold">SLA Risk</span>}</div>
            </article>;
          })}
        </div>
      </div>

      {/* Table Footer Telemetry */}
      <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs font-mono text-gray-500">
        <div className="flex items-center gap-4">
          <span>Showing {filteredOpportunities.length} of {opportunities.length} Total Opportunities</span>
          <span>•</span>
           <span>Filtered Total Value: <strong className="text-gray-900">{formatCurrency(filteredOpportunities.reduce((acc, o) => acc + o.contractValue, 0))}</strong></span>
        </div>
        <div className="hidden sm:block">
          <span>Click any row to open full technical inspector & BOQ</span>
        </div>
      </div>

    </div>
  );
};
