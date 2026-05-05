import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Route, Fuel, RotateCw, Package, Navigation, MapPin } from 'lucide-react';
import DeliveryCard from '../components/DeliveryCard';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { markDeliveryStatus, removeDeliveryPoint, optimizeRoute, closeDay } from '../api/client';

export default function Dashboard({ state, refresh, showToast }) {
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

  if (!state) return null;

  const points = state.delivery_points || [];
  const origin = state.origin || {};
  const gmaps = state.gmaps_link || {};
  const route = state.optimized_route || {};

  const handleMarkStatus = async (id, status) => {
    try {
      const res = await markDeliveryStatus(id, { status });
      showToast(res.message, 'success');
      refresh();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleRemove = async (id) => {
    try {
      const res = await removeDeliveryPoint(id);
      showToast(res.message, 'success');
      refresh();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleOptimize = async () => {
    setOptimizing(true);
    try {
      const res = await optimizeRoute();
      showToast(res.message, 'success');
      refresh();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setOptimizing(false);
    }
  };

  const handleCloseDay = async () => {
    setConfirming(false);
    try {
      const res = await closeDay();
      showToast(res.message, 'success');
      refresh();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Mis Entregas del Día</h1>

      {/* Counters */}
      <div className="flex-row" style={{ marginBottom: 16 }}>
        <span className="badge badge-warning">{state._pending || 0} pendientes</span>
        <span className="badge badge-success">{state._completed || 0} completados</span>
      </div>

      {/* Origin */}
      {origin.name && (
        <p className="field-text" style={{ marginBottom: 16, color: 'var(--color-text-secondary)' }}>
          <MapPin size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
          Origen: {origin.name}
        </p>
      )}

      {/* Delivery List */}
      <div className="flex-col gap-md">
        {points.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: 32 }}>
            <Package size={40} style={{ color: 'var(--color-text-muted)', margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--color-text-muted)' }}>No hay entregas. Agrega un punto para comenzar.</p>
          </div>
        )}
        {points.map(point => (
          <DeliveryCard
            key={point.id}
            point={point}
            onMarkStatus={handleMarkStatus}
            onRemove={handleRemove}
          />
        ))}
      </div>

      {/* Navigation to next stop */}
      {gmaps.has_next && (
        <>
          <div className="separator" />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 12 }}>
            <Navigation size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
            Siguiente Punto
          </h3>
          <div className="card">
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 4 }}>
              Desde: {gmaps.from_name}
            </p>
            <p className="field-text" style={{ marginBottom: 12 }}>
              Hacia: {gmaps.next_stop?.client_name} {gmaps.is_return ? '(retorno)' : ''}
            </p>
            <a
              href={gmaps.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-full"
            >
              <Navigation size={18} /> Abrir en Google Maps
            </a>
          </div>
        </>
      )}

      {/* Optimized route info */}
      {route.total_distance_km > 0 && (
        <>
          <div className="separator" />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 12 }}>Ruta Optimizada</h3>
          <div className="flex-row" style={{ marginBottom: 8 }}>
            <span className="badge badge-outline">{route.total_distance_km} km</span>
            <span className="badge badge-outline">{route.total_duration_min} min</span>
            <span className="badge badge-secondary">{route.method}</span>
          </div>
        </>
      )}

      <div className="separator" />

      {/* Action Grid */}
      <div className="grid-2" style={{ marginBottom: 16 }}>
        <Link to="/add-point" className="btn btn-primary">
          <Plus size={18} /> Agregar Punto
        </Link>
        <button className="btn btn-cta" onClick={handleOptimize} disabled={optimizing}>
          <Route size={18} /> {optimizing ? 'Calculando...' : 'Optimizar Ruta'}
        </button>
        <Link to="/origin" className="btn btn-outline">
          <MapPin size={18} /> Origen
        </Link>
        <Link to="/fuel" className="btn btn-outline">
          <Fuel size={18} /> Combustible
        </Link>
        <Link to="/return" className="btn btn-outline">
          <RotateCw size={18} /> Retorno
        </Link>
        <Link to="/summary" className="btn btn-outline">
          <Package size={18} /> Resumen
        </Link>
      </div>

      <div className="separator" />

      <button className="btn btn-destructive btn-full" onClick={() => setConfirming(true)}>
        Cerrar Día
      </button>

      {confirming && (
        <ConfirmDialog
          title="Cerrar Jornada"
          message="Se archivará la jornada actual y se limpiará el estado. Esta acción no se puede deshacer."
          confirmLabel="Cerrar Día"
          onConfirm={handleCloseDay}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  );
}
