import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import api from '../services/api';

interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  createdAt?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

const TOKEN_KEY = 'kaoyan-token';

function loadToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function saveToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch { /* ignore */ }
}

function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch { /* ignore */ }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(loadToken);
  const [loading, setLoading] = useState(true);

  // On mount, if token exists, fetch user info
  useEffect(() => {
    const stored = loadToken();
    if (stored) {
      api.get('/auth/me')
        .then((res) => {
          if (res.data.success) setUser(res.data.data);
          else clearToken();
        })
        .catch(() => clearToken())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await api.post('/auth/login', { username, password });
    const { token: newToken, user: newUser } = res.data.data;
    saveToken(newToken);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const register = useCallback(async (username: string, email: string, password: string) => {
    const res = await api.post('/auth/register', { username, email, password });
    const { token: newToken, user: newUser } = res.data.data;
    saveToken(newToken);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
