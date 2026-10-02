import { Bell, Command, Moon, Plus, RefreshCw, Search, Sun, Wifi } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore, useCurrentProject } from '../../store';
import { Button, IconButton, Popover } from '../ui';

export function Topbar({ onOpenPalette, onNewTask }: { onOpenPalette: () => void; onNewTask: () => void }) {
  const navigate = useNavigate();
  const project = useCurrentProject();
  const { theme, toggleTheme, liveSimulation, toggleLiveSimulation, github, syncGitHub } = useAppStore();
  const unread = useAppStore((s) => s.notifications.filter((n) => !n.read).length);
  const [syncing, setSyncing] = useState(false);

  const sync = async () => {
    setSyncing(true);
    await syncGitHub();
    setSyncing(false);
  };

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-surface/60 px-5 backdrop-blur-xl">
      {/* Project breadcrumb */}
      <div className="flex min-w-0 items-center gap-2">
        <button
          onClick={() => navigate('/app')}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-ink2 transition-colors hover:bg-surface2 hover:text-ink cursor-pointer"
        >
          <span className="h-2 w-2 rounded-sm" style={{ background: project?.color }} />
          <span className="truncate">{project?.name}</span>
        </button>
        <span className="text-ink3">/</span>
        <span className="rounded-md border border-border bg-surface2 px-1.5 py-0.5 font-mono text-[10px] font-medium text-ink3">
          {project?.key}
        </span>
      </div>

      {/* Search */}
      <button
        onClick={onOpenPalette}
        className="mx-auto flex h-9 w-full max-w-md items-center gap-2.5 rounded-xl border border-border bg-surface px-3 text-sm text-ink3 transition-all hover:border-borderstrong hover:text-ink2 cursor-pointer"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="flex-1 text-left">Search tasks, issues, commands…</span>
        <kbd className="flex items-center gap-0.5 rounded-md border border-border bg-surface2 px-1.5 py-0.5 font-mono text-[10px] text-ink3">
          <Command className="h-2.5 w-2.5" />K
        </kbd>
      </button>

      {/* Right actions */}
      <div className="flex items-center gap-1.5">
        {github.connected && (
          <IconButton label="Sync GitHub" onClick={sync}>
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          </IconButton>
        )}

        <Popover
          trigger={
            <button
              className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors cursor-pointer ${
                liveSimulation
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                  : 'border-border text-ink3 hover:text-ink2'
              }`}
              title="Simulate realtime teammate activity (Socket.IO gateway)"
            >
              <Wifi className="h-3.5 w-3.5" />
              <span className={liveSimulation ? 'live-dot inline-block h-1.5 w-1.5 rounded-full bg-emerald-500' : ''} />
              Live
            </button>
          }
          align="right"
          width="w-72"
        >
          {(close) => (
            <div className="p-1">
              <button
                onClick={() => { toggleLiveSimulation(); close(); }}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm text-ink2 hover:bg-surface2 cursor-pointer"
              >
                <span>Simulate teammate activity</span>
                <span className={liveSimulation ? 'text-emerald-500' : 'text-ink3'}>{liveSimulation ? 'On' : 'Off'}</span>
              </button>
              <p className="px-2.5 py-2 text-[11px] leading-relaxed text-ink3">
                The realtime layer stands in for the Socket.IO gateway (spec §10). When on, fake
                teammates move cards, comment and open PRs — with toasts, activity entries and
                notification badges, just like the production system.
              </p>
            </div>
          )}
        </Popover>

        <IconButton label="Toggle theme" onClick={toggleTheme}>
          {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </IconButton>

        <button
          onClick={() => navigate('/app/notifications')}
          className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink3 transition-colors hover:bg-surface2 hover:text-ink cursor-pointer"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-danger px-0.5 text-[8px] font-bold text-white ring-2 ring-surface">
              {unread}
            </span>
          )}
        </button>

        <Button variant="primary" size="sm" onClick={onNewTask} className="ml-1">
          <Plus className="h-3.5 w-3.5" />
          New task
        </Button>
      </div>
    </header>
  );
}
