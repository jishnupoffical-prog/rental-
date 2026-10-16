import { createHmac, timingSafeEqual } from 'node:crypto';

export const adminCookieName = 'nexus-gear-admin';
const sessionLifetimeSeconds = 12 * 60 * 60;
const adminPassword = "NexusGear123";

function sign(value) {
  return createHmac('sha256', adminPassword)
    .update(value)
    .digest('base64url');
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function passwordMatches(password) {
  const configuredPassword = adminPassword;
  if (!configuredPassword || typeof password !== 'string') return false;
  return safeEqual(password, configuredPassword);
}

export function createAdminSession() {
  const payload = Buffer.from(JSON.stringify({ expiresAt: Date.now() + sessionLifetimeSeconds * 1000 }))
    .toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function isAdminSessionValid(request) {
  const session = request.cookies.get(adminCookieName)?.value;
  if (!session || !adminPassword) return false;
  const [payload, signature, extra] = session.split('.');
  if (!payload || !signature || extra) return false;
  if (!safeEqual(signature, sign(payload))) return false;

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return Number.isFinite(decoded.expiresAt) && decoded.expiresAt > Date.now();
  } catch {
    return false;
  }
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: sessionLifetimeSeconds,
  };
}
