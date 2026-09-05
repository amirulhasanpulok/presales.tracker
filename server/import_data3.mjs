import 'dotenv/config';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { initSchema, query } from './db.js';

const sourceFile = process.env.DATA3_FILE || '/home/pulok/data/data3.txt';
const lines = fs.readFileSync(sourceFile, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
const headers = lines.shift().split('\t').map(value => value.trim());
const clean = value => String(value || '').replace(/^"|"$/g, '').replace(/\s+/g, ' ').trim();
const key = value => clean(value).toLowerCase().replace(/[^a-z0-9]/g, '');
const rows = lines.map(line => line.split('\t').map(clean)).filter(row => row.length >= headers.length && row[4]);
const groups = new Map();
for (const row of rows) {
  const clientName = row[4];
  const clientKey = key(clientName);
  if (!groups.has(clientKey)) groups.set(clientKey, { clientName, rows: [] });
  groups.get(clientKey).rows.push(row);
}

await initSchema();
const existingClients = await query('SELECT id, doc FROM clients');
const clientsByName = new Map((existingClients.rows || []).map(item => [key(item.doc?.name), item]));
const existingOpps = await query('SELECT id, doc FROM opportunities');
const oppsByClient = new Map((existingOpps.rows || []).map(item => [key(item.doc?.clientName), item]));
let created = 0; let appended = 0;
for (const group of groups.values()) {
  const clientKey = key(group.clientName);
  const first = group.rows[0];
  if (!clientsByName.has(clientKey)) {
    const clientId = `data3-client-${crypto.createHash('sha1').update(clientKey).digest('hex').slice(0, 12)}`;
    const clientDoc = { id: clientId, code: `DATA3-${crypto.createHash('sha1').update(clientKey).digest('hex').slice(0, 8).toUpperCase()}`, name: group.clientName, industry: 'Imported', tier: 'Enterprise Tier 2', headquarters: '', primaryTechStack: first[6] || 'Unassigned', assignedSalesKAM: '', assignedLeadSA: '', totalContractedTCV: 0, activeOpportunitiesCount: 1, createdDate: new Date().toISOString().slice(0, 10), lastUpdated: new Date().toISOString(), source: 'data3.txt', keyStakeholders: [], notes: 'Imported from data3 activity records.' };
    await query('INSERT INTO clients (id, doc, created_at, updated_at) VALUES ($1, $2, now(), now()) ON CONFLICT (id) DO NOTHING', [clientId, JSON.stringify(clientDoc)]);
    clientsByName.set(clientKey, { id: clientId, doc: clientDoc });
  }
  const activities = group.rows.map(row => ({ id: `data3-activity-${crypto.createHash('sha1').update(row.join('|')).digest('hex').slice(0, 14)}`, type: row[3] || 'Other', title: row[3] || 'Imported activity', timestamp: (new Date(`${new Date().getFullYear()} ${row[2] || row[1]}`)).toISOString(), author: 'Imported Presales Activity', summary: row[8] || '', durationMinutes: 0, attendees: [], currentStage: row[8] || '', nextAction: '', nextFollowUpDate: '', metadata: { sl: row[0], month: row[1], monthLabel: row[2], scopeOfWork: row[5], mainDomain: row[6], inhouseStakeholder: row[7], salesStatus: row[8] } }));
  const existing = oppsByClient.get(clientKey);
  if (!existing) {
    const opportunityId = `data3-opp-${crypto.createHash('sha1').update(clientKey).digest('hex').slice(0, 12)}`;
    const doc = { id: opportunityId, code: `DATA3-${crypto.createHash('sha1').update(clientKey).digest('hex').slice(0, 8).toUpperCase()}`, name: `${group.clientName} Presales Activity`, clientName: group.clientName, clientIndustry: 'Enterprise SaaS', region: 'APAC (Singapore/Tokyo)', stage: 'qualification', priority: 'p2_medium', dealComplexity: 'medium', technicalFitScore: 'moderate', primaryTechStack: first[6] || 'Hybrid / On-Prem', technologies: [...new Set(group.rows.flatMap(row => [row[5], row[6]]).filter(Boolean))], scopes: [...new Set(group.rows.map(row => row[5]).filter(Boolean))], contractValue: 0, arr: 0, winProbability: 0, expectedCloseDate: '', leadSolutionArchitect: 'Unassigned', accountExecutive: 'Unassigned', currentLegacyStack: '', proposedArchitecture: '', keyTechnicalRequirements: [], complianceRequirements: [], securityReviewStatus: 'Not Started', activities, stakeholders: [], poc: { status: 'not_started', allocatedBudget: 0, successCriteria: [], blockers: [] }, boq: { items: [], subtotalCost: 0, subtotalListPrice: 0, totalDiscountAmount: 0, totalContractValue: 0, annualRecurringRevenue: 0, oneTimeServicesValue: 0, overallMarginPercent: 0, approvalStatus: 'draft', version: 1 }, actionItems: [], handover: { isHandedOver: false, technicalRunbookReady: false, credentialsSecurelyTransferred: false, customerTechKickoffScheduled: false, knownTechnicalDebtOrRisks: [], specialSLAsAgreed: [] }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), lastContactedAt: new Date().toISOString(), daysInCurrentStage: 0 };
    await query('INSERT INTO opportunities (id, doc, owner_id, updated_at) VALUES ($1, $2, NULL, now()) ON CONFLICT (id) DO NOTHING', [opportunityId, JSON.stringify(doc)]);
    oppsByClient.set(clientKey, { id: opportunityId, doc }); created += 1;
  } else {
    const current = existing.doc || {}; const known = new Set((current.activities || []).map(activity => activity.id)); const fresh = activities.filter(activity => !known.has(activity.id));
    if (fresh.length) { await query('UPDATE opportunities SET doc = $2, updated_at = now() WHERE id = $1', [existing.id, JSON.stringify({ ...current, activities: [...fresh, ...(current.activities || [])], updatedAt: new Date().toISOString() })]); appended += fresh.length; }
  }
}
console.log(`data3 import complete: ${groups.size} unique clients, ${created} opportunities created, ${appended} activities appended.`);
