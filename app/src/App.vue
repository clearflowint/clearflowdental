<script setup>
import { onMounted, onBeforeUnmount, watch } from 'vue';
import { AuthScreen, ClinicSetup } from './components/index.js';
import WorkspaceShell from './features/workspace/WorkspaceShell.vue';
import { useClinicWorkspace } from './composables/useClinicWorkspace.js';
import { useSession } from './composables/useSession.js';

const session = useSession();
const clinic = useClinicWorkspace();

function retryClinicLoad() {
  clinic.load().catch(() => {});
}

async function createClinic(input) {
  try {
    await clinic.create(input);
  } catch (error) {
    console.error('Clinic creation failed:', error);
  }
}

function handleSignOut() {
  session.signOutCurrent().catch(() => {});
}

watch(session.user, user => {
  if (user) {
    clinic.load().catch(error => { console.error('Clinic loading failed:', error); });
  }
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
      @create-account="({ name, email, password }) => session.createAccount({ name, email, password }).catch(() => {})"
    />
    <main v-else-if="session.user.value && clinic.error.value && !clinic.loading.value && clinic.clinics.value.length === 0" class="auth-screen"><section class="auth-card" role="alert"><div class="brand-mark">CF</div><h1>Couldn’t load your clinic</h1><p>{{ clinic.error.value }}</p><button class="primary-button" type="button" :disabled="clinic.loading.value" @click="retryClinicLoad">{{ clinic.loading.value ? "Retrying…" : "Retry connection" }}</button><button class="text-button" type="button" @click="session.signOutCurrent">Sign out</button></section></main>
    <ClinicSetup v-else-if="session.user.value && clinic.clinics.value.length === 0 && !clinic.loading.value" :busy="clinic.creating.value" :error="clinic.error.value" @create="createClinic" @signout="session.signOutCurrent" />
    <WorkspaceShell
      v-else-if="session.user.value && clinic.clinics.value.length > 0"
      :user="session.user.value"
      :tenant-id="clinic.clinics.value[0].$id"
    />
    <main v-else-if="session.user.value" class="auth-screen">
      <section class="auth-card"><div class="brand-mark">CF</div><h1>ClearFlow Dental</h1><p>Loading your clinic workspace…</p></section>
    </main>
  </div>
</template>
