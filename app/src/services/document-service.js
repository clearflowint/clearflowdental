import { callApi, uploadSourceDocument } from '../appwrite-client.js';

/** Existing source-document operations, scoped by the clinic tenant. */
export const documentService = {
  async list(tenantId) {
    const result = await callApi('document.list', { tenantId });
    return result.documents || [];
  },
  uploadFile(file) {
    return uploadSourceDocument(file);
  },
  create(tenantId, input) {
    return callApi('document.create', { tenantId, ...input });
  }
};
