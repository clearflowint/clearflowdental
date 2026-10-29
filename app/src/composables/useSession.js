import { onMounted, ref } from 'vue';
import { currentUser, signInWithEmail, signUpWithEmail, signOut } from '../appwrite-client.js';

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
      error.value = cause?.message || 'Unable to connect to the sign-in service.';
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
      error.value = cause?.message || 'Sign-in failed. Check your credentials and Appwrite configuration.';
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
      error.value = cause?.message || 'Account creation failed. Check the email and password requirements.';
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
      error.value = cause?.message || 'Sign-out failed.';
      throw cause;
    } finally {
      busy.value = false;
    }
  }

  onMounted(refresh);
  return { user, ready, busy, error, signIn, createAccount, signOutCurrent, refresh };
}
