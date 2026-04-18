import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar, { RoleContext, UserRole } from './TopBar';
import { useState } from 'react';

export default function MainLayout() {
  const [role, setRole] = useState<UserRole>('DFO');

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
