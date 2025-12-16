# Frontend Migration Guide: localStorage → API

This guide explains how to migrate from localStorage-based authentication to the backend API.

## 📋 Migration Overview

**Before**: All data stored in browser localStorage (client-side only)  
**After**: Data stored in PostgreSQL database via Express API (secure, production-ready)

---

## 🔄 Migration Steps

### Step 1: Include API Configuration

Add this to **ALL HTML pages** (before any other scripts):

```html
<!-- Add this BEFORE app.js or any other custom scripts -->
<script src="/js/api-config.js"></script>
```

### Step 2: Update Login (login.html)

**OLD CODE** (localStorage):
```javascript
// Find this in login.html
const users = JSON.parse(localStorage.getItem('users') || '[]');
const user = users.find(u => u.email === email && u.password === password);
if (user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
    window.location.href = 'index.html';
}
```

**NEW CODE** (API):
```javascript
try {
    const response = await AuthAPI.login(email, password);
    
    // Success - token is automatically stored
    window.location.href = '/index.html';
} catch (error) {
    alert('Login failed: ' + error.message);
}
```

### Step 3: Update Registration (signup.html)

**OLD CODE**:
```javascript
const users = JSON.parse(localStorage.getItem('users') || '[]');
users.push({ email, password, name, balance: 0 });
localStorage.setItem('users', JSON.stringify(users));
```

**NEW CODE**:
```javascript
try {
    const response = await AuthAPI.register(email, password, name);
    
    alert('Registration successful!');
    window.location.href = '/login.html';
} catch (error) {
    alert('Registration failed: ' + error.message);
}
```

### Step 4: Update Dashboard (index.html)

**OLD CODE**:
```javascript
const user = JSON.parse(localStorage.getItem('currentUser'));
document.querySelector('.balance').textContent = `$${user.balance.toFixed(2)}`;
```

**NEW CODE**:
```javascript
// On page load
async function loadDashboard() {
    try {
        const userData = await UserAPI.getProfile();
        
        document.querySelector('.balance').textContent = `$${userData.balance.toFixed(2)}`;
        document.querySelector('.spot-balance').textContent = `$${userData.spotBalance.toFixed(2)}`;
        document.querySelector('.futures-balance').textContent = `$${userData.futuresBalance.toFixed(2)}`;
        
        // Show frozen status if account is frozen
        if (userData.frozen) {
            alert('Your account is currently frozen. Please contact support.');
        }
    } catch (error) {
        console.error('Failed to load profile:', error);
        window.location.href = '/login.html';
    }
}

// Call on page load
loadDashboard();
```

### Step 5: Update History (history.html)

**OLD CODE**:
```javascript
const history = JSON.parse(localStorage.getItem('history') || '[]');
history.forEach(item => {
    // Display history items
});
```

**NEW CODE**:
```javascript
async function loadHistory() {
    try {
        const historyData = await UserAPI.getHistory(100, 0); // limit, skip
        
        const historyContainer = document.querySelector('.history-list');
        historyContainer.innerHTML = '';
        
        historyData.forEach(item => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `
                <div class="history-message">${item.message}</div>
                <div class="history-date">${new Date(item.createdAt).toLocaleString()}</div>
            `;
            historyContainer.appendChild(div);
        });
    } catch (error) {
        console.error('Failed to load history:', error);
    }
}

loadHistory();
```

### Step 6: Update Deposit (deposit.html)

**OLD CODE**:
```javascript
// Manual balance update in localStorage
const user = JSON.parse(localStorage.getItem('currentUser'));
user.balance += amount;
localStorage.setItem('currentUser', JSON.stringify(user));
```

**NEW CODE**:
```javascript
async function submitDeposit() {
    const amount = parseFloat(document.getElementById('amount').value);
    const network = document.getElementById('network').value;
    const walletAddress = document.getElementById('wallet').value;
    
    try {
        const response = await DepositAPI.submit({
            amount,
            network,
            asset: 'USDT',
            walletAddress
        });
        
        alert('Deposit submitted! Pending admin confirmation.');
        window.location.href = '/index.html';
    } catch (error) {
        alert('Deposit failed: ' + error.message);
    }
}
```

### Step 7: Update Withdrawal (withdraw.html)

**OLD CODE**:
```javascript
user.balance -= amount;
localStorage.setItem('currentUser', JSON.stringify(user));
```

**NEW CODE**:
```javascript
async function submitWithdrawal() {
    const amount = parseFloat(document.getElementById('amount').value);
    const walletAddress = document.getElementById('wallet').value;
    const network = document.getElementById('network').value;
    
    try {
        const response = await WithdrawalAPI.submit({
            amount,
            walletAddress,
            network
        });
        
        alert('Withdrawal requested! Pending admin approval.');
        window.location.href = '/index.html';
    } catch (error) {
        alert('Withdrawal failed: ' + error.message);
    }
}
```

### Step 8: Update Admin Panel (admin/admin.html)

**OLD CODE**:
```javascript
const users = JSON.parse(localStorage.getItem('users') || '[]');
users.forEach(user => {
    // Display user list
});
```

**NEW CODE**:
```javascript
async function loadUsers() {
    try {
        const users = await AdminAPI.getUsers();
        
        const userList = document.querySelector('.user-list');
        userList.innerHTML = '';
        
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.email}</td>
                <td>${user.name}</td>
                <td>$${user.balance.toFixed(2)}</td>
                <td>${user.frozen ? 'Frozen' : 'Active'}</td>
                <td>
                    <button onclick="adminInjectProfit('${user.id}', 100)">+$100</button>
                    <button onclick="adminFreezeAccount('${user.id}', ${!user.frozen})">
                        ${user.frozen ? 'Unfreeze' : 'Freeze'}
                    </button>
                </td>
            `;
            userList.appendChild(row);
        });
    } catch (error) {
        console.error('Failed to load users:', error);
        alert('Admin access denied');
    }
}

async function adminInjectProfit(userId, amount) {
    try {
        await AdminAPI.injectProfit(userId, amount);
        alert('Profit injected successfully');
        loadUsers(); // Reload
    } catch (error) {
        alert('Failed: ' + error.message);
    }
}

async function adminFreezeAccount(userId, freeze) {
    try {
        await AdminAPI.freezeAccount(userId, freeze);
        alert(`Account ${freeze ? 'frozen' : 'unfrozen'}`);
        loadUsers(); // Reload
    } catch (error) {
        alert('Failed: ' + error.message);
    }
}

loadUsers();
```

### Step 9: Update Admin Deposit/Withdrawal Management

**Confirm Deposit:**
```javascript
async function confirmDeposit(depositId) {
    const amount = parseFloat(prompt('Confirm deposit amount:'));
    
    if (!amount || amount <= 0) {
        alert('Invalid amount');
        return;
    }
    
    try {
        await DepositAPI.confirm(depositId, amount);
        alert('Deposit confirmed!');
        loadPendingDeposits(); // Reload list
    } catch (error) {
        alert('Failed: ' + error.message);
    }
}

async function rejectDeposit(depositId) {
    const reason = prompt('Rejection reason:');
    
    if (!reason) return;
    
    try {
        await DepositAPI.reject(depositId, reason);
        alert('Deposit rejected');
        loadPendingDeposits();
    } catch (error) {
        alert('Failed: ' + error.message);
    }
}

async function loadPendingDeposits() {
    try {
        const deposits = await DepositAPI.getPending();
        
        // Display pending deposits
        const list = document.querySelector('.pending-deposits');
        list.innerHTML = deposits.map(d => `
            <div class="deposit-item">
                <p>User: ${d.user.email}</p>
                <p>Amount: $${d.amount}</p>
                <p>Network: ${d.network}</p>
                <p>Wallet: ${d.walletAddress}</p>
                <button onclick="confirmDeposit('${d.id}')">Confirm</button>
                <button onclick="rejectDeposit('${d.id}')">Reject</button>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load deposits:', error);
    }
}
```

**Approve/Reject Withdrawal:**
```javascript
async function approveWithdrawal(withdrawalId) {
    try {
        await WithdrawalAPI.approve(withdrawalId);
        alert('Withdrawal approved!');
        loadPendingWithdrawals();
    } catch (error) {
        alert('Failed: ' + error.message);
    }
}

async function rejectWithdrawal(withdrawalId) {
    const reason = prompt('Rejection reason:');
    
    if (!reason) return;
    
    try {
        await WithdrawalAPI.reject(withdrawalId, reason);
        alert('Withdrawal rejected');
        loadPendingWithdrawals();
    } catch (error) {
        alert('Failed: ' + error.message);
    }
}
```

### Step 10: Add Authentication Check to Protected Pages

Add this to **index.html**, **deposit.html**, **withdraw.html**, **profile.html**, **admin/admin.html**:

```javascript
// Add at the top of your script
(async () => {
    await requireAuth(); // Redirect to login if not authenticated
})();
```

---

## 🔧 Environment Variables

Before deploying, update your environment variables:

### Vercel (Frontend)
```bash
VITE_API_URL=https://your-service.up.railway.app
```

### Railway (Backend)
```bash
DATABASE_URL=<Railway Postgres connection string>
JWT_SECRET=<random secret>
NODE_ENV=production
FRONTEND_URL=https://your-site.vercel.app
ADMIN_EMAIL=admin@24htrading.com
ADMIN_PASSWORD=Admin!2024
```

---

## 🧪 Testing the Migration

1. **Local Backend**:
   ```bash
   cd backend
   npm install
   npx prisma migrate dev
   npm run seed
   npm start
   ```

2. **Update frontend** [api-config.js](../js/api-config.js):
   ```javascript
   LOCAL_URL: 'http://localhost:3000'
   ```

3. **Test login**:
   - Email: `admin@24htrading.com`
   - Password: `Admin!2024`

4. **Test user**:
   - Email: `demo@example.com`
   - Password: `Demo123!`

5. **Verify**:
   - ✅ Login successful → Dashboard loads
   - ✅ Balance displays from database
   - ✅ History shows formatted messages
   - ✅ Deposits create pending records
   - ✅ Admin panel shows all users

---

## 🚨 Common Issues

### "Token expired" error
**Solution**: Token expired or invalid. Clear localStorage and login again:
```javascript
localStorage.clear();
window.location.href = '/login.html';
```

### CORS error
**Solution**: Make sure backend [server.js](../backend/server.js) has correct FRONTEND_URL:
```javascript
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:5500',
    credentials: true
};
app.use(cors(corsOptions));
```

### "Failed to fetch"
**Solution**: Backend not running or wrong API URL. Check:
1. Backend is running: `npm start`
2. API URL in [api-config.js](../js/api-config.js) is correct
3. Network tab in DevTools for actual error

### Database errors
**Solution**: Run migrations:
```bash
cd backend
npx prisma migrate reset
npx prisma migrate deploy
npm run seed
```

---

## 📝 Checklist

- [ ] Add `api-config.js` script to all HTML pages
- [ ] Update login.html to use `AuthAPI.login()`
- [ ] Update signup.html to use `AuthAPI.register()`
- [ ] Update index.html to use `UserAPI.getProfile()`
- [ ] Update history.html to use `UserAPI.getHistory()`
- [ ] Update deposit.html to use `DepositAPI.submit()`
- [ ] Update withdraw.html to use `WithdrawalAPI.submit()`
- [ ] Update admin panel to use `AdminAPI.*` methods
- [ ] Add `requireAuth()` to protected pages
- [ ] Test all flows locally before deployment
- [ ] Deploy backend to Railway
- [ ] Update VITE_API_URL in Vercel
- [ ] Test production deployment

---

## 🎯 Next Steps

1. **Local Testing**: Follow "Testing the Migration" section
2. **Deploy Backend**: See [RAILWAY_DEPLOYMENT.md](../RAILWAY_DEPLOYMENT.md)
3. **Update Frontend**: Set VITE_API_URL in Vercel
4. **Seed Admin**: Run `npm run seed` on Railway
5. **Go Live**: Test complete user flow

---

**Migration Status**: Ready for implementation  
**Estimated Time**: 2-3 hours  
**Difficulty**: Medium
