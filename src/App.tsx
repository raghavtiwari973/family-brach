import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { type ReactNode } from 'react';
import { I18nProvider } from '@/context/I18nContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Layout } from '@/components/Layout';
import { HomePage } from '@/pages/HomePage';
import { TreePage } from '@/pages/TreePage';
import { PersonProfilePage } from '@/pages/PersonProfilePage';
import { LoginPage } from '@/pages/LoginPage';
import { AdminDashboardPage } from '@/pages/AdminDashboardPage';
import { AddMemberPage } from '@/pages/AddMemberPage';
import { EditMemberPage } from '@/pages/EditMemberPage';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-stone-300 border-t-amber-700" />
      </div>
    );
  }
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout><HomePage /></Layout>} />
      <Route path="/tree" element={<Layout><TreePage /></Layout>} />
      <Route path="/person/:id" element={<Layout><PersonProfilePage /></Layout>} />
      <Route path="/login" element={<Layout><LoginPage /></Layout>} />
      <Route path="/admin" element={<ProtectedRoute><Layout><AdminDashboardPage /></Layout></ProtectedRoute>} />
      <Route path="/admin/add" element={<ProtectedRoute><Layout><AddMemberPage /></Layout></ProtectedRoute>} />
      <Route path="/admin/edit/:id" element={<ProtectedRoute><Layout><EditMemberPage /></Layout></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </I18nProvider>
  );
}
