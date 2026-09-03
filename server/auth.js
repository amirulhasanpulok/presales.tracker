import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from './db.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'dev-insecure-secret-change-me';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '12h';
const BCRYPT_ROUNDS = 10;

export async function hashPassword(plain) {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, roleId: user.role_id || user.roleId },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

// Enforce sane minimum password policy for a corporate production system.
export function validatePassword(plain) {
  const reasons = [];
  if (typeof plain !== 'string' || plain.length < 10) reasons.push('at least 10 characters');
  if (!/[A-Za-z]/.test(plain)) reasons.push('at least one letter');
  if (!/\d/.test(plain)) reasons.push('at least one number');
  return reasons;
}

// Load the full user + role for a token principal.
export async function loadPrincipal(userId) {
  const { rows } = await query(
    `SELECT u.id, u.name, u.email, u.role, u.role_id, u.department, u.status,
            u.mfa_enabled, u.avatar, u.region, u.last_login_at, u.must_change_password,
            r.role_name, r.description, r.permissions, r.is_system_role, r.users_count
       FROM users u
       LEFT JOIN roles r ON r.id = u.role_id
      WHERE u.id = $1 AND u.status != 'Inactive'`,
    [userId],
  );
  const row = rows[0];
  if (!row) return null;
  return {
    user: {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      roleId: row.role_id,
      department: row.department,
      status: row.status,
      mfaEnabled: row.mfa_enabled,
      avatar: row.avatar,
      region: row.region,
      lastLoginAt: row.last_login_at,
      mustChangePassword: row.must_change_password,
    },
    role: {
      id: row.role_id,
      roleName: row.role_name,
      description: row.description,
      permissions: row.permissions || [],
      isSystemRole: row.is_system_role,
      usersCount: row.users_count,
    },
  };
}

// Express auth middleware: attaches req.user / req.role or rejects with 401.
export async function authenticate(req, res, next) {
  if (req.path.startsWith('/health')) return next();
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'unauthorized', reason: 'invalid_token' });
  }
  const principal = await loadPrincipal(payload.sub);
  if (!principal) {
    return res.status(401).json({ error: 'unauthorized', reason: 'unknown_user' });
  }
  req.user = principal.user;
  req.role = principal.role;
  next();
}