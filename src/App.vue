<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  checkAppwriteConnection, loginToAppwrite, registerWithAppwrite, logoutFromAppwrite,
  getCurrentUser, getMyClinic, createClinic, listPatients, createPatient,
  listVisits, createVisit,
} from './lib/appwrite'

const screen = ref('login')
const connectionState = ref('checking')
const email = ref('')
const password = ref('')
const ownerName = ref('')
const signupMode = ref(false)
const isLoading = ref(false)
const busy = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const userId = ref('')
const clinic = ref(null)
const patients = ref([])
const visits = ref([])
const search = ref('')
const selectedPatientId = ref(null)
const showPatientForm = ref(false)
const showVisitForm = ref(false)
const clinicName = ref('')
const patientForm = ref({ full_name: '', phone: '', notes: '' })
const visitForm = ref({ treatment_name: '', treatment_date: new Date().toISOString().slice(0, 10), doctor_advice: '', next_visit_date: '' })

const filteredPatients = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query) return patients.value
  return patients.value.filter((patient) =>
    patient.full_name.toLowerCase().includes(query) || (patient.phone || '').toLowerCase().includes(query),
  )
})
const selectedPatient = computed(() => patients.value.find((patient) => patient.id === selectedPatientId.value) ?? null)
const selectedVisits = computed(() => visits.value.filter((visit) => visit.patient_id === selectedPatientId.value).sort((a, b) => b.treatment_date.localeCompare(a.treatment_date)))
const upcomingVisits = computed(() => visits.value.filter((visit) => visit.next_visit_date && visit.next_visit_date >= new Date().toISOString().slice(0, 10)).sort((a, b) => (a.next_visit_date || '').localeCompare(b.next_visit_date || '')).slice(0, 5))

onMounted(async () => {
  try {
    connectionState.value = (await checkAppwriteConnection()) ? 'connected' : 'unreachable'
  } catch {
    connectionState.value = 'unreachable'
  }
})

function clearMessages() {
  errorMessage.value = ''
  successMessage.value = ''
}

async function handleSignUp() {
  clearMessages()
  isLoading.value = true
  try {
    await registerWithAppwrite(email.value, password.value, ownerName.value)
    await loginToAppwrite(email.value.trim(), password.value)
    const user = await getCurrentUser()
    userId.value = user.$id
    clinic.value = await getMyClinic(user.$id)
    if (clinic.value) {
      await refreshWorkspace()
      screen.value = 'workspace'
    } else {
      screen.value = 'setup'
    }
    successMessage.value = 'Account created. Finish setting up your clinic.'
  } catch (error) {
    logoutFromAppwrite()
    errorMessage.value = error instanceof Error
      ? error.message
      : 'Could not create account. If registration requires email verification, verify your email and then sign in.'
  } finally {
    isLoading.value = false
  }
}

async function handleSignIn() {
  clearMessages()
  isLoading.value = true
  try {
    await loginToAppwrite(email.value.trim(), password.value)
    const user = await getCurrentUser()
    userId.value = user.$id
    clinic.value = await getMyClinic(user.$id)
    if (clinic.value) {
      await refreshWorkspace()
      screen.value = 'workspace'
    } else {
      clinicName.value = ''
      screen.value = 'setup'
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to sign in. Please try again.'
    logoutFromAppwrite()
  } finally {
    isLoading.value = false
  }
}

async function handleCreateClinic() {
  if (!clinicName.value.trim()) return
  clearMessages()
  busy.value = true
  try {
    clinic.value = await createClinic(clinicName.value, userId.value)
    await refreshWorkspace()
    screen.value = 'workspace'
    successMessage.value = 'Your clinic workspace is ready.'
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Could not create clinic.'
  } finally {
    busy.value = false
  }
}

async function refreshWorkspace() {
  if (!clinic.value) return
  const [patientRows, visitRows] = await Promise.all([
    listPatients(clinic.value.id, userId.value),
    listVisits(clinic.value.id, userId.value),
  ])
  patients.value = patientRows
  visits.value = visitRows
  if (selectedPatientId.value && !patientRows.some((patient) => patient.id === selectedPatientId.value)) {
    selectedPatientId.value = null
  }
}

async function handleCreatePatient() {
  if (!clinic.value || !patientForm.value.full_name.trim()) return
  clearMessages()
  busy.value = true
  try {
    const patient = await createPatient(clinic.value.id, userId.value, patientForm.value)
    patients.value = [...patients.value, patient].sort((a, b) => a.full_name.localeCompare(b.full_name))
    selectedPatientId.value = patient.id
    patientForm.value = { full_name: '', phone: '', notes: '' }
    showPatientForm.value = false
    successMessage.value = 'Patient saved.'
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Could not save patient.'
  } finally {
    busy.value = false
  }
}

async function handleCreateVisit() {
  if (!clinic.value || !selectedPatient.value || !visitForm.value.treatment_name.trim() || !visitForm.value.treatment_date) return
  clearMessages()
  busy.value = true
  try {
    const visit = await createVisit(clinic.value.id, userId.value, selectedPatient.value.id, visitForm.value)
    visits.value = [visit, ...visits.value]
    visitForm.value = { treatment_name: '', treatment_date: new Date().toISOString().slice(0, 10), doctor_advice: '', next_visit_date: '' }
    showVisitForm.value = false
    successMessage.value = 'Visit recorded. No reminder has been scheduled or sent.'
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Could not save visit.'
  } finally {
    busy.value = false
  }
}

async function handleRefresh() {
  clearMessages()
  busy.value = true
  try {
    await refreshWorkspace()
    successMessage.value = 'Clinic records refreshed.'
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Could not refresh clinic records.'
  } finally {
    busy.value = false
  }
}

function signOut() {
  logoutFromAppwrite()
  screen.value = 'login'
  userId.value = ''
  clinic.value = null
  patients.value = []
  visits.value = []
  selectedPatientId.value = null
  password.value = ''
  clearMessages()
}
function formatDate(value) {
  if (!value) return 'Not set'
  const date = new Date(`${value.slice(0, 10)}T00:00:00`)
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}
function dateDay(value) {
  return value ? new Date(`${value.slice(0, 10)}T00:00:00`).getDate() : '—'
}
function dateMonth(value) {
  return value ? new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString(undefined, { month: 'short' }) : ''
}
</script>

<template>
  <main v-if="screen === 'login'" class="auth-shell">
    <header class="brand-row">
      <a class="brand" href="#" aria-label="ClearFlow Dental home"><span class="brand-mark">✳</span><span><strong>ClearFlow</strong><small>DENTAL</small></span></a>
      <span class="connection" :class="{ online: connectionState === 'connected', offline: connectionState === 'unreachable' }"><i></i>{{ connectionState === 'checking' ? 'Connecting…' : connectionState === 'connected' ? 'Service connected' : 'Service unavailable' }}</span>
    </header>
    <section class="auth-content">
      <div class="auth-intro">
        <span class="eyebrow">A CALMER CLINIC DAY</span>
        <h1>Care that continues<br><em>between visits.</em></h1>
        <p>Keep patient details, treatment history and the next recommended visit together in one simple workspace.</p>
        <div class="intro-points"><span>✓ Patient records</span><span>✓ Treatment history</span><span>✓ Next-visit dates saved</span></div>
      </div>
      <form class="panel auth-panel" @submit.prevent="signupMode ? handleSignUp() : handleSignIn()">
        <div class="panel-kicker">CLINIC WORKSPACE</div><h2>{{ signupMode ? 'Create your account' : 'Welcome back' }}</h2><p class="muted">{{ signupMode ? 'Start a new clinic workspace in a few steps.' : "Sign in to manage your clinic's patient visits." }}</p>
        <template v-if="signupMode">
          <label for="ownerName">Your name</label><input id="ownerName" v-model="ownerName" autocomplete="name" placeholder="Clinic owner name" required maxlength="100">
          <label for="newClinicName">Clinic name</label><input id="newClinicName" v-model="clinicName" autocomplete="organization" placeholder="e.g. Green Dental Clinic" required maxlength="255">
        </template>
        <label for="email">Email address</label><input id="email" v-model="email" type="email" autocomplete="username" placeholder="you@clinic.com" required>
        <label for="password">Password</label><input id="password" v-model="password" type="password" :autocomplete="signupMode ? 'new-password' : 'current-password'" :placeholder="signupMode ? 'Create a password' : 'Your password'" :minlength="signupMode ? 8 : undefined" required>
        <button class="primary full" type="submit" :disabled="isLoading || connectionState === 'unreachable'">{{ isLoading ? (signupMode ? 'Creating account…' : 'Signing in…') : (signupMode ? 'Create account' : 'Sign in') }} <span>→</span></button>
        <p v-if="errorMessage" class="notice error" role="alert">{{ errorMessage }}</p>
        <p v-if="successMessage" class="notice success" role="status">{{ successMessage }}</p>
        <p class="auth-switch">{{ signupMode ? 'Already have an account?' : 'New to ClearFlow Dental? ' }}<button type="button" class="text-action" @click="signupMode = !signupMode; clearMessages()">{{ signupMode ? 'Sign in' : 'Create account' }}</button></p>
        <p class="privacy-note">Test application. Clinic access must be restricted by Appwrite row permissions.</p>
      </form>
    </section>
    <footer class="footer"><span>ClearFlow Dental</span><span>Simple records. Thoughtful follow-up.</span></footer>
  </main>

  <main v-else-if="screen === 'setup'" class="setup-shell">
    <header class="brand-row"><a class="brand" href="#"><span class="brand-mark">✳</span><span><strong>ClearFlow</strong><small>DENTAL</small></span></a><span class="connection online"><i></i> Service connected</span></header>
    <form class="panel setup-panel" @submit.prevent="handleCreateClinic">
      <div class="setup-icon">✳</div><span class="eyebrow">LET'S GET STARTED</span><h1>Set up your clinic</h1><p class="muted">This creates the clinic workspace associated with your signed-in account.</p>
      <label for="clinicName">Clinic name</label><input id="clinicName" v-model="clinicName" placeholder="e.g. Green Dental Clinic" required maxlength="255">
      <button class="primary full" type="submit" :disabled="busy">{{ busy ? 'Setting up…' : 'Create clinic workspace' }} <span>→</span></button>
      <p v-if="errorMessage" class="notice error" role="alert">{{ errorMessage }}</p>
      <button class="quiet-button" type="button" @click="signOut">Sign out</button>
    </form>
  </main>

  <main v-else class="app-shell">
    <aside class="sidebar">
      <a class="brand" href="#" @click.prevent="selectedPatientId = null"><span class="brand-mark">✳</span><span><strong>ClearFlow</strong><small>DENTAL</small></span></a>
      <div class="clinic-switch"><span class="clinic-avatar">{{ (clinic?.clinic_name || 'C').slice(0,1).toUpperCase() }}</span><span class="clinic-label"><strong>{{ clinic?.clinic_name }}</strong><small>Clinic workspace</small></span></div>
      <div class="nav-label">WORKSPACE</div>
      <button class="nav-item" :class="{ active: selectedPatientId === null }" @click="selectedPatientId = null"><span>▦</span> Overview</button>
      <button class="nav-item" :class="{ active: selectedPatientId !== null }" @click="selectedPatientId = patients[0]?.id ?? null"><span>♙</span> Patients <span class="nav-count">{{ patients.length }}</span></button>
      <div class="sidebar-bottom"><div class="user-chip"><span class="user-avatar">{{ email.slice(0,1).toUpperCase() || 'D' }}</span><span><strong>{{ email }}</strong><small>Signed in</small></span></div><button class="quiet-button" @click="signOut">Sign out ↗</button></div>
    </aside>
    <section class="main-area">
      <header class="workspace-header"><div><div class="eyebrow">YOUR PRACTICE</div><h1>{{ selectedPatient ? selectedPatient.full_name : 'Clinic overview' }}</h1><p>{{ selectedPatient ? 'Patient details and visit history' : 'A simple view of your patients and upcoming visits.' }}</p></div><div class="header-actions"><span class="connection online"><i></i> Connected</span><button class="icon-button" title="Refresh records" @click="handleRefresh" :disabled="busy">↻</button><button class="primary" @click="showPatientForm = true; selectedPatientId = null">＋ Add patient</button></div></header>
      <div v-if="errorMessage" class="notice error global-notice" role="alert">{{ errorMessage }}</div>
      <div v-if="successMessage" class="notice success global-notice" role="status">{{ successMessage }}</div>

      <template v-if="selectedPatient">
        <button class="back-link" @click="selectedPatientId = null">← Back to overview</button>
        <div class="patient-detail-grid">
          <section class="panel patient-card">
            <div class="patient-avatar large">{{ selectedPatient.full_name.slice(0,1).toUpperCase() }}</div><h2>{{ selectedPatient.full_name }}</h2><p class="muted">{{ selectedPatient.phone || 'No phone number added' }}</p>
            <div class="detail-divider"></div><div class="detail-label">PATIENT NOTES</div><p class="patient-notes">{{ selectedPatient.notes || 'No notes added.' }}</p>
            <button class="primary full" @click="showVisitForm = !showVisitForm">＋ Record visit</button>
          </section>
          <section class="panel history-panel">
            <div class="section-heading"><div><span class="eyebrow">CARE HISTORY</span><h2>Visits & treatment</h2></div><span class="count-pill">{{ selectedVisits.length }} {{ selectedVisits.length === 1 ? 'visit' : 'visits' }}</span></div>
            <form v-if="showVisitForm" class="inline-form" @submit.prevent="handleCreateVisit">
              <h3>Record a visit</h3><label for="treatment">Treatment name</label><input id="treatment" v-model="visitForm.treatment_name" placeholder="e.g. Dental cleaning" required maxlength="255">
              <div class="form-grid"><div><label for="treatmentDate">Treatment date</label><input id="treatmentDate" v-model="visitForm.treatment_date" type="date" required></div><div><label for="nextDate">Next visit date <span class="optional">Optional</span></label><input id="nextDate" v-model="visitForm.next_visit_date" type="date"></div></div>
              <label for="advice">Doctor's advice</label><textarea id="advice" v-model="visitForm.doctor_advice" rows="3" placeholder="Advice for the patient or next visit…"></textarea>
              <p class="form-hint">The next-visit date is saved only. No reminder will be scheduled or sent.</p>
              <div class="form-actions"><button class="secondary" type="button" @click="showVisitForm = false">Cancel</button><button class="primary" type="submit" :disabled="busy">{{ busy ? 'Saving…' : 'Save visit' }}</button></div>
            </form>
            <div v-if="!selectedVisits.length && !showVisitForm" class="empty-state"><span>☷</span><h3>No visits recorded yet</h3><p>Add the first treatment visit for this patient.</p><button class="secondary" @click="showVisitForm = true">Record first visit</button></div>
            <div v-else class="visit-list"><article v-for="visit in selectedVisits" :key="visit.id" class="visit-entry"><div class="visit-marker"></div><div class="visit-content"><div class="visit-topline"><h3>{{ visit.treatment_name }}</h3><time>{{ formatDate(visit.treatment_date) }}</time></div><p v-if="visit.doctor_advice" class="advice">{{ visit.doctor_advice }}</p><div v-if="visit.next_visit_date" class="next-visit"><span>↗</span> Next visit advised: <strong>{{ formatDate(visit.next_visit_date) }}</strong></div><div v-else class="no-next-date">No next visit date recorded</div></div></article></div>
          </section>
        </div>
      </template>

      <template v-else>
        <div class="stats-grid"><article class="stat-card"><span class="stat-icon mint">♙</span><span class="stat-label">TOTAL PATIENTS</span><strong>{{ patients.length }}</strong><small>Patients in this clinic</small></article><article class="stat-card"><span class="stat-icon lilac">▤</span><span class="stat-label">VISITS RECORDED</span><strong>{{ visits.length }}</strong><small>Treatment history saved</small></article><article class="stat-card"><span class="stat-icon peach">↗</span><span class="stat-label">UPCOMING VISITS</span><strong>{{ upcomingVisits.length }}</strong><small>Dates advised by doctor</small></article></div>
        <div class="content-columns">
          <section class="panel patient-list-panel">
            <div class="section-heading"><div><span class="eyebrow">PATIENT DIRECTORY</span><h2>Patients</h2></div><button class="text-action" @click="showPatientForm = !showPatientForm">{{ showPatientForm ? 'Close' : '＋ Add patient' }}</button></div>
            <form v-if="showPatientForm" class="inline-form" @submit.prevent="handleCreatePatient"><h3>New patient</h3><label for="patientName">Patient full name</label><input id="patientName" v-model="patientForm.full_name" placeholder="Enter patient's name" required maxlength="255"><label for="patientPhone">Phone number <span class="optional">Optional</span></label><input id="patientPhone" v-model="patientForm.phone" type="tel" placeholder="Contact number"><label for="patientNotes">Notes <span class="optional">Optional</span></label><textarea id="patientNotes" v-model="patientForm.notes" rows="2" placeholder="Basic notes only"></textarea><div class="form-actions"><button type="button" class="secondary" @click="showPatientForm = false">Cancel</button><button type="submit" class="primary" :disabled="busy">{{ busy ? 'Saving…' : 'Save patient' }}</button></div></form>
            <div class="search-box"><span>⌕</span><input v-model="search" type="search" placeholder="Search by patient name or phone"></div>
            <div v-if="!filteredPatients.length" class="empty-state"><span>♙</span><h3>{{ search ? 'No matching patients' : 'No patients yet' }}</h3><p>{{ search ? 'Try another name or phone number.' : 'Add a patient to start recording treatment visits.' }}</p><button v-if="!search" class="secondary" @click="showPatientForm = true">＋ Add first patient</button></div>
            <button v-for="patient in filteredPatients" :key="patient.id" class="patient-row" @click="selectedPatientId = patient.id; showVisitForm = false"><span class="patient-avatar">{{ patient.full_name.slice(0,1).toUpperCase() }}</span><span class="patient-row-copy"><strong>{{ patient.full_name }}</strong><small>{{ patient.phone || 'No phone number' }}</small></span><span class="patient-row-meta"><strong>{{ visits.filter(v => v.patient_id === patient.id).length }}</strong><small>visits</small></span><span class="row-arrow">→</span></button>
          </section>
          <aside class="panel upcoming-panel"><div class="section-heading"><div><span class="eyebrow">FOLLOW-UP DATES</span><h2>Next visits</h2></div><span class="calendar-mark">▦</span></div><p class="muted small-copy">Dates recommended by the doctor. This is a date list only; reminders are not active.</p>
            <div v-if="!upcomingVisits.length" class="empty-compact"><span>▦</span><p>No future visit dates recorded.</p></div>
            <article v-for="visit in upcomingVisits" :key="visit.id" class="upcoming-row"><div class="date-block"><strong>{{ dateDay(visit.next_visit_date) }}</strong><small>{{ dateMonth(visit.next_visit_date) }}</small></div><div class="upcoming-copy"><strong>{{ patients.find(p => p.id === visit.patient_id)?.full_name || 'Patient' }}</strong><small>{{ visit.treatment_name }}</small><span>{{ formatDate(visit.next_visit_date) }}</span></div></article>
          </aside>
        </div>
      </template>
      <footer class="workspace-footer"><span>ClearFlow Dental</span><span>Patient records stay within your clinic workspace.</span></footer>
    </section>
  </main>
</template>
