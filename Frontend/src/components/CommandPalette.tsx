import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Check, CornerDownLeft, GitBranch, KanbanSquare, CircleDot, LayoutDashboard, Search, Sparkles, Sun, Moon, Plus, Zap } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { cn } from '../lib/utils';

interface PaletteItem {
  id: string;
  group: string;
  icon: React.ReactNode;
  label: string;
  hint?: string;
  keywords: string;
  run: () => void;
}

export function CommandPalette({ open, onClose, onNewTask }: { open: boolean; onClose: () => void; onNewTask: () => void }) {
  const navigate = useNavigate();
  const { tasks, issues, projects, users, toggleTheme, theme } = useAppStore();
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setIndex(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const items = useMemo<PaletteItem[]>(() => {
    const go = (to: string) => () => {
      navigate(to);
      onClose();
    };
    const out: PaletteItem[] = [
      { id: 'new-task', group: 'Actions', icon: <Plus className="h-4 w-4" />, label: 'Create new task', hint: '⌘N', keywords: 'create add task card', run: () => { onClose(); onNewTask(); } },
      { id: 'theme', group: 'Actions', icon: theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />, label: `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`, keywords: 'theme dark light mode', run: () => { toggleTheme(); } },
      { id: 'nav-dashboard', group: 'Navigate', icon: <LayoutDashboard className="h-4 w-4" />, label: 'Go to Dashboard', hint: 'G D', keywords: 'dashboard home overview', run: go('/app') },
      { id: 'nav-board', group: 'Navigate', icon: <KanbanSquare className="h-4 w-4" />, label: 'Go to Board', hint: 'G B', keywords: 'board kanban tasks', run: go('/app/board') },
      { id: 'nav-issues', group: 'Navigate', icon: <CircleDot className="h-4 w-4" />, label: 'Go to Issues', hint: 'G I', keywords: 'issues bugs', run: go('/app/issues') },
      { id: 'nav-sprints', group: 'Navigate', icon: <Zap className="h-4 w-4" />, label: 'Go to Sprints', hint: 'G S', keywords: 'sprints velocity burndown', run: go('/app/sprints') },
      { id: 'nav-github', group: 'Navigate', icon: <GitBranch className="h-4 w-4" />, label: 'Go to GitHub', hint: 'G H', keywords: 'github prs commits', run: go('/app/github') },
      { id: 'nav-notifications', group: 'Navigate', icon: <Bell className="h-4 w-4" />, label: 'Go to Notifications', keywords: 'notifications bell', run: go('/app/notifications') },
    ];
    for (const p of projects) {
      out.push({
        id: `project-${p.id}`,
        group: 'Projects',
        icon: <span className="h-2.5 w-2.5 rounded-sm" style={{ background: p.color }} />,
        label: `Open ${p.name}`,
        hint: p.key,
        keywords: `${p.name} ${p.key} project`,
        run: () => {
          useAppStore.getState().setProject(p.id);
          navigate('/app');
          onClose();
        },
      });
    }
    for (const t of tasks.slice(0, 60)) {
      out.push({
        id: `task-${t.id}`,
        group: 'Tasks',
        icon: <KanbanSquare className="h-4 w-4" />,
        label: t.title,
        hint: t.key,
        keywords: `${t.key} ${t.title} task`,
        run: () => {
          navigate(`/app/board?task=${t.key}`);
          onClose();
        },
      });
    }
    for (const i of issues.slice(0, 40)) {
      out.push({
        id: `issue-${i.id}`,
        group: 'Issues',
        icon: <CircleDot className="h-4 w-4" />,
        label: i.title,
        hint: i.key,
        keywords: `${i.key} ${i.title} issue bug`,
        run: () => {
          navigate(`/app/issues?issue=${i.key}`);
          onClose();
        },
      });
    }
    for (const u of users) {
      out.push({
        id: `user-${u.id}`,
        group: 'People',
        icon: <span className="flex h-4 w-4 items-center justify-center rounded-full text-[7px] font-bold text-white" style={{ background: u.color }}>{u.name[0]}</span>,
        label: u.name,
        hint: u.title,
        keywords: `${u.name} ${u.handle} ${u.title} person`,
        run: () => onClose(),
      });
    }
    return out;
  }, [tasks, issues, projects, users, navigate, onClose, onNewTask, toggleTheme, theme]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items.slice(0, 14);
    const scored = items
      .map((item) => {
        const label = item.label.toLowerCase();
        const kw = item.keywords.toLowerCase();
        let score = -1;
        if (label.startsWith(q)) score = 100;
        else if (label.includes(q)) score = 60;
        else if (kw.includes(q)) score = 30;
        // subsequence match
        if (score === -1) {
          let qi = 0;
          for (let i = 0; i < label.length && qi < q.length; i++) {
            if (label[i] === q[qi]) qi++;
          }
          if (qi === q.length) score = 10;
        }
        return { item, score };
      })
      .filter((s) => s.score >= 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 14);
    return scored.map((s) => s.item);
  }, [items, query]);

  useEffect(() => setIndex(0), [filtered.length]);

  useEffect(() => {
    const el = listRef.current?.children[index] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [index]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = filtered[index];
      if (item) item.run();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 px-4 pt-[14vh] backdrop-blur-sm"
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-surface shadow-pop"
          >
            <div className="flex items-center gap-2.5 border-b border-border px-4">
              <Search className="h-4 w-4 text-ink3" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKey}
                placeholder="Search or run a command…"
                className="h-13 flex-1 bg-transparent py-3.5 text-sm text-ink placeholder:text-ink3 focus:outline-none"
              />
              <kbd className="rounded-md border border-border bg-surface2 px-1.5 py-0.5 font-mono text-[10px] text-ink3">ESC</kbd>
            </div>
            <div ref={listRef} className="max-h-[340px] overflow-y-auto p-1.5">
              {filtered.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-10 text-ink3">
                  <Sparkles className="h-5 w-5" />
                  <p className="text-sm">No results for “{query}”</p>
                </div>
              )}
              {filtered.map((item, i) => (
                <button
                  key={item.id}
                  onMouseEnter={() => setIndex(i)}
                  onClick={() => item.run()}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors cursor-pointer',
                    i === index ? 'bg-accent/12 text-ink' : 'text-ink2',
                  )}
                >
                  <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border bg-surface2', i === index ? 'text-accent' : 'text-ink3')}>
                    {item.icon}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.hint && <span className="rounded-md border border-border bg-surface2 px-1.5 py-0.5 font-mono text-[10px] text-ink3">{item.hint}</span>}
                  {i === index && <CornerDownLeft className="h-3.5 w-3.5 text-ink3" />}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4 border-t border-border px-4 py-2 text-[10px] text-ink3">
              <span className="flex items-center gap-1"><kbd className="rounded border border-border bg-surface2 px-1 font-mono">↑↓</kbd> navigate</span>
              <span className="flex items-center gap-1"><kbd className="rounded border border-border bg-surface2 px-1 font-mono">↵</kbd> open</span>
              <span className="flex items-center gap-1"><Check className="h-3 w-3" /> {filtered.length} results</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
