import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../hooks/useAuth';

export const Pending = () => {
  const { user } = useAuth();

  const handleSignOut = () => {
    void signOut(auth);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-6xl">⏳</div>

        <div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Cuenta pendiente de validación
          </h1>
          <p className="text-white/60 text-sm leading-relaxed">
            Recibimos tu registro. Una vez que confirmemos tu pago,
            habilitamos tu cuenta y podés empezar a cargar predicciones.
          </p>
        </div>

        {user?.email && (
          <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <p className="text-white/40 text-xs mb-1">Cuenta registrada</p>
            <p className="text-white text-sm font-medium">{user.email}</p>
          </div>
        )}

        <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-left space-y-2">
          <p className="text-white/70 text-sm font-medium">¿Cómo confirmar el pago?</p>
          <p className="text-white/50 text-xs leading-relaxed">
            Enviá tu comprobante de transferencia al organizador. El costo es de{' '}
            <span className="text-white font-semibold">$7.500</span>. Una vez validado,
            tu cuenta se activa automáticamente.
          </p>
        </div>

        <button
          onClick={handleSignOut}
          className="text-white/40 hover:text-white/70 text-sm transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
};
