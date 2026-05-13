import { StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import { ProtectedRoute } from './components';
import { AuthProvider, MatchProvider, LeagueProvider, ToastProvider } from './context';
import {
  About,
  AdminUsers,
  EditLeague,
  EditProfile,
  Home,
  JoinLeague,
  Leaderboard,
  LeagueDetail,
  Leagues,
  Login,
  NewLeague,
  Pending,
  Rules,
  Terms,
  UserProfile,
} from './routes';
import { useAuth } from './hooks';

// Hide splash screen - exposed globally so components can call it
window.hideSplash = () => {
  const splash = document.getElementById('splash');
  if (splash) {
    splash.style.opacity = '0';
    setTimeout(() => splash.remove(), 300);
  }
};

// Extend Window interface
declare global {
  interface Window {
    hideSplash: () => void;
  }
}

// Intercepts logged-in users whose payment hasn't been validated yet
const PendingGate = ({ children }: { children: ReactNode }) => {
  const { pendingValidation } = useAuth();
  if (pendingValidation) return <Pending />;
  return <>{children}</>;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ToastProvider>
        <LeagueProvider>
          <MatchProvider>
            <BrowserRouter>
              <PendingGate>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/leaderboard" element={<Leaderboard />} />
                  <Route path="/rules" element={<Rules />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/leagues" element={<Leagues />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
                  <Route
                    path="/leagues/new"
                    element={
                      <ProtectedRoute>
                        <NewLeague />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/league/:slug" element={<LeagueDetail />} />
                  <Route
                    path="/league/:slug/join/:inviteCode"
                    element={<JoinLeague />}
                  />
                  <Route
                    path="/league/:slug/edit"
                    element={
                      <ProtectedRoute>
                        <EditLeague />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/edit-profile"
                    element={
                      <ProtectedRoute>
                        <EditProfile />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/:userName" element={<UserProfile />} />
                </Routes>
              </PendingGate>
            </BrowserRouter>
          </MatchProvider>
        </LeagueProvider>
      </ToastProvider>
    </AuthProvider>
  </StrictMode>
);
