import React, { useState } from 'react';
import { Opportunity } from '../../../types';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  User, 
  Building2, 
  Percent, 
  CheckCircle2, 
  Clock,
  Briefcase
} from 'lucide-react';
import { StageBadge, PriorityBadge } from '../../common/Badge';
import { formatCurrency } from '../../../utils/currency';

interface OpportunitySalesProps {
  opportunity: Opportunity;
  onUpdateOpportunity?: (opp: Opportunity) => void;
}

export const OpportunitySales: React.FC<OpportunitySalesProps> = ({
  opportunity,
  onUpdateOpportunity,
}) => {
  const [oemInput, setOemInput] = useState('');
  const [oemEngagements, setOemEngagements] = useState(opportunity.oemEngagements || []);
  const addOEMEngagement = () => {
    const value = oemInput.trim();
    if (!value || oemEngagements.includes(value)) return;
    const next = [...oemEngagements, value];
    setOemEngagements(next); setOemInput('');
    onUpdateOpportunity?.({ ...opportunity, oemEngagements: next, updatedAt: new Date().toISOString() });
  };
  const removeOEMEngagement = (value: string) => {
    const next = oemEngagements.filter(item => item !== value);
    setOemEngagements(next);
    onUpdateOpportunity?.({ ...opportunity, oemEngagements: next, updatedAt: new Date().toISOString() });
  };
  return (
    <div className="space-y-4">
      {/* Top Commercial Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded p-3">
          <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Total Contract Value (TCV)</div>
          <div className="text-xl font-bold font-mono text-gray-900 mt-1">
            {formatCurrency(opportunity.contractValue)}
          </div>
          <div className="text-[11px] text-gray-500 mt-0.5">Multi-year enterprise scope</div>
        </div>

        <div className="bg-white border border-gray-200 rounded p-3">
          <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Annual Recurring Revenue (ARR)</div>
          <div className="text-xl font-bold font-mono text-blue-700 mt-1">
            {formatCurrency(opportunity.arr)}/yr
          </div>
          <div className="text-[11px] text-gray-500 mt-0.5">Platform software & support</div>
        </div>

        <div className="bg-white border border-gray-200 rounded p-3">
          <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Win Probability</div>
          <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
            {opportunity.winProbability}%
          </div>
          <div className="text-[11px] text-gray-500 mt-0.5">Weighted: {formatCurrency(opportunity.contractValue * opportunity.winProbability / 100)}</div>
        </div>

        <div className="bg-white border border-gray-200 rounded p-3">
          <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Target Close Date</div>
          <div className="text-base font-bold font-mono text-gray-900 mt-1">
            {opportunity.expectedCloseDate}
          </div>
          <div className="text-[11px] text-gray-500 mt-0.5">In current stage: {opportunity.daysInCurrentStage} days</div>
        </div>
      </div>

      {/* Sales Account Team & Commercial Stage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-2.5 flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-blue-600" />
            Commercial Account Ownership
          </h3>

          <div className="mt-3 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Account Executive (Sales KAM):</span>
              <strong className="text-gray-900 font-semibold">{opportunity.accountExecutive}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Assigned Solutions Architect:</span>
              <strong className="text-gray-900 font-semibold">{opportunity.leadSolutionArchitect}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Client Enterprise Account:</span>
              <strong className="text-gray-900 font-semibold">{opportunity.clientName}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Industry Vertical:</span>
              <span className="font-mono text-gray-700">{opportunity.clientIndustry}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Sales Region / Territory:</span>
              <span className="font-mono text-gray-700">{opportunity.region}</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-2.5 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            Pipeline Stage & Forecast Status
          </h3>

          <div className="mt-3 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Current Pipeline Stage:</span>
              <StageBadge stage={opportunity.stage} size="sm" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Deal Priority:</span>
              <PriorityBadge priority={opportunity.priority} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Security Clearance:</span>
              <strong className="text-emerald-700 font-mono font-semibold">{opportunity.securityReviewStatus}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">BOQ Governance:</span>
              <strong className="text-blue-700 font-mono font-semibold uppercase">{opportunity.boq.approvalStatus}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-gray-200 pb-2"><h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">OEM Engagement</h3><span className="text-[10px] text-gray-500">Optional presales collaboration</span></div>
        <div className="flex gap-2"><input value={oemInput} onChange={e => setOemInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addOEMEngagement(); } }} placeholder="OEM or partner name" className="enterprise-input flex-1 text-xs" /><button type="button" onClick={addOEMEngagement} className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded">Add OEM</button></div>
        {oemEngagements.length ? <div className="flex flex-wrap gap-1.5">{oemEngagements.map(value => <span key={value} className="inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded bg-purple-50 text-purple-700 border border-purple-200">{value}<button type="button" onClick={() => removeOEMEngagement(value)} className="font-bold text-purple-400 hover:text-red-600">×</button></span>)}</div> : <p className="text-xs text-gray-500">No OEM engagement recorded. Use the OEM Catalog for full partner profiles and products.</p>}
      </div>
    </div>
  );
};
