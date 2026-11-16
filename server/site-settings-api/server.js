'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { randomBytes, randomUUID } = require('node:crypto');
const { Pool } = require('pg');
const {
  activeAnnouncement,
  generateRecoveryCode,
  hashOpaque,
  hashPassword,
  recoveryCodeHash,
  safeEqualHex,
  validateAnnouncement,
  verifyPassword,
} = require('./core');

const host = String(process.env.HOST || '127.0.0.1');
const port = Number(process.env.PORT || 3002);
const databaseUrl = String(process.env.DATABASE_URL || '').trim();
const bootstrapToken = String(process.env.ADMIN_BOOTSTRAP_TOKEN || '').trim();
const initialSetupToken = String(process.env.INITIAL_SETUP_TOKEN || '').trim();
const publicUrl = String(process.env.PUBLIC_URL || `http://127.0.0.1:${port}`).replace(/\/+$/, '');
const publicOrigins = new Set(
  String(process.env.PUBLIC_ORIGINS || '')
    .split(',')
    .map((value) => value.trim().replace(/\/+$/, ''))
    .filter(Boolean),
);
const secureCookies = process.env.COOKIE_SECURE !== 'false';
const cookieName = secureCookies ? '__Host-epicerie-session' : 'epicerie-session';
const csrfCookieName = secureCookies ? '__Host-epicerie-csrf' : 'epicerie-csrf';
const publicDirectory = path.join(__dirname, 'public');
const sessionDurationMs = 60 * 24 * 60 * 60 * 1000;
const attempts = new Map();

if (!databaseUrl) throw new Error('DATABASE_URL est obligatoire.');
if (!/^[0-9a-f]{64}$/i.test(bootstrapToken)) {
  throw new Error('ADMIN_BOOTSTRAP_TOKEN doit contenir 64 caractères hexadécimaux.');
}
if (!/^[0-9a-f]{64}$/i.test(initialSetupToken)) {
  throw new Error('INITIAL_SETUP_TOKEN doit contenir 64 caractères hexadécimaux.');
}

const pool = new Pool({ connectionString: databaseUrl, max: 5 });

function securityHeaders(contentType) {
  return {
    'content-type': contentType,
    'cache-control': 'no-store',
    'content-security-policy': "default-src 'self'; base-uri 'none'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data:; object-src 'none'; script-src 'self'; style-src 'self'",
    'cross-origin-opener-policy': 'same-origin',
    'referrer-policy': 'no-referrer',
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
  };
}

function sendJson(response, status, body, origin = '', allowCors = false, extraHeaders = {}) {
  const headers = { ...securityHeaders('application/json; charset=utf-8'), ...extraHeaders };
  if (allowCors && publicOrigins.has(origin)) {
    headers['access-control-allow-origin'] = origin;
    headers.vary = 'Origin';
  }
  response.writeHead(status, headers);
  response.end(JSON.stringify(body));
}

function sendFile(response, fileName, contentType) {
  const filePath = path.join(publicDirectory, fileName);
  try {
    const content = fs.readFileSync(filePath);
    response.writeHead(200, securityHeaders(contentType));
    response.end(content);
  } catch {
    sendJson(response, 404, { error: 'Fichier introuvable.' });
  }
}

function redirect(response, location) {
  response.writeHead(302, { ...securityHeaders('text/plain; charset=utf-8'), location });
  response.end('Redirection');
}

function clientAddress(request) {
  return String(request.headers['x-forwarded-for'] || request.socket.remoteAddress || '')
    .split(',')[0]
    .trim()
    .slice(0, 80);
}

function rateLimit(request, category, maximum, durationMs) {
  const key = `${category}:${clientAddress(request) || 'unknown'}`;
  const now = Date.now();
  const recent = (attempts.get(key) || []).filter((timestamp) => now - timestamp < durationMs);
  if (recent.length >= maximum) return false;
  recent.push(now);
  attempts.set(key, recent);
  return true;
}

function clearRateLimit(request, category) {
  attempts.delete(`${category}:${clientAddress(request) || 'unknown'}`);
}

function bearerToken(request) {
  return String(request.headers.authorization || '').replace(/^Bearer\s+/i, '');
}

function parseCookies(request) {
  return String(request.headers.cookie || '')
    .split(';')
    .map((part) => part.trim().split('='))
    .reduce((result, [name, ...value]) => {
      if (name) result[name] = decodeURIComponent(value.join('='));
      return result;
    }, {});
}

function sessionCookies(token, csrfToken) {
  const secure = secureCookies ? '; Secure' : '';
  const maximumAge = Math.floor(sessionDurationMs / 1000);
  return [
    `${cookieName}=${encodeURIComponent(token)}; Max-Age=${maximumAge}; Path=/; HttpOnly; SameSite=Strict${secure}`,
    `${csrfCookieName}=${encodeURIComponent(csrfToken)}; Max-Age=${maximumAge}; Path=/; SameSite=Strict${secure}`,
  ];
}

function expiredSessionCookies() {
  const secure = secureCookies ? '; Secure' : '';
  return [
    `${cookieName}=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict${secure}`,
    `${csrfCookieName}=; Max-Age=0; Path=/; SameSite=Strict${secure}`,
  ];
}

async function jsonBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 32 * 1024) throw new Error('Requête trop volumineuse.');
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  } catch {
    throw new Error('Corps JSON invalide.');
  }
}

async function credentials() {
  const result = await pool.query(
    'SELECT password_salt AS salt, password_hash AS hash, recovery_code_hash AS "recoveryCodeHash" FROM admin_credentials WHERE id = 1',
  );
  return result.rows[0] || null;
}

async function replaceCredentials(password, recoveryCode) {
  const stored = hashPassword(password);
  await pool.query(
    `INSERT INTO admin_credentials (id, password_salt, password_hash, recovery_code_hash, updated_at)
     VALUES (1, $1, $2, $3, now())
     ON CONFLICT (id) DO UPDATE SET
       password_salt = EXCLUDED.password_salt,
       password_hash = EXCLUDED.password_hash,
       recovery_code_hash = EXCLUDED.recovery_code_hash,
       updated_at = now()`,
    [stored.salt, stored.hash, recoveryCodeHash(recoveryCode)],
  );
}

async function createSession(request) {
  await pool.query('DELETE FROM admin_sessions WHERE expires_at <= now()');
  const id = randomUUID();
  const token = randomBytes(32).toString('hex');
  const csrfToken = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + sessionDurationMs);
  await pool.query(
    `INSERT INTO admin_sessions
       (id, token_hash, csrf_hash, user_agent, ip_address, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      id,
      hashOpaque(token),
      hashOpaque(csrfToken),
      String(request.headers['user-agent'] || '').slice(0, 300),
      clientAddress(request),
      expiresAt.toISOString(),
    ],
  );
  return { id, token, csrfToken, expiresAt: expiresAt.toISOString() };
}

async function authenticatedSession(request) {
  const token = parseCookies(request)[cookieName] || '';
  if (!/^[0-9a-f]{64}$/i.test(token)) return null;
  const result = await pool.query(
    `SELECT id, csrf_hash AS "csrfHash", user_agent AS "userAgent",
            ip_address AS "ipAddress", created_at AS "createdAt",
            last_seen_at AS "lastSeenAt", expires_at AS "expiresAt"
     FROM admin_sessions
     WHERE token_hash = $1 AND expires_at > now()`,
    [hashOpaque(token)],
  );
  const session = result.rows[0] || null;
  if (session) {
    pool.query('UPDATE admin_sessions SET last_seen_at = now() WHERE id = $1', [session.id]).catch(() => {});
  }
  return session;
}

function validCsrf(request, session) {
  const token = String(request.headers['x-csrf-token'] || '');
  return /^[0-9a-f]{64}$/i.test(token) && safeEqualHex(hashOpaque(token), session?.csrfHash || '');
}

function sameOrigin(request) {
  const origin = String(request.headers.origin || '');
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(publicUrl).origin;
  } catch {
    return false;
  }
}

async function requireAdministrator(request, response, requireCsrf = false) {
  const session = await authenticatedSession(request);
  if (!session) {
    sendJson(response, 401, { error: 'Connexion administrateur requise.' });
    return null;
  }
  if (requireCsrf && (!sameOrigin(request) || !validCsrf(request, session))) {
    sendJson(response, 403, { error: 'Protection de la requête invalide.' });
    return null;
  }
  return session;
}

async function currentAnnouncement() {
  const result = await pool.query(
    'SELECT payload, updated_at AS "updatedAt" FROM site_announcement WHERE id = 1',
  );
  if (!result.rows[0]) return null;
  return { ...result.rows[0].payload, updatedAt: result.rows[0].updatedAt };
}

async function route(request, response) {
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  const origin = String(request.headers.origin || '').replace(/\/+$/, '');

  if (request.method === 'GET' && url.pathname === '/health') {
    await pool.query('SELECT 1');
    sendJson(response, 200, { ok: true, configured: Boolean(await credentials()) });
    return;
  }
  if (request.method === 'GET' && url.pathname === '/announcement') {
    const announcement = activeAnnouncement(await currentAnnouncement());
    sendJson(response, 200, { announcement }, origin, true);
    return;
  }
  if (request.method === 'GET' && url.pathname === '/admin') {
    redirect(response, '/admin/');
    return;
  }
  if (request.method === 'GET' && url.pathname === '/admin/') {
    sendFile(response, 'admin.html', 'text/html; charset=utf-8');
    return;
  }
  if (request.method === 'GET' && url.pathname === '/admin/admin.css') {
    sendFile(response, 'admin.css', 'text/css; charset=utf-8');
    return;
  }
  if (request.method === 'GET' && url.pathname === '/admin/admin.js') {
    sendFile(response, 'admin.js', 'text/javascript; charset=utf-8');
    return;
  }
  if (request.method === 'POST' && url.pathname === '/admin/bootstrap') {
    if (!safeEqualHex(bearerToken(request), bootstrapToken)) {
      sendJson(response, 401, { error: 'Jeton d’amorçage invalide.' });
      return;
    }
    const input = await jsonBody(request);
    const recoveryCode = generateRecoveryCode();
    await replaceCredentials(input.password, recoveryCode);
    await pool.query('DELETE FROM admin_sessions');
    sendJson(response, 200, { configured: true, recoveryCode });
    return;
  }
  if (request.method === 'POST' && url.pathname === '/admin/setup') {
    if (!rateLimit(request, 'setup', 5, 60 * 60 * 1000)) {
      sendJson(response, 429, { error: 'Trop de tentatives d’installation. Réessayez plus tard.' });
      return;
    }
    if (await credentials()) {
      sendJson(response, 409, { error: 'Le compte administrateur est déjà configuré.' });
      return;
    }
    const input = await jsonBody(request);
    if (!safeEqualHex(String(input.setupCode || ''), initialSetupToken)) {
      sendJson(response, 401, { error: 'Code d’installation invalide.' });
      return;
    }
    const recoveryCode = generateRecoveryCode();
    await replaceCredentials(input.password, recoveryCode);
    const session = await createSession(request);
    clearRateLimit(request, 'setup');
    sendJson(
      response,
      200,
      {
        authenticated: true,
        csrfToken: session.csrfToken,
        expiresAt: session.expiresAt,
        recoveryCode,
      },
      '',
      false,
      { 'set-cookie': sessionCookies(session.token, session.csrfToken) },
    );
    return;
  }
  if (request.method === 'POST' && url.pathname === '/admin/login') {
    if (!rateLimit(request, 'login', 5, 15 * 60 * 1000)) {
      sendJson(response, 429, { error: 'Trop de tentatives. Réessayez dans quinze minutes.' });
      return;
    }
    const input = await jsonBody(request);
    if (!verifyPassword(input.password, await credentials())) {
      sendJson(response, 401, { error: 'Mot de passe incorrect.' });
      return;
    }
    clearRateLimit(request, 'login');
    const session = await createSession(request);
    sendJson(
      response,
      200,
      { authenticated: true, csrfToken: session.csrfToken, expiresAt: session.expiresAt },
      '',
      false,
      { 'set-cookie': sessionCookies(session.token, session.csrfToken) },
    );
    return;
  }
  if (request.method === 'POST' && url.pathname === '/admin/recover') {
    if (!rateLimit(request, 'recover', 5, 60 * 60 * 1000)) {
      sendJson(response, 429, { error: 'Trop de tentatives de récupération. Réessayez plus tard.' });
      return;
    }
    const input = await jsonBody(request);
    const stored = await credentials();
    const suppliedHash = recoveryCodeHash(input.recoveryCode);
    if (!stored || !suppliedHash || !safeEqualHex(suppliedHash, stored.recoveryCodeHash)) {
      sendJson(response, 401, { error: 'Code de récupération invalide.' });
      return;
    }
    const recoveryCode = generateRecoveryCode();
    await replaceCredentials(input.password, recoveryCode);
    await pool.query('DELETE FROM admin_sessions');
    const session = await createSession(request);
    clearRateLimit(request, 'recover');
    sendJson(
      response,
      200,
      { authenticated: true, csrfToken: session.csrfToken, expiresAt: session.expiresAt, recoveryCode },
      '',
      false,
      { 'set-cookie': sessionCookies(session.token, session.csrfToken) },
    );
    return;
  }

  if (request.method === 'GET' && url.pathname === '/admin/state') {
    const session = await requireAdministrator(request, response);
    if (!session) return;
    sendJson(response, 200, { authenticated: true, announcement: await currentAnnouncement() });
    return;
  }
  if (request.method === 'GET' && url.pathname === '/admin/sessions') {
    const session = await requireAdministrator(request, response);
    if (!session) return;
    const result = await pool.query(
      `SELECT id, user_agent AS "userAgent", ip_address AS "ipAddress",
              created_at AS "createdAt", last_seen_at AS "lastSeenAt", expires_at AS "expiresAt"
       FROM admin_sessions WHERE expires_at > now() ORDER BY last_seen_at DESC`,
    );
    sendJson(response, 200, {
      sessions: result.rows.map((item) => ({ ...item, current: item.id === session.id })),
    });
    return;
  }
  if (request.method === 'GET' && url.pathname === '/admin/presets') {
    const session = await requireAdministrator(request, response);
    if (!session) return;
    const result = await pool.query(
      `SELECT id, name, payload, updated_at AS "updatedAt"
       FROM announcement_presets ORDER BY updated_at DESC, name`,
    );
    sendJson(response, 200, { presets: result.rows });
    return;
  }
  if (request.method === 'POST' && url.pathname === '/admin/presets') {
    const session = await requireAdministrator(request, response, true);
    if (!session) return;
    const input = await jsonBody(request);
    const name = String(input.name || '').trim();
    if (!name || name.length > 80) throw new Error('Le nom du modèle est obligatoire et limité à 80 caractères.');
    const payload = validateAnnouncement(input.announcement);
    const result = await pool.query(
      `INSERT INTO announcement_presets (id, name, payload)
       VALUES ($1, $2, $3::jsonb)
       RETURNING id, name, payload, updated_at AS "updatedAt"`,
      [randomUUID(), name, JSON.stringify(payload)],
    );
    sendJson(response, 201, { preset: result.rows[0] });
    return;
  }
  const presetMatch = url.pathname.match(/^\/admin\/presets\/([0-9a-f-]{36})$/i);
  if (request.method === 'DELETE' && presetMatch) {
    const session = await requireAdministrator(request, response, true);
    if (!session) return;
    await pool.query('DELETE FROM announcement_presets WHERE id = $1', [presetMatch[1]]);
    sendJson(response, 200, { deleted: true });
    return;
  }
  if (request.method === 'PUT' && url.pathname === '/admin/announcement') {
    const session = await requireAdministrator(request, response, true);
    if (!session) return;
    const announcement = validateAnnouncement(await jsonBody(request));
    const result = await pool.query(
      `INSERT INTO site_announcement (id, payload, updated_at)
       VALUES (1, $1::jsonb, now())
       ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = now()
       RETURNING payload, updated_at AS "updatedAt"`,
      [JSON.stringify(announcement)],
    );
    sendJson(response, 200, { announcement: { ...result.rows[0].payload, updatedAt: result.rows[0].updatedAt } });
    return;
  }
  if (request.method === 'DELETE' && url.pathname === '/admin/announcement') {
    const session = await requireAdministrator(request, response, true);
    if (!session) return;
    await pool.query('DELETE FROM site_announcement WHERE id = 1');
    sendJson(response, 200, { deleted: true });
    return;
  }
  if (request.method === 'POST' && url.pathname === '/admin/password') {
    const session = await requireAdministrator(request, response, true);
    if (!session) return;
    const input = await jsonBody(request);
    if (!verifyPassword(input.currentPassword, await credentials())) {
      sendJson(response, 401, { error: 'Le mot de passe actuel est incorrect.' });
      return;
    }
    const recoveryCode = generateRecoveryCode();
    await replaceCredentials(input.newPassword, recoveryCode);
    await pool.query('DELETE FROM admin_sessions');
    const replacement = await createSession(request);
    sendJson(
      response,
      200,
      { csrfToken: replacement.csrfToken, expiresAt: replacement.expiresAt, recoveryCode },
      '',
      false,
      { 'set-cookie': sessionCookies(replacement.token, replacement.csrfToken) },
    );
    return;
  }
  if (request.method === 'POST' && url.pathname === '/admin/logout') {
    const session = await requireAdministrator(request, response, true);
    if (!session) return;
    await pool.query('DELETE FROM admin_sessions WHERE id = $1', [session.id]);
    sendJson(response, 200, { disconnected: true }, '', false, { 'set-cookie': expiredSessionCookies() });
    return;
  }
  const sessionMatch = url.pathname.match(/^\/admin\/sessions\/([0-9a-f-]{36})$/i);
  if (request.method === 'DELETE' && sessionMatch) {
    const session = await requireAdministrator(request, response, true);
    if (!session) return;
    const targetId = sessionMatch[1];
    await pool.query('DELETE FROM admin_sessions WHERE id = $1', [targetId]);
    const headers = targetId === session.id ? { 'set-cookie': expiredSessionCookies() } : {};
    sendJson(response, 200, { deleted: true, current: targetId === session.id }, '', false, headers);
    return;
  }

  sendJson(response, 404, { error: 'Route introuvable.' });
}

const server = http.createServer((request, response) => {
  route(request, response).catch((error) => {
    console.error(error);
    const message = String(error?.message || '');
    const clientError = /obligatoire|caractères|invalide|horaire|date|fuseau|mot de passe|JSON|volumineuse/i.test(message);
    sendJson(response, clientError ? 400 : 500, {
      error: clientError ? message : 'Erreur interne du serveur.',
    });
  });
});

async function shutdown() {
  server.close();
  await pool.end();
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
server.listen(port, host, () => console.log(`API horaires Épicerie active sur http://${host}:${port}`));
