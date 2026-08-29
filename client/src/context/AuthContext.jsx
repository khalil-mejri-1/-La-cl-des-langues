import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE_URL } from '../config';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('app_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Track latest user synchronously in ref to prevent async race conditions
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Track in-flight fetch request controller
  const abortControllerRef = useRef(null);

  const loginUser = useCallback((userData) => {
    // Abort any ongoing background sync request from a previous session
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    userRef.current = userData;
    setUser(userData);
    try {
      localStorage.setItem('app_user', JSON.stringify(userData));
      // Clear previous user session caches
      localStorage.removeItem('admin_sessions_cache');
      localStorage.removeItem('admin_latest_booked_session');
    } catch {}

    // Dispatch login event
    window.dispatchEvent(new CustomEvent('app_user_logged_in', { detail: { user: userData } }));
  }, []);

  const logoutUser = useCallback(() => {
    // 1. Immediately abort any in-flight background refresh/sync requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // 2. Synchronously clear user state and ref
    userRef.current = null;
    setUser(null);

    // 3. Clear all authentication and session caches from localStorage
    try {
      localStorage.removeItem('app_user');
      localStorage.removeItem('admin_sessions_cache');
      localStorage.removeItem('admin_latest_booked_session');
      localStorage.removeItem('student_notifications');
    } catch {}

    // 4. Disable Google auto-select so it doesn't auto-log back into the previous Google account
    try {
      if (window.google?.accounts?.id?.disableAutoSelect) {
        window.google.accounts.id.disableAutoSelect();
      }
    } catch {}

    // 5. Broadcast logout event to other listeners
    window.dispatchEvent(new CustomEvent('app_user_logged_out'));
  }, []);

  const updateCurrentUser = useCallback((updatedFields) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updatedFields };
      userRef.current = updated;
      try {
        localStorage.setItem('app_user', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  // Sync latest user profile & roles from MongoDB in real-time with race-condition guards
  const refreshUser = useCallback(async () => {
    const currentUser = userRef.current;
    const targetUserId = currentUser?.id || currentUser?._id;
    if (!targetUserId) return;

    // Abort previous in-flight sync request if still running
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch(`${API_BASE_URL}/api/clients/${targetUserId}`, {
        signal: controller.signal,
      });

      if (!res.ok) return;

      const data = await res.json();

      // Guard: If user logged out or changed while request was in-flight, discard response!
      if (!userRef.current) return;
      const activeId = String(userRef.current.id || userRef.current._id || '');
      const responseId = String(data?.user?.id || data?.user?._id || '');

      if (!responseId || activeId !== responseId) {
        // Discard stale response belonging to a previous or different user
        return;
      }

      if (data.user) {
        setUser((prev) => {
          // CRITICAL: NEVER resurrect a logged-out user or overwrite a different user!
          if (!prev) return null;
          const currentPrevId = String(prev.id || prev._id || '');
          if (currentPrevId !== responseId) return prev;

          const hasChanged =
            prev.role !== data.user.role ||
            prev.status !== data.user.status ||
            prev.picture !== data.user.picture ||
            JSON.stringify(prev.availableDays) !== JSON.stringify(data.user.availableDays) ||
            JSON.stringify(prev.timeSlots) !== JSON.stringify(data.user.timeSlots);

          if (hasChanged) {
            const updated = { ...prev, ...data.user };
            userRef.current = updated;
            try {
              localStorage.setItem('app_user', JSON.stringify(updated));
            } catch {}
            return updated;
          }
          return prev;
        });
      }
    } catch (err) {
      // If aborted, silent ignore; otherwise log
      if (err.name !== 'AbortError') {
        // Silent network catch
      }
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    // Initial sync only if user exists
    if (userRef.current?.id || userRef.current?._id) {
      refreshUser();
    }

    // Window focus sync
    const handleFocus = () => {
      if (userRef.current?.id || userRef.current?._id) {
        refreshUser();
      }
    };

    // Custom role/avatar update event listener
    const handleRoleUpdate = (event) => {
      const { clientId, role, status, picture } = event.detail || {};
      const currentId = userRef.current?.id || userRef.current?._id;
      if (clientId && currentId && String(clientId) === String(currentId)) {
        updateCurrentUser({
          ...(role !== undefined ? { role } : {}),
          ...(status !== undefined ? { status } : {}),
          ...(picture !== undefined ? { picture } : {}),
        });
      } else if (currentId) {
        refreshUser();
      }
    };

    // Multi-tab storage sync
    const handleStorage = (e) => {
      if (e.key === 'app_user') {
        try {
          const newUser = e.newValue ? JSON.parse(e.newValue) : null;
          userRef.current = newUser;
          setUser(newUser);
        } catch {
          userRef.current = null;
          setUser(null);
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('auth_role_updated', handleRoleUpdate);
    window.addEventListener('storage', handleStorage);

    // Periodic live sync interval (every 4 seconds) — only active when user is logged in
    const interval = setInterval(() => {
      if (userRef.current?.id || userRef.current?._id) {
        refreshUser();
      }
    }, 4000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('auth_role_updated', handleRoleUpdate);
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [refreshUser, updateCurrentUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loginUser,
        logoutUser,
        updateCurrentUser,
        refreshUser,
        isLoggedIn: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
