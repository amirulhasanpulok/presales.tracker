import React, { useState } from 'react';
import { 
  X, 
  Layers, 
  FileText, 
  FlaskConical, 
  Calculator, 
  Users, 
  CheckSquare, 
  ArrowRightLeft, 
  Clock, 
  ShieldCheck, 
  Plus, 
  Check, 
  AlertCircle, 
  DollarSign, 
  Calendar, 
  ExternalLink, 
  CheckCircle2, 
  Download, 
  Trash2, 
  AlertTriangle,
  UserCheck,
  Send,
  Building,
  Globe
} from 'lucide-react';
import { Opportunity, OpportunityStage, BOQItem, Stakeholder, ActionItem, PresalesActivity, POCStatus } from '../../types';
import { STAGE_CONFIG } from '../../data/mockData';
import { StageBadge, PriorityBadge, ComplexityBadge, POCBadge, TechFitBadge } from '../common/Badge';

interface OpportunityDetailDrawerProps {
  opportunity: Opportunity;
  onClose: () => void;
  onUpdateOpportunity: (updated: Opportunity) => void;
  onOpenFullDetail?: (opp: Opportunity) => void;
}

export const OpportunityDetailDrawer: React.FC<OpportunityDetailDrawerProps> = ({
  opportunity,
  onClose,
  onUpdateOpportunity,
  onOpenFullDetail
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'activities' | 'poc' | 'boq' | 'stakeholders' | 'actions' | 'handover'>('overview');

  // Local Form states for adding items
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [newActivity, setNewActivity] = useState<Partial<PresalesActivity>>({
    type: 'Discovery Call',
    title: '',
    author: opportunity.leadSolutionArchitect,
    summary: '',
    durationMinutes: 60,
    attendees: [opportunity.leadSolutionArchitect, opportunity.accountExecutive],
    deliverables: []
  });

  const [showAddBOQ, setShowAddBOQ] = useState(false);
  const [newBOQItem, setNewBOQItem] = useState<Partial<BOQItem>>({
    category: 'Cloud Infrastructure',
    itemCode: 'INF-NODE-CUSTOM',
    description: '',
    unit: 'Instances/Mo',
    quantity: 1,
    unitCost: 500,
    unitListPrice: 900,
    discountPercent: 10
  });

  const [showAddStakeholder, setShowAddStakeholder] = useState(false);
  const [newStakeholder, setNewStakeholder] = useState<Partial<Stakeholder>>({
    name: '',
    role: '',
    department: 'Engineering',
    email: '',
    influence: 'high',
    sentiment: 'champion',
    buyingRole: 'Technical Gatekeeper',
    lastContactDate: new Date().toISOString().slice(0, 10)
  });

  const [showAddAction, setShowAddAction] = useState(false);
  const [newActionItem, setNewActionItem] = useState<Partial<ActionItem>>({
    title: '',
    assignedTo: opportunity.leadSolutionArchitect,
    assignedToRole: 'Lead Solution Architect',
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    isCompleted: false,
    priority: 'p1_high',
    category: 'Architecture'
  });

  const [newReqInput, setNewReqInput] = useState('');

  // Handlers
  const handleToggleAction = (actionId: string) => {
    const updatedActions = opportunity.actionItems.map(a => 
      a.id === actionId ? { ...a, isCompleted: !a.isCompleted } : a
    );
    onUpdateOpportunity({ ...opportunity, actionItems: updatedActions, updatedAt: new Date().toISOString() });
  };

  const handleTogglePCCCriterion = (criterionId: string) => {
    const updatedCriteria = opportunity.poc.successCriteria.map(c => 
      c.id === criterionId ? { ...c, verified: !c.verified, verifiedByCustomer: !c.verified ? opportunity.leadSolutionArchitect : undefined } : c
    );
    onUpdateOpportunity({
      ...opportunity,
      poc: { ...opportunity.poc, successCriteria: updatedCriteria },
      updatedAt: new Date().toISOString()
    });
  };

  const handleAddActivitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivity.title || !newActivity.summary) return;

    const activity: PresalesActivity = {
      id: `act-${Date.now()}`,
      type: newActivity.type as any || 'Discovery Call',
      title: newActivity.title || '',
      timestamp: new Date().toISOString(),
      author: newActivity.author || opportunity.leadSolutionArchitect,
      summary: newActivity.summary || '',
      durationMinutes: Number(newActivity.durationMinutes) || 60,
      attendees: newActivity.attendees || [opportunity.leadSolutionArchitect],
      deliverables: newActivity.deliverables || []
    };

    onUpdateOpportunity({
      ...opportunity,
      activities: [activity, ...opportunity.activities],
      lastContactedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    setShowAddActivity(false);
    setNewActivity({
      type: 'Discovery Call',
      title: '',
      author: opportunity.leadSolutionArchitect,
      summary: '',
      durationMinutes: 60
    });
  };

  const handleAddBOQSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBOQItem.description || !newBOQItem.unitCost || !newBOQItem.unitListPrice) return;

    const qty = Number(newBOQItem.quantity) || 1;
    const listPrice = Number(newBOQItem.unitListPrice) || 0;
    const cost = Number(newBOQItem.unitCost) || 0;
    const discount = Number(newBOQItem.discountPercent) || 0;
    
    const discountedUnitPrice = listPrice * (1 - discount / 100);
    const extendedPrice = discountedUnitPrice * qty;
    const totalCost = cost * qty;
    const marginPercent = extendedPrice > 0 ? ((extendedPrice - totalCost) / extendedPrice) * 100 : 0;

    const item: BOQItem = {
      id: `boq-${Date.now()}`,
      category: newBOQItem.category as any || 'Cloud Infrastructure',
      itemCode: newBOQItem.itemCode || 'CUSTOM-ITEM',
      description: newBOQItem.description || '',
      unit: newBOQItem.unit as any || 'Instances/Mo',
      quantity: qty,
      unitCost: cost,
      unitListPrice: listPrice,
      discountPercent: discount,
      extendedPrice: Math.round(extendedPrice),
      marginPercent: Math.round(marginPercent * 10) / 10
    };

    const updatedItems = [...opportunity.boq.items, item];
    const subtotalCost = updatedItems.reduce((acc, i) => acc + (i.unitCost * i.quantity), 0);
    const subtotalListPrice = updatedItems.reduce((acc, i) => acc + (i.unitListPrice * i.quantity), 0);
    const totalContractValue = updatedItems.reduce((acc, i) => acc + i.extendedPrice, 0);
    const totalDiscountAmount = subtotalListPrice - totalContractValue;
    const overallMarginPercent = totalContractValue > 0 ? Math.round(((totalContractValue - subtotalCost) / totalContractValue) * 1000) / 10 : 0;

    onUpdateOpportunity({
      ...opportunity,
      boq: {
        ...opportunity.boq,
        items: updatedItems,
        subtotalCost,
        subtotalListPrice,
        totalContractValue,
        totalDiscountAmount,
        overallMarginPercent,
        version: opportunity.boq.version + 1
      },
      updatedAt: new Date().toISOString()
    });

    setShowAddBOQ(false);
  };

  const handleDeleteBOQItem = (itemId: string) => {
    const updatedItems = opportunity.boq.items.filter(i => i.id !== itemId);
    const subtotalCost = updatedItems.reduce((acc, i) => acc + (i.unitCost * i.quantity), 0);
    const subtotalListPrice = updatedItems.reduce((acc, i) => acc + (i.unitListPrice * i.quantity), 0);
    const totalContractValue = updatedItems.reduce((acc, i) => acc + i.extendedPrice, 0);
    const totalDiscountAmount = subtotalListPrice - totalContractValue;
    const overallMarginPercent = totalContractValue > 0 ? Math.round(((totalContractValue - subtotalCost) / totalContractValue) * 1000) / 10 : 0;

    onUpdateOpportunity({
      ...opportunity,
      boq: {
        ...opportunity.boq,
        items: updatedItems,
        subtotalCost,
        subtotalListPrice,
        totalContractValue,
        totalDiscountAmount,
        overallMarginPercent,
        version: opportunity.boq.version + 1
      },
      updatedAt: new Date().toISOString()
    });
  };

  const handleApproveBOQ = () => {
    onUpdateOpportunity({
      ...opportunity,
      boq: {
        ...opportunity.boq,
        approvalStatus: 'approved',
        approvedBy: 'Elena Rostova (Lead SA Signoff)',
        approvedDate: new Date().toISOString().slice(0, 10)
      },
      updatedAt: new Date().toISOString()
    });
  };

  const handleAddStakeholderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStakeholder.name || !newStakeholder.email) return;

    const stakeholder: Stakeholder = {
      id: `stk-${Date.now()}`,
      name: newStakeholder.name || '',
      role: newStakeholder.role || 'Stakeholder',
      department: newStakeholder.department || 'Engineering',
      email: newStakeholder.email || '',
      influence: newStakeholder.influence as any || 'medium',
      sentiment: newStakeholder.sentiment as any || 'neutral',
      buyingRole: newStakeholder.buyingRole as any || 'Technical Gatekeeper',
      notes: newStakeholder.notes,
      lastContactDate: newStakeholder.lastContactDate || new Date().toISOString().slice(0, 10)
    };

    onUpdateOpportunity({
      ...opportunity,
      stakeholders: [...opportunity.stakeholders, stakeholder],
      updatedAt: new Date().toISOString()
    });

    setShowAddStakeholder(false);
    setNewStakeholder({ name: '', role: '', email: '' });
  };

  const handleAddActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionItem.title) return;

    const item: ActionItem = {
      id: `act-item-${Date.now()}`,
      title: newActionItem.title || '',
      assignedTo: newActionItem.assignedTo || opportunity.leadSolutionArchitect,
      assignedToRole: newActionItem.assignedToRole || 'Solution Architect',
      dueDate: newActionItem.dueDate || new Date().toISOString().slice(0, 10),
      isCompleted: false,
      priority: newActionItem.priority as any || 'p1_high',
      category: newActionItem.category as any || 'Architecture'
    };

    onUpdateOpportunity({
      ...opportunity,
      actionItems: [...opportunity.actionItems, item],
      updatedAt: new Date().toISOString()
    });

    setShowAddAction(false);
    setNewActionItem({ title: '' });
  };

  const handleToggleHandoverItem = (field: keyof Opportunity['handover']) => {
    onUpdateOpportunity({
      ...opportunity,
      handover: {
        ...opportunity.handover,
        [field]: !opportunity.handover[field]
      },
      updatedAt: new Date().toISOString()
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-4xl bg-white border-l border-gray-200 h-full flex flex-col shadow-2xl text-gray-900 animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Drawer Header */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {opportunity.code}
                </span>
                <StageBadge stage={opportunity.stage} />
                <PriorityBadge priority={opportunity.priority} />
                <ComplexityBadge complexity={opportunity.dealComplexity} />
              </div>
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                {opportunity.name}
              </h2>
              <div className="flex items-center gap-3 text-xs text-gray-500 font-mono mt-1">
                <span className="text-gray-900 font-semibold flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-gray-400" /> {opportunity.clientName}
                </span>
                <span>•</span>
                <span>{opportunity.clientIndustry}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Globe className="w-3 h-3 text-gray-400" /> {opportunity.region}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {onOpenFullDetail && (
                <button
                  onClick={() => onOpenFullDetail(opportunity)}
                  className="px-2.5 py-1 text-xs font-semibold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded flex items-center gap-1 transition-colors"
                  title="Expand to Full Workspace Screen"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Full Workspace
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-gray-200 text-xs font-mono">
            <div className="bg-white p-2 rounded border border-gray-200">
              <span className="text-gray-500 text-[11px]">Total Contract (TCV):</span>
              <div className="text-sm font-bold text-gray-900">${opportunity.contractValue.toLocaleString()}</div>
            </div>
            <div className="bg-white p-2 rounded border border-gray-200">
              <span className="text-gray-500 text-[11px]">Win Probability:</span>
              <div className="text-sm font-bold text-emerald-700">{opportunity.winProbability}%</div>
            </div>
            <div className="bg-white p-2 rounded border border-gray-200">
              <span className="text-gray-500 text-[11px]">Lead Solution Architect:</span>
              <div className="text-xs font-semibold text-gray-900 truncate">{opportunity.leadSolutionArchitect}</div>
            </div>
            <div className="bg-white p-2 rounded border border-gray-200">
              <span className="text-gray-500 text-[11px]">Target Close:</span>
              <div className="text-xs font-semibold text-gray-900">{opportunity.expectedCloseDate}</div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pt-1 text-xs border-b border-gray-200">
            {[
              { id: 'overview', label: 'Technical Scope', icon: Layers },
              { id: 'activities', label: `Activities (${opportunity.activities.length})`, icon: FileText },
              { id: 'poc', label: 'POC & Lab Benchmarks', icon: FlaskConical },
              { id: 'boq', label: `Proposal & BOQ ($${(opportunity.boq.totalContractValue/1000).toFixed(0)}k)`, icon: Calculator },
              { id: 'stakeholders', label: `Stakeholders (${opportunity.stakeholders.length})`, icon: Users },
              { id: 'actions', label: `Actions (${opportunity.actionItems.filter(a=>!a.isCompleted).length})`, icon: CheckSquare },
              { id: 'handover', label: 'Implementation Handover', icon: ArrowRightLeft }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
                    isActive 
                      ? 'border-blue-600 text-blue-700 bg-blue-50 font-semibold' 
                      : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Drawer Body Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
          
          {/* TAB 1: TECHNICAL SCOPE & OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4 text-xs font-sans">
              
              {/* Architecture Blueprint Section */}
              <div className="bg-white border border-gray-200 rounded-md p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-mono font-bold text-gray-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    Target Technical Solution Architecture
                  </h3>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    Primary: {opportunity.primaryTechStack}
                  </span>
                </div>

                <p className="text-gray-700 leading-relaxed bg-gray-50 p-3 rounded border border-gray-200">
                  {opportunity.proposedArchitecture}
                </p>

                {/* Legacy vs Target stack */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="bg-rose-50/50 p-2.5 rounded border border-rose-200">
                    <div className="text-[11px] font-mono text-rose-800 font-semibold mb-1">
                      Current Legacy Stack & Pain Points:
                    </div>
                    <p className="text-gray-700 text-xs">{opportunity.currentLegacyStack}</p>
                  </div>

                  <div className="bg-emerald-50/50 p-2.5 rounded border border-emerald-200">
                    <div className="text-[11px] font-mono text-emerald-800 font-semibold mb-1">
                      Target Cloud & Tech Components:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {opportunity.technologies.map((t, idx) => (
                        <span key={idx} className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white text-gray-800 border border-gray-200 font-medium">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Technical Requirements Checklist */}
              <div className="bg-white border border-gray-200 rounded-md p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-mono font-bold text-gray-900">
                    Key Technical Requirements & Constraints
                  </h3>
                  <span className="text-[11px] font-mono text-gray-500">
                    {opportunity.keyTechnicalRequirements.length} Tracked Criteria
                  </span>
                </div>

                <div className="space-y-1.5">
                  {opportunity.keyTechnicalRequirements.map((req, idx) => (
                    <div key={idx} className="flex items-start gap-2 bg-gray-50 p-2 rounded border border-gray-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-800 font-medium">{req}</span>
                    </div>
                  ))}
                </div>

                {/* Add requirement input */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newReqInput}
                    onChange={(e) => setNewReqInput(e.target.value)}
                    placeholder="Add technical constraint or requirement..."
                    className="flex-1 enterprise-input text-xs"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newReqInput.trim()) {
                        onUpdateOpportunity({
                          ...opportunity,
                          keyTechnicalRequirements: [...opportunity.keyTechnicalRequirements, newReqInput.trim()]
                        });
                        setNewReqInput('');
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (newReqInput.trim()) {
                        onUpdateOpportunity({
                          ...opportunity,
                          keyTechnicalRequirements: [...opportunity.keyTechnicalRequirements, newReqInput.trim()]
                        });
                        setNewReqInput('');
                      }
                    }}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded border border-blue-200 text-xs font-mono font-semibold transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Compliance & Security Matrix */}
              <div className="bg-white border border-gray-200 rounded-md p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-mono font-bold text-gray-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Security & Compliance Clearance
                  </h3>
                  <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                    opportunity.securityReviewStatus === 'Cleared' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold'
                      : 'bg-amber-50 text-amber-800 border-amber-200 font-semibold'
                  }`}>
                    Status: {opportunity.securityReviewStatus}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {opportunity.complianceRequirements.map((c, i) => (
                    <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded bg-gray-50 border border-gray-200 text-xs font-mono text-gray-800 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: ACTIVITIES & MINUTES */}
          {activeTab === 'activities' && (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-gray-500 font-medium">
                  {opportunity.activities.length} Recorded Presales Engagements
                </span>
                <button
                  onClick={() => setShowAddActivity(true)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-mono text-xs font-semibold shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Activity / Minutes</span>
                </button>
              </div>

              {/* Add Activity Form */}
              {showAddActivity && (
                <form onSubmit={handleAddActivitySubmit} className="bg-white border border-blue-300 rounded-md p-3 space-y-2.5 shadow-xs">
                  <div className="font-mono font-bold text-blue-700 text-xs">New Presales Activity Entry</div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-mono text-gray-600 mb-1">Activity Type</label>
                      <select
                        value={newActivity.type}
                        onChange={(e) => setNewActivity({ ...newActivity, type: e.target.value as any })}
                        className="w-full enterprise-input"
                      >
                        <option value="Discovery Call">Discovery Call</option>
                        <option value="Architectural Review">Architectural Review</option>
                        <option value="Demo">Demo</option>
                        <option value="Security Questionnaire">Security Questionnaire</option>
                        <option value="RFP / RFI Response">RFP / RFI Response</option>
                        <option value="BOQ Review">BOQ Review</option>
                        <option value="Whiteboarding">Whiteboarding</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-gray-600 mb-1">Title</label>
                      <input
                        type="text"
                        required
                        value={newActivity.title}
                        onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                        placeholder="e.g. Sizing Review with VP Engineering"
                        className="w-full enterprise-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-gray-600 mb-1">Summary & Technical Discussion</label>
                    <textarea
                      rows={3}
                      required
                      value={newActivity.summary}
                      onChange={(e) => setNewActivity({ ...newActivity, summary: e.target.value })}
                      placeholder="Summary of architectural findings, customer objections, next milestones..."
                      className="w-full enterprise-input"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddActivity(false)}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-mono text-xs transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-mono text-xs font-semibold shadow-xs transition-colors"
                    >
                      Save Activity
                    </button>
                  </div>
                </form>
              )}

              {/* Activity Timeline List */}
              <div className="space-y-2.5">
                {opportunity.activities.map((act) => (
                  <div key={act.id} className="bg-white border border-gray-200 rounded-md p-3 space-y-2 shadow-2xs">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-blue-700 px-1.5 py-0.2 rounded bg-blue-50 border border-blue-200 text-[11px]">
                            {act.type}
                          </span>
                          <span className="font-semibold text-gray-900 text-xs">{act.title}</span>
                        </div>
                        <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                          By <strong className="text-gray-700">{act.author}</strong> • {new Date(act.timestamp).toLocaleString()} ({act.durationMinutes} mins)
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-700 text-xs leading-relaxed bg-gray-50 p-2.5 rounded border border-gray-200">
                      {act.summary}
                    </p>

                    {act.deliverables && act.deliverables.length > 0 && (
                      <div className="flex items-center gap-2 text-[11px] font-mono text-gray-500">
                        <span>Deliverables:</span>
                        {act.deliverables.map((d, i) => (
                          <span key={i} className="text-blue-600 font-medium">{d}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB 3: POC & LAB TRACKER */}
          {activeTab === 'poc' && (
            <div className="space-y-4 text-xs">
              
              {/* Top POC Control Card */}
              <div className="bg-white border border-gray-200 rounded-md p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-amber-600" />
                    <h3 className="font-mono font-bold text-gray-900">POC / Sandbox Lab Configuration</h3>
                  </div>
                  <POCBadge status={opportunity.poc.status} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono text-[11px]">
                  <div className="bg-gray-50 p-2 rounded border border-gray-200">
                    <span className="text-gray-500">Environment Sandbox URL:</span>
                    <div className="text-blue-600 truncate mt-0.5 font-medium">{opportunity.poc.environmentUrl || 'Not provisioned'}</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded border border-gray-200">
                    <span className="text-gray-500">Allocated Cloud Budget:</span>
                    <div className="text-gray-900 font-bold mt-0.5">${opportunity.poc.allocatedBudget?.toLocaleString() || 0}</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded border border-gray-200">
                    <span className="text-gray-500">Customer Sign-Off:</span>
                    <div className="text-emerald-700 font-bold mt-0.5">{opportunity.poc.customerSignOffDate || 'Pending Criteria'}</div>
                  </div>
                </div>
              </div>

              {/* Success Criteria Benchmarks Checklist */}
              <div className="bg-white border border-gray-200 rounded-md p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-mono font-bold text-gray-900">
                    Customer Validation Criteria ({opportunity.poc.successCriteria.filter(c=>c.verified).length}/{opportunity.poc.successCriteria.length} Passed)
                  </h3>
                </div>

                <div className="space-y-2">
                  {opportunity.poc.successCriteria.length === 0 ? (
                    <div className="text-gray-400 italic py-2">No success criteria defined yet for this POC.</div>
                  ) : (
                    opportunity.poc.successCriteria.map((crit) => (
                      <div
                        key={crit.id}
                        onClick={() => handleTogglePCCCriterion(crit.id)}
                        className={`p-2.5 rounded border transition-colors cursor-pointer flex items-start gap-2.5 ${
                          crit.verified 
                            ? 'bg-emerald-50 border-emerald-200' 
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border ${
                          crit.verified ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-gray-300 bg-white'
                        }`}>
                          {crit.verified && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">{crit.description}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                              {crit.category}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-[11px] font-mono text-gray-500 mt-1">
                            <span>Target: <strong className="text-gray-700">{crit.targetMetric}</strong></span>
                            {crit.actualMetric && <span>Achieved: <strong className="text-emerald-700">{crit.actualMetric}</strong></span>}
                            {crit.verifiedByCustomer && <span>Signoff by: {crit.verifiedByCustomer}</span>}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Active Blockers */}
              <div className="bg-white border border-gray-200 rounded-md p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-mono font-bold text-gray-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    POC Blockers & Technical Friction Log
                  </h3>
                </div>

                {opportunity.poc.blockers.length === 0 ? (
                  <div className="text-gray-400 text-xs py-1">No active blockers. POC running smoothly.</div>
                ) : (
                  opportunity.poc.blockers.map((blk) => (
                    <div key={blk.id} className="bg-amber-50/50 p-2.5 rounded border border-amber-200 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-900">{blk.description}</div>
                        <div className="text-[11px] font-mono text-gray-500 mt-0.5">
                          Owner: {blk.owner} • Opened: {blk.openedAt}
                        </div>
                      </div>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        blk.resolved ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold' : 'bg-rose-50 text-rose-700 border-rose-200 font-semibold'
                      }`}>
                        {blk.resolved ? 'Resolved' : 'Active Blocker'}
                      </span>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}

          {/* TAB 4: PROPOSAL & BOQ (BILL OF QUANTITIES) */}
          {activeTab === 'boq' && (
            <div className="space-y-4 text-xs font-sans">
              
              {/* BOQ Summary Card */}
              <div className="bg-white border border-gray-200 rounded-md p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-mono font-bold text-gray-900 flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-purple-600" />
                      Bill of Quantities (BOQ) & Commercial Schedule (v{opportunity.boq.version})
                    </h3>
                    <div className="text-[11px] text-gray-500 font-mono">
                      Governance Approval: <strong className="text-purple-700 uppercase font-semibold">{opportunity.boq.approvalStatus}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {opportunity.boq.approvalStatus !== 'approved' ? (
                      <button
                        onClick={handleApproveBOQ}
                        className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-mono text-xs font-semibold shadow-xs transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Sign Off & Approve BOQ</span>
                      </button>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approved by {opportunity.boq.approvedBy}
                      </span>
                    )}

                    <button
                      onClick={() => setShowAddBOQ(true)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-mono text-xs font-semibold shadow-xs transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Line Item</span>
                    </button>
                  </div>
                </div>

                {/* Financial Calculus Metric Ribbons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs font-mono">
                  <div className="bg-gray-50 p-2 rounded border border-gray-200">
                    <span className="text-gray-500 text-[11px]">List Price (Pre-Discount):</span>
                    <div className="font-bold text-gray-900">${opportunity.boq.subtotalListPrice.toLocaleString()}</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded border border-gray-200">
                    <span className="text-gray-500 text-[11px]">Contract TCV:</span>
                    <div className="font-bold text-blue-700">${opportunity.boq.totalContractValue.toLocaleString()}</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded border border-gray-200">
                    <span className="text-gray-500 text-[11px]">Total Cost of Delivery:</span>
                    <div className="font-bold text-gray-600">${opportunity.boq.subtotalCost.toLocaleString()}</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded border border-gray-200">
                    <span className="text-gray-500 text-[11px]">Realized Gross Margin:</span>
                    <div className="font-bold text-emerald-700">{opportunity.boq.overallMarginPercent}%</div>
                  </div>
                </div>
              </div>

              {/* Add BOQ Item Modal / Inline Form */}
              {showAddBOQ && (
                <form onSubmit={handleAddBOQSubmit} className="bg-white border border-purple-300 rounded-md p-3 space-y-2.5 shadow-xs">
                  <div className="font-mono font-bold text-purple-700 text-xs">Add BOQ Line Item</div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-mono text-gray-600 mb-1">Category</label>
                      <select
                        value={newBOQItem.category}
                        onChange={(e) => setNewBOQItem({ ...newBOQItem, category: e.target.value as any })}
                        className="w-full enterprise-input"
                      >
                        <option value="Cloud Infrastructure">Cloud Infrastructure</option>
                        <option value="Software Licenses">Software Licenses</option>
                        <option value="Professional Services">Professional Services</option>
                        <option value="Managed Support">Managed Support</option>
                        <option value="Security & Compliance">Security & Compliance</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-gray-600 mb-1">Item Code</label>
                      <input
                        type="text"
                        value={newBOQItem.itemCode}
                        onChange={(e) => setNewBOQItem({ ...newBOQItem, itemCode: e.target.value })}
                        className="w-full enterprise-input font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-gray-600 mb-1">Unit Model</label>
                      <select
                        value={newBOQItem.unit}
                        onChange={(e) => setNewBOQItem({ ...newBOQItem, unit: e.target.value as any })}
                        className="w-full enterprise-input font-mono"
                      >
                        <option value="Instances/Mo">Instances/Mo</option>
                        <option value="TB/Mo">TB/Mo</option>
                        <option value="Users/Yr">Users/Yr</option>
                        <option value="Man-Days">Man-Days</option>
                        <option value="Core-Hrs">Core-Hrs</option>
                        <option value="Flat Fee">Flat Fee</option>
                        <option value="License/Yr">License/Yr</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-gray-600 mb-1">Item Description</label>
                    <input
                      type="text"
                      required
                      value={newBOQItem.description}
                      onChange={(e) => setNewBOQItem({ ...newBOQItem, description: e.target.value })}
                      placeholder="e.g. Dedicated Kubernetes Worker Pool with 256GB RAM"
                      className="w-full enterprise-input"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                    <div>
                      <label className="block text-[11px] text-gray-600 mb-1">Quantity</label>
                      <input
                        type="number"
                        value={newBOQItem.quantity}
                        onChange={(e) => setNewBOQItem({ ...newBOQItem, quantity: Number(e.target.value) })}
                        className="w-full enterprise-input"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-600 mb-1">Unit Cost ($)</label>
                      <input
                        type="number"
                        value={newBOQItem.unitCost}
                        onChange={(e) => setNewBOQItem({ ...newBOQItem, unitCost: Number(e.target.value) })}
                        className="w-full enterprise-input"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-600 mb-1">Unit List Price ($)</label>
                      <input
                        type="number"
                        value={newBOQItem.unitListPrice}
                        onChange={(e) => setNewBOQItem({ ...newBOQItem, unitListPrice: Number(e.target.value) })}
                        className="w-full enterprise-input"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-600 mb-1">Discount %</label>
                      <input
                        type="number"
                        value={newBOQItem.discountPercent}
                        onChange={(e) => setNewBOQItem({ ...newBOQItem, discountPercent: Number(e.target.value) })}
                        className="w-full enterprise-input"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddBOQ(false)}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-mono text-xs transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded font-mono text-xs font-semibold shadow-xs transition-colors"
                    >
                      Add to BOQ
                    </button>
                  </div>
                </form>
              )}

              {/* BOQ Line Items Table */}
              <div className="bg-white border border-gray-200 rounded-md overflow-x-auto shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-gray-50 border-b border-gray-200 text-[11px] font-mono text-gray-500 uppercase">
                    <tr>
                      <th className="py-2 px-3">Item Code</th>
                      <th className="py-2 px-3">Description & Category</th>
                      <th className="py-2 px-3 text-right">Qty</th>
                      <th className="py-2 px-3 text-right">Unit List</th>
                      <th className="py-2 px-3 text-center">Disc %</th>
                      <th className="py-2 px-3 text-right">Extended Price</th>
                      <th className="py-2 px-3 text-right">Margin %</th>
                      <th className="py-2 px-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-sans">
                    {opportunity.boq.items.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-6 text-center text-gray-400 font-mono">
                          No line items in this proposal BOQ yet. Click "Add Line Item" to start sizing.
                        </td>
                      </tr>
                    ) : (
                      opportunity.boq.items.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-2 px-3 font-mono font-bold text-purple-700 whitespace-nowrap">
                            {item.itemCode}
                          </td>
                          <td className="py-2 px-3">
                            <div className="font-semibold text-gray-900">{item.description}</div>
                            <div className="text-[10px] text-gray-500 font-mono">{item.category} • {item.unit}</div>
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-gray-700">
                            {item.quantity}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-gray-500">
                            ${item.unitListPrice.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-center font-mono text-amber-700 font-medium">
                            {item.discountPercent}%
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-gray-900">
                            ${item.extendedPrice.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-700">
                            {item.marginPercent}%
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              onClick={() => handleDeleteBOQItem(item.id)}
                              className="p-1 text-gray-400 hover:text-rose-600 transition-colors"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TAB 5: STAKEHOLDER MATRIX */}
          {activeTab === 'stakeholders' && (
            <div className="space-y-4 text-xs font-sans">
              <div className="flex items-center justify-between">
                <span className="font-mono text-gray-500 font-medium">
                  {opportunity.stakeholders.length} Customer Key Stakeholders Mapped
                </span>
                <button
                  onClick={() => setShowAddStakeholder(true)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-mono text-xs font-semibold shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Stakeholder</span>
                </button>
              </div>

              {/* Add Stakeholder Form */}
              {showAddStakeholder && (
                <form onSubmit={handleAddStakeholderSubmit} className="bg-white border border-blue-300 rounded-md p-3 space-y-2.5 shadow-xs">
                  <div className="font-mono font-bold text-blue-700 text-xs">Map New Stakeholder</div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-mono text-gray-600 mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={newStakeholder.name}
                        onChange={(e) => setNewStakeholder({ ...newStakeholder, name: e.target.value })}
                        className="w-full enterprise-input"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-gray-600 mb-1">Title / Role</label>
                      <input
                        type="text"
                        required
                        value={newStakeholder.role}
                        onChange={(e) => setNewStakeholder({ ...newStakeholder, role: e.target.value })}
                        className="w-full enterprise-input"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-gray-600 mb-1">Email</label>
                      <input
                        type="email"
                        required
                        value={newStakeholder.email}
                        onChange={(e) => setNewStakeholder({ ...newStakeholder, email: e.target.value })}
                        className="w-full enterprise-input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-mono text-gray-600 mb-1">Buying Role</label>
                      <select
                        value={newStakeholder.buyingRole}
                        onChange={(e) => setNewStakeholder({ ...newStakeholder, buyingRole: e.target.value as any })}
                        className="w-full enterprise-input"
                      >
                        <option value="Economic Buyer">Economic Buyer</option>
                        <option value="Technical Gatekeeper">Technical Gatekeeper</option>
                        <option value="User Influencer">User Influencer</option>
                        <option value="Procurement">Procurement</option>
                        <option value="Security Officer">Security Officer</option>
                        <option value="Executive Sponsor">Executive Sponsor</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-gray-600 mb-1">Influence</label>
                      <select
                        value={newStakeholder.influence}
                        onChange={(e) => setNewStakeholder({ ...newStakeholder, influence: e.target.value as any })}
                        className="w-full enterprise-input"
                      >
                        <option value="high">High Influence</option>
                        <option value="medium">Medium Influence</option>
                        <option value="low">Low Influence</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-gray-600 mb-1">Sentiment</label>
                      <select
                        value={newStakeholder.sentiment}
                        onChange={(e) => setNewStakeholder({ ...newStakeholder, sentiment: e.target.value as any })}
                        className="w-full enterprise-input"
                      >
                        <option value="champion">Champion (Strong Advocate)</option>
                        <option value="supporter">Supporter</option>
                        <option value="neutral">Neutral</option>
                        <option value="skeptic">Skeptic</option>
                        <option value="blocker">Blocker / Detractor</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddStakeholder(false)}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-mono text-xs transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-mono text-xs font-semibold shadow-xs transition-colors"
                    >
                      Save Stakeholder
                    </button>
                  </div>
                </form>
              )}

              {/* Stakeholders Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {opportunity.stakeholders.map((stk) => {
                  const sentimentColors: Record<string, { label: string; bg: string; color: string }> = {
                    champion: { label: 'Champion', bg: 'bg-emerald-50', color: 'text-emerald-700 border-emerald-200' },
                    supporter: { label: 'Supporter', bg: 'bg-cyan-50', color: 'text-cyan-700 border-cyan-200' },
                    neutral: { label: 'Neutral', bg: 'bg-gray-100', color: 'text-gray-700 border-gray-200' },
                    skeptic: { label: 'Skeptic', bg: 'bg-amber-50', color: 'text-amber-800 border-amber-200' },
                    blocker: { label: 'Blocker', bg: 'bg-rose-50', color: 'text-rose-700 border-rose-200' }
                  };
                  const s = sentimentColors[stk.sentiment] || sentimentColors.neutral;

                  return (
                    <div key={stk.id} className="bg-white border border-gray-200 rounded-md p-3 space-y-2 shadow-2xs">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold text-gray-900 text-xs">{stk.name}</div>
                          <div className="text-[11px] text-gray-500">{stk.role} • {stk.department}</div>
                          <div className="text-[10px] text-blue-600 font-mono">{stk.email}</div>
                        </div>

                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-medium ${s.bg} ${s.color}`}>
                          {s.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-1 border-t border-gray-100 text-[11px] font-mono text-gray-500">
                        <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                          {stk.buyingRole}
                        </span>
                        <span>Influence: <strong className="text-gray-800 capitalize">{stk.influence}</strong></span>
                      </div>

                      {stk.notes && (
                        <p className="text-[11px] text-gray-600 bg-gray-50 p-2 rounded border border-gray-200">
                          "{stk.notes}"
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* TAB 6: ACTION ITEMS & SLAS */}
          {activeTab === 'actions' && (
            <div className="space-y-3 text-xs font-sans">
              <div className="flex items-center justify-between">
                <span className="font-mono text-gray-500 font-medium">
                  {opportunity.actionItems.filter(a => !a.isCompleted).length} Pending Presales SLA Deliverables
                </span>
                <button
                  onClick={() => setShowAddAction(true)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-mono text-xs font-semibold shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New SLA Task</span>
                </button>
              </div>

              {/* Add Action Item Form */}
              {showAddAction && (
                <form onSubmit={handleAddActionSubmit} className="bg-white border border-blue-300 rounded-md p-3 space-y-2.5 shadow-xs">
                  <div className="font-mono font-bold text-blue-700 text-xs">New Action Item</div>
                  
                  <div>
                    <label className="block text-[11px] font-mono text-gray-600 mb-1">Task Title / Deliverable</label>
                    <input
                      type="text"
                      required
                      value={newActionItem.title}
                      onChange={(e) => setNewActionItem({ ...newActionItem, title: e.target.value })}
                      placeholder="e.g. Deliver customized Kafka sizing benchmark model"
                      className="w-full enterprise-input"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-mono text-gray-600 mb-1">Assignee</label>
                      <input
                        type="text"
                        value={newActionItem.assignedTo}
                        onChange={(e) => setNewActionItem({ ...newActionItem, assignedTo: e.target.value })}
                        className="w-full enterprise-input"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-gray-600 mb-1">Due Date</label>
                      <input
                        type="date"
                        value={newActionItem.dueDate}
                        onChange={(e) => setNewActionItem({ ...newActionItem, dueDate: e.target.value })}
                        className="w-full enterprise-input font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-gray-600 mb-1">Priority</label>
                      <select
                        value={newActionItem.priority}
                        onChange={(e) => setNewActionItem({ ...newActionItem, priority: e.target.value as any })}
                        className="w-full enterprise-input"
                      >
                        <option value="p0_urgent">P0 - Urgent</option>
                        <option value="p1_high">P1 - High</option>
                        <option value="p2_medium">P2 - Medium</option>
                        <option value="p3_low">P3 - Low</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddAction(false)}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-mono text-xs transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-mono text-xs font-semibold shadow-xs transition-colors"
                    >
                      Create Task
                    </button>
                  </div>
                </form>
              )}

              {/* Actions List */}
              <div className="space-y-2">
                {opportunity.actionItems.map((act) => {
                  const isOverdue = !act.isCompleted && new Date(act.dueDate) < new Date();

                  return (
                    <div
                      key={act.id}
                      onClick={() => handleToggleAction(act.id)}
                      className={`p-3 rounded border transition-colors cursor-pointer flex items-start gap-3 ${
                        act.isCompleted 
                          ? 'bg-gray-50 border-gray-200 opacity-60' 
                          : isOverdue
                          ? 'bg-rose-50 border-rose-200'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border ${
                        act.isCompleted ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 bg-white'
                      }`}>
                        {act.isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`font-semibold text-xs ${act.isCompleted ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                            {act.title}
                          </span>
                          <PriorityBadge priority={act.priority} />
                        </div>

                        <div className="flex items-center gap-3 text-[11px] font-mono text-gray-500 mt-1">
                          <span>Assigned: <strong className="text-gray-700">{act.assignedTo}</strong></span>
                          <span>•</span>
                          <span className={isOverdue ? 'text-rose-700 font-bold' : ''}>
                            Due: {act.dueDate} {isOverdue && '(OVERDUE)'}
                          </span>
                          <span>•</span>
                          <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">{act.category}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* TAB 7: IMPLEMENTATION HANDOVER */}
          {activeTab === 'handover' && (
            <div className="space-y-4 text-xs font-sans">
              
              <div className="bg-white border border-gray-200 rounded-md p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-mono font-bold text-gray-900 flex items-center gap-2">
                    <ArrowRightLeft className="w-4 h-4 text-emerald-600" />
                    Post-Sales Implementation & Handover Gate
                  </h3>
                  <span className={`text-[11px] font-mono px-2 py-0.5 rounded border font-semibold ${
                    opportunity.handover.isHandedOver 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    {opportunity.handover.isHandedOver ? 'HANDED OVER TO PS' : 'PRESALES OWNED'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono text-[11px]">
                  <div className="bg-gray-50 p-2 rounded border border-gray-200">
                    <span className="text-gray-500">Assigned Delivery Lead:</span>
                    <div className="text-gray-900 font-semibold mt-0.5">
                      {opportunity.handover.assignedDeliveryLead || 'Unassigned (Pending Closed-Won)'}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded border border-gray-200">
                    <span className="text-gray-500">Assigned Customer Success (CSM):</span>
                    <div className="text-gray-900 font-semibold mt-0.5">
                      {opportunity.handover.assignedCustomerSuccessManager || 'Unassigned'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Handover Readiness Checklist */}
              <div className="bg-white border border-gray-200 rounded-md p-3.5 space-y-3">
                <div className="font-mono font-bold text-gray-900">
                  Technical Handover Readiness Checklist
                </div>

                <div className="space-y-2">
                  {[
                    { key: 'technicalRunbookReady' as const, label: 'Technical SOW & Architectural Runbook Documented' },
                    { key: 'credentialsSecurelyTransferred' as const, label: 'Customer Cloud Credentials & Vault Access Transferred' },
                    { key: 'customerTechKickoffScheduled' as const, label: 'Customer Technical Kickoff Meeting Formally Scheduled' },
                    { key: 'isHandedOver' as const, label: 'Formal Presales Sign-off & Handover Completed' }
                  ].map((item) => {
                    const isChecked = !!opportunity.handover[item.key];
                    return (
                      <div
                        key={item.key}
                        onClick={() => handleToggleHandoverItem(item.key)}
                        className={`p-2.5 rounded border transition-colors cursor-pointer flex items-center gap-2.5 ${
                          isChecked ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                          isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-gray-300 bg-white'
                        }`}>
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className={`text-xs ${isChecked ? 'text-emerald-900 font-semibold' : 'text-gray-700'}`}>
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Known Technical Debt or Risks for Delivery */}
              <div className="bg-white border border-gray-200 rounded-md p-3.5 space-y-2">
                <div className="font-mono font-bold text-amber-700 text-xs flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Technical Debt & Delivery Risk Advisory
                </div>

                {opportunity.handover.knownTechnicalDebtOrRisks.length === 0 ? (
                  <div className="text-gray-400 text-xs italic">No known architectural delivery risks noted.</div>
                ) : (
                  opportunity.handover.knownTechnicalDebtOrRisks.map((risk, i) => (
                    <div key={i} className="bg-amber-50/50 p-2 rounded border border-amber-200 text-gray-800 text-xs">
                      • {risk}
                    </div>
                  ))
                )}
              </div>

            </div>
          )}

        </div>

        {/* Drawer Footer Actions */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="text-[11px] font-mono text-gray-500">
            Last updated: {new Date(opportunity.updatedAt).toLocaleString()}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded font-mono text-xs transition-colors shadow-2xs"
            >
              Close Inspector
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
