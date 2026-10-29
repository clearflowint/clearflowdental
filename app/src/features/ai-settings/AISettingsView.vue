<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { aiService } from '../../services/ai-service.js';

const props = defineProps({ tenantId: { type: String, required: true } });
const providers = ref([]);
const settings = ref({});
const credentials = ref([]);
const providerId = ref('');
const modelId = ref('');
const apiKey = ref('');
const monthlyBudget = ref('');
const credentialStatus = ref('Loading provider connection…');
const status = ref('');
const loading = ref(false);
const saving = ref(false);

const selectedProvider = computed(() => providers.value.find(provider => provider.id === providerId.value));
const availableModels = computed(() => selectedProvider.value?.models || []);

async function loadSettings() {
  if (!props.tenantId) return;
  loading.value = true;
  status.value = '';
  try {
    const [providerList, result] = await Promise.all([
      aiService.listProviders(props.tenantId),
      aiService.getSettings(props.tenantId)
    ]);
    providers.value = providerList || [];
    settings.value = result.settings || {};
    credentials.value = result.providers || [];
    providerId.value = settings.value.defaultProviderId || providers.value[0]?.id || '';
    modelId.value = settings.value.defaultModelId || selectedProvider.value?.models?.[0] || '';
    monthlyBudget.value = Number.isFinite(settings.value.monthlyBudgetMinor)
      ? String(settings.value.monthlyBudgetMinor / 100)
      : '';
    const credential = (result.providers || []).find(item =>
      item.providerId === providerId.value && item.status === 'connected'
    );
    credentialStatus.value = credential
      ? 'Connected key ending ' + (credential.maskedSuffix || '••••')
      : 'No provider key connected for the selected provider.';
  } catch (cause) {
    status.value = cause?.message || 'Could not load AI settings.';
    credentialStatus.value = status.value;
  } finally {
    loading.value = false;
  }
}

watch(providerId, nextProviderId => {
  const models = providers.value.find(provider => provider.id === nextProviderId)?.models || [];
  if (!models.includes(modelId.value)) modelId.value = models[0] || '';
  const credential = credentials.value.find(item =>
    item.providerId === nextProviderId && item.status === 'connected'
  );
  credentialStatus.value = credential
    ? 'Connected key ending ' + (credential.maskedSuffix || '••••')
    : 'No provider key connected for the selected provider.';
});

function clearKey() {
  apiKey.value = '';
  status.value = 'Key field cleared. Nothing was stored.';
}

async function saveSettings() {
  if (saving.value || !props.tenantId || !providerId.value) return;
  saving.value = true;
  status.value = 'Saving securely…';
  try {
    if (apiKey.value.trim()) {
      await aiService.saveCredential({
        tenantId: props.tenantId,
        providerId: providerId.value,
        apiKey: apiKey.value.trim()
      });
      apiKey.value = '';
    }
    const budget = Number(monthlyBudget.value || 0);
    await aiService.updateSettings({
      tenantId: props.tenantId,
      defaultProviderId: providerId.value,
      defaultModelId: modelId.value,
      monthlyBudgetMinor: Math.round(Math.max(0, budget) * 100)
    });
    status.value = 'Settings saved.';
    await loadSettings();
  } catch (cause) {
    status.value = cause?.message || 'Could not save AI settings.';
  } finally {
    saving.value = false;
  }
}

onMounted(loadSettings);
</script>

<template>
  <div class="settings-page">
    <div class="settings-intro">
      <p class="eyebrow">WORKSPACE CONFIGURATION</p>
      <h2>AI settings</h2>
      <p>Manage provider credentials and model preferences for this clinic. Keys are sent only to the authenticated backend for server-side encryption.</p>
    </div>
    <section class="settings-card">
      <h3>Provider and model</h3>
      <p>Choose the AI service and model for this clinic workspace.</p>
      <div class="form-row">
        <div class="field"><label for="provider">AI provider</label><select id="provider" v-model="providerId" :disabled="loading || saving"><option v-for="provider in providers" :key="provider.id" :value="provider.id">{{ provider.name }}</option></select></div>
        <div class="field"><label for="model">Default model</label><select id="model" v-model="modelId" :disabled="loading || saving || !availableModels.length"><option v-for="model in availableModels" :key="model" :value="model">{{ model }}</option></select></div>
      </div>
    </section>
    <section class="settings-card">
      <h3>Provider API key</h3>
      <p>Credentials should be encrypted server-side and scoped to the current clinic tenant. They must never be saved in browser storage or committed to GitHub.</p>
      <div class="field">
        <label for="provider-key">API key</label>
        <div class="provider-key-row"><input id="provider-key" v-model="apiKey" type="password" autocomplete="new-password" placeholder="Paste provider API key" spellcheck="false" :disabled="saving"><button class="secondary-button" id="clear-key" type="button" :disabled="saving" @click="clearKey">Clear field</button></div>
        <small>The key is never written to browser storage. The backend stores an encrypted credential and returns only a masked status.</small>
        <p id="credential-status" role="status">{{ credentialStatus }}</p>
      </div>
      <div class="settings-notice">🔒 &nbsp; Tenant-scoped encrypted storage · Masked status only · Provider calls stay server-side.</div>
    </section>
    <section class="settings-card">
      <h3>Usage and safety</h3>
      <p>Controls intended to be managed separately from conversations.</p>
      <div class="form-row">
        <div class="field"><label for="monthly-budget">Monthly AI budget (INR)</label><input id="monthly-budget" v-model="monthlyBudget" type="number" min="0" :disabled="saving"></div>
        <div class="field"><label for="clinical-mode">Clinical data handling</label><select id="clinical-mode"><option value="review">Require user review for all drafts</option><option value="admin">General administrative assistance only</option></select></div>
      </div>
      <div class="settings-actions"><button class="primary-button" id="save-ai-settings" type="button" :disabled="saving || loading" @click="saveSettings">{{ saving ? 'Saving…' : 'Save settings' }}</button><span id="settings-status" class="save-status" role="status">{{ status }}</span></div>
    </section>
  </div>
</template>
