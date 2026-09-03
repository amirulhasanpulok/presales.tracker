import React, { useState } from 'react';
import { Opportunity, OpportunityStage, DealPriority, DealComplexity } from '../../types';
import { 
  Plus, 
  Building2, 
  DollarSign, 
  Calendar, 
  Cpu, 
  Users, 
  Layers, 
  ArrowLeft,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface NewOpportunityViewProps {
  onSave: (opp: Opportunity) => void;
  onCancel: () => void;
}

export const NewOpportunityView: React.FC<NewOpportunityViewProps> = ({
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientIndustry, setClientIndustry] = useState('FinTech & Banking');
  const [region, setRegion] = useState('North America East');
  const [leadSolutionArchitect, setLeadSolutionArchitect] = useState('Dr. Marcus Vance');
  const [accountExecutive, setAccountExecutive] = useState('Rachel Adams');
  const [primaryTechStack, setPrimaryTechStack] = useState('AWS / Kubernetes');
  const [contractValue, setContractValue] = useState<number>(450000);
  const [arr, setArr] = useState<number>(180000);
  const [winProbability, setWinProbability] = useState<number>(65);
  const [expectedCloseDate, setExpectedCloseDate] = useState('2025-06-30');
  const [priority, setPriority] = useState<DealPriority>('p1_high');
  const [dealComplexity, setDealComplexity] = useState<DealComplexity>('high');
  const [proposedArchitecture, setProposedArchitecture] = useState('');
  const [currentLegacyStack, setCurrentLegacyStack] = useState('');
  const [techFitScore, setTechFitScore] = useState<number>(90);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !clientName.trim()) return;

    const oppCode = `OPP-${Math.floor(2025000 + Math.random() * 9000)}`;

    const newOpp: Opportunity = {
      id: `opp-${Date.now()}`,
      code: oppCode,
      name,
      clientName,
      clientIndustry,
      region,
      leadSolutionArchitect,
      accountExecutive,
      stage: 'qualification',
      daysInCurrentStage: 0,
      contractValue,
      arr,
      winProbability,
      expectedCloseDate,
      priority,
      dealComplexity,
      primaryTechStack,
      technologies: [primaryTechStack, 'Terraform', 'PostgreSQL', 'Grafana'],
      technicalFitScore: techFitScore,
      proposedArchitecture: proposedArchitecture || 'High-availability multi-region enterprise platform architecture with automated zero-downtime CI/CD pipelines.',
      currentLegacyStack: currentLegacyStack || 'Monolithic legacy virtual machines in on-premises datacenter.',
      keyTechnicalRequirements: [
        '99.99% multi-region uptime SLA',
        'Sub-50ms API latency guarantee',
        'Automated disaster recovery cutover'
      ],
      complianceRequirements: ['SOC2 Type II', 'ISO 27001'],
      securityReviewStatus: 'In Review',
      actionItems: [
        {
          id: `act-${Date.now()}-1`,
          title: 'Schedule initial technical discovery call with client lead architect',
          assignedTo: leadSolutionArchitect,
          assignedToRole: 'Solution Architect',
          dueDate: '2025-04-12',
          isCompleted: false,
          priority: 'p1_high',
          category: 'Architecture'
        }
      ],
      stakeholders: [
        {
          id: `sh-${Date.now()}-1`,
          name: 'Chief Information Officer',
          role: 'CIO',
          department: 'Executive',
          email: 'cio@enterprise.com',
          influence: 'high',
          sentiment: 'supporter',
          buyingRole: 'Executive Sponsor',
          lastContactDate: new Date().toISOString().split('T')[0]
        }
      ],
      activities: [
        {
          id: `act-log-${Date.now()}`,
          type: 'Discovery Call',
          title: 'Initial Opportunity Ingestion & Qualification Call',
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
          author: leadSolutionArchitect,
          summary: 'Opportunity logged from sales pipeline. Initiating technical sizing and initial RFP review.',
          durationMinutes: 45,
          attendees: [leadSolutionArchitect, accountExecutive]
        }
      ],
      documents: [],
      boq: {
        items: [],
        subtotalCost: 0,
        subtotalListPrice: 0,
        totalDiscountAmount: 0,
        totalContractValue: contractValue,
        annualRecurringRevenue: Math.round(contractValue * 0.4),
        oneTimeServicesValue: Math.round(contractValue * 0.6),
        overallMarginPercent: 42,
        approvalStatus: 'draft',
        version: 1
      },
      poc: {
        status: 'not_started',
        allocatedBudget: 10000,
        successCriteria: [
          {
            id: 'kpi-1',
            category: 'Performance',
            description: 'API response time < 50ms under 5k concurrent users',
            targetMetric: '< 50ms',
            verified: false
          }
        ],
        blockers: []
      },
      handover: {
        isHandedOver: false,
        handedOverBy: '',
        salesKAM: accountExecutive,
        boqVersion: 'v1',
        status: 'pending',
        technicalNotes: '',
        attachedDocuments: [],
        technicalRunbookReady: false,
        credentialsSecurelyTransferred: false,
        customerTechKickoffScheduled: false,
        knownTechnicalDebtOrRisks: [],
        specialSLAsAgreed: []
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastContactedAt: new Date().toISOString()
    };

    onSave(newOpp);
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-white border border-gray-200 rounded p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-1.5 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-base font-bold text-gray-900 tracking-tight">Create New Presales Opportunity</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Register a new enterprise deal for Solution Architecture qualification, sizing, BOQ, and technical tracking.
            </p>
          </div>
        </div>
      </div>

      {/* Main Creation Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded p-5 space-y-5">
        {/* Section 1: Client & Deal Identity */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            1. Opportunity & Client Identity
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Opportunity Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Multi-Region Cloud Modernization & Kubernetes Migration"
                className="enterprise-input w-full text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Client Enterprise Name *</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Apex Global Bank"
                className="enterprise-input w-full text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Industry Vertical</label>
              <select
                value={clientIndustry}
                onChange={(e) => setClientIndustry(e.target.value)}
                className="enterprise-select w-full text-xs"
              >
                <option value="FinTech & Banking">FinTech & Banking</option>
                <option value="Healthcare & Life Sciences">Healthcare & Life Sciences</option>
                <option value="E-Commerce & Retail">E-Commerce & Retail</option>
                <option value="SaaS & Cloud Software">SaaS & Cloud Software</option>
                <option value="Manufacturing & Supply Chain">Manufacturing & Supply Chain</option>
                <option value="Energy & Utilities">Energy & Utilities</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Region / Geo</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="enterprise-select w-full text-xs"
              >
                <option value="North America East">North America East</option>
                <option value="North America West">North America West</option>
                <option value="EMEA Central">EMEA Central</option>
                <option value="EMEA UK & Nordics">EMEA UK & Nordics</option>
                <option value="APAC Singapore">APAC Singapore</option>
                <option value="LATAM Brazil">LATAM Brazil</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Lead Solution Architect</label>
              <select
                value={leadSolutionArchitect}
                onChange={(e) => setLeadSolutionArchitect(e.target.value)}
                className="enterprise-select w-full text-xs"
              >
                <option value="Dr. Marcus Vance">Dr. Marcus Vance (Principal SA)</option>
                <option value="Elena Rostova">Elena Rostova (Staff SA)</option>
                <option value="Rajesh Menon">Rajesh Menon (Senior SA)</option>
                <option value="Sarah Jenkins">Sarah Jenkins (Security SA)</option>
                <option value="David Miller">David Miller (Cloud Architect)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Financials & Timing */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            2. Commercial Value & Forecast
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Total Contract Value (TCV)</label>
              <input
                type="number"
                min="0"
                value={contractValue}
                onChange={(e) => setContractValue(Number(e.target.value))}
                className="enterprise-input w-full text-xs font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Annual Recurring Revenue (ARR)</label>
              <input
                type="number"
                min="0"
                value={arr}
                onChange={(e) => setArr(Number(e.target.value))}
                className="enterprise-input w-full text-xs font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Win Probability (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={winProbability}
                onChange={(e) => setWinProbability(Number(e.target.value))}
                className="enterprise-input w-full text-xs font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Target Close Date</label>
              <input
                type="date"
                value={expectedCloseDate}
                onChange={(e) => setExpectedCloseDate(e.target.value)}
                className="enterprise-input w-full text-xs font-mono"
                required
              />
            </div>
          </div>
        </div>

        {/* Section 3: Technical Architecture & Scope */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-blue-600" />
            3. Technical Architecture & Complexity
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Primary Tech Stack</label>
              <select
                value={primaryTechStack}
                onChange={(e) => setPrimaryTechStack(e.target.value)}
                className="enterprise-select w-full text-xs"
              >
                <option value="AWS / Kubernetes">AWS / Kubernetes (EKS)</option>
                <option value="GCP / BigQuery / Vertex AI">GCP / BigQuery / Vertex AI</option>
                <option value="Azure / AKS / OpenShift">Azure / AKS / OpenShift</option>
                <option value="Multi-Cloud / Terraform">Multi-Cloud / Terraform</option>
                <option value="On-Prem Hybrid / VMware">On-Prem Hybrid / VMware</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Deal Complexity</label>
              <select
                value={dealComplexity}
                onChange={(e) => setDealComplexity(e.target.value as DealComplexity)}
                className="enterprise-select w-full text-xs"
              >
                <option value="low">Low (Standard Sizing)</option>
                <option value="medium">Medium (Custom Integration)</option>
                <option value="high">High (Enterprise Multi-Region)</option>
                <option value="very_high">Very High (GovCloud / Mission Critical)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as DealPriority)}
                className="enterprise-select w-full text-xs"
              >
                <option value="p0_urgent">P0 URGENT (Executive Escalation)</option>
                <option value="p1_high">P1 High</option>
                <option value="p2_medium">P2 Medium</option>
                <option value="p3_low">P3 Low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Proposed Target Solution Architecture</label>
              <textarea
                value={proposedArchitecture}
                onChange={(e) => setProposedArchitecture(e.target.value)}
                placeholder="Describe cloud components, clustering, VPC networking, database engines..."
                className="enterprise-input w-full text-xs h-20"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Current Legacy Stack & Migration Bottlenecks</label>
              <textarea
                value={currentLegacyStack}
                onChange={(e) => setCurrentLegacyStack(e.target.value)}
                placeholder="Detail current on-prem databases, monoliths, legacy licensing..."
                className="enterprise-input w-full text-xs h-20"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded border border-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Create & Ingest Opportunity
          </button>
        </div>
      </form>
    </div>
  );
};
