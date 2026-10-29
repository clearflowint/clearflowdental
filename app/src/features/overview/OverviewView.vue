<script setup>
import { onMounted, ref } from 'vue';
import { overviewService } from '../../services/index.js';

const summary = ref({ clinicName: '', patients: null, appointments: null, visits: null });
const loading = ref(true);
const error = ref('');

async function loadSummary() {
  loading.value = true;
  error.value = '';
  try {
    summary.value = await overviewService.getSummary();
  } catch (cause) {
    error.value = cause?.message || 'Could not load clinic summary.';
  } finally {
    loading.value = false;
  }
}

onMounted(loadSummary);
</script>

<template>
  <div class="overview-view">
    <div class="welcome-card">
      <div>
        <p class="eyebrow">YOUR DAILY WORKSPACE</p>
        <h2>A clearer view of every visit.</h2>
        <p>{{ summary.clinicName ? 'Workspace summary for ' + summary.clinicName + '.' : 'Your clinic records, appointments and encounters in one workspace.' }}</p>
      </div>
      <div class="welcome-icon">✦</div>
    </div>

    <section v-if="error" class="section-card" role="alert">
      <p>{{ error }}</p>
    </section>

    <div class="stats-grid">
      <article class="stat-card">
        <span class="stat-icon teal">◎</span>
        <p>Patients</p>
        <strong>{{ loading ? '…' : (summary.patients ?? '—') }}</strong>
        <small>{{ loading ? 'Loading clinic records' : 'Records in this clinic' }}</small>
      </article>
      <article class="stat-card">
        <span class="stat-icon violet">▦</span>
        <p>Appointments</p>
        <strong>{{ loading ? '…' : (summary.appointments ?? '—') }}</strong>
        <small>{{ loading ? 'Loading appointments' : 'Appointments in this clinic' }}</small>
      </article>
      <article class="stat-card">
        <span class="stat-icon amber">＋</span>
        <p>Visits</p>
        <strong>{{ loading ? '…' : (summary.visits ?? '—') }}</strong>
        <small>{{ loading ? 'Loading encounters' : 'Visits in this clinic' }}</small>
      </article>
    </div>

    <section class="section-card">
      <div class="section-heading">
        <div><h3>Clinic workspace</h3><p>Prototype baseline: existing screens and backend connections first.</p></div>
        <span class="pill">{{ error ? 'Needs attention' : loading ? 'Connecting' : 'Appwrite connected' }}</span>
      </div>
      <div class="progress-caption"><span>Overview data</span><span>{{ error ? 'Connection issue' : loading ? 'Loading' : 'Loaded from backend' }}</span></div>
    </section>
  </div>
</template>
