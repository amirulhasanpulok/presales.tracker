import fs from 'node:fs';
import crypto from 'node:crypto';

const dataFile = process.env.ACTIVITY_DATA_FILE || '/home/pulok/data/data.txt';
const data2File = process.env.ACTIVITY_DATA2_FILE || '/home/pulok/data/data2.txt';
const data3File = process.env.DATA3_FILE || '/home/pulok/data/data3.txt';
const outputFile = process.env.IMPORT_OUTPUT || '/home/pulok/data/normalized_opportunity_import.json';

const clean = value => String(value ?? '').replace(/^"|"$/g, '').replace(/\s+/g, ' ').trim();
const key = value => clean(value).toLowerCase().replace(/^(mr|ms|md|mrs)\.?\s+/i, '').replace(/[^a-z0-9]/g, '');

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
const historical = data3Rows(data3File);
const records = [...primary, ...historical];
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
  if (!groups.has(clientKey)) groups.set(clientKey, { clientName: record.clientName, activities: [], sources: new Set(), scopes: new Set() });
  const group = groups.get(clientKey);
  group.activities.push(activity); group.sources.add(record.source); if (record.scope) group.scopes.add(record.scope);
}

const opportunities = [...groups.values()].map(group => {
  const digest = crypto.createHash('sha1').update(key(group.clientName)).digest('hex').slice(0, 12);
  return { id: `import-opp-${digest}`, code: `IMPORT-${digest.slice(0, 8).toUpperCase()}`, name: `${group.clientName} Presales Activity`, clientName: group.clientName, stage: 'qualification', priority: 'p2_medium', primaryTechStack: 'Unassigned', technologies: [...group.scopes], scopes: [...group.scopes], activities: group.activities, sourceFiles: [...group.sources], importReviewRequired: true };
});

const report = { generatedAt: new Date().toISOString(), inputRows: { dataTxt: legacy.length, data2Txt: primary.length, data3Txt: historical.length }, uniqueClients: opportunities.length, uniqueActivities: opportunities.reduce((sum, item) => sum + item.activities.length, 0), duplicateActivitiesRemoved: duplicateActivities, dataTxtData2RowDifference: legacy.length - primary.length, notes: ['data2.txt was selected as the canonical version of the overlapping data.txt export.', 'data3.txt dates contain month/day labels without a year and require review before final date normalization.', 'All generated opportunities are marked importReviewRequired and are not uploaded by this script.'] };
const opportunityRows = opportunities.map(({ id, code, name, clientName, stage, priority, primaryTechStack, technologies, scopes, sourceFiles, importReviewRequired }) => ({ id, code, name, clientName, stage, priority, primaryTechStack, technologies, scopes, sourceFiles, importReviewRequired }));
const updateRows = opportunities.flatMap(opportunity => opportunity.activities.map(activity => ({ opportunityId: opportunity.id, type: activity.type, title: activity.title, summary: activity.summary, nextAction: activity.nextAction, source: activity.metadata.source, sourceRow: activity.metadata.sl })));
fs.writeFileSync(outputFile, JSON.stringify({ report, opportunities }, null, 2));
fs.writeFileSync(outputFile.replace(/\.json$/, '.opportunities.json'), JSON.stringify(opportunityRows, null, 2));
fs.writeFileSync(outputFile.replace(/\.json$/, '.updates.json'), JSON.stringify(updateRows, null, 2));
console.log(JSON.stringify(report, null, 2));
