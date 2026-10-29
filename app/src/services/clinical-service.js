import { callApi } from '../appwrite-client.js';

export const patientService = {
  async list(tenantId) {
    const result = await callApi('patient.list', { tenantId });
    return result.patients || [];
  },
  async create(tenantId, input) {
    const result = await callApi('patient.create', { tenantId, ...input });
    return result.patient;
  },
  async update(tenantId, patientId, input) {
    const result = await callApi('patient.update', { tenantId, patientId, ...input });
    return result.patient;
  }
};

export const appointmentService = {
  async list(tenantId) {
    const result = await callApi('appointment.list', { tenantId });
    return result.appointments || [];
  },
  async create(tenantId, input) {
    const result = await callApi('appointment.create', { tenantId, ...input });
    return result.appointment;
  },
  async update(tenantId, appointmentId, input) {
    const result = await callApi('appointment.update', { tenantId, appointmentId, ...input });
    return result.appointment;
  }
};

export const visitService = {
  async list(tenantId) {
    const result = await callApi('encounter.list', { tenantId });
    return result.encounters || [];
  },
  async create(tenantId, input) {
    const result = await callApi('encounter.create', { tenantId, ...input });
    return result.encounter;
  },
  async complete(tenantId, encounterId) {
    const result = await callApi('encounter.complete', { tenantId, encounterId });
    return result.encounter;
  }
};
