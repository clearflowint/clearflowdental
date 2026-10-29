<script setup>
import { nextTick, onMounted, onBeforeUnmount, watch, ref } from 'vue';
import { AuthScreen, ClinicSetup } from './components/index.js';
import { useClinicWorkspace } from './composables/useClinicWorkspace.js';
import { useSession } from './composables/useSession.js';

const session = useSession();
const clinic = useClinicWorkspace();
const activeClinicId = ref('');

async function startWorkspace(user) {
  if (!user) return;
  await nextTick();
  try {
    const workspace = await import('./legacy-app.js');
    await workspace.startLegacyWorkspace(user);
  } catch (error) {
    console.error('ClearFlow Dental workspace failed to start:', error);
    session.error.value = error?.message || 'The clinic workspace could not start.';
  }
}

async function createClinic(input) {
  try {
    const clinics = await clinic.create(input);
    activeClinicId.value = clinics[0]?.$id || '';
    if (activeClinicId.value) await startWorkspace(session.user.value);
  } catch (error) {
    console.error('Clinic creation failed:', error);
  }
}

function handleSignOut() {
  session.signOutCurrent().catch(() => {});
}

watch(session.user, user => {
  if (user) {
    clinic.load().then(clinics => {
      activeClinicId.value = clinics[0]?.$id || '';
      if (activeClinicId.value) startWorkspace(user);
    }).catch(error => { console.error('Clinic loading failed:', error); });
  } else { activeClinicId.value = ''; }
});

onMounted(() => window.addEventListener('clearflow:signout', handleSignOut));
onBeforeUnmount(() => window.removeEventListener('clearflow:signout', handleSignOut));
</script>

<template>
  <div class="clearflow-app">
    <main v-if="!session.ready.value" class="auth-screen">
      <section class="auth-card">
        <div class="brand-mark">CF</div>
        <h1>ClearFlow Dental</h1>
        <p>Connecting securely…</p>
      </section>
    </main>
    <AuthScreen
      v-else-if="!session.user.value"
      :busy="session.busy.value"
      :error="session.error.value"
      @submit="({ email, password }) => session.signIn(email, password).catch(() => {})"
    />
    <ClinicSetup v-else-if="session.user.value && clinic.clinics.value.length === 0 && !clinic.loading.value" :busy="clinic.creating.value" :error="clinic.error.value" @create="createClinic" @signout="session.signOutCurrent" />
    <div v-else-if="session.user.value" id="legacy-app">
      <main class="auth-screen">
        <section class="auth-card">
          <div class="brand-mark">CF</div>
          <h1>ClearFlow Dental</h1>
          <p>Loading your clinic workspace…</p>
        </section>
      </main>
    </div>
  </div>
</template>
