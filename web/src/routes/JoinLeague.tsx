import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { bgImage, worldcupLogo } from '../assets';
import { AppLayout, Button, Card, LeaguePicture } from '../components';
import { useAuth, useLeague } from '../hooks';
import {
  getLeagueBySlug,
  joinLeague,
  isLeagueMember,
  type LeagueWithId,
} from '../services';

// Storage key for pending join intent
const JOIN_INTENT_KEY = 'pendingJoinLeague';

type JoinIntent = {
  leagueId: string;
  slug: string;
  inviteCode: string;
};

// Helper functions for localStorage
const setJoinIntent = (intent: JoinIntent): void => {
  localStorage.setItem(JOIN_INTENT_KEY, JSON.stringify(intent));
};

const clearJoinIntent = (): void => {
  localStorage.removeItem(JOIN_INTENT_KEY);
};

export const JoinLeague = () => {
  const { slug, inviteCode } = useParams<{
    slug: string;
    inviteCode: string;
  }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { setSelectedLeague } = useLeague();

  const [league, setLeague] = React.useState<LeagueWithId | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [joining, setJoining] = React.useState(false);
  const [signingIn, setSigningIn] = React.useState(false);

  // Email auth state
  const [emailMode, setEmailMode] = React.useState<'login' | 'register'>('login');
  const [emailName, setEmailName] = React.useState('');
  const [emailValue, setEmailValue] = React.useState('');
  const [emailPassword, setEmailPassword] = React.useState('');
  const [emailError, setEmailError] = React.useState<string | null>(null);

  const getEmailErrorMessage = (code: string): string => {
    const messages: Record<string, string> = {
      'auth/user-not-found': 'No existe una cuenta con ese email',
      'auth/wrong-password': 'Contraseña incorrecta',
      'auth/email-already-in-use': 'Ya existe una cuenta con ese email',
      'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
      'auth/invalid-email': 'Email inválido',
      'auth/invalid-credential': 'Email o contraseña incorrectos',
    };
    return messages[code] ?? 'Error al iniciar sesión. Intentá de nuevo.';
  };

  // Hide splash screen when ready
  React.useEffect(() => {
    if (!loading && !authLoading) {
      window.hideSplash?.();
    }
  }, [loading, authLoading]);

  // Fetch league info
  React.useEffect(() => {
    if (!slug) {
      setError('Invalid link');
      setLoading(false);
      return;
    }

    getLeagueBySlug(slug)
      .then((fetchedLeague) => {
        if (!fetchedLeague) {
          setError('League not found');
        } else if (
          inviteCode?.toUpperCase() !== fetchedLeague.inviteCode.toUpperCase()
        ) {
          setError('Invalid invite code');
        } else {
          setLeague(fetchedLeague);
        }
      })
      .catch((err) => {
        console.error('Error fetching league:', err);
        setError('Failed to load league');
      })
      .finally(() => setLoading(false));
  }, [slug, inviteCode]);

  // Auto-join if user is logged in
  React.useEffect(() => {
    if (authLoading || loading || !league || !user || joining) return;

    const performJoin = async () => {
      setJoining(true);
      try {
        // Check if already a member
        const alreadyMember = await isLeagueMember(league.id, user.uid);
        if (alreadyMember) {
          // Already a member, just redirect
          setSelectedLeague(league);
          void navigate(`/league/${league.slug}`, { replace: true });
          return;
        }

        // Join the league
        await joinLeague(league.id, user.uid);
        setSelectedLeague(league);
        void navigate(`/league/${league.slug}`, { replace: true });
      } catch (err) {
        console.error('Error joining league:', err);
        setError('Failed to join league');
        setJoining(false);
      }
    };

    void performJoin();
  }, [authLoading, loading, league, user, joining, navigate]);

  const storeIntent = () => {
    if (!league || !inviteCode) return;
    setJoinIntent({ leagueId: league.id, slug: league.slug, inviteCode });
  };

  const handleSignIn = () => {
    storeIntent();
    setSigningIn(true);
    signInWithPopup(auth, googleProvider).catch((err) => {
      console.error('Sign in error:', err);
      setSigningIn(false);
      clearJoinIntent();
    });
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    storeIntent();
    setSigningIn(true);
    try {
      if (emailMode === 'register') {
        const cred = await createUserWithEmailAndPassword(auth, emailValue, emailPassword);
        if (emailName.trim()) {
          await updateProfile(cred.user, { displayName: emailName.trim() });
        }
      } else {
        await signInWithEmailAndPassword(auth, emailValue, emailPassword);
      }
      // AuthProvider's onAuthStateChanged will process the join intent
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      setEmailError(getEmailErrorMessage(code));
      setSigningIn(false);
      clearJoinIntent();
    }
  };

  // Show loading state
  if (loading || authLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-white/70">Loading...</div>
        </div>
      </AppLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <AppLayout>
        <div className="pt-8 px-4 pb-8 max-w-md mx-auto">
          <Card className="p-8 text-center">
            <div className="text-4xl mb-4">😕</div>
            <h1 className="text-xl font-bold text-white mb-2">{error}</h1>
            <p className="text-white/60 mb-6">
              This invite link may be invalid or expired.
            </p>
            <Button onClick={() => void navigate('/leagues')}>
              Go to Leagues
            </Button>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // Show joining state for logged-in users
  if (user && league) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-white/70">Joining {league.name}...</div>
        </div>
      </AppLayout>
    );
  }

  // Show sign-in prompt for non-logged-in users (no sidebar/navbar)
  if (!user && league) {
    return (
      <>
        {/* Fixed background */}
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-10"
          style={{
            backgroundImage: `linear-gradient(to bottom, black, transparent 30%, transparent 70%, black), url(${bgImage})`,
          }}
        />
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          {/* App header */}
          <div className="flex items-center gap-3 mb-6">
            <img
              src={worldcupLogo}
              alt="FIFA World Cup 2026"
              className="h-12"
            />
            <span className="text-white font-light text-lg">
              FIFA WC 2026 POOL
            </span>
          </div>

          <Card className="p-8 text-center max-w-md w-full">
            <div className="flex justify-center mb-4">
              <LeaguePicture
                src={league.imageURL}
                name={league.name}
                size="xl"
              />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Join {league.name}
            </h1>
            {league.description && (
              <p className="text-white/60 mb-6">{league.description}</p>
            )}
            <p className="text-white/50 text-sm mb-6">
              Sign in to join this league and compete with friends!
            </p>
            {/* Email/password form */}
            <div className="flex mb-4 bg-white/10 rounded-lg p-1">
              <button
                onClick={() => { setEmailMode('login'); setEmailError(null); }}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${emailMode === 'login' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white/80'}`}
              >
                Ya tengo cuenta
              </button>
              <button
                onClick={() => { setEmailMode('register'); setEmailError(null); }}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${emailMode === 'register' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white/80'}`}
              >
                Registrarme
              </button>
            </div>

            <form onSubmit={(e) => void handleEmailSignIn(e)} className="space-y-2 mb-3">
              {emailMode === 'register' && (
                <input
                  type="text"
                  value={emailName}
                  onChange={(e) => setEmailName(e.target.value)}
                  placeholder="Tu nombre"
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/50"
                />
              )}
              <input
                type="email"
                value={emailValue}
                onChange={(e) => setEmailValue(e.target.value)}
                placeholder="Email"
                required
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/50"
              />
              <input
                type="password"
                value={emailPassword}
                onChange={(e) => setEmailPassword(e.target.value)}
                placeholder="Contraseña"
                required
                minLength={6}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/50"
              />
              {emailError && <p className="text-red-400 text-xs text-center">{emailError}</p>}
              <Button type="submit" disabled={signingIn} className="w-full">
                {signingIn ? 'Cargando...' : emailMode === 'login' ? 'Ingresar' : 'Crear cuenta'}
              </Button>
            </form>

            {/* Divider */}
            <div className="flex items-center my-3">
              <div className="flex-1 border-t border-white/20" />
              <span className="px-3 text-white/40 text-xs">o</span>
              <div className="flex-1 border-t border-white/20" />
            </div>

            <Button
              onClick={handleSignIn}
              disabled={signingIn}
              variant="secondary"
              className="w-full"
            >
              {signingIn ? 'Cargando...' : 'Continuar con Google'}
            </Button>
          </Card>
        </div>
      </>
    );
  }

  return null;
};
