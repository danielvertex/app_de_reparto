import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';

import { useTrip } from './hooks/useTrip';
import { useToast } from './hooks/useToast';

import NavigationBar from './components/NavigationBar';
import OfflineBanner from './components/OfflineBanner';
import Toast from './components/ui/Toast';

import Dashboard from './pages/Dashboard';
import AddPoint from './pages/AddPoint';
import OriginConfig from './pages/OriginConfig';
import FuelConfig from './pages/FuelConfig';
import Summary from './pages/Summary';
import HistoryPage from './pages/History';
import ReturnConfig from './pages/ReturnConfig';

export default function App() {
  const { state, loading, refresh } = useTrip();
  const { toast, show: showToast } = useToast();
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
    <BrowserRouter>
      {!isOnline && <OfflineBanner />}
      {toast && <Toast message={toast.message} variant={toast.variant} />}

      <Routes>
        <Route path="/" element={<Dashboard state={state} refresh={refresh} showToast={showToast} />} />
        <Route path="/add-point" element={<AddPoint refresh={refresh} showToast={showToast} />} />
        <Route path="/origin" element={<OriginConfig state={state} refresh={refresh} showToast={showToast} />} />
        <Route path="/fuel" element={<FuelConfig state={state} refresh={refresh} showToast={showToast} />} />
        <Route path="/summary" element={<Summary state={state} />} />
        <Route path="/history" element={<HistoryPage showToast={showToast} />} />
        <Route path="/return" element={<ReturnConfig refresh={refresh} showToast={showToast} />} />
      </Routes>

      <NavigationBar />
    </BrowserRouter>
  );
}
