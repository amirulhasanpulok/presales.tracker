import React from 'react';
import { Search, Bell, RefreshCw, Cpu, Database, ShieldCheck, Layers, SlidersHorizontal, Terminal, DollarSign, FlaskConical, LayoutDashboard, Menu } from 'lucide-react';
import { Opportunity, ActiveTab } from '../../types';
import { formatCurrency } from '../../utils/currency';

interface HeaderProps {
  opportunities: Opportunity[];
  onOpenNewOpportunity?: () => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onRefreshData?: () => void;
  onToggleSidebar?: () => void;
  onOpenCommandPalette?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  opportunities,
  onNavigateTab,
  onRefreshData,
  onToggleSidebar,
  onOpenCommandPalette,
}) => {
  // Aggregate Metrics
  const totalPipeline = opportunities.reduce((acc, o) => acc + (!['closed_lost', 'cancelled'].includes(o.stage) ? (o.contractValue || 0) : 0), 0);
  const activePocs = opportunities.filter(o => o?.poc && ['active_testing', 'validating_kpis'].includes(o.poc.status)).length;
  const pendingBoqs = opportunities.filter(o => o?.boq?.approvalStatus?.startsWith('pending')).length;
  const overdueActions = opportunities.reduce((acc, o) => {
    const overdue = (o.actionItems || []).filter(a => !a.isCompleted && new Date(a.dueDate || 0) < new Date()).length;
    return acc + overdue;
  }, 0);

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4">
        
        {/* Brand & Context */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button onClick={onToggleSidebar} className="md:hidden p-1.5 rounded text-gray-600 hover:bg-gray-100" aria-label="Open navigation">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigateTab('dashboard')}>
            <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
              PT
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[11px] sm:text-xs tracking-tight text-gray-900 font-mono">PRESALES<span className="text-blue-600">TRACKER</span></span>
                <span className="hidden sm:inline px-1.5 py-0.2 text-[9px] font-mono rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">
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

        {/* Quick Actions & Controls */}
        <div className="flex items-center gap-2">
          <button onClick={onOpenCommandPalette} className="p-1.5 rounded text-gray-500 hover:text-blue-700 hover:bg-blue-50" aria-label="Open search" title="Search">
            <Search className="w-4 h-4" />
          </button>
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
