// Configuration management for environment variables
// This file reads from environment variables set in Vercel or .env file

const config = {
  // System mode
  systemMode: import.meta.env?.VITE_SYSTEM_MODE || 'SIMULATION_ONLY',
  
  // Admin credentials (fallback to empty - must be set in environment)
  adminEmail: import.meta.env?.VITE_ADMIN_EMAIL || '',
  adminPassword: import.meta.env?.VITE_ADMIN_PASSWORD || '',
  
  // Default user password for demo accounts
  defaultUserPassword: import.meta.env?.VITE_DEFAULT_USER_PASSWORD || '',
  
  // Admin panel password
  adminPanelPassword: import.meta.env?.VITE_ADMIN_PANEL_PASSWORD || '',
  
  // Check if running in development
  isDevelopment: import.meta.env?.DEV || false,
  
  // Check if credentials are configured
  isConfigured() {
    return this.adminEmail && this.adminPassword;
  }
};

// For non-module scripts (vanilla JS), expose via window
if (typeof window !== 'undefined') {
  window.APP_CONFIG = config;
}

export default config;
