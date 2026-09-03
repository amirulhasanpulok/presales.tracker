import React from 'react';
import { DealComplexity, DealPriority, OpportunityStage, POCStatus, TechnicalFitScore } from '../../types';
import { STAGE_CONFIG } from '../../config/workflow';

interface StageBadgeProps {
  stage: OpportunityStage;
  size?: 'sm' | 'md';
}

export const StageBadge: React.FC<StageBadgeProps> = ({ stage, size = 'md' }) => {
  const config = STAGE_CONFIG[stage] || {
    label: stage,
    shortLabel: stage,
    color: 'text-gray-700',
    bg: 'bg-gray-100',
    borderColor: 'border-gray-300'
  };

  const sizeClasses = size === 'sm' ? 'text-[11px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-medium rounded border ${config.bg} ${config.color} ${config.borderColor} ${sizeClasses} whitespace-nowrap`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.color.replace('text-', 'bg-')}`} />
      {config.shortLabel}
    </span>
  );
};

interface PriorityBadgeProps {
  priority: DealPriority;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  switch (priority) {
    case 'p0_urgent':
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
          <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
          P0 URGENT
        </span>
      );
    case 'p1_high':
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
          P1 HIGH
        </span>
      );
    case 'p2_medium':
      return (
        <span className="inline-flex items-center text-[11px] font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
          P2 MED
        </span>
      );
    case 'p3_low':
    default:
      return (
        <span className="inline-flex items-center text-[11px] font-mono px-1.5 py-0.5 rounded bg-gray-50 text-gray-500 border border-gray-200">
          P3 LOW
        </span>
      );
  }
};

interface ComplexityBadgeProps {
  complexity: DealComplexity;
}

export const ComplexityBadge: React.FC<ComplexityBadgeProps> = ({ complexity }) => {
  const styles: Record<DealComplexity, { label: string; color: string; bg: string }> = {
    low: { label: 'Low', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
    medium: { label: 'Medium', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
    high: { label: 'High', color: 'text-amber-800', bg: 'bg-amber-50 border-amber-200' },
    critical: { label: 'Critical / Multi-Tier', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  };
  const config = styles[complexity];
  return (
    <span className={`inline-flex items-center text-[11px] font-mono px-1.5 py-0.5 rounded border ${config.bg} ${config.color}`}>
      {config.label}
    </span>
  );
};

interface POCBadgeProps {
  status: POCStatus;
}

export const POCBadge: React.FC<POCBadgeProps> = ({ status }) => {
  const map: Record<POCStatus, { label: string; color: string; bg: string }> = {
    not_started: { label: 'Not Started', color: 'text-gray-600', bg: 'bg-gray-100 border-gray-200' },
    scoping: { label: 'Scoping Lab', color: 'text-cyan-700', bg: 'bg-cyan-50 border-cyan-200' },
    provisioning: { label: 'Provisioning', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
    active_testing: { label: 'Active Testing', color: 'text-amber-800', bg: 'bg-amber-50 border-amber-200' },
    validating_kpis: { label: 'Validating KPIs', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
    passed: { label: 'POC Passed', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
    failed: { label: 'Failed Criteria', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
    cancelled: { label: 'Cancelled', color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200' },
  };
  const c = map[status] || map.not_started;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-mono px-1.5 py-0.5 rounded border ${c.bg} ${c.color}`}>
      <span className={`w-1 h-1 rounded-full ${c.color.replace('text-', 'bg-')}`} />
      {c.label}
    </span>
  );
};

export const TechFitBadge: React.FC<{ score: TechnicalFitScore }> = ({ score }) => {
  const map: Record<TechnicalFitScore, { label: string; color: string }> = {
    perfect: { label: '95-100% Fit', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    good: { label: '80-95% Fit', color: 'text-cyan-700 bg-cyan-50 border-cyan-200' },
    moderate: { label: '60-80% Fit (Gaps)', color: 'text-amber-800 bg-amber-50 border-amber-200' },
    challenging: { label: '<60% Custom Dev', color: 'text-red-700 bg-red-50 border-red-200' },
  };
  const c = map[score] || map.good;
  return (
    <span className={`inline-flex items-center text-[10px] font-mono px-1.5 py-0.5 rounded border ${c.color}`}>
      {c.label}
    </span>
  );
};
