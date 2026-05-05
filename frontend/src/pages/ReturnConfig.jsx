import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, ArrowUpRight, MapPin, Loader2 } from 'lucide-react';
import { updateReturnConfig } from '../api/client';

export default function ReturnConfig({ refresh, showToast }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null);
  const [form, setForm] = useState({ name: '', latitude: '', longitude: '' });

  const handleQuick = async (mode) => {
    setLoading(mode);
    try {
      const res = await updateReturnConfig({ mode });
      showToast(res.message, 'success');
      refresh();
      navigate('/');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(null);
    }
  };

  const handleCustom = async (e) => {
    e.preventDefault();
    setLoading('custom');
    try {
      const res = await updateReturnConfig({
        mode: 'custom',
        custom_name: form.name,
        custom_lat: form.latitude,
        custom_lon: form.longitude,
      });
      showToast(res.message, 'success');
      refresh();
      navigate('/');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(null);
    }
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="page-container">
      <button className="btn btn-outline btn-sm" onClick={() => navigate('/')} style={{ marginBottom: 16 }}>
        <ArrowLeft size={16} /> Regresar
      </button>

      <h1 className="page-title">Retorno</h1>

      <div className="flex-row" style={{ marginBottom: 20 }}>
        <button className="btn btn-primary" onClick={() => handleQuick('origin')} disabled={loading !== null} style={{ flex: 1 }}>
          {loading === 'origin' ? <Loader2 size={18} className="animate-spin" /> : <Home size={18} />}
          Al Origen
        </button>
        <button className="btn btn-outline" onClick={() => handleQuick('none')} disabled={loading !== null} style={{ flex: 1 }}>
          {loading === 'none' ? <Loader2 size={18} className="animate-spin" /> : <ArrowUpRight size={18} />}
          Sin Regreso
        </button>
      </div>

      <div className="separator" />

      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 12 }}>Punto Personalizado</h3>

      <form onSubmit={handleCustom} className="flex-col">
        <div className="form-group">
          <label className="form-label" htmlFor="ret-name">Nombre *</label>
          <input id="ret-name" className="form-input" type="text" required placeholder="Ej: Casa, Oficina" value={form.name} onChange={update('name')} />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="ret-lat">Latitud *</label>
          <input id="ret-lat" className="form-input" type="text" inputMode="decimal" required placeholder="Ej: 21.8664" value={form.latitude} onChange={update('latitude')} />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="ret-lon">Longitud *</label>
          <input id="ret-lon" className="form-input" type="text" inputMode="decimal" required placeholder="Ej: -102.2991" value={form.longitude} onChange={update('longitude')} />
        </div>
        <button type="submit" className="btn btn-primary btn-full" disabled={loading !== null}>
          {loading === 'custom' ? <Loader2 size={18} className="animate-spin" /> : <MapPin size={18} />}
          Guardar Punto Personalizado
        </button>
      </form>
    </div>
  );
}
