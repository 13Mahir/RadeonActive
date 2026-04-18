// src/components/MainLayout.tsx
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar, { RoleContext, UserRole } from './TopBar';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function MainLayout() {
  const { user } = useAuth();
  // Initialize role from authenticated user; allow TopBar switcher to override for demo purposes
  const [role, setRole] = useState<UserRole>((user?.role as UserRole) || 'DFO');

  // Keep role in sync when auth user changes (e.g. on page refresh)
  useEffect(() => {
    if (user?.role) {
      setRole(user.role as UserRole);
    }
  }, [user?.role]);

  return (
    <RoleContext.Provider value={{ role, setRole }}>
      <div className="flex min-h-screen bg-surface">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <TopBar />
          <div className="flex-1 overflow-y-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </RoleContext.Provider>
  );
}
