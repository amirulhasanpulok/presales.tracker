export const ACTIVITY_TYPES_KEY = 'presales_tracker_activity_types_v1';

export const DEFAULT_ACTIVITY_TYPES = [
  'Phone Call', 'Email', 'Client Meeting', 'Internal Meeting', 'Online Meeting',
  'Site Survey', 'Requirement Gathering', 'Technical Discussion', 'OEM Discussion',
  'Solution Design', 'BOQ Preparation', 'Proposal Submission', 'Follow-up',
  'Commercial Discussion', 'Tender Activity', 'Documentation', 'Other',
];

export function getActivityTypes(): string[] {
  try {
    const stored = window.localStorage.getItem(ACTIVITY_TYPES_KEY);
    const parsed = stored ? JSON.parse(stored) : null;
    return Array.isArray(parsed) && parsed.length ? parsed : DEFAULT_ACTIVITY_TYPES;
  } catch {
    return DEFAULT_ACTIVITY_TYPES;
  }
}
