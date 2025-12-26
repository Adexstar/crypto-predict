// Standalone Admin Control Panel
// This is completely separate from user accounts

export class AdminDashboard {
  constructor() {
    this.currentAdminEmail = this.getAdminEmail();
    this.setupEventListeners();
  }

  getAdminEmail() {
    const session = localStorage.getItem('adminAuth');
    if (session) {
      try {
        return JSON.parse(session).email;
      } catch (e) {
        return 'Unknown Admin';
      }
    }
    return 'Unknown Admin';
  }

  setupEventListeners() {
    // Event listeners would be set up here for admin-specific actions
  }

  // Admin utilities
  static setBalance(userId, amount) {
    const state = JSON.parse(localStorage.getItem('appState') || '{}');
    const user = state.users?.find(u => u.id === userId);
    if (user) {
      user.balance = amount;
      localStorage.setItem('appState', JSON.stringify(state));
      return true;
    }
    return false;
  }

  static injectProfit(userId, amount) {
    const state = JSON.parse(localStorage.getItem('appState') || '{}');
    const user = state.users?.find(u => u.id === userId);
    if (user) {
      user.balance += amount;
      if (!user.history) user.history = [];
      user.history.unshift({
        ts: new Date().toISOString(),
        action: 'Admin Profit Injection',
        amount: amount
      });
      localStorage.setItem('appState', JSON.stringify(state));
      return true;
    }
    return false;
  }

  static approveWithdrawal(withdrawalId, approve) {
    const state = JSON.parse(localStorage.getItem('appState') || '{}');
    const withdrawal = state.withdrawals?.find(w => w.id === withdrawalId);
    if (withdrawal) {
      withdrawal.status = approve ? 'approved' : 'rejected';
      withdrawal.processedAt = new Date().toISOString();
      localStorage.setItem('appState', JSON.stringify(state));
      return true;
    }
    return false;
  }

  static freezeAccount(userId, freeze) {
    const state = JSON.parse(localStorage.getItem('appState') || '{}');
    const user = state.users?.find(u => u.id === userId);
    if (user) {
      user.frozen = freeze;
      localStorage.setItem('appState', JSON.stringify(state));
      return true;
    }
    return false;
  }

  static simulateDailyProfit(userId) {
    const state = JSON.parse(localStorage.getItem('appState') || '{}');
    const user = state.users?.find(u => u.id === userId);
    if (user) {
      const dailyReturn = (Math.random() * 0.08 + 0.02); // 2-10% daily
      const profit = user.balance * dailyReturn;
      user.balance += profit;
      if (!user.history) user.history = [];
      user.history.unshift({
        ts: new Date().toISOString(),
        action: 'Daily Profit Cycle',
        amount: profit
      });
      localStorage.setItem('appState', JSON.stringify(state));
      return profit;
    }
    return 0;
  }
}

// Export for use in admin.html
if (typeof window !== 'undefined') {
  window.AdminDashboard = AdminDashboard;
}
