import 'dotenv/config';
import { query } from './db.js';
import { hashPassword } from './auth.js';

const email = 'amirul.pulok@link3.net';
const hh = await hashPassword('AP667545@$');
await query(
  'UPDATE users SET password_hash = $1, must_change_password = true, login_attempts = 0 WHERE lower(email) = lower($2)',
  [hh, email],
);
const r = await query('SELECT email, must_change_password FROM users WHERE lower(email)=lower($1)', [email]);
console.log('RESET:', JSON.stringify(r.rows[0]));
process.exit(0);
