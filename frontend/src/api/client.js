/**
 * API Client — fetch wrapper con manejo de errores, retry offline y autenticación.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'https://reparto.bluegreenpl.com/api';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // enviar cookie HttpOnly automáticamente
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

  // Interceptor: si el backend responde 401, forzar logout global
  if (res.status === 401) {
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    throw new Error('Sesión expirada o no autenticado.');
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`El servidor respondió sin datos (HTTP ${res.status}). Verifica que el backend esté activo.`);
  }

  if (!res.ok) {
    let errorMessage = data.message || 'Error del servidor';
    if (data.detail) {
      if (Array.isArray(data.detail)) {
        errorMessage = data.detail.map(err => {
          const loc = err.loc && err.loc.length > 1 ? err.loc[err.loc.length - 1] : '';
          let msg = err.msg;
          
          // Traducciones simples para mensajes comunes de validación
          if (msg.includes('String should have at least 6 characters')) {
            msg = 'debe tener al menos 6 caracteres';
          } else if (msg.includes('String should have at least 3 characters')) {
            msg = 'debe tener al menos 3 caracteres';
          } else if (msg.includes('String should have at most')) {
            msg = msg.replace('String should have at most', 'no puede tener más de').replace('characters', 'caracteres');
          } else if (msg.includes('Field required') || msg === 'field required') {
            msg = 'es un campo obligatorio';
          } else if (msg.includes('Input should be a valid string')) {
            msg = 'debe ser texto válido';
          }

          // Formateo del nombre del campo si es 'password' para que se lea mejor en español
          const fieldName = loc === 'password' ? 'contraseña' : loc;

          return fieldName ? `El campo '${fieldName}' ${msg}` : msg;
        }).join(' | ');
      } else if (typeof data.detail === 'string') {
        errorMessage = data.detail;
      } else {
        errorMessage = JSON.stringify(data.detail);
      }
    }
    throw new Error(errorMessage);
  }

  return data;
}

// ─── Auth ───
export const login = (username, password) =>
  request('/auth/login', { method: 'POST', body: { username, password } });

export const logout = () =>
  request('/auth/logout', { method: 'POST' });

export const getMe = () =>
  request('/auth/me');

// ─── Users (owner only) ───
export const getUsers = () => request('/users');

export const createUser = (body) =>
  request('/users', { method: 'POST', body });

export const deleteUser = (id) =>
  request(`/users/${id}`, { method: 'DELETE' });

export const changePassword = (userId, newPassword) =>
  request(`/users/${userId}/password`, { method: 'PATCH', body: { new_password: newPassword } });

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
  const res = await fetch(`${API_BASE}/history/${tripId}/export?format=${format}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Error al exportar el viaje');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `viaje_${tripId}_${format}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

