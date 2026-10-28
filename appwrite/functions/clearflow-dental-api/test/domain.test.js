import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSlug, parseDateRange, isSourceCategory, isTreatmentStatus, isAppointmentStatus } from '../src/domain.js';

test('normalizes a clinic slug deterministically', () => {
  assert.equal(normalizeSlug('  ClearFlow Dental!!  '), 'clearflow-dental');
  assert.equal(normalizeSlug('---'), '');
});
test('accepts a valid appointment range and normalizes timestamps', () => {
  const range = parseDateRange('2026-10-28T10:00:00+05:30', '2026-10-28T10:30:00+05:30');
  assert.equal(range.startsAt, '2026-10-28T04:30:00.000Z');
  assert.equal(range.endsAt, '2026-10-28T05:00:00.000Z');
});
test('rejects invalid and reversed appointment ranges', () => {
  assert.equal(parseDateRange('not-a-date', '2026-10-28T10:30:00Z'), null);
  assert.equal(parseDateRange('2026-10-28T11:00:00Z', '2026-10-28T10:00:00Z'), null);
});
test('keeps source categories and treatment states constrained', () => {
  assert.equal(isSourceCategory('handwritten_prescription'), true);
  assert.equal(isSourceCategory('clinical_approval'), false);
  assert.equal(isTreatmentStatus('performed'), true);
  assert.equal(isTreatmentStatus('done'), false);
});
test('accepts only known appointment statuses', () => {
  assert.equal(isAppointmentStatus('no_show'), true);
  assert.equal(isAppointmentStatus('approved'), false);
});
