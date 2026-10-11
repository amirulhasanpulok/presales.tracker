export const STAGE_CONFIG: Record<string, { label: string; shortLabel: string; color: string; bg: string; borderColor: string; description: string }> = {
  qualification: { label: '1. Technical Qualification', shortLabel: 'Qualification', color: 'text-gray-700', bg: 'bg-gray-100', borderColor: 'border-gray-300', description: 'Initial intake, technical feasibility scoring, BANT qualification' },
  tech_discovery: { label: '2. Technical Discovery', shortLabel: 'Discovery', color: 'text-cyan-700', bg: 'bg-cyan-50', borderColor: 'border-cyan-200', description: 'Architecture deep-dive, pain points, compliance & legacy stack audit' },
  solution_design: { label: '3. Solution Architecture', shortLabel: 'Solution Design', color: 'text-blue-700', bg: 'bg-blue-50', borderColor: 'border-blue-200', description: 'Target state diagrams, sizing models, integration feasibility specs' },
  poc_demo: { label: '4. POC & Technical Validation', shortLabel: 'POC / Demo', color: 'text-amber-800', bg: 'bg-amber-50', borderColor: 'border-amber-200', description: 'Live lab benchmarks, customer KPI validation, blocker resolution' },
  proposal_boq: { label: '5. Proposal & BOQ Sizing', shortLabel: 'Proposal / BOQ', color: 'text-purple-700', bg: 'bg-purple-50', borderColor: 'border-purple-200', description: 'Bill of Quantities pricing, margin governance, SOW generation' },
  commercial_negotiation: { label: '6. Commercial & Security Signoff', shortLabel: 'Negotiation', color: 'text-indigo-700', bg: 'bg-indigo-50', borderColor: 'border-indigo-200', description: 'InfoSec clearance, MSA review, executive approval gate' },
  closed_won: { label: '7. Closed Won (Handover)', shortLabel: 'Won / Handover', color: 'text-emerald-700', bg: 'bg-emerald-50', borderColor: 'border-emerald-200', description: 'Technical knowledge transfer to Delivery / Professional Services' },
  closed_lost: { label: '8. Closed Lost', shortLabel: 'Closed Lost', color: 'text-rose-700', bg: 'bg-rose-50', borderColor: 'border-rose-200', description: 'Technical post-mortem, lost reason, competitor analysis' },
  on_hold: { label: '9. On Hold', shortLabel: 'On Hold', color: 'text-amber-800', bg: 'bg-amber-50', borderColor: 'border-amber-200', description: 'Opportunity paused pending client, commercial, or technical action' },
  cancelled: { label: '10. Cancelled', shortLabel: 'Cancelled', color: 'text-gray-500', bg: 'bg-gray-100', borderColor: 'border-gray-300', description: 'Opportunity withdrawn or no longer being pursued' },
};

STAGE_CONFIG['lead']={label:'Lead',shortLabel:'Lead',description:'Lead',color:'text-slate-700',bg:'bg-slate-100',borderColor:'border-slate-200'};
STAGE_CONFIG['qualification']={label:'Review Gate',shortLabel:'Review Gate',description:'Review Gate',color:'text-slate-700',bg:'bg-slate-100',borderColor:'border-slate-200'};
STAGE_CONFIG['tech_discovery']={label:'Requirements Analysis',shortLabel:'Requirements Analysis',description:'Requirements Analysis',color:'text-slate-700',bg:'bg-slate-100',borderColor:'border-slate-200'};
STAGE_CONFIG['solution_design']={label:'Solution Design',shortLabel:'Solution Design',description:'Solution Design',color:'text-slate-700',bg:'bg-slate-100',borderColor:'border-slate-200'};
STAGE_CONFIG['solution_review']={label:'Solution Review',shortLabel:'Solution Review',description:'Solution Review',color:'text-slate-700',bg:'bg-slate-100',borderColor:'border-slate-200'};
STAGE_CONFIG['handover_sales']={label:'Handover to Sales',shortLabel:'Handover to Sales',description:'Handover to Sales',color:'text-slate-700',bg:'bg-slate-100',borderColor:'border-slate-200'};
STAGE_CONFIG['costing']={label:'Price and Costing',shortLabel:'Price and Costing',description:'Price and Costing',color:'text-slate-700',bg:'bg-slate-100',borderColor:'border-slate-200'};
STAGE_CONFIG['proposal_boq']={label:'Proposal Submitted',shortLabel:'Proposal Submitted',description:'Proposal Submitted',color:'text-slate-700',bg:'bg-slate-100',borderColor:'border-slate-200'};
STAGE_CONFIG['followup']={label:'Follow-up',shortLabel:'Follow-up',description:'Follow-up',color:'text-slate-700',bg:'bg-slate-100',borderColor:'border-slate-200'};
STAGE_CONFIG['commercial_negotiation']={label:'Negotiation',shortLabel:'Negotiation',description:'Negotiation',color:'text-slate-700',bg:'bg-slate-100',borderColor:'border-slate-200'};
STAGE_CONFIG['closed_won']={label:'Won',shortLabel:'Won',description:'Won',color:'text-slate-700',bg:'bg-slate-100',borderColor:'border-slate-200'};
STAGE_CONFIG['closed_lost']={label:'Lost',shortLabel:'Lost',description:'Lost',color:'text-slate-700',bg:'bg-slate-100',borderColor:'border-slate-200'};
STAGE_CONFIG['on_hold']={label:'Hold',shortLabel:'Hold',description:'Hold',color:'text-slate-700',bg:'bg-slate-100',borderColor:'border-slate-200'};
STAGE_CONFIG['cancelled']={label:'Cancel',shortLabel:'Cancel',description:'Cancel',color:'text-slate-700',bg:'bg-slate-100',borderColor:'border-slate-200'};
STAGE_CONFIG['delivery']={label:'Delivery',shortLabel:'Delivery',description:'Delivery',color:'text-slate-700',bg:'bg-slate-100',borderColor:'border-slate-200'};
STAGE_CONFIG['deployment']={label:'Deployment',shortLabel:'Deployment',description:'Deployment',color:'text-slate-700',bg:'bg-slate-100',borderColor:'border-slate-200'};
STAGE_CONFIG['completed']={label:'Completed',shortLabel:'Completed',description:'Completed',color:'text-slate-700',bg:'bg-slate-100',borderColor:'border-slate-200'};
STAGE_CONFIG['client_handover']={label:'Handover to Client',shortLabel:'Handover to Client',description:'Handover to Client',color:'text-slate-700',bg:'bg-slate-100',borderColor:'border-slate-200'};

// The database controls stage order and business-facing copy at runtime. CSS
// tokens remain local because they are presentation policy, not business data.
export function applyWorkflowConfig(stages: Array<{ id: string; label?: string; shortLabel?: string; description?: string }>): void {
  if (!Array.isArray(stages) || !stages.length) return;
  const current = { ...STAGE_CONFIG };
  const next: typeof STAGE_CONFIG = {};
  for (const stage of stages) {
    const style = current[stage.id];
    if (!style) continue;
    next[stage.id] = { ...style, label: stage.label || style.label, shortLabel: stage.shortLabel || style.shortLabel, description: stage.description || style.description };
  }
  if (!Object.keys(next).length) return;
  for (const key of Object.keys(STAGE_CONFIG)) delete STAGE_CONFIG[key];
  Object.assign(STAGE_CONFIG, next);
}

STAGE_CONFIG.costing_approval={label:'Costing Approval',shortLabel:'Costing Approval',description:'Finance / Management approves costing',color:'text-amber-700',bg:'bg-amber-50',borderColor:'border-amber-200'};
