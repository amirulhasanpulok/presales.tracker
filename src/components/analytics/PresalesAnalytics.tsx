import React from 'react';
import { BarChart3, TrendingUp, DollarSign, Clock, ShieldCheck, Cpu, ArrowUpRight } from 'lucide-react';
import { Opportunity } from '../../types';

interface PresalesAnalyticsProps {
  opportunities: Opportunity[];
}

export const PresalesAnalytics: React.FC<PresalesAnalyticsProps> = ({
  opportunities
}) => {
  const totalPipeline = opportunities.reduce((acc, o) => acc + o.contractValue, 0);
  const totalARR = opportunities.reduce((acc, o) => acc + o.arr, 0);
  const wonOpps = opportunities.filter(o => o.stage === 'closed_won');
  const wonValue = wonOpps.reduce((acc, o) => acc + o.contractValue, 0);

  // Group by Stack
  const stackBreakdown: Record<string, { count: number; value: number }> = {};
  opportunities.forEach(o => {
    if (!stackBreakdown[o.primaryTechStack]) {
      stackBreakdown[o.primaryTechStack] = { count: 0, value: 0 };
    }
    stackBreakdown[o.primaryTechStack].count += 1;
    stackBreakdown[o.primaryTechStack].value += o.contractValue;
  });

  // Group by Industry
  const industryBreakdown: Record<string, { count: number; value: number }> = {};
  opportunities.forEach(o => {
    if (!industryBreakdown[o.clientIndustry]) {
      industryBreakdown[o.clientIndustry] = { count: 0, value: 0 };
    }
    industryBreakdown[o.clientIndustry].count += 1;
    industryBreakdown[o.clientIndustry].value += o.contractValue;
  });

  return (
    <div className="space-y-4">
      
      {/* Top Banner */}
      <div className="bg-white border border-gray-200 rounded p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <div>
              <h1 className="text-base font-bold text-gray-900 tracking-tight">Presales Performance & Deal Velocity Intelligence</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Technical win-rate metrics, cycle velocity by cloud architecture, BOQ margin realization, and POC conversions.
              </p>
            </div>
          </div>
        </div>

        {/* Global Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-gray-100 text-xs font-mono">
          <div className="bg-gray-50 p-2.5 rounded border border-gray-200">
            <span className="text-gray-500 text-[11px] font-sans font-medium">Total Supported TCV:</span>
            <div className="text-base font-bold text-gray-900">${(totalPipeline / 1000000).toFixed(2)}M</div>
            <div className="text-[10px] text-emerald-700 flex items-center gap-0.5 mt-0.5 font-sans font-semibold">
              <TrendingUp className="w-3 h-3" /> +18.4% QoQ Growth
            </div>
          </div>

          <div className="bg-gray-50 p-2.5 rounded border border-gray-200">
            <span className="text-gray-500 text-[11px] font-sans font-medium">Technical Win Rate:</span>
            <div className="text-base font-bold text-emerald-700">74.2%</div>
            <div className="text-[10px] text-gray-500 font-sans">When SA assigned early</div>
          </div>

          <div className="bg-gray-50 p-2.5 rounded border border-gray-200">
            <span className="text-gray-500 text-[11px] font-sans font-medium">Avg Tech Discovery Cycle:</span>
            <div className="text-base font-bold text-gray-900">14.8 Days</div>
            <div className="text-[10px] text-gray-500 font-sans">Intake to SADD approval</div>
          </div>

          <div className="bg-gray-50 p-2.5 rounded border border-gray-200">
            <span className="text-gray-500 text-[11px] font-sans font-medium">Average BOQ Margin:</span>
            <div className="text-base font-bold text-purple-700">36.5%</div>
            <div className="text-[10px] text-gray-500 font-sans">Exceeds 30% baseline</div>
          </div>
        </div>
      </div>

      {/* Grid of Analytical Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Breakdown by Primary Cloud / Stack */}
        <div className="bg-white border border-gray-200 rounded p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs text-gray-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-600" />
              Pipeline by Cloud & Tech Stack
            </h3>
            <span className="text-[11px] font-mono text-gray-500">Total Value ($)</span>
          </div>

          <div className="space-y-3 pt-1">
            {Object.entries(stackBreakdown).map(([stack, data]) => {
              const pct = totalPipeline > 0 ? (data.value / totalPipeline) * 100 : 0;

              return (
                <div key={stack} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-900 font-medium">{stack} ({data.count} deals)</span>
                    <span className="text-gray-700 font-mono font-bold">${(data.value / 1000).toLocaleString()}k ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Breakdown by Client Industry */}
        <div className="bg-white border border-gray-200 rounded p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Pipeline by Industry Sector
            </h3>
            <span className="text-[11px] font-mono text-gray-500">Deal Concentration</span>
          </div>

          <div className="space-y-3 pt-1">
            {Object.entries(industryBreakdown).map(([industry, data]) => {
              const pct = totalPipeline > 0 ? (data.value / totalPipeline) * 100 : 0;

              return (
                <div key={industry} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-900 font-medium">{industry}</span>
                    <span className="text-gray-700 font-mono font-bold">${(data.value / 1000).toLocaleString()}k</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                    <div
                      className="h-full bg-emerald-600 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
