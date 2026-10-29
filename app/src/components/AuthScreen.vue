<script setup>
import { ref } from 'vue';

defineProps({
  busy: { type: Boolean, default: false },
  error: { type: String, default: '' }
});
const emit = defineEmits(['submit']);
const email = ref('');
const password = ref('');

function submit() {
  if (!email.value.trim() || !password.value) return;
  emit('submit', { email: email.value.trim(), password: password.value });
}
</script>

<template>
  <main class="auth-screen">
    <section class="auth-card" aria-labelledby="auth-title">
      <div class="brand-mark">CF</div>
      <p class="eyebrow">CLINIC WORKSPACE</p>
      <h1 id="auth-title">Welcome to ClearFlow</h1>
      <p>Sign in using your existing Appwrite email account.</p>
      <form @submit.prevent="submit">
        <div class="field">
          <label for="login-email">Email address</label>
          <input id="login-email" v-model="email" type="email" autocomplete="username" required placeholder="you@example.com" :disabled="busy">
        </div>
        <div class="field">
          <label for="login-password">Password</label>
          <input id="login-password" v-model="password" type="password" autocomplete="current-password" required placeholder="Your Appwrite password" :disabled="busy">
        </div>
        <button class="primary-button" type="submit" :disabled="busy">
          {{ busy ? 'Signing in…' : 'Sign in' }}
        </button>
        <p v-if="error" class="auth-error" role="alert">{{ error }}</p>
      </form>
      <small>Use your existing Appwrite account. No new account or Google OAuth is created.</small>
    </section>
  </main>
</template>
