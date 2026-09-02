import React, { useState, useEffect } from 'react';
import { ActiveTab, Opportunity, OpportunityStage, ClientAccount } from './types';
import { 
  INITIAL_OPPORTUNITIES, 
  INITIAL_ENGINEERS, 
  MOCK_CLIENTS, 
  MOCK_SALES_KAMS, 
  MOCK_CALENDAR_EVENTS, 
  MOCK_CENTRAL_DOCUMENTS, 
  MOCK_NOTIFICATIONS, 
  MOCK_AUDIT_LOGS, 
  MOCK_USERS, 
  MOCK_ROLES 
} from './data/mockData';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
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
import { CommandPalette } from './components/common/CommandPalette';

const STORAGE_KEY = 'presales_tracker_opportunities_v3';

export default function App() {
  // Persistence state
  const [opportunities, setOpportunities] = useState<Opportunity[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not read from localStorage', e);
    }
    return INITIAL_OPPORTUNITIES;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [fullDetailOpportunity, setFullDetailOpportunity] = useState<Opportunity | null>(null);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [density, setDensity] = useState<'compact' | 'dense' | 'spacious'>('dense');

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(opportunities));
    } catch (e) {
      console.warn('Could not save to localStorage', e);
    }
  }, [opportunities]);

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

  // Update specific opportunity
  const handleUpdateOpportunity = (updated: Opportunity) => {
    setOpportunities(prev => prev.map(o => o.id === updated.id ? updated : o));
    if (selectedOpportunity && selectedOpportunity.id === updated.id) {
      setSelectedOpportunity(updated);
    }
    if (fullDetailOpportunity && fullDetailOpportunity.id === updated.id) {
      setFullDetailOpportunity(updated);
    }
  };

  // Quick Stage Update
  const handleUpdateStage = (oppId: string, newStage: OpportunityStage) => {
    setOpportunities(prev => prev.map(o => {
      if (o.id === oppId) {
        return {
          ...o,
          stage: newStage,
          daysInCurrentStage: 0,
          updatedAt: new Date().toISOString()
        };
      }
      return o;
    }));
  };

  // Create Opportunity
  const handleCreateOpportunity = (newOpp: Opportunity) => {
    setOpportunities(prev => [newOpp, ...prev]);
    setIsNewModalOpen(false);
    setFullDetailOpportunity(newOpp);
  };

  // Reset to Default Mock Data
  const handleResetData = () => {
    if (window.confirm('Reset all opportunity and BOQ data to default enterprise demo dataset?')) {
      setOpportunities(INITIAL_OPPORTUNITIES);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header Command Bar */}
      <Header
        opportunities={opportunities}
        onOpenNewOpportunity={() => setIsNewModalOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          setFullDetailOpportunity(null);
          setSelectedClient(null);
        }}
        onRefreshData={handleResetData}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setFullDetailOpportunity(null);
            setSelectedClient(null);
          }}
          opportunities={opportunities}
          onOpenNewOpportunity={() => setIsNewModalOpen(true)}
        />

        {/* Dynamic Center Viewport */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-gray-50 p-4">
          {/* Full Screen Opportunity Detail View (when active) */}
          {fullDetailOpportunity ? (
            <OpportunityDetailView
              opportunity={fullDetailOpportunity}
              onBack={() => setFullDetailOpportunity(null)}
              onUpdateOpportunity={handleUpdateOpportunity}
            />
          ) : selectedClient ? (
            <ClientDetailsView
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
                  events={MOCK_CALENDAR_EVENTS as any}
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
                  engineers={INITIAL_ENGINEERS}
                  opportunities={opportunities}
                  onSelectOpportunity={(opp) => setSelectedOpportunity(opp)}
                />
              )}

              {activeTab === 'documents' && (
                <CentralDocumentsRepo
                  documents={MOCK_CENTRAL_DOCUMENTS as any}
                />
              )}

              {activeTab === 'analytics' && (
                <PresalesAnalytics
                  opportunities={opportunities}
                />
              )}

              {activeTab === 'clients' && (
                <ClientsDirectory
                  clients={MOCK_CLIENTS as any}
                  opportunities={opportunities}
                  onSelectClient={(c) => setSelectedClient(c)}
                  onSelectOpportunity={(opp) => setFullDetailOpportunity(opp)}
                />
              )}

              {activeTab === 'sales_kams' && (
                <SalesKAMDirectory
                  salesKAMs={MOCK_SALES_KAMS as any}
                  opportunities={opportunities}
                  onSelectOpportunity={(opp) => setFullDetailOpportunity(opp)}
                />
              )}

              {activeTab === 'notifications' && (
                <NotificationCenter
                  notifications={MOCK_NOTIFICATIONS as any}
                  opportunities={opportunities}
                  onSelectOpportunity={(opp) => setFullDetailOpportunity(opp)}
                />
              )}

              {activeTab === 'audit_logs' && (
                <AuditLogsView
                  auditLogs={MOCK_AUDIT_LOGS as any}
                />
              )}

              {activeTab === 'user_management' && (
                <UserManagementView
                  users={MOCK_USERS as any}
                />
              )}

              {activeTab === 'role_permissions' && (
                <RoleManagementView
                  roles={MOCK_ROLES as any}
                />
              )}

              {activeTab === 'master_config' && (
                <MasterConfigView />
              )}

              {activeTab === 'system_settings' && (
                <SystemSettingsView />
              )}
            </>
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
        onOpenNewOpportunity={() => setIsNewModalOpen(true)}
      />
    </div>
  );
}
