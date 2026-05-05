import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, MapPin, DollarSign } from 'lucide-react';

export default function Summary({ state }) {
  const navigate = useNavigate();
  const summary = state?.summary || {};

  return (
    <div className="page-container">
      <button className="btn btn-outline btn-sm" onClick={() => navigate('/')} style={{ marginBottom: 16 }}>
        <ArrowLeft size={16} /> Regresar
      </button>

      <h1 className="page-title">Resumen del Día</h1>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="metric-card">
          <div style={{ color: 'var(--color-success)', marginBottom: 8 }}>
            <CheckCircle size={28} />
          </div>
          <div className="metric-value">{summary.completed || 0}</div>
          <div className="metric-label">Completados</div>
        </div>
        <div className="metric-card">
          <div style={{ color: 'var(--color-warning)', marginBottom: 8 }}>
            <Clock size={28} />
          </div>
          <div className="metric-value">{summary.pending || 0}</div>
          <div className="metric-label">Pendientes</div>
        </div>
        <div className="metric-card">
          <div style={{ color: 'var(--color-primary)', marginBottom: 8 }}>
            <MapPin size={28} />
          </div>
          <div className="metric-value">{summary.planned_km || 0}</div>
          <div className="metric-label">KM</div>
        </div>
        <div className="metric-card">
          <div style={{ color: 'var(--color-cta)', marginBottom: 8 }}>
            <DollarSign size={28} />
          </div>
          <div className="metric-value">${summary.estimated_fuel_cost || '0.00'}</div>
          <div className="metric-label">Costo</div>
        </div>
      </div>
    </div>
  );
}
