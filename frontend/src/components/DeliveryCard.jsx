import StatusBadge from './StatusBadge';
import { CheckCircle, XCircle, Trash2, Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function DeliveryCard({ point, onMarkStatus, onRemove }) {
  const [loading, setLoading] = useState(null);

  const handleAction = async (action, ...args) => {
    setLoading(action);
    try {
      if (action === 'remove') await onRemove(point.id);
      else await onMarkStatus(point.id, ...args);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="card">
      <div className="flex-row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
        <span className="field-text">{point.client_name}</span>
        <StatusBadge status={point.status?.key || point.status || 'pending'} />
      </div>

      <div className="grid-3">
        <button
          className="btn btn-success btn-sm"
          disabled={loading !== null}
          onClick={() => handleAction('delivered', 'delivered')}
        >
          {loading === 'delivered' ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
          Entregado
        </button>
        <button
          className="btn btn-destructive btn-sm"
          disabled={loading !== null}
          onClick={() => handleAction('not_found', 'not_found')}
        >
          {loading === 'not_found' ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
          Fallido
        </button>
        <button
          className="btn btn-outline btn-sm"
          disabled={loading !== null}
          onClick={() => handleAction('remove')}
        >
          {loading === 'remove' ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
          Eliminar
        </button>
      </div>
    </div>
  );
}
