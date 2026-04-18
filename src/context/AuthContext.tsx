// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface AuthUser {
  id: number;
  username: string;
  full_name: string;
  role: 'DFO' | 'VERIFIER' | 'AUDITOR' | 'ADMIN';
  district: string;
  staff_id: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => {},
  logout: () => {},
  isAuthenticated: false
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount — restore session from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('dbt_auth_token');
    const storedUser = localStorage.getItem('dbt_auth_user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('dbt_auth_token');
        localStorage.removeItem('dbt_auth_user');
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
    localStorage.setItem('dbt_auth_token', data.token);
    localStorage.setItem('dbt_auth_user', JSON.stringify(data.user));
  };

  const logout = () => {
    const currentToken = localStorage.getItem('dbt_auth_token');
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
    localStorage.removeItem('dbt_auth_token');
    localStorage.removeItem('dbt_auth_user');
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      login,
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
