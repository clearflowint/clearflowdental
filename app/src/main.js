const root = document.querySelector('#app');
const views = { overview: 'Overview', patients: 'Patients', appointments: 'Appointments', visits: 'Visits', documents: 'Documents', settings: 'AI Settings' };
let activeView = 'overview';
let chatOpen = false;
let messages = [];
let sending = false;

function render() {
  const title = views[activeView] || views.overview;
  root.innerHTML = `
  <div class="app-layout">
    <aside class="sidebar">
      <div class="brand-lockup"><div class="brand-mark small">CF</div><div><strong>ClearFlow</strong><small>Dental Clinic</small></div></div>
      <nav aria-label="Main navigation">${Object.entries(views).map(([key,label],i)=>`<button class="nav-item ${activeView===key?'active':''}" data-view="${key}"><span class="nav-symbol">${['◫','◎','▦','＋','▤','⚙'][i]}</span><span>${label}</span></button>`).join('')}</nav>
      <div class="sidebar-bottom"><span class="status-dot"></span><span>Prototype workspace</span></div>
    </aside>
    <main class="main-panel">
      <header class="topbar"><div><p class="eyebrow">CLINIC WORKSPACE</p><h1>${title}</h1></div><div class="user-chip"><span class="avatar">CF</span><span>Prototype session</span></div></header>
      <div class="prototype-banner"><span>ⓘ</span><span>Prototype mode · Synthetic data only · AI chat and settings are visual prototypes; live provider connection is not enabled yet.</span></div>
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
          ${messages.length?'<div class="messages" id="messages">'+messages.map(messageHTML).join('')+'</div>':`<div class="chat-welcome"><div class="welcome-spark">✳</div><h2>What can I help with?</h2><p>Ask about clinic workflows, prepare drafts, or explore your workspace. This prototype uses sample responses and is not connected to a live AI provider.</p></div>
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
  root.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>{activeView=button.dataset.view;render();}));
  document.querySelector('#open-chat').addEventListener('click',()=>{chatOpen=true;render();setTimeout(()=>document.querySelector('#chat-input')?.focus(),50);});
  ['close-chat','close-chat-side','close-chat-mobile'].forEach(id=>document.getElementById(id)?.addEventListener('click',()=>{chatOpen=false;render();}));
  document.getElementById('chat-backdrop').addEventListener('click',event=>{if(event.target.id==='chat-backdrop'){chatOpen=false;render();}});
  document.getElementById('new-chat')?.addEventListener('click',resetChat);
  document.getElementById('new-chat-top')?.addEventListener('click',resetChat);
  root.querySelectorAll('[data-prompt]').forEach(button=>button.addEventListener('click',()=>sendMessage(button.dataset.prompt)));
  document.getElementById('chat-form')?.addEventListener('submit',event=>{event.preventDefault();const input=document.getElementById('chat-input');const value=input.value.trim();if(value&&!sending)sendMessage(value);});
  document.getElementById('chat-input')?.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();document.getElementById('chat-form').requestSubmit();}});
  document.getElementById('save-ai-settings')?.addEventListener('click',()=>{const status=document.getElementById('settings-status');status.textContent='Prototype only — settings and API keys have not been saved or transmitted.';});
  document.getElementById('clear-key')?.addEventListener('click',()=>{document.getElementById('provider-key').value='';document.getElementById('settings-status').textContent='Key field cleared. Nothing was stored.';});
}
function pageContent(){
  if(activeView==='overview')return `<div class="welcome-card"><div><p class="eyebrow">YOUR DAILY WORKSPACE</p><h2>A clearer view of every visit.</h2><p>Connect patient records, original documents, appointments and encounters in one clinic workspace.</p></div><div class="welcome-icon">✦</div></div>
  <div class="stats-grid"><article class="stat-card"><span class="stat-icon teal">◎</span><p>Patients</p><strong>—</strong><small>Database connection pending</small></article><article class="stat-card"><span class="stat-icon violet">▦</span><p>Appointments</p><strong>—</strong><small>Scheduling module planned</small></article><article class="stat-card"><span class="stat-icon amber">＋</span><p>Visits</p><strong>—</strong><small>Encounter module planned</small></article></div>
  <section class="section-card"><div class="section-heading"><div><h3>Prototype build</h3><p>Small working batches, verified before moving forward.</p></div><span class="pill">AI experience batch</span></div><div class="progress-track"><span style="width:28%"></span></div><div class="progress-caption"><span>Workspace and AI assistant UI</span><span>Prototype</span></div></section>
  <section class="section-card"><h3>Implementation sequence</h3><div class="module-list"><div><span class="module-number">01</span><span><strong>Clinic workspace</strong><small>Navigation and responsive shell</small></span><span class="module-state">Prototype</span></div><div><span class="module-number">02</span><span><strong>AI assistant</strong><small>Large modal, chat composer and starter prompts</small></span><span class="module-state">Prototype</span></div><div><span class="module-number">03</span><span><strong>AI settings</strong><small>Provider, model and secure credential workflow</small></span><span class="module-state">UI draft</span></div><div><span class="module-number">04</span><span><strong>Authenticated integration</strong><small>Connect Appwrite API and test with a signed-in user</small></span><span class="module-state">Next</span></div></div></section>`;
  const descriptions={patients:'Patient registration, search, contact channels and patient details will connect after the Appwrite schema batch.',appointments:'Create, reschedule and cancel appointments after patient records are connected.',visits:'A visit timeline will link appointments, visit purpose, treatments and original source documents.',documents:'Upload and preserve original prescriptions, reports, images and referral documents.'};
  return `<section class="empty-state"><div class="empty-icon">${['◎','▦','＋','▤'][['patients','appointments','visits','documents'].indexOf(activeView)]||'◫'}</div><h2>${views[activeView]} module</h2><p>${descriptions[activeView]||'This module is planned for a later prototype batch.'}</p><span class="pill">Not connected yet</span></section>`;
}
function settingsContent(){return `<div class="settings-page"><div class="settings-intro"><p class="eyebrow">WORKSPACE CONFIGURATION</p><h2>AI settings</h2><p>Configure which AI provider this clinic intends to use. These controls are a UI prototype; no credentials are saved or sent.</p></div>
<section class="settings-card"><h3>Provider and model</h3><p>Choose the AI service and model for this clinic workspace.</p><div class="form-row"><div class="field"><label for="provider">AI provider</label><select id="provider"><option>OpenAI</option><option>Anthropic</option><option>Google AI</option><option>OpenRouter</option><option>Groq</option><option>Mistral</option></select></div><div class="field"><label for="model">Default model</label><select id="model"><option>gpt-4.1-mini</option><option>gpt-4.1</option><option>o4-mini</option></select></div></div></section>
<section class="settings-card"><h3>Provider API key</h3><p>Credentials should be encrypted server-side and scoped to the current clinic tenant. They must never be saved in browser storage or committed to GitHub.</p><div class="field"><label for="provider-key">API key</label><div class="provider-key-row"><input id="provider-key" type="password" autocomplete="new-password" placeholder="Paste a key only after secure saving is connected"><button class="secondary-button" id="clear-key" type="button">Clear field</button></div><small>For this UI prototype, do not paste a real key. Secure save, masked retrieval, rotation and disconnect actions will be connected to the authenticated Appwrite API.</small></div><div class="settings-notice">🔒 &nbsp; Planned security: tenant-scoped encrypted credentials, masked status only, server-side provider requests, and no key exposure to the chat UI.</div></section>
<section class="settings-card"><h3>Usage and safety</h3><p>Controls intended to be managed separately from conversations.</p><div class="form-row"><div class="field"><label for="monthly-budget">Monthly AI budget (INR)</label><input id="monthly-budget" type="number" min="0" value="1000"></div><div class="field"><label for="clinical-mode">Clinical data handling</label><select id="clinical-mode"><option>Require user review for all drafts</option><option>General administrative assistance only</option></select></div></div><div class="settings-actions"><button class="primary-button" id="save-ai-settings" type="button">Save settings</button><span id="settings-status" class="save-status" role="status"></span></div></section></div>`;}
function messageHTML(message){return `<div class="message ${message.role}">${message.role==='assistant'?'<span class="mini-avatar">✦</span>':''}<div class="bubble">${escapeHTML(message.text)}</div></div>`;}
function escapeHTML(value){return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}
function resetChat(){messages=[];sending=false;render();}
function sendMessage(text){
  messages.push({role:'user',text});sending=true;render();
  const scroll=document.getElementById('chat-scroll');if(scroll)scroll.scrollTop=scroll.scrollHeight;
  setTimeout(()=>{messages.push({role:'assistant',text:'This is the ClearFlow Dental assistant interface prototype. Live AI is not connected yet, so I have not processed your request or accessed clinic data. The next integration step is to connect this chat to the authenticated Appwrite API and the provider configured under AI Settings. Please do not enter real patient information in this prototype.'});sending=false;render();const area=document.getElementById('chat-scroll');if(area)area.scrollTop=area.scrollHeight;document.getElementById('chat-input')?.focus();},350);
}
render();
