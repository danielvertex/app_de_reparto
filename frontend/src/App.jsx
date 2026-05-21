import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import { useTrip } from './hooks/useTrip';
import { useToast } from './hooks/useToast';

import NavigationBar from './components/NavigationBar';
import OfflineBanner from './components/OfflineBanner';
import Toast from './components/ui/Toast';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AddPoint from './pages/AddPoint';
import OriginConfig from './pages/OriginConfig';
import FuelConfig from './pages/FuelConfig';
import Summary from './pages/Summary';
import HistoryPage from './pages/History';
import ReturnConfig from './pages/ReturnConfig';
import UsersManagement from './pages/UsersManagement';

/**
 * Shell autenticado — solo se monta cuando el usuario tiene sesión activa.
 * Esto evita que useTrip() haga un request 401 antes de redirigir a /login.
 */
function AuthenticatedShell() {
  const { state, loading, refresh } = useTrip();
  const { toast, show: showToast } = useToast();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
        <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🚚</div>
          <p style={{ fontSize: '1.125rem', fontWeight: 500 }}>Cargando Entregas...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {toast && <Toast message={toast.message} variant={toast.variant} />}

      <Routes>
        {/* Rutas protegidas — cualquier usuario autenticado */}
        <Route path="/" element={<Dashboard state={state} refresh={refresh} showToast={showToast} />} />
        <Route path="/add-point" element={<AddPoint refresh={refresh} showToast={showToast} />} />
        <Route path="/origin" element={<OriginConfig state={state} refresh={refresh} showToast={showToast} />} />
        <Route path="/fuel" element={<FuelConfig state={state} refresh={refresh} showToast={showToast} />} />
        <Route path="/summary" element={<Summary state={state} />} />
        <Route path="/history" element={<HistoryPage showToast={showToast} />} />
        <Route path="/return" element={<ReturnConfig refresh={refresh} showToast={showToast} />} />

        {/* Ruta protegida — solo owner */}
        <Route path="/users" element={<ProtectedRoute requiredRole="owner"><UsersManagement showToast={showToast} /></ProtectedRoute>} />

        {/* Fallback: cualquier otra ruta va al dashboard */}
        <Route path="*" element={<Dashboard state={state} refresh={refresh} showToast={showToast} />} />
      </Routes>

      <NavigationBar />
    </>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Verificando sesión
  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
        <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔐</div>
          <p style={{ fontSize: '1.125rem', fontWeight: 500 }}>Verificando sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {!isOnline && <OfflineBanner />}

      {isAuthenticated ? (
        <AuthenticatedShell />
      ) : (
        <Routes>
          <Route path="*" element={<Login />} />
        </Routes>
      )}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
