import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Loader2 } from 'lucide-react';
import { addDeliveryPoint } from '../api/client';

export default function AddPoint({ refresh, showToast }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ client_name: '', latitude: '', longitude: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await addDeliveryPoint(form);
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

      <h1 className="page-title">Nuevo Punto de Entrega</h1>

      <form onSubmit={handleSubmit} className="flex-col">
        <div className="form-group">
          <label className="form-label" htmlFor="client_name">Nombre del Cliente *</label>
          <input
            id="client_name"
            className="form-input"
            type="text"
            required
            placeholder="Ej: Tienda Don Juan"
            value={form.client_name}
            onChange={update('client_name')}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="latitude">Latitud *</label>
          <input
            id="latitude"
            className="form-input"
            type="text"
            inputMode="decimal"
            required
            placeholder="Ej: 21.8664"
            value={form.latitude}
            onChange={update('latitude')}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="longitude">Longitud *</label>
          <input
            id="longitude"
            className="form-input"
            type="text"
            inputMode="decimal"
            required
            placeholder="Ej: -102.2991"
            value={form.longitude}
            onChange={update('longitude')}
          />
        </div>

        <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
          {loading ? 'Guardando...' : 'Agregar Punto'}
        </button>
      </form>
    </div>
  );
}
