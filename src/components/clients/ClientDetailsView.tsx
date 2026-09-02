import React from 'react';
import { ClientAccount, Opportunity } from '../../types';
import { 
  ArrowLeft, 
  Building2, 
  Globe, 
  MapPin, 
  Users, 
  DollarSign, 
  Cpu, 
  ShieldCheck, 
  ChevronRight, 
  FileText,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { PriorityBadge, StageBadge } from '../common/Badge';

interface ClientDetailsViewProps {
  client: ClientAccount;
  opportunities: Opportunity[];
  onBack: () => void;
  onSelectOpportunity: (opp: Opportunity) => void;
}

export const ClientDetailsView: React.FC<ClientDetailsViewProps> = ({
  client,
  opportunities,
  onBack,
  onSelectOpportunity,
}) => {
  const clientDeals = opportunities.filter(o => o.clientName === client.name);

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-white border border-gray-200 rounded p-4 space-y-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-blue-700 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Clients Directory
          </button>
          <span className="text-gray-300">/</span>
          <span className="text-xs font-bold text-gray-700 font-mono">{client.tier}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded bg-blue-50 border border-blue-200 text-blue-700 font-bold text-lg flex items-center justify-center">
              {client.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-gray-900 tracking-tight">{client.name}</h1>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-bold">
                  {client.tier}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-0.5">
                <span className="flex items-center gap-1">
                  <Globe className="w-3 h-3 text-gray-400" />
                  {client.domain}
                </span>
                <span>•</span>
                <span>Industry: <strong className="text-gray-800">{client.industry}</strong></span>
                <span>•</span>
                <span>HQ: <strong className="text-gray-800">{client.headquarters}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-gray-50 p-2.5 rounded border border-gray-200">
            <div className="text-right">
              <div className="text-[10px] uppercase font-semibold text-gray-500">Contracted TCV</div>
              <div className="text-base font-bold font-mono text-gray-900">
                ${(client.totalContractedTCV / 1000000).toFixed(2)}M
              </div>
            </div>
            <div className="h-7 w-[1px] bg-gray-300" />
            <div className="text-right">
              <div className="text-[10px] uppercase font-semibold text-gray-500">Active Deals</div>
              <div className="text-base font-bold font-mono text-blue-700">
                {clientDeals.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Active Opportunities Pipeline for Client */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-gray-200 rounded">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                Active Architectural Opportunities ({clientDeals.length})
              </h3>
              <span className="text-[11px] font-mono text-gray-500">
                Total Sizing: ${(clientDeals.reduce((a, c) => a + c.contractValue, 0) / 1000).toLocaleString()}k
              </span>
            </div>

            <div className="divide-y divide-gray-200">
              {clientDeals.map(opp => (
                <div 
                  key={opp.id}
                  onClick={() => onSelectOpportunity(opp)}
                  className="p-3.5 hover:bg-blue-50/50 cursor-pointer transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={opp.priority} />
                      <h4 className="text-xs font-bold text-gray-900">{opp.name}</h4>
                      <span className="text-[10px] font-mono text-gray-400">({opp.code})</span>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-gray-500">
                      <span>Stack: <strong className="font-mono text-gray-700">{opp.primaryTechStack}</strong></span>
                      <span>•</span>
                      <span>Lead SA: <strong className="text-gray-700">{opp.leadSolutionArchitect}</strong></span>
                      <span>•</span>
                      <span>Close: <strong className="font-mono text-gray-700">{opp.expectedCloseDate}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs font-bold font-mono text-gray-900">${(opp.contractValue / 1000).toLocaleString()}k</div>
                      <StageBadge stage={opp.stage} size="sm" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Account Team & Compliance Profile */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-2.5">
              Assigned Account Team
            </h3>

            <div className="mt-3 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Assigned Sales KAM:</span>
                <strong className="text-gray-900">{client.assignedSalesKAM}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Assigned Lead SA:</span>
                <strong className="text-gray-900">{client.assignedLeadSA}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Primary Cloud Platform:</span>
                <span className="font-mono text-blue-700 font-semibold">{client.primaryTechStack}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Contract Renewal Date:</span>
                <span className="font-mono text-gray-800">{client.contractRenewalDate}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-2.5">
              Compliance & Security Profile
            </h3>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {client.complianceCertifications.map((cert, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-medium">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  {cert}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
