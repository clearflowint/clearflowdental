import { callApi } from '../appwrite-client.js';

/** AI settings and provider credentials are handled by the authenticated backend. */
export const aiService = {
  async listProviders(tenantId) {
    const result = await callApi('ai.providers.list', { tenantId });
    return result.providers || [];
  },
  async listModels({ tenantId, providerId, apiKey = '' }) {
    const result = await callApi('ai.models.list', { tenantId, providerId, apiKey });
    return result;
  },
  async getSettings(tenantId) {
    return callApi('ai.settings.get', { tenantId });
  },
  saveCredential({ tenantId, providerId, apiKey }) {
    return callApi('ai.credentials.save', { tenantId, providerId, apiKey });
  },
  updateSettings({ tenantId, defaultProviderId, defaultModelId, monthlyBudgetMinor, memoryEnabled }) {
    return callApi('ai.settings.update', {
      tenantId, defaultProviderId, defaultModelId, monthlyBudgetMinor, memoryEnabled
    });
  },
  chat({ tenantId, conversationId, message, providerId, modelId }) {
    return callApi('ai.chat', { tenantId, conversationId, message, providerId, modelId });
  }
};
