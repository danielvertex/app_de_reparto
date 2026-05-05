import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Fuel, Loader2 } from 'lucide-react';
import { updateFuelConfig } from '../api/client';

export default function FuelConfig({ state, refresh, showToast }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ km_per_liter: '', price_per_liter: '' });

  const fuel = state?.fuel_config || {};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await updateFuelConfig(form);
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

      <h1 className="page-title">Combustible</h1>

      {fuel.km_per_liter > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <p className="field-label">Configuración actual</p>
          <p className="field-text">{fuel.km_per_liter} km/l a ${fuel.price_per_liter}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex-col">
        <div className="form-group">
          <label className="form-label" htmlFor="kpl">Rendimiento (km/litro) *</label>
          <input id="kpl" className="form-input" type="text" inputMode="decimal" required placeholder="Ej: 12.5" value={form.km_per_liter} onChange={update('km_per_liter')} />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="ppl">Precio por Litro ($) *</label>
          <input id="ppl" className="form-input" type="text" inputMode="decimal" required placeholder="Ej: 23.50" value={form.price_per_liter} onChange={update('price_per_liter')} />
        </div>
        <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Fuel size={18} />}
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
      </form>
    </div>
  );
}
