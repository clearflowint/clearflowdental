<script setup>
import { onMounted, ref } from 'vue';

const started = ref(false);

onMounted(async () => {
  try {
    await import('./legacy-app.js');
    started.value = true;
  } catch (error) {
    console.error('ClearFlow Dental workspace failed to start:', error);
  }
});
</script>

<template>
  <div class="clearflow-app">
    <div id="legacy-app">
      <main class="auth-screen">
        <div class="auth-card">
          <div class="brand-mark">CF</div>
          <h1>ClearFlow Dental</h1>
          <p>Loading your clinic workspace…</p>
        </div>
      </main>
    </div>
  </div>
</template>
