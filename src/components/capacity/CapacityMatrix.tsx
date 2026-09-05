import React from 'react';
import { Users, Cpu, Award, TrendingUp, CheckCircle, Plus, AlertCircle, Database, Layers } from 'lucide-react';
import { PresalesEngineer, Opportunity } from '../../types';
import { formatCurrency } from '../../utils/currency';

interface CapacityMatrixProps {
  engineers?: PresalesEngineer[];
  opportunities: Opportunity[];
  onSelectOpportunity: (opp: Opportunity) => void;
}

export const CapacityMatrix: React.FC<CapacityMatrixProps> = ({
  engineers = [],
  opportunities,
  onSelectOpportunity
}) => {
  const avgUtilization = engineers.length ? Math.round(engineers.reduce((total, engineer) => total + (engineer.utilizationPercentage || 0), 0) / engineers.length * 10) / 10 : 0;
  const activePocLabs = opportunities.filter(o => ['active_testing', 'validating_kpis'].includes(o.poc?.status)).length;
  const certifiedEngineers = engineers.filter(engineer => (engineer.certifications || []).length > 0).length;
  const certificationCoverage = engineers.length ? Math.round((certifiedEngineers / engineers.length) * 100) : 0;
  return (
    <div className="space-y-4">
      
      {/* Header Banner */}
      <div className="bg-white border border-gray-200 rounded p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <div>
              <h1 className="text-base font-bold text-gray-900 tracking-tight">Solutions Architecture Workload & Skill Matrix</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Monitor engineering utilization, cloud certifications, active POC commitments, and deal allocation bandwidth.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded bg-blue-50 text-blue-800 border border-blue-200 font-semibold">
              {engineers.length} Principal & Staff SAs
            </span>
          </div>
        </div>

        {/* Global Team Capacity Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-gray-100 text-xs font-mono">
          <div className="bg-gray-50 p-2.5 rounded border border-gray-200">
            <span className="text-gray-500 text-[11px] font-sans font-medium">Avg SA Team Utilization:</span>
            <div className="text-sm font-bold text-emerald-700">{avgUtilization}%</div>
          </div>
          <div className="bg-gray-50 p-2.5 rounded border border-gray-200">
            <span className="text-gray-500 text-[11px] font-sans font-medium">Total Supported Pipeline:</span>
            <div className="text-sm font-bold text-gray-900">{formatCurrency(opportunities.reduce((acc, o) => acc + o.contractValue, 0))}</div>
          </div>
          <div className="bg-gray-50 p-2.5 rounded border border-gray-200">
            <span className="text-gray-500 text-[11px] font-sans font-medium">Total Active POC Labs:</span>
            <div className="text-sm font-bold text-amber-800">{activePocLabs} Active Labs</div>
          </div>
          <div className="bg-gray-50 p-2.5 rounded border border-gray-200">
            <span className="text-gray-500 text-[11px] font-sans font-medium">Certification Coverage:</span>
            <div className="text-sm font-bold text-blue-800">{certificationCoverage}% Coverage</div>
          </div>
        </div>
      </div>

      {/* Engineer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {engineers.length === 0 && <div className="md:col-span-2 bg-white border border-dashed border-gray-300 rounded p-10 text-center"><Users className="w-8 h-8 mx-auto text-gray-300" /><h3 className="mt-2 text-sm font-semibold text-gray-800">No presales engineers found</h3><p className="mt-1 text-xs text-gray-500">Add presales users from User Management to populate the workload matrix.</p></div>}
        {engineers.map((eng) => {
          const assignedOpps = opportunities.filter(o => o.leadSolutionArchitect === eng.name);
          const totalVal = assignedOpps.reduce((acc, o) => acc + o.contractValue, 0);

          return (
            <div
              key={eng.id}
              className="bg-white border border-gray-200 rounded p-4 space-y-3 hover:border-gray-300 transition-colors shadow-2xs"
            >
              {/* Profile Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {eng.avatar ? <img
                    src={eng.avatar}
                    alt={eng.name}
                    className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-xs"
                  /> : <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-xs">{eng.name.split(/\s+/).map(word => word[0]).slice(0, 2).join('').toUpperCase()}</div>}
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">{eng.name}</h3>
                    <div className="text-xs text-blue-700 font-mono font-medium">{eng.title}</div>
                    <div className="text-[10px] text-gray-500 font-mono">{eng.email}</div>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <span className={`inline-block px-2 py-0.5 text-[11px] font-bold rounded border ${
                    eng.utilizationPercentage > 85 
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}>
                    {eng.utilizationPercentage}% Capacity Load
                  </span>
                </div>
              </div>

              {/* Skill Matrix Tags */}
              <div className="space-y-1">
                <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider font-semibold">Technical Domain Competencies</div>
                <div className="flex flex-wrap gap-1">
                  {eng.skills.map((skill, i) => (
                    <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Certifications */}
              <div className="space-y-1">
                <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider font-semibold">Industry Certifications</div>
                <div className="flex flex-wrap gap-1.5">
                  {eng.certifications.map((cert, i) => (
                    <span key={i} className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      <Award className="w-3 h-3 text-blue-600" />
                      {cert}
                    </span>
                  ))}
                </div>
              </div>

              {/* Active Assigned Deals */}
              <div className="pt-2 border-t border-gray-100 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span className="font-semibold">Assigned Active Deals ({assignedOpps.length})</span>
                  <span className="font-mono text-gray-900 font-bold">{formatCurrency(totalVal)} Pipeline</span>
                </div>

                <div className="space-y-1">
                  {assignedOpps.map(opp => (
                    <div
                      key={opp.id}
                      onClick={() => onSelectOpportunity(opp)}
                      className="p-2 rounded bg-gray-50 hover:bg-blue-50/50 border border-gray-200 hover:border-blue-200 flex items-center justify-between text-xs cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-mono text-blue-700 text-[11px] font-bold">{opp.code}</span>
                        <span className="text-gray-900 font-medium truncate">{opp.clientName}</span>
                      </div>
                      <span className="font-mono text-gray-600 text-[11px] font-semibold whitespace-nowrap">
                        {formatCurrency(opp.contractValue)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
