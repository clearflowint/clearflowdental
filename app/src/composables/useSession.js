import { onMounted, ref } from 'vue';
import { currentUser, signInWithEmail, signUpWithEmail, signOut } from '../appwrite-client.js';

function explainAuthError(cause, fallback) {
  const message = String(cause?.message || '');
  const type = String(cause?.type || '');
  if (cause instanceof TypeError || /failed to fetch|networkerror|load failed|fetch failed/i.test(message)) {
    return 'The browser cannot reach the Appwrite sign-in endpoint. This is usually a DNS, TLS/certificate, or browser CORS/network issue—not an incorrect password. Verify the Appwrite endpoint is reachable from this browser and check the failed request to /v1/account/sessions/email in the browser Network panel.';
  }
  if (type === 'user_invalid_credentials' || cause?.code === 401) {
    return 'Email or password is incorrect. If this is a new user, create the account first.';
  }
  return message || fallback;
}

export function useSession() {
  const user = ref(null);
  const ready = ref(false);
  const busy = ref(false);
  const error = ref('');

  async function refresh() {
    error.value = '';
    try {
      user.value = await currentUser();
    } catch (cause) {
      error.value = explainAuthError(cause, 'Unable to connect to the sign-in service.');
    } finally {
      ready.value = true;
    }
  }

  async function signIn(email, password) {
    busy.value = true;
    error.value = '';
    try {
      await signInWithEmail(email, password);
      user.value = await currentUser();
      if (!user.value) throw new Error('Sign-in completed but the session could not be loaded. Refresh and try again.');
      return user.value;
    } catch (cause) {
      error.value = explainAuthError(cause, 'Sign-in failed. Check your credentials and Appwrite configuration.');
      throw cause;
    } finally {
      busy.value = false;
    }
  }

  async function createAccount({ name, email, password }) {
    busy.value = true;
    error.value = '';
    try {
      await signUpWithEmail(name, email, password);
      await signInWithEmail(email, password);
      user.value = await currentUser();
      if (!user.value) throw new Error('Account created, but the session could not be loaded. Please sign in.');
      return user.value;
    } catch (cause) {
      error.value = explainAuthError(cause, 'Account creation failed. Check the email and password requirements.');
      throw cause;
    } finally {
      busy.value = false;
    }
  }

  async function signOutCurrent() {
    busy.value = true;
    error.value = '';
    try {
      await signOut();
      user.value = null;
    } catch (cause) {
      error.value = explainAuthError(cause, 'Sign-out failed.');
      throw cause;
    } finally {
      busy.value = false;
    }
  }

  onMounted(refresh);
  return { user, ready, busy, error, signIn, createAccount, signOutCurrent, refresh };
}
