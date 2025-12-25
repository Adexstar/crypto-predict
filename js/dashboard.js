import { state, getCurrentUser, setCurrentUser, addHistory, subscribeAI, requestWithdrawal, saveState } from './userData.js';
import { renderCandle } from './charts.js';

function $(id) { return document.getElementById(id); }

// ==================== AUTO-REFRESH ENGINE ====================
class DashboardRefresh {
  constructor() {
    this.refreshInterval = 5000; // 5 seconds
    this.autoRefreshEnabled = true;
    this.refreshHandle = null;
  }

  start() {
    if (this.refreshHandle) return;
    this.refreshHandle = setInterval(() => {
      this.refresh();
    }, this.refreshInterval);
  }

  refresh() {
    updateAllWidgets();
    animatePriceUpdates();
  }

  stop() {
    if (this.refreshHandle) {
      clearInterval(this.refreshHandle);
      this.refreshHandle = null;
    }
  }
}

const dashboardRefresh = new DashboardRefresh();

// ==================== MOCK DATA GENERATOR ====================
class MockDataEngine {
  constructor() {
    this.basePrices = {
      'BTC': 91500,
      'ETH': 2250,
      'BNB': 380,
      'XRP': 2.15,
      'SOL': 95
    };
    this.priceHistory = {};
    this.initializeHistory();
  }

  initializeHistory() {
    Object.keys(this.basePrices).forEach(symbol => {
      this.priceHistory[symbol] = [this.basePrices[symbol]];
    });
  }

  generatePrice(symbol) {
    const base = this.basePrices[symbol];
    const change = (Math.random() - 0.5) * base * 0.01; // ±1% volatility
    const newPrice = base + change;
    this.basePrices[symbol] = newPrice;
    this.priceHistory[symbol].push(newPrice);
    return newPrice;
  }

  getPriceChange(symbol) {
    const history = this.priceHistory[symbol];
    if (history.length < 2) return 0;
    const prev = history[history.length - 2];
    const curr = history[history.length - 1];
    return ((curr - prev) / prev) * 100;
  }

  getOrderBook(symbol) {
    const currentPrice = this.basePrices[symbol];
    const spread = currentPrice * 0.0005;
    
    return {
      asks: [
        { price: currentPrice + spread * 2, size: Math.random() * 5 },
        { price: currentPrice + spread, size: Math.random() * 8 },
        { price: currentPrice, size: Math.random() * 12 },
      ],
      bids: [
        { price: currentPrice - spread, size: Math.random() * 8 },
        { price: currentPrice - spread * 2, size: Math.random() * 5 },
        { price: currentPrice - spread * 3, size: Math.random() * 3 },
      ]
    };
  }

  getMarketSentiment() {
    // Bullish (60%), Neutral (20%), Bearish (20%)
    const r = Math.random();
    if (r < 0.6) return { sentiment: 'Bullish', value: 60 + Math.random() * 30, color: '#05b26c' };
    if (r < 0.8) return { sentiment: 'Neutral', value: 50, color: '#f0ad4e' };
    return { sentiment: 'Bearish', value: Math.random() * 40, color: '#f6465d' };
  }

  getPortfolioAllocation() {
    return [
      { asset: 'Bitcoin', value: 4500, color: '#f7931a' },
      { asset: 'Ethereum', value: 2800, color: '#627eea' },
      { asset: 'Stablecoins', value: 1800, color: '#26a17b' },
      { asset: 'Altcoins', value: 900, color: '#f0ad4e' }
    ];
  }

  getAISignals() {
    const signals = [
      { symbol: 'BTC/USDT', signal: 'STRONG BUY', confidence: 87, timeframe: '4H' },
      { symbol: 'ETH/USDT', signal: 'BUY', confidence: 72, timeframe: '1H' },
      { symbol: 'BNB/USDT', signal: 'SELL', confidence: 65, timeframe: '1D' },
      { symbol: 'SOL/USDT', signal: 'HOLD', confidence: 58, timeframe: '4H' }
    ];
    return signals;
  }
}

const mockData = new MockDataEngine();

// ==================== WIDGET RENDERERS ====================
function renderPriceTicker() {
  const ticker = $('price-ticker');
  if (!ticker) return;

  const symbols = ['BTC', 'ETH', 'BNB', 'XRP', 'SOL'];
  ticker.innerHTML = symbols.map(symbol => {
    const price = mockData.generatePrice(symbol);
    const change = mockData.getPriceChange(symbol);
    const changeClass = change >= 0 ? 'positive' : 'negative';
    const changeIcon = change >= 0 ? '↑' : '↓';
    
    return `
      <div class="ticker-item animate-in">
        <div class="ticker-symbol">${symbol}/USDT</div>
        <div class="ticker-price">$${price.toFixed(2)}</div>
        <div class="ticker-change ${changeClass}">${changeIcon} ${Math.abs(change).toFixed(2)}%</div>
      </div>
    `;
  }).join('');
}

function renderOrderBook() {
  const orderBook = $('order-book-container');
  if (!orderBook) return;

  const symbol = 'BTC/USDT';
  const book = mockData.getOrderBook(symbol);

  let html = `
    <div class="order-book">
      <div class="order-book-side">
        <div class="order-book-header">
          <div>Price (USDT)</div>
          <div>Size (BTC)</div>
        </div>
        ${book.asks ? book.asks.map(order => `
          <div class="order-book-row">
            <div class="order-book-price sell-price">$${(order?.price || 0).toFixed(2)}</div>
            <div class="order-book-size">${(order?.size || 0).toFixed(3)}</div>
          </div>
        `).join('') : '<div style="padding: 20px; text-align: center; color: #666;">No asks</div>'}
      </div>
      <div class="order-book-side">
        <div class="order-book-header">
          <div>Price (USDT)</div>
          <div>Size (BTC)</div>
        </div>
        ${book.bids ? book.bids.map(order => `
          <div class="order-book-row">
            <div class="order-book-price buy-price">$${(order?.price || 0).toFixed(2)}</div>
            <div class="order-book-size">${(order?.size || 0).toFixed(3)}</div>
          </div>
        `).join('') : '<div style="padding: 20px; text-align: center; color: #666;">No bids</div>'}
      </div>
    </div>
  `;

  orderBook.innerHTML = html;
}

function renderMarketSentiment() {
  const sentiment = $('sentiment-container');
  if (!sentiment) return;

  const market = mockData.getMarketSentiment();
  sentiment.innerHTML = `
    <div class="sentiment-meter">
      <div class="sentiment-label">Market Sentiment</div>
      <div class="sentiment-bar">
        <div class="sentiment-fill" style="width: ${market.value}%; background-color: ${market.color};">
          ${market.sentiment}
        </div>
      </div>
      <div style="margin-top: 8px; font-size: 12px; color: var(--text-secondary);">
        Current: <strong>${market.sentiment}</strong> (${market.value.toFixed(0)}%)
      </div>
    </div>
  `;
}

function renderPortfolioAllocation() {
  const portfolio = $('portfolio-allocation');
  if (!portfolio) return;

  const allocation = mockData.getPortfolioAllocation();
  const total = allocation.reduce((sum, item) => sum + item.value, 0);

  let html = `<div class="pie-legend">`;
  allocation.forEach(item => {
    const percentage = ((item.value / total) * 100).toFixed(1);
    html += `
      <div class="legend-item">
        <div class="legend-dot" style="background-color: ${item.color};"></div>
        <span>${item.asset}: $${item.value.toLocaleString()} (${percentage}%)</span>
      </div>
    `;
  });
  html += `</div>`;

  portfolio.innerHTML = html;
}

function renderAISignals() {
  const signals = $('ai-signals');
  if (!signals) return;

  const aiData = mockData.getAISignals();
  signals.innerHTML = `
    <table class="positions-table">
      <thead>
        <tr>
          <th>Symbol</th>
          <th>Signal</th>
          <th>Confidence</th>
          <th>TF</th>
        </tr>
      </thead>
      <tbody>
        ${aiData.map(signal => `
          <tr>
            <td class="symbol-cell">${signal.symbol}</td>
            <td>
              <span class="status-indicator" style="color: ${signal.signal.includes('BUY') ? 'var(--accent-success)' : signal.signal.includes('SELL') ? 'var(--accent-danger)' : 'var(--accent-warning)'};">
                ${signal.signal}
              </span>
            </td>
            <td>${signal.confidence}%</td>
            <td>${signal.timeframe}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderPositions() {
  const positions = $('positions-table');
  if (!positions) return;

  const user = getCurrentUser();
  const mockPositions = [
    { symbol: 'BTC', size: 0.5, entry: 40000, current: mockData.basePrices['BTC'], leverage: '1x' },
    { symbol: 'ETH', size: 5, entry: 2100, current: mockData.basePrices['ETH'], leverage: '1x' },
  ];

  positions.innerHTML = `
    <table class="positions-table">
      <thead>
        <tr>
          <th>Symbol</th>
          <th>Size</th>
          <th>Entry</th>
          <th>Current</th>
          <th>PnL</th>
          <th>Leverage</th>
        </tr>
      </thead>
      <tbody>
        ${mockPositions.map(pos => {
          const pnl = ((pos.current - pos.entry) / pos.entry) * 100;
          const value = pos.size * (pos.current - pos.entry);
          return `
            <tr>
              <td class="symbol-cell">${pos.symbol}</td>
              <td>${pos.size}</td>
              <td>$${pos.entry.toLocaleString()}</td>
              <td>$${pos.current.toFixed(2)}</td>
              <td class="${value >= 0 ? 'pnl-positive' : 'pnl-negative'}">
                ${value >= 0 ? '+' : ''}${value.toFixed(2)} (${pnl.toFixed(2)}%)
              </td>
              <td>${pos.leverage}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

function renderAccountStats() {
  const user = getCurrentUser();
  const statsContainer = $('account-stats');
  if (!statsContainer) return;

  const totalBalance = user.balance || 10000;
  const change24h = ((Math.random() - 0.5) * 5).toFixed(2);

  statsContainer.innerHTML = `
    <div class="stat-box">
      <div class="stat-label">Total Balance</div>
      <div class="stat-value">$${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
      <div class="stat-change ${change24h >= 0 ? 'positive' : 'negative'}">
        ${change24h >= 0 ? '+' : ''}${change24h}% (24h)
      </div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Available</div>
      <div class="stat-value">$${(totalBalance * 0.85).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">In Orders</div>
      <div class="stat-value">$${(totalBalance * 0.15).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
    </div>
  `;
}

function renderTransactionHistory() {
  const history = $('transaction-history');
  if (!history) return;

  const user = getCurrentUser();
  const transactions = (user.history || []).slice(0, 8).map(h => ({
    time: h.ts,
    type: h.action,
    amount: h.meta?.amt || h.meta?.amount || 0,
    status: 'Completed'
  }));

  history.innerHTML = `
    <table class="positions-table">
      <thead>
        <tr>
          <th>Time</th>
          <th>Type</th>
          <th>Amount</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${transactions.map(tx => `
          <tr>
            <td>${tx.time}</td>
            <td><span class="mock-label">${tx.type.toUpperCase()}</span></td>
            <td>$${tx.amount.toLocaleString()}</td>
            <td><span class="status-indicator"><span class="status-dot active"></span> ${tx.status}</span></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// ==================== ANIMATION HELPERS ====================
function animatePriceUpdates() {
  document.querySelectorAll('.ticker-item').forEach(item => {
    item.style.animation = 'none';
    setTimeout(() => {
      item.style.animation = 'glow 0.5s ease-out';
    }, 10);
  });
}

function updateAllWidgets() {
  renderPriceTicker();
  renderOrderBook();
  renderMarketSentiment();
  renderPortfolioAllocation();
  renderAISignals();
  renderPositions();
  renderAccountStats();
  renderTransactionHistory();
}

// ==================== HEADER RENDERING ====================
function renderHeader() {
  const user = getCurrentUser();
  const header = $('app-header');
  if (!header) return;

  header.innerHTML = `
    <div class="brand">
      <div class="logo">Σ</div>
      <div>
        <div class="brand-title">INVEST</div>
        <div class="brand-subtitle">Dashboard</div>
      </div>
    </div>
    <div class="nav">
      <span class="sandbox-badge">DATA FEED</span>
      <a href="landing.html" class="nav-link">Landing</a>
      <a href="deposit.html" class="nav-link">Deposit</a>
      <a href="withdraw.html" class="nav-link">Withdraw</a>
      <a href="transfer.html" class="nav-link">Transfer</a>
      <a href="history.html" class="nav-link">History</a>
      <a href="profile.html" class="nav-link">Profile</a>
      <a href="settings.html" class="nav-link">Settings</a>
      <a href="reset.html" class="nav-link">Reset Password</a>
    </div>
  `;

  // User switcher removed - each user sees only their own account
}

// ==================== MAIN DASHBOARD MOUNT ====================
function mount() {
  renderHeader();

  $('app-main').innerHTML = `
    <div class="container">
      <!-- Transparency Badge -->
      <div class="qa-indicator">
        🔬 UPDATE AND ANALYZE BLOCKCHAIN AND CRYPTOCURRENCIES FROM THE PERSPECTIVE OF CREATION
      </div>

      <!-- Price Ticker -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Live Price Feed</div>
            <div class="card-subtitle">Updates Every 5 Seconds</div>
          </div>
          <div class="card-badge">CRYPTO</div>
        </div>
        <div id="price-ticker" class="ticker"></div>
      </div>

      <!-- Main Dashboard Grid -->
      <div class="dashboard-grid">
        <!-- Account Stats -->
        <div class="card widget-span-2">
          <div class="card-header">
            <div>
              <div class="card-title">Account Overview</div>
              <div class="card-subtitle">Balance & Performance</div>
            </div>
          </div>
          <div id="account-stats"></div>
        </div>

        <!-- Order Book -->
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Order Book (BTC)</div>
              <div class="card-subtitle">Market Depth</div>
            </div>
          </div>
          <div id="order-book-container"></div>
        </div>

        <!-- Market Sentiment -->
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Market Sentiment</div>
              <div class="card-subtitle">AI-Powered Analysis</div>
            </div>
          </div>
          <div id="sentiment-container"></div>
        </div>

        <!-- Positions -->
        <div class="card widget-span-2">
          <div class="card-header">
            <div>
              <div class="card-title">Open Positions</div>
              <div class="card-subtitle">Trading Portfolio</div>
            </div>
          </div>
          <div id="positions-table"></div>
        </div>

        <!-- Portfolio Allocation -->
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Portfolio Allocation</div>
              <div class="card-subtitle">Assets Distribution</div>
            </div>
          </div>
          <div id="portfolio-allocation"></div>
        </div>

        <!-- AI Signals -->
        <div class="card widget-span-2">
          <div class="card-header">
            <div>
              <div class="card-title">AI Trading Signals</div>
              <div class="card-subtitle">ML Model Predictions</div>
            </div>
            <div class="card-badge">ANALYZE</div>
          </div>
          <div id="ai-signals"></div>
        </div>

        <!-- Transaction History -->
        <div class="card widget-span-2">
          <div class="card-header">
            <div>
              <div class="card-title">Transaction History</div>
              <div class="card-subtitle">Account Activity</div>
            </div>
          </div>
          <div id="transaction-history"></div>
        </div>

        <!-- Actions Panel -->
        <div class="card widget-span-2">
          <div class="card-header">
            <div>
              <div class="card-title">Quick Actions</div>
              <div class="card-subtitle">Trading Controls</div>
            </div>
          </div>
          <div class="button-group">
            <button class="btn btn-primary" onclick="window.location.href='deposit.html'">💰 Add Funds to Account</button>
            <button class="btn btn-primary" onclick="window.location.href='withdraw.html'">💸 Withdraw Funds</button>
            <button class="btn btn-gold" onclick="ProfitCycle()">🔄 Profit Cycle</button>
            <button class="btn btn-secondary" onclick="window.location.href='ai-settings.html'">🤖 AI Quant Settings</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Initial render of all widgets
  updateAllWidgets();

  // Start auto-refresh
  dashboardRefresh.start();
}

// ==================== ACTION HANDLERS ====================
function showSection(name) {
  const sections = ['deposit-section', 'withdraw-section', 'ai-section'];
  sections.forEach(s => {
    const el = $(s);
    if (el) el.style.display = s === name + '-section' ? 'block' : 'none';
  });
}

function processDeposit() {
  const amt = Number($('deposit-amt').value || 0);
  const user = getCurrentUser();
  const msg = $('deposit-msg');

  if (amt <= 0 || amt > 100000) {
    msg.innerText = '❌ Invalid amount. Must be between $1 and $100,000.';
    return;
  }

  user.balance += amt;
  addHistory(user.id, 'deposit.sandbox', { amount: amt });
  saveState(state);

  msg.innerText = `✅ Successfully deposited $${amt.toFixed(2)} to account.`;
  setTimeout(() => {
    $('deposit-amt').value = '';
    updateAllWidgets();
  }, 1500);
}

function processWithdraw() {
  const amt = Number($('withdraw-amt').value || 0);
  const user = getCurrentUser();
  const msg = $('withdraw-msg');

  if (amt <= 0 || amt > user.balance) {
    msg.innerText = '❌ Invalid amount. Check your available balance.';
    return;
  }

  user.balance -= amt;
  addHistory(user.id, 'withdraw.sandbox', { amount: amt });
  saveState(state);

  msg.innerText = `✅ Successfully withdrew $${amt.toFixed(2)} from account.`;
  setTimeout(() => {
    $('withdraw-amt').value = '';
    updateAllWidgets();
  }, 1500);
}

function subscribeAIBot() {
  const amt = Number($('ai-sub-amt').value || 0);
  const user = getCurrentUser();
  const msg = $('ai-msg');

  if (amt < 30 || amt > 3000 || amt > user.balance) {
    msg.innerText = '❌ Invalid amount. Must be $30-$3,000 and within available balance.';
    return;
  }

  subscribeAI(state.currentUser, amt);
  msg.innerText = `✅ Subscribed to AI bot with $${amt}.profit cycle in 5 seconds...`;

  setTimeout(() => {
    user.balance += amt * 0.0015;
    addHistory(user.id, 'ai.profit', { amount: amt * 0.0015 });
    saveState(state);
    updateAllWidgets();
  }, 5000);
}

function simulateProfitCycle() {
  try {
    const user = getCurrentUser();
    
    if (!user || !user.id) {
      showToast('❌ Please log in to your account');
      return;
    }
    
    const oldBalance = parseFloat(user.balance) || 0;
    const profit = (oldBalance * 0.0005).toFixed(2);
    const newBalance = parseFloat((oldBalance + parseFloat(profit)).toFixed(2));
    
    // Update balance
    user.balance = newBalance;
    
    // Add to history
    addHistory(user.id, 'sim.cycle', { profit });
    
    // Save state
    saveState(state);
    
    // Update widgets
    updateAllWidgets();
    
    // Show card
    showProfitCycleCard(parseFloat(profit), oldBalance, newBalance);
    
  } catch (e) {
    console.error('Profit cycle error:', e);
    showToast('❌ Error executing profit cycle');
  }
}

function showProfitCycleCard(profit, oldBalance, newBalance) {
  // Remove existing overlays
  const existing = document.getElementById('profit-cycle-overlay');
  if (existing) existing.remove();
  
  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = 'profit-cycle-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 999;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  
  const card = document.createElement('div');
  card.style.cssText = `
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    padding: 32px;
    max-width: 420px;
    width: 90%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
  `;
  
  card.innerHTML = `
    <div style="margin-bottom: 24px;">
      <div style="font-size: 1.5rem; font-weight: 700; color: #f0ad4e; margin-bottom: 6px;">Profit Cycle Executed</div>
      <div style="font-size: 0.95rem; color: #05b26c;">✅ Cycle completed successfully</div>
    </div>
    
    <div style="background: rgba(5, 178, 108, 0.1); border: 1px solid rgba(5, 178, 108, 0.3); border-radius: 8px; padding: 16px; margin-bottom: 16px;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <div>
          <div style="color: #a1a1a9; font-size: 0.85rem; margin-bottom: 6px;">Previous Balance</div>
          <div style="color: #e4e4e7; font-size: 1.4rem; font-weight: 700;">$${oldBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
        </div>
        <div>
          <div style="color: #a1a1a9; font-size: 0.85rem; margin-bottom: 6px;">Profit Generated</div>
          <div style="color: #05b26c; font-size: 1.4rem; font-weight: 700;">+$${profit.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
        </div>
      </div>
    </div>
    
    <div style="background: rgba(56, 97, 251, 0.1); border: 1px solid rgba(56, 97, 251, 0.3); border-radius: 8px; padding: 16px; margin-bottom: 20px;">
      <div style="color: #a1a1a9; font-size: 0.85rem; margin-bottom: 8px;">New Balance</div>
      <div style="color: #3861fb; font-size: 1.6rem; font-weight: 800;">$${newBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
    </div>
    
    <div style="display: flex; gap: 12px;">
      <button style="flex: 1; padding: 12px 16px; background: #f0ad4e; color: #0f0f23; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 1rem;" onclick="document.getElementById('profit-cycle-overlay').remove()">Close</button>
    </div>
  `;
  
  overlay.appendChild(card);
  document.body.appendChild(overlay);
  
  // Auto-close after 6 seconds
  setTimeout(() => {
    const el = document.getElementById('profit-cycle-overlay');
    if (el) el.remove();
  }, 6000);
}

// ==================== TOAST NOTIFICATIONS ====================
function showToast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerText = msg;
  document.body.appendChild(t);
  setTimeout(() => {
    t.style.opacity = '0';
    setTimeout(() => t.remove(), 400);
  }, 4000);
}

// ==================== INITIALIZE ====================
// Export mount function for dynamic loading
window.mount = mount;

// Also trigger on load event for traditional page loads
window.addEventListener('load', () => {
  try {
    console.log('📊 Mounting dashboard...');
    mount();
    console.log('✅ Dashboard mounted successfully');
    dashboardRefresh.start();
    updateAllWidgets();
  } catch (error) {
    console.error('❌ Failed to mount dashboard:', error);
    document.body.innerHTML = `
      <div style="padding: 40px; text-align: center; background: #1a1a2e; color: #fff; min-height: 100vh;">
        <h1>⚠️ Dashboard Mount Error</h1>
        <p>${error.message}</p>
        <details style="text-align: left; margin-top: 20px; background: rgba(255,107,107,0.1); padding: 15px; border-radius: 8px;">
          <summary style="cursor: pointer; color: #ff6b6b;">Stack Trace</summary>
          <pre style="margin-top: 10px; overflow-x: auto; font-size: 0.8rem;">${error.stack}</pre>
        </details>
        <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">Retry</button>
      </div>
    `;
  }
});

// Export for global use
window.showSection = showSection;
window.processDeposit = processDeposit;
window.processWithdraw = processWithdraw;
window.subscribeAIBot = subscribeAIBot;
window.simulateProfitCycle = simulateProfitCycle;
window.showProfitCycleCard = showProfitCycleCard;
window.ProfitCycle = simulateProfitCycle;
window.showToast = showToast;
window.updateAllWidgets = updateAllWidgets;
window.getCurrentUser = getCurrentUser;
window.addHistory = addHistory;
window.saveState = saveState;
