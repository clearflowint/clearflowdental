import { createApp } from 'vue';
import OverviewView from './features/overview/OverviewView.vue';
import WorkspaceNavigation from './features/workspace/WorkspaceNavigation.vue';
import AISettingsView from './features/ai-settings/AISettingsView.vue';
import ClinicalDataView from './features/clinical/ClinicalDataView.vue';
import { aiService } from './services/index.js';
const root = document.querySelector('#workspace-shell');
const views = { overview: 'Overview', patients: 'Patients', appointments: 'Appointments', visits: 'Visits', documents: 'Documents', settings: 'AI Settings' };
let activeView = 'overview';
let chatOpen = false;
let messages = [];
let sending = false;
let sessionUser = null, activeTenantId = '';
let conversationId = crypto.randomUUID();
let overviewApp = null, navigationApp = null, settingsApp = null, clinicalApp = null;

export function startWorkspace(user, clinicList = []) {
  sessionUser = user;
  const clinics = Array.isArray(clinicList) ? clinicList : [];
  activeTenantId = clinics[0]?.$id || '';
  render();
}
function render() {
  if (overviewApp) { overviewApp.unmount(); overviewApp = null; }
  if (navigationApp) { navigationApp.unmount(); navigationApp = null; }
  if (settingsApp) { settingsApp.unmount(); settingsApp = null; }
  if (clinicalApp) { clinicalApp.unmount(); clinicalApp = null; }
  if (!activeTenantId) return;
  const title = views[activeView] || views.overview;
  root.innerHTML = `
  <div class="app-layout">
    <aside class="sidebar">
      <div class="brand-lockup"><div class="brand-mark small">CF</div><div><strong>ClearFlow</strong><small>Dental Clinic</small></div></div>
      <div id="workspace-navigation"></div>
      <div class="sidebar-bottom"><span class="status-dot"></span><span>Prototype workspace</span></div>
    </aside>
    <main class="main-panel">
      <header class="topbar"><div><p class="eyebrow">CLINIC WORKSPACE</p><h1>${title}</h1></div><div class="user-chip"><span class="avatar">${escapeHTML((sessionUser.name || sessionUser.email || 'CF').slice(0,2).toUpperCase())}</span><span>${escapeHTML(sessionUser.name || sessionUser.email || 'Signed in')}</span><button class="text-button" id="signout">Sign out</button></div></header>
      <div class="prototype-banner"><span>ⓘ</span><span>Connected to Appwrite · Use synthetic data only until live workflow and security tests are complete.</span></div>
      <section id="page-content">${activeView==='settings'?'<div id="settings-mount"></div>':pageContent()}</section>
      <footer>ClearFlow Dental · Prototype build · Not for real patient data</footer>
    </main>
  </div>
  <button class="ai-launcher" id="open-chat" aria-label="Open AI assistant" title="Open AI assistant">✦<span></span></button>
  <div class="modal-backdrop ${chatOpen?'open':''}" id="chat-backdrop" role="dialog" aria-modal="true" aria-label="ClearFlow AI assistant">
    <section class="chat-modal">
      <aside class="chat-side">
        <div class="chat-side-head"><strong>ClearFlow AI</strong><button class="icon-button" id="close-chat-side" aria-label="Close chat">×</button></div>
        <button class="new-chat" id="new-chat">＋ &nbsp; New conversation</button>
        <p class="history-label">RECENT</p><div class="history-item current">New conversation</div>
        <div class="chat-side-foot">AI can make mistakes. Review all clinical information before using it in care decisions.</div>
      </aside>
      <div class="chat-main">
        <header class="chat-header">
          <div class="assistant-title"><button class="icon-button mobile-back" id="close-chat-mobile" aria-label="Close chat">‹</button><div class="assistant-avatar">✦</div><div><strong>ClearFlow Assistant</strong><small>Clinic workspace assistant · Prototype</small></div></div>
          <div class="chat-header-actions"><button class="secondary-button desktop-only" id="new-chat-top">New chat</button><button class="icon-button" id="close-chat" aria-label="Close assistant">×</button></div>
        </header>
        <div class="chat-scroll" id="chat-scroll">
          ${messages.length?'<div class="messages" id="messages">'+messages.map(messageHTML).join('')+'</div>':`<div class="chat-welcome"><div class="welcome-spark">✳</div><h2>What can I help with?</h2><p>Ask about clinic workflows, prepare drafts, or explore your workspace. Connect a provider in AI Settings to use live AI. Do not enter real patient information until privacy controls are verified.</p></div>
          <div class="suggestions">
            <button class="suggestion" data-prompt="Help me prepare for today's appointments"><strong>▦ &nbsp; Prepare my day</strong>Organize a clinic-day checklist</button>
            <button class="suggestion" data-prompt="Create a patient follow-up message template"><strong>✉ &nbsp; Draft a message</strong>Prepare a patient follow-up template</button>
            <button class="suggestion" data-prompt="Explain how to structure a patient visit"><strong>＋ &nbsp; Visit workflow</strong>Review a typical visit workflow</button>
            <button class="suggestion" data-prompt="What AI settings should a clinic configure?"><strong>⚙ &nbsp; AI configuration</strong>Review provider and privacy settings</button>
          </div>`}
        </div>
        <div class="chat-compose-wrap"><form class="chat-compose" id="chat-form"><textarea id="chat-input" rows="2" placeholder="Message ClearFlow Assistant…" aria-label="Message ClearFlow Assistant"></textarea><div class="compose-bottom"><span class="compose-note">Prototype replies only · Don’t enter real patient information</span><button class="send-button" type="submit" aria-label="Send message" ${sending?'disabled':''}>↑</button></div></form></div>
      </div>
    </section>
  </div>`;
  if (activeView === 'overview') {
    const mountPoint = root.querySelector('#overview-mount');
    if (mountPoint) { overviewApp = createApp(OverviewView); overviewApp.mount(mountPoint); }
  }
  if (['patients', 'appointments', 'visits', 'documents'].includes(activeView)) {
    const clinicalMount = root.querySelector('#clinical-data-mount');
    if (clinicalMount) { clinicalApp = createApp(ClinicalDataView, { view: activeView, tenantId: activeTenantId }); clinicalApp.mount(clinicalMount); }
  }
  if (activeView === 'settings') {
    const settingsMount = root.querySelector('#settings-mount');
    if (settingsMount) { settingsApp = createApp(AISettingsView, { tenantId: activeTenantId }); settingsApp.mount(settingsMount); }
  }
  const navigationMount = root.querySelector('#workspace-navigation');
  if (navigationMount) {
    navigationApp = createApp(WorkspaceNavigation, { activeView, onNavigate: view => { activeView = view; render(); } });
    navigationApp.mount(navigationMount);
  }
  document.getElementById('signout')?.addEventListener('click',()=>window.dispatchEvent(new CustomEvent('clearflow:signout')));
  document.querySelector('#open-chat').addEventListener('click',()=>{chatOpen=true;render();setTimeout(()=>document.querySelector('#chat-input')?.focus(),50);});
  ['close-chat','close-chat-side','close-chat-mobile'].forEach(id=>document.getElementById(id)?.addEventListener('click',()=>{chatOpen=false;render();}));
  document.getElementById('chat-backdrop').addEventListener('click',event=>{if(event.target.id==='chat-backdrop'){chatOpen=false;render();}});
  document.getElementById('new-chat')?.addEventListener('click',resetChat);
  document.getElementById('new-chat-top')?.addEventListener('click',resetChat);
  root.querySelectorAll('[data-prompt]').forEach(button=>button.addEventListener('click',()=>sendMessage(button.dataset.prompt)));
  document.getElementById('chat-form')?.addEventListener('submit',event=>{event.preventDefault();const input=document.getElementById('chat-input');const value=input.value.trim();if(value&&!sending)sendMessage(value);});
  document.getElementById('chat-input')?.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();document.getElementById('chat-form').requestSubmit();}});
}
function pageContent(){
  if(activeView==='overview')return '<div id="overview-mount"></div>';
  if(['patients','appointments','visits','documents'].includes(activeView))return '<div id="clinical-data-mount"></div>';
  return '<section class="empty-state"><h2>Module unavailable</h2><p>This workspace section is not available yet.</p></section>';
}
function messageHTML(message){return `<div class="message ${message.role}">${message.role==='assistant'?'<span class="mini-avatar">✦</span>':''}<div class="bubble">${escapeHTML(message.text)}</div></div>`;}
function escapeHTML(value){return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}
function resetChat(){messages=[];sending=false;conversationId=crypto.randomUUID();render();}
async function sendMessage(text){messages.push({role:'user',text});sending=true;render();const scroll=document.getElementById('chat-scroll');if(scroll)scroll.scrollTop=scroll.scrollHeight;try{const r=await aiService.chat({tenantId:activeTenantId,conversationId,message:text});messages.push({role:'assistant',text:r.reply||r.message||'No response text returned.'});}catch(e){messages.push({role:'assistant',text:'I could not complete that request: '+e.message+'\n\nCheck AI Settings and provider configuration. Do not enter identifiable patient data until clinic privacy controls are verified.'});}finally{sending=false;render();const area=document.getElementById('chat-scroll');if(area)area.scrollTop=area.scrollHeight;document.getElementById('chat-input')?.focus();}}
