import React, { useState } from 'react';
import { Building2, Search, ArrowUpRight } from 'lucide-react';
import { ClientAccount } from '../../types';
import { formatCurrency } from '../../utils/currency';

interface MobileClientsScreenProps {
  clients: ClientAccount[];
  onSelectClient: (client: ClientAccount) => void;
}

export const MobileClientsScreen: React.FC<MobileClientsScreenProps> = ({ clients, onSelectClient }) => {
  const [query, setQuery] = useState('');
  const filtered = clients.filter(client => `${client.name} ${client.code || ''} ${client.industry} ${client.assignedSalesKAM || ''}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="space-y-3 pb-24"><header className="bg-white border border-gray-200 rounded p-3"><div className="flex items-center gap-2"><Building2 className="w-5 h-5 text-purple-600" /><div><h1 className="text-base font-bold text-gray-900">Clients</h1><p className="text-xs text-gray-500">Open a client profile for the complete relationship history.</p></div></div></header><div className="sticky top-0 z-10 bg-white/95 backdrop-blur border border-gray-200 rounded p-2 shadow-sm"><div className="relative"><Search className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-400" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search clients, codes, industry..." className="enterprise-input w-full pl-8 text-xs" /></div></div><div className="space-y-2">{filtered.map(client => <button key={client.id} onClick={() => onSelectClient(client)} className="w-full text-left bg-white border border-gray-200 rounded p-3 space-y-2 active:bg-purple-50"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><div className="text-[10px] font-mono text-purple-700">{client.code || 'CLIENT'}</div><h2 className="text-sm font-bold text-gray-900 break-words">{client.name}</h2></div><ArrowUpRight className="w-4 h-4 text-gray-400 flex-shrink-0" /></div><div className="flex flex-wrap gap-1.5 text-[10px] text-gray-500"><span className="px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200">{client.industry}</span><span>{client.assignedSalesKAM || client.assignedKAM || 'KAM unassigned'}</span></div><div className="flex items-center justify-between text-[11px]"><span className="text-gray-500">{client.activeOpportunitiesCount ?? client.activeOppsCount ?? 0} active deals</span><strong className="font-mono text-gray-900">{formatCurrency(client.totalContractedTCV ?? client.totalActiveTCV ?? 0)}</strong></div></button>)}{filtered.length === 0 && <div className="bg-white border border-dashed border-gray-300 rounded p-8 text-center text-xs text-gray-500">No clients match your search.</div>}</div></div>;
};
