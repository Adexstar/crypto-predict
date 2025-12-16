// Production Configuration
// This file contains production-ready settings

export const PRODUCTION_CONFIG = {
  // Site Information
  siteName: '24h Trading Platform',
  siteUrl: window.location.origin,
  
  // Features
  enableRealTrading: false, // Set to true when connected to real exchange APIs
  enableKYC: true,
  enableWithdrawals: true,
  enableDeposits: true,
  
  // Limits
  minDeposit: 10,
  maxDeposit: 100000,
  minWithdrawal: 10,
  maxWithdrawal: 50000,
  
  // Withdrawal Settings
  withdrawalProcessingTime: '1-3 business days',
  withdrawalFee: 0, // 0% fee, or set percentage like 0.001 for 0.1%
  
  // Deposit Settings
  depositConfirmations: 3, // Number of blockchain confirmations required
  depositProcessingTime: '10-30 minutes',
  
  // Support
  supportEmail: 'support@24htrading.com',
  supportHours: '24/7',
  
  // Legal
  companyName: '24h Trading Platform',
  termsUrl: '/terms.html',
  privacyUrl: '/privacy.html',
  riskUrl: '/risk.html',
  
  // Display Settings
  hideDebugInfo: true,
  showProfessionalMessages: true,
  
  // API Endpoints (when implementing real backend)
  apiBaseUrl: '/api', // Change to your backend URL
  
  // Security
  sessionTimeout: 3600000, // 1 hour in milliseconds
  requireEmailVerification: false, // Set true when email system is ready
  require2FA: false, // Set true when 2FA is implemented
};

// Check if running in production mode
export function isProduction() {
  return window.location.hostname !== 'localhost' && 
         window.location.hostname !== '127.0.0.1';
}

// Get environment-appropriate message
export function getEnvironmentBanner() {
  if (isProduction()) {
    return null; // No banner in production
  }
  return {
    message: '⚠️ DEMO MODE - This is a simulation environment for educational purposes',
    type: 'warning'
  };
}

export default PRODUCTION_CONFIG;
