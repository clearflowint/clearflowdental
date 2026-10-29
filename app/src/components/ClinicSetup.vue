<script setup>
import { ref } from 'vue';

defineProps({
  busy: { type: Boolean, default: false },
  error: { type: String, default: '' }
});
const emit = defineEmits(['create', 'signout']);
const name = ref('');
const slug = ref('');

function submit() {
  const cleanName = name.value.trim();
  const cleanSlug = slug.value.trim();
  if (cleanName.length < 2 || !/^[a-zA-Z0-9-]{3,80}$/.test(cleanSlug)) return;
  emit('create', { name: cleanName, slug: cleanSlug });
}
</script>

<template>
  <main class="auth-screen">
    <section class="auth-card clinic-setup">
      <div class="brand-mark">CF</div>
      <h1>Create your clinic workspace</h1>
      <p>This account has no active clinic workspace yet.</p>
      <form @submit.prevent="submit">
        <div class="field">
          <label for="clinic-name">Clinic name</label>
          <input id="clinic-name" v-model="name" required minlength="2" maxlength="150" placeholder="ClearFlow Dental Clinic" :disabled="busy">
        </div>
        <div class="field">
          <label for="clinic-slug">Workspace slug</label>
          <input id="clinic-slug" v-model="slug" required minlength="3" maxlength="80" pattern="[a-zA-Z0-9-]+" placeholder="clearflow-dental" :disabled="busy">
        </div>
        <button class="primary-button" type="submit" :disabled="busy">{{ busy ? 'Creating workspace…' : 'Create workspace' }}</button>
        <p v-if="error" class="auth-error" role="alert">{{ error }}</p>
      </form>
      <button class="text-button" type="button" :disabled="busy" @click="emit('signout')">Sign out</button>
    </section>
  </main>
</template>
