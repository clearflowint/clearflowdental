<template>
  <div class="overview-view">
    <div class="welcome-card">
      <div><p class="eyebrow">YOUR DAILY WORKSPACE</p><h2>A clearer view of every visit.</h2><p>Connect patient records, original documents, appointments and encounters in one clinic workspace.</p></div>
      <div class="welcome-icon">✦</div>
    </div>
    <div class="stats-grid">
      <article class="stat-card"><span class="stat-icon teal">◎</span><p>Patients</p><strong>—</strong><small>Database connection pending</small></article>
      <article class="stat-card"><span class="stat-icon violet">▦</span><p>Appointments</p><strong>—</strong><small>Scheduling module planned</small></article>
      <article class="stat-card"><span class="stat-icon amber">＋</span><p>Visits</p><strong>—</strong><small>Encounter module planned</small></article>
    </div>
    <section class="section-card">
      <div class="section-heading"><div><h3>Prototype build</h3><p>Small working batches, verified before moving forward.</p></div><span class="pill">AI experience batch</span></div>
      <div class="progress-track"><span style="width:28%"></span></div>
      <div class="progress-caption"><span>Workspace and AI assistant UI</span><span>Prototype</span></div>
    </section>
    <section class="section-card">
      <h3>Implementation sequence</h3>
      <div class="module-list">
        <div><span class="module-number">01</span><span><strong>Clinic workspace</strong><small>Navigation and responsive shell</small></span><span class="module-state">Prototype</span></div>
        <div><span class="module-number">02</span><span><strong>AI assistant</strong><small>Large modal, chat composer and starter prompts</small></span><span class="module-state">Prototype</span></div>
        <div><span class="module-number">03</span><span><strong>AI settings</strong><small>Provider, model and secure credential workflow</small></span><span class="module-state">UI draft</span></div>
        <div><span class="module-number">04</span><span><strong>Authenticated integration</strong><small>Connect Appwrite API and test with a signed-in user</small></span><span class="module-state">Next</span></div>
      </div>
    </section>
  </div>
</template>
