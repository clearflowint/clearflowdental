<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { patientService, appointmentService, visitService } from '../../services/clinical-service.js';
import { callApi, uploadSourceDocument } from '../../appwrite-client.js';

const props = defineProps({
  view: { type: String, required: true },
  tenantId: { type: String, required: true }
});
const busy = ref(false);
const loading = ref(false);
const error = ref('');
const notice = ref('');
const patients = ref([]);
const appointments = ref([]);
const visits = ref([]);
const documents = ref([]);
const patientForm = ref({ givenName: '', familyName: '', patientNumber: '', dateOfBirth: '' });
const appointmentForm = ref({ patientId: '', startsAt: '', endsAt: '', reason: '' });
const visitForm = ref({ patientId: '', appointmentId: '', visitPurpose: '' });
const documentForm = ref({ patientId: '', sourceCategory: 'other', sourceProviderName: '', sourceDate: '' });
const documentFile = ref(null);
const title = computed(() => ({ patients: 'Patients', appointments: 'Appointments', visits: 'Visits', documents: 'Documents' }[props.view] || 'Clinic workspace'));

function localDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
}
function patientName(id) {
  const p = patients.value.find(x => x.$id === id);
  return p ? [p.givenName, p.familyName].filter(Boolean).join(' ') : 'Patient';
}
async function load() {
  if (!props.tenantId) return;
  loading.value = true; error.value = ''; notice.value = '';
  try {
    const [p, a, v] = await Promise.all([
      patientService.list(props.tenantId),
      appointmentService.list(props.tenantId),
      visitService.list(props.tenantId)
    ]);
    patients.value = p;
    appointments.value = a.sort((x,y) => String(x.startsAt).localeCompare(String(y.startsAt)));
    visits.value = v.sort((x,y) => String(y.startedAt).localeCompare(String(x.startedAt)));
    if (props.view === 'documents') {
      const result = await callApi('document.list', { tenantId: props.tenantId });
      documents.value = result.documents || [];
    }
    if (!appointmentForm.value.patientId && p[0]) appointmentForm.value.patientId = p[0].$id;
    if (!visitForm.value.patientId && p[0]) visitForm.value.patientId = p[0].$id;
    if (!documentForm.value.patientId && p[0]) documentForm.value.patientId = p[0].$id;
  } catch (e) { error.value = e?.message || 'Could not load clinic records.'; }
  finally { loading.value = false; }
}
async function createPatient() {
  busy.value = true; error.value = ''; notice.value = '';
  try {
    await patientService.create(props.tenantId, { ...patientForm.value });
    patientForm.value = { givenName: '', familyName: '', patientNumber: '', dateOfBirth: '' };
    notice.value = 'Patient record created.';
    await load();
  } catch (e) { error.value = e?.message || 'Could not create patient.'; }
  finally { busy.value = false; }
}
async function createAppointment() {
  busy.value = true; error.value = ''; notice.value = '';
  try {
    await appointmentService.create(props.tenantId, {
      patientId: appointmentForm.value.patientId,
      startsAt: new Date(appointmentForm.value.startsAt).toISOString(),
      endsAt: new Date(appointmentForm.value.endsAt).toISOString(),
      reason: appointmentForm.value.reason
    });
    appointmentForm.value = { patientId: patients.value[0]?.$id || '', startsAt: '', endsAt: '', reason: '' };
    notice.value = 'Appointment scheduled.';
    await load();
  } catch (e) { error.value = e?.message || 'Could not schedule appointment.'; }
  finally { busy.value = false; }
}
async function changeAppointmentStatus(item, status) {
  busy.value = true; error.value = ''; notice.value = '';
  try { await appointmentService.update(props.tenantId, item.$id, { status }); notice.value = 'Appointment updated.'; await load(); }
  catch (e) { error.value = e?.message || 'Could not update appointment.'; }
  finally { busy.value = false; }
}
async function createVisit() {
  busy.value = true; error.value = ''; notice.value = '';
  try {
    await visitService.create(props.tenantId, { patientId: visitForm.value.patientId, appointmentId: visitForm.value.appointmentId || undefined, visitPurpose: visitForm.value.visitPurpose });
    visitForm.value = { patientId: patients.value[0]?.$id || '', appointmentId: '', visitPurpose: '' };
    notice.value = 'Visit opened.';
    await load();
  } catch (e) { error.value = e?.message || 'Could not open visit.'; }
  finally { busy.value = false; }
}
function selectDocument(event) { documentFile.value = event.target.files?.[0] || null; }
async function uploadDocument() {
  const file = documentFile.value;
  if (!file) { error.value = 'Choose a PDF or supported image file first.'; return; }
  if (!['application/pdf','image/jpeg','image/png','image/webp'].includes(file.type)) { error.value = 'Only PDF, JPEG, PNG, and WebP files are accepted.'; return; }
  if (file.size <= 0 || file.size > 25 * 1024 * 1024) { error.value = 'File must be smaller than 25 MB.'; return; }
  busy.value = true; error.value = ''; notice.value = '';
  try {
    const uploaded = await uploadSourceDocument(file);
    await callApi('document.create', { tenantId: props.tenantId, patientId: documentForm.value.patientId, storageFileId: uploaded.$id, originalName: file.name, mimeType: file.type, sourceCategory: documentForm.value.sourceCategory, sourceProviderName: documentForm.value.sourceProviderName, sourceDate: documentForm.value.sourceDate || undefined });
    documentFile.value = null;
    const picker = document.querySelector('#source-document-file'); if (picker) picker.value = '';
    notice.value = 'Source document uploaded and recorded.';
    await load();
  } catch (e) { error.value = e?.message || 'Could not upload source document.'; }
  finally { busy.value = false; }
}
async function completeVisit(item) {
  busy.value = true; error.value = ''; notice.value = '';
  try { await visitService.complete(props.tenantId, item.$id); notice.value = 'Visit marked completed.'; await load(); }
  catch (e) { error.value = e?.message || 'Could not complete visit.'; }
  finally { busy.value = false; }
}
watch(() => [props.view, props.tenantId], load);
onMounted(load);
</script>

<template>
  <div class="clinical-module">
    <div class="clinical-module-heading">
      <div><p class="eyebrow">CLINIC RECORDS</p><h2>{{ title }}</h2><p>Connected to your existing ClearFlow Dental Appwrite backend.</p></div>
      <button class="secondary-button" type="button" :disabled="loading || busy" @click="load">{{ loading ? 'Refreshing…' : 'Refresh' }}</button>
    </div>
    <p v-if="error" class="clinical-alert error" role="alert">{{ error }}</p>
    <p v-if="notice" class="clinical-alert success" role="status">{{ notice }}</p>
    <div v-if="loading" class="clinical-panel muted">Loading records from the clinic backend…</div>

    <template v-if="view === 'patients'">
      <form class="clinical-panel clinical-form" @submit.prevent="createPatient">
        <h3>Add patient</h3>
        <div class="clinical-fields">
          <label>Given name<input v-model.trim="patientForm.givenName" required maxlength="100" autocomplete="off"></label>
          <label>Family name<input v-model.trim="patientForm.familyName" maxlength="100" autocomplete="off"></label>
          <label>Patient number (optional)<input v-model.trim="patientForm.patientNumber" maxlength="40" autocomplete="off"></label>
          <label>Date of birth (optional)<input v-model="patientForm.dateOfBirth" type="date"></label>
        </div>
        <button class="primary-button" :disabled="busy" type="submit">{{ busy ? 'Saving…' : 'Create patient' }}</button>
      </form>
      <div class="clinical-panel">
        <div class="clinical-list-heading"><h3>Patient records</h3><span>{{ patients.length }} loaded</span></div>
        <div v-if="!patients.length && !loading" class="muted">No patients found for this clinic yet.</div>
        <div v-for="p in patients" :key="p.$id" class="clinical-record">
          <div><strong>{{ [p.givenName, p.familyName].filter(Boolean).join(' ') }}</strong><small>{{ p.patientNumber || 'No patient number' }} · {{ p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString() : 'DOB not provided' }}</small></div>
          <span class="clinical-status">{{ p.status || 'active' }}</span>
        </div>
      </div>
    </template>

    <template v-else-if="view === 'appointments'">
      <form class="clinical-panel clinical-form" @submit.prevent="createAppointment">
        <h3>Schedule appointment</h3>
        <p v-if="!patients.length" class="muted">Create a patient record first before scheduling an appointment.</p>
        <div class="clinical-fields">
          <label>Patient<select v-model="appointmentForm.patientId" required><option value="" disabled>Select patient</option><option v-for="p in patients" :key="p.$id" :value="p.$id">{{ [p.givenName,p.familyName].filter(Boolean).join(' ') }}</option></select></label>
          <label>Starts at<input v-model="appointmentForm.startsAt" type="datetime-local" required></label>
          <label>Ends at<input v-model="appointmentForm.endsAt" type="datetime-local" required></label>
          <label>Reason (optional)<input v-model.trim="appointmentForm.reason" maxlength="180"></label>
        </div>
        <button class="primary-button" :disabled="busy || !patients.length" type="submit">{{ busy ? 'Saving…' : 'Schedule appointment' }}</button>
      </form>
      <div class="clinical-panel">
        <div class="clinical-list-heading"><h3>Appointments</h3><span>{{ appointments.length }} loaded</span></div>
        <div v-if="!appointments.length && !loading" class="muted">No appointments found for this clinic yet.</div>
        <div v-for="a in appointments" :key="a.$id" class="clinical-record">
          <div><strong>{{ patientName(a.patientId) }}</strong><small>{{ localDate(a.startsAt) }} – {{ localDate(a.endsAt) }}<span v-if="a.reason"> · {{ a.reason }}</span></small></div>
          <div class="clinical-actions"><span class="clinical-status">{{ a.status }}</span><button v-if="a.status === 'scheduled'" class="secondary-button" type="button" :disabled="busy" @click="changeAppointmentStatus(a,'cancelled')">Cancel</button><button v-if="a.status === 'scheduled'" class="secondary-button" type="button" :disabled="busy" @click="changeAppointmentStatus(a,'completed')">Complete</button></div>
        </div>
      </div>
    </template>

    <template v-else-if="view === 'visits'">
      <form class="clinical-panel clinical-form" @submit.prevent="createVisit">
        <h3>Open visit</h3>
        <div class="clinical-fields">
          <label>Patient<select v-model="visitForm.patientId" required><option value="" disabled>Select patient</option><option v-for="p in patients" :key="p.$id" :value="p.$id">{{ [p.givenName,p.familyName].filter(Boolean).join(' ') }}</option></select></label>
          <label>Related appointment (optional)<select v-model="visitForm.appointmentId"><option value="">No appointment selected</option><option v-for="a in appointments.filter(x => x.patientId === visitForm.patientId)" :key="a.$id" :value="a.$id">{{ localDate(a.startsAt) }} · {{ a.status }}</option></select></label>
          <label class="wide">Visit purpose<input v-model.trim="visitForm.visitPurpose" required maxlength="255" placeholder="e.g. Routine examination"></label>
        </div>
        <button class="primary-button" :disabled="busy || !patients.length" type="submit">{{ busy ? 'Saving…' : 'Open visit' }}</button>
      </form>
      <div class="clinical-panel">
        <div class="clinical-list-heading"><h3>Visit timeline</h3><span>{{ visits.length }} loaded</span></div>
        <div v-if="!visits.length && !loading" class="muted">No visits found for this clinic yet.</div>
        <div v-for="v in visits" :key="v.$id" class="clinical-record">
          <div><strong>{{ patientName(v.patientId) }} · {{ v.visitPurpose }}</strong><small>{{ localDate(v.startedAt) }} · {{ v.status }}</small></div>
          <button v-if="v.status === 'in_progress'" class="secondary-button" :disabled="busy" type="button" @click="completeVisit(v)">Complete visit</button>
        </div>
      </div>
    </template>

    <template v-else-if="view === 'documents'">
      <form class="clinical-panel clinical-form" @submit.prevent="uploadDocument">
        <h3>Upload source document</h3>
        <p class="muted">Upload a PDF or image up to 25 MB. Original files are stored in the clinic document bucket and linked to the selected patient.</p>
        <div class="clinical-fields">
          <label>Patient<select v-model="documentForm.patientId" required><option value="" disabled>Select patient</option><option v-for="p in patients" :key="p.$id" :value="p.$id">{{ [p.givenName,p.familyName].filter(Boolean).join(' ') }}</option></select></label>
          <label>Source category<select v-model="documentForm.sourceCategory"><option value="handwritten_prescription">Handwritten prescription</option><option value="report">Report</option><option value="image">Image</option><option value="referral">Referral</option><option value="patient_supplied_history">Patient supplied history</option><option value="other">Other</option></select></label>
          <label>Source provider (optional)<input v-model.trim="documentForm.sourceProviderName" maxlength="180"></label>
          <label>Source date (optional)<input v-model="documentForm.sourceDate" type="date"></label>
          <label class="wide">File<input id="source-document-file" type="file" accept=".pdf,image/jpeg,image/png,image/webp" required @change="selectDocument"></label>
        </div>
        <button class="primary-button" :disabled="busy || !patients.length" type="submit">{{ busy ? 'Uploading…' : 'Upload and record document' }}</button>
        <p v-if="!patients.length" class="muted">Create a patient record before uploading a document.</p>
      </form>
      <div class="clinical-panel"><h3>Source documents</h3>
        <div v-if="!documents.length && !loading" class="muted">No documents found for this clinic.</div>
        <div v-for="d in documents" :key="d.$id" class="clinical-record"><div><strong>{{ d.originalName || 'Source document' }}</strong><small>{{ patientName(d.patientId) }} · {{ d.sourceCategory }} · {{ d.reviewStatus || 'not reviewed' }}</small></div><span class="clinical-status">{{ d.mimeType || 'file' }}</span></div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.clinical-module{display:grid;gap:16px;max-width:1100px;margin:0 auto}.clinical-module-heading,.clinical-list-heading{display:flex;align-items:center;justify-content:space-between;gap:12px}.clinical-module-heading h2{margin:0;font-size:25px}.clinical-module-heading p:not(.eyebrow){margin:6px 0 0;color:var(--muted,#64748b)}.clinical-panel{background:var(--surface,#fff);border:1px solid var(--border,#e2e8f0);border-radius:16px;padding:18px;display:grid;gap:14px}.clinical-panel h3{margin:0;font-size:16px}.clinical-panel p{margin:0}.clinical-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.clinical-fields label{display:grid;gap:6px;font-size:13px;color:var(--muted,#64748b)}.clinical-fields input,.clinical-fields select{width:100%;min-width:0;border:1px solid var(--border,#dbe2ea);border-radius:9px;padding:10px 11px;background:var(--background,#fff);color:var(--text,#172033);font:inherit}.clinical-fields .wide{grid-column:1/-1}.clinical-fields input[type=file]{padding:8px}.clinical-form>.primary-button{justify-self:start}.clinical-list-heading span,.clinical-status{font-size:12px;color:var(--muted,#64748b);background:var(--subtle,#f1f5f9);padding:5px 8px;border-radius:99px;white-space:nowrap}.clinical-record{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 0;border-top:1px solid var(--border,#e2e8f0)}.clinical-record>div:first-child{min-width:0;display:grid;gap:5px}.clinical-record strong{font-size:14px;overflow-wrap:anywhere}.clinical-record small{font-size:12px;color:var(--muted,#64748b);overflow-wrap:anywhere}.clinical-actions{display:flex;align-items:center;gap:7px;flex-wrap:wrap}.muted{font-size:13px;color:var(--muted,#64748b)}.clinical-alert{margin:0;padding:11px 13px;border-radius:10px;font-size:13px}.clinical-alert.error{background:#fff1f2;color:#9f1239}.clinical-alert.success{background:#f0fdf4;color:#166534}@media(max-width:640px){.clinical-fields{grid-template-columns:1fr}.clinical-module-heading{align-items:flex-start}.clinical-record{align-items:flex-start;flex-direction:column}.clinical-actions{width:100%}.clinical-panel{padding:14px}.clinical-module-heading h2{font-size:22px}}
</style>
