<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { aiService } from '../../services/index.js';

const props = defineProps({ tenantId: { type: String, required: true } });
const providers = ref([]);
const settings = ref({});
const credentials = ref([]);
const models = ref([]);
const providerId = ref('');
const modelId = ref('');
const apiKey = ref('');
const monthlyBudget = ref('');
const memoryEnabled = ref(false);
const credentialStatus = ref('Loading provider connection…');
const modelStatus = ref('Choose a provider to discover available models.');
const status = ref('');
const loading = ref(false);
const modelsLoading = ref(false);
const saving = ref(false);

const selectedProvider = computed(() => providers.value.find(provider => provider.id === providerId.value));
const availableModels = computed(() => models.value);

function updateCredentialStatus(nextProviderId = providerId.value) {
  const credential = credentials.value.find(item =>
    item.providerId === nextProviderId && item.status === 'connected'
  );
  credentialStatus.value = credential
    ? 'Connected key ending ' + (credential.maskedSuffix || '••••')
    : 'No saved key for this provider. Enter a key to discover models.';
}

async function loadModels(useEnteredKey = false) {
  if (!props.tenantId || !providerId.value || modelsLoading.value) return;
  modelsLoading.value = true;
  modelStatus.value = 'Loading models from provider…';
  try {
    const result = await aiService.listModels({
      tenantId: props.tenantId,
      providerId: providerId.value,
      apiKey: useEnteredKey ? apiKey.value.trim() : ''
    });
    models.value = result.models || [];
    if (!models.value.some(model => model.id === modelId.value)) {
      modelId.value = models.value[0]?.id || '';
    }
    modelStatus.value = models.value.length
      ? `Loaded ${models.value.length} models directly from ${selectedProvider.value?.name || 'provider'}.`
      : 'No models returned. Connect a provider key to continue.';
    if (result.status === 'provider_not_connected') {
      modelStatus.value = 'Enter this provider’s API key, then select Discover models.';
    }
  } catch (cause) {
    models.value = [];
    modelId.value = '';
    modelStatus.value = cause?.message || 'Could not load provider models.';
  } finally {
    modelsLoading.value = false;
  }
}

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
    modelId.value = settings.value.defaultModelId || '';
    monthlyBudget.value = Number.isFinite(settings.value.monthlyBudgetMinor)
      ? String(settings.value.monthlyBudgetMinor / 100)
      : '';
    memoryEnabled.value = settings.value.memoryEnabled === true;
    updateCredentialStatus();
    await loadModels();
  } catch (cause) {
    status.value = cause?.message || 'Could not load AI settings.';
    credentialStatus.value = status.value;
  } finally {
    loading.value = false;
  }
}

watch(providerId, (nextProviderId, previousProviderId) => {
  if (previousProviderId && previousProviderId !== nextProviderId) {
    apiKey.value = '';
    models.value = [];
    modelId.value = '';
  }
  updateCredentialStatus(nextProviderId);
  if (!loading.value && nextProviderId) void loadModels();
}, { flush: 'sync' });

function clearKey() {
  apiKey.value = '';
  status.value = 'Key field cleared. Nothing was stored.';
}

async function saveSettings() {
  if (saving.value || loading.value || !props.tenantId || !providerId.value || !modelId.value) {
    status.value = 'Choose a provider and discover a model before saving.';
    return;
  }
  saving.value = true;
  status.value = 'Saving settings…';
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
      monthlyBudgetMinor: Math.round(Math.max(0, budget) * 100),
      memoryEnabled: memoryEnabled.value
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
      <p>Choose an AI provider and load its current model catalogue using the clinic’s API key.</p>
    </div>
    <section class="settings-card">
      <h3>Provider and model</h3>
      <p>Model IDs are fetched from the provider. CFC does not maintain a hardcoded model list.</p>
      <div class="form-row">
        <div class="field">
          <label for="provider">AI provider</label>
          <div class="provider-select-row">
            <span class="provider-mark" aria-hidden="true">{{ selectedProvider?.name?.slice(0, 1) || 'AI' }}</span>
            <select id="provider" v-model="providerId" :disabled="loading || saving">
              <option v-for="provider in providers" :key="provider.id" :value="provider.id">{{ provider.name }}</option>
            </select>
          </div>
        </div>
        <div class="field">
          <label for="model">Default model</label>
          <select id="model" v-model="modelId" :disabled="loading || saving || modelsLoading || !availableModels.length">
            <option v-for="model in availableModels" :key="model.id" :value="model.id">{{ model.name }}</option>
          </select>
        </div>
      </div>
      <div class="settings-actions">
        <button class="secondary-button" type="button" :disabled="loading || saving || modelsLoading || !providerId" @click="loadModels(true)">
          {{ modelsLoading ? 'Discovering…' : 'Discover models' }}
        </button>
        <span class="save-status" role="status">{{ modelStatus }}</span>
      </div>
    </section>
    <section class="settings-card">
      <h3>Provider API key</h3>
      <p>Enter the key issued by the selected provider. A key entered for discovery is used for that request only; Save settings stores it for later use.</p>
      <div class="field">
        <label for="provider-key">API key</label>
        <div class="provider-key-row">
          <input id="provider-key" v-model="apiKey" type="password" autocomplete="new-password" placeholder="Paste provider API key" spellcheck="false" :disabled="saving">
          <button class="secondary-button" id="clear-key" type="button" :disabled="saving" @click="clearKey">Clear field</button>
        </div>
        <small>The saved key is encrypted by the backend. The browser receives only connection status.</small>
        <p id="credential-status" role="status">{{ credentialStatus }}</p>
      </div>
    </section>
    <section class="settings-card">
      <h3>Usage preferences</h3>
      <div class="form-row">
        <div class="field"><label for="monthly-budget">Monthly AI budget (INR)</label><input id="monthly-budget" v-model="monthlyBudget" type="number" min="0" :disabled="saving"></div>
        <div class="field"><label for="memory-enabled">Assistant memory</label><label class="checkbox-line"><input id="memory-enabled" v-model="memoryEnabled" type="checkbox" :disabled="saving"> Enable assistant memory (preference only)</label></div>
      </div>
      <div class="settings-actions">
        <button class="primary-button" id="save-ai-settings" type="button" :disabled="saving || loading || !providerId || !modelId" @click="saveSettings">{{ saving ? 'Saving…' : 'Save settings' }}</button>
        <span id="settings-status" class="save-status" role="status">{{ status }}</span>
      </div>
    </section>
  </div>
</template>
