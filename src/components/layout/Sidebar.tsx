import React from 'react';
import { 
  LayoutDashboard,
  TableProperties, 
  Kanban, 
  Calculator, 
  FlaskConical, 
  CheckSquare, 
  ArrowRightLeft, 
  Users, 
  BarChart3, 
  Calendar,
  Building2,
  Briefcase,
  FileText,
  Bell,
  ShieldCheck,
  UserCheck,
  KeyRound,
  Sliders,
  Settings,
  Layers,
  Factory,
  Boxes,
  Plus,
  LogOut
} from 'lucide-react';
import { ActiveTab, Opportunity, UserAccount } from '../../types';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  opportunities: Opportunity[];
  onOpenNewOpportunity: () => void;
  can: (permission: string) => boolean;
  canCreateOpportunity: boolean;
  currentUser: UserAccount;
  currentRoleName?: string | null;
  onLogout: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  opportunities,
  onOpenNewOpportunity,
  can,
  canCreateOpportunity,
  currentUser,
  currentRoleName,
  onLogout,
  isMobileOpen = false,
  onMobileClose,
}) => {
  interface NavItem {
    id: ActiveTab;
    label: string;
    icon: any;
    count?: any;
    highlight?: 'red' | 'amber' | 'emerald' | 'purple';
    perm: string;
  }
interface NavSection {
    title: string;
    items: NavItem[];
  }

  // Compute contextual badge counts
  const totalOpps = opportunities.length;
  const activePocs = opportunities.filter(o => o?.poc && ['active_testing', 'scoping', 'provisioning', 'validating_kpis'].includes(o.poc.status)).length;
  const pendingBoqs = opportunities.filter(o => o?.boq?.approvalStatus?.startsWith('pending')).length;
  const openActions = opportunities.reduce((acc, o) => acc + (o.actionItems || []).filter(a => !a.isCompleted).length, 0);
  const pendingHandovers = opportunities.filter(o => o.stage === 'closed_won' && o?.handover && !o.handover.isHandedOver).length;

  const sections: NavSection[] = [
    {
      title: 'Executive & Pipelines',
      items: [
        { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard, perm: 'app.access' },
        { id: 'opportunities' as ActiveTab, label: 'Opportunities Tracker', icon: TableProperties, count: totalOpps, perm: 'app.access' },
        { id: 'board' as ActiveTab, label: 'Stage Matrix Board', icon: Kanban, perm: 'app.access' },
        { id: 'calendar' as ActiveTab, label: 'Calendar & Sessions', icon: Calendar, perm: 'app.access' },
      ]
    },
    {
      title: 'Solutions Engineering',
      items: [
        { id: 'poc_center' as ActiveTab, label: 'POC & Lab Sandbox', icon: FlaskConical, count: activePocs, highlight: 'amber', perm: 'run_poc_benchmarks' },
        { id: 'boq_workbench' as ActiveTab, label: 'BOQ / BOM Workbench', icon: Calculator, count: pendingBoqs > 0 ? `${pendingBoqs} apprv` : undefined, highlight: 'purple', perm: 'author_boq' },
        { id: 'action_center' as ActiveTab, label: 'Tasks & Next Actions', icon: CheckSquare, count: openActions, highlight: 'red', perm: 'app.access' },
        { id: 'handover_queue' as ActiveTab, label: 'Implementation Handover', icon: ArrowRightLeft, count: pendingHandovers > 0 ? `${pendingHandovers} ready` : undefined, highlight: 'emerald', perm: 'initiate_handover' },
        { id: 'team_capacity' as ActiveTab, label: 'Presales Team', icon: Users, perm: 'app.access' },
        { id: 'documents' as ActiveTab, label: 'Documents & SADD', icon: FileText, perm: 'author_sadd' },
        { id: 'analytics' as ActiveTab, label: 'Reports & Analytics', icon: BarChart3, perm: 'app.access' },
      ]
    },
    {
      title: 'Commercial & Accounts',
      items: [
        { id: 'clients' as ActiveTab, label: 'Clients Directory', icon: Building2, perm: 'app.access' },
        { id: 'sales_kams' as ActiveTab, label: 'Sales KAM Directory', icon: Briefcase, perm: 'app.access' },
      ]
    },
    {
      title: 'Administration & Governance',
      items: [
        { id: 'notifications' as ActiveTab, label: 'Notification Center', icon: Bell, perm: 'app.access' },
        { id: 'audit_logs' as ActiveTab, label: 'Audit Logs', icon: ShieldCheck, perm: 'sys.audit' },
        { id: 'user_management' as ActiveTab, label: 'User Management', icon: UserCheck, perm: 'sys.users' },
        { id: 'role_permissions' as ActiveTab, label: 'Role & Permissions', icon: KeyRound, perm: 'sys.rbac' },
        { id: 'scope_catalog' as ActiveTab, label: 'Scope Catalog', icon: Layers, perm: 'manage_scope_catalog' },
        { id: 'oem_catalog' as ActiveTab, label: 'OEM Catalog', icon: Factory, perm: 'manage_oem_catalog' },
        { id: 'product_catalog' as ActiveTab, label: 'Product Catalog', icon: Boxes, perm: 'manage_oem_catalog' },
        { id: 'master_config' as ActiveTab, label: 'Master Configuration', icon: Sliders, perm: 'sys.integrations' },
        { id: 'system_settings' as ActiveTab, label: 'System Settings', icon: Settings, perm: 'sys.integrations' },
      ]
    }
  ];

  const navigate = (tab: ActiveTab) => {
    setActiveTab(tab);
    onMobileClose?.();
  };

  return (
    <>
    {isMobileOpen && <button aria-label="Close navigation" onClick={onMobileClose} className="fixed inset-0 z-40 bg-black/35 md:hidden" />}
    <aside className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-white border-r border-gray-200 flex flex-col h-full min-h-0 select-none transition-transform duration-200 md:static md:z-auto md:w-60 md:translate-x-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Quick Action Button */}
      <div className="p-3 border-b border-gray-200">
        <button
          onClick={onOpenNewOpportunity}
          disabled={!canCreateOpportunity}
          title={canCreateOpportunity ? 'Create a new opportunity' : 'Your role does not allow creating opportunities'}
          className={`w-full flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold text-white rounded shadow-xs transition-colors ${
            canCreateOpportunity
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          New Opportunity
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="p-2 flex-1 overflow-y-auto min-h-0 space-y-4">
        {sections.map((sec, secIdx) => {
          const visibleItems = sec.items.filter(item => can(item.perm));
          if (visibleItems.length === 0) return null;

          return (
          <div key={secIdx} className="space-y-0.5">
            <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold">
              {sec.title}
            </div>

            {visibleItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                   onClick={() => navigate(item.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors text-left group ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200 shadow-2xs'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon
                      className={`w-3.5 h-3.5 flex-shrink-0 ${
                        isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.count !== undefined && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ml-1 flex-shrink-0 font-medium ${
                        item.highlight === 'red'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : item.highlight === 'amber'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : item.highlight === 'emerald'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : item.highlight === 'purple'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : isActive
                          ? 'bg-blue-100 text-blue-800 border-blue-200'
                          : 'bg-gray-100 text-gray-600 border-gray-200'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          );
        })}
      </div>

      {/* Footer: Current User + Demo Role Switcher */}
      <div className="p-2.5 bg-gray-50 border-t border-gray-200 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0">
            {currentUser.name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-gray-900 text-[11px] leading-tight truncate">{currentUser.name}</div>
            <div className="text-[10px] text-gray-500 font-mono leading-none truncate">{currentRoleName ?? currentUser.role}</div>
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-gray-200">
          <button
            onClick={onLogout}
            className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-gray-700 hover:text-red-700 hover:bg-red-50 border border-gray-200 rounded transition-colors"
            title="End your session"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
    </>
  );
};
