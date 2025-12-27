// API Configuration and Request Helper
// This replaces localStorage with proper API calls

const API_CONFIG = {
    // Production Railway backend URL
    PRODUCTION_URL: 'https://crypto-predict-production-0b73.up.railway.app',
    
    // Local development
    LOCAL_URL: 'http://localhost:3000',
    
    // Auto-detect environment
    get BASE_URL() {
        return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? this.LOCAL_URL
            : this.PRODUCTION_URL;
    },
    
    get API_URL() {
        return `${this.BASE_URL}/api`;
    }
};

// Token management
const TokenManager = {
    get() {
        return localStorage.getItem('authToken');
    },
    
    set(token) {
        localStorage.setItem('authToken', token);
    },
    
    clear() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser'); // Clear old localStorage data
    },
    
    isExpired() {
        const token = this.get();
        if (!token) return true;
        
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return Date.now() >= payload.exp * 1000;
        } catch (e) {
            return true;
        }
    }
};

// Main API request function
async function apiRequest(endpoint, options = {}) {
    const url = `${API_CONFIG.API_URL}${endpoint}`;
    
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    };
    
    // Add auth token if available
    const token = TokenManager.get();
    if (token && !TokenManager.isExpired()) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
        const response = await fetch(url, config);
        const text = await response.text();
        let data = {};
        try {
            data = text ? JSON.parse(text) : {};
        } catch (e) {
            data = { message: text };
        }

        if (!response.ok) {
            // If validation errors exist, format them
            if (Array.isArray(data.errors)) {
                const msgs = data.errors.map(err => err.msg || err.message || JSON.stringify(err)).join('; ');
                throw new Error(msgs || data.message || 'Request failed');
            }

            // Other structured errors
            throw new Error(data.error || data.message || `Request failed (${response.status})`);
        }

        return data;
    } catch (error) {
        console.error('API Request Error:', error);
        
        // Handle token expiration
        if (error.message.includes('token') || error.message.includes('expired')) {
            TokenManager.clear();
            window.location.href = '/login.html';
        }
        
        throw error;
    }
}

// Convenience methods for different HTTP verbs
const API = {
    get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return apiRequest(url, { method: 'GET' });
    },
    
    post(endpoint, data) {
        return apiRequest(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    patch(endpoint, data) {
        return apiRequest(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    },
    
    delete(endpoint) {
        return apiRequest(endpoint, {
            method: 'DELETE'
        });
    }
};

// Authentication API calls
const AuthAPI = {
    async login(email, password) {
        const response = await API.post('/auth/login', { email, password });
        
        if (response.token) {
            TokenManager.set(response.token);
        }
        
        return response;
    },
    
    async register(data) {
        const response = await API.post('/auth/register', data);
        
        if (response.token) {
            TokenManager.set(response.token);
        }
        
        return response;
    },
    
    async verify() {
        try {
            return await API.get('/auth/verify');
        } catch (error) {
            TokenManager.clear();
            throw error;
        }
    },
    
    logout() {
        TokenManager.clear();
        window.location.href = '/login.html';
    }
};

// User API calls
const UserAPI = {
    async getProfile() {
        return await API.get('/user/profile');
    },
    
    async getHistory(limit = 50, skip = 0) {
        return await API.get('/user/history', { limit, skip });
    },
    
    async updateProfile(data) {
        return await API.patch('/user/profile', data);
    }
};

// Deposit API calls
const DepositAPI = {
    async submit(depositData) {
        return await API.post('/deposits', depositData);
    },
    
    async getMyDeposits() {
        const response = await API.get('/deposits');
        return response.deposits || [];
    },
    
    // Admin only
    async getPending() {
        const response = await API.get('/deposits/pending');
        return response.deposits || [];
    },
    
    async confirm(depositId, amount) {
        return await API.post(`/deposits/${depositId}/confirm`, { amount });
    },
    
    async reject(depositId, reason) {
        return await API.post(`/deposits/${depositId}/reject`, { reason });
    }
};

// Withdrawal API calls
const WithdrawalAPI = {
    async submit(withdrawalData) {
        return await API.post('/withdrawals', withdrawalData);
    },
    
    async getMyWithdrawals() {
        const response = await API.get('/withdrawals');
        return response.withdrawals || [];
    },
    
    // Admin only
    async getPending() {
        const response = await API.get('/withdrawals/pending');
        return response.withdrawals || [];
    },
    
    async approve(withdrawalId) {
        return await API.post(`/withdrawals/${withdrawalId}/approve`);
    },
    
    async reject(withdrawalId, reason) {
        return await API.post(`/withdrawals/${withdrawalId}/reject`, { reason });
    }
};

// Transfer API calls
const TransferAPI = {
    async submit(transferData) {
        return await API.post('/transfers', transferData);
    },
    
    async getMyTransfers() {
        const response = await API.get('/transfers');
        return response.transfers || [];
    }
};

// Admin API calls
const AdminAPI = {
    async getUsers() {
        const response = await API.get('/admin/users');
        return response.users || [];
    },
    
    async getUser(userId) {
        const response = await API.get(`/admin/users/${userId}`);
        return response.user || response;
    },
    
    async setBalance(userId, balance) {
        return await API.post(`/admin/users/${userId}/set-balance`, { balance });
    },
    
    async injectProfit(userId, amount) {
        return await API.post(`/admin/users/${userId}/inject-profit`, { amount });
    },
    
    async freezeAccount(userId, freeze) {
        return await API.post(`/admin/users/${userId}/freeze`, { freeze });
    },
    
    async kycLock(userId, lock) {
        return await API.post(`/admin/users/${userId}/kyc-lock`, { lock });
    },
    
    async getAnalytics() {
        const response = await API.get('/admin/analytics');
        return response.analytics || response;
    },
    
    async getAuditLogs(limit = 100, skip = 0) {
        const response = await API.get('/admin/audit-logs', { limit, skip });
        return response.logs || [];
    }
};

// Support API calls
const SupportAPI = {
    async createTicket(ticketData) {
        return await API.post('/support', ticketData);
    },
    
    async getMyTickets() {
        return await API.get('/support');
    },
    
    // Admin only
    async getAllTickets(status = null) {
        return await API.get('/support/all', status ? { status } : {});
    },
    
    async updateStatus(ticketId, status) {
        return await API.patch(`/support/${ticketId}/status`, { status });
    },
    
    async addReply(ticketId, message) {
        return await API.post(`/support/${ticketId}/reply`, { message });
    }
};

// Announcement API calls
const AnnouncementAPI = {
    async getAll() {
        return await API.get('/announcements');
    },
    
    // Admin only
    async create(announcementData) {
        return await API.post('/announcements', announcementData);
    },
    
    async delete(announcementId) {
        return await API.delete(`/announcements/${announcementId}`);
    }
};

// Check if user is authenticated
async function checkAuth() {
    if (TokenManager.isExpired()) {
        TokenManager.clear();
        return false;
    }
    
    try {
        await AuthAPI.verify();
        return true;
    } catch (error) {
        TokenManager.clear();
        return false;
    }
}

// Redirect to login if not authenticated
async function requireAuth() {
    const isAuthenticated = await checkAuth();
    
    if (!isAuthenticated && !window.location.pathname.includes('login') && !window.location.pathname.includes('signup')) {
        window.location.href = '/login.html';
    }
}

// Export for use in other files
window.API_CONFIG = API_CONFIG;
window.TokenManager = TokenManager;
window.API = API;
window.AuthAPI = AuthAPI;
window.UserAPI = UserAPI;
window.DepositAPI = DepositAPI;
window.WithdrawalAPI = WithdrawalAPI;
window.TransferAPI = TransferAPI;
window.AdminAPI = AdminAPI;
window.SupportAPI = SupportAPI;
window.AnnouncementAPI = AnnouncementAPI;
window.checkAuth = checkAuth;
window.requireAuth = requireAuth;
