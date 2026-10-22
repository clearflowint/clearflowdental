<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { checkDirectusConnection, getDirectusUrl, loginToDirectus, logoutFromDirectus } from './lib/directus'

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const isLoading = ref(false)
const isAuthenticated = ref(false)
const connectionState = ref<'checking' | 'connected' | 'unreachable'>('checking')
const signedInAs = ref('')
const message = ref('')
const messageType = ref<'success' | 'error' | 'info'>('info')
const directusUrl = getDirectusUrl()

onMounted(async () => {
  try {
    connectionState.value = (await checkDirectusConnection()) ? 'connected' : 'unreachable'
  } catch {
    // A failed browser request can mean the server is down or its CORS policy blocks this site.
    connectionState.value = 'unreachable'
  }
})

async function handleSignIn() {
  message.value = ''
  messageType.value = 'info'
  isLoading.value = true
  try {
    await loginToDirectus(email.value.trim(), password.value)
    signedInAs.value = email.value.trim()
    isAuthenticated.value = true
    messageType.value = 'success'
    message.value = 'Directus authentication succeeded. Dental data access has not been connected yet.'
  } catch {
    messageType.value = 'error'
    message.value = connectionState.value === 'unreachable'
      ? 'The browser cannot reach Directus. Check the Directus URL and its CORS settings.'
      : 'Sign-in failed. Check the email and password for an account in Directus.'
  } finally {
    isLoading.value = false
  }
}

function handleSignOut() {
  logoutFromDirectus()
  isAuthenticated.value = false
  signedInAs.value = ''
  password.value = ''
  message.value = 'You have signed out.'
  messageType.value = 'info'
}
</script>

<template>
  <main class="page-shell">
    <header class="topbar">
      <a class="brand" href="#" aria-label="ClearFlow Dental home">
        <span class="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="13" fill="currentColor" />
            <path d="M11 21.2c4.3 0 5.1-7.2 9-7.2s4.7 12 9 12" stroke="#fff" stroke-width="2.7" stroke-linecap="round" />
            <path d="M11 26.5c4.3 0 5.1-7.2 9-7.2s4.7 12 9 12" stroke="#B9F0DF" stroke-width="2.7" stroke-linecap="round" />
          </svg>
        </span>
        <span class="brand-copy"><strong>ClearFlow</strong><small>DENTAL</small></span>
      </a>
      <div class="secure-note" :class="{ 'connection-down': connectionState === 'unreachable' }">
        <span class="secure-dot" :class="{ 'dot-checking': connectionState === 'checking', 'dot-down': connectionState === 'unreachable' }"></span>
        {{ connectionState === 'checking' ? 'Connecting to Directus…' : connectionState === 'connected' ? 'Directus connected' : 'Directus unreachable' }}
      </div>
    </header>

    <section class="content-grid">
      <div class="welcome-panel">
        <div class="eyebrow"><span class="eyebrow-line"></span> YOUR PRACTICE, IN FLOW</div>
        <h1>Better care starts<br />with a <em>clearer day.</em></h1>
        <p class="intro">A calmer workspace for the people who keep your practice smiling. Sign in to pick up where your team left off.</p>

        <div class="preview-card">
          <div class="preview-top">
            <div>
              <span class="preview-label">YOUR DAY AT A GLANCE</span>
              <h3>Practice overview</h3>
            </div>
            <span class="live-pill"><span></span> Ready when you are</span>
          </div>
          <div class="metric-row">
            <div class="metric">
              <span class="metric-icon mint">
                <svg viewBox="0 0 24 24" fill="none"><rect x="3.5" y="5" width="17" height="15" rx="3" stroke="currentColor" stroke-width="1.7"/><path d="M8 3.5v3M16 3.5v3M4 9.5h16" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
              </span>
              <span class="metric-caption">Appointments</span>
              <strong>All in one place</strong>
            </div>
            <div class="metric">
              <span class="metric-icon lilac">
                <svg viewBox="0 0 24 24" fill="none"><path d="M12 20s-7-4.3-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.7-7 10-7 10Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>
              </span>
              <span class="metric-caption">Patient care</span>
              <strong>People come first</strong>
            </div>
          </div>
          <div class="preview-footer"><span class="avatar-stack"><i>DR</i><i>AN</i><i>+</i></span><span>Made for your whole team</span><svg viewBox="0 0 24 24" fill="none"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
        </div>
        <div class="trust-line"><span class="trust-check">✓</span> Thoughtfully designed for everyday practice</div>
      </div>

      <div class="login-wrap">
        <section class="login-card" aria-labelledby="login-title">
          <div class="mobile-mark">
            <span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="13" fill="currentColor"/><path d="M11 21.2c4.3 0 5.1-7.2 9-7.2s4.7 12 9 12" stroke="#fff" stroke-width="2.7" stroke-linecap="round"/><path d="M11 26.5c4.3 0 5.1-7.2 9-7.2s4.7 12 9 12" stroke="#B9F0DF" stroke-width="2.7" stroke-linecap="round"/></svg></span>
          </div>
          <div class="form-heading">
            <span class="form-kicker">WELCOME BACK</span>
            <h2 id="login-title">Good to see you.</h2>
            <p>Sign in to your practice workspace.</p>
          </div>
          <form v-if="!isAuthenticated" @submit.prevent="handleSignIn">
            <label for="email">Work email</label>
            <div class="input-shell">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor" stroke-width="1.6"/><path d="m4 7 8 6 8-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <input id="email" v-model="email" type="email" placeholder="you@yourpractice.com" autocomplete="username" required />
            </div>
            <div class="label-row"><label for="password">Password</label><button class="text-button" type="button" @click="message = 'Password recovery will be enabled when Directus authentication is connected.'">Forgot password?</button></div>
            <div class="input-shell">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="3" stroke="currentColor" stroke-width="1.6"/><path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
              <input id="password" v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="Enter your password" autocomplete="current-password" required />
              <button class="visibility-button" type="button" :aria-label="showPassword ? 'Hide password' : 'Show password'" @click="showPassword = !showPassword">
                <svg v-if="!showPassword" viewBox="0 0 24 24" fill="none"><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="2.5" stroke="currentColor" stroke-width="1.6"/></svg>
                <svg v-else viewBox="0 0 24 24" fill="none"><path d="m3 3 18 18M10.6 6.2A10.8 10.8 0 0 1 12 6c6.1 0 9.5 6 9.5 6a16 16 0 0 1-3.1 3.7M6.2 6.4C3.8 8 2.5 12 2.5 12s3.4 6 9.5 6c1.2 0 2.3-.3 3.2-.7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
              </button>
            </div>
            <p class="session-note">Secure sign-in via Directus. This prototype keeps the session in memory.</p>
            <button class="submit-button" type="submit" :disabled="isLoading">{{ isLoading ? 'Signing in…' : 'Sign in' }} <svg viewBox="0 0 24 24" fill="none"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
            <p v-if="message" class="status-message" :class="'status-' + messageType" role="status">{{ message }}</p>
          </form>
          <section v-else class="authenticated-panel">
            <span class="authenticated-icon">✓</span>
            <h3>You’re signed in.</h3>
            <p class="signed-in-email">{{ signedInAs }}</p>
            <p class="auth-explanation">{{ message }}</p>
            <p class="session-note">This confirms authentication only. No patient or practice records are being requested yet.</p>
            <button class="submit-button signout-button" type="button" @click="handleSignOut">Sign out</button>
          </section>
          <div class="login-bottom"><span class="lock-mini">⌑</span> Your practice space, kept private.</div>
        </section>
        <p class="help-line">Need a hand? <a href="mailto:support@clearflow.dental">Contact your practice administrator</a></p>
      </div>
    </section>
    <footer class="page-footer"><span>© {{ new Date().getFullYear() }} ClearFlow Dental</span><span><span class="footer-dot"></span> A little more calm in every day</span></footer>
  </main>
</template>
