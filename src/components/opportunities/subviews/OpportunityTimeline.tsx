import React, { useState } from 'react';
import { Opportunity, PresalesActivity } from '../../../types';
import { 
  Calendar, 
  Clock, 
  User, 
  Plus, 
  MessageSquare, 
  FileText, 
  CheckCircle2, 
  Sparkles,
  Search
} from 'lucide-react';
import { getActivityTypes } from '../../../utils/activityTypes';

interface OpportunityTimelineProps {
  opportunity: Opportunity;
  onAddActivity?: (activity: PresalesActivity) => void;
}

export const OpportunityTimeline: React.FC<OpportunityTimelineProps> = ({
  opportunity,
  onAddActivity,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [newType, setNewType] = useState<PresalesActivity['type']>(getActivityTypes()[0] as PresalesActivity['type']);
  const [activityTypes, setActivityTypes] = useState(getActivityTypes);

  React.useEffect(() => {
    const refreshTypes = () => setActivityTypes(getActivityTypes());
    window.addEventListener('presales:activity-types-changed', refreshTypes);
    return () => window.removeEventListener('presales:activity-types-changed', refreshTypes);
  }, []);

  React.useEffect(() => {
    if (activityTypes.length && !activityTypes.includes(newType)) {
      setNewType(activityTypes[0] as PresalesActivity['type']);
    }
  }, [activityTypes, newType]);

  const filteredActivities = (opportunity.activities || []).filter(act => 
    filterType === 'all' || act.type === filterType
  );

  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newAct: PresalesActivity = {
      id: `act-${Date.now()}`,
      type: newType,
      title: newTitle,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
      author: '',
      summary: newSummary,
      durationMinutes: 60,
      attendees: ['Customer Lead Architect'],
      deliverables: ['Updated Architecture Blueprint Draft'],
      nextAction,
      nextFollowUpDate,
    };

    if (onAddActivity) onAddActivity(newAct);
    setNewTitle('');
    setNewSummary('');
    setNextAction('');
    setNextFollowUpDate('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="bg-white border border-gray-200 rounded p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-700">Filter Activity:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="enterprise-select text-xs py-1"
          >
            <option value="all">All Presales Activities ({(opportunity.activities || []).length})</option>
            {activityTypes.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Log Presales Session
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <form onSubmit={handleSaveActivity} className="bg-white border border-blue-200 rounded p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">Log New Technical Engagement</h4>
            <button type="button" onClick={() => setShowAddForm(false)} className="text-xs text-gray-500 hover:text-gray-800">&times; Cancel</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Activity Type</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as PresalesActivity['type'])}
                className="enterprise-select w-full text-xs"
              >
                {activityTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Session Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Multi-AZ Disaster Recovery Topology Review"
                className="enterprise-input w-full text-xs"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Meeting Summary & Technical Outcomes</label>
            <textarea
              value={newSummary}
              onChange={(e) => setNewSummary(e.target.value)}
              placeholder="Detail key architectural decisions, customer constraints uncovered, and required deliverables..."
              className="enterprise-input w-full text-xs h-20"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Next Action</label>
              <input value={nextAction} onChange={e => setNextAction(e.target.value)} placeholder="e.g. Prepare initial solution design" className="enterprise-input w-full text-xs" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Next Follow-up Date</label>
              <input type="date" value={nextFollowUpDate} onChange={e => setNextFollowUpDate(e.target.value)} className="enterprise-input w-full text-xs" />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button type="submit" className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded">
              Save Activity Log
            </button>
          </div>
        </form>
      )}

      {/* Timeline Stream */}
      <div className="bg-white border border-gray-200 rounded p-4">
        <div className="relative border-l border-gray-200 ml-4 pl-6 space-y-6">
          {filteredActivities.map((act, index) => (
            <div key={act.id} className="relative">
              {/* Timeline marker */}
              <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-white border-2 border-blue-600 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded p-3 hover:border-gray-300 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                      {act.type}
                    </span>
                    <h4 className="text-xs font-bold text-gray-900">{act.title}</h4>
                  </div>
                  <div className="text-[11px] font-mono text-gray-500 flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    {act.timestamp} ({act.durationMinutes} min)
                  </div>
                </div>

                <p className="text-xs text-gray-700 mt-2 leading-relaxed">
                  {act.summary}
                </p>

                {act.attendees && act.attendees.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-gray-200 flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="text-gray-500 font-semibold">Attendees:</span>
                    {act.attendees.map((att, i) => (
                      <span key={i} className="px-1.5 py-0.2 rounded bg-gray-200/80 text-gray-800 font-mono">
                        {att}
                      </span>
                    ))}
                  </div>
                )}

                {act.deliverables && act.deliverables.length > 0 && (
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <strong>Deliverables:</strong> {act.deliverables.join(', ')}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
