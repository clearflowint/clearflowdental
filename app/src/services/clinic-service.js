import { callApi } from '../appwrite-client.js';

/** Tenant-scoped clinic workspace operations. */
export const clinicService = {
  async list() {
    const result = await callApi('clinic.list');
    return result.clinics || [];
  },
  create(input) {
    return callApi('clinic.create', {
      name: String(input.name || '').trim(),
      slug: String(input.slug || '').trim()
    });
  }
};
