/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './components/MainLayout';
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="investigation" element={<InvestigationQueue />} />
          <Route path="verification" element={<SchemeVerification />} />
          <Route path="ledger" element={<AuditLedger />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="upload" element={<DataUpload />} />
          <Route path="verifier" element={<VerifierDashboard />} />
          <Route path="auditor" element={<AuditorDashboard />} />
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
