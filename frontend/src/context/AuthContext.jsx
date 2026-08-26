import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authService } from '../services/authService';
import { setAccessToken, setActiveBusinessId, getActiveBusinessId } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [businesses, setBusinesses] = useState([]); // [{businessId, name, role, permissions, ...}]
  const [currentBusinessId, setCurrentBusinessId] = useState(null);
  const [loading, setLoading] = useState(true); // initial session bootstrap
  const [authChecked, setAuthChecked] = useState(false);

  const applySession = useCallback((data) => {
    setAccessToken(data.accessToken || null);
    setUser(data.user);
    setBusinesses(data.businesses || []);

    const stored = localStorage.getItem('lastBusinessId');
    const validStored = data.businesses?.find((b) => b.businessId === stored);
    const chosen = validStored ? stored : data.businesses?.[0]?.businessId || null;

    setCurrentBusinessId(chosen);
    setActiveBusinessId(chosen);
    if (chosen) localStorage.setItem('lastBusinessId', chosen);
  }, []);

  const bootstrap = useCallback(async () => {
    setLoading(true);
    try {
      // Try to refresh silently using the httpOnly cookie, then fetch profile.
      const refreshRes = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/refresh`,
        { method: 'POST', credentials: 'include' }
      );
      if (refreshRes.ok) {
        const { accessToken } = await refreshRes.json();
        setAccessToken(accessToken);
        const me = await authService.getMe();
        applySession({ ...me, accessToken });
      }
    } catch (err) {
      // Not logged in - that's fine, user will see the login page.
    } finally {
      setAuthChecked(true);
      setLoading(false);
    }
  }, [applySession]);

  useEffect(() => {
    bootstrap();
    const onExpired = () => {
      setUser(null);
      setBusinesses([]);
      setCurrentBusinessId(null);
    };
    window.addEventListener('auth:session-expired', onExpired);
    return () => window.removeEventListener('auth:session-expired', onExpired);
  }, [bootstrap]);

  const login = async (credentials) => {
    const data = await authService.login(credentials);
    applySession(data);
    return data;
  };

  const register = async (payload) => {
    const data = await authService.register(payload);
    applySession(data);
    return data;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setAccessToken(null);
      setActiveBusinessId(null);
      setUser(null);
      setBusinesses([]);
      setCurrentBusinessId(null);
      localStorage.removeItem('lastBusinessId');
    }
  };

  const switchBusiness = (businessId) => {
    const exists = businesses.some((b) => b.businessId === businessId);
    if (!exists) return;
    setCurrentBusinessId(businessId);
    setActiveBusinessId(businessId);
    localStorage.setItem('lastBusinessId', businessId);
  };

  const currentMembership = businesses.find((b) => b.businessId === currentBusinessId) || null;

  const hasPermission = (permission) => {
    if (!currentMembership) return false;
    if (currentMembership.role === 'owner') return true;
    return currentMembership.permissions?.includes(permission);
  };

  const value = {
    user,
    businesses,
    currentBusinessId,
    currentMembership,
    role: currentMembership?.role || null,
    hasPermission,
    loading,
    authChecked,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    switchBusiness,
    refreshSession: bootstrap,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
