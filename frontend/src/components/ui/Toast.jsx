import { CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
};

export default function Toast({ message, variant = 'success' }) {
  const Icon = icons[variant] || CheckCircle;
  return (
    <div className="toast-container">
      <div className={`toast toast-${variant}`}>
        <Icon size={20} />
        <span>{message}</span>
      </div>
    </div>
  );
}
