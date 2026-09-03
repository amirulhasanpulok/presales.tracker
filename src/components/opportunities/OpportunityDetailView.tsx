import React, { useState } from 'react';
import { Opportunity, OpportunitySubView, OpportunityStage } from '../../types';
import { 
  ArrowLeft, 
  Building2, 
  Calendar, 
  DollarSign, 
  Layers, 
  Share2, 
  Download, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  Sparkles,
  Users,
  FileText,
  Calculator,
  Cpu,
  TrendingUp,
  ShieldCheck,
  Gavel
} from 'lucide-react';
import { PriorityBadge, StageBadge, TechFitBadge } from '../common/Badge';
import { STAGE_CONFIG } from '../../data/mockData';
import { exportOpportunitySADDMarkdown, exportOpportunityJSON, exportBOQCSV } from '../../utils/exportUtils';
import { formatCurrency } from '../../utils/currency';
import { OpportunityOverview } from './subviews/OpportunityOverview';
import { OpportunityTimeline } from './subviews/OpportunityTimeline';
import { OpportunityTasks } from './subviews/OpportunityTasks';
import { OpportunityStakeholders } from './subviews/OpportunityStakeholders';
import { OpportunityDocuments } from './subviews/OpportunityDocuments';
import { OpportunityBOQ } from './subviews/OpportunityBOQ';
import { OpportunityTechnical } from './subviews/OpportunityTechnical';
import { OpportunitySales } from './subviews/OpportunitySales';
import { OpportunityImplementation } from './subviews/OpportunityImplementation';
import { TenderAndOutcome } from './subviews/TenderAndOutcome';
import { api } from '../../api';

interface OpportunityDetailViewProps {
  opportunity: Opportunity;
  initialSubView?: OpportunitySubView;
  onBack: () => void;
  onUpdateOpportunity?: (opp: Opportunity) => void;
}

export const OpportunityDetailView: React.FC<OpportunityDetailViewProps> = ({
  opportunity,
  initialSubView = 'overview',
  onBack,
  onUpdateOpportunity,
}) => {
  const [activeSubView, setActiveSubView] = useState<OpportunitySubView>(initialSubView);
  const [currentStage, setCurrentStage] = useState<OpportunityStage>(opportunity.stage);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const stagesList: OpportunityStage[] = [
    'qualification',
    'tech_discovery',
    'solution_design',
    'poc_demo',
    'proposal_boq',
    'commercial_negotiation',
    'closed_won',
    'closed_lost',
    'on_hold',
    'cancelled'
  ];

  const handleStageChange = (newStage: OpportunityStage) => {
    setCurrentStage(newStage);
    const updated = { ...opportunity, stage: newStage, daysInCurrentStage: 0 };
    if (onUpdateOpportunity) onUpdateOpportunity(updated);
  };

  const subTabs: { id: OpportunitySubView; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'overview', label: 'Overview', icon: Layers },
    { id: 'timeline', label: 'Activity Timeline', icon: Clock },
    { id: 'tasks', label: 'Tasks & Actions', icon: CheckCircle2 },
    { id: 'stakeholders', label: 'Stakeholders', icon: Users },
    { id: 'documents', label: 'Documents & SADD', icon: FileText },
    { id: 'boq', label: 'BOQ / BOM Sizing', icon: Calculator },
    { id: 'technical', label: 'Technical & POC', icon: Cpu },
    { id: 'sales', label: 'Sales & Forecast', icon: TrendingUp },
    { id: 'implementation', label: 'Implementation Handover', icon: ShieldCheck },
    { id: 'tender', label: 'Tender & Outcome', icon: Gavel }
  ];

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-white border border-gray-200 rounded p-4 space-y-3">
        {/* Navigation Breadcrumb & Back */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-blue-700 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Tracker
            </button>
            <span className="text-gray-300">/</span>
            <span className="text-xs font-mono font-bold text-gray-500">{opportunity.code}</span>
            <span className="text-gray-300">/</span>
            <span className="text-xs font-semibold text-gray-800">{opportunity.clientName}</span>
          </div>

          <div className="flex items-center gap-2">
            <PriorityBadge priority={opportunity.priority} />
            <TechFitBadge score={opportunity.technicalFitScore} />
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 shadow-2xs"
              >
                <Download className="w-3 h-3 text-blue-600" />
                Export Deliverables
                <ChevronRight className={`w-3 h-3 transition-transform ${showExportMenu ? 'rotate-90' : ''}`} />
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded shadow-lg z-50 py-1 text-xs divide-y divide-gray-100">
                  <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-gray-400 font-mono">
                    Deliverable Formats
                  </div>
                  <button
                    onClick={() => {
                      exportOpportunitySADDMarkdown(opportunity);
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 font-medium"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <div>
                      <div className="font-semibold text-gray-900">SADD Document (.md)</div>
                      <div className="text-[10px] text-gray-500">Architecture design & KPIs</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      exportBOQCSV(opportunity);
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 font-medium"
                  >
                    <Calculator className="w-3.5 h-3.5 text-emerald-600" />
                    <div>
                      <div className="font-semibold text-gray-900">BOQ Pricing Sheet (.csv)</div>
                      <div className="text-[10px] text-gray-500">Line items, margins & discounts</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      exportOpportunityJSON(opportunity);
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 font-medium"
                  >
                    <Download className="w-3.5 h-3.5 text-purple-600" />
                    <div>
                      <div className="font-semibold text-gray-900">Full JSON Package (.json)</div>
                      <div className="text-[10px] text-gray-500">Raw deal payload & stakeholders</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Title, Value, & Owners */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2 border-t border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900 tracking-tight break-words">{opportunity.name}</h1>
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono font-semibold border border-blue-200">
                {opportunity.primaryTechStack}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
              <span className="flex items-center gap-1 text-gray-700 font-medium">
                <Building2 className="w-3.5 h-3.5 text-gray-400" />
                {opportunity.clientName} ({opportunity.clientIndustry})
              </span>
              <span>•</span>
              <span>Region: <strong className="text-gray-700">{opportunity.region}</strong></span>
              <span>•</span>
              <span>Lead SA: <strong className="text-gray-700">{opportunity.leadSolutionArchitect}</strong></span>
              <span>•</span>
              <span>Sales KAM: <strong className="text-gray-700">{opportunity.accountExecutive}</strong></span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4 bg-gray-50 p-2.5 rounded border border-gray-200 flex-shrink-0">
            <div className="text-right">
              <div className="text-[10px] uppercase font-semibold text-gray-500">Contract Value (TCV)</div>
               <div className="text-base font-bold font-mono text-gray-900">{formatCurrency(opportunity.contractValue)}</div>
            </div>
            <div className="h-7 w-[1px] bg-gray-300" />
            <div className="text-right">
              <div className="text-[10px] uppercase font-semibold text-gray-500">ARR Value</div>
               <div className="text-base font-bold font-mono text-blue-700">{formatCurrency(opportunity.arr)}/yr</div>
            </div>
            <div className="h-7 w-[1px] bg-gray-300" />
            <div className="text-right">
              <div className="text-[10px] uppercase font-semibold text-gray-500">Win Rate</div>
              <div className="text-base font-bold font-mono text-emerald-700">{opportunity.winProbability}%</div>
            </div>
          </div>
        </div>

        {/* Stage Progression Stepper */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Presales Pipeline Gate:</span>
            <span className="text-xs font-semibold text-blue-700">
              {STAGE_CONFIG[currentStage]?.label || currentStage}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5">
            {stagesList.map((st, idx) => {
              const isActive = currentStage === st;
              const isPassed = stagesList.indexOf(currentStage) > idx;
              return (
                <button
                  key={st}
                  onClick={() => handleStageChange(st)}
                  className={`p-1.5 rounded text-left text-xs transition-all border ${
                    isActive ? 'bg-blue-600 text-white border-blue-700 font-bold shadow-xs' :
                    isPassed ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-medium' :
                    'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="text-[10px] uppercase tracking-wider font-mono opacity-80">
                    Step {idx + 1}
                  </div>
                  <div className="truncate font-semibold text-[11px]">
                    {STAGE_CONFIG[st]?.shortLabel || st}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sub-view Tabs Navigation Bar */}
      <div className="bg-white border border-gray-200 rounded p-1.5 flex items-center overflow-x-auto gap-1">
        {subTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubView(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-all ${
                isActive 
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-transparent'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Active Sub-screen Render */}
      <div>
        {activeSubView === 'overview' && (
          <OpportunityOverview 
            opportunity={opportunity} 
            onNavigateSubView={(sub) => setActiveSubView(sub)} 
          />
        )}
        {activeSubView === 'timeline' && (
          <OpportunityTimeline
            opportunity={opportunity}
            onAddActivity={(activity) => {
              api.addActivity(opportunity.id, activity)
                .then(updated => onUpdateOpportunity?.(updated))
                .catch(() => window.alert('Could not save the activity. Please try again.'));
            }}
          />
        )}
        {activeSubView === 'tasks' && (
          <OpportunityTasks 
            opportunity={opportunity} 
            onUpdateTask={(taskId, isCompleted) => {
              const updatedTasks = opportunity.actionItems.map(t => t.id === taskId ? { ...t, isCompleted } : t);
              if (onUpdateOpportunity) {
                onUpdateOpportunity({ ...opportunity, actionItems: updatedTasks });
              }
            }}
            onAddTask={(task) => {
              if (onUpdateOpportunity) {
                onUpdateOpportunity({ ...opportunity, actionItems: [task, ...opportunity.actionItems] });
              }
            }}
          />
        )}
        {activeSubView === 'stakeholders' && (
          <OpportunityStakeholders 
            opportunity={opportunity} 
            onAddStakeholder={(stk) => {
              if (onUpdateOpportunity) {
                onUpdateOpportunity({ ...opportunity, stakeholders: [...opportunity.stakeholders, stk] });
              }
            }}
          />
        )}
        {activeSubView === 'documents' && (
          <OpportunityDocuments 
            opportunity={opportunity}
            onUploadDoc={(doc) => {
              api.uploadDocument(opportunity.id, doc)
                .then(updated => onUpdateOpportunity?.(updated))
                .catch(() => window.alert('Could not upload the document. Please try again.'));
            }}
          />
        )}
        {activeSubView === 'boq' && (
          <OpportunityBOQ 
            opportunity={opportunity} 
            onUpdateBOQ={(boq) => {
              if (onUpdateOpportunity) {
                onUpdateOpportunity({ ...opportunity, boq, contractValue: boq.totalContractValue });
              }
            }}
          />
        )}
        {activeSubView === 'technical' && (
          <OpportunityTechnical 
            opportunity={opportunity} 
            onUpdateOpportunity={onUpdateOpportunity}
          />
        )}
        {activeSubView === 'sales' && (
          <OpportunitySales 
            opportunity={opportunity} 
          />
        )}
        {activeSubView === 'implementation' && (
          <OpportunityImplementation 
            opportunity={opportunity} 
            onUpdateOpportunity={onUpdateOpportunity}
          />
        )}
        {activeSubView === 'tender' && (
          <TenderAndOutcome 
            opportunity={opportunity} 
            onUpdateOpportunity={onUpdateOpportunity}
          />
        )}
      </div>
    </div>
  );
};
