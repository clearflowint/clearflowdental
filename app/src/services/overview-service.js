import { clinicService } from './clinic-service.js';
import { patientService, appointmentService, visitService } from './clinical-service.js';

/** Read-only summary assembled from the same services used by clinical screens. */
export const overviewService = {
  async getSummary() {
    const clinics = await clinicService.list();
    const clinic = clinics[0];
    const tenantId = clinic?.$id;
    if (!tenantId) return { clinicName: '', patients: 0, appointments: 0, visits: 0 };

    const [patients, appointments, visits] = await Promise.all([
      patientService.list(tenantId),
      appointmentService.list(tenantId),
      visitService.list(tenantId)
    ]);

    return {
      clinicName: clinic.name || '',
      patients: patients.length,
      appointments: appointments.length,
      visits: visits.length
    };
  }
};
