import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ActiveTab, Opportunity, OpportunityStage, ClientAccount, UserAccount, RolePermission, AuditLogEntry, ScopeCatalogEntry, OEMEntry, ProductCatalogEntry, PresalesEngineer, SalesKAM, CalendarEvent, NotificationItem } from './types';
import {
  can,
  resolveRole,
  TAB_PERMISSIONS,
  PERMISSION_CATALOG,
  DEFAULT_ROLES,
} from './rbac';
import { api, getToken } from './api';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { AccessDenied } from './components/common/AccessDenied';
import { LoginScreen } from './components/auth/LoginScreen';
import { ChangePasswordScreen } from './components/auth/ChangePasswordScreen';
import { ExecutiveDashboard } from './components/dashboard/ExecutiveDashboard';
import { OpportunityTable } from './components/opportunities/OpportunityTable';
import { OpportunityBoard } from './components/opportunities/OpportunityBoard';
import { OpportunityDetailView } from './components/opportunities/OpportunityDetailView';
import { OpportunityDetailDrawer } from './components/opportunities/OpportunityDetailDrawer';
import { NewOpportunityView } from './components/opportunities/NewOpportunityView';
import { NewOpportunityModal } from './components/opportunities/NewOpportunityModal';
import { BOQWorkbench } from './components/boq/BOQWorkbench';
import { POCTracker } from './components/poc/POCTracker';
import { ActionCenter } from './components/actions/ActionCenter';
import { HandoverQueue } from './components/handover/HandoverQueue';
import { CapacityMatrix } from './components/capacity/CapacityMatrix';
import { PresalesAnalytics } from './components/analytics/PresalesAnalytics';
import { PresalesCalendar } from './components/calendar/PresalesCalendar';
import { ClientsDirectory } from './components/clients/ClientsDirectory';
import { ClientDetailsView } from './components/clients/ClientDetailsView';
import { SalesKAMDirectory } from './components/sales/SalesKAMDirectory';
import { CentralDocumentsRepo } from './components/documents/CentralDocumentsRepo';
import { NotificationCenter } from './components/notifications/NotificationCenter';
import { AuditLogsView } from './components/audit/AuditLogsView';
import { UserManagementView } from './components/admin/UserManagementView';
import { RoleManagementView } from './components/admin/RoleManagementView';
import { MasterConfigView } from './components/admin/MasterConfigView';
import { SystemSettingsView } from './components/admin/SystemSettingsView';
import { ScopeCatalogView } from './components/admin/ScopeCatalogView';
import { OEMCatalogView } from './components/admin/OEMCatalogView';
import { ProductCatalogView } from './components/admin/ProductCatalogView';
import { CommandPalette } from './components/common/CommandPalette';

// ---------------------------------------------------------------------------
// Server → UI shape mappers
// ---------------------------------------------------------------------------
const toRoleState = (r: any): any => ({
  id: r.id,
  roleName: r.role_name ?? r.name ?? r.roleName,
  name: r.name ?? r.role_name,
  description: r.description ?? '',
  usersCount: r.users_count ?? 0,
  isSystemRole: r.is_system_role ?? true,
  matchingRoles: Array.isArray(r.matching_roles) ? r.matching_roles : [],
  permissions: Array.isArray(r.permissions) ? r.permissions : [],
});

const toUserState = (u: any): UserAccount => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  roleId: u.role_id ?? u.roleId,
  department: u.department ?? '',
  salesTeam: u.sales_team ?? u.salesTeam,
  status: u.status ?? 'Active',
  lastLoginAt: u.last_login_at ? new Date(u.last_login_at).toISOString() : u.lastLoginAt,
  avatar: u.avatar,
  region: u.region,
  mfaEnabled: u.mfa_enabled ?? false,
  mustChangePassword: u.must_change_password ?? u.mustChangePassword ?? false,
  createdAt: u.created_at,
});

const toPresalesEngineer = (user: UserAccount, opportunities: Opportunity[]): PresalesEngineer => {
  const assigned = opportunities.filter(o => o.leadSolutionArchitect === user.name || o.presalesEngineerSecondary === user.name || (o.supportingPresalesEngineers || []).includes(user.name));
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    title: user.role,
    avatar: user.avatar || '',
    skills: [],
    activeDealsCount: assigned.filter(o => !['closed_won', 'closed_lost', 'on_hold', 'cancelled'].includes(o.stage)).length,
    totalPipelineValue: assigned.reduce((total, o) => total + (o.contractValue || 0), 0),
    activePocCount: assigned.filter(o => ['active_testing', 'validating_kpis'].includes(o.poc?.status)).length,
    utilizationPercentage: 0,
    certifications: [],
  };
};

const toSalesKAM = (user: UserAccount, opportunities: Opportunity[]): SalesKAM => {
  const assigned = opportunities.filter(o => o.accountExecutive === user.name);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    region: user.region || 'Unassigned',
    accountsCount: new Set(assigned.map(o => o.clientName)).size,
    quotaTarget: 0,
    achievedPipeline: assigned.reduce((total, o) => total + (o.contractValue || 0), 0),
    assignedLeadSA: assigned[0]?.leadSolutionArchitect || '—',
    avatar: user.avatar || '',
  };
};

const toLiveCalendarEvents = (opportunities: Opportunity[]): CalendarEvent[] => opportunities.flatMap(opportunity => [
  ...(opportunity.activities || []).map(activity => {
    const date = new Date(activity.timestamp);
    return { id: `activity-${opportunity.id}-${activity.id}`, title: activity.title, type: activity.type, date: Number.isNaN(date.getTime()) ? opportunity.updatedAt.slice(0, 10) : date.toISOString().slice(0, 10), time: Number.isNaN(date.getTime()) ? 'Time not recorded' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), opportunityCode: opportunity.code, clientName: opportunity.clientName, attendees: activity.attendees || [], location: 'Opportunity Timeline', status: 'Completed' } as CalendarEvent;
  }),
  ...(opportunity.actionItems || []).filter(action => !action.isCompleted).map(action => ({ id: `action-${opportunity.id}-${action.id}`, title: action.title, type: 'Follow-up', date: action.dueDate, time: 'All day', opportunityCode: opportunity.code, clientName: opportunity.clientName, attendees: [action.assignedTo], location: 'Action Center', status: 'Pending' } as CalendarEvent)),
  ...(opportunity.tender?.submissionDeadline ? [{ id: `tender-${opportunity.id}`, title: `${opportunity.tender.tenderName || opportunity.name} submission deadline`, type: 'RFP Due Date', date: opportunity.tender.submissionDeadline, time: 'All day', opportunityCode: opportunity.code, clientName: opportunity.clientName, attendees: [], location: 'Tender Workspace', status: 'Pending' } as CalendarEvent] : []),
]);

const toLiveNotifications = (opportunities: Opportunity[]): NotificationItem[] => {
  const now = new Date();
  return opportunities.flatMap(opportunity => [
    ...(opportunity.actionItems || []).filter(action => !action.isCompleted && new Date(action.dueDate) < now).map(action => ({ id: `alert-action-${opportunity.id}-${action.id}`, title: 'Overdue follow-up', message: `${action.title} is overdue for ${opportunity.clientName}.`, type: 'sla_breach', timestamp: action.dueDate, read: false, opportunityId: opportunity.id, opportunityCode: opportunity.code } as NotificationItem)),
    ...(['draft', 'pending_sa_lead', 'pending_sales_vp', 'pending_finance'].includes(opportunity.boq?.approvalStatus || '') ? [{ id: `alert-boq-${opportunity.id}`, title: 'BOQ approval required', message: `${opportunity.code} is awaiting BOQ approval before commercial handoff.`, type: 'approval_required', timestamp: opportunity.updatedAt, read: false, opportunityId: opportunity.id, opportunityCode: opportunity.code } as NotificationItem] : []),
    ...(['active_testing', 'validating_kpis'].includes(opportunity.poc?.status) ? [{ id: `alert-poc-${opportunity.id}`, title: 'POC milestone active', message: `${opportunity.code} has an active POC validation milestone.`, type: 'poc_milestone', timestamp: opportunity.updatedAt, read: false, opportunityId: opportunity.id, opportunityCode: opportunity.code } as NotificationItem] : []),
    ...(opportunity.stage === 'closed_won' && !opportunity.handover?.isHandedOver ? [{ id: `alert-handover-${opportunity.id}`, title: 'Implementation handover pending', message: `${opportunity.code} is closed won and awaiting delivery handover.`, type: 'info', timestamp: opportunity.updatedAt, read: false, opportunityId: opportunity.id, opportunityCode: opportunity.code } as NotificationItem] : []),
    ...(opportunity.tender?.isTender && opportunity.tender.submissionDeadline && new Date(opportunity.tender.submissionDeadline) >= now ? [{ id: `alert-tender-${opportunity.id}`, title: 'Tender deadline upcoming', message: `${opportunity.tender.tenderName || opportunity.name} submission deadline is ${opportunity.tender.submissionDeadline}.`, type: 'info', timestamp: opportunity.tender.submissionDeadline, read: false, opportunityId: opportunity.id, opportunityCode: opportunity.code } as NotificationItem] : []),
  ]);
};

const toLiveCentralDocuments = (opportunities: Opportunity[]) => opportunities.flatMap(opportunity => (opportunity.documents || []).map(document => ({
  id: document.id,
  title: document.title,
  category: document.type,
  fileType: document.fileName?.split('.').pop()?.toUpperCase() || 'FILE',
  fileSize: document.size,
  author: document.uploadedBy,
  lastUpdated: document.uploadedAt,
  version: document.version,
  clientName: opportunity.clientName,
  tags: [opportunity.code, opportunity.clientName],
  downloadCount: 0,
})));

const toAuditShape = (a: any): AuditLogEntry => ({
  id: `audit-${a.id}`,
  timestamp: a.created_at ? new Date(a.created_at).toISOString() : '',
  actor: a.meta?.actor ?? a.actor_email,
  actorName: a.meta?.actor ?? a.actor_email,
  actorRole: a.meta?.actorRole ?? a.actor_role ?? '',
  action: a.action,
  targetType: a.target_type,
  targetId: a.target_id,
  targetName: a.meta?.targetName ?? '',
  entityCode: a.meta?.entityCode ?? a.meta?.targetName ?? a.target_id ?? '',
  details: a.meta?.details ?? (a.meta ? JSON.stringify(a.meta) : ''),
  ipAddress: a.ip ?? a.meta?.ipAddress ?? '',
  requestId: a.request_id ?? '',
});

function hydrateCurrency(value?: string) {
  if (value === 'BDT' || value === 'USD' || value === 'EUR') {
    window.localStorage.setItem('presales_tracker_currency_v1', value);
  }
}

function hydrateActivityTypes(value?: string[]) {
  if (Array.isArray(value) && value.length) window.localStorage.setItem('presales_tracker_activity_types_v1', JSON.stringify(value));
}

const flatPermissions = (perms: any): string[] =>
  Array.isArray(perms) && typeof perms[0] === 'string'
    ? (perms as string[])
    : (perms as any[]).flatMap((g: any) =>
        g && Array.isArray(g.items) ? g.items.filter((p: any) => p?.granted).map((p: any) => p.key) : [],
      );

export default function App() {
  // Auth / session state
  const [bootState, setBootState] = useState<'loading' | 'ready'>('loading');
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

  // Persistence state (server-backed)
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [clients, setClients] = useState<ClientAccount[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [scopes, setScopes] = useState<ScopeCatalogEntry[]>([]);
  const [oems, setOems] = useState<OEMEntry[]>([]);
  const [products, setProducts] = useState<ProductCatalogEntry[]>([]);
  const [roles, setRoles] = useState<RolePermission[]>(DEFAULT_ROLES as RolePermission[]);

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [fullDetailOpportunity, setFullDetailOpportunity] = useState<Opportunity | null>(null);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [density, setDensity] = useState<'compact' | 'dense' | 'spacious'>('dense');
  const [, setCurrencyVersion] = useState(0);

  useEffect(() => {
    const refreshCurrency = () => setCurrencyVersion(value => value + 1);
    window.addEventListener('presales:currency-changed', refreshCurrency);
    return () => window.removeEventListener('presales:currency-changed', refreshCurrency);
  }, []);

  // ---------------------------------------------------------------------------
  // Bootstrap: restore the JWT session and pull the full dataset server-side.
  // ---------------------------------------------------------------------------
  const applyBootstrap = useCallback((data: any) => {
    hydrateCurrency(data.currency);
    hydrateActivityTypes(data.activityTypes);
    setRoles((data.roles ?? []).map(toRoleState));
    setOpportunities((data.opportunities ?? []) as Opportunity[]);
    setClients((data.clients ?? []) as ClientAccount[]);
    setUsers((data.users ?? []).map(toUserState));
    setAuditLogs((data.auditLogs ?? []).map(toAuditShape));
    setScopes((data.scopes ?? []) as ScopeCatalogEntry[]);
    setOems((data.oems ?? []) as OEMEntry[]);
    setProducts((data.products ?? []) as ProductCatalogEntry[]);
  }, []);

  useEffect(() => {
    const onUnauthorized = () => setCurrentUser(null);
    window.addEventListener('presales:unauthorized', onUnauthorized);
    return () => window.removeEventListener('presales:unauthorized', onUnauthorized);
  }, []);

  const refreshFromServer = useCallback(async () => {
    const data = await api.bootstrap();
    applyBootstrap(data);
    return data;
  }, [applyBootstrap]);

  useEffect(() => {
    (async () => {
      try {
        if (!getToken()) {
          setCurrentUser(null);
          return;
        }
        const data = await api.bootstrap();
        applyBootstrap(data);
        setCurrentUser(toUserState(data.user));
      } catch {
        setCurrentUser(null);
      } finally {
        setBootState('ready');
      }
    })();
  }, [applyBootstrap]);

  const handleLogin = useCallback(async (user: any) => {
    setCurrentUser(toUserState(user));
    setActiveTab('dashboard');
    setFullDetailOpportunity(null);
    setSelectedClient(null);
    try {
      const data = await api.bootstrap();
      applyBootstrap(data);
      setCurrentUser(toUserState(data.user));
    } catch {
      /* keep logged in with minimal data */
    }
  }, [applyBootstrap]);

  const handleLogout = useCallback(() => {
    api.logout();
    setCurrentUser(null);
    setSelectedOpportunity(null);
    setFullDetailOpportunity(null);
    setSelectedClient(null);
    setActiveTab('dashboard');
  }, []);

  const canDo = useCallback(
    (permission: string) => can(roles, currentUser, permission),
    [roles, currentUser],
  );

  const currentRole = resolveRole(roles, currentUser);
  const currentRoleName = (currentRole as any)?.roleName ?? (currentRole as any)?.name ?? currentUser?.role ?? null;

  const handleCreateOpportunityRequest = useCallback(() => {
    if (canDo('create_opportunity')) {
      setIsNewModalOpen(true);
    }
  }, [canDo]);

  // Global Keyboard Navigation (Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ---------------------------------------------------------------------------
  // Opportunity CRUD (server-backed, optimistic)
  // ---------------------------------------------------------------------------
  const updateOpportunityLocally = useCallback((updated: Opportunity) => {
    setOpportunities(prev => prev.map(o => o.id === updated.id ? updated : o));
    if (selectedOpportunity && selectedOpportunity.id === updated.id) setSelectedOpportunity(updated);
    if (fullDetailOpportunity && fullDetailOpportunity.id === updated.id) setFullDetailOpportunity(updated);
  }, [selectedOpportunity, fullDetailOpportunity]);

  const handleUpdateOpportunity = useCallback((updated: Opportunity) => {
    const prev = opportunities.find(o => o.id === updated.id);
    updateOpportunityLocally(updated);
    api.updateOpportunity(updated).catch(async () => {
      window.alert('Could not save changes. Reverting to the last saved state.');
      if (prev) updateOpportunityLocally(prev);
    });
  }, [opportunities, updateOpportunityLocally]);

  const handleUpdateStage = useCallback((oppId: string, newStage: OpportunityStage) => {
    api.setStage(oppId, String(newStage)).then(doc => {
      updateOpportunityLocally({ ...doc, daysInCurrentStage: 0 });
    }).catch(() => {
      window.alert('Could not promote the stage. Please try again.');
    });
  }, [updateOpportunityLocally]);

  const handleCreateOpportunity = useCallback((newOpp: Opportunity) => {
    api.createOpportunity(newOpp).then(created => {
      setOpportunities(prev => [created, ...prev]);
      setIsNewModalOpen(false);
      setFullDetailOpportunity(created);
    }).catch(() => {
      window.alert('Could not create the opportunity. Please try again.');
    });
  }, []);

  // Reset to Default Dataset (admin)
  const handleResetData = useCallback(async () => {
    if (!window.confirm('Reset all opportunity and BOQ data to the default enterprise demo dataset?')) return;
    try {
      await api.resetData();
      await refreshFromServer();
    } catch {
      window.alert('Reset failed. Please try again.');
    }
  }, [refreshFromServer]);

  // ---------------------------------------------------------------------------
  // Scope / Solution catalog CRUD (admin-governed taxonomy per Section 5)
  // ---------------------------------------------------------------------------
  const handleCreateScope = useCallback(async (payload: any) => {
    const created = await api.createScope(payload);
    setScopes(prev => [...prev, created]);
    return created;
  }, []);

  const handleUpdateScope = useCallback(async (scopeId: string, payload: any) => {
    const updated = await api.updateScope(scopeId, payload);
    setScopes(prev => prev.map(s => (s.id === scopeId ? updated : s)));
    return updated;
  }, []);

  const handleDeleteScope = useCallback(async (scopeId: string) => {
    await api.deleteScope(scopeId);
    setScopes(prev => prev.filter(s => s.id !== scopeId));
  }, []);

  // ---------------------------------------------------------------------------
  // OEM & Product catalog CRUD (admin-governed, Sections 10 & 11)
  // ---------------------------------------------------------------------------
  const handleCreateOEM = useCallback(async (payload: any) => {
    const created = await api.createOEM(payload);
    setOems(prev => [...prev, created]);
    return created;
  }, []);

  const handleUpdateOEM = useCallback(async (oemId: string, payload: any) => {
    const updated = await api.updateOEM(oemId, payload);
    setOems(prev => prev.map(o => (o.id === oemId ? updated : o)));
    return updated;
  }, []);

  const handleDeleteOEM = useCallback(async (oemId: string) => {
    await api.deleteOEM(oemId);
    setOems(prev => prev.filter(o => o.id !== oemId));
  }, []);

  const handleCreateProduct = useCallback(async (payload: any) => {
    const created = await api.createProduct(payload);
    const oem = oems.find(o => o.id === created.oem_id);
    setProducts(prev => [...prev, { ...created, oem_name: oem?.name ?? created.oem_name ?? null }]);
    return created;
  }, [oems]);

  const handleUpdateProduct = useCallback(async (productId: string, payload: any) => {
    const updated = await api.updateProduct(productId, payload);
    const oem = oems.find(o => o.id === updated.oem_id);
    setProducts(prev => prev.map(p => (p.id === productId ? { ...updated, oem_name: oem?.name ?? null } : p)));
    return updated;
  }, [oems]);

  const handleDeleteProduct = useCallback(async (productId: string) => {
    await api.deleteProduct(productId);
    setProducts(prev => prev.filter(p => p.id !== productId));
  }, []);

  // ---------------------------------------------------------------------------
  // RBAC policy persistence (server-authoritative, diff-based)
  // ---------------------------------------------------------------------------
  const updateRoles = useCallback((next: RolePermission[]) => {
    const prevById = new Map<string, RolePermission>(roles.map(r => [r.id, r] as [string, RolePermission]));
    setRoles(next);

    for (const role of next) {
      const prev = prevById.get(role.id);
      const perms = flatPermissions(role.permissions);
      if (!prev) {
        api.createRole({
          roleName: role.roleName ?? role.name ?? '(unnamed role)',
          description: role.description,
          permissions: perms,
        }).then(created => {
          if (created?.id && created.id !== role.id) {
            setRoles(cur => cur.map(r => (r.id === role.id ? { ...r, id: created.id } : r)));
          }
        }).catch(() => window.alert('Could not save the new role.'));
      } else if (JSON.stringify(flatPermissions(prev.permissions)) !== JSON.stringify(perms)) {
        api.updateRole(role.id, perms).catch(() => window.alert('Could not save permission changes.'));
      }
    }
  }, [roles]);

  if (bootState === 'loading') {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 text-sm text-gray-500 font-mono">
        Loading workspace…
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (currentUser.mustChangePassword) {
    return (
      <ChangePasswordScreen
        userName={currentUser.name}
        onChanged={async () => {
          try {
            const data = await refreshFromServer();
            setCurrentUser(toUserState(data.user));
          } catch {
            setCurrentUser(null);
          }
        }}
      />
    );
  }

  const liveCalendarEvents = useMemo(() => toLiveCalendarEvents(opportunities), [opportunities]);
  const liveNotifications = useMemo(() => toLiveNotifications(opportunities), [opportunities]);
  const liveCentralDocuments = useMemo(() => toLiveCentralDocuments(opportunities), [opportunities]);

  return (
    <div className="h-screen overflow-hidden bg-gray-50 text-gray-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header Command Bar */}
      <Header
        opportunities={opportunities}
        onOpenNewOpportunity={handleCreateOpportunityRequest}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          setFullDetailOpportunity(null);
          setSelectedClient(null);
        }}
         onRefreshData={handleResetData}
         onToggleSidebar={() => setIsMobileSidebarOpen(true)}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Navigation Sidebar */}
          <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setFullDetailOpportunity(null);
            setSelectedClient(null);
          }}
          opportunities={opportunities}
          onOpenNewOpportunity={handleCreateOpportunityRequest}
          can={canDo}
          canCreateOpportunity={canDo('create_opportunity')}
          currentUser={currentUser}
          currentRoleName={currentRoleName}
           onLogout={handleLogout}
           isMobileOpen={isMobileSidebarOpen}
           onMobileClose={() => setIsMobileSidebarOpen(false)}
         />

        {/* Dynamic Center Viewport */}
        <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-y-auto bg-gray-50 p-2 sm:p-4">
          {/* RBAC view guard: block access if the active tab is not permitted */}
          {canDo(TAB_PERMISSIONS[activeTab] ?? 'app.access') ? (
          <>
          {/* Full Screen Opportunity Detail View (when active) */}
          {fullDetailOpportunity ? (
            <OpportunityDetailView
              key={fullDetailOpportunity.id}
              opportunity={fullDetailOpportunity}
              onBack={() => setFullDetailOpportunity(null)}
              onUpdateOpportunity={handleUpdateOpportunity}
            />
          ) : selectedClient ? (
            <ClientDetailsView
              key={selectedClient.id}
              client={selectedClient}
              opportunities={opportunities}
              onBack={() => setSelectedClient(null)}
              onSelectOpportunity={(opp) => setFullDetailOpportunity(opp)}
            />
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <ExecutiveDashboard
                  opportunities={opportunities}
                  onSelectOpportunity={(opp) => setFullDetailOpportunity(opp)}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  onOpenNewModal={() => setIsNewModalOpen(true)}
                />
              )}

              {activeTab === 'opportunities' && (
                <OpportunityTable
                  opportunities={opportunities}
                  onSelectOpportunity={(opp) => setSelectedOpportunity(opp)}
                  onUpdateStage={handleUpdateStage}
                  onOpenNewModal={() => setIsNewModalOpen(true)}
                  density={density}
                />
              )}

              {activeTab === 'board' && (
                <OpportunityBoard
                  opportunities={opportunities}
                  onSelectOpportunity={(opp) => setSelectedOpportunity(opp)}
                  onUpdateStage={handleUpdateStage}
                />
              )}

              {activeTab === 'calendar' && (
                <PresalesCalendar
                  events={liveCalendarEvents}
                  opportunities={opportunities}
                  onSelectOpportunity={(opp) => setFullDetailOpportunity(opp)}
                />
              )}

              {activeTab === 'poc_center' && (
                <POCTracker
                  opportunities={opportunities}
                  onSelectOpportunity={(opp) => setSelectedOpportunity(opp)}
                  onUpdateOpportunity={handleUpdateOpportunity}
                />
              )}

              {activeTab === 'boq_workbench' && (
                <BOQWorkbench
                  opportunities={opportunities}
                  onUpdateOpportunity={handleUpdateOpportunity}
                  onSelectOpportunity={(opp) => setSelectedOpportunity(opp)}
                  products={products}
                  oems={oems}
                />
              )}

              {activeTab === 'action_center' && (
                <ActionCenter
                  opportunities={opportunities}
                  onSelectOpportunity={(opp) => setSelectedOpportunity(opp)}
                  onUpdateOpportunity={handleUpdateOpportunity}
                />
              )}

              {activeTab === 'handover_queue' && (
                <HandoverQueue
                  opportunities={opportunities}
                  onSelectOpportunity={(opp) => setSelectedOpportunity(opp)}
                  onUpdateOpportunity={handleUpdateOpportunity}
                />
              )}

              {activeTab === 'team_capacity' && (
                <CapacityMatrix
                  engineers={users.filter(user => user.roleId === 'role-sa' || user.department === 'Solutions Engineering').map(user => toPresalesEngineer(user, opportunities))}
                  opportunities={opportunities}
                  onSelectOpportunity={(opp) => setSelectedOpportunity(opp)}
                />
              )}

              {activeTab === 'documents' && (
                <CentralDocumentsRepo
                  documents={liveCentralDocuments}
                />
              )}

              {activeTab === 'analytics' && (
                <PresalesAnalytics
                  opportunities={opportunities}
                />
              )}

              {activeTab === 'clients' && (
                <ClientsDirectory
                  clients={clients}
                  opportunities={opportunities}
                  onSelectClient={(c) => setSelectedClient(c)}
                  onSelectOpportunity={(opp) => setFullDetailOpportunity(opp)}
                  onAddClient={async (client) => {
                    try {
                      const saved = await api.createClient(client);
                      setClients(current => [saved, ...current.filter(item => item.id !== saved.id)]);
                    } catch (error) {
                      console.error('Failed to persist client profile:', error);
                    }
                  }}
                  onUpdateClient={async (client) => {
                    try {
                      const saved = await api.updateClient(client.id, client);
                      setClients(current => current.map(item => item.id === saved.id ? saved : item));
                    } catch (error) {
                      console.error('Failed to update client profile:', error);
                    }
                  }}
                />
              )}

              {activeTab === 'sales_kams' && (
                <SalesKAMDirectory
                  salesKAMs={users.filter(user => user.roleId === 'role-kam' || user.role === 'Sales KAM').map(user => toSalesKAM(user, opportunities))}
                  opportunities={opportunities}
                  onSelectOpportunity={(opp) => setFullDetailOpportunity(opp)}
                />
              )}

              {activeTab === 'notifications' && (
                <NotificationCenter
                  notifications={liveNotifications}
                  opportunities={opportunities}
                  onSelectOpportunity={(opp) => setFullDetailOpportunity(opp)}
                />
              )}

              {activeTab === 'audit_logs' && (
                <AuditLogsView
                  auditLogs={auditLogs}
                />
              )}

              {activeTab === 'user_management' && (
                <UserManagementView
                  users={users}
                  roles={roles as RolePermission[]}
                  onCreateUser={async (payload) => {
                    const roleId = resolveRole(roles, { ...currentUser, role: payload.role, roleId: undefined })?.id ?? 'role-sa';
                    const resp = await api.createUser({ ...payload, roleId });
                    const createdUser = toUserState(resp);
                    setUsers(current => [createdUser, ...current.filter(user => user.id !== createdUser.id)]);
                    return resp as any;
                  }}
                  onUpdateUser={async (user) => {
                    const roleId = resolveRole(roles, user)?.id ?? user.roleId ?? 'role-sa';
                    await api.updateUser(user.id, { name: user.name, email: user.email, role: user.role, roleId, department: user.department, region: user.region, status: user.status, });
                    setUsers(current => current.map(item => item.id === user.id ? { ...item, ...user, roleId } : item));
                  }}
                />
              )}

              {activeTab === 'role_permissions' && (
                <RoleManagementView
                  roles={roles as any}
                  onRolesChange={updateRoles}
                />
              )}

              {activeTab === 'master_config' && (
                <MasterConfigView />
              )}

              {activeTab === 'scope_catalog' && (
                <ScopeCatalogView
                  scopes={scopes}
                  canManage={canDo('manage_scope_catalog')}
                  onCreate={handleCreateScope}
                  onUpdate={handleUpdateScope}
                  onDelete={handleDeleteScope}
                />
              )}

              {activeTab === 'oem_catalog' && (
                <OEMCatalogView
                  oems={oems}
                  canManage={canDo('manage_oem_catalog')}
                  onCreate={handleCreateOEM}
                  onUpdate={handleUpdateOEM}
                  onDelete={handleDeleteOEM}
                />
              )}

              {activeTab === 'product_catalog' && (
                <ProductCatalogView
                  products={products}
                  oems={oems}
                  canManage={canDo('manage_oem_catalog')}
                  onCreate={handleCreateProduct}
                  onUpdate={handleUpdateProduct}
                  onDelete={handleDeleteProduct}
                />
              )}

              {activeTab === 'system_settings' && (
                <SystemSettingsView />
              )}
            </>
          )}
          </>
          ) : (
            <AccessDenied
              roleName={currentRoleName}
              requiredPermission={TAB_PERMISSIONS[activeTab] ?? 'app.access'}
              permissionLabel={
                PERMISSION_CATALOG.find(p => p.key === (TAB_PERMISSIONS[activeTab] ?? 'app.access'))?.name ?? null
              }
              onBack={() => setActiveTab('dashboard')}
            />
          )}
        </main>
      </div>

      {/* Slide-over Deep Opportunity Inspector Drawer */}
      {selectedOpportunity && !fullDetailOpportunity && (
        <OpportunityDetailDrawer
          opportunity={selectedOpportunity}
          onClose={() => setSelectedOpportunity(null)}
          onUpdateOpportunity={handleUpdateOpportunity}
          onOpenFullDetail={(opp) => {
            setSelectedOpportunity(null);
            setFullDetailOpportunity(opp);
          }}
        />
      )}

      {/* New Opportunity Modal */}
      <NewOpportunityModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onCreateOpportunity={handleCreateOpportunity}
        scopes={scopes}
        users={users}
      />

      {/* Global Command Palette (Cmd+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        opportunities={opportunities}
        onSelectOpportunity={(opp) => {
          setSelectedOpportunity(null);
          setFullDetailOpportunity(opp);
        }}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          setFullDetailOpportunity(null);
          setSelectedClient(null);
        }}
        onOpenNewOpportunity={handleCreateOpportunityRequest}
      />
    </div>
  );
}
