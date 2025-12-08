import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import OrganizationsList from './pages/Organizations/OrganizationsList';
import OrganizationDetail from './pages/Organizations/OrganizationDetail';
import CreateOrganization from './pages/Organizations/CreateOrganization';
import EditOrganization from './pages/Organizations/EditOrganization';
import UsersList from './pages/Users/UsersList';
import CreateUser from './pages/Users/CreateUser';
import EditUser from './pages/Users/EditUser';
import PlansList from './pages/Plans/PlansList';
import CreatePlan from './pages/Plans/CreatePlan';
import EditPlan from './pages/Plans/EditPlan';
import SystemStatus from './pages/Monitoring/SystemStatus';
import Logs from './pages/Monitoring/Logs';
import Performance from './pages/Monitoring/Performance';
import UsageReports from './pages/Reports/UsageReports';
import FinancialReports from './pages/Reports/FinancialReports';
import SupportReports from './pages/Reports/SupportReports';
import GeneralSettings from './pages/Settings/GeneralSettings';
import EmailSettings from './pages/Settings/EmailSettings';
import SecuritySettings from './pages/Settings/SecuritySettings';
import IntegrationSettings from './pages/Settings/IntegrationSettings';
import AuditLogs from './pages/Audit/AuditLogs';
import ChangeHistory from './pages/Audit/ChangeHistory';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />

          {/* Organizations */}
          <Route path="organizations">
            <Route index element={<OrganizationsList />} />
            <Route path="new" element={<CreateOrganization />} />
            <Route path=":id" element={<OrganizationDetail />} />
            <Route path=":id/edit" element={<EditOrganization />} />
          </Route>

          {/* Users */}
          <Route path="users">
            <Route index element={<UsersList />} />
            <Route path="new" element={<CreateUser />} />
            <Route path=":id/edit" element={<EditUser />} />
          </Route>

          {/* Plans */}
          <Route path="plans">
            <Route index element={<PlansList />} />
            <Route path="new" element={<CreatePlan />} />
            <Route path=":id/edit" element={<EditPlan />} />
          </Route>

          {/* Monitoring */}
          <Route path="monitoring">
            <Route index element={<SystemStatus />} />
            <Route path="logs" element={<Logs />} />
            <Route path="performance" element={<Performance />} />
          </Route>

          {/* Reports */}
          <Route path="reports">
            <Route index element={<UsageReports />} />
            <Route path="financial" element={<FinancialReports />} />
            <Route path="support" element={<SupportReports />} />
          </Route>

          {/* Settings */}
          <Route path="settings">
            <Route index element={<GeneralSettings />} />
            <Route path="email" element={<EmailSettings />} />
            <Route path="security" element={<SecuritySettings />} />
            <Route path="integrations" element={<IntegrationSettings />} />
          </Route>

          {/* Audit */}
          <Route path="audit">
            <Route index element={<AuditLogs />} />
            <Route path="history" element={<ChangeHistory />} />
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
