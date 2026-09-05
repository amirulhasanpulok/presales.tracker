import 'dotenv/config';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { hashPassword } from './auth.js';
import { initSchema, query } from './db.js';

const sourceFile = process.env.ACTIVITY_DATA_FILE || '/home/pulok/data/data.txt';
const text = fs.readFileSync(sourceFile, 'utf8');
const wantedKamNames = ['Swapan Roy', 'Mosleh', 'Taslima', 'Shamim', 'Arafat', 'Tushar', 'Tamanna', 'Eshan', 'Rokon', 'Atika', 'Mamun', 'Ahasan Ahmed', 'Mostafiz', 'Mosarof Jony', 'Mohammad Kowshik Aheed', 'Shahnaj Zafrin', 'Ahmed Zaman', 'Moniruzzaman', 'H. M. Riduan Kabir', 'Salauddin'];
const knownSourceKamNames = ['Zubayer Alam', 'Amirul Hasan Pulok', 'Mahade Hasan', 'Al Owaled', 'Manjuda Akter'];
const teamByKam = { 'Swapan Roy': 'STI', Mosleh: 'STI', Taslima: 'ESP', Shamim: 'Enterprise Team', Arafat: 'Enterprise Team', Tushar: 'Enterprise Team', Tamanna: 'Enterprise Team', Eshan: 'Enterprise Team', Rokon: 'Enterprise Team', Atika: 'Enterprise Team', Mamun: 'STI', 'Ahasan Ahmed': 'Other', Mostafiz: 'Enterprise Team', 'Mosarof Jony': 'Enterprise Team', 'Mohammad Kowshik Aheed': 'Enterprise Team', 'Shahnaj Zafrin': 'Enterprise Team', 'Ahmed Zaman': 'Enterprise Team', Moniruzzaman: 'Enterprise Team', 'H. M. Riduan Kabir': 'Enterprise Team', Salauddin: 'Enterprise Team' };
const clean = value => String(value || '').replace(/^"|"$/g, '').replace(/\s+/g, ' ').trim();
const key = value => clean(value).toLowerCase().replace(/^(mr|ms|md|mrs)\.?\s+/i, '').replace(/[^a-z0-9]/g, '');
const displayName = value => clean(value).toLowerCase().split(' ').map(word => word === 'md' || word === 'md.' ? 'Md.' : word === 'sm' || word === 's.m.' ? 'S.M.' : word ? word[0].toUpperCase() + word.slice(1) : word).join(' ');

function parseTSV(input) {
  const rows = [[]]; let cell = ''; let quoted = false;
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (char === '"') { if (quoted && input[i + 1] === '"') { cell += '"'; i += 1; } else quoted = !quoted; continue; }
    if (!quoted && char === '\t') { rows.at(-1).push(cell); cell = ''; continue; }
    if (!quoted && char === '\n') { rows.at(-1).push(cell); cell = ''; rows.push([]); continue; }
    cell += char;
  }
  if (cell || rows.at(-1).length) rows.at(-1).push(cell);
  return rows;
}

const parsed = parseTSV(text);
const headerIndex = parsed.findIndex(row => row[0]?.trim() === 'SL' && row.includes('Name of Client'));
const header = headerIndex >= 0 ? parsed[headerIndex].map(clean) : null;
const column = name => header ? header.indexOf(name) : -1;
const canonicalize = row => header ? [
  row[column('SL')], row[column('Month')], row[column('Working Date')], row[column('Sales Lead Recived Date')] || row[column('Sales Lead Received Date')], row[column('Aging')], row[column('Sales KAM')], row[column('Type of Activity')], row[column('Name of Client')], row[column('Scope of Work')], row[column('Main Domain')], row[column('Presales Personnel')], row[column('Inhouse Stakeholder')], row[column('Outside Stakeholder')], row[column('Daily Status')], row[column('Note')], row[column('Sales Status')], row[column('Implementation Status')], row[column('Next Action')],
] : row;
const rows = parsed.slice(headerIndex >= 0 ? headerIndex + 1 : 0).map(canonicalize).map(row => row.map(clean)).filter(row => row.length >= 18 && /^\d+$/.test(clean(row[0])) && clean(row[7]));
const opportunities = new Map();
for (const row of rows) {
  const clientName = clean(row[7]);
  const clientKey = key(clientName);
  if (!opportunities.has(clientKey)) opportunities.set(clientKey, { clientName, rows: [] });
  opportunities.get(clientKey).rows.push(row.map(clean));
}

await initSchema();
const existingUsers = await query('SELECT id, name, email FROM users');
const usersByName = new Map((existingUsers.rows || []).map(user => [key(user.name), user]));
const tempPasswordHash = await hashPassword(process.env.SALES_KAM_TEMP_PASSWORD || 'ChangeMe@2026');
const allKamNames = new Map([...wantedKamNames, ...knownSourceKamNames].map(name => [key(name), displayName(name)]));
for (const [normalized, name] of allKamNames) {
  const alias = normalized === key('Amirul Hasan Pulok') ? usersByName.get(key('Amirul Pulok')) : usersByName.get(normalized);
  if (alias) continue;
  const id = `usr-data-kam-${crypto.createHash('sha1').update(normalized).digest('hex').slice(0, 12)}`;
  const email = `${normalized}@link3.net`;
  const salesTeam = teamByKam[name] || 'Enterprise Team';
  await query(`INSERT INTO users (id, name, email, password_hash, role, role_id, department, sales_team, status, region, must_change_password)
    VALUES ($1, $2, $3, $4, 'Sales KAM', 'role-kam', 'Sales', $5, 'Active', 'Bangladesh', true)
    ON CONFLICT (email) DO NOTHING`, [id, name, email, tempPasswordHash, salesTeam]);
}

const existingClients = await query('SELECT id, doc FROM clients');
const clientsByName = new Map((existingClients.rows || []).map(item => [key(item.doc?.name), item]));
const existingOpps = await query('SELECT id, doc FROM opportunities');
const oppsByClient = new Map((existingOpps.rows || []).map(item => [key(item.doc?.clientName), item]));
let createdOpps = 0; let addedActivities = 0;
for (const item of opportunities.values()) {
  const first = item.rows[0];
  let client = clientsByName.get(key(item.clientName));
  if (!client) {
    const clientId = `data-client-${crypto.createHash('sha1').update(key(item.clientName)).digest('hex').slice(0, 12)}`;
    const clientDoc = { id: clientId, code: `DATA-${crypto.createHash('sha1').update(key(item.clientName)).digest('hex').slice(0, 8).toUpperCase()}`, name: item.clientName, industry: 'Imported', tier: 'Enterprise Tier 2', headquarters: '', primaryTechStack: 'Hybrid / On-Prem', assignedSalesKAM: displayName(first[5]), assignedLeadSA: displayName(first[10]), activeOpportunitiesCount: 1, totalContractedTCV: 0, createdDate: new Date().toISOString().slice(0, 10), lastUpdated: new Date().toISOString(), source: 'data.txt', keyStakeholders: [], notes: 'Imported from presales activity data.' };
    await query('INSERT INTO clients (id, doc, created_at, updated_at) VALUES ($1, $2, now(), now()) ON CONFLICT (id) DO NOTHING', [clientId, JSON.stringify(clientDoc)]);
    client = { id: clientId, doc: clientDoc }; clientsByName.set(key(item.clientName), client);
  }
  const activities = item.rows.map(row => ({ id: `data-activity-${crypto.createHash('sha1').update(row.join('|')).digest('hex').slice(0, 14)}`, type: row[6] || 'Other', title: row[8] || row[6] || 'Imported presales update', timestamp: row[2] || new Date().toISOString(), author: displayName(row[10]) || 'Imported Presales Team', summary: row[14] || row[12] || '', durationMinutes: 0, attendees: [], currentStage: row[12] || '', nextAction: row[17] || '', nextFollowUpDate: row[3] || '', metadata: { subscriberReference: row[4], salesTeam: row[9], category: row[6], status: row[12], productDetails: row[13], salesStatus: row[15], implementationStatus: row[16] } }));
  let opp = oppsByClient.get(key(item.clientName));
  if (!opp) {
    const opportunityId = `data-opp-${crypto.createHash('sha1').update(key(item.clientName)).digest('hex').slice(0, 12)}`;
    const doc = { id: opportunityId, code: `DATA-${crypto.createHash('sha1').update(key(item.clientName)).digest('hex').slice(0, 8).toUpperCase()}`, name: `${item.clientName} Presales Activity`, clientName: item.clientName, clientIndustry: 'Enterprise SaaS', region: 'APAC (Singapore/Tokyo)', stage: 'qualification', priority: 'p2_medium', dealComplexity: 'medium', technicalFitScore: 'moderate', primaryTechStack: 'Hybrid / On-Prem', technologies: [...new Set(item.rows.flatMap(row => [row[8], row[13]]).filter(Boolean))], scopes: [...new Set(item.rows.map(row => row[8]).filter(Boolean))], contractValue: 0, arr: 0, winProbability: 0, expectedCloseDate: '', leadSolutionArchitect: displayName(first[10]) || 'Unassigned', accountExecutive: displayName(first[5]) || 'Unassigned', currentLegacyStack: '', proposedArchitecture: '', keyTechnicalRequirements: [], complianceRequirements: [], securityReviewStatus: 'Not Started', activities, stakeholders: [], poc: { status: 'not_started', allocatedBudget: 0, successCriteria: [], blockers: [] }, boq: { items: [], subtotalCost: 0, subtotalListPrice: 0, totalDiscountAmount: 0, totalContractValue: 0, annualRecurringRevenue: 0, oneTimeServicesValue: 0, overallMarginPercent: 0, approvalStatus: 'draft', version: 1 }, actionItems: [], handover: { isHandedOver: false, technicalRunbookReady: false, credentialsSecurelyTransferred: false, customerTechKickoffScheduled: false, knownTechnicalDebtOrRisks: [], specialSLAsAgreed: [] }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), lastContactedAt: new Date().toISOString(), daysInCurrentStage: 0 };
    await query('INSERT INTO opportunities (id, doc, owner_id, updated_at) VALUES ($1, $2, NULL, now()) ON CONFLICT (id) DO NOTHING', [opportunityId, JSON.stringify(doc)]);
    createdOpps += 1; opp = { id: opportunityId, doc }; oppsByClient.set(key(item.clientName), opp);
  } else {
    const current = opp.doc || {}; const existingIds = new Set((current.activities || []).map(activity => activity.id)); const fresh = activities.filter(activity => !existingIds.has(activity.id));
    if (fresh.length) await query('UPDATE opportunities SET doc = $2, updated_at = now() WHERE id = $1', [opp.id, JSON.stringify({ ...current, activities: [...fresh, ...(current.activities || [])], updatedAt: new Date().toISOString() })]);
    addedActivities += fresh.length;
  }
}
console.log(`Imported ${createdOpps} opportunities and ${rows.length} activity rows from ${sourceFile}; ${addedActivities} activities appended to existing opportunities.`);
