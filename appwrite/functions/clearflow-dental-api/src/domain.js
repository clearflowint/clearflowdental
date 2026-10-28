export const SOURCE_CATEGORIES = Object.freeze(['handwritten_prescription', 'report', 'image', 'referral', 'patient_supplied_history', 'other']);
export const TREATMENT_STATUSES = Object.freeze(['discussed', 'planned', 'performed', 'not_performed']);
export const APPOINTMENT_STATUSES = Object.freeze(['scheduled', 'confirmed', 'arrived', 'cancelled', 'completed', 'no_show']);

export function normalizeSlug(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
}
export function parseDateRange(startValue, endValue) {
  const start = new Date(startValue);
  const end = new Date(endValue);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) return null;
  return { startsAt: start.toISOString(), endsAt: end.toISOString() };
}
export function isSourceCategory(value) {
  return SOURCE_CATEGORIES.includes(String(value || ''));
}
export function isTreatmentStatus(value) {
  return TREATMENT_STATUSES.includes(String(value || ''));
}
export function isAppointmentStatus(value) {
  return APPOINTMENT_STATUSES.includes(String(value || ''));
}
