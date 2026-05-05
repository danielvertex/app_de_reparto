import { useState, useCallback } from 'react';

/**
 * Hook para mostrar toast notifications.
 */
export function useToast() {
  const [toast, setToast] = useState(null);

  const show = useCallback((message, variant = 'success') => {
    setToast({ message, variant });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const dismiss = useCallback(() => setToast(null), []);

  return { toast, show, dismiss };
}
