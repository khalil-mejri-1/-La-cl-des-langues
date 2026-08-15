import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

  const loginUser = (userData) => {
    setUser(userData);
    localStorage.setItem('app_user', JSON.stringify(userData));
  };

  const logoutUser = () => {
    setUser(null);
    localStorage.removeItem('app_user');
  };

  const updateCurrentUser = useCallback((updatedFields) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updatedFields };
      localStorage.setItem('app_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Sync latest user profile & roles from MongoDB in real-time
  const refreshUser = useCallback(async () => {
    const userId = user?.id || user?._id;
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/clients/${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser((prev) => {
            if (!prev) return data.user;
            const hasChanged =
              prev.role !== data.user.role ||
              prev.status !== data.user.status ||
              JSON.stringify(prev.availableDays) !== JSON.stringify(data.user.availableDays) ||
              JSON.stringify(prev.timeSlots) !== JSON.stringify(data.user.timeSlots);

            if (hasChanged) {
              const updated = { ...prev, ...data.user };
              localStorage.setItem('app_user', JSON.stringify(updated));
              return updated;
            }
            return prev;
          });
        }
      }
    } catch (err) {
      // Silent error during background sync
    }
  }, [user?.id, user?._id]);

  useEffect(() => {
    // Initial sync
    if (user?.id || user?._id) {
      refreshUser();
    }

    // Window focus sync
    const handleFocus = () => {
      refreshUser();
    };

    // Custom role update event listener
    const handleRoleUpdate = (event) => {
      const { clientId, role, status } = event.detail || {};
      const currentId = user?.id || user?._id;
      if (clientId && currentId && String(clientId) === String(currentId)) {
        updateCurrentUser({
          ...(role !== undefined ? { role } : {}),
          ...(status !== undefined ? { status } : {}),
        });
      } else {
        refreshUser();
      }
    };

    // Storage event for multi-tab sync
    const handleStorage = (e) => {
      if (e.key === 'app_user') {
        try {
          setUser(e.newValue ? JSON.parse(e.newValue) : null);
        } catch {}
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('auth_role_updated', handleRoleUpdate);
    window.addEventListener('storage', handleStorage);

    // Periodic live sync interval (every 3 seconds)
    const interval = setInterval(() => {
      refreshUser();
    }, 3000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('auth_role_updated', handleRoleUpdate);
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, [user?.id, user?._id, refreshUser, updateCurrentUser]);

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
