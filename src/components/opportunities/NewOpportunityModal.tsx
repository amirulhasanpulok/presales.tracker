import React, { useState } from 'react';
import { X, Plus, Layers, DollarSign, Calendar, Shield, Cpu, Search, Check } from 'lucide-react';
import { Opportunity, OpportunityStage, CloudProvider, DealComplexity, DealPriority, TechnicalFitScore, ScopeCatalogEntry, UserAccount } from '../../types';
import { CLOUD_PROVIDERS, DEFAULT_INDUSTRIES, getConfiguredTaxonomy } from '../../utils/taxonomy';

interface NewOpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateOpportunity: (newOpp: Opportunity) => void;
  scopes?: ScopeCatalogEntry[];
  users?: UserAccount[];
}

export const NewOpportunityModal: React.FC<NewOpportunityModalProps> = ({
  isOpen,
  onClose,
  onCreateOpportunity,
  scopes,
  users = [],
}) => {
  const presalesUsers = users.filter(user => user.roleId === 'role-sa' || user.department === 'Solutions Engineering');
  const salesUsers = users.filter(user => user.roleId === 'role-kam' || user.role === 'Sales KAM');
  const engineers = presalesUsers;
  const [name, setName] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientIndustry, setClientIndustry] = useState<Opportunity['clientIndustry']>('FinTech / Banking');
  const [region, setRegion] = useState<Opportunity['region']>('North America (US-East)');
  const [stage, setStage] = useState<OpportunityStage>('qualification');
  const [priority, setPriority] = useState<DealPriority>('p1_high');
  const [complexity, setComplexity] = useState<DealComplexity>('medium');
  const [techFit, setTechFit] = useState<TechnicalFitScore>('good');
  const [primaryTechStack, setPrimaryTechStack] = useState<CloudProvider>('AWS');
  const [contractValue, setContractValue] = useState(650000);
  const [arr, setArr] = useState(480000);
  const [winProbability, setWinProbability] = useState(60);
  const [expectedCloseDate, setExpectedCloseDate] = useState(
    new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10)
  );
  const [leadSA, setLeadSA] = useState(engineers[0]?.name || 'Unassigned');
  const [supportingSAs, setSupportingSAs] = useState<string[]>([]);
  const [ae, setAe] = useState(salesUsers[0]?.name || 'Unassigned');
  const [proposedArch, setProposedArch] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [scopeQuery, setScopeQuery] = useState('');
  const [scopeDropdownOpen, setScopeDropdownOpen] = useState(false);
  const [extraTags, setExtraTags] = useState('');
  const [legacyStack, setLegacyStack] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !clientName) return;

    const matchedSA = engineers.find(e => e.name === leadSA);
    const scopeNames = selectedScopes.length
      ? selectedScopes
      : (scopes || []).filter(s => s.status !== 'Inactive').slice(0, 3).map(s => s.name);
    const techTags = extraTags.split(',').map(s => s.trim()).filter(Boolean);
    const technologies = Array.from(new Set([...scopeNames, ...techTags]));

    const newOpp: Opportunity = {
      id: `opp-${Date.now()}`,
       code: `OPP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      name,
      clientName,
      clientIndustry,
      region,
      stage,
      priority,
      dealComplexity: complexity,
      technicalFitScore: techFit,
      primaryTechStack,
      technologies,
      scopes: scopeNames,
      contractValue: Number(contractValue) || 0,
      arr: Number(arr) || 0,
      winProbability: Number(winProbability) || 50,
      expectedCloseDate,
      leadSolutionArchitect: leadSA,
      supportingPresalesEngineers: supportingSAs,
      leadArchitectAvatar: matchedSA?.avatar,
      accountExecutive: ae,
       currentLegacyStack: legacyStack,
       proposedArchitecture: proposedArch,
       keyTechnicalRequirements: [],
       complianceRequirements: [],
       securityReviewStatus: 'Not Started',
       activities: [],
       stakeholders: [],
      poc: {
        status: 'not_started',
         allocatedBudget: 0,
        successCriteria: [],
        blockers: []
      },
      boq: {
        items: [],
        subtotalCost: 0,
        subtotalListPrice: 0,
        totalDiscountAmount: 0,
        totalContractValue: 0,
        annualRecurringRevenue: 0,
        oneTimeServicesValue: 0,
        overallMarginPercent: 0,
        approvalStatus: 'draft',
        version: 1
      },
       actionItems: [],
      handover: {
        isHandedOver: false,
        handedOverBy: '',
        salesKAM: ae,
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
      lastContactedAt: new Date().toISOString(),
      daysInCurrentStage: 1
    };

    onCreateOpportunity(newOpp);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-white border border-gray-200 rounded-lg shadow-2xl text-gray-900 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-mono text-xs font-bold">
              +
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 font-mono">Create New Opportunity Intake</h2>
              <p className="text-[11px] text-gray-500">Initialize technical scope, sizing baseline, and presales ownership</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-4 text-xs bg-white">
          
          {/* General Information */}
          <div className="space-y-2">
            <div className="font-mono text-gray-500 uppercase tracking-wider font-semibold text-[10px]">
              Deal & Customer Profile
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-gray-700 mb-1">Opportunity Title *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Multi-Cloud Kubernetes & Zero-Trust Migration"
                  className="w-full enterprise-input"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-gray-700 mb-1">Client / Enterprise Account *</label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Standard Chartered / Uber Technologies"
                  className="w-full enterprise-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-gray-700 mb-1">Client Industry</label>
                <select
                  value={clientIndustry}
                  onChange={(e) => setClientIndustry(e.target.value as any)}
                  className="w-full enterprise-input font-mono"
                >
                  {getConfiguredTaxonomy('industries', DEFAULT_INDUSTRIES).map(value => <option key={value} value={value}>{value}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-gray-700 mb-1">Target Cloud / Primary Stack</label>
                <select
                  value={primaryTechStack}
                  onChange={(e) => setPrimaryTechStack(e.target.value as any)}
                  className="w-full enterprise-input font-mono"
                >
                  {CLOUD_PROVIDERS.map(value => <option key={value} value={value}>{value}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Technical Scope */}
          <div className="space-y-2 pt-2 border-t border-gray-200">
            <div className="font-mono text-gray-500 uppercase tracking-wider font-semibold text-[10px]">
              Technical Scope & Architecture
            </div>

            <div>
              <label className="block text-[11px] font-mono text-gray-700 mb-1">Target Architecture High-Level Summary</label>
              <textarea
                rows={2}
                value={proposedArch}
                onChange={(e) => setProposedArch(e.target.value)}
                placeholder="High-level solution architecture design, services, resilience pattern..."
                className="w-full enterprise-input"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-gray-700 mb-1">
                Solution Scopes (multi-select) <span className="text-gray-400">· {selectedScopes.length} selected</span>
              </label>
              <div className="relative">
                <div
                  className="w-full enterprise-input cursor-pointer flex items-center gap-2"
                  onClick={() => setScopeDropdownOpen(v => !v)}
                >
                  <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className="flex-1 truncate text-gray-700">
                    {selectedScopes.length === 0 ? 'Search & select scopes (e.g. Firewall, LAN, Server)...' : selectedScopes.join(', ')}
                  </span>
                  <span className="text-gray-400">{scopeDropdownOpen ? '▲' : '▼'}</span>
                </div>
                {scopeDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded shadow-lg max-h-56 overflow-y-auto">
                    <input
                      value={scopeQuery}
                      onChange={(e) => setScopeQuery(e.target.value)}
                      placeholder="Search scopes..."
                      className="w-full px-3 py-2 border-b border-gray-200 text-xs font-mono focus:outline-none"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                    {(scopes || [])
                      .filter(s => s.status !== 'Inactive')
                      .filter(s => !scopeQuery.trim() || s.name.toLowerCase().includes(scopeQuery.trim().toLowerCase()) || s.category.toLowerCase().includes(scopeQuery.trim().toLowerCase()))
                      .map(s => {
                        const checked = selectedScopes.includes(s.name);
                        return (
                          <button
                            type="button"
                            key={s.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedScopes(prev => checked ? prev.filter(n => n !== s.name) : [...prev, s.name]);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-blue-50 transition-colors"
                          >
                            <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${checked ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'}`}>
                              {checked && <Check className="w-2.5 h-2.5" />}
                            </span>
                            <span className="flex-1 font-medium text-gray-800">{s.name}</span>
                            <span className="text-[9px] font-mono uppercase text-gray-400">{s.category}</span>
                          </button>
                        );
                      })}
                    {(scopes || []).filter(s => s.status !== 'Inactive').length === 0 && (
                      <div className="p-3 text-[11px] text-gray-400">No scopes in catalog yet.</div>
                    )}
                  </div>
                )}
              </div>
              {selectedScopes.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {selectedScopes.map(s => (
                    <span key={s} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono font-medium">
                      {s}
                      <button type="button" onClick={() => setSelectedScopes(prev => prev.filter(n => n !== s))} className="text-blue-400 hover:text-blue-700">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-mono text-gray-700 mb-1">Additional Technologies / Tags (comma separated)</label>
              <input
                type="text"
                value={extraTags}
                onChange={(e) => setExtraTags(e.target.value)}
                placeholder="e.g. AWS EKS, Istio, Terraform, Kafka"
                className="w-full enterprise-input font-mono"
              />
            </div>
          </div>

          {/* Commercial & Ownership */}
          <div className="space-y-2 pt-2 border-t border-gray-200">
            <div className="font-mono text-gray-500 uppercase tracking-wider font-semibold text-[10px]">
              Financials & Ownership
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
              <div>
                <label className="block text-[11px] text-gray-700 mb-1">Contract TCV</label>
                <input
                  type="number"
                  value={contractValue}
                  onChange={(e) => setContractValue(Number(e.target.value))}
                  className="w-full enterprise-input"
                />
              </div>

              <div>
                <label className="block text-[11px] text-gray-700 mb-1">Estimated ARR</label>
                <input
                  type="number"
                  value={arr}
                  onChange={(e) => setArr(Number(e.target.value))}
                  className="w-full enterprise-input"
                />
              </div>

              <div>
                <label className="block text-[11px] text-gray-700 mb-1">Win Probability (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={winProbability}
                  onChange={(e) => setWinProbability(Number(e.target.value))}
                  className="w-full enterprise-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-gray-700 mb-1">Lead Solution Architect</label>
                <select
                  value={leadSA}
                  onChange={(e) => setLeadSA(e.target.value)}
                  className="w-full enterprise-input font-mono"
                >
                  {!engineers.length && <option value="Unassigned">Unassigned</option>}
                  {engineers.map(eng => (
                    <option key={eng.id} value={eng.name}>{eng.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-gray-700 mb-1">Account Executive (AE)</label>
                {salesUsers.length ? <select value={ae} onChange={(e) => setAe(e.target.value)} className="w-full enterprise-input">{salesUsers.map(user => <option key={user.id} value={user.name}>{user.name}</option>)}</select> : <input type="text" value={ae} onChange={(e) => setAe(e.target.value)} className="w-full enterprise-input" />}
              </div>

              <div>
                <label className="block text-[11px] font-mono text-gray-700 mb-1">Target Close Date</label>
                <input
                  type="date"
                  value={expectedCloseDate}
                  onChange={(e) => setExpectedCloseDate(e.target.value)}
                  className="w-full enterprise-input font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-mono text-gray-700 mb-1">Supporting Presales Engineers</label>
              <div className="flex flex-wrap gap-2 p-2 rounded border border-gray-300 bg-gray-50">
                  {engineers.filter(eng => eng.name !== leadSA).map(eng => <label key={eng.id} className="inline-flex items-center gap-1.5 text-[11px] text-gray-700"><input type="checkbox" checked={supportingSAs.includes(eng.name)} onChange={e => setSupportingSAs(current => e.target.checked ? [...current, eng.name] : current.filter(name => name !== eng.name))} className="rounded border-gray-300 text-blue-600" />{eng.name}</label>)}
                  {!engineers.length && <span className="text-[11px] text-gray-400 italic">No presales engineers available. Add users in User Management.</span>}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-mono text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-mono text-xs font-semibold shadow-xs transition-colors"
            >
              Create Opportunity
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
