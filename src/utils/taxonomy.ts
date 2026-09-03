export const DEFAULT_TECH_STACKS = [
  'AWS / Kubernetes',
  'GCP / BigQuery / Vertex AI',
  'Azure / AKS / OpenShift',
  'Multi-Cloud / Terraform',
  'On-Prem Hybrid / VMware',
];

export const DEFAULT_INDUSTRIES = [
  'FinTech & Banking',
  'Healthcare & Life Sciences',
  'E-Commerce & Retail',
  'Enterprise SaaS',
  'Telecom / 5G',
  'Manufacturing & IoT',
  'Public Sector',
  'Energy / Utilities',
];

export const DEFAULT_REGIONS = [
  'North America (US-East)',
  'North America (US-West)',
  'EMEA (London/Frankfurt)',
  'APAC (Singapore/Tokyo)',
  'LATAM',
];

export const CLOUD_PROVIDERS = [
  'AWS', 'Google Cloud', 'Azure', 'Kubernetes', 'AI / LLM Infra', 'Hybrid / On-Prem', 'Multi-Cloud',
] as const;

export function getConfiguredTaxonomy(key: string, fallback: string[]): string[] {
  try {
    const stored = window.localStorage.getItem(`presales_tracker_taxonomy_${key}_v1`);
    const value = stored ? JSON.parse(stored) : null;
    return Array.isArray(value) && value.length ? value : fallback;
  } catch {
    return fallback;
  }
}

export function saveConfiguredTaxonomy(key: string, values: string[]): void {
  window.localStorage.setItem(`presales_tracker_taxonomy_${key}_v1`, JSON.stringify(values));
  window.dispatchEvent(new Event('presales:taxonomy-changed'));
}
