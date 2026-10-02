import { motion } from 'framer-motion';
import { Calendar, Flag, Plus, Target, TrendingUp, Trophy } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAppStore, useProjectSprints, useProjectTasks } from '../store';
import { formatDate, timeAgo } from '../lib/utils';
import { Avatar, Button, Card, Eyebrow, Progress } from '../components/ui';
import { ChartCard, ChartTooltip, useAxisTheme } from '../components/charts';
import { cn } from '../lib/utils';

export function Sprints() {
  const sprints = useProjectSprints();
  const tasks = useProjectTasks();
  const { users } = useAppStore();

  const active = sprints.find((s) => s.status === 'active');
  const completed = sprints.filter((s) => s.status === 'completed');
  const backlog = tasks.filter((t) => !t.sprintId && t.status !== 'done');

  const sprintTasks = useMemo(
    () => (active ? tasks.filter((t) => t.sprintId === active.id) : []),
    [tasks, active],
  );

  const donePoints = sprintTasks.filter((t) => t.status === 'done').reduce((a, t) => a + (t.points ?? 0), 0);
  const progressPct = active?.totalPoints ? Math.round((donePoints / active.totalPoints) * 100) : 0;

  const totalDays = active ? Math.max(1, Math.ceil((new Date(active.endDate).getTime() - new Date(active.startDate).getTime()) / 86400000)) : 14;
  const daysLeft = active ? Math.max(0, Math.ceil((new Date(active.endDate).getTime() - Date.now()) / 86400000)) : 0;
  const elapsed = totalDays - daysLeft;

  const velocityAvg = completed.length
    ? Math.round(completed.reduce((a, s) => a + (s.velocity ?? 0), 0) / completed.length)
    : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-[1200px] px-6 py-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow className="text-accent">Agile</Eyebrow>
          <h1 className="mt-0.5 text-xl font-bold tracking-tight text-ink">Sprints</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-mono text-2xl font-semibold text-ink">{velocityAvg}</p>
            <p className="text-[10px] tracking-wide text-ink3 uppercase">avg velocity</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-2xl font-semibold text-ink">{completed.length}</p>
            <p className="text-[10px] tracking-wide text-ink3 uppercase">sprints done</p>
          </div>
        </div>
      </div>

      {/* Active sprint hero */}
      {active && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mt-6 overflow-hidden rounded-2xl border border-border bg-surface shadow-card"
        >
          <div
            className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full opacity-25 blur-3xl"
            style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
          />
          <div className="relative grid grid-cols-1 gap-6 p-6 lg:grid-cols-[1fr_320px]">
            <div>
              <div className="flex items-center gap-2">
                <span className="live-dot h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-semibold tracking-widest text-emerald-500 uppercase">Active sprint</span>
              </div>
              <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-ink">{active.name}</h2>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-ink2">
                <Target className="h-3.5 w-3.5 text-ink3" />
                {active.goal}
              </p>
              <p className="mt-2 flex items-center gap-2 text-xs text-ink3">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(active.startDate)} → {formatDate(active.endDate)}
                <span className="text-ink3">·</span>
                {daysLeft} days remaining
              </p>

              <div className="mt-5">
                <div className="mb-1.5 flex items-baseline justify-between">
                  <span className="text-xs font-medium text-ink2">
                    {donePoints} of {active.totalPoints} points completed
                  </span>
                  <span className="font-mono text-sm font-semibold text-accent">{progressPct}%</span>
                </div>
                <Progress value={progressPct} className="h-2" barClassName="bg-gradient-to-r from-indigo-500 to-violet-500" />
                <div className="mt-1.5 flex justify-between text-[10px] text-ink3">
                  <span>Day {Math.min(elapsed, totalDays)} of {totalDays}</span>
                  <span>{active.totalPoints - donePoints} pts remaining</span>
                </div>
              </div>

              {/* Sprint stat chips */}
              <div className="mt-5 grid grid-cols-3 gap-3">
                {[
                  { label: 'Completed', value: sprintTasks.filter((t) => t.status === 'done').length, tone: 'text-emerald-500' },
                  { label: 'In progress', value: sprintTasks.filter((t) => t.status === 'in_progress' || t.status === 'review').length, tone: 'text-indigo-500' },
                  { label: 'Not started', value: sprintTasks.filter((t) => t.status === 'todo').length, tone: 'text-slate-400' },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-border bg-surface2/60 px-3.5 py-3">
                    <p className={cn('font-mono text-xl font-semibold', s.tone)}>{s.value}</p>
                    <p className="text-[10px] tracking-wide text-ink3 uppercase">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Mini burndown in hero */}
            <div className="flex flex-col justify-center">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-ink2">
                <TrendingUp className="h-3.5 w-3.5 text-ink3" />
                Burndown
              </p>
              <div className="h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={active.burndown} margin={{ top: 4, right: 4, left: -26, bottom: 0 }}>
                    <defs>
                      <linearGradient id="heroFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid {...useAxisTheme().grid} vertical={false} />
                    <XAxis dataKey="day" tick={useAxisTheme().tick} axisLine={useAxisTheme().axisLine} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={useAxisTheme().tick} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip suffix=" pts" />} />
                    <Area type="monotone" dataKey="ideal" name="Ideal" stroke="#8b93a7" strokeDasharray="5 4" strokeWidth={1.5} dot={false} />
                    <Area type="monotone" dataKey="actual" name="Actual" stroke="#6366f1" strokeWidth={2.5} fill="url(#heroFill)" dot={false} connectNulls />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <Link to="/app/analytics" className="mt-2 text-center text-xs font-medium text-accent hover:underline">
                Full analytics →
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      <div className="mt-4 grid grid-cols-12 gap-4">
        {/* Velocity history */}
        <ChartCard
          title="Velocity trend"
          subtitle="Completed points per sprint"
          className="col-span-12 xl:col-span-5"
          action={
            <span className="flex items-center gap-1.5 rounded-md bg-surface2 px-2 py-1 text-[10px] font-medium text-ink3">
              <Trophy className="h-3 w-3 text-amber-500" />
              best: {Math.max(...completed.map((s) => s.velocity ?? 0), 0)} pts
            </span>
          }
        >
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={completed.map((s) => ({ name: s.name.replace('Sprint ', 'S'), points: s.velocity ?? 0 }))}
                margin={{ top: 4, right: 8, left: -22, bottom: 0 }}
              >
                <CartesianGrid {...useAxisTheme().grid} vertical={false} />
                <XAxis dataKey="name" tick={useAxisTheme().tick} axisLine={useAxisTheme().axisLine} tickLine={false} />
                <YAxis tick={useAxisTheme().tick} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip suffix=" pts" />} />
                <Bar dataKey="points" name="Velocity" radius={[6, 6, 0, 0]} maxBarSize={44}>
                  {completed.map((_, i) => (
                    <Cell key={i} fill={i === completed.length - 1 ? '#a855f7' : '#6366f1'} fillOpacity={0.5 + (i / Math.max(1, completed.length)) * 0.5} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Sprint backlog */}
        <Card className="col-span-12 flex flex-col p-5 xl:col-span-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold tracking-tight text-ink">Sprint backlog</h3>
            <span className="rounded-md bg-surface2 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-ink3">
              {backlog.length} unassigned
            </span>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto">
            {backlog.length === 0 && <p className="py-8 text-center text-xs text-ink3">Backlog is empty — everything is sprinted.</p>}
            {backlog.slice(0, 8).map((t) => {
              const assignees = t.assigneeIds.map((id) => users.find((u) => u.id === id)).filter(Boolean) as { name: string; color: string; id: string }[];
              return (
                <Link
                  key={t.id}
                  to={`/app/board?task=${t.key}`}
                  className="block rounded-xl border border-border bg-surface2/40 p-3 transition-all hover:border-borderstrong hover:bg-surface2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-medium text-ink3">{t.key}</span>
                    <span className="flex items-center gap-1 rounded-md bg-surface2 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-ink2">
                      <Flag className="h-2.5 w-2.5 text-amber-500" />
                      {t.points ?? 0}pt
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs font-medium text-ink">{t.title}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="flex -space-x-1.5">
                      {assignees.slice(0, 2).map((u) => (
                        <Avatar key={u.id} name={u.name} color={u.color} size="xs" ring />
                      ))}
                    </span>
                    {t.dueDate && (
                      <span className="flex items-center gap-1 text-[10px] text-ink3">
                        <Calendar className="h-3 w-3" />
                        {formatDate(t.dueDate)}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
          <Button variant="secondary" size="sm" className="mt-3 w-full" onClick={() => (window.location.hash = '')}>
            <Plus className="h-3.5 w-3.5" />
            Plan next sprint
          </Button>
        </Card>

        {/* Sprint history */}
        <Card className="col-span-12 p-5 xl:col-span-3">
          <h3 className="text-sm font-semibold tracking-tight text-ink">History</h3>
          <p className="mt-0.5 text-xs text-ink3">Recent sprints</p>
          <div className="mt-4 space-y-1">
            {[...sprints].reverse().map((s) => (
              <div
                key={s.id}
                className={cn(
                  'rounded-xl border px-3.5 py-3 transition-colors',
                  s.status === 'active' ? 'border-accent/40 bg-accent/5' : 'border-border hover:bg-surface2/60',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-ink">{s.name}</span>
                  {s.status === 'active' ? (
                    <span className="live-dot h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  ) : s.status === 'planned' ? (
                    <span className="rounded bg-surface2 px-1.5 py-0.5 text-[9px] font-semibold text-ink3">PLANNED</span>
                  ) : (
                    <span className="font-mono text-[10px] font-semibold text-accent">{s.velocity}pt</span>
                  )}
                </div>
                <p className="mt-0.5 text-[10px] text-ink3">
                  {formatDate(s.startDate)} → {formatDate(s.endDate)}
                </p>
                {s.status !== 'active' && s.totalPoints > 0 && (
                  <Progress
                    value={s.status === 'completed' ? Math.round(((s.velocity ?? 0) / s.totalPoints) * 100) : 0}
                    className="mt-2"
                    barClassName={s.status === 'completed' ? 'bg-emerald-500' : 'bg-slate-400'}
                  />
                )}
                {s.status === 'active' && <Progress value={progressPct} className="mt-2" barClassName="bg-gradient-to-r from-indigo-500 to-violet-500" />}
              </div>
            ))}
          </div>
          <p className="mt-4 border-t border-border pt-3 text-[10px] leading-relaxed text-ink3">
            Last updated {timeAgo(new Date().toISOString())} · burndown samples daily at 9am.
          </p>
        </Card>
      </div>
    </motion.div>
  );
}
