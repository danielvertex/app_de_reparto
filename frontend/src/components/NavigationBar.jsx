import { NavLink } from 'react-router-dom';
import { Truck, MapPin, ClipboardList, History } from 'lucide-react';

const navItems = [
  { to: '/', icon: Truck, label: 'Entregas' },
  { to: '/origin', icon: MapPin, label: 'Origen' },
  { to: '/summary', icon: ClipboardList, label: 'Resumen' },
  { to: '/history', icon: History, label: 'Historial' },
];

export default function NavigationBar() {
  return (
    <nav className="bottom-nav">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Icon />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
