import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Loader2 } from 'lucide-react';
import { updateOrigin } from '../api/client';

export default function OriginConfig({ state, refresh, showToast }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', latitude: '', longitude: '' });

  const origin = state?.origin || {};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await updateOrigin(form);
      showToast(res.message, 'success');
      refresh();
      navigate('/');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="page-container">
      <button className="btn btn-outline btn-sm" onClick={() => navigate('/')} style={{ marginBottom: 16 }}>
        <ArrowLeft size={16} /> Regresar
      </button>

      <h1 className="page-title">Punto de Origen</h1>

      {origin.name && (
        <div className="card" style={{ marginBottom: 20 }}>
          <p className="field-label">Origen actual</p>
          <p className="field-text">{origin.name} ({origin.latitude}, {origin.longitude})</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex-col">
        <div className="form-group">
          <label className="form-label" htmlFor="origin-name">Nombre del Origen *</label>
          <input id="origin-name" className="form-input" type="text" required placeholder="Ej: Bodega Central" value={form.name} onChange={update('name')} />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="origin-lat">Latitud *</label>
          <input id="origin-lat" className="form-input" type="text" inputMode="decimal" required placeholder="Ej: 21.8664" value={form.latitude} onChange={update('latitude')} />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="origin-lon">Longitud *</label>
          <input id="origin-lon" className="form-input" type="text" inputMode="decimal" required placeholder="Ej: -102.2991" value={form.longitude} onChange={update('longitude')} />
        </div>
        <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : <MapPin size={18} />}
          {loading ? 'Guardando...' : 'Guardar Origen'}
        </button>
      </form>
    </div>
  );
}
