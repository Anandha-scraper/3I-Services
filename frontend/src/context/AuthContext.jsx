import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiUrl } from '../utils/api';

const AuthContext = createContext(null);

function getStoredUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);

  const login = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = useCallback(async () => {
    try {
      // Tell the server to invalidate the session and clear the cookie
      await fetch(apiUrl('/api/auth/logout'), { method: 'POST', credentials: 'include' });
    } catch {
      /* clear local state regardless of network errors */
    }
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  // Auto-logout when any apiFetch receives a 401
  useEffect(() => {
    const handle = () => logout();
    window.addEventListener('auth:unauthorized', handle);
    return () => window.removeEventListener('auth:unauthorized', handle);
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
