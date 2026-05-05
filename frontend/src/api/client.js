/**
 * API Client — fetch wrapper con manejo de errores y retry offline.
 */

const API_BASE = '/api';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  let res;
  try {
    res = await fetch(url, config);
  } catch (networkErr) {
    throw new Error('Sin conexión al servidor. Verifica que el backend esté activo.');
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`El servidor respondió sin datos (HTTP ${res.status}). Verifica que el backend esté activo en http://localhost:8000`);
  }

  if (!res.ok) {
    throw new Error(data.detail || data.message || 'Error del servidor');
  }

  return data;
}

// ─── Trip ───
export const getTrip = () => request('/trip');
export const closeDay = () => request('/trip/close', { method: 'POST' });

// ─── Deliveries ───
export const getDeliveries = () => request('/deliveries');
export const addDeliveryPoint = (body) => request('/deliveries', { method: 'POST', body });
export const removeDeliveryPoint = (id) => request(`/deliveries/${id}`, { method: 'DELETE' });
export const markDeliveryStatus = (id, body) => request(`/deliveries/${id}/status`, { method: 'PATCH', body });

// ─── Config ───
export const updateOrigin = (body) => request('/config/origin', { method: 'PUT', body });
export const updateReturnConfig = (body) => request('/config/return', { method: 'PUT', body });
export const updateFuelConfig = (body) => request('/config/fuel', { method: 'PUT', body });

// ─── Routes ───
export const optimizeRoute = () => request('/routes/optimize', { method: 'POST' });

// ─── History ───
export const getHistory = () => request('/history');

export const exportTrip = async (tripId, format = 'full') => {
  const res = await fetch(`/api/history/${tripId}/export?format=${format}`);
  if (!res.ok) throw new Error('Error al exportar el viaje');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `viaje_${tripId}_${format}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};