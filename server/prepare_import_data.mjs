import fs from 'node:fs';
import crypto from 'node:crypto';

const dataFile = process.env.ACTIVITY_DATA_FILE || '/home/pulok/data/data.txt';
const data2File = process.env.ACTIVITY_DATA2_FILE || '/home/pulok/data/data2.txt';
const data3File = process.env.DATA3_FILE || '/home/pulok/data/data3.txt';
const outputFile = process.env.IMPORT_OUTPUT || '/home/pulok/data/normalized_opportunity_import.json';

const clean = value => String(value ?? '').replace(/^"|"$/g, '').replace(/\s+/g, ' ').trim();
const key = value => clean(value).toLowerCase().replace(/^(mr|ms|md|mrs)\.?\s+/i, '').replace(/[^a-z0-9]/g, '');
function deriveStage(group) {
  const types = group.activities.map(activity => clean(activity.type).toLowerCase());
  if (types.some(type => /tender|financial proposal|business proposal|price quotation|quotation|pre tender|work order/.test(type))) return 'commercial_negotiation';
  if (group.boqSubmitted || types.some(type => /boq|bom/.test(type))) return 'proposal_boq';
  if (types.some(type => /technical proposal|technical solution|solution plan|planning|product analysis|scope analysis/.test(type))) return 'solution_design';
  if (types.some(type => /meeting|rfq|inhouse|oem|event/.test(type))) return 'tech_discovery';
  return 'qualification';
}

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
  return rows.filter(row => row.some(value => String(value).trim()));
}

function canonicalActivityRows(file, source) {
  const parsed = parseTSV(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
  const hasHeader = parsed[0]?.includes('Name of Client');
  const header = hasHeader ? parsed[0].map(clean) : null;
  const rows = hasHeader ? parsed.slice(1) : parsed;
  const column = name => header ? header.indexOf(name) : -1;
  return rows.map(row => {
    // data.txt predates the explicit Main Domain column and has one spare blank
    // near the end; normalize it to the data2.txt schema.
    const normalized = hasHeader ? row : [...row.slice(0, 9), '', ...row.slice(9, 15), row[16], row[17]];
    const value = name => normalized[hasHeader ? column(name) : ({ SL: 0, Month: 1, 'Working Date': 2, 'Sales Lead Recived Date': 3, Aging: 4, 'Presales Personnel': 5, 'Type of Activity': 6, 'Name of Client': 7, 'Scope of Work': 8, 'Main Domain': 9, 'Inhouse Stakeholder': 10, 'Sales KAM': 11, 'Outside Stakeholder': 12, 'Daily Status': 13, Note: 14, 'Sales Status': 15, 'Implementation Status': 16, 'Next Action': 17 }[name])];
    return { source, sl: clean(value('SL')), month: clean(value('Month')), workingDate: clean(value('Working Date')), presalesPersonnel: clean(value('Presales Personnel')), activityType: clean(value('Type of Activity')) || 'Other', clientName: clean(value('Name of Client')), scope: clean(value('Scope of Work')), mainDomain: clean(value('Main Domain')), inhouseStakeholder: clean(value('Inhouse Stakeholder')), salesKam: clean(value('Sales KAM')), outsideStakeholder: clean(value('Outside Stakeholder')), dailyStatus: clean(value('Daily Status')), note: clean(value('Note')), salesStatus: clean(value('Sales Status')), implementationStatus: clean(value('Implementation Status')), nextAction: clean(value('Next Action')) };
  }).filter(row => row.clientName);
}

function data3Rows(file) {
  const parsed = parseTSV(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
  return parsed.slice(1).map(row => ({ source: 'data3.txt', sl: clean(row[0]), month: clean(row[1]), workingDate: clean(row[2]), presalesPersonnel: '', activityType: clean(row[3]) || 'Other', clientName: clean(row[4]), scope: clean(row[5]), mainDomain: clean(row[6]), inhouseStakeholder: clean(row[7]), salesKam: '', outsideStakeholder: '', dailyStatus: '', note: '', salesStatus: clean(row[8]), implementationStatus: '', nextAction: '' })).filter(row => row.clientName);
}

const primary = canonicalActivityRows(data2File, 'data2.txt');
const legacy = canonicalActivityRows(dataFile, 'data.txt');
const legacyByIdentity = new Map(legacy.map(record => [[key(record.clientName), record.sl, record.workingDate, record.activityType, record.scope].join('|'), record]));
const mergedPrimary = primary.map(record => {
  const legacyRecord = legacyByIdentity.get([key(record.clientName), record.sl, record.workingDate, record.activityType, record.scope].join('|'));
  return legacyRecord ? { ...record, salesStatus: record.salesStatus || legacyRecord.salesStatus, implementationStatus: record.implementationStatus || legacyRecord.implementationStatus, nextAction: record.nextAction || legacyRecord.nextAction } : record;
});
const historical = data3Rows(data3File);
const records = [...mergedPrimary, ...historical];
const groups = new Map();
const seenActivities = new Set();
let duplicateActivities = 0;
for (const record of records) {
  const activityKey = [key(record.clientName), record.activityType, record.workingDate, record.scope, record.note, record.salesStatus].map(clean).join('|');
  const activityId = `import-activity-${crypto.createHash('sha1').update(activityKey).digest('hex').slice(0, 14)}`;
  if (seenActivities.has(activityId)) { duplicateActivities += 1; continue; }
  seenActivities.add(activityId);
  const activity = { id: activityId, type: record.activityType, title: record.scope || record.activityType, timestamp: record.workingDate || null, author: record.presalesPersonnel || 'Imported Presales Activity', summary: record.note || record.salesStatus || '', attendees: [], nextAction: record.nextAction || '', metadata: { source: record.source, sl: record.sl, month: record.month, mainDomain: record.mainDomain, inhouseStakeholder: record.inhouseStakeholder, salesKam: record.salesKam, outsideStakeholder: record.outsideStakeholder, dailyStatus: record.dailyStatus, implementationStatus: record.implementationStatus } };
  const clientKey = key(record.clientName);
   if (!groups.has(clientKey)) groups.set(clientKey, { clientName: record.clientName, activities: [], sources: new Set(), scopes: new Set(), salesKams: new Set(), presalesEngineers: new Set(), lastStatus: '', statusSource: '', statusDate: null, boqSubmitted: false, boqCompleted: false });
  const group = groups.get(clientKey);
  group.activities.push(activity); group.sources.add(record.source); if (record.scope) group.scopes.add(record.scope);
  if (record.salesKam && !['N/A', 'NA', 'Unassigned'].includes(record.salesKam)) group.salesKams.add(record.salesKam);
  if (record.presalesPersonnel && !['N/A', 'NA', 'Unassigned'].includes(record.presalesPersonnel)) group.presalesEngineers.add(record.presalesPersonnel);
  if (record.salesStatus || record.source === 'data3.txt') { group.lastStatus = record.salesStatus || 'Unknown'; group.statusSource = record.source; group.statusDate = record.workingDate || null; }
   const boqText = [record.activityType, record.scope, record.note, record.salesStatus].join(' ');
   if (/boq(?:\s*&\s*price)?\s*submitted/i.test(boqText)) group.boqSubmitted = true;
   if (/(?:boq.{0,50}(provided|prepared|submitted|sent|send|completed)|(?:provided|prepared|submitted|sent|send|completed).{0,50}boq)/i.test(boqText)) group.boqCompleted = true;
}

const opportunities = [...groups.values()].map(group => {
  const digest = crypto.createHash('sha1').update(key(group.clientName)).digest('hex').slice(0, 12);
  const status = group.lastStatus.toLowerCase();
  const outcome = status === 'win' ? 'won' : status === 'lost' || status === 'loss' ? 'lost' : status === 'cancel' ? 'cancelled' : status === 'postponed' ? 'on_hold' : 'open';
  const derivedStage = deriveStage(group);
   const stage = outcome === 'won' ? 'closed_won' : outcome === 'lost' ? 'closed_lost' : outcome === 'cancelled' ? 'cancelled' : outcome === 'on_hold' ? 'on_hold' : derivedStage;
  const salesKams = [...group.salesKams]; const presalesEngineers = [...group.presalesEngineers];
  return { id: `import-opp-${digest}`, code: `IMPORT-${digest.slice(0, 8).toUpperCase()}`, name: `${group.clientName} Presales Activity`, clientName: group.clientName, stage, outcome: { outcome }, lastStatus: group.lastStatus, statusSource: group.statusSource, statusDate: group.statusDate, boq: { approvalStatus: group.boqCompleted ? 'approved' : group.boqSubmitted ? 'pending_sa_lead' : 'draft', sourceSubmitted: group.boqSubmitted, sourceCompleted: group.boqCompleted }, accountExecutive: salesKams[0] || 'Unassigned', leadSolutionArchitect: presalesEngineers[0] || 'Unassigned', salesKams, presalesEngineers, assignmentReviewRequired: !salesKams.length || !presalesEngineers.length, priority: 'p2_medium', primaryTechStack: 'Unassigned', technologies: [...group.scopes], scopes: [...group.scopes], activities: group.activities, sourceFiles: [...group.sources], importReviewRequired: true };
});

const statusCounts = Object.fromEntries([...opportunities.reduce((counts, item) => counts.set(item.lastStatus || 'EMPTY', (counts.get(item.lastStatus || 'EMPTY') || 0) + 1), new Map()).entries()]);
const report = { generatedAt: new Date().toISOString(), inputRows: { dataTxt: legacy.length, data2Txt: primary.length, data3Txt: historical.length }, uniqueClients: opportunities.length, uniqueActivities: opportunities.reduce((sum, item) => sum + item.activities.length, 0), duplicateActivitiesRemoved: duplicateActivities, dataTxtData2RowDifference: legacy.length - primary.length, latestData3StatusCounts: statusCounts, statusUpdatesApplied: opportunities.filter(item => item.statusSource === 'data3.txt').length, boqSubmittedOpportunities: opportunities.filter(item => item.boq?.sourceSubmitted).length, boqCompletedOpportunities: opportunities.filter(item => item.boq?.sourceCompleted).length, missingSalesKam: opportunities.filter(item => item.accountExecutive === 'Unassigned').length, missingPresalesEngineer: opportunities.filter(item => item.leadSolutionArchitect === 'Unassigned').length, notes: ['data2.txt and data.txt status fields were merged by activity identity.', 'BOQ-provided/prepared/submitted phrases are mapped to approved BOQ status.', 'The last data3.txt status per normalized client now controls stage/outcome in the prepared opportunity records.', 'Every opportunity now has accountExecutive and leadSolutionArchitect fields; Unassigned means the source did not provide a person and requires review.', 'data3.txt dates contain month/day labels without an explicit year and require review before final date normalization.', 'All generated opportunities are marked importReviewRequired and are not uploaded by this script.'] };
const opportunityRows = opportunities.map(({ id, code, name, clientName, stage, outcome, lastStatus, statusSource, statusDate, boq, accountExecutive, leadSolutionArchitect, salesKams, presalesEngineers, assignmentReviewRequired, priority, primaryTechStack, technologies, scopes, sourceFiles, importReviewRequired }) => ({ id, code, name, clientName, stage, outcome, lastStatus, statusSource, statusDate, boq, accountExecutive, leadSolutionArchitect, salesKams, presalesEngineers, assignmentReviewRequired, priority, primaryTechStack, technologies, scopes, sourceFiles, importReviewRequired }));
const updateRows = opportunities.flatMap(opportunity => opportunity.activities.map(activity => ({ opportunityId: opportunity.id, type: activity.type, title: activity.title, summary: activity.summary, nextAction: activity.nextAction, source: activity.metadata.source, sourceRow: activity.metadata.sl })));
fs.writeFileSync(outputFile, JSON.stringify({ report, opportunities }, null, 2));
fs.writeFileSync(outputFile.replace(/\.json$/, '.opportunities.json'), JSON.stringify(opportunityRows, null, 2));
fs.writeFileSync(outputFile.replace(/\.json$/, '.updates.json'), JSON.stringify(updateRows, null, 2));
console.log(JSON.stringify(report, null, 2));
