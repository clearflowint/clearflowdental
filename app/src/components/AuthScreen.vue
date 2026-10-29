<script setup>
import { ref } from 'vue';

defineProps({
  busy: { type: Boolean, default: false },
  error: { type: String, default: '' }
});
const emit = defineEmits(['submit', 'create-account']);
const mode = ref('signin');
const name = ref('');
const email = ref('');
const password = ref('');

function submit() {
  if (!email.value.trim() || !password.value) return;
  if (mode.value === 'signup') {
    emit('create-account', { name: name.value.trim(), email: email.value.trim(), password: password.value });
  } else {
    emit('submit', { email: email.value.trim(), password: password.value });
  }
}
</script>

<template>
  <main class="auth-screen">
    <section class="auth-card" aria-labelledby="auth-title">
      <div class="brand-mark">CF</div>
      <p class="eyebrow">CLINIC WORKSPACE</p>
      <h1 id="auth-title">{{ mode === 'signup' ? 'Create your account' : 'Welcome to ClearFlow' }}</h1>
      <p>{{ mode === 'signup' ? 'Create an account, then set up your clinic workspace.' : 'Sign in using your Appwrite email account.' }}</p>
      <form @submit.prevent="submit">
        <div v-if="mode === 'signup'" class="field">
          <label for="login-name">Your name</label>
          <input id="login-name" v-model="name" type="text" autocomplete="name" required minlength="2" maxlength="120" placeholder="Full name" :disabled="busy">
        </div>
        <div class="field">
          <label for="login-email">Email address</label>
          <input id="login-email" v-model="email" type="email" autocomplete="username" required placeholder="you@example.com" :disabled="busy">
        </div>
        <div class="field">
          <label for="login-password">Password</label>
          <input id="login-password" v-model="password" type="password" :autocomplete="mode === 'signup' ? 'new-password' : 'current-password'" required minlength="8" placeholder="At least 8 characters" :disabled="busy">
        </div>
        <button class="primary-button" type="submit" :disabled="busy">
          {{ busy ? (mode === 'signup' ? 'Creating account…' : 'Signing in…') : (mode === 'signup' ? 'Create account' : 'Sign in') }}
        </button>
        <p v-if="error" class="auth-error" role="alert">{{ error }}</p>
      </form>
      <button class="text-button" type="button" :disabled="busy" @click="mode = mode === 'signup' ? 'signin' : 'signup'">
        {{ mode === 'signup' ? 'Already have an account? Sign in' : 'New to ClearFlow? Create an account' }}
      </button>
      <small>Accounts are securely managed by Appwrite.</small>
    </section>
  </main>
</template>
