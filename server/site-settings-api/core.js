'use strict';

const {
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} = require('node:crypto');

const SCRYPT_OPTIONS = Object.freeze({
  N: 2 ** 17,
  r: 8,
  p: 1,
  maxmem: 256 * 1024 * 1024,
});

function hashOpaque(value) {
  return createHash('sha256').update(String(value), 'utf8').digest('hex');
}

function safeEqualHex(left, right) {
  if (!/^[0-9a-f]+$/i.test(String(left)) || !/^[0-9a-f]+$/i.test(String(right))) return false;
  const leftBuffer = Buffer.from(String(left), 'hex');
  const rightBuffer = Buffer.from(String(right), 'hex');
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function validatePassword(password) {
  const value = String(password || '');
  if (value.length < 12 || value.length > 200) {
    throw new Error('Le mot de passe doit contenir entre 12 et 200 caractères.');
  }
  return value;
}

function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const value = validatePassword(password);
  const hash = scryptSync(value, salt, 32, SCRYPT_OPTIONS).toString('hex');
  return { salt, hash };
}

function verifyPassword(password, stored) {
  if (!stored || !/^[0-9a-f]{32}$/i.test(String(stored.salt)) || !/^[0-9a-f]{64}$/i.test(String(stored.hash))) {
    return false;
  }
  try {
    const calculated = hashPassword(password, stored.salt).hash;
    return safeEqualHex(calculated, stored.hash);
  } catch {
    return false;
  }
}

function generateRecoveryCode() {
  return randomBytes(16)
    .toString('hex')
    .toUpperCase()
    .match(/.{1,4}/g)
    .join('-');
}

function normalizeRecoveryCode(value) {
  return String(value || '').toUpperCase().replace(/[^0-9A-F]/g, '');
}

function recoveryCodeHash(value) {
  const normalized = normalizeRecoveryCode(value);
  return normalized.length === 32 ? hashOpaque(normalized) : '';
}

function cleanText(value, maximum, label, required = false) {
  const cleaned = String(value || '').trim();
  if (required && !cleaned) throw new Error(`${label} est obligatoire.`);
  if (cleaned.length > maximum) throw new Error(`${label} ne peut pas dépasser ${maximum} caractères.`);
  return cleaned;
}

function parseIsoDate(value, label) {
  const source = String(value || '').trim();
  if (!source) return null;
  if (!/(?:Z|[+-]\d{2}:\d{2})$/i.test(source)) {
    throw new Error(`${label} doit inclure un fuseau horaire.`);
  }
  const date = new Date(source);
  if (Number.isNaN(date.getTime())) throw new Error(`${label} est invalide.`);
  return date.toISOString();
}

function validateSlot(slot) {
  const from = String(slot?.from || '').trim();
  const to = String(slot?.to || '').trim();
  if (!from && !to) return null;
  if (!/^\d{2}:\d{2}$/.test(from) || !/^\d{2}:\d{2}$/.test(to)) {
    throw new Error('Les horaires doivent utiliser le format HH:MM.');
  }
  const minutes = (value) => Number(value.slice(0, 2)) * 60 + Number(value.slice(3));
  const fromMinutes = minutes(from);
  const toMinutes = minutes(to);
  if (fromMinutes >= 24 * 60 || toMinutes >= 24 * 60 || fromMinutes >= toMinutes) {
    throw new Error('Un créneau horaire est invalide.');
  }
  return { from, to, enabled: slot?.enabled !== false };
}

function validateAnnouncement(input) {
  const allowedTypes = new Set(['information', 'holiday', 'closed', 'special_hours']);
  const type = String(input?.type || 'information');
  if (!allowedTypes.has(type)) throw new Error("Le type d'annonce est invalide.");
  const startAt = parseIsoDate(input?.startAt, 'La date de début');
  const endAt = parseIsoDate(input?.endAt, 'La date de fin');
  if (startAt && endAt && new Date(startAt) >= new Date(endAt)) {
    throw new Error('La date de fin doit être postérieure à la date de début.');
  }
  const slots = (Array.isArray(input?.slots) ? input.slots : [])
    .slice(0, 2)
    .map(validateSlot)
    .filter(Boolean);
  return {
    enabled: Boolean(input?.enabled),
    type,
    title: cleanText(input?.title, 80, 'Le titre', true),
    message: cleanText(input?.message, 160, 'Le message'),
    startAt,
    endAt,
    closed: type === 'closed' || Boolean(input?.closed),
    slots,
  };
}

function activeAnnouncement(announcement, now = new Date()) {
  if (!announcement?.enabled) return null;
  const timestamp = now.getTime();
  if (announcement.startAt && timestamp < new Date(announcement.startAt).getTime()) return null;
  if (announcement.endAt && timestamp > new Date(announcement.endAt).getTime()) return null;
  return announcement;
}

module.exports = {
  SCRYPT_OPTIONS,
  activeAnnouncement,
  generateRecoveryCode,
  hashOpaque,
  hashPassword,
  normalizeRecoveryCode,
  recoveryCodeHash,
  safeEqualHex,
  validateAnnouncement,
  validatePassword,
  verifyPassword,
};
