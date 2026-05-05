import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Download, Loader2 } from 'lucide-react';
import { getHistory, exportTrip } from '../api/client';

export default function HistoryPage({ showToast }) {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(null);

  useEffect(() => {
    getHistory()
      .then(res => setTrips(res.data?.past_trips || []))
      .catch(err => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [showToast]);

  const handleExport = async (tripId) => {
    setExporting(tripId);
    try {
      await exportTrip(tripId, 'full');
      showToast('Guardado en data/exports/', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="page-container">
      <button className="btn btn-outline btn-sm" onClick={() => navigate('/')} style={{ marginBottom: 16 }}>
        <ArrowLeft size={16} /> Regresar
      </button>

      <h1 className="page-title">Historial</h1>

      {loading && <p style={{ color: 'var(--color-text-muted)' }}>Cargando...</p>}

      {!loading && trips.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 32 }}>
          <Calendar size={40} style={{ color: 'var(--color-text-muted)', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--color-text-muted)' }}>No hay viajes registrados.</p>
        </div>
      )}

      <div className="flex-col gap-md">
        {trips.map(trip => (
          <div className="card" key={trip.trip_id}>
            <div className="flex-row" style={{ marginBottom: 8 }}>
              <Calendar size={16} style={{ color: 'var(--color-text-muted)' }} />
              <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{trip.trip_date}</span>
            </div>
            <h4 className="field-text" style={{ marginBottom: 8 }}>{trip.display_title}</h4>
            <div className="flex-row" style={{ marginBottom: 12 }}>
              <span className="badge badge-success">{trip.completed} entregas</span>
              <span className="badge badge-outline">${trip.estimated_fuel_cost}</span>
            </div>
            <button
              className="btn btn-outline btn-sm"
              disabled={exporting === trip.trip_id}
              onClick={() => handleExport(trip.trip_id)}
            >
              {exporting === trip.trip_id ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              Exportar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
