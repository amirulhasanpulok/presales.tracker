import 'dotenv/config';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { hashPassword } from './auth.js';
import { initSchema, query } from './db.js';

const sourceFile = process.env.SALES_KAM_FILE || '/home/pulok/data/sales_KAM.txt';
const names = fs.readFileSync(sourceFile, 'utf8')
  .split(/\r?\n/)
  .map(value => value.replace(/^\uFEFF/, '').replace(/^\s+/, '').trim())
  .filter(value => value && value.toLowerCase() !== 'sales kam');
const formatName = name => name.toLowerCase().split(/\s+/).map((word, index) => {
  if (word === 'md' || word === 'md.') return 'Md.';
  if (word === 's.m.' || word === 'sm') return 'S.M.';
  return word ? word[0].toUpperCase() + word.slice(1) : word;
}).join(' ');
const uniqueNames = [...new Map(names.map(name => [name.toLowerCase().replace(/[^a-z0-9]/g, ''), formatName(name)])).values()];

await initSchema();
const existing = await query('SELECT id, name, email FROM users');
const existingByName = new Map((existing.rows || []).map(user => [user.name.toLowerCase().replace(/[^a-z0-9]/g, ''), user]));
const passwordHash = await hashPassword(process.env.SALES_KAM_TEMP_PASSWORD || 'ChangeMe@2026');
let imported = 0;
let skipped = 0;

for (const name of uniqueNames) {
  const normalized = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (existingByName.has(normalized)) {
    await query('UPDATE users SET name = $2 WHERE id = $1', [existingByName.get(normalized).id, name]);
    skipped += 1;
    continue;
  }
  const email = `${normalized}@link3.net`;
  const id = `usr-kam-${crypto.createHash('sha1').update(normalized).digest('hex').slice(0, 12)}`;
  await query(`INSERT INTO users (id, name, email, password_hash, role, role_id, department, status, region, must_change_password)
    VALUES ($1, $2, $3, $4, 'Sales KAM', 'role-kam', 'Sales', 'Active', 'Bangladesh', true)
    ON CONFLICT (email) DO NOTHING`, [id, name, email, passwordHash]);
  imported += 1;
}

console.log(`Sales KAM import complete: ${imported} added, ${skipped} already present, ${uniqueNames.length} unique source names.`);
