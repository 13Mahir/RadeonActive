/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import InvestigationQueue from './pages/InvestigationQueue';
import SchemeVerification from './pages/SchemeVerification';
import AuditLedger from './pages/AuditLedger';
import Analytics from './pages/Analytics';
import DataUpload from './pages/DataUpload';
import VerifierDashboard from './pages/VerifierDashboard';
import AuditorDashboard from './pages/AuditorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/UserManagement';
import SettingsPage from './pages/SettingsPage';
import LandingPage from './pages/LandingPage';
import SignUpPage from './pages/SignUpPage';
import CitizenPortal from './pages/CitizenPortal';
import SupportPage from './pages/SupportPage';

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes — no auth needed */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/citizen-portal" element={<CitizenPortal />} />

            {/* All other routes require authentication */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={
                <ProtectedRoute allowedRoles={['DFO']}>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="investigation" element={
                <ProtectedRoute allowedRoles={['DFO', 'ADMIN']}>
                  <InvestigationQueue />
                </ProtectedRoute>
              } />
              <Route path="verification" element={
                <ProtectedRoute allowedRoles={['DFO', 'VERIFIER']}>
                  <SchemeVerification />
                </ProtectedRoute>
              } />
              <Route path="ledger" element={
                <ProtectedRoute allowedRoles={['DFO', 'AUDITOR']}>
                  <AuditLedger />
                </ProtectedRoute>
              } />
              <Route path="analytics" element={
                <ProtectedRoute allowedRoles={['DFO', 'ADMIN', 'AUDITOR']}>
                  <Analytics />
                </ProtectedRoute>
              } />
              <Route path="upload" element={
                <ProtectedRoute allowedRoles={['DFO', 'ADMIN']}>
                  <DataUpload />
                </ProtectedRoute>
              } />
              <Route path="verifier" element={
                <ProtectedRoute allowedRoles={['VERIFIER', 'ADMIN', 'DFO']}>
                  <VerifierDashboard />
                </ProtectedRoute>
              } />
              <Route path="auditor" element={
                <ProtectedRoute allowedRoles={['AUDITOR', 'ADMIN']}>
                  <AuditorDashboard />
                </ProtectedRoute>
              } />
              <Route path="admin" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="users" element={
                <ProtectedRoute allowedRoles={['DFO', 'ADMIN']}>
                  <UserManagement />
                </ProtectedRoute>
              } />
              <Route path="support" element={<SupportPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}
