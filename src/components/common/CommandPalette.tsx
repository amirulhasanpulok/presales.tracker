import React, { useState, useEffect } from 'react';
import { Search, TableProperties, Kanban, Calculator, FlaskConical, CheckSquare, ArrowRightLeft, Users, BarChart3, Plus, X } from 'lucide-react';
import { ActiveTab, Opportunity } from '../../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  opportunities: Opportunity[];
  onSelectOpportunity: (opp: Opportunity) => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenNewOpportunity: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  opportunities,
  onSelectOpportunity,
  onNavigateTab,
  onOpenNewOpportunity
}) => {
  const [query, setQuery] = useState('');

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredOpps = opportunities.filter(o => 
    (o.name || '').toLowerCase().includes((query || '').toLowerCase()) ||
    (o.clientName || '').toLowerCase().includes((query || '').toLowerCase()) ||
    (o.code || '').toLowerCase().includes((query || '').toLowerCase()) ||
    (o.primaryTechStack || '').toLowerCase().includes((query || '').toLowerCase())
  );

  const quickNav = [
    { label: 'Opportunities Matrix', tab: 'opportunities' as ActiveTab, icon: TableProperties },
    { label: 'Stage Board View', tab: 'board' as ActiveTab, icon: Kanban },
    { label: 'POC Control Hub', tab: 'poc_center' as ActiveTab, icon: FlaskConical },
    { label: 'BOQ & Pricing Workbench', tab: 'boq_workbench' as ActiveTab, icon: Calculator },
    { label: 'Presales Action Center', tab: 'action_center' as ActiveTab, icon: CheckSquare },
    { label: 'Implementation Handover', tab: 'handover_queue' as ActiveTab, icon: ArrowRightLeft },
    { label: 'SA Workload Matrix', tab: 'team_capacity' as ActiveTab, icon: Users },
    { label: 'Presales Intelligence', tab: 'analytics' as ActiveTab, icon: BarChart3 }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-100">
      <div 
        className="w-full max-w-xl bg-white border border-gray-200 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[70vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Box */}
        <div className="p-3 border-b border-gray-200 flex items-center gap-2.5 bg-gray-50">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, customer name, code, or jump to module..."
            className="flex-1 bg-transparent text-gray-900 text-xs focus:outline-none placeholder-gray-400 font-sans"
          />
          <kbd className="text-[10px] font-mono bg-white text-gray-500 px-1.5 py-0.5 rounded border border-gray-300 shadow-2xs">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 space-y-3 text-xs bg-white">
          
          {/* Quick Actions */}
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-gray-500 font-semibold px-2 mb-1">
              Quick Actions
            </div>
            <button
              onClick={() => {
                onOpenNewOpportunity();
                onClose();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-gray-100 text-gray-800 text-left transition-colors"
            >
              <Plus className="w-4 h-4 text-blue-600" />
              <span className="font-medium">Create New Presales Opportunity Intake</span>
            </button>
          </div>

          {/* Module Navigation */}
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-gray-500 font-semibold px-2 mb-1">
              Jump to Module
            </div>
            <div className="grid grid-cols-2 gap-1">
              {quickNav.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.tab}
                    onClick={() => {
                      onNavigateTab(item.tab);
                      onClose();
                    }}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-gray-100 text-gray-700 hover:text-gray-900 text-left transition-colors"
                  >
                    <Icon className="w-3.5 h-3.5 text-blue-600" />
                    <span className="truncate font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Matching Opportunities */}
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-gray-500 font-semibold px-2 mb-1">
              Opportunities ({filteredOpps.length})
            </div>
            {filteredOpps.length === 0 ? (
              <div className="px-2 py-2 text-gray-400 italic">No matching deals found</div>
            ) : (
              <div className="space-y-1">
                {filteredOpps.map(opp => (
                  <button
                    key={opp.id}
                    onClick={() => {
                      onSelectOpportunity(opp);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded hover:bg-gray-50 text-left transition-colors group border border-transparent hover:border-gray-200"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-blue-600 text-[11px] font-bold">{opp.code}</span>
                        <span className="font-semibold text-gray-900 truncate">{opp.name}</span>
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                        {opp.clientName} • {opp.primaryTechStack} • Lead SA: {opp.leadSolutionArchitect}
                      </div>
                    </div>

                    <div className="text-right font-mono text-xs flex-shrink-0">
                      <div className="text-gray-900 font-bold">${opp.contractValue.toLocaleString()}</div>
                      <div className="text-emerald-700 text-[10px] font-semibold">{opp.winProbability}% Win</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
