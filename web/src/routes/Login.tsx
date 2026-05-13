import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  OAuthProvider,
} from 'firebase/auth';
import { auth, googleProvider, microsoftProvider } from '../firebase';
import { bgImage, worldcupLogo } from '../assets';
import { Button, Card } from '../components';
import { useAuth } from '../hooks';
import { fetchMicrosoftProfilePhoto } from '../services';

type Mode = 'login' | 'register';

const getErrorMessage = (err: unknown): string => {
  const code = (err as { code?: string }).code ?? '';
  const messages: Record<string, string> = {
    'auth/user-not-found': 'No existe una cuenta con ese email',
    'auth/wrong-password': 'Contraseña incorrecta',
    'auth/email-already-in-use': 'Ya existe una cuenta con ese email',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
    'auth/invalid-email': 'Email inválido',
    'auth/invalid-credential': 'Email o contraseña incorrectos',
    'auth/too-many-requests': 'Demasiados intentos. Esperá unos minutos.',
  };
  return messages[code] ?? 'Ocurrió un error. Intentá de nuevo.';
};

const forceMicrosoft =
  import.meta.env.VITE_FORCE_MICROSOFT_LOGIN === 'true' &&
  import.meta.env.MODE !== 'paid';

export const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const redirect = searchParams.get('redirect') ?? '/';

  const [mode, setMode] = React.useState<Mode>('login');
  const [displayName, setDisplayName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (user) void navigate(redirect, { replace: true });
  }, [user, navigate, redirect]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'register') {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (displayName.trim()) {
          await updateProfile(cred.user, { displayName: displayName.trim() });
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      void navigate(redirect, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    setError(null);
    setLoading(true);
    signInWithPopup(auth, googleProvider)
      .then(() => void navigate(redirect, { replace: true }))
      .catch((err) => {
        setError(getErrorMessage(err));
        setLoading(false);
      });
  };

  const handleMicrosoft = () => {
    setError(null);
    setLoading(true);
    signInWithPopup(auth, microsoftProvider)
      .then(async (result) => {
        const credential = OAuthProvider.credentialFromResult(result);
        if (credential?.accessToken) {
          await fetchMicrosoftProfilePhoto(result.user.uid, credential.accessToken).catch(() => {});
        }
        void navigate(redirect, { replace: true });
      })
      .catch((err) => {
        setError(getErrorMessage(err));
        setLoading(false);
      });
  };

  const microsoftEnabled = forceMicrosoft || import.meta.env.VITE_ENABLE_MICROSOFT_LOGIN === 'true';

  if (forceMicrosoft) {
    return (
      <>
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-10"
          style={{
            backgroundImage: `linear-gradient(to bottom, black, transparent 30%, transparent 70%, black), url(${bgImage})`,
          }}
        />
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <img src={worldcupLogo} alt="FIFA World Cup 2026" className="h-20 mb-8" />
          <Card className="p-8 text-center max-w-sm w-full">
            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
            <Button onClick={handleMicrosoft} disabled={loading} className="w-full">
              {loading ? 'Iniciando sesión...' : 'Ingresar con Microsoft'}
            </Button>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-10"
        style={{
          backgroundImage: `linear-gradient(to bottom, black, transparent 30%, transparent 70%, black), url(${bgImage})`,
        }}
      />
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="flex items-center gap-3 mb-6">
          <img src={worldcupLogo} alt="FIFA World Cup 2026" className="h-12" />
          <span className="text-white font-light text-lg">FIFA WC 2026 POOL</span>
        </div>

        <Card className="p-8 max-w-md w-full">
          {/* Tabs */}
          <div className="flex mb-6 bg-white/10 rounded-lg p-1">
            <button
              onClick={() => { setMode('login'); setError(null); }}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === 'login'
                  ? 'bg-white/20 text-white'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => { setMode('register'); setError(null); }}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === 'register'
                  ? 'bg-white/20 text-white'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              Registrarse
            </button>
          </div>

          {/* Email form */}
          <form onSubmit={(e) => void handleEmailSubmit(e)} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-white/70 text-sm mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Tu nombre"
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-white/50"
                />
              </div>
            )}
            <div>
              <label className="block text-white/70 text-sm mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-white/50"
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm mb-1">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-white/50"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading
                ? 'Cargando...'
                : mode === 'login'
                  ? 'Iniciar sesión'
                  : 'Crear cuenta'}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-4">
            <div className="flex-1 border-t border-white/20" />
            <span className="px-3 text-white/40 text-sm">o</span>
            <div className="flex-1 border-t border-white/20" />
          </div>

          {/* Google */}
          <Button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full"
            variant="secondary"
          >
            Continuar con Google
          </Button>

          {/* Microsoft (solo work) */}
          {microsoftEnabled && (
            <Button
              onClick={handleMicrosoft}
              disabled={loading}
              className="w-full mt-3"
              variant="secondary"
            >
              Continuar con Microsoft
            </Button>
          )}
        </Card>
      </div>
    </>
  );
};
