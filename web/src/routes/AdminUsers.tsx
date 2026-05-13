import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { AppLayout, Card } from '../components';
import { ProfilePicture } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { subscribeToLeaderboard, toggleUserEnabled, type UserWithId } from '../services';
import { useToast } from '../hooks';

export const AdminUsers = () => {
  const { userData } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState<UserWithId[]>([]);
  const [toggling, setToggling] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending'>('pending');

  if (!userData?.admin) return <Navigate to="/" replace />;

  useEffect(() => {
    const unsubscribe = subscribeToLeaderboard((all) => {
      // Sort: disabled first, then by score
      all.sort((a, b) => {
        const aEnabled = a.enabled !== false;
        const bEnabled = b.enabled !== false;
        if (aEnabled !== bEnabled) return aEnabled ? 1 : -1;
        return b.score - a.score;
      });
      setUsers(all);
    });
    return () => unsubscribe();
  }, []);

  const handleToggle = async (uid: string, currentEnabled: boolean, isAdmin: boolean) => {
    if (isAdmin) return;
    setToggling(uid);
    try {
      await toggleUserEnabled(uid, !currentEnabled);
      showToast(
        !currentEnabled ? 'Usuario habilitado' : 'Usuario deshabilitado',
        'success'
      );
    } catch {
      showToast('Error al actualizar el usuario', 'error');
    } finally {
      setToggling(null);
    }
  };

  const filtered = filter === 'pending'
    ? users.filter((u) => u.enabled === false)
    : users;

  const pendingCount = users.filter((u) => u.enabled === false).length;

  return (
    <AppLayout>
      <div className="pt-8 px-4 pb-8 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Gestión de usuarios</h1>
            <p className="text-white/50 text-sm mt-1">
              {users.length} usuario{users.length !== 1 ? 's' : ''} registrado{users.length !== 1 ? 's' : ''}
              {pendingCount > 0 && (
                <span className="ml-2 text-yellow-400">
                  · {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4">
          {(['pending', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
                filter === f
                  ? 'bg-white text-black font-medium'
                  : 'text-white/50 hover:text-white border border-white/20'
              }`}
            >
              {f === 'pending' ? `Pendientes (${pendingCount})` : 'Todos'}
            </button>
          ))}
        </div>

        <Card className="divide-y divide-white/10 overflow-hidden">
          {filtered.length === 0 && (
            <div className="p-8 text-center text-white/40 text-sm">
              {filter === 'pending'
                ? 'No hay usuarios pendientes de validación'
                : 'No hay usuarios registrados'}
            </div>
          )}
          {filtered.map((u) => {
            const isEnabled = u.enabled !== false;
            const isLoading = toggling === u.id;

            return (
              <div key={u.id} className="flex items-center gap-3 p-4">
                <ProfilePicture
                  src={u.photoURL}
                  name={u.displayName || u.email}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {u.displayName || u.userName}
                    {u.admin && (
                      <span className="ml-2 text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded-full">
                        admin
                      </span>
                    )}
                  </p>
                  <p className="text-white/40 text-xs truncate">{u.email}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs ${isEnabled ? 'text-green-400' : 'text-yellow-400'}`}>
                    {isEnabled ? '✓ habilitado' : '⏳ pendiente'}
                  </span>
                  {!u.admin && (
                    <button
                      onClick={() => void handleToggle(u.id, isEnabled, u.admin)}
                      disabled={isLoading}
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        isEnabled ? 'bg-green-500' : 'bg-white/20'
                      } ${isLoading ? 'opacity-50' : 'cursor-pointer'}`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          isEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </Card>
      </div>
    </AppLayout>
  );
};
