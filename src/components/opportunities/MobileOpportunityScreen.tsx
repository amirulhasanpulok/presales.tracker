import React, { useState } from 'react';
import { Search, Plus, Layers, Calendar, ArrowUpRight } from 'lucide-react';
import { Opportunity, OpportunityStage } from '../../types';
import { STAGE_CONFIG } from '../../config/workflow';
import { PriorityBadge, StageBadge } from '../common/Badge';
import { formatCurrency } from '../../utils/currency';

interface MobileOpportunityScreenProps {
  opportunities: Opportunity[];
  onSelectOpportunity: (opportunity: Opportunity) => void;
  onUpdateStage: (id: string, stage: OpportunityStage) => void;
  onOpenNewModal: () => void;
}

export const MobileOpportunityScreen: React.FC<MobileOpportunityScreenProps> = ({ opportunities, onSelectOpportunity, onUpdateStage, onOpenNewModal }) => {
  const [query, setQuery] = useState('');
  const [stage, setStage] = useState('all');
  const filtered = opportunities.filter(opportunity => {
    const text = [opportunity.name, opportunity.clientName, opportunity.code, opportunity.accountExecutive, opportunity.leadSolutionArchitect, ...(opportunity.scopes || []), opportunity.tender?.tenderName, opportunity.tender?.tenderReference, ...(opportunity.stakeholders || []).flatMap(stakeholder => [stakeholder.name, stakeholder.email]), ...(opportunity.boq?.items || []).flatMap(item => [item.oem, item.productName, item.model, item.partNumber, item.itemCode, item.description])].filter(Boolean).join(' ').toLowerCase();
    return (!query || text.includes(query.toLowerCase())) && (stage === 'all' || opportunity.stage === stage);
  });

  return <div className="space-y-3 pb-2">
    <header className="bg-white border border-gray-200 rounded p-3"><div className="flex items-center justify-between gap-2"><div><div className="flex items-center gap-2"><Layers className="w-5 h-5 text-blue-600" /><h1 className="text-base font-bold text-gray-900">Opportunity Tracker</h1></div><p className="text-xs text-gray-500 mt-1">Open any deal directly in its full workspace.</p></div><button onClick={onOpenNewModal} className="p-2 rounded bg-blue-600 text-white" aria-label="New opportunity"><Plus className="w-4 h-4" /></button></div></header>
    <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border border-gray-200 rounded p-2 space-y-2 shadow-sm"><div className="relative"><Search className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-400" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search client, deal, scope..." className="enterprise-input w-full pl-8 text-xs" /></div><select value={stage} onChange={e => setStage(e.target.value)} className="enterprise-select w-full text-xs"><option value="all">All stages ({opportunities.length})</option>{Object.entries(STAGE_CONFIG).map(([key, value]) => <option key={key} value={key}>{value.shortLabel}</option>)}</select></div>
    <div className="space-y-2">{filtered.map(opportunity => <article key={opportunity.id} onClick={() => onSelectOpportunity(opportunity)} className="bg-white border border-gray-200 rounded p-3 space-y-2 active:bg-blue-50"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><div className="text-[10px] font-mono font-bold text-blue-700">{opportunity.code}</div><h2 className="text-sm font-bold text-gray-900 break-words">{opportunity.name}</h2><div className="text-xs text-gray-500 break-words">{opportunity.clientName}</div></div><PriorityBadge priority={opportunity.priority} /></div><div className="flex items-center justify-between gap-2"><StageBadge stage={opportunity.stage} size="sm" /><span className="font-mono font-bold text-sm text-gray-900">{formatCurrency(opportunity.contractValue)}</span></div><div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-500"><span>{opportunity.leadSolutionArchitect}</span>{opportunity.expectedCloseDate && <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" />{opportunity.expectedCloseDate}</span>}<button onClick={e => { e.stopPropagation(); onUpdateStage(opportunity.id, opportunity.stage === 'closed_won' ? 'qualification' : 'closed_won'); }} className="ml-auto inline-flex items-center gap-1 text-blue-700 font-semibold">Quick stage <ArrowUpRight className="w-3 h-3" /></button></div></article>)}{filtered.length === 0 && <div className="bg-white border border-dashed border-gray-300 rounded p-8 text-center text-xs text-gray-500">No opportunities match your search.</div>}</div>
  </div>;
};
