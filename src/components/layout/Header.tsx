import React from 'react';
import { Search, Bell, RefreshCw, Cpu, Database, ShieldCheck, Layers, SlidersHorizontal, Terminal, DollarSign, FlaskConical, LayoutDashboard } from 'lucide-react';
import { Opportunity, ActiveTab } from '../../types';

interface HeaderProps {
  opportunities: Opportunity[];
  onOpenNewOpportunity?: () => void;
  onOpenCommandPalette: () => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onRefreshData?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  opportunities,
  onOpenCommandPalette,
  onNavigateTab,
  onRefreshData
}) => {
  // Aggregate Metrics
  const totalPipeline = opportunities.reduce((acc, o) => acc + (o.stage !== 'closed_lost' ? (o.contractValue || 0) : 0), 0);
  const activePocs = opportunities.filter(o => ['active_testing', 'validating_kpis'].includes(o.poc.status)).length;
  const pendingBoqs = opportunities.filter(o => o.boq.approvalStatus.startsWith('pending')).length;
  const overdueActions = opportunities.reduce((acc, o) => {
    const overdue = o.actionItems.filter(a => !a.isCompleted && new Date(a.dueDate) < new Date()).length;
    return acc + overdue;
  }, 0);

  const formatCurrency = (num: number) => {
    return `$${(num / 1000000).toFixed(2)}M`;
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-2">
      <div className="flex items-center justify-between gap-4">
        
        {/* Brand & Context */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigateTab('dashboard')}>
            <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
              PT
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs tracking-tight text-gray-900 font-mono">PRESALES<span className="text-blue-600">TRACKER</span></span>
                <span className="px-1.5 py-0.2 text-[9px] font-mono rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">
                  ENTERPRISE
                </span>
              </div>
            </div>
          </div>

          <div className="h-5 w-px bg-gray-200 mx-1 hidden lg:block" />

          {/* Real-time Presales Health Metrics Ribbon */}
          <div className="hidden xl:flex items-center gap-2 text-xs font-mono">
            <div 
              onClick={() => onNavigateTab('dashboard')}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-gray-50 border border-gray-200 cursor-pointer hover:bg-gray-100"
            >
              <DollarSign className="w-3 h-3 text-blue-600" />
              <span className="text-gray-500">Pipeline:</span>
              <strong className="text-gray-900 font-bold">{formatCurrency(totalPipeline)}</strong>
            </div>

            <div 
              onClick={() => onNavigateTab('poc_center')}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-gray-50 border border-gray-200 cursor-pointer hover:bg-gray-100"
            >
              <FlaskConical className="w-3 h-3 text-amber-600" />
              <span className="text-gray-500">POC Labs:</span>
              <strong className="text-gray-900 font-bold">{activePocs} Active</strong>
            </div>

            <div 
              onClick={() => onNavigateTab('boq_workbench')}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-gray-50 border border-gray-200 cursor-pointer hover:bg-gray-100"
            >
              <Layers className="w-3 h-3 text-purple-600" />
              <span className="text-gray-500">BOQ Approvals:</span>
              <strong className={`font-bold ${pendingBoqs > 0 ? 'text-purple-700' : 'text-gray-700'}`}>
                {pendingBoqs} Pending
              </strong>
            </div>

            {overdueActions > 0 && (
              <div 
                onClick={() => onNavigateTab('action_center')}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-50 border border-red-200 text-red-700 cursor-pointer hover:bg-red-100"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                <strong className="font-bold">{overdueActions} Overdue SLAs</strong>
              </div>
            )}
          </div>
        </div>

        {/* Global Search & Command trigger */}
        <div className="flex-1 max-w-md mx-2">
          <button
            onClick={onOpenCommandPalette}
            type="button"
            className="w-full flex items-center justify-between px-3 py-1.5 text-xs bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-800 border border-gray-300 rounded transition-colors text-left font-sans group"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600 transition-colors" />
              <span>Search deals, RFP scopes, BOQs, stakeholders...</span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-white border border-gray-300 text-gray-600 rounded">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Quick Actions & Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('notifications')}
            className="p-1.5 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100 relative transition-colors"
            title="Notification Center"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-red-500 absolute top-1 right-1" />
          </button>

          {onRefreshData && (
            <button
              onClick={onRefreshData}
              title="Reset Demo Dataset"
              className="p-1.5 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
