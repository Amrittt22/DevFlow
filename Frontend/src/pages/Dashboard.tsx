import { motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowUpRight,
  CircleDot,
  Flame,
  GitBranch,
  KanbanSquare,
  Rocket,
} from 'lucide-react';
import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { STATUS_META } from '../lib/meta';
import { useAppStore, useCurrentProject, useProjectActivity, useProjectIssues, useProjectSprints, useProjectTasks } from '../store';
import { commitActivity } from '../lib/mock/data';
import { timeAgo } from '../lib/utils';
import { Avatar, Card, Eyebrow, Progress, Skeleton, Stat } from '../components/ui';
import { AvatarGroup, PriorityChip } from '../components/Pickers';
import { ChartCard, ChartTooltip, useAxisTheme } from '../components/charts';

const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export function Dashboard() {
  const navigate = useNavigate();
  const project = useCurrentProject();
  const tasks = useProjectTasks();
  const issues = useProjectIssues();
  const sprints = useProjectSprints();
  const { users, user, isLoading } = useAppStore();

  const data = useMemo(() => {
    const byStatus = (tasks ?? []).reduce(
      (acc, t) => ({ ...acc, [t.status]: (acc[t.status] ?? 0) + 1 }),
      {} as Record<string, number>,
    );
    const activeSprint = (sprints ?? []).find((s) => s.status === 'active');
    const totalPoints = activeSprint?.totalPoints ?? 0;
    const donePoints = (tasks ?? []).filter((t) => t.status === 'done' && t.sprintId === activeSprint?.id).reduce((a, t) => a + (t.points ?? 0), 0);
    const sprintPct = totalPoints ? Math.round((donePoints / totalPoints) * 100) : 0;
    const myTasks = (tasks ?? []).filter((t) => t.assigneeIds.includes(user?.id ?? '') && t.status !== 'done').slice(0, 5);
    const openIssues = (issues ?? []).filter((i) => i.status !== 'closed');
    const velocity = (sprints ?? []).filter((s) => s.status === 'completed').slice(-4);
    const burndown = activeSprint?.burndown ?? [];
    const donutHex = Object.entries(STATUS_META).map(([id, m], idx) => ({
      name: m.label,
      value: byStatus[id] ?? 0,
      color: ['#94a3b8', '#6366f1', '#f59e0b', '#10b981'][idx],
    }));
    return { byStatus, activeSprint, sprintPct, donePoints, totalPoints, myTasks, openIssues, velocity, burndown, donutHex };
  }, [tasks, issues, sprints, user]);

  if (isLoading || !project) {
    return (
      <div className="mx-auto max-w-[1400px] space-y-4 px-6 py-6">
        <Skeleton className="h-9 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-12 gap-4">
          <Skeleton className="col-span-8 h-72" />
          <Skeleton className="col-span-4 h-72" />
        </div>
      </div>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const velocityData = data.velocity.map((s) => ({ name: s.name.replace('Sprint ', 'S'), points: s.velocity ?? 0 }));
  const commits = commitActivity().slice(-7);

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.05 } } }}
      className="mx-auto max-w-[1400px] px-6 py-6"
    >
      {/* Header */}
      <motion.div variants={item} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow className="text-accent">{project.name} · {project.key}</Eyebrow>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink">
            {greeting}, {user?.name.split(' ')[0]}
          </h1>
          <p className="mt-1 text-sm text-ink3">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })} — here's what's moving.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/app/board" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3.5 text-sm font-medium text-white shadow-[0_4px_14px_-4px_var(--ring)] transition-colors hover:bg-accentstrong">
            <KanbanSquare className="h-4 w-4" />
            Open board
          </Link>
          <Link to="/app/github" className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3.5 text-sm font-medium text-ink2 transition-colors hover:text-ink">
            <GitBranch className="h-4 w-4" />
            GitHub
          </Link>
        </div>
      </motion.div>

      {/* Stat cards */}
      <motion.div variants={item} className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Stat
          label="Open tasks"
          value={(data.byStatus.todo ?? 0) + (data.byStatus.in_progress ?? 0) + (data.byStatus.review ?? 0)}
          delta="+3 this week"
          deltaTone="up"
          icon={<KanbanSquare className="h-4 w-4" />}
        />
        <Stat
          label="In review"
          value={data.byStatus.review ?? 0}
          delta="PRs ready"
          deltaTone="neutral"
          icon={<ArrowUpRight className="h-4 w-4" />}
        />
        <Stat
          label="Open issues"
          value={data.openIssues.length}
          delta={`${data.openIssues.filter((i) => i.priority === 'urgent').length} urgent`}
          deltaTone="down"
          icon={<CircleDot className="h-4 w-4" />}
        />
        <Stat
          label="Sprint progress"
          value={`${data.sprintPct}%`}
          delta={`${data.donePoints}/${data.totalPoints} pts`}
          deltaTone="up"
          icon={<Rocket className="h-4 w-4" />}
        />
      </motion.div>

      {/* Main grid */}
      <div className="mt-4 grid grid-cols-12 gap-4">
        {/* Burndown */}
        <motion.div variants={item} className="col-span-12 xl:col-span-8">
          <ChartCard
            title={`${data.activeSprint?.name ?? 'Sprint'} burndown`}
            subtitle={`${data.activeSprint?.goal ?? ''}`}
            action={
              <Link to="/app/sprints" className="flex items-center gap-1 text-xs font-medium text-accent hover:underline">
                Sprints <ArrowRight className="h-3 w-3" />
              </Link>
            }
          >
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.burndown} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="actualFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...useAxisTheme().grid} vertical={false} />
                  <XAxis dataKey="day" tick={useAxisTheme().tick} axisLine={useAxisTheme().axisLine} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={useAxisTheme().tick} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip suffix=" pts" />} />
                  <Area type="monotone" dataKey="ideal" name="Ideal" stroke="#8b93a7" strokeDasharray="5 4" strokeWidth={1.5} dot={false} />
                  <Area type="monotone" dataKey="actual" name="Actual" stroke="#6366f1" strokeWidth={2.5} fill="url(#actualFill)" dot={false} activeDot={{ r: 4 }} connectNulls />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </motion.div>

        {/* My tasks */}
        <motion.div variants={item} className="col-span-12 xl:col-span-4">
          <Card className="flex h-full flex-col p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold tracking-tight text-ink">My open tasks</h3>
              <span className="rounded-md bg-surface2 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-ink3">
                {data.myTasks.length}
              </span>
            </div>
            <div className="flex-1 space-y-2">
              {data.myTasks.length === 0 && <p className="py-8 text-center text-xs text-ink3">All clear — nothing assigned to you.</p>}
              {data.myTasks.map((t) => (
                <button
                  key={t.id}
                  onClick={() => navigate(`/app/board?task=${t.key}`)}
                  className="w-full rounded-xl border border-border bg-surface2/50 p-3 text-left transition-all hover:border-borderstrong hover:bg-surface2 cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-medium text-ink3">{t.key}</span>
                    <PriorityChip priority={t.priority} />
                  </div>
                  <p className="mt-1 line-clamp-2 text-[13px] font-medium text-ink">{t.title}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <AvatarGroup ids={t.assigneeIds} />
                    <span className={`h-1.5 w-1.5 rounded-full ${STATUS_META[t.status].dot}`} />
                  </div>
                </button>
              ))}
            </div>
            <Link to="/app/board" className="mt-3 flex items-center justify-center gap-1 rounded-lg border border-border py-2 text-xs font-medium text-ink2 transition-colors hover:text-ink">
              View board <ArrowRight className="h-3 w-3" />
            </Link>
          </Card>
        </motion.div>

        {/* Donut */}
        <motion.div variants={item} className="col-span-12 md:col-span-6 xl:col-span-4">
          <ChartCard title="Task distribution" subtitle="Across all statuses">
            <div className="flex items-center">
              <div className="relative h-[150px] w-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.donutHex} dataKey="value" nameKey="name" innerRadius={48} outerRadius={68} paddingAngle={3} strokeWidth={0}>
                      {data.donutHex.map((d, i) => (
                        <Cell key={i} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-mono text-xl font-semibold text-ink">{tasks?.length ?? 0}</span>
                  <span className="text-[10px] tracking-wide text-ink3 uppercase">tasks</span>
                </div>
              </div>
              <div className="ml-2 flex-1 space-y-2">
                {data.donutHex.map((d) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                    <span className="flex-1 text-ink2">{d.name}</span>
                    <span className="font-mono font-semibold text-ink">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>
        </motion.div>

        {/* Velocity + commits */}
        <motion.div variants={item} className="col-span-12 md:col-span-6 xl:col-span-4">
          <ChartCard title="Sprint velocity" subtitle="Points completed per sprint">
            <div className="h-[190px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={velocityData} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
                  <CartesianGrid {...useAxisTheme().grid} vertical={false} />
                  <XAxis dataKey="name" tick={useAxisTheme().tick} axisLine={useAxisTheme().axisLine} tickLine={false} />
                  <YAxis tick={useAxisTheme().tick} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip suffix=" pts" />} />
                  <Bar dataKey="points" name="Velocity" radius={[6, 6, 0, 0]} maxBarSize={38}>
                    {velocityData.map((_, i) => (
                      <Cell key={i} fill={i === velocityData.length - 1 ? '#a855f7' : '#6366f1'} fillOpacity={0.55 + i * 0.15} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </motion.div>

        {/* Activity feed */}
        <motion.div variants={item} className="col-span-12 xl:col-span-4">
          <Card className="flex h-full flex-col p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold tracking-tight text-ink">Live activity</h3>
              <span className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-500">
                <span className="live-dot h-1.5 w-1.5 rounded-full bg-emerald-500" />
                realtime
              </span>
            </div>
            <ActivityFeed limit={7} />
            <Link to="/app/activity" className="mt-3 flex items-center justify-center gap-1 rounded-lg border border-border py-2 text-xs font-medium text-ink2 transition-colors hover:text-ink">
              Full feed <ArrowRight className="h-3 w-3" />
            </Link>
          </Card>
        </motion.div>

        {/* Commit activity */}
        <motion.div variants={item} className="col-span-12 xl:col-span-8">
          <ChartCard
            title="Engineering throughput"
            subtitle="Commits and merged PRs · last 7 days"
            action={
              <span className="flex items-center gap-3 text-[10px] text-ink3">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-indigo-500" /> Commits</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-violet-500" /> PRs</span>
              </span>
            }
          >
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={commits} margin={{ top: 4, right: 8, left: -22, bottom: 0 }} barGap={3}>
                  <CartesianGrid {...useAxisTheme().grid} vertical={false} />
                  <XAxis dataKey="day" tick={useAxisTheme().tick} axisLine={useAxisTheme().axisLine} tickLine={false} />
                  <YAxis tick={useAxisTheme().tick} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="commits" name="Commits" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={22} />
                  <Bar dataKey="prs" name="PRs" fill="#a855f7" radius={[4, 4, 0, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </motion.div>

        {/* Team workload */}
        <motion.div variants={item} className="col-span-12 xl:col-span-4">
          <Card className="p-5">
            <h3 className="text-sm font-semibold tracking-tight text-ink">Team workload</h3>
            <p className="mt-0.5 text-xs text-ink3">Open tasks per member</p>
            <div className="mt-4 space-y-3">
              {(users ?? [])
                .map((u) => ({
                  user: u,
                  count: (tasks ?? []).filter((t) => t.assigneeIds.includes(u.id) && t.status !== 'done').length,
                }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 6)
                .map(({ user: u, count }) => (
                  <div key={u.id} className="flex items-center gap-3">
                    <Avatar name={u.name} color={u.color} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between">
                        <span className="truncate text-xs font-medium text-ink">{u.name}</span>
                        <span className="font-mono text-[10px] font-semibold text-ink3">{count}</span>
                      </div>
                      <Progress value={count * 14} className="mt-1" barClassName="bg-gradient-to-r from-indigo-500 to-violet-500" />
                    </div>
                  </div>
                ))}
            </div>
            <div className="mt-4 border-t border-border pt-3">
              <p className="flex items-center gap-1.5 text-[11px] text-ink3">
                <Flame className="h-3.5 w-3.5 text-amber-500" />
                {data.openIssues.filter((i) => i.priority === 'urgent').length} urgent issues need triage
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

export function ActivityFeed({ limit = 10 }: { limit?: number }) {
  const activities = useProjectActivity();
  const users = useAppStore((s) => s.users);

  return (
    <div className="relative space-y-4 pl-1">
      {activities.slice(0, limit).map((a) => {
        const actor = users.find((u) => u.id === a.actorId);
        return (
          <div key={a.id} className="flex gap-3">
            {actor && <Avatar name={actor.name} color={actor.color} size="sm" />}
            <div className="min-w-0 flex-1">
              <p className="text-xs leading-relaxed text-ink2">
                <span className="font-semibold text-ink">{actor?.name.split(' ')[0]}</span>{' '}
                {a.message}
              </p>
              <p className="mt-0.5 font-mono text-[10px] text-ink3">{timeAgo(a.createdAt)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
