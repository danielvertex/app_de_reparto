import { useState, useEffect, useCallback } from 'react';
import { getTrip } from '../api/client';

/**
 * Hook principal: carga y actualiza el estado del viaje activo.
 */
export function useTrip() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getTrip();
      setState(res.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Permite actualizar parcialmente el estado desde acciones
  const updateState = useCallback((partial) => {
    setState(prev => prev ? { ...prev, ...partial } : partial);
  }, []);

  return { state, loading, error, refresh, updateState };
}
