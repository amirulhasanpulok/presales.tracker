import React, { useState } from 'react';
import { NotificationItem, Opportunity } from '../../types';
import { 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Trash2, 
  ShieldCheck, 
  FileCheck, 
  DollarSign,
  ChevronRight,
  Info
} from 'lucide-react';

interface NotificationCenterProps {
  notifications: NotificationItem[];
  opportunities: Opportunity[];
  onSelectOpportunity?: (opp: Opportunity) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications: initialNotifications,
  opportunities,
  onSelectOpportunity,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [filterType, setFilterType] = useState<string>('all');

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'sla_breach':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'approval_required':
        return <DollarSign className="w-4 h-4 text-amber-600" />;
      case 'poc_milestone':
        return <CheckCircle2 className="w-4 h-4 text-purple-600" />;
      case 'deal_assigned':
        return <ShieldCheck className="w-4 h-4 text-blue-600" />;
      case 'oem_update':
        return <Info className="w-4 h-4 text-cyan-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const filtered = notifications.filter(n => filterType === 'all' || n.type === filterType);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white border border-gray-200 rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-gray-900 tracking-tight">Presales Notification Center</h1>
            {unreadCount > 0 && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-red-50 text-red-700 font-semibold border border-red-200">
                {unreadCount} Unread Alerts
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            SLA warnings, BOQ margin approvals, security clearances, and deal stage promotions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={markAllAsRead}
            className="px-2.5 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            Mark all read
          </button>
          <button
            onClick={clearAll}
            className="px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100"
          >
            Clear all
          </button>
        </div>
      </div>

      {/* Filter Bar */}
       <div className="mobile-filter-scroll bg-white border border-gray-200 rounded p-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-700">Filter Alerts:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="enterprise-select text-xs py-1"
          >
            <option value="all">All Alerts ({notifications.length})</option>
            <option value="sla_breach">SLA Warnings</option>
            <option value="approval_required">BOQ / Margin Approvals</option>
            <option value="poc_milestone">POC Milestones</option>
            <option value="deal_assigned">Deal Assignments</option>
            <option value="oem_update">OEM Price Revisions</option>
          </select>
        </div>
      </div>

      {/* Notification Stream */}
      <div className="space-y-2">
        {filtered.map(notif => (
          <div
            key={notif.id}
            onClick={() => markAsRead(notif.id)}
            className={`p-3.5 rounded border transition-colors flex items-start justify-between gap-3 ${
              notif.read 
                ? 'bg-white border-gray-200 opacity-80' 
                : 'bg-blue-50/40 border-blue-200 shadow-2xs'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded bg-white border border-gray-200 shadow-2xs mt-0.5">
                {getNotificationIcon(notif.type)}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className={`text-xs ${notif.read ? 'font-medium text-gray-800' : 'font-bold text-gray-900'}`}>
                    {notif.title}
                  </h3>
                  {!notif.read && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                  )}
                </div>

                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  {notif.message}
                </p>

                <div className="mt-2 flex items-center gap-3 text-[11px] font-mono text-gray-500">
                  <span>{notif.timestamp}</span>
                  {notif.opportunityCode && (
                    <>
                      <span>•</span>
                      <span className="font-bold text-blue-700">{notif.opportunityCode}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {notif.opportunityCode && onSelectOpportunity && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const matched = opportunities.find(o => o.code === notif.opportunityCode);
                  if (matched) onSelectOpportunity(matched);
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-white hover:bg-gray-50 border border-gray-300 px-2.5 py-1 rounded flex-shrink-0"
              >
                Inspect Deal <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="p-8 text-center text-xs text-gray-500 bg-white border border-gray-200 rounded">
            No notifications in this view.
          </div>
        )}
      </div>
    </div>
  );
};
