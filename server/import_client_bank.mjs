import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { initSchema, query } from './db.js';

const sourceFile = process.env.CLIENT_BANK_FILE || '/home/pulok/data/client_bank.txt';
const sourceName = path.basename(sourceFile);
const categoryFilters = new Set((process.env.CLIENT_CATEGORY || '').split(',').map(value => value.trim().toUpperCase()).filter(Boolean));
const industry = process.env.CLIENT_INDUSTRY || (sourceName.toLowerCase().includes('pharma') ? 'Pharmaceuticals' : 'Banking');
const headOfficeOnly = process.env.CLIENT_HEAD_OFFICE_ONLY !== '0';
const text = fs.readFileSync(sourceFile, 'utf8').replace(/^\uFEFF/, '');
const lines = text.split(/\r?\n/).filter(Boolean);
const headerMarker = 'Subscriber ID\tSLNO\tBranch Code\tSubscriber Name\tBranch Name\tCategory\tGroup\tAddress\tCommisionDate';
const headerIndex = lines.findIndex(line => line === headerMarker);
if (headerIndex < 0) throw new Error(`No supported 9-column header found in ${sourceFile}`);
const headers = lines[headerIndex].split('\t').map(value => value.trim());
const rows = lines.slice(headerIndex + 1).map(line => {
  const values = line.split('\t');
  return Object.fromEntries(headers.map((header, index) => [header, (values[index] || '').trim()]));
});

const isHeadOffice = row => /head\s*office|corporate\s*office|\bho\b/i.test(`${row['Branch Name'] || ''} ${row.Address || ''}`);
const keyFor = name => name.toLowerCase().replace(/[^a-z0-9]/g, '');
const grouped = new Map();
for (const row of rows) {
  if ((categoryFilters.size && !categoryFilters.has((row.Category || '').toUpperCase())) || !row['Subscriber Name'] || (headOfficeOnly && !isHeadOffice(row))) continue;
  const key = keyFor(row['Subscriber Name']);
  if (!grouped.has(key)) grouped.set(key, []);
  grouped.get(key).push(row);
}

await initSchema();
const existingRows = await query('SELECT id, doc FROM clients');
const existingByName = new Map((existingRows.rows || []).map(item => [keyFor(item.doc?.name || ''), item]));
for (const records of grouped.values()) {
  const row = records.find(isHeadOffice) || records[0];
  const normalized = keyFor(row['Subscriber Name']);
  const existing = existingByName.get(normalized)?.doc || {};
  const id = existing.id || `${industry.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-client-${crypto.createHash('sha1').update(normalized).digest('hex').slice(0, 12)}`;
  const previousRecords = Array.isArray(existing.bankRecords) ? existing.bankRecords : [];
  const mergedRecords = [...previousRecords, ...records].filter((record, index, all) => index === all.findIndex(candidate => candidate['Subscriber ID'] === record['Subscriber ID'] && candidate['Branch Code'] === record['Branch Code'] && candidate['CommisionDate'] === record['CommisionDate']));
  const doc = {
    ...existing,
    id,
    code: existing.code || `${industry.slice(0, 6).toUpperCase()}-${crypto.createHash('sha1').update(normalized).digest('hex').slice(0, 12).toUpperCase()}`,
    name: existing.name || row['Subscriber Name'],
    industry: existing.industry || row.Category || industry,
    tier: existing.tier || 'Enterprise Tier 2',
    headquarters: existing.headquarters || row.Address,
    primaryTechStack: existing.primaryTechStack || 'Hybrid / On-Prem',
    assignedSalesKAM: existing.assignedSalesKAM || '',
    assignedLeadSA: existing.assignedLeadSA || '',
    totalContractedTCV: existing.totalContractedTCV || 0,
    activeOpportunitiesCount: existing.activeOpportunitiesCount || 0,
    createdDate: existing.createdDate || new Date().toISOString().slice(0, 10),
    lastUpdated: new Date().toISOString(),
    source: existing.source ? `${existing.source},${sourceName}` : sourceName,
    bankRecords: mergedRecords,
    keyStakeholders: existing.keyStakeholders || [],
    notes: existing.notes || 'Imported from client source data.',
  };
  await query(`INSERT INTO clients (id, doc, created_at, updated_at) VALUES ($1, $2, now(), now()) ON CONFLICT (id) DO UPDATE SET doc = $2, updated_at = now()`, [id, JSON.stringify(doc)]);
}
console.log(`Imported ${grouped.size} unique clients from ${sourceFile}${headOfficeOnly ? ' (head office records only)' : ''}.`);
process.exit(0);
