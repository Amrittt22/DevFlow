import {
  Activity,
  Bell,
  ChevronsUpDown,
  Gauge,
  GitBranch,
  KanbanSquare,
  LayoutDashboard,
  CircleDot,
  Rocket,
  Settings,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store';
import { cn } from '../../lib/utils';
import { Avatar, Popover, MenuItem } from '../ui';
import { Logo } from './Logo';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const NAV: { section: string; items: NavItem[] }[] = [
  {
    section: 'Overview',
    items: [{ to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    section: 'Plan & build',
    items: [
      { to: '/app/board', label: 'Board', icon: KanbanSquare },
      { to: '/app/issues', label: 'Issues', icon: CircleDot },
      { to: '/app/sprints', label: 'Sprints', icon: Rocket },
    ],
  },
  {
    section: 'Connect',
    items: [
      { to: '/app/github', label: 'GitHub', icon: GitBranch },
      { to: '/app/activity', label: 'Activity', icon: Activity },
      { to: '/app/notifications', label: 'Notifications', icon: Bell },
    ],
  },
  {
    section: 'Insights',
    items: [{ to: '/app/analytics', label: 'Analytics', icon: Gauge }],
  },
];

export function Sidebar() {
  const navigate = useNavigate();
  const { workspaces, currentWorkspaceId, setWorkspace, projects, currentProjectId, setProject, user, signOut } = useAppStore();
  const unread = useAppStore((s) => s.notifications.filter((n) => !n.read).length);
  const workspace = workspaces.find((w) => w.id === currentWorkspaceId);
  const workspaceProjects = projects.filter((p) => p.workspaceId === currentWorkspaceId);

  return (
    <aside className="flex h-full w-[248px] shrink-0 flex-col border-r border-border bg-surface/60 backdrop-blur-xl">
      {/* Brand */}
      <div className="flex h-16 items-center px-5">
        <Logo />
      </div>

      {/* Workspace + project switcher */}
      <div className="space-y-2 px-3">
        <Popover
          trigger={
            <button className="flex w-full items-center gap-2.5 rounded-xl border border-border bg-surface px-3 py-2.5 text-left transition-colors hover:border-borderstrong cursor-pointer">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-bold text-white"
                style={{ background: workspace?.color ?? '#6366f1' }}
              >
                {workspace?.initials}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-ink">{workspace?.name}</span>
                <span className="block text-[10px] font-medium tracking-wide text-ink3 uppercase">{workspace?.plan} plan</span>
              </span>
              <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-ink3" />
            </button>
          }
          width="w-64"
        >
          {() => (
            <div className="p-1">
              <p className="px-2.5 py-1.5 text-[10px] font-semibold tracking-widest text-ink3 uppercase">Workspaces</p>
              {workspaces.map((w) => (
                <MenuItem
                  key={w.id}
                  active={w.id === currentWorkspaceId}
                  label={w.name}
                  hint={w.plan}
                  icon={
                    <span className="flex h-5 w-5 items-center justify-center rounded-md text-[9px] font-bold text-white" style={{ background: w.color }}>
                      {w.initials}
                    </span>
                  }
                  onClick={() => setWorkspace(w.id)}
                />
              ))}
            </div>
          )}
        </Popover>

        <Popover
          trigger={
            <button className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] text-ink2 transition-colors hover:bg-surface2 hover:text-ink cursor-pointer">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: workspaceProjects.find((p) => p.id === currentProjectId)?.color }} />
              <span className="truncate font-medium">{workspaceProjects.find((p) => p.id === currentProjectId)?.name}</span>
              <ChevronsUpDown className="ml-auto h-3 w-3 text-ink3" />
            </button>
          }
          width="w-56"
        >
          {() => (
            <div className="p-1">
              <p className="px-2.5 py-1.5 text-[10px] font-semibold tracking-widest text-ink3 uppercase">Projects</p>
              {workspaceProjects.map((p) => (
                <MenuItem
                  key={p.id}
                  active={p.id === currentProjectId}
                  label={p.name}
                  hint={p.key}
                  icon={<span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />}
                  onClick={() => setProject(p.id)}
                />
              ))}
            </div>
          )}
        </Popover>
      </div>

      {/* Nav */}
      <nav className="mt-4 flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {NAV.map((group) => (
          <div key={group.section}>
            <p className="px-2 pb-1.5 text-[10px] font-semibold tracking-[0.14em] text-ink3 uppercase">{group.section}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors',
                      isActive ? 'bg-accent/12 text-accent' : 'text-ink2 hover:bg-surface2 hover:text-ink',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-accent" />}
                      <item.icon className={cn('h-4 w-4', isActive ? 'text-accent' : 'text-ink3 group-hover:text-ink2')} />
                      <span className="flex-1">{item.label}</span>
                      {item.label === 'Notifications' && unread > 0 && (
                        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-white">
                          {unread}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="space-y-1 border-t border-border p-3">
        <NavLink
          to="/app/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors',
              isActive ? 'bg-accent/12 text-accent' : 'text-ink2 hover:bg-surface2 hover:text-ink',
            )
          }
        >
          <Settings className="h-4 w-4 text-ink3" />
          Settings
        </NavLink>
        <NavLink to="/app/settings" className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-ink2 transition-colors hover:bg-surface2 hover:text-ink">
          <Users className="h-4 w-4 text-ink3" />
          Members
        </NavLink>

        <Popover
          trigger={
            <button className="mt-1 flex w-full items-center gap-2.5 rounded-xl border border-border bg-surface px-2.5 py-2 text-left transition-colors hover:border-borderstrong cursor-pointer">
              {user && <Avatar name={user.name} color={user.color} size="sm" />}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-ink">{user?.name}</span>
                <span className="block truncate text-[10px] text-ink3">{user?.title}</span>
              </span>
              <Zap className={cn('h-3.5 w-3.5', user?.online ? 'text-emerald-500' : 'text-ink3')} />
            </button>
          }
          align="right"
          width="w-52"
        >
          {(close) => (
            <div className="p-1">
              <MenuItem label={user?.email ?? ''} hint="Active now" icon={<span className="h-2 w-2 rounded-full bg-emerald-500" />} onClick={close} />
              <MenuItem label="View profile" onClick={() => { close(); navigate('/app/settings'); }} />
              <MenuItem label="Sign out" danger onClick={() => { close(); signOut(); }} />
            </div>
          )}
        </Popover>
      </div>
    </aside>
  );
}
