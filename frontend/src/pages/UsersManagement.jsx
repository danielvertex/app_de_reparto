import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Trash2, ArrowLeft, Shield, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUsers, createUser, deleteUser } from '../api/client';
import ConfirmDialog from '../components/ui/ConfirmDialog';

export default function UsersManagement({ showToast }) {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState(null);

  // Form state
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('employee');
  const [submitting, setSubmitting] = useState(false);

  const loadUsers = async () => {
    try {
      const res = await getUsers();
      setUsers(res.data || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!username.trim() || !displayName.trim() || !password.trim()) {
      showToast('Completa todos los campos.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await createUser({
        username: username.trim(),
        display_name: displayName.trim(),
        password,
        role,
      });
      showToast(res.message, 'success');
      setUsername('');
      setDisplayName('');
      setPassword('');
      setRole('employee');
      setShowForm(false);
      loadUsers();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (userId) => {
    setDeleting(null);
    try {
      const res = await deleteUser(userId);
      showToast(res.message, 'success');
      loadUsers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', paddingTop: 40 }}>
          Cargando usuarios...
        </p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <button className="btn btn-outline btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
        <ArrowLeft size={16} /> Volver
      </button>

      <h1 className="page-title">Gestión de Usuarios</h1>

      {/* User list */}
      <div className="flex-col gap-md" style={{ marginBottom: 20 }}>
        {users.map((u) => (
          <div key={u.user_id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 'var(--radius-full)',
                background: u.role === 'owner' ? 'var(--color-primary)' : 'var(--color-border-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: u.role === 'owner' ? 'white' : 'var(--color-text-secondary)',
                flexShrink: 0,
              }}>
                {u.role === 'owner' ? <Shield size={18} /> : <User size={18} />}
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: '1rem' }}>{u.display_name}</p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                  @{u.username} · <span className={`badge ${u.role === 'owner' ? 'badge-warning' : 'badge-secondary'}`}
                    style={{ fontSize: '0.6875rem', padding: '2px 6px' }}
                  >
                    {u.role === 'owner' ? 'Dueño' : 'Empleado'}
                  </span>
                </p>
              </div>
            </div>

            {/* No mostrar botón de eliminar para el usuario actual */}
            {u.user_id !== currentUser?.user_id && (
              <button
                className="btn btn-destructive btn-sm"
                style={{ minHeight: 36, padding: '6px 10px' }}
                onClick={() => setDeleting(u)}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add user button / form */}
      {!showForm ? (
        <button className="btn btn-primary btn-full" onClick={() => setShowForm(true)}>
          <UserPlus size={18} /> Agregar Usuario
        </button>
      ) : (
        <div className="card">
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 16 }}>Nuevo Usuario</h3>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label" htmlFor="new-username">Usuario (login)</label>
              <input
                id="new-username"
                className="form-input"
                type="text"
                placeholder="ej: repartidor1"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="new-display-name">Nombre visible</label>
              <input
                id="new-display-name"
                className="form-input"
                type="text"
                placeholder="ej: Carlos Pérez"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="new-password">Contraseña</label>
              <input
                id="new-password"
                className="form-input"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="new-role">Rol</label>
              <select
                id="new-role"
                className="form-input"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={submitting}
              >
                <option value="employee">Empleado</option>
                <option value="owner">Dueño</option>
              </select>
            </div>

            <div className="flex-row" style={{ marginTop: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={submitting} style={{ flex: 1 }}>
                {submitting ? 'Creando...' : 'Crear Usuario'}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)} disabled={submitting}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confirm delete dialog */}
      {deleting && (
        <ConfirmDialog
          title="Eliminar Usuario"
          message={`¿Eliminar a "${deleting.display_name}" (@${deleting.username})? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          onConfirm={() => handleDelete(deleting.user_id)}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
