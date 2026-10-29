import { callApi } from '../appwrite-client.js';

/** Read-only summary for the signed-in user's first available clinic. */
export const overviewService = {
  async getSummary() {
    const clinicResult = await callApi('clinic.list');
    const clinics = clinicResult.clinics || [];
    const tenantId = clinics[0]?.$id;
    if (!tenantId) return { clinicName: '', patients: 0, appointments: 0, visits: 0 };

    const [patientsResult, appointmentsResult, visitsResult] = await Promise.all([
      callApi('patient.list', { tenantId }),
      callApi('appointment.list', { tenantId }),
      callApi('encounter.list', { tenantId })
    ]);

    return {
      clinicName: clinics[0]?.name || '',
      patients: (patientsResult.patients || []).length,
      appointments: (appointmentsResult.appointments || []).length,
      visits: (visitsResult.encounters || []).length
    };
  }
};
