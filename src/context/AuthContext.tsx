// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface AuthUser {
  id: number;
  username: string;
  full_name: string;
  role: 'DFO' | 'VERIFIER' | 'AUDITOR' | 'ADMIN';
  district: string;
  staff_id: string;
  avatar_url?: string;   // Added for Google OAuth users
}

export interface GoogleProfile {
  google_id: string;
  email: string;
  full_name: string;
  avatar_url: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<{ registered: boolean; google_profile?: GoogleProfile }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => {},
  loginWithGoogle: async () => ({ registered: false }),
  logout: () => {},
  isAuthenticated: false
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount — restore session from sessionStorage
  useEffect(() => {
    const storedToken = sessionStorage.getItem('dbt_auth_token');
    const storedUser = sessionStorage.getItem('dbt_auth_user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        sessionStorage.removeItem('dbt_auth_token');
        sessionStorage.removeItem('dbt_auth_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<void> => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Login failed');
    }

    const data = await response.json();
    setToken(data.token);
    setUser(data.user);
    sessionStorage.setItem('dbt_auth_token', data.token);
    sessionStorage.setItem('dbt_auth_user', JSON.stringify(data.user));
  };

  const loginWithGoogle = async (credential: string): Promise<{ registered: boolean; google_profile?: GoogleProfile }> => {
    const response = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Google sign-in failed');
    }

    const data = await response.json();

    if (data.registered) {
      // Existing user — store session and we're done
      setToken(data.token);
      setUser(data.user);
      sessionStorage.setItem('dbt_auth_token', data.token);
      sessionStorage.setItem('dbt_auth_user', JSON.stringify(data.user));
      return { registered: true };
    }

    // New user — return the profile so LoginPage can show role selector
    return { registered: false, google_profile: data.google_profile };
  };

  const logout = () => {
    const currentToken = sessionStorage.getItem('dbt_auth_token');
    if (currentToken) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        }
      }).catch(() => {});
    }
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('dbt_auth_token');
    sessionStorage.removeItem('dbt_auth_user');
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      login,
      loginWithGoogle,
      logout,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
