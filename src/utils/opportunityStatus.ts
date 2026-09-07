import { OpportunityStage } from '../types';

export const TERMINAL_OPPORTUNITY_STAGES: OpportunityStage[] = ['closed_won', 'closed_lost', 'cancelled'];

export function isTerminalOpportunity(stage?: string): boolean {
  return TERMINAL_OPPORTUNITY_STAGES.includes(stage as OpportunityStage);
}
