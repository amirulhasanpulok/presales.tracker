import React, { useState } from 'react';
import { Opportunity, Stakeholder } from '../../../types';
import { 
  Users, 
  Plus, 
  Mail, 
  ShieldCheck, 
  TrendingUp, 
  UserCheck, 
  AlertCircle,
  Clock
} from 'lucide-react';

interface OpportunityStakeholdersProps {
  opportunity: Opportunity;
  onAddStakeholder?: (stakeholder: Stakeholder) => void;
}

export const OpportunityStakeholders: React.FC<OpportunityStakeholdersProps> = ({
  opportunity,
  onAddStakeholder,
}) => {
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>(opportunity.stakeholders);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('');
  const [email, setEmail] = useState('');
  const [influence, setInfluence] = useState<Stakeholder['influence']>('high');
  const [sentiment, setSentiment] = useState<Stakeholder['sentiment']>('champion');
  const [buyingRole, setBuyingRole] = useState<Stakeholder['buyingRole']>('Technical Gatekeeper');
  const [notes, setNotes] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newSh: Stakeholder = {
      id: `sh-${Date.now()}`,
      name,
      role,
      department,
      email,
      influence,
      sentiment,
      buyingRole,
      notes,
      lastContactDate: new Date().toISOString().split('T')[0]
    };

    const updated = [...stakeholders, newSh];
    setStakeholders(updated);
    opportunity.stakeholders = updated;
    if (onAddStakeholder) onAddStakeholder(newSh);

    setName('');
    setRole('');
    setEmail('');
    setNotes('');
    setShowAddForm(false);
  };

  const getSentimentBadge = (s: Stakeholder['sentiment']) => {
    switch (s) {
      case 'champion':
        return <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-mono font-bold">Champion</span>;
      case 'supporter':
        return <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-xs font-mono">Supporter</span>;
      case 'neutral':
        return <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200 text-xs font-mono">Neutral</span>;
      case 'skeptic':
        return <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-xs font-mono">Skeptic</span>;
      case 'blocker':
        return <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 text-xs font-mono font-bold">Blocker</span>;
    }
  };

  const getInfluenceBadge = (inf: Stakeholder['influence']) => {
    switch (inf) {
      case 'high':
        return <span className="text-[11px] font-mono font-bold text-red-700 uppercase">High Influence</span>;
      case 'medium':
        return <span className="text-[11px] font-mono text-gray-700 uppercase">Med Influence</span>;
      case 'low':
        return <span className="text-[11px] font-mono text-gray-400 uppercase">Low Influence</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="bg-white border border-gray-200 rounded p-3 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Buying Center & Influence Matrix</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Key customer decision makers, technical evaluators, executive sponsors, and security gatekeepers.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Stakeholder
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <form onSubmit={handleAdd} className="bg-white border border-blue-200 rounded p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">Add Key Customer Stakeholder</h4>
            <button type="button" onClick={() => setShowAddForm(false)} className="text-xs text-gray-500 hover:text-gray-800">&times; Cancel</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sarah Connor"
                className="enterprise-input w-full text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Job Title / Role</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. VP Infrastructure"
                className="enterprise-input w-full text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Enterprise Cloud & Platform"
                className="enterprise-input w-full text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="s.connor@client.com"
                className="enterprise-input w-full text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Buying Role</label>
              <select
                value={buyingRole}
                onChange={(e) => setBuyingRole(e.target.value as Stakeholder['buyingRole'])}
                className="enterprise-select w-full text-xs"
              >
                <option value="Economic Buyer">Economic Buyer</option>
                <option value="Technical Gatekeeper">Technical Gatekeeper</option>
                <option value="User Influencer">User Influencer</option>
                <option value="Security Officer">Security Officer</option>
                <option value="Executive Sponsor">Executive Sponsor</option>
                <option value="Procurement">Procurement</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Influence Level</label>
              <select
                value={influence}
                onChange={(e) => setInfluence(e.target.value as Stakeholder['influence'])}
                className="enterprise-select w-full text-xs"
              >
                <option value="high">High Influence</option>
                <option value="medium">Medium Influence</option>
                <option value="low">Low Influence</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Sentiment / Posture</label>
              <select
                value={sentiment}
                onChange={(e) => setSentiment(e.target.value as Stakeholder['sentiment'])}
                className="enterprise-select w-full text-xs"
              >
                <option value="champion">Champion (Strong Advocate)</option>
                <option value="supporter">Supporter</option>
                <option value="neutral">Neutral</option>
                <option value="skeptic">Skeptic</option>
                <option value="blocker">Blocker (Requires Mitigation)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Key Motivations & Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Concerned about zero-downtime cutover; highly receptive to AWS EKS managed control plane."
              className="enterprise-input w-full text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="submit" className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded">
              Save Stakeholder
            </button>
          </div>
        </form>
      )}

      {/* Stakeholders Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {stakeholders.map(sh => (
          <div key={sh.id} className="bg-white border border-gray-200 rounded p-3.5 space-y-2 hover:border-gray-300 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                  {sh.name}
                  <span className="text-[11px] font-mono font-medium text-gray-500">({sh.department || 'Client Org'})</span>
                </div>
                <div className="text-[11px] text-gray-600 font-medium">{sh.role}</div>
              </div>
              <div>{getSentimentBadge(sh.sentiment)}</div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100">
              <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-800 border border-gray-200">
                {sh.buyingRole}
              </span>
              <div>{getInfluenceBadge(sh.influence)}</div>
            </div>

            {sh.notes && (
              <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-200 leading-relaxed">
                "{sh.notes}"
              </p>
            )}

            <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 font-mono">
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3 text-gray-400" />
                {sh.email || 'No email specified'}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-gray-400" />
                Last Contact: {sh.lastContactDate}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
