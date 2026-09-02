import React, { useState } from 'react';
import { ClientAccount, Opportunity } from '../../types';
import { 
  Building2, 
  Search, 
  Plus, 
  MapPin, 
  TrendingUp, 
  DollarSign, 
  ExternalLink, 
  Users,
  ChevronRight,
  ShieldCheck,
  X
} from 'lucide-react';

interface ClientsDirectoryProps {
  clients: ClientAccount[];
  opportunities: Opportunity[];
  onSelectClient: (client: ClientAccount) => void;
  onSelectOpportunity?: (opp: Opportunity) => void;
  onAddClient?: (client: ClientAccount) => void;
}

export const ClientsDirectory: React.FC<ClientsDirectoryProps> = ({
  clients: initialClients,
  opportunities,
  onSelectClient,
  onSelectOpportunity,
  onAddClient,
}) => {
  const [clientsList, setClientsList] = useState<ClientAccount[]>(initialClients);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterIndustry, setFilterIndustry] = useState<string>('all');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New client form state
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [industry, setIndustry] = useState<ClientAccount['industry']>('FinTech & Banking');
  const [tier, setTier] = useState<ClientAccount['tier']>('Enterprise Tier 2');
  const [primaryTechStack, setPrimaryTechStack] = useState('AWS & Kubernetes');
  const [assignedSalesKAM, setAssignedSalesKAM] = useState('Sarah Jenkins');
  const [assignedLeadSA, setAssignedLeadSA] = useState('Elena Rostova');
  const [headquarters, setHeadquarters] = useState('New York, NY');

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newClient: ClientAccount = {
      id: `client-${Date.now()}`,
      name,
      domain: domain || `${name.toLowerCase().replace(/\s+/g, '')}.com`,
      industry,
      tier,
      headquarters,
      primaryTechStack,
      assignedSalesKAM,
      assignedLeadSA,
      totalContractedTCV: 0,
      activeOpportunitiesCount: 0,
      createdDate: new Date().toISOString().split('T')[0],
      keyStakeholders: [],
      notes: 'Newly onboarded enterprise client profile.'
    };

    const updated = [newClient, ...clientsList];
    setClientsList(updated);
    if (onAddClient) onAddClient(newClient);
    setShowAddModal(false);
    setName('');
    setDomain('');
  };

  const filteredClients = clientsList.filter(c => {
    const q = (searchTerm || '').toLowerCase();
    const matchesSearch = (c.name || '').toLowerCase().includes(q) || 
                          (c.domain || '').toLowerCase().includes(q) ||
                          (c.assignedSalesKAM || '').toLowerCase().includes(q);
    const matchesIndustry = filterIndustry === 'all' || c.industry === filterIndustry;
    const matchesTier = filterTier === 'all' || c.tier === filterTier;
    return matchesSearch && matchesIndustry && matchesTier;
  });

  const totalContractedTCV = clientsList.reduce((acc, c) => acc + c.totalContractedTCV, 0);
  const totalActiveDeals = clientsList.reduce((acc, c) => acc + c.activeOpportunitiesCount, 0);

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white border border-gray-200 rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-gray-900 tracking-tight">Enterprise Client Accounts & Accounts Registry</h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
              {clientsList.length} Enterprise Accounts
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Key client profiles, primary cloud estates, assigned Account Executives, and active architectural pipeline.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Client Account
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
              placeholder="Search by client name, domain, or KAM..."
              className="enterprise-input w-full pl-8 text-xs py-1.5"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterIndustry}
            onChange={(e) => setFilterIndustry(e.target.value)}
            className="enterprise-select text-xs py-1.5"
          >
            <option value="all">All Industries</option>
            <option value="FinTech & Banking">FinTech & Banking</option>
            <option value="Healthcare & Life Sciences">Healthcare & Life Sciences</option>
            <option value="E-Commerce & Retail">E-Commerce & Retail</option>
            <option value="SaaS & Cloud Software">SaaS & Cloud Software</option>
          </select>

          <select
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value)}
            className="enterprise-select text-xs py-1.5"
          >
            <option value="all">All Account Tiers</option>
            <option value="Strategic Tier 1">Strategic Tier 1</option>
            <option value="Enterprise Tier 2">Enterprise Tier 2</option>
            <option value="Commercial Tier 3">Commercial Tier 3</option>
          </select>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white border border-gray-200 rounded overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 border-b border-gray-200 text-[11px] font-semibold uppercase tracking-wider">
              <th className="py-2.5 px-3">Client Enterprise</th>
              <th className="py-2.5 px-3">Account Tier</th>
              <th className="py-2.5 px-3">Primary Tech / Cloud</th>
              <th className="py-2.5 px-3">Assigned Sales KAM</th>
              <th className="py-2.5 px-3">Assigned Lead SA</th>
              <th className="py-2.5 px-3 text-center">Active Deals</th>
              <th className="py-2.5 px-3 text-right">Contracted TCV</th>
              <th className="py-2.5 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-gray-800">
            {filteredClients.map(client => (
              <tr 
                key={client.id}
                onClick={() => onSelectClient(client)}
                className="hover:bg-blue-50/50 cursor-pointer transition-colors"
              >
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-gray-700">
                      {client.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{client.name}</div>
                      <div className="text-[11px] text-gray-500 font-mono">{client.domain} • {client.industry}</div>
                    </div>
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  <span className={`text-[11px] font-mono px-2 py-0.5 rounded font-bold border ${
                    client.tier === 'Strategic Tier 1' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                    client.tier === 'Enterprise Tier 2' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    'bg-gray-100 text-gray-700 border-gray-200'
                  }`}>
                    {client.tier}
                  </span>
                </td>
                <td className="py-2.5 px-3">
                  <span className="inline-flex items-center text-[11px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-800 font-mono border border-gray-200">
                    {client.primaryTechStack}
                  </span>
                </td>
                <td className="py-2.5 px-3 font-medium text-gray-900">
                  {client.assignedSalesKAM}
                </td>
                <td className="py-2.5 px-3 font-medium text-gray-900">
                  {client.assignedLeadSA}
                </td>
                <td className="py-2.5 px-3 text-center font-mono font-bold text-blue-700">
                  {client.activeOpportunitiesCount}
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900">
                  ${(client.totalContractedTCV / 1000000).toFixed(2)}M
                </td>
                <td className="py-2.5 px-3 text-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectClient(client);
                    }}
                    className="p-1 rounded text-gray-400 hover:text-blue-700 hover:bg-gray-100"
                    title="View Client Details"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Client Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-lg overflow-hidden animate-in fade-in duration-150">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-gray-900">Add Enterprise Client Account</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddClient} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Company / Organization Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Nexus Global Payments Inc."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Domain / Website</label>
                  <input
                    type="text"
                    placeholder="nexuspayments.com"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Industry Sector</label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value as ClientAccount['industry'])}
                    className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5"
                  >
                    <option value="FinTech & Banking">FinTech & Banking</option>
                    <option value="Healthcare & Life Sciences">Healthcare & Life Sciences</option>
                    <option value="E-Commerce & Retail">E-Commerce & Retail</option>
                    <option value="SaaS & Cloud Software">SaaS & Cloud Software</option>
                    <option value="Telecom & Media">Telecom & Media</option>
                    <option value="Manufacturing & Logistics">Manufacturing & Logistics</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Account Tier</label>
                  <select
                    value={tier}
                    onChange={(e) => setTier(e.target.value as ClientAccount['tier'])}
                    className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5"
                  >
                    <option value="Strategic Tier 1">Strategic Tier 1</option>
                    <option value="Enterprise Tier 2">Enterprise Tier 2</option>
                    <option value="Commercial Tier 3">Commercial Tier 3</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Headquarters</label>
                  <input
                    type="text"
                    value={headquarters}
                    onChange={(e) => setHeadquarters(e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Primary Tech Stack</label>
                  <input
                    type="text"
                    value={primaryTechStack}
                    onChange={(e) => setPrimaryTechStack(e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Assigned Lead SA</label>
                  <select
                    value={assignedLeadSA}
                    onChange={(e) => setAssignedLeadSA(e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5"
                  >
                    <option value="Elena Rostova">Elena Rostova</option>
                    <option value="David Chen">David Chen</option>
                    <option value="Marcus Vance">Marcus Vance</option>
                    <option value="Aisha Patel">Aisha Patel</option>
                    <option value="Carlos Mendez">Carlos Mendez</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded border border-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs"
                >
                  Create Client Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
