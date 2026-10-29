import { ref } from 'vue';
import { clinicService } from '../services/index.js';

export function useClinicWorkspace() {
  const clinics = ref([]);
  const loading = ref(false);
  const creating = ref(false);
  const error = ref('');

  async function load() {
    loading.value = true;
    error.value = '';
    try {
      clinics.value = await clinicService.list();
      return clinics.value;
    } catch (cause) {
      error.value = cause?.message || 'Unable to load clinic workspaces.';
      throw cause;
    } finally {
      loading.value = false;
    }
  }

  async function create({ name, slug }) {
    creating.value = true;
    error.value = '';
    try {
      await clinicService.create({ name, slug });
      return await load();
    } catch (cause) {
      error.value = cause?.message || 'Unable to create the clinic workspace.';
      throw cause;
    } finally {
      creating.value = false;
    }
  }

  return { clinics, loading, creating, error, load, create };
}
