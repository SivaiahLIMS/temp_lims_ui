import React, { Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { useAuthStore } from '../store/authStore';
import PermissionGuard from '../components/PermissionGuard';
import MainLayout from '../layouts/MainLayout';
import LoginPage from '../pages/auth/LoginPage';
import { PrivacyPage, TermsPage, SupportPage, ApiDocsPage } from '../pages/legal/LegalPages';

const DashboardPage = React.lazy(() => import('../pages/dashboard/DashboardPage'));
const WorksheetsPage = React.lazy(() => import('../pages/worksheets/WorksheetsPage'));
const WorksheetExecutionPage = React.lazy(() => import('../pages/worksheets/WorksheetExecutionPage'));
const WorksheetReviewPage = React.lazy(() => import('../pages/worksheets/WorksheetReviewPage'));
const DocumentsPage = React.lazy(() => import('../pages/documents/DocumentsPage'));
const DocumentDetailPage = React.lazy(() => import('../pages/documents/DocumentDetailPage'));
const DocumentExecutionPage = React.lazy(() => import('../pages/documents/DocumentExecutionPage'));
const SamplesPage = React.lazy(() => import('../pages/samples/SamplesPage'));
const SampleLifecyclePage = React.lazy(() => import('../pages/samples/SampleLifecyclePage'));
const ChemicalsPage = React.lazy(() => import('../pages/chemicals/ChemicalsPage'));
const InstrumentsPage = React.lazy(() => import('../pages/instruments/InstrumentsPage'));
const CalibrationsPage = React.lazy(() => import('../pages/instruments/CalibrationsPage'));
const InstrumentReservationPage = React.lazy(() => import('../pages/instruments/InstrumentReservationPage'));
const DeviationsPage = React.lazy(() => import('../pages/qa/DeviationsPage'));
const OOSPage = React.lazy(() => import('../pages/qa/OOSPage'));
const CapaPage = React.lazy(() => import('../pages/qa/CapaPage'));
const CertificateOfAnalysisPage = React.lazy(() => import('../pages/qa/CertificateOfAnalysisPage'));
const EmployeesPage = React.lazy(() => import('../pages/employees/EmployeesPage'));
const TrainingPage = React.lazy(() => import('../pages/employees/TrainingPage'));
const UsersPage = React.lazy(() => import('../pages/admin/UsersPage'));
const RolesPage = React.lazy(() => import('../pages/admin/RolesPage'));
const PermissionsPage = React.lazy(() => import('../pages/admin/PermissionsPage'));
const ELNPage = React.lazy(() => import('../pages/eln/ELNPage'));
const ContainersPage = React.lazy(() => import('../pages/inventory/ContainersPage'));
const StoragePage = React.lazy(() => import('../pages/inventory/StoragePage'));
const OrderRequestsPage = React.lazy(() => import('../pages/procurement/OrderRequestsPage'));
const SuppliersPage = React.lazy(() => import('../pages/procurement/SuppliersPage'));
const ProductsPage = React.lazy(() => import('../pages/products/ProductsPage'));
const TasksPage = React.lazy(() => import('../pages/tasks/TasksPage'));
const AnalyticsDashboardPage = React.lazy(() => import('../pages/analytics/AnalyticsDashboardPage'));
const AnalyticsPage = React.lazy(() => import('../pages/analytics/AnalyticsPage'));
const AIPage = React.lazy(() => import('../pages/analytics/AIPage'));
const AuditPage = React.lazy(() => import('../pages/audit/AuditPage'));
const StabilityStudiesPage = React.lazy(() => import('../pages/stability/StabilityStudiesPage'));
const ProfilePage = React.lazy(() => import('../pages/profile/ProfilePage'));
const SettingsPage = React.lazy(() => import('../pages/profile/SettingsPage'));
const NotFoundPage = React.lazy(() => import('../pages/NotFoundPage'));
const UnauthorizedPage = React.lazy(() => import('../pages/UnauthorizedPage'));

function PageLoader() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <CircularProgress />
    </Box>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

function Guard({ permission, children }: { permission: string; children: React.ReactNode }) {
  return (
    <PermissionGuard permission={permission}>
      <Lazy>{children}</Lazy>
    </PermissionGuard>
  );
}

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/unauthorized', element: <Lazy><UnauthorizedPage /></Lazy> },
  { path: '/legal/privacy', element: <PrivacyPage /> },
  { path: '/legal/terms', element: <TermsPage /> },
  { path: '/legal/support', element: <SupportPage /> },
  { path: '/legal/api-docs', element: <ApiDocsPage /> },
  {
    path: '/',
    element: <RequireAuth><MainLayout /></RequireAuth>,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Lazy><DashboardPage /></Lazy> },
      { path: 'tasks', element: <Lazy><TasksPage /></Lazy> },
      { path: 'profile', element: <Lazy><ProfilePage /></Lazy> },
      { path: 'settings', element: <Lazy><SettingsPage /></Lazy> },

      { path: 'worksheets', element: <Guard permission="WORKSHEET_VIEW"><WorksheetsPage /></Guard> },
      { path: 'worksheets/:id/execute', element: <Guard permission="WORKSHEET_VIEW"><WorksheetExecutionPage /></Guard> },
      { path: 'worksheets/:id/review', element: <Guard permission="WORKSHEET_VIEW"><WorksheetReviewPage /></Guard> },
      { path: 'worksheets/:id', element: <Guard permission="WORKSHEET_VIEW"><WorksheetExecutionPage /></Guard> },

      { path: 'documents', element: <Guard permission="DOCUMENT_VIEW"><DocumentsPage /></Guard> },
      { path: 'documents/:id', element: <Guard permission="DOCUMENT_VIEW"><DocumentDetailPage /></Guard> },
      { path: 'documents/:docId/executions/:execId', element: <Guard permission="DOCUMENT_VIEW"><DocumentExecutionPage /></Guard> },

      { path: 'eln', element: <Guard permission="ELN_VIEW"><ELNPage /></Guard> },

      { path: 'samples', element: <Guard permission="SAMPLE_VIEW"><SamplesPage /></Guard> },
      { path: 'samples/lifecycle', element: <Guard permission="SAMPLE_VIEW"><SampleLifecyclePage /></Guard> },

      { path: 'chemicals', element: <Guard permission="CHEMICAL_VIEW"><ChemicalsPage /></Guard> },
      { path: 'containers', element: <Guard permission="CONTAINER_VIEW"><ContainersPage /></Guard> },
      { path: 'storage', element: <Guard permission="STORAGE_VIEW"><StoragePage /></Guard> },

      { path: 'instruments', element: <Guard permission="INSTRUMENT_VIEW"><InstrumentsPage /></Guard> },
      { path: 'calibrations', element: <Guard permission="CALIBRATION_VIEW"><CalibrationsPage /></Guard> },
      { path: 'instruments/reservations', element: <Guard permission="INSTRUMENT_VIEW"><InstrumentReservationPage /></Guard> },

      { path: 'qa/deviations', element: <Guard permission="DEVIATION_VIEW"><DeviationsPage /></Guard> },
      { path: 'qa/oos', element: <Guard permission="OOS_VIEW"><OOSPage /></Guard> },
      { path: 'qa/capa', element: <Guard permission="CAPA_VIEW"><CapaPage /></Guard> },
      { path: 'qa/coa', element: <Guard permission="COA_VIEW"><CertificateOfAnalysisPage /></Guard> },

      { path: 'stability', element: <Guard permission="STABILITY_VIEW"><StabilityStudiesPage /></Guard> },

      { path: 'employees', element: <Guard permission="EMPLOYEE_VIEW"><EmployeesPage /></Guard> },
      { path: 'training', element: <Guard permission="TRAINING_VIEW"><TrainingPage /></Guard> },

      { path: 'orders', element: <Guard permission="ORDER_VIEW"><OrderRequestsPage /></Guard> },
      { path: 'suppliers', element: <Guard permission="SUPPLIER_VIEW"><SuppliersPage /></Guard> },

      { path: 'products', element: <Guard permission="PRODUCT_VIEW"><ProductsPage /></Guard> },

      { path: 'analytics', element: <Guard permission="ANALYTICS_VIEW"><AnalyticsDashboardPage /></Guard> },
      { path: 'analytics/legacy', element: <Guard permission="ANALYTICS_VIEW"><AnalyticsPage /></Guard> },
      { path: 'ai', element: <Guard permission="ANALYTICS_VIEW"><AIPage /></Guard> },

      { path: 'audit', element: <Guard permission="AUDIT_VIEW"><AuditPage /></Guard> },

      { path: 'admin/users', element: <Guard permission="USER_VIEW"><UsersPage /></Guard> },
      { path: 'admin/roles', element: <Guard permission="ROLE_VIEW"><RolesPage /></Guard> },
      { path: 'admin/permissions', element: <Guard permission="PERMISSION_VIEW"><PermissionsPage /></Guard> },

      { path: 'users', element: <Navigate to="/admin/users" replace /> },
      { path: '*', element: <Lazy><NotFoundPage /></Lazy> },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
