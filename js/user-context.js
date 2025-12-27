/**
 * User Context Manager
 * Provides real user data from API to all pages
 * Replaces userData.js simulation data
 */

let cachedUser = null;

export async function getRealUser() {
  try {
    // If already cached in this session, return it
    if (cachedUser && cachedUser.spotBalance !== undefined) {
      return cachedUser;
    }
    
    // First verify authentication
    const authResponse = await AuthAPI.verify();
    const authUser = authResponse.user || authResponse;
    
    if (!authUser || !authUser.id) {
      // Not authenticated
      return null;
    }
    
    // Then fetch full profile with all balance fields
    try {
      const profileResponse = await UserAPI.getProfile();
      cachedUser = profileResponse.user || profileResponse;
    } catch (error) {
      console.warn('Could not fetch full profile, using auth data:', error.message);
      cachedUser = authUser;
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
