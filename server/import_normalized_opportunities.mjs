import 'dotenv/config';
import fs from 'node:fs';
import pg from 'pg';

const { Pool } = pg;
const inputFile = process.env.IMPORT_INPUT || '/home/pulok/data/normalized_opportunity_import.json';
const confirm = process.env.IMPORT_CONFIRM === 'YES';
const pool = new Pool({
  host: process.env.PGHOST || '127.0.0.1',
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'presales',
  password: process.env.PGPASSWORD || '',
  database: process.env.PGDATABASE || 'presales',
  max: 1,
});

const clean = value => String(value ?? '').replace(/\s+/g, ' ').trim();
const parseDate = value => {
  const raw = clean(value);
  if (!raw) return null;
  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) return direct.toISOString();
  const monthDay = raw.match(/^(\d{1,2})[- ]([A-Za-z]{3,9})$/);
  if (monthDay) {
    const parsed = new Date(`${monthDay[2]} ${monthDay[1]}, 2025T12:00:00Z`);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return null;
};
const key = value => clean(value).toLowerCase().replace(/[^a-z0-9]/g, '');

function buildActivity(activity) {
  return {
    ...activity,
    timestamp: parseDate(activity.timestamp) || new Date().toISOString(),
  };
}

function buildOpportunity(source) {
  const activities = (source.activities || []).map(buildActivity);
  const now = new Date().toISOString();
  const firstActivity = activities[activities.length - 1]?.timestamp || now;
  const outcome = source.outcome?.outcome || 'open';
  const statusDate = parseDate(source.statusDate);
  return {
    id: source.id,
    code: source.code,
    name: source.name,
    clientName: source.clientName,
    clientIndustry: 'Enterprise SaaS',
    region: 'APAC (Singapore/Tokyo)',
    stage: source.stage || 'qualification',
    priority: source.priority || 'p2_medium',
    dealComplexity: 'medium',
    technicalFitScore: 'moderate',
    primaryTechStack: source.primaryTechStack || 'Hybrid / On-Prem',
    technologies: Array.isArray(source.technologies) ? source.technologies : [],
    scopes: Array.isArray(source.scopes) ? source.scopes : [],
    contractValue: 0,
    arr: 0,
    winProbability: outcome === 'won' ? 100 : outcome === 'lost' || outcome === 'cancelled' ? 0 : 50,
    expectedCloseDate: '',
    leadSolutionArchitect: source.leadSolutionArchitect || 'Unassigned',
    accountExecutive: source.accountExecutive || 'Unassigned',
    salesKams: source.salesKams || [],
    presalesEngineers: source.presalesEngineers || [],
    assignmentReviewRequired: Boolean(source.assignmentReviewRequired),
    currentLegacyStack: '',
    proposedArchitecture: '',
    keyTechnicalRequirements: [],
    complianceRequirements: [],
    securityReviewStatus: 'Not Started',
    activities,
    stakeholders: [],
    documents: [],
    poc: { status: 'not_started', allocatedBudget: 0, successCriteria: [], blockers: [] },
    boq: { items: [], subtotalCost: 0, subtotalListPrice: 0, totalDiscountAmount: 0, totalContractValue: 0, annualRecurringRevenue: 0, oneTimeServicesValue: 0, overallMarginPercent: 0, approvalStatus: 'draft', version: 1 },
    actionItems: [],
    handover: { isHandedOver: false, technicalRunbookReady: false, credentialsSecurelyTransferred: false, customerTechKickoffScheduled: false, knownTechnicalDebtOrRisks: [], specialSLAsAgreed: [] },
    outcome: { outcome, ...(statusDate ? (outcome === 'won' ? { wonDate: statusDate.slice(0, 10) } : outcome === 'lost' ? { lostDate: statusDate.slice(0, 10) } : {}) : {}) },
    sourceFiles: source.sourceFiles || [],
    lastImportedStatus: source.lastStatus || '',
    importReviewRequired: true,
    createdAt: firstActivity,
    updatedAt: now,
    lastContactedAt: firstActivity,
    daysInCurrentStage: 0,
  };
}

const input = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
const sources = Array.isArray(input.opportunities) ? input.opportunities : [];
const opportunities = sources.map(buildOpportunity);
const errors = opportunities.flatMap(item => {
  const problems = [];
  if (!item.id || !item.clientName || !item.name) problems.push('missing identity');
  if (!['closed_won', 'closed_lost', 'cancelled', 'on_hold', 'qualification'].includes(item.stage)) problems.push(`invalid stage ${item.stage}`);
  return problems.length ? [{ id: item.id, problems }] : [];
});
if (errors.length) throw new Error(`Normalized import validation failed: ${JSON.stringify(errors.slice(0, 10))}`);

const report = { dryRun: !confirm, inputFile, opportunities: opportunities.length, activities: opportunities.reduce((sum, item) => sum + item.activities.length, 0), unassignedSalesKams: opportunities.filter(item => item.accountExecutive === 'Unassigned').length, unassignedPresalesEngineers: opportunities.filter(item => item.leadSolutionArchitect === 'Unassigned').length };
if (!confirm) {
  console.log(JSON.stringify(report, null, 2));
  await pool.end();
  process.exit(0);
}

const client = await pool.connect();
try {
  await client.query('BEGIN');
  const existingClients = await client.query('SELECT id, doc FROM clients');
  const clientsByName = new Map((existingClients.rows || []).map(row => [key(row.doc?.name), row]));
  let createdClients = 0; let insertedOpportunities = 0;
  for (const opportunity of opportunities) {
    const clientKey = key(opportunity.clientName);
    let matchedClient = clientsByName.get(clientKey);
    if (!matchedClient) {
      const clientId = `import-client-${key(opportunity.clientName).slice(0, 40)}`;
      const clientDoc = { id: clientId, name: opportunity.clientName, code: `IMP-${clientId.slice(-8).toUpperCase()}`, industry: opportunity.clientIndustry, region: opportunity.region, tier: 'Enterprise Tier 2', primaryTechStack: opportunity.primaryTechStack, activeOpportunitiesCount: 1, totalContractedTCV: 0, createdDate: new Date().toISOString().slice(0, 10), lastUpdated: new Date().toISOString(), source: 'normalized opportunity import', keyStakeholders: [] };
      await client.query('INSERT INTO clients (id, doc, created_at, updated_at) VALUES ($1, $2, now(), now()) ON CONFLICT (id) DO NOTHING', [clientId, JSON.stringify(clientDoc)]);
      matchedClient = { id: clientId, doc: clientDoc }; clientsByName.set(clientKey, matchedClient); createdClients += 1;
    }
    const result = await client.query('INSERT INTO opportunities (id, doc, owner_id, updated_at) VALUES ($1, $2, NULL, now()) ON CONFLICT (id) DO NOTHING', [opportunity.id, JSON.stringify(opportunity)]);
    insertedOpportunities += result.rowCount;
  }
  await client.query('COMMIT');
  console.log(JSON.stringify({ ...report, dryRun: false, createdClients, insertedOpportunities }, null, 2));
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release(); await pool.end();
}
