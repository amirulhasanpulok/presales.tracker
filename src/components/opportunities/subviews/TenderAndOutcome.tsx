import React, { useState } from 'react';
import { Opportunity, DealOutcome, TenderInfo } from '../../../types';
import { api } from '../../../api';
import {
  FileText,
  Calendar,
  Building2,
  Landmark,
  ShieldCheck,
  Check,
  Globe,
  Save,
  Trophy,
  XCircle,
  PauseCircle,
  AlertCircle,
} from 'lucide-react';

interface TenderAndOutcomeProps {
  opportunity: Opportunity;
  onUpdateOpportunity?: (opp: Opportunity) => void;
}

const emptyTender = (isTender: boolean): TenderInfo => ({
  isTender,
  tenderName: '',
  tenderReference: '',
  publishingOrganization: '',
  publishDate: '',
  submissionDeadline: '',
  complianceRequirements: [],
  submissionStatus: 'Not Submitted',
  result: '',
  tenderDocumentsSummary: '',
});

const emptyOutcome = (): DealOutcome => ({
  outcome: opportunityStageOutcome('open'),
  wonDate: '',
  finalSolution: '',
  finalNotes: '',
  handoverStatus: 'Not Handed Over',
  lostDate: '',
  lostReason: '',
  competitor: '',
  commercialReason: '',
  technicalReason: '',
  clientReason: '',
  lessonsLearned: '',
  notes: '',
});

function opportunityStageOutcome(stage: string): DealOutcome['outcome'] {
  if (stage === 'closed_won') return 'won';
  if (stage === 'closed_lost') return 'lost';
  return 'open';
}

export const TenderAndOutcome: React.FC<TenderAndOutcomeProps> = ({
  opportunity,
  onUpdateOpportunity,
}) => {
  const existingTender = opportunity.tender || emptyTender(opportunity.type === 'tender' || Boolean(opportunity.tender?.isTender));
  const existingOutcome = opportunity.outcome || {
    ...emptyOutcome(),
    outcome: opportunityStageOutcome(opportunity.stage),
  };

  const [tender, setTender] = useState<TenderInfo>(existingTender);
  const [outcome, setOutcome] = useState<DealOutcome>(existingOutcome);
  const [saved, setSaved] = useState(false);
  const [complianceInput, setComplianceInput] = useState(
    (existingTender.complianceRequirements || []).join(', '),
  );

  const persist = (nextTender: TenderInfo, nextOutcome: DealOutcome) => {
    if (!onUpdateOpportunity) return;
    onUpdateOpportunity({
      ...opportunity,
      tender: nextTender,
      outcome: nextOutcome,
      updatedAt: new Date().toISOString(),
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const nextTender: TenderInfo = {
      ...tender,
      complianceRequirements: complianceInput.split(',').map(s => s.trim()).filter(Boolean),
    };
    persist(nextTender, outcome);
  };

  const handleDeclareOutcome = (o: DealOutcome['outcome']) => {
    const next: DealOutcome = {
      ...outcome,
      outcome: o,
      wonDate: o === 'won' ? (outcome.wonDate || new Date().toISOString().slice(0, 10)) : outcome.wonDate,
      lostDate: o === 'lost' ? (outcome.lostDate || new Date().toISOString().slice(0, 10)) : outcome.lostDate,
      lostReason: o === 'lost' ? (outcome.lostReason || 'Pending loss review') : outcome.lostReason,
    };
    api.setOutcome(opportunity.id, next)
      .then(updated => {
        onUpdateOpportunity?.(updated);
        setOutcome(updated.outcome || next);
        setSaved(true);
        window.setTimeout(() => setSaved(false), 2500);
      })
      .catch(() => window.alert('Could not update the deal outcome. Please try again.'));
  };

  const stage = opportunity.stage;
  const derivedOutcome = outcome.outcome || opportunityStageOutcome(stage);

  return (
    <div className="space-y-4">
      {/* Deal Outcome Banner */}
      <div className={`rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border ${
        derivedOutcome === 'won'
          ? 'bg-emerald-50 border-emerald-200'
          : derivedOutcome === 'lost'
            ? 'bg-red-50 border-red-200'
            : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-center gap-3">
          {derivedOutcome === 'won' ? (
            <Trophy className="w-6 h-6 text-emerald-600" />
          ) : derivedOutcome === 'lost' ? (
            <XCircle className="w-6 h-6 text-red-600" />
          ) : (
            <PauseCircle className="w-6 h-6 text-gray-500" />
          )}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-gray-800">
              Deal Outcome: {derivedOutcome === 'won' ? 'Won / Matured' : derivedOutcome === 'lost' ? 'Lost' : derivedOutcome === 'on_hold' ? 'On Hold' : derivedOutcome === 'cancelled' ? 'Cancelled' : 'Active / Open'}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              Current stage: {stage}. Declare the final outcome to capture the complete deal history (Section 16).
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {derivedOutcome !== 'won' && (
            <button
              onClick={() => handleDeclareOutcome('won')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-xs"
            >
              <Trophy className="w-3.5 h-3.5" />
              Mark Won
            </button>
          )}
          {derivedOutcome !== 'lost' && (
            <button
              onClick={() => handleDeclareOutcome('lost')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded shadow-xs"
            >
              <XCircle className="w-3.5 h-3.5" />
              Mark Lost
            </button>
          )}
          {derivedOutcome !== 'on_hold' && (
            <button onClick={() => handleDeclareOutcome('on_hold')} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded">
              <PauseCircle className="w-3.5 h-3.5" /> On Hold
            </button>
          )}
          {derivedOutcome !== 'cancelled' && (
            <button onClick={() => handleDeclareOutcome('cancelled')} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded">
              <AlertCircle className="w-3.5 h-3.5" /> Cancel
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tender section */}
        <div className="bg-white border border-gray-200 rounded p-4 space-y-3">
          <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
            <Landmark className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Tender Information</h3>
            <label className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={tender.isTender}
                onChange={(e) => setTender({ ...tender, isTender: e.target.checked })}
                className="w-3.5 h-3.5"
              />
              Tender Opportunity
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div>
              <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Tender Name</label>
              <input
                value={tender.tenderName || ''}
                onChange={(e) => setTender({ ...tender, tenderName: e.target.value })}
                placeholder="e.g. National Data Center RFP"
                className="w-full enterprise-input text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Tender Reference</label>
              <input
                value={tender.tenderReference || ''}
                onChange={(e) => setTender({ ...tender, tenderReference: e.target.value })}
                placeholder="e.g. DCD-2026-014"
                className="w-full enterprise-input text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Publishing Organization</label>
              <input
                value={tender.publishingOrganization || ''}
                onChange={(e) => setTender({ ...tender, publishingOrganization: e.target.value })}
                placeholder="e.g. Ministry of ICT"
                className="w-full enterprise-input text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Publish Date</label>
                <input
                  type="date"
                  value={tender.publishDate || ''}
                  onChange={(e) => setTender({ ...tender, publishDate: e.target.value })}
                  className="w-full enterprise-input text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Submit Deadline</label>
                <input
                  type="date"
                  value={tender.submissionDeadline || ''}
                  onChange={(e) => setTender({ ...tender, submissionDeadline: e.target.value })}
                  className="w-full enterprise-input text-xs"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Compliance Requirements (comma separated)</label>
            <input
              value={complianceInput}
              onChange={(e) => setComplianceInput(e.target.value)}
              placeholder="e.g. ISO 27001, Local Data Residency, 24x7 SLA"
              className="w-full enterprise-input text-xs"
            />
            {(tender.complianceRequirements || []).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {(tender.complianceRequirements || []).map((c, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                    <ShieldCheck className="w-3 h-3" /> {c}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div>
              <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Submission Status</label>
              <select
                value={tender.submissionStatus || 'Not Submitted'}
                onChange={(e) => setTender({ ...tender, submissionStatus: e.target.value })}
                className="w-full enterprise-select text-xs"
              >
                {['Not Submitted', 'In Preparation', 'Submitted', 'Under Evaluation', 'Technical Pass', 'Commercial Pass', 'Awarded', 'Not Awarded'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Result</label>
              <input
                value={tender.result || ''}
                onChange={(e) => setTender({ ...tender, result: e.target.value })}
                placeholder="e.g. Won, Lost, Cancelled"
                className="w-full enterprise-input text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Documents / Summary</label>
            <textarea
              value={tender.tenderDocumentsSummary || ''}
              onChange={(e) => setTender({ ...tender, tenderDocumentsSummary: e.target.value })}
              rows={2}
              placeholder="Tender documents received / submitted..."
              className="w-full enterprise-input text-xs resize-none"
            />
          </div>
        </div>

        {/* Deal Outcome section */}
        <div className="bg-white border border-gray-200 rounded p-4 space-y-3">
          <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
            <Activity icon={outcome.outcome} />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Deal Outcome Details</h3>
          </div>

          {outcome.outcome === 'won' && (
            <div className="space-y-2.5 text-xs bg-emerald-50/50 p-3 rounded border border-emerald-100">
              <div>
                <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Won Date</label>
                <input type="date" value={outcome.wonDate || ''} onChange={(e) => setOutcome({ ...outcome, wonDate: e.target.value })} className="w-full enterprise-input text-xs" />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Final Solution Delivered</label>
                <textarea value={outcome.finalSolution || ''} onChange={(e) => setOutcome({ ...outcome, finalSolution: e.target.value })} rows={2} className="w-full enterprise-input text-xs resize-none" placeholder="Final solution summary..." />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Final Notes</label>
                <textarea value={outcome.finalNotes || ''} onChange={(e) => setOutcome({ ...outcome, finalNotes: e.target.value })} rows={2} className="w-full enterprise-input text-xs resize-none" />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Handover Status</label>
                <select value={outcome.handoverStatus || 'Not Handed Over'} onChange={(e) => setOutcome({ ...outcome, handoverStatus: e.target.value })} className="w-full enterprise-input text-xs">
                  {['Not Handed Over', 'Ready for Handover', 'Handed Over', 'Kickoff Scheduled'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          )}

          {outcome.outcome === 'lost' && (
            <div className="space-y-2.5 text-xs bg-red-50/50 p-3 rounded border border-red-100">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Lost Date</label>
                  <input type="date" value={outcome.lostDate || ''} onChange={(e) => setOutcome({ ...outcome, lostDate: e.target.value })} className="w-full enterprise-input text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Competitor (if known)</label>
                  <input value={outcome.competitor || ''} onChange={(e) => setOutcome({ ...outcome, competitor: e.target.value })} placeholder="e.g. Dell EMC" className="w-full enterprise-input text-xs" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Primary Loss Reason</label>
                <input value={outcome.lostReason || ''} onChange={(e) => setOutcome({ ...outcome, lostReason: e.target.value })} placeholder="e.g. Budget cut, competitor price" className="w-full enterprise-input text-xs" />
              </div>
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Commercial Reason</label>
                  <textarea value={outcome.commercialReason || ''} onChange={(e) => setOutcome({ ...outcome, commercialReason: e.target.value })} rows={2} className="w-full enterprise-input text-xs resize-none" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Technical Reason</label>
                  <textarea value={outcome.technicalReason || ''} onChange={(e) => setOutcome({ ...outcome, technicalReason: e.target.value })} rows={2} className="w-full enterprise-input text-xs resize-none" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Client Reason</label>
                  <textarea value={outcome.clientReason || ''} onChange={(e) => setOutcome({ ...outcome, clientReason: e.target.value })} rows={2} className="w-full enterprise-input text-xs resize-none" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Lessons Learned</label>
                <textarea value={outcome.lessonsLearned || ''} onChange={(e) => setOutcome({ ...outcome, lessonsLearned: e.target.value })} rows={2} className="w-full enterprise-input text-xs resize-none" placeholder="What we learned for future deals..." />
              </div>
            </div>
          )}

          {outcome.outcome === 'open' && (
            <div className="p-3 text-[11px] text-gray-500 bg-gray-50 border border-gray-200 rounded">
              <p>This deal is still <strong>Active / Open</strong>. Use the buttons above to mark it <strong>Won</strong> or <strong>Lost</strong> — additional fields will appear to capture the complete outcome and lessons learned.</p>
            </div>
          )}

          <div>
            <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">General Notes</label>
            <textarea value={outcome.notes || ''} onChange={(e) => setOutcome({ ...outcome, notes: e.target.value })} rows={2} className="w-full enterprise-input text-xs resize-none" />
          </div>
        </div>
      </form>

      {/* Save bar */}
      <div className="flex items-center justify-end gap-3">
        {saved && (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold">
            <Check className="w-3.5 h-3.5" /> Saved
          </span>
        )}
        <button
          onClick={(e) => { e.preventDefault(); handleSave(e); }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs"
        >
          <Save className="w-3.5 h-3.5" />
          Save Tender & Outcome
        </button>
      </div>
    </div>
  );
};

function Activity({ icon }: { icon: DealOutcome['outcome'] }) {
  const map: Record<DealOutcome['outcome'], { color: string; Icon: typeof Trophy }> = {
    won: { color: 'text-emerald-600', Icon: Trophy },
    lost: { color: 'text-red-600', Icon: XCircle },
    on_hold: { color: 'text-amber-600', Icon: PauseCircle },
    cancelled: { color: 'text-gray-500', Icon: AlertCircle },
    open: { color: 'text-blue-600', Icon: Globe },
  };
  const { color, Icon } = map[icon] || map.open;
  return <Icon className={`w-4 h-4 ${color}`} />;
}
