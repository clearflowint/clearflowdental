<script setup>
import { computed, nextTick, ref } from 'vue';
import OverviewView from '../overview/OverviewView.vue';
import WorkspaceNavigation from './WorkspaceNavigation.vue';
import AISettingsView from '../ai-settings/AISettingsView.vue';
import ClinicalDataView from '../clinical/ClinicalDataView.vue';
import { aiService } from '../../services/index.js';

const props = defineProps({
  user: { type: Object, required: true },
  tenantId: { type: String, required: true }
});

const views = {
  overview: 'Overview',
  patients: 'Patients',
  appointments: 'Appointments',
  visits: 'Visits',
  documents: 'Documents',
  settings: 'AI Settings'
};
const activeView = ref('overview');
const chatOpen = ref(false);
const messages = ref([]);
const sending = ref(false);
const draft = ref('');
const conversationId = ref(crypto.randomUUID());
const pageTitle = computed(() => views[activeView.value] || views.overview);
const displayName = computed(() => props.user?.name || props.user?.email || 'Signed in');
const avatarLabel = computed(() => displayName.value.slice(0, 2).toUpperCase());
const suggestions = [
  { prompt: "Help me prepare for today's appointments", symbol: '▦', title: 'Prepare my day', description: 'Organize a clinic-day checklist' },
  { prompt: 'Create a patient follow-up message template', symbol: '✉', title: 'Draft a message', description: 'Prepare a patient follow-up template' },
  { prompt: 'Explain how to structure a patient visit', symbol: '＋', title: 'Visit workflow', description: 'Review a typical visit workflow' },
  { prompt: 'What AI settings should a clinic configure?', symbol: '⚙', title: 'AI configuration', description: 'Review provider and privacy settings' }
];

function signOut() {
  window.dispatchEvent(new CustomEvent('clearflow:signout'));
}

function closeChat() {
  chatOpen.value = false;
}

function resetChat() {
  messages.value = [];
  sending.value = false;
  draft.value = '';
  conversationId.value = crypto.randomUUID();
}

async function sendDraft() {
  const message = draft.value.trim();
  if (!message || sending.value) return;
  draft.value = '';
  await sendMessage(message);
}

async function sendMessage(message) {
  messages.value.push({ role: 'user', text: message });
  sending.value = true;
  await scrollChatToBottom();
  try {
    const result = await aiService.chat({
      tenantId: props.tenantId,
      conversationId: conversationId.value,
      message
    });
    messages.value.push({
      role: 'assistant',
      text: result.reply || result.message || 'No response text returned.'
    });
  } catch (error) {
    messages.value.push({
      role: 'assistant',
      text: 'I could not complete that request: ' + (error?.message || 'Unknown error') +
        '\n\nCheck AI Settings and provider configuration. Do not enter identifiable patient data until clinic privacy controls are verified.'
    });
  } finally {
    sending.value = false;
    await scrollChatToBottom();
  }
}

async function scrollChatToBottom() {
  await nextTick();
  const scroll = document.getElementById('chat-scroll');
  if (scroll) scroll.scrollTop = scroll.scrollHeight;
}

function handleComposerKeydown(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendDraft();
  }
}
</script>

<template>
  <div class="app-layout">
    <aside class="sidebar">
      <div class="brand-lockup"><div class="brand-mark small">CF</div><div><strong>ClearFlow</strong><small>Dental Clinic</small></div></div>
      <WorkspaceNavigation :active-view="activeView" @navigate="activeView = $event" />
      <div class="sidebar-bottom"><span class="status-dot"></span><span>Prototype workspace</span></div>
    </aside>
    <main class="main-panel">
      <header class="topbar">
        <div><p class="eyebrow">CLINIC WORKSPACE</p><h1>{{ pageTitle }}</h1></div>
        <div class="user-chip"><span class="avatar">{{ avatarLabel }}</span><span>{{ displayName }}</span><button class="text-button" @click="signOut">Sign out</button></div>
      </header>
      <div class="prototype-banner"><span>ⓘ</span><span>Connected to Appwrite · Use synthetic data only until live workflow and security tests are complete.</span></div>
      <section id="page-content">
        <OverviewView v-if="activeView === 'overview'" />
        <ClinicalDataView
          v-else-if="['patients', 'appointments', 'visits', 'documents'].includes(activeView)"
          :view="activeView"
          :tenant-id="tenantId"
        />
        <AISettingsView v-else-if="activeView === 'settings'" :tenant-id="tenantId" />
        <section v-else class="empty-state"><h2>Module unavailable</h2><p>This workspace section is not available yet.</p></section>
      </section>
      <footer>ClearFlow Dental · Prototype build · Not for real patient data</footer>
    </main>
  </div>
  <button class="ai-launcher" aria-label="Open AI assistant" title="Open AI assistant" @click="chatOpen = true">✦<span></span></button>
  <div
    class="modal-backdrop"
    :class="{ open: chatOpen }"
    role="dialog"
    aria-modal="true"
    aria-label="ClearFlow AI assistant"
    @click.self="closeChat"
  >
    <section class="chat-modal">
      <aside class="chat-side">
        <div class="chat-side-head"><strong>ClearFlow AI</strong><button class="icon-button" aria-label="Close chat" @click="closeChat">×</button></div>
        <button class="new-chat" @click="resetChat">＋ &nbsp; New conversation</button>
        <p class="history-label">RECENT</p><div class="history-item current">New conversation</div>
        <div class="chat-side-foot">AI can make mistakes. Review all clinical information before using it in care decisions.</div>
      </aside>
      <div class="chat-main">
        <header class="chat-header">
          <div class="assistant-title"><button class="icon-button mobile-back" aria-label="Close chat" @click="closeChat">‹</button><div class="assistant-avatar">✦</div><div><strong>ClearFlow Assistant</strong><small>Clinic workspace assistant · Prototype</small></div></div>
          <div class="chat-header-actions"><button class="secondary-button desktop-only" @click="resetChat">New chat</button><button class="icon-button" aria-label="Close assistant" @click="closeChat">×</button></div>
        </header>
        <div class="chat-scroll" id="chat-scroll">
          <div v-if="messages.length" class="messages">
            <div v-for="(message, index) in messages" :key="index" class="message" :class="message.role">
              <span v-if="message.role === 'assistant'" class="mini-avatar">✦</span><div class="bubble">{{ message.text }}</div>
            </div>
          </div>
          <template v-else>
            <div class="chat-welcome"><div class="welcome-spark">✳</div><h2>What can I help with?</h2><p>Ask about clinic workflows, prepare drafts, or explore your workspace. Connect a provider in AI Settings to use live AI. Do not enter real patient information until privacy controls are verified.</p></div>
            <div class="suggestions">
              <button v-for="item in suggestions" :key="item.prompt" class="suggestion" @click="sendMessage(item.prompt)"><strong>{{ item.symbol }} &nbsp; {{ item.title }}</strong>{{ item.description }}</button>
            </div>
          </template>
        </div>
        <div class="chat-compose-wrap">
          <form class="chat-compose" @submit.prevent="sendDraft">
            <textarea v-model="draft" rows="2" placeholder="Message ClearFlow Assistant…" aria-label="Message ClearFlow Assistant" :disabled="sending" @keydown="handleComposerKeydown"></textarea>
            <div class="compose-bottom"><span class="compose-note">Prototype replies only · Don’t enter real patient information</span><button class="send-button" type="submit" aria-label="Send message" :disabled="sending || !draft.trim()">↑</button></div>
          </form>
        </div>
      </div>
    </section>
  </div>
</template>
