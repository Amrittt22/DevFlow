import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';import { AnimatePresence, motion } from 'framer-motion';
import { AppShell } from './components/layout/AppShell';
import { SignIn } from './pages/SignIn';
import { Dashboard } from './pages/Dashboard';
import { Board } from './pages/Board';
import { Issues } from './pages/Issues';
import { Sprints } from './pages/Sprints';
import { GitHub } from './pages/GitHub';
import { Analytics } from './pages/Analytics';
import { Activity } from './pages/Activity';
import { Notifications } from './pages/Notifications';
import { Settings } from './pages/Settings';
import { useAppStore } from './store';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = useAppStore((s) => s.user);
  const init = useAppStore((s) => s.init);
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    init().finally(() => setBooted(true));
  }, [init]);

  if (!booted) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-accent to-accent2"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
              <path d="M7 18v-4.5a3 3 0 0 1 3-3h4.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
              <circle cx="7" cy="7.5" r="2.4" fill="white" />
              <circle cx="17" cy="12" r="2.4" fill="white" />
              <path d="M12 12h2.6" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </motion.div>
          <p className="text-xs font-medium tracking-wide text-ink3">Loading your workspace…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
}

function AnimatedRoutes() {
  const location = useLocation();
  const user = useAppStore((s) => s.user);

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/signin" element={user ? <Navigate to="/app" replace /> : <SignIn />} />
        <Route
          path="/app"
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="board" element={<Board />} />
          <Route path="issues" element={<Issues />} />
          <Route path="sprints" element={<Sprints />} />
          <Route path="github" element={<GitHub />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="activity" element={<Activity />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export function App() {
  const theme = useAppStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}

// Re-export for page transitions on route change (subtle fade/slide).
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      {children}
    </motion.div>
  );
}
