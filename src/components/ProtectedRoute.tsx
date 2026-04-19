// src/components/ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Props {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-black/20 border-t-black rounded-full animate-spin" />
          <span className="text-[11px] font-black font-label uppercase tracking-widest text-on-surface-variant">
            Verifying session...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/landing" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    const ROLE_HOME: Record<string, string> = {
      DFO: '/dashboard',
      VERIFIER: '/dashboard/verifier',
      AUDITOR: '/dashboard/auditor',
      ADMIN: '/dashboard/admin'
    };
    return <Navigate to={ROLE_HOME[user.role] || '/dashboard'} replace />;
  }

  return <>{children}</>;
}
