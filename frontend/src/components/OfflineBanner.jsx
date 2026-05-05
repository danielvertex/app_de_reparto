import { WifiOff } from 'lucide-react';

export default function OfflineBanner() {
  return (
    <div className="offline-banner">
      <WifiOff size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
      Sin conexión — los cambios se sincronizarán
    </div>
  );
}
