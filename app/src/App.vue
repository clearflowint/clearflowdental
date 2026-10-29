<script setup>
import { nextTick, onMounted, onBeforeUnmount, watch } from 'vue';
import { AuthScreen } from './components/index.js';
import { useSession } from './composables/useSession.js';

const session = useSession();

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

function handleSignOut() {
  session.signOutCurrent().catch(() => {});
}

watch(session.user, user => {
  if (user) startWorkspace(user);
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
    <div v-else id="legacy-app">
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
