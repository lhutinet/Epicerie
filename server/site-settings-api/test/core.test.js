'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  activeAnnouncement,
  generateRecoveryCode,
  hashPassword,
  recoveryCodeHash,
  validateAnnouncement,
  verifyPassword,
} = require('../core');

test('le mot de passe est vérifié avec scrypt et un sel', () => {
  const stored = hashPassword('une phrase secrète suffisamment longue');
  assert.equal(verifyPassword('une phrase secrète suffisamment longue', stored), true);
  assert.equal(verifyPassword('mauvais mot de passe', stored), false);
  assert.notEqual(stored.hash, 'une phrase secrète suffisamment longue');
});

test('le code de récupération possède 128 bits et se normalise', () => {
  const code = generateRecoveryCode();
  assert.match(code, /^(?:[0-9A-F]{4}-){7}[0-9A-F]{4}$/);
  assert.equal(recoveryCodeHash(code), recoveryCodeHash(code.toLowerCase().replaceAll('-', ' ')));
});

test('une annonce valide conserve au plus deux créneaux', () => {
  const announcement = validateAnnouncement({
    enabled: true,
    type: 'special_hours',
    title: 'Horaires exceptionnels',
    message: 'Ouverture le matin',
    startAt: '2026-12-24T00:00:00+01:00',
    endAt: '2026-12-25T00:00:00+01:00',
    slots: [
      { from: '08:30', to: '12:30' },
      { from: '15:30', to: '17:30', enabled: false },
      { from: '18:00', to: '19:00' },
    ],
  });
  assert.equal(announcement.slots.length, 2);
  assert.equal(announcement.slots[0].enabled, true);
  assert.equal(announcement.slots[1].enabled, false);
  assert.equal(activeAnnouncement(announcement, new Date('2026-12-24T10:00:00+01:00')).title, 'Horaires exceptionnels');
  assert.equal(activeAnnouncement(announcement, new Date('2026-12-26T10:00:00+01:00')), null);
});

test('les dates sans fuseau et les créneaux inversés sont refusés', () => {
  assert.throws(
    () => validateAnnouncement({ enabled: true, title: 'Test', startAt: '2026-12-24T10:00' }),
    /fuseau horaire/,
  );
  assert.throws(
    () => validateAnnouncement({ enabled: true, title: 'Test', slots: [{ from: '18:00', to: '08:00' }] }),
    /créneau horaire/,
  );
});
