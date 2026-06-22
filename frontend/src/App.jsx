import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, ProtectedRoute } from './context/AuthContext';
import Layout from './components/Layout';

import LoginPage from './pages/LoginPage';
import LocationSelectPage from './pages/LocationSelectPage';
import DashboardPage from './pages/DashboardPage';
import ReportPage from './pages/ReportPage';
import LocationsPage from './pages/master/LocationsPage';
import CompaniesPage from './pages/master/CompaniesPage';
import JobTitlesPage from './pages/master/JobTitlesPage';
import PreJobSheetsPage from './pages/transaction/PreJobSheetsPage';
import PreJobSheetFormPage from './pages/transaction/PreJobSheetFormPage';
import JobSheetsPage from './pages/transaction/JobSheetsPage';
import JobSheetFormPage from './pages/transaction/JobSheetFormPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/select-location"
            element={
              <ProtectedRoute requireLocation={false}>
                <LocationSelectPage />
              </ProtectedRoute>
            }
          />

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/master/locations" element={<LocationsPage />} />
            <Route path="/master/companies" element={<CompaniesPage />} />
            <Route path="/master/job-titles" element={<JobTitlesPage />} />
            <Route path="/transaction/pre-job-sheets" element={<PreJobSheetsPage />} />
            <Route path="/transaction/pre-job-sheets/new" element={<PreJobSheetFormPage />} />
            <Route path="/transaction/pre-job-sheets/:id" element={<PreJobSheetFormPage />} />
            <Route path="/transaction/job-sheets" element={<JobSheetsPage />} />
            <Route path="/transaction/job-sheets/:id" element={<JobSheetFormPage />} />
            <Route path="/report" element={<ReportPage />} />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
