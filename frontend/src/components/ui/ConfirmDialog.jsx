export default function ConfirmDialog({ title, message, onConfirm, onCancel, confirmLabel = 'Confirmar', variant = 'destructive' }) {
  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog-content" onClick={e => e.stopPropagation()}>
        <div className="dialog-title">{title}</div>
        <div className="dialog-text">{message}</div>
        <div className="flex-row" style={{ justifyContent: 'flex-end', gap: 12 }}>
          <button className="btn btn-outline btn-sm" onClick={onCancel}>Cancelar</button>
          <button className={`btn btn-${variant} btn-sm`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
