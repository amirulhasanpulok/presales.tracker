import React, { useState } from 'react';
import { CalendarEvent, Opportunity } from '../../types';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Plus, 
  Users, 
  Video, 
  MapPin,
  CheckCircle2,
  Cpu,
  ChevronRight as ArrowRight,
  X
} from 'lucide-react';

interface PresalesCalendarProps {
  events: CalendarEvent[];
  opportunities: Opportunity[];
  onSelectOpportunity?: (opp: Opportunity) => void;
}

export const PresalesCalendar: React.FC<PresalesCalendarProps> = ({
  events: initialEvents,
  opportunities,
  onSelectOpportunity,
}) => {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [currentMonth, setCurrentMonth] = useState('April 2025');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(initialEvents[0] || null);
  const [showBookModal, setShowBookModal] = useState<boolean>(false);

  // New session form state
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<CalendarEvent['type']>('Architecture Workshop');
  const [newDate, setNewDate] = useState('2025-04-15');
  const [newTime, setNewTime] = useState('14:00 - 15:30 EST');
  const [newOppCode, setNewOppCode] = useState(opportunities[0]?.code || '');
  const [newLocation, setNewLocation] = useState('Google Meet / Enterprise Lab');
  const [newAttendees, setNewAttendees] = useState('Lead SA, Customer VP Tech, Cloud Lead');

  const handleBookSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const matchedOpp = opportunities.find(o => o.code === newOppCode);

    const newSession: CalendarEvent = {
      id: `event-${Date.now()}`,
      title: newTitle,
      type: newType,
      date: newDate,
      time: newTime,
      clientName: matchedOpp ? matchedOpp.clientName : 'Enterprise Customer',
      opportunityCode: newOppCode || undefined,
      attendees: newAttendees.split(',').map(a => a.trim()).filter(Boolean),
      location: newLocation,
      status: 'Confirmed'
    };

    const updated = [newSession, ...events];
    setEvents(updated);
    setSelectedEvent(newSession);
    setShowBookModal(false);
    setNewTitle('');
  };

  const eventTypes: CalendarEvent['type'][] = [
    'Discovery Session',
    'Architecture Workshop',
    'POC Milestone',
    'Executive Demo',
    'Handover Kickoff',
    'RFP Due Date'
  ];

  const getEventBadgeClass = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'Architecture Workshop':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'POC Milestone':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Discovery Session':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Executive Demo':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Handover Kickoff':
        return 'bg-cyan-50 text-cyan-800 border-cyan-200';
      case 'RFP Due Date':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredEvents = events.filter(ev => filterType === 'all' || ev.type === filterType);

  // Group events by date
  const eventsByDate = filteredEvents.reduce<Record<string, CalendarEvent[]>>((acc, ev) => {
    if (!acc[ev.date]) acc[ev.date] = [];
    acc[ev.date].push(ev);
    return acc;
  }, {});

  const dates = Object.keys(eventsByDate).sort();

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white border border-gray-200 rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-gray-900 tracking-tight">Presales Schedule & Technical Engagements Calendar</h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
              {filteredEvents.length} Sessions Scheduled
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Discovery workshops, POC milestones, RFP deadlines, and delivery handover meetings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-100 rounded p-0.5 border border-gray-200 text-xs">
            <button className="p-1 text-gray-600 hover:text-gray-900 hover:bg-white rounded">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-semibold text-gray-800">{currentMonth}</span>
            <button className="p-1 text-gray-600 hover:text-gray-900 hover:bg-white rounded">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setShowBookModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Book Architecture Session
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-gray-200 rounded p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-700">Filter Session Type:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="enterprise-select text-xs py-1"
          >
            <option value="all">All Presales Sessions ({events.length})</option>
            {eventTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Split: Calendar Timeline List & Selected Event Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Schedule List by Date */}
        <div className="lg:col-span-2 space-y-3">
          {dates.map(dateStr => {
            const dateEvents = eventsByDate[dateStr];
            return (
              <div key={dateStr} className="bg-white border border-gray-200 rounded overflow-hidden">
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-xs font-bold text-gray-900 font-mono">{dateStr}</span>
                  </div>
                  <span className="text-[10px] font-mono text-gray-500">{dateEvents.length} Sessions</span>
                </div>

                <div className="divide-y divide-gray-100">
                  {dateEvents.map(ev => {
                    const isSelected = selectedEvent?.id === ev.id;
                    return (
                      <div
                        key={ev.id}
                        onClick={() => setSelectedEvent(ev)}
                        className={`p-3 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                          isSelected ? 'bg-blue-50/70 border-l-2 border-blue-600' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold border ${getEventBadgeClass(ev.type)}`}>
                              {ev.type}
                            </span>
                            <span className="text-xs font-bold text-gray-900">{ev.title}</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500 font-mono">
                            <span className="flex items-center gap-1 text-gray-700 font-medium">
                              <Clock className="w-3 h-3 text-gray-400" /> {ev.time}
                            </span>
                            <span>•</span>
                            <span className="font-semibold text-blue-700">{ev.clientName} ({ev.opportunityCode})</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                            ev.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {ev.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {dates.length === 0 && (
            <div className="bg-white border border-gray-200 rounded p-8 text-center text-xs text-gray-500">
              No presales sessions matching the selected filter.
            </div>
          )}
        </div>

        {/* Right 1 Col: Event Deep Details */}
        <div className="bg-white border border-gray-200 rounded p-4 space-y-4 h-fit sticky top-16">
          {selectedEvent ? (
            <div className="space-y-4">
              <div className="border-b border-gray-200 pb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded font-mono font-bold border ${getEventBadgeClass(selectedEvent.type)}`}>
                    {selectedEvent.type}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                    {selectedEvent.status}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-gray-900 mt-2">{selectedEvent.title}</h3>
                <div className="text-xs text-gray-500 mt-1 font-mono">{selectedEvent.clientName}</div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded bg-gray-50 border border-gray-200">
                  <span className="text-gray-500">Date & Time:</span>
                  <span className="font-mono font-bold text-gray-900">{selectedEvent.date} @ {selectedEvent.time}</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-gray-50 border border-gray-200">
                  <span className="text-gray-500">Meeting Bridge:</span>
                  <span className="font-mono text-blue-700 font-medium">{selectedEvent.location}</span>
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center gap-1">
                  <Users className="w-3 h-3 text-gray-400" /> Attendees ({selectedEvent.attendees.length})
                </h4>
                <div className="p-2.5 rounded bg-gray-50 border border-gray-200 space-y-1">
                  {selectedEvent.attendees.map((att, idx) => (
                    <div key={idx} className="text-xs text-gray-800 font-medium flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      {att}
                    </div>
                  ))}
                </div>
              </div>

              {selectedEvent.opportunityCode && onSelectOpportunity && (
                <button
                  onClick={() => {
                    const opp = opportunities.find(o => o.code === selectedEvent.opportunityCode);
                    if (opp) onSelectOpportunity(opp);
                  }}
                  className="w-full py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs flex items-center justify-center gap-1"
                >
                  Inspect Opportunity Workspace <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-10 text-xs text-gray-500">
              Select a session from the list to view detailed agenda and attendees.
            </div>
          )}
        </div>
      </div>

      {/* Book Architecture Session Modal */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-lg overflow-hidden animate-in fade-in duration-150">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-gray-900">Book Architecture Session</h3>
              </div>
              <button
                onClick={() => setShowBookModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBookSession} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Session Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Target Multi-Region Cloud VPC & Security Deep-Dive"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Session Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as CalendarEvent['type'])}
                    className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5"
                  >
                    {eventTypes.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Associated Opportunity</label>
                  <select
                    value={newOppCode}
                    onChange={(e) => setNewOppCode(e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5 font-mono"
                  >
                    <option value="">-- General Technical Workshop --</option>
                    {opportunities.map(o => (
                      <option key={o.id} value={o.code}>{o.code} - {o.clientName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Session Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5"
                  >
                  </input>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Time & Timezone</label>
                  <input
                    type="text"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Meeting Location / Video Bridge</label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Attendees (comma-separated)</label>
                <input
                  type="text"
                  value={newAttendees}
                  onChange={(e) => setNewAttendees(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5"
                />
              </div>

              <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded border border-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs"
                >
                  Confirm & Schedule Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
