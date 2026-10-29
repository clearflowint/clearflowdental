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
        <div class="field"><label for="provider">AI provider</label><select id="provider"><option value="openai">OpenAI</option><option value="anthropic">Anthropic</option><option value="google">Google AI</option><option value="openrouter">OpenRouter</option><option value="groq">Groq</option><option value="mistral">Mistral</option></select></div>
        <div class="field"><label for="model">Default model</label><select id="model"><option value="gpt-4.1-mini">gpt-4.1-mini</option><option value="gpt-4.1">gpt-4.1</option><option value="o4-mini">o4-mini</option></select></div>
      </div>
    </section>
    <section class="settings-card">
      <h3>Provider API key</h3>
      <p>Credentials should be encrypted server-side and scoped to the current clinic tenant. They must never be saved in browser storage or committed to GitHub.</p>
      <div class="field">
        <label for="provider-key">API key</label>
        <div class="provider-key-row"><input id="provider-key" type="password" autocomplete="new-password" placeholder="Paste provider API key" spellcheck="false"><button class="secondary-button" id="clear-key" type="button">Clear field</button></div>
        <small>The key is never written to browser storage. The backend stores an encrypted credential and returns only a masked status.</small>
        <p id="credential-status" role="status">Checking provider connection…</p>
      </div>
      <div class="settings-notice">🔒 &nbsp; Tenant-scoped encrypted storage · Masked status only · Provider calls stay server-side.</div>
    </section>
    <section class="settings-card">
      <h3>Usage and safety</h3>
      <p>Controls intended to be managed separately from conversations.</p>
      <div class="form-row">
        <div class="field"><label for="monthly-budget">Monthly AI budget (INR)</label><input id="monthly-budget" type="number" min="0" value="1000"></div>
        <div class="field"><label for="clinical-mode">Clinical data handling</label><select id="clinical-mode"><option value="review">Require user review for all drafts</option><option value="admin">General administrative assistance only</option></select></div>
      </div>
      <div class="settings-actions"><button class="primary-button" id="save-ai-settings" type="button">Save settings</button><span id="settings-status" class="save-status" role="status"></span></div>
    </section>
  </div>
</template>
