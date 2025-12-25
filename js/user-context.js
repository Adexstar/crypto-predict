/**
 * User Context Manager
 * Provides real user data from API to all pages
 * Replaces userData.js simulation data
 */

let cachedUser = null;

export async function getRealUser() {
  try {
    // If already cached in this session, return it
    if (cachedUser) {
      return cachedUser;
    }
    
    // Fetch from API
    const response = await AuthAPI.verify();
    cachedUser = response.user || response;
    
    if (!cachedUser || !cachedUser.id) {
      // Not authenticated
      return null;
    }
    
    return cachedUser;
  } catch (error) {
    console.error('Failed to get user:', error);
    return null;
  }
}

export function getCurrentUser() {
  return cachedUser;
}

export function setCurrentUser(user) {
  cachedUser = user;
}

export function clearUser() {
  cachedUser = null;
}

/**
 * Ensure user is authenticated, redirect to login if not
 */
export async function ensureAuthenticated() {
  const user = await getRealUser();
  if (!user) {
    window.location.href = '/login.html';
  }
  return user;
}
