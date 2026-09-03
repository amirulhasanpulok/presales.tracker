import React, { useState } from 'react';
import { AuditLogEntry } from '../../types';
import { 
  ShieldCheck, 
  Search, 
  Download, 
  Filter, 
  Calendar, 
  User, 
  Clock, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface AuditLogsViewProps {
  auditLogs: AuditLogEntry[];
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({
  auditLogs: initialLogs,
}) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>(initialLogs);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');

  const filteredLogs = logs.filter(log => {
    const q = (searchTerm || '').toLowerCase();
     const matchesSearch = (log.actorName || log.actor || '').toLowerCase().includes(q) ||
                           (log.entityCode || log.targetName || log.targetId || '').toLowerCase().includes(q) ||
                          (log.details || '').toLowerCase().includes(q) ||
                           (log.ipAddress || '').toLowerCase().includes(q) ||
                           (log.requestId || '').toLowerCase().includes(q);
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    return matchesSearch && matchesAction;
  });

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Actor Name', 'Actor Role', 'Action', 'Entity Code', 'Details', 'IP Address'];
    const rows = filteredLogs.map(log => [
      `"${log.timestamp}"`,
       `"${log.actorName || log.actor || ''}"`,
      `"${log.actorRole}"`,
      `"${log.action}"`,
       `"${log.entityCode || log.targetName || log.targetId || ''}"`,
      `"${(log.details || '').replace(/"/g, '""')}"`,
      `"${log.ipAddress}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `presales_audit_trail_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white border border-gray-200 rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-gray-900 tracking-tight">Presales Governance & Compliance Audit Trail</h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
              IMMUTABLE LEDGER
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Cryptographically timestamped telemetry of all BOQ pricing overrides, stage promotions, security waivers, and role changes.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 shadow-2xs cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          Export Audit Trail (CSV)
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-gray-200 rounded p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by actor, entity code, IP address..."
              className="enterprise-input w-full pl-8 text-xs py-1.5"
            />
          </div>
        </div>

        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="enterprise-select text-xs py-1.5"
        >
          <option value="all">All Governance Actions</option>
          <option value="BOQ_MARGIN_OVERRIDE">BOQ Margin Overrides</option>
          <option value="STAGE_PROMOTION">Stage Promotions</option>
          <option value="SECURITY_WAIVER_APPROVED">Security Waivers</option>
          <option value="ROLE_PERMISSION_CHANGED">Role Permission Changes</option>
          <option value="DOCUMENT_CUSTOMER_SIGNED">Customer Sign-offs</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-gray-200 rounded overflow-x-auto">
         <table className="hidden md:table w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 border-b border-gray-200 text-[11px] font-semibold uppercase tracking-wider">
              <th className="py-2.5 px-3">Timestamp (UTC)</th>
              <th className="py-2.5 px-3">Actor & Role</th>
              <th className="py-2.5 px-3">Action Type</th>
              <th className="py-2.5 px-3">Entity</th>
              <th className="py-2.5 px-3">Audit Details</th>
               <th className="py-2.5 px-3 font-mono">IP / Request</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-gray-800 font-mono text-[11px]">
            {filteredLogs.map(log => (
              <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-2 px-3 text-gray-500 font-mono whitespace-nowrap">
                  {log.timestamp}
                </td>
                <td className="py-2 px-3 font-sans">
                   <div className="font-bold text-gray-900 text-xs">{log.actorName || log.actor || 'Unknown'}</div>
                  <div className="text-[10px] text-gray-500 font-mono">{log.actorRole}</div>
                </td>
                <td className="py-2 px-3">
                  <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-800 font-mono border border-gray-200 font-semibold">
                    {log.action}
                  </span>
                </td>
                <td className="py-2 px-3 font-bold text-blue-700">
                   {log.entityCode || log.targetName || log.targetId || log.targetType || 'System'}
                </td>
                <td className="py-2 px-3 font-sans text-xs text-gray-700">
                  {log.details}
                </td>
                <td className="py-2 px-3 text-gray-500 font-mono text-[10px]">
                   <div>{log.ipAddress}</div>
                   {log.requestId && <div className="text-[9px] text-gray-400" title={log.requestId}>req:{log.requestId.slice(0, 8)}</div>}
                </td>
              </tr>
            ))}
          </tbody>
         </table>
         <div className="md:hidden p-2 space-y-2">
           {filteredLogs.map(log => <article key={log.id} className="border border-gray-200 rounded p-3 space-y-2 bg-white">
             <div className="flex items-start justify-between gap-2"><div><div className="font-bold text-xs text-gray-900">{log.actorName || log.actor || 'Unknown'}</div><div className="text-[10px] text-gray-500">{log.actorRole || '—'}</div></div><span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200 font-mono">{log.action}</span></div>
             <div className="text-[11px] text-blue-700 font-mono">{log.entityCode || log.targetName || log.targetId || log.targetType || 'System'}</div>
             <p className="text-xs text-gray-700 break-words">{log.details || 'No additional details'}</p>
             <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono"><span>{log.timestamp}</span><span>{log.requestId ? `req:${log.requestId.slice(0, 8)}` : log.ipAddress}</span></div>
           </article>)}
           {filteredLogs.length === 0 && <div className="py-8 text-center text-xs text-gray-500">No audit records match your filters.</div>}
         </div>
      </div>
    </div>
  );
};
