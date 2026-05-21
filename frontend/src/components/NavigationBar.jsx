import { NavLink, useLocation } from 'react-router-dom';
import { Truck, MapPin, ClipboardList, History, Users, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function NavigationBar() {
  const { isAuthenticated, isOwner, logout } = useAuth();
  const location = useLocation();

  // No mostrar navbar en login ni si no está autenticado
  if (!isAuthenticated || location.pathname === '/login') {
    return null;
  }

  return (
    <nav className="bottom-nav">
      <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
        <Truck />
        <span>Entregas</span>
      </NavLink>
      <NavLink to="/origin" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <MapPin />
        <span>Origen</span>
      </NavLink>
      <NavLink to="/summary" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <ClipboardList />
        <span>Resumen</span>
      </NavLink>
      <NavLink to="/history" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <History />
        <span>Historial</span>
      </NavLink>
      {isOwner && (
        <NavLink to="/users" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Users />
          <span>Usuarios</span>
        </NavLink>
      )}
      <button className="nav-item" onClick={logout}>
        <LogOut />
        <span>Salir</span>
      </button>
    </nav>
  );
}

