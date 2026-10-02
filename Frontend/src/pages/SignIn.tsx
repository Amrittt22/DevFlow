import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Mail, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { Button, Input } from '../components/ui';
import { Logo } from '../components/layout/Logo';

// GitHub brand mark (lucide removed brand icons in v1).
function GitHubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.58.23 2.75.11 3.04.74.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.77 1.05.77 2.12 0 1.53-.01 2.76-.01 3.14 0 .31.2.67.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
    </svg>
  );
}

// Decorative mini kanban used on the marketing panel.
function MiniBoard() {
  const cards = [
    { col: 0, title: 'Zod schemas', chip: 'feature', tone: '#6366f1', y: 0 },
    { col: 0, title: 'Rate limiter', chip: 'security', tone: '#f43f5e', y: 1 },
    { col: 1, title: 'OAuth flow', chip: 'feature', tone: '#6366f1', y: 0 },
    { col: 1, title: 'RBAC guards', chip: 'devops', tone: '#10b981', y: 1 },
    { col: 2, title: 'Kanban dnd', chip: 'feature', tone: '#6366f1', y: 0 },
    { col: 3, title: 'Scaffolding', chip: 'devops', tone: '#10b981', y: 0 },
  ];
  const colLabels = ['To Do', 'In Progress', 'In Review', 'Done'];
  const colDots = ['#94a3b8', '#6366f1', '#f59e0b', '#10b981'];

  return (
    <div className="w-full max-w-md space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] font-semibold tracking-widest text-white/50 uppercase">Sprint 13</span>
        <span className="flex items-center gap-1.5 text-[10px] text-emerald-400">
          <span className="live-dot h-1.5 w-1.5 rounded-full bg-emerald-400" />
          live
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2.5">
        {colLabels.map((label, ci) => (
          <div key={label} className="rounded-xl border border-white/10 bg-white/[0.04] p-2 backdrop-blur-sm">
            <div className="mb-2 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: colDots[ci] }} />
              <span className="text-[9px] font-semibold tracking-wide text-white/60">{label}</span>
            </div>
            <div className="space-y-2">
              {cards
                .filter((c) => c.col === ci)
                .map((c) => (
                  <motion.div
                    key={c.title}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + c.y * 0.15 + ci * 0.1, duration: 0.4 }}
                    whileHover={{ y: -2 }}
                    className="rounded-lg border border-white/10 bg-white/[0.07] p-2"
                  >
                    <p className="text-[10px] font-medium leading-tight text-white/90">{c.title}</p>
                    <span
                      className="mt-1.5 inline-block rounded px-1 py-px text-[8px] font-semibold"
                      style={{ background: `${c.tone}26`, color: c.tone }}
                    >
                      {c.chip}
                    </span>
                  </motion.div>
                ))}
            </div>
          </div>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 backdrop-blur-sm"
      >
        <span className="flex items-center gap-1.5 text-[9px] text-white/50">
          <Sparkles className="h-3 w-3 text-violet-400" />
          Realtime sync · Socket.IO
        </span>
        <span className="flex items-center gap-1 text-[9px] text-white/50">
          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
          CI green
        </span>
      </motion.div>
    </div>
  );
}

export function SignIn() {
  const navigate = useNavigate();
  const signIn = useAppStore((s) => s.signIn);
  const init = useAppStore((s) => s.init);
  const [email, setEmail] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    init();
  }, [init]);

  const submitEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSent(true);
    setTimeout(() => {
      signIn(email);
      navigate('/app');
    }, 1400);
  };

  const oauth = (provider: 'github' | 'google') => {
    setSent(true);
    setTimeout(() => {
      signIn(provider === 'github' ? 'amritanshu@devflow.io' : undefined);
      navigate('/app');
    }, 1400);
  };

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Left — brand panel */}
      <div className="relative hidden w-[52%] overflow-hidden bg-[#0b0d14] lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        {/* Ambient glows */}
        <div className="pointer-events-none absolute -top-40 -left-40 h-[480px] w-[480px] rounded-full bg-indigo-600/25 blur-[120px]" />
        <div className="pointer-events-none absolute right-0 bottom-0 h-[420px] w-[420px] rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="dot-grid pointer-events-none absolute inset-0 opacity-[0.15]" />

        <div className="relative">
          <Logo size="lg" />
        </div>

        <div className="relative">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-lg text-4xl font-bold leading-[1.1] tracking-tight text-white xl:text-5xl"
          >
            Ship software
            <br />
            <span className="text-gradient">together, in flow.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mt-4 max-w-md text-[15px] leading-relaxed text-white/60"
          >
            DevFlow brings workspaces, Kanban boards, sprints, GitHub sync and
            engineering analytics into one realtime platform for developer teams.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mt-10"
          >
            <MiniBoard />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="relative flex items-center gap-6 text-[11px] text-white/40"
        >
          <span>PostgreSQL · Prisma</span>
          <span className="h-1 w-1 rounded-full bg-white/20" />
          <span>Redis · Supabase</span>
          <span className="h-1 w-1 rounded-full bg-white/20" />
          <span>Socket.IO · GitHub</span>
        </motion.div>
      </div>

      {/* Right — auth form */}
      <div className="relative flex flex-1 items-center justify-center px-6 py-12">
        <div className="dot-grid pointer-events-none absolute inset-0 opacity-[0.08]" />
        <div className="pointer-events-none absolute -top-20 right-0 h-72 w-72 rounded-full bg-indigo-600/10 blur-[100px]" />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative w-full max-w-sm"
        >
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-ink">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="mt-1.5 text-sm text-ink3">
            {mode === 'signin'
              ? 'Sign in to your workspace to continue.'
              : 'Start collaborating with your team in seconds.'}
          </p>

          {sent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-8 flex flex-col items-center rounded-2xl border border-border bg-surface p-8 text-center shadow-card"
            >
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10"
              >
                <Mail className="h-5 w-5 text-accent" />
              </motion.span>
              <p className="mt-4 text-sm font-semibold text-ink">Check your inbox</p>
              <p className="mt-1 text-xs leading-relaxed text-ink3">
                We sent a magic link to <span className="font-medium text-ink2">{email || 'your email'}</span>.
                Signing you in…
              </p>
            </motion.div>
          ) : (
            <form onSubmit={submitEmail} className="mt-8 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink2">Work email</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink3" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="h-11 pl-9"
                    autoFocus
                  />
                </div>
              </div>

              <Button type="submit" variant="primary" size="lg" className="w-full" disabled={!email.trim()}>
                Continue with email
                <ArrowRight className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-3 py-1">
                <span className="h-px flex-1 bg-border" />
                <span className="text-[10px] font-medium tracking-wide text-ink3 uppercase">or continue with</span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" size="lg" onClick={() => oauth('github')} className="w-full">
                  <GitHubMark className="h-4 w-4" />
                  GitHub
                </Button>
                <Button variant="outline" size="lg" onClick={() => oauth('google')} className="w-full">
                  <span className="flex h-4 w-4 items-center justify-center text-[11px] font-bold">G</span>
                  Google
                </Button>
              </div>

              <p className="pt-2 text-center text-xs text-ink3">
                {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
                <button
                  onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                  className="font-medium text-accent hover:underline cursor-pointer"
                >
                  {mode === 'signin' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </form>
          )}

          <p className="mt-10 text-center text-[10px] leading-relaxed text-ink3">
            Protected by Supabase Auth · RBAC · rate limiting
            <br />
            Demo: any email signs in, or use{' '}
            <button
              onClick={() => {
                signIn('amritanshu@devflow.io');
                navigate('/app');
              }}
              className="font-medium text-accent hover:underline cursor-pointer"
            >
              amritanshu@devflow.io
            </button>{' '}
            for instant access
          </p>
        </motion.div>
      </div>
    </div>
  );
}
