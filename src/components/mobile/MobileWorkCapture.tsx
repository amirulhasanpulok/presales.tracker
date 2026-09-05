import React, { useState } from 'react';
import { Calendar, CheckCircle2, FilePlus2, MessageSquarePlus } from 'lucide-react';
import { api } from '../../api';
import { Opportunity, PresalesActivity } from '../../types';
import { getActivityTypes } from '../../utils/activityTypes';

interface MobileWorkCaptureProps { opportunities: Opportunity[]; onUpdateOpportunity: (opportunity: Opportunity) => void; onOpenNewOpportunity: () => void; }

export const MobileWorkCapture: React.FC<MobileWorkCaptureProps> = ({ opportunities, onUpdateOpportunity, onOpenNewOpportunity }) => {
  const [opportunityId, setOpportunityId] = useState(opportunities[0]?.id || '');
  const [type, setType] = useState<PresalesActivity['type']>((getActivityTypes()[0] || 'Other') as PresalesActivity['type']);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [saved, setSaved] = useState(false);
  const selected = opportunities.find(opportunity => opportunity.id === opportunityId);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected || !title.trim() || !summary.trim()) return;
    try {
      const updated = await api.addActivity(selected.id, { type, title: title.trim(), summary: summary.trim(), nextAction: nextAction.trim(), nextFollowUpDate: followUpDate, attendees: [], deliverables: [] });
      onUpdateOpportunity(updated);
      setTitle(''); setSummary(''); setNextAction(''); setFollowUpDate(''); setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch { window.alert('Could not save the activity. Please try again.'); }
  };

  return <div className="space-y-3 pb-2"><header className="bg-white border border-gray-200 rounded p-4"><div className="flex items-center gap-2"><MessageSquarePlus className="w-5 h-5 text-blue-600" /><div><h1 className="text-base font-bold text-gray-900">Mobile Work Capture</h1><p className="text-xs text-gray-500">Log progress while working with the client.</p></div></div></header><button onClick={onOpenNewOpportunity} className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white rounded p-3 text-sm font-semibold"><FilePlus2 className="w-4 h-4" /> New Opportunity</button><form onSubmit={submit} className="bg-white border border-gray-200 rounded p-3 space-y-3"><label className="block"><span className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Opportunity</span><select value={opportunityId} onChange={e => setOpportunityId(e.target.value)} className="enterprise-select w-full text-xs"><option value="">Select opportunity</option>{opportunities.map(opportunity => <option key={opportunity.id} value={opportunity.id}>{opportunity.code} · {opportunity.clientName} · {opportunity.name}</option>)}</select></label><label className="block"><span className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Activity Type</span><select value={type} onChange={e => setType(e.target.value as PresalesActivity['type'])} className="enterprise-select w-full text-xs">{getActivityTypes().map(value => <option key={value} value={value}>{value}</option>)}</select></label><label className="block"><span className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Update Title</span><input required value={title} onChange={e => setTitle(e.target.value)} placeholder="What happened?" className="enterprise-input w-full text-xs" /></label><label className="block"><span className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Description</span><textarea required value={summary} onChange={e => setSummary(e.target.value)} rows={4} placeholder="Client discussion, technical decision, or work completed..." className="enterprise-input w-full text-xs resize-none" /></label><label className="block"><span className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Next Action</span><input value={nextAction} onChange={e => setNextAction(e.target.value)} placeholder="What should happen next?" className="enterprise-input w-full text-xs" /></label><label className="block"><span className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Next Follow-up</span><div className="relative"><Calendar className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-400" /><input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} className="enterprise-input w-full pl-8 text-xs" /></div></label><button type="submit" disabled={!selected} className="w-full flex items-center justify-center gap-2 bg-emerald-600 disabled:bg-gray-300 text-white rounded p-3 text-sm font-semibold"><CheckCircle2 className="w-4 h-4" /> Save Activity</button>{saved && <div className="text-center text-xs font-semibold text-emerald-700">Activity saved successfully.</div>}</form></div>;
};
