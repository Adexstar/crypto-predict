
import { state, getCurrentUser, setCurrentUser, addHistory, subscribeAI, requestWithdrawal, exportUserCSV, saveState } from './userData.js';
import { renderCandle } from './charts.js';

function $(id){ return document.getElementById(id); }

function renderHeader(){
  const user = getCurrentUser();
  $('app-header').innerHTML = `
    <div class="brand"><div class="logo">24h</div><div>
      <div style="font-weight:800">24h Trading Platform</div>
      <div class="small">Total Assets: $${user.balance.toLocaleString(undefined,{minimumFractionDigits:2})}</div>
    </div></div>
    <div class="nav">
      <select id="user-switch" class="input"></select>
      <a href="landing.html" class="cta" style="text-decoration:none">← Landing</a>
      <a href="deposit.html" class="cta" style="text-decoration:none">Deposit</a>
      <a href="withdraw.html" class="cta" style="text-decoration:none">Withdraw</a>
      <a href="ai-quant.html" class="cta" style="text-decoration:none">AI Quant</a>
      <a href="transfer.html" class="cta" style="text-decoration:none">Transfer</a>
      <a href="history.html" class="cta" style="text-decoration:none">History</a>
      <a href="profile.html" class="cta" style="text-decoration:none">Profile</a>
      <a href="analytics.html" class="cta" style="text-decoration:none">📊 Analytics</a>
      <a href="announcements.html" class="cta" style="text-decoration:none">📢 Announcements</a>
      <a href="support.html" class="cta" style="text-decoration:none">🎟️ Support</a>
    </div>`;
  const sel = $('user-switch');
  sel.innerHTML = state.users.map(u=>`<option value="${u.id}" ${u.id===state.currentUser?'selected':''}>${u.name} (${u.email})</option>`).join('');
  sel.addEventListener('change', e=>{ setCurrentUser(e.target.value); renderApp(); });
}

function showSection(name){
  const sections = ['dashboard','ai','deposit','withdraw','transfer','history','profile','options','contract'];
  sections.forEach(s=>{ const el=$(s+'-section'); if(el) el.style.display = s===name?'block':'none'; });
  renderApp();
}

function renderApp(){
  const u = getCurrentUser();
  if(!$('user-name')) return;
  $('user-name').innerText = `${u.name} · ${u.email}`;
  $('balance').innerText = `$${u.balance.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;
  $('status').innerHTML = u.frozen?'<span class="status-frozen">FROZEN</span>':'<span class="status-active">ACTIVE</span>';
  $('snap-name').innerText = u.name;
  $('snap-kyc').innerText = u.kyc? 'SUBMITTED':'NONE';
  // history lists
  const hist = $('history-list'); if(hist){ hist.innerHTML = u.history.slice(0,50).map(h=>`<div class="small"><strong>${new Date(h.ts).toLocaleString()}</strong><br>${h.message || h.action}</div>`).join(''); }
  const ulog = $('user-log'); if(ulog){ ulog.innerHTML = u.history.map(h=>`<div class="small"><strong>${new Date(h.ts).toLocaleString()}</strong><br>${h.message || h.action}</div>`).join(''); }
}

function mount(){
  renderHeader();
  $('app-main').innerHTML = `
    <div class="grid">
      <div>
        <div class="card">
          <div class="kv"><div><div class="section-title">Dashboard</div><div class="small">Live simulation charts & balances</div></div>
            <div style="text-align:right"><div class="small">Status</div><div id="status" class="small"></div></div></div>
          <div style="margin-top:12px">
            <div style="display:flex;gap:12px">
              <div style="flex:1">
                <div class="card" style="padding:12px">
                  <div class="kv"><div><div class="small">Total Assets</div><div style="font-weight:800;font-size:20px" id="balance"></div></div>
                  <div><div class="small">Account</div><div id="user-name" class="small"></div></div></div>
                  <div style="margin-top:12px" id="chart-wrap"><div class="canvas-wrap card" id="candle-elm"><canvas></canvas></div></div>
                </div>
                <div class="card" style="margin-top:12px">
                  <div class="section-title">Actions</div>
                  <div class="controls">
                    <button class="cta" onclick="showSection('deposit')">Deposit (Sim)</button>
                    <button class="cta" onclick="showSection('withdraw')">Withdraw (Sim)</button>
                    <button class="cta" onclick="showSection('transfer')">Transfer (Sim)</button>
                    <button class="cta" onclick="showSection('history')">History</button>
                  </div>
                </div>
              </div>
              <div>
                <div class="card">
                  <div class="section-title">Account Snapshot</div>
                  <div class="small">Name</div><div id="snap-name" style="font-weight:700"></div>
                  <div class="small" style="margin-top:10px">KYC</div><div id="snap-kyc" class="small"></div>
                  <div style="margin-top:12px" id="status">Status: <span id="status"></span></div>
                </div>
                <div class="card" style="margin-top:12px">
                  <div class="section-title">AI Quant (Quick)</div>
                  <div class="small">Grid trading subscription — simulated</div>
                  <div style="margin-top:10px">
                    <input id="sub-amt" class="input" type="number" placeholder="Subscribe amount (30-3000)" />
                    <div style="margin-top:8px"><button class="cta" id="sub-now">Subscribe (Sim)</button></div>
                    <div id="sub-msg" class="small" style="margin-top:8px"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div>
        <div class="card">
          <div class="section-title">Simulation Controls</div>
          <div style="margin-top:10px">
            <button class="cta" id="btn-sim-profit">Simulate Profit Cycle</button>
            <button class="cta" id="btn-sim-freeze">Toggle Freeze</button>
            <div style="margin-top:8px" class="small">Additional functions available in Admin Panel</div>
          </div>
        </div>
        <div class="card" style="margin-top:12px">
          <div class="section-title">Recent Events</div>
          <div id="history-list" style="max-height:260px;overflow:auto"></div>
        </div>
      </div>
    </div>

    <div id="deposit-section" style="display:none;margin-top:12px" class="card">
      <div class="section-title">Deposit (Simulation)</div>
      <p class="small">Contact support or use the Admin Panel for deposit assistance.</p>
      <div class="form-row"><button class="cta" id="make-up-order">Make Up Order (Sim)</button></div>
    </div>

    <div id="withdraw-section" style="display:none;margin-top:12px" class="card">
      <div class="section-title">Withdraw (Simulation)</div>
      <div class="form-row"><input id="with-amt" class="input" placeholder="Amount to withdraw (sim)"></div>
      <div class="form-row"><button class="cta" id="with-request">Request Withdrawal (Sim)</button></div>
      <div id="with-msg" class="small" style="margin-top:8px"></div>
    </div>

    <div id="transfer-section" style="display:none;margin-top:12px" class="card">
      <div class="section-title">Transfer Between Sim Accounts</div>
      <div class="form-row row"><select id="from-acc" class="input"><option>Spot</option><option>Contract</option></select>
      <select id="to-acc" class="input"><option>Contract</option><option>Options</option></select></div>
      <div class="form-row"><input id="xfer-amt" class="input" placeholder="Amount"></div>
      <div class="form-row"><button class="cta" id="xfer-btn">Transfer (Sim)</button></div>
      <div id="xfer-msg" class="small"></div>
    </div>

    <div id="ai-section" style="display:none;margin-top:12px" class="card">
      <div class="section-title">AI Quant — Full Simulation</div>
      <div class="small">Subscription details, cycle timers and simulated returns.</div>
      <div style="margin-top:12px">
        <div class="form-row"><input id="ai-sub-amt" class="input" placeholder="Subscription Amount"></div>
        <div class="form-row"><button class="cta" id="ai-sub-btn">Subscribe to AI (Sim)</button></div>
        <div id="ai-sub-msg" class="small"></div>
      </div>
    </div>

    <div id="options-section" style="display:none;margin-top:12px" class="card">
      <div class="section-title">Options Trading (Simulation)</div>
      <div class="trade-form">
        <div class="row"><select id="opt-type" class="input"><option value="call">Call</option><option value="put">Put</option></select>
        <input id="opt-strike" class="input" type="number" placeholder="Strike Price"></div>
        <div class="row"><input id="opt-expiry" class="input" placeholder="Expiry (days)"></div>
        <div class="row"><input id="opt-amt" class="input" type="number" placeholder="Purchase Amount"></div>
        <div class="row"><button class="cta" id="opt-buy">Buy Option (Sim)</button></div>
        <div id="opt-msg" class="small"></div>
      </div>
    </div>

    <div id="contract-section" style="display:none;margin-top:12px" class="card">
      <div class="section-title">Contract Trading (Simulation)</div>
      <div class="trade-form">
        <div class="row"><select id="contract-side" class="input"><option value="long">Long</option><option value="short">Short</option></select>
        <input id="contract-leverage" class="input" type="number" placeholder="Leverage (e.g., 10)"></div>
        <div class="row"><input id="contract-amt" class="input" type="number" placeholder="Margin Amount"></div>
        <div class="row"><button class="cta" id="contract-open">Open Position (Sim)</button></div>
        <div id="contract-msg" class="small"></div>
      </div>
    </div>

    <div id="history-section" style="display:none;margin-top:12px" class="card">
      <div class="section-title">Activity Log (User)</div>
      <div id="user-log" class="small" style="max-height:300px;overflow:auto"></div>
    </div>

    <div id="profile-section" style="display:none;margin-top:12px" class="card">
      <div class="section-title">Profile & KYC (Simulation)</div>
      <div class="small">KYC is simulated — uploading documents has no external effect.</div>
      <div class="form-row"><label class="small">KYC Status</label><div id="kyc-status" class="small"></div></div>
    </div>
  `;

  // render candlestick
  setTimeout(()=>{ renderCandle('candle-elm'); },300);

  // wire actions
  document.getElementById('sub-now').addEventListener('click', ()=>{
    const amt = Number(document.getElementById('sub-amt').value||0);
    const r = subscribeAI(state.currentUser, amt);
    const msg = $('sub-msg');
    if(!r.ok){ msg.innerText = r.msg; return; }
    msg.innerText = 'Subscription accepted (sim) — payout in demo cycle.';
    setTimeout(()=>{ adminInjectProfitLocal(state.currentUser, +(amt*0.0015).toFixed(2)); renderApp(); }, 5000);
    renderApp();
  });

  document.getElementById('btn-sim-profit').addEventListener('click', ()=>{ simulateProfitCycleLocal(); renderApp(); });
  document.getElementById('btn-sim-freeze').addEventListener('click', ()=>{ toggleFreezeLocal(); renderApp(); });

  document.getElementById('with-request').addEventListener('click', ()=>{
    const amt = Number(document.getElementById('with-amt').value||0);
    const user = getCurrentUser();
    const msg = $('with-msg');
    if(user.frozen){ msg.innerText = 'Account is under review (SIMULATION)'; return; }
    const r = requestWithdrawal(user.id, amt);
    if(!r.ok){ msg.innerText = r.msg; return; }
    msg.innerText = 'Withdrawal request recorded. Please allow 1-3 business days for processing.';
    renderApp();
  });

  document.getElementById('make-up-order').addEventListener('click', ()=>{
    // create a fake deposit order and notify admin via history for training
    addHistory(state.currentUser,'deposit.order',{amount:100});
    renderApp();
    showToast('Order created. Admin will review your request shortly.');
  });

  document.getElementById('xfer-btn').addEventListener('click', ()=>{
    const amt = Number(document.getElementById('xfer-amt').value||0);
    const msg = $('xfer-msg'); if(amt<=0||amt>getCurrentUser().balance){ msg.innerText='Invalid or insufficient (sim)'; return; }
    addHistory(state.currentUser,'transfer.sim',{amount:amt,from:document.getElementById('from-acc').value,to:document.getElementById('to-acc').value});
    msg.innerText = 'Transfer recorded (sim)';
    renderApp();
  });

  document.getElementById('ai-sub-btn').addEventListener('click', ()=>{
    const amt = Number(document.getElementById('ai-sub-amt').value||0);
    const r = subscribeAI(state.currentUser, amt);
    $('ai-sub-msg').innerText = r.ok ? 'Subscribed (sim).' : r.msg;
    if(r.ok){ setTimeout(()=>{ adminInjectProfitLocal(state.currentUser, +(amt*0.002).toFixed(2)); renderApp(); }, 4000); }
    renderApp();
  });

  // options trading
  document.getElementById('opt-buy').addEventListener('click', ()=>{
    const type = document.getElementById('opt-type').value;
    const strike = Number(document.getElementById('opt-strike').value||0);
    const expiry = Number(document.getElementById('opt-expiry').value||0);
    const amt = Number(document.getElementById('opt-amt').value||0);
    const msg = $('opt-msg');
    if(amt<=0||amt>getCurrentUser().balance){ msg.innerText='Invalid amount (sim)'; return; }
    addHistory(state.currentUser,'options.buy',{type,strike,expiry,amt});
    // deduct premium simulation
    const u = getCurrentUser(); u.balance = Number((u.balance - amt).toFixed(2)); saveState(state);
    msg.innerText = 'Option contract created. View details in History.';
    renderApp();
  });

  // contract trading
  document.getElementById('contract-open').addEventListener('click', ()=>{
    const side = document.getElementById('contract-side').value;
    const lev = Number(document.getElementById('contract-leverage').value||1);
    const amt = Number(document.getElementById('contract-amt').value||0);
    const msg = $('contract-msg');
    if(amt<=0||amt>getCurrentUser().balance){ msg.innerText='Invalid margin (sim)'; return; }
    addHistory(state.currentUser,'contract.open',{side,lev,amt});
    const u = getCurrentUser(); u.balance = Number((u.balance - amt).toFixed(2)); saveState(state);
    msg.innerText = 'Position opened. Monitor your leverage carefully.';
    renderApp();
  });

  // initial app render
  renderApp();
}

// Local helper admin-like functions (but available for forensic UI)
function adminInjectProfitLocal(userId, amt){ const u = state.users.find(x=>x.id===userId); if(!u) return; u.balance = Number((u.balance + amt).toFixed(2)); addHistory(userId,'sim.profit',{amt}); saveState(state); showToast(`Credited $${amt} to ${u.name} (sim)`); }
function toggleFreezeLocal(){ const u = getCurrentUser(); u.frozen = !u.frozen; addHistory(u.id,u.frozen?'sim.freeze':'sim.unfreeze',{}); saveState(state); showToast(u.frozen?'Account frozen (sim)':'Account unfrozen (sim)'); }
function simulateProfitCycleLocal(){ state.users.forEach(u=>{ const profit = Number((u.balance * 0.0005).toFixed(2)); u.balance = Number((u.balance + profit).toFixed(2)); addHistory(u.id,'sim.cycle',{profit}); }); saveState(state); showToast('Simulated profit cycle executed (sim)'); }

// simple toast for notifications
function showToast(msg){
  const t = document.createElement('div'); t.className='toast'; t.innerText = msg; document.body.appendChild(t);
  setTimeout(()=>{ t.style.opacity='0'; setTimeout(()=>t.remove(),400); },4000);
}

// helper to download CSV
function downloadCSVForUser(userId){
  import('./userData.js').then(mod=>{
    const csv = mod.exportUserCSV(userId);
    if(!csv) return showToast('No data');
    const blob = new Blob([csv],{type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download = `${userId}_audit.csv`; a.click(); URL.revokeObjectURL(url);
  });
}

window.addEventListener('load', ()=>{ mount(); });
export { showToast, downloadCSVForUser };
