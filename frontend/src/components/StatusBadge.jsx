import { CheckCircle, Clock, XCircle, RotateCw, Ban } from 'lucide-react';

const STATUS_MAP = {
  delivered:    { label: 'Entregado',     className: 'badge-success',     icon: CheckCircle },
  pending:      { label: 'Pendiente',     className: 'badge-warning',     icon: Clock },
  not_found:    { label: 'No encontrado', className: 'badge-destructive', icon: XCircle },
  rescheduled:  { label: 'Reprogramado',  className: 'badge-secondary',   icon: RotateCw },
  cancelled:    { label: 'Cancelado',     className: 'badge-destructive', icon: Ban },
  rejected:     { label: 'Rechazado',     className: 'badge-destructive', icon: XCircle },
};

export default function StatusBadge({ status }) {
  const config = STATUS_MAP[status] || STATUS_MAP.pending;
  const Icon = config.icon;
  return (
    <span className={`badge ${config.className}`}>
      <Icon size={14} />
      {config.label}
    </span>
  );
}
