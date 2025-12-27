// Admin Panel API Integration
// Include this after api-config.js in admin.html

// State management
window.adminState = {
  users: [],
  deposits: [],
  withdrawals: [],
  analytics: null,
  auditLogs: [],
  supportTickets: []
};

// Load all users from API
window.loadUsers = async function() {
  try {
    window.adminState.users = await AdminAPI.getUsers();
    return window.adminState.users;
  } catch (error) {
    console.error('Failed to load users:', error);
    alert('Failed to load users: ' + error.message);
    return [];
  }
};

// Admin Actions
window.adminSetBalance = async function(userId, newBalance) {
  try {
    await AdminAPI.setBalance(userId, newBalance);
    await loadUsers(); // Refresh
    return true;
  } catch (error) {
    console.error('Failed to set balance:', error);
    alert('Failed to set balance: ' + error.message);
    return false;
  }
};

window.adminInjectProfit = async function(userId, amount) {
  try {
    await AdminAPI.injectProfit(userId, amount);
    await loadUsers(); // Refresh
    return true;
  } catch (error) {
    console.error('Failed to inject profit:', error);
    alert('Failed to inject profit: ' + error.message);
    return false;
  }
};

window.adminToggleFreeze = async function(userId, freeze) {
  try {
    await AdminAPI.freezeAccount(userId, freeze);
    await loadUsers(); // Refresh
    return true;
  } catch (error) {
    console.error('Failed to freeze account:', error);
    alert('Failed: ' + error.message);
    return false;
  }
};

window.adminToggleKYCLock = async function(userId, lock) {
  try {
    await AdminAPI.kycLock(userId, lock);
    await loadUsers(); // Refresh
    return true;
  } catch (error) {
    console.error('Failed to toggle KYC lock:', error);
    alert('Failed: ' + error.message);
    return false;
  }
};

// Deposit Management
window.loadPendingDeposits = async function() {
  try {
    window.adminState.deposits = await DepositAPI.getPending();
    return window.adminState.deposits;
  } catch (error) {
    console.error('Failed to load deposits:', error);
    return [];
  }
};

window.confirmDeposit = async function(depositId, amount) {
  try {
    await DepositAPI.confirm(depositId, amount);
    await loadPendingDeposits(); // Refresh
    alert('✅ Deposit confirmed');
    return true;
  } catch (error) {
    console.error('Failed to confirm deposit:', error);
    alert('Failed: ' + error.message);
    return false;
  }
};

window.rejectDeposit = async function(depositId, reason) {
  try {
    await DepositAPI.reject(depositId, reason);
    await loadPendingDeposits(); // Refresh
    alert('❌ Deposit rejected');
    return true;
  } catch (error) {
    console.error('Failed to reject deposit:', error);
    alert('Failed: ' + error.message);
    return false;
  }
};

// Admin aliases for deposits (for use in renderDeposits)
window.adminConfirmDeposit = window.confirmDeposit;
window.adminRejectDeposit = window.rejectDeposit;

// Withdrawal Management
window.loadPendingWithdrawals = async function() {
  try {
    window.adminState.withdrawals = await WithdrawalAPI.getPending();
    return window.adminState.withdrawals;
  } catch (error) {
    console.error('Failed to load withdrawals:', error);
    return [];
  }
};

window.adminApproveWithdrawal = async function(withdrawalId) {
  try {
    await WithdrawalAPI.approve(withdrawalId);
    await loadPendingWithdrawals(); // Refresh
    alert('✅ Withdrawal approved');
    return true;
  } catch (error) {
    console.error('Failed to approve withdrawal:', error);
    alert('Failed: ' + error.message);
    return false;
  }
};

window.adminRejectWithdrawal = async function(withdrawalId, reason) {
  try {
    await WithdrawalAPI.reject(withdrawalId, reason);
    await loadPendingWithdrawals(); // Refresh
    alert('❌ Withdrawal rejected');
    return true;
  } catch (error) {
    console.error('Failed to reject withdrawal:', error);
    alert('Failed: ' + error.message);
    return false;
  }
};

// Analytics
window.loadAnalytics = async function() {
  try {
    window.adminState.analytics = await AdminAPI.getAnalytics();
    return window.adminState.analytics;
  } catch (error) {
    console.error('Failed to load analytics:', error);
    return null;
  }
};

// Audit Logs
window.loadAuditLogs = async function(limit = 100) {
  try {
    window.adminState.auditLogs = await AdminAPI.getAuditLogs(limit, 0);
    return window.adminState.auditLogs;
  } catch (error) {
    console.error('Failed to load audit logs:', error);
    return [];
  }
};

// Support Tickets
window.loadAllTickets = async function(status = null) {
  try {
    window.adminState.supportTickets = await SupportAPI.getAllTickets(status);
    return window.adminState.supportTickets;
  } catch (error) {
    console.error('Failed to load tickets:', error);
    return [];
  }
};

window.updateTicketStatus = async function(ticketId, status) {
  try {
    await SupportAPI.updateStatus(ticketId, status);
    await loadAllTickets(); // Refresh
    return true;
  } catch (error) {
    console.error('Failed to update ticket:', error);
    alert('Failed: ' + error.message);
    return false;
  }
};

window.addTicketReply = async function(ticketId, message) {
  try {
    await SupportAPI.addReply(ticketId, message);
    await loadAllTickets(); // Refresh
    return true;
  } catch (error) {
    console.error('Failed to add reply:', error);
    alert('Failed: ' + error.message);
    return false;
  }
};

// Announcements
window.loadAnnouncements = async function() {
  try {
    return await AnnouncementAPI.getAll();
  } catch (error) {
    console.error('Failed to load announcements:', error);
    return [];
  }
};

window.createAnnouncement = async function(title, content, type = 'INFO') {
  try {
    await AnnouncementAPI.create({ title, content, type });
    alert('✅ Announcement created');
    return true;
  } catch (error) {
    console.error('Failed to create announcement:', error);
    alert('Failed: ' + error.message);
    return false;
  }
};

window.deleteAnnouncement = async function(announcementId) {
  try {
    await AnnouncementAPI.delete(announcementId);
    alert('✅ Announcement deleted');
    return true;
  } catch (error) {
    console.error('Failed to delete announcement:', error);
    alert('Failed: ' + error.message);
    return false;
  }
};

// Helper function to get user by ID from state
window.getUserById = function(userId) {
  return window.adminState.users.find(u => u.id === userId);
};

// Compatibility layer for existing code
// Maps old localStorage-based state to new API-based state
Object.defineProperty(window, 'state', {
  get: function() {
    return window.adminState;
  }
});

console.log('✅ Admin API integration loaded');
