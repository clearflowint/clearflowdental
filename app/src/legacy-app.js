import { createApp } from 'vue';
import OverviewView from './features/overview/OverviewView.vue';
import WorkspaceNavigation from './features/workspace/WorkspaceNavigation.vue';
import { aiService } from './services/index.js';
const root = document.querySelector('#legacy-app');
const views = { overview: 'Overview', patients: 'Patients', appointments: 'Appointments', visits: 'Visits', documents: 'Documents', settings: 'AI Settings' };
let activeView = 'overview';
let chatOpen = false;
let messages = [];
let sending = false;
let sessionUser = null, sessionReady = false, clinics = [], activeTenantId = '';
let aiProviders = [], aiSettings = null, aiBusy = false, aiSettingsLoaded = false, aiSettingsLoading = false;
let conversationId = crypto.randomUUID();
let overviewApp = null, navigationApp = null;

export function startLegacyWorkspace(user, clinicList = []) {
  sessionUser = user;
  sessionReady = true;
  clinics = Array.isArray(clinicList) ? clinicList : [];
  activeTenantId = clinics[0]?.$id || '';
  render();
}
function render() {
  if (overviewApp) { overviewApp.unmount(); overviewApp = null; }
  if (navigationApp) { navigationApp.unmount(); navigationApp = null; }
  if (!sessionReady) { root.innerHTML = '<main class="auth-screen"><div class="auth-card"><div class="brand-mark">CF</div><h1>ClearFlow Dental</h1><p>Connecting securely…</p></div></main>'; return; }
  if (!sessionUser) { root.innerHTML = '<main class="auth-screen"><div class="auth-card"><div class="brand-mark">CF</div><p class="eyebrow">CLINIC WORKSPACE</p><h1>Welcome to ClearFlow</h1><p>Sign in using your existing Appwrite email account.</p><form id="email-signin-form"><div class="field"><label for="login-email">Email address</label><input id="login-email" type="email" autocomplete="username" required placeholder="you@example.com"></div><div class="field"><label for="login-password">Password</label><input id="login-password" type="password" autocomplete="current-password" required placeholder="Your Appwrite password"></div><button class="primary-button" id="email-signin" type="submit">Sign in</button><p id="signin-status" role="status"></p></form><small>Use your existing Appwrite account. No new account or Google OAuth is created.</small></div></main>'; return; }
  if (!activeTenantId) { root.innerHTML = '<main class="auth-screen"><div class="auth-card clinic-setup"><div class="brand-mark">CF</div><h1>Create your clinic workspace</h1><p>This account has no active clinic membership yet.</p><form id="clinic-create-form"><div class="field"><label for="clinic-name">Clinic name</label><input id="clinic-name" required minlength="2" maxlength="150" placeholder="ClearFlow Dental Clinic"></div><div class="field"><label for="clinic-slug">Workspace slug</label><input id="clinic-slug" required minlength="3" maxlength="80" pattern="[a-zA-Z0-9-]+" placeholder="clearflow-dental"></div><button class="primary-button" type="submit">Create workspace</button><p id="clinic-setup-status" role="status"></p></form><button class="text-button" id="signout-setup">Sign out</button></div></main>'; document.getElementById('clinic-create-form').addEventListener('submit', async e => { e.preventDefault(); const status=document.getElementById('clinic-setup-status'); status.textContent='Creating workspace…'; try { await clinicService.create({name:document.getElementById('clinic-name').value,slug:document.getElementById('clinic-slug').value}); clinics=await clinicService.list(); activeTenantId=clinics[0]?.$id||''; render(); } catch(error) { status.textContent=error.message; } }); document.getElementById('signout-setup').addEventListener('click',()=>window.dispatchEvent(new CustomEvent('clearflow:signout'))); return; }
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
      <section id="page-content">${activeView==='settings'?settingsContent():pageContent()}</section>
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
  document.getElementById('save-ai-settings')?.addEventListener('click',saveAiSettings);
  document.getElementById('provider')?.addEventListener('change',updateModels);
  document.getElementById('clear-key')?.addEventListener('click',()=>{document.getElementById('provider-key').value='';document.getElementById('settings-status').textContent='Key field cleared. Nothing was stored.';});
}
function pageContent(){
  if(activeView==='overview')return '<div id="overview-mount"></div>';
  const descriptions={patients:'Patient registration, search, contact channels and patient details will connect after the Appwrite schema batch.',appointments:'Create, reschedule and cancel appointments after patient records are connected.',visits:'A visit timeline will link appointments, visit purpose, treatments and original source documents.',documents:'Upload and preserve original prescriptions, reports, images and referral documents.'};
  return `<section class="empty-state"><div class="empty-icon">${['◎','▦','＋','▤'][['patients','appointments','visits','documents'].indexOf(activeView)]||'◫'}</div><h2>${views[activeView]} module</h2><p>${descriptions[activeView]||'This module is planned for a later prototype batch.'}</p><span class="pill">Not connected yet</span></section>`;
}
function settingsContent(){return `<div class="settings-page"><div class="settings-intro"><p class="eyebrow">WORKSPACE CONFIGURATION</p><h2>AI settings</h2><p>Manage provider credentials and model preferences for this clinic. Keys are sent only to the authenticated backend for server-side encryption.</p></div>
<section class="settings-card"><h3>Provider and model</h3><p>Choose the AI service and model for this clinic workspace.</p><div class="form-row"><div class="field"><label for="provider">AI provider</label><select id="provider"><option value="openai">OpenAI</option><option value="anthropic">Anthropic</option><option value="google">Google AI</option><option value="openrouter">OpenRouter</option><option value="groq">Groq</option><option value="mistral">Mistral</option></select></div><div class="field"><label for="model">Default model</label><select id="model"><option value="gpt-4.1-mini">gpt-4.1-mini</option><option value="gpt-4.1">gpt-4.1</option><option value="o4-mini">o4-mini</option></select></div></div></section>
<section class="settings-card"><h3>Provider API key</h3><p>Credentials should be encrypted server-side and scoped to the current clinic tenant. They must never be saved in browser storage or committed to GitHub.</p><div class="field"><label for="provider-key">API key</label><div class="provider-key-row"><input id="provider-key" type="password" autocomplete="new-password" placeholder="Paste provider API key" spellcheck="false"><button class="secondary-button" id="clear-key" type="button">Clear field</button></div><small>The key is never written to browser storage. The backend stores an encrypted credential and returns only a masked status.</small><p id="credential-status" role="status">Checking provider connection…</p></div><div class="settings-notice">🔒 &nbsp; Tenant-scoped encrypted storage · Masked status only · Provider calls stay server-side.</div></section>
<section class="settings-card"><h3>Usage and safety</h3><p>Controls intended to be managed separately from conversations.</p><div class="form-row"><div class="field"><label for="monthly-budget">Monthly AI budget (INR)</label><input id="monthly-budget" type="number" min="0" value="1000"></div><div class="field"><label for="clinical-mode">Clinical data handling</label><select id="clinical-mode"><option value="review">Require user review for all drafts</option><option value="admin">General administrative assistance only</option></select></div></div><div class="settings-actions"><button class="primary-button" id="save-ai-settings" type="button">Save settings</button><span id="settings-status" class="save-status" role="status"></span></div></section></div>`;}
async function loadAiSettings(){if(aiSettingsLoaded||aiSettingsLoading||!activeTenantId)return;aiSettingsLoading=true;try{const [providersResult,s]=await Promise.all([aiService.listProviders(activeTenantId),aiService.getSettings(activeTenantId)]);aiProviders=providersResult||[];aiSettings=s.settings||{};const ps=document.getElementById('provider'),ms=document.getElementById('model');if(ps&&aiProviders.length)ps.innerHTML=aiProviders.map(x=>'<option value="'+escapeHTML(x.id)+'">'+escapeHTML(x.name)+'</option>').join('');if(ps&&aiSettings.defaultProviderId)ps.value=aiSettings.defaultProviderId;updateModels();if(ms&&aiSettings.defaultModelId)ms.value=aiSettings.defaultModelId;const b=document.getElementById('monthly-budget');if(b&&Number.isFinite(aiSettings.monthlyBudgetMinor))b.value=aiSettings.monthlyBudgetMinor/100;const cs=document.getElementById('credential-status');const credential=(s.providers||[]).find(x=>x.providerId===(ps?.value||aiSettings.defaultProviderId)&&x.status==='connected');if(cs)cs.textContent=credential?'Connected key ending '+(credential.maskedSuffix||'••••'):'No provider key connected for the selected provider.';aiSettingsLoaded=true;}catch(e){const status=document.getElementById('settings-status');if(status)status.textContent=e.message;}finally{aiSettingsLoading=false;}}
function updateModels(){const id=document.getElementById('provider')?.value,select=document.getElementById('model');if(!select)return;const p=aiProviders.find(x=>x.id===id);const models=p?.models||(id==='openai'?['gpt-4.1-mini','gpt-4.1','o4-mini']:[]);const old=select.value;select.innerHTML=models.map(m=>'<option value="'+escapeHTML(m)+'">'+escapeHTML(m)+'</option>').join('');if(models.includes(old))select.value=old;}
async function saveAiSettings(){const status=document.getElementById('settings-status');if(!status||aiBusy)return;aiBusy=true;status.textContent='Saving securely…';const providerId=document.getElementById('provider').value,modelId=document.getElementById('model').value,key=document.getElementById('provider-key').value.trim();try{if(key){await aiService.saveCredential({tenantId:activeTenantId,providerId,apiKey:key});document.getElementById('provider-key').value='';}await aiService.updateSettings({tenantId:activeTenantId,defaultProviderId:providerId,defaultModelId:modelId,monthlyBudgetMinor:Math.round(Math.max(0,Number(document.getElementById('monthly-budget').value||0))*100)});status.textContent='Settings saved.';aiSettingsLoaded=false;await loadAiSettings();}catch(e){status.textContent=e.message;}finally{aiBusy=false;}}
function messageHTML(message){return `<div class="message ${message.role}">${message.role==='assistant'?'<span class="mini-avatar">✦</span>':''}<div class="bubble">${escapeHTML(message.text)}</div></div>`;}
function escapeHTML(value){return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}
function resetChat(){messages=[];sending=false;conversationId=crypto.randomUUID();render();}
async function sendMessage(text){messages.push({role:'user',text});sending=true;render();const scroll=document.getElementById('chat-scroll');if(scroll)scroll.scrollTop=scroll.scrollHeight;try{const r=await aiService.chat({tenantId:activeTenantId,conversationId,message:text});messages.push({role:'assistant',text:r.reply||r.message||'No response text returned.'});}catch(e){messages.push({role:'assistant',text:'I could not complete that request: '+e.message+'\n\nCheck AI Settings and provider configuration. Do not enter identifiable patient data until clinic privacy controls are verified.'});}finally{sending=false;render();const area=document.getElementById('chat-scroll');if(area)area.scrollTop=area.scrollHeight;document.getElementById('chat-input')?.focus();}}
const baseRender=render;render=function(){baseRender();if(sessionReady&&sessionUser&&activeTenantId&&activeView==='settings')loadAiSettings();};
