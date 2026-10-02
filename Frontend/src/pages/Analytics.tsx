import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, CircleDot, Clock3, Flame, GitPullRequest, Lightbulb, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
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
import { useAppStore, useCurrentProject, useProjectIssues, useProjectSprints, useProjectTasks } from '../store';
import { commitActivity } from '../lib/mock/data';
import { CHART_COLORS, ChartCard, ChartTooltip, useAxisTheme } from '../components/charts';
import { Card, Eyebrow, Stat } from '../components/ui';

export function Analytics() {
  const project = useCurrentProject();
  const tasks = useProjectTasks();
  const issues = useProjectIssues();
  const sprints = useProjectSprints();

  const metrics = useMemo(() => {
    const done = tasks.filter((t) => t.status === 'done');
    const open = tasks.filter((t) => t.status !== 'done');
    const completionRate = tasks.length ? Math.round((done.length / tasks.length) * 100) : 0;
    const urgent = issues.filter((i) => i.priority === 'urgent' && i.status !== 'closed').length;
    const avgResolution = 1.8 + (issues.length % 3) * 0.4; // simulated hours
    const cycleTime = 2.4 - (done.length % 4) * 0.2;
    const commits14 = commitActivity();
    const totalCommits = commits14.reduce((a, c) => a + c.commits, 0);
    return { done, open, completionRate, urgent, avgResolution, cycleTime, commits14, totalCommits };
  }, [tasks, issues]);

  // Tasks completed per day (simulated from burndown of active sprint)
  const activeSprint = sprints.find((s) => s.status === 'active');
  const completionTrend = useMemo(() => {
    const burndown = activeSprint?.burndown ?? [];
    let cumulative = 0;
    return burndown
      .filter((b) => b.actual !== null)
      .map((b) => {
        const prev = cumulative;
        cumulative = (activeSprint?.totalPoints ?? 0) - (b.actual ?? 0);
        return { day: b.day, completed: Math.max(0, cumulative - prev), cumulative };
      });
  }, [activeSprint]);

  // Cycle time per assignee
  const assigneeCycle = useMemo(() => {
    const users = useAppStore.getState().users;
    return users
      .slice(0, 6)
      .map((u) => ({
        name: u.name.split(' ')[0],
        days: +(1.6 + ((u.id.charCodeAt(2) ?? 3) % 5) * 0.45).toFixed(1),
      }))
      .sort((a, b) => b.days - a.days);
  }, []);

  // Issue resolution donut
  const issueDonut = useMemo(() => {
    const byLabel: Record<string, number> = {};
    for (const i of issues) {
      for (const l of i.labelIds) {
        const name = useAppStore.getState().labels.find((x) => x.id === l)?.name ?? l;
        byLabel[name] = (byLabel[name] ?? 0) + 1;
      }
    }
    return Object.entries(byLabel)
      .map(([name, value], i) => ({ name, value, color: CHART_COLORS[i % CHART_COLORS.length] }))
      .slice(0, 5);
  }, [issues]);

  const throughput = commitActivity();

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-350 px-6 py-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow className="text-accent">Insights</Eyebrow>
          <h1 className="mt-0.5 text-xl font-bold tracking-tight text-ink">Engineering analytics</h1>
          <p className="mt-1 text-sm text-ink3">
            Project signals for {project?.name} — not simplistic productivity scores.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-ink3">
          <span className="rounded-lg border border-border bg-surface px-3 py-1.5">Last 14 days</span>
          <span className="rounded-lg border border-border bg-surface px-3 py-1.5">All members</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Stat label="Completion rate" value={`${metrics.completionRate}%`} delta="+6% vs last sprint" deltaTone="up" icon={<TrendingUp className="h-4 w-4" />} />
        <Stat label="Avg cycle time" value={`${metrics.cycleTime.toFixed(1)}d`} delta="-0.3d" deltaTone="up" icon={<Clock3 className="h-4 w-4" />} />
        <Stat label="Issue resolution" value={`${metrics.avgResolution.toFixed(1)}h`} delta="median" deltaTone="neutral" icon={<CircleDot className="h-4 w-4" />} />
        <Stat label="Commits (14d)" value={metrics.totalCommits} delta={`+${Math.round(metrics.totalCommits / 9)} this week`} deltaTone="up" icon={<GitPullRequest className="h-4 w-4" />} />
      </div>

      {/* Charts */}
      <div className="mt-4 grid grid-cols-12 gap-4">
        <ChartCard
          title="Throughput"
          subtitle="Tasks completed per day · cumulative line"
          className="col-span-12 xl:col-span-8"
          action={
            <span className="flex items-center gap-3 text-[10px] text-ink3">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-indigo-500" /> Per day</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-violet-500" /> Cumulative</span>
            </span>
          }
        >
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={completionTrend} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="cumFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...useAxisTheme().grid} vertical={false} />
                <XAxis dataKey="day" tick={useAxisTheme().tick} axisLine={useAxisTheme().axisLine} tickLine={false} />
                <YAxis tick={useAxisTheme().tick} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip suffix=" pts" />} />
                <Area type="monotone" dataKey="cumulative" name="Cumulative" stroke="#a855f7" strokeWidth={2} fill="url(#cumFill)" dot={false} />
                <Bar dataKey="completed" name="Per day" fill="#6366f1" radius={[3, 3, 0, 0]} maxBarSize={14} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Cycle time by assignee" subtitle="Average days from start to done" className="col-span-12 md:col-span-6 xl:col-span-4">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={assigneeCycle} layout="vertical" margin={{ top: 0, right: 12, left: 8, bottom: 0 }}>
                <CartesianGrid {...useAxisTheme().grid} horizontal={false} />
                <XAxis type="number" tick={useAxisTheme().tick} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: useAxisTheme().tick.fill, fontSize: 11 }} axisLine={false} tickLine={false} width={64} />
                <Tooltip content={<ChartTooltip suffix=" days" />} />
                <Bar dataKey="days" name="Cycle time" radius={[0, 6, 6, 0]} maxBarSize={18}>
                  {assigneeCycle.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? '#f43f5e' : CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Commit activity" subtitle="Commits & PRs per day" className="col-span-12 md:col-span-6 xl:col-span-7">
          <div className="h-55">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={throughput} margin={{ top: 4, right: 8, left: -22, bottom: 0 }} barGap={2}>
                <CartesianGrid {...useAxisTheme().grid} vertical={false} />
                <XAxis dataKey="day" tick={useAxisTheme().tick} axisLine={useAxisTheme().axisLine} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={useAxisTheme().tick} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="commits" name="Commits" fill="#6366f1" radius={[3, 3, 0, 0]} maxBarSize={16} />
                <Bar dataKey="prs" name="PRs" fill="#06b6d4" radius={[3, 3, 0, 0]} maxBarSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Issues by label" subtitle="Where the pain is" className="col-span-12 md:col-span-6 xl:col-span-5">
          <div className="flex items-center">
            <div className="relative h-45 w-45">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={issueDonut} dataKey="value" nameKey="name" innerRadius={52} outerRadius={76} paddingAngle={3} strokeWidth={0}>
                    {issueDonut.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-xl font-semibold text-ink">{issues.length}</span>
                <span className="text-[10px] tracking-wide text-ink3 uppercase">issues</span>
              </div>
            </div>
            <div className="ml-3 flex-1 space-y-2">
              {issueDonut.map((d) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                  <span className="flex-1 truncate font-mono text-ink2">{d.name}</span>
                  <span className="font-mono font-semibold text-ink">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        {/* Insights */}
        <div className="col-span-12 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: <Flame className="h-4 w-4 text-amber-500" />,
              title: 'Sprint 13 is ahead of schedule',
              body: 'Actual burn is tracking 12% below the ideal line. At this pace the sprint completes with ~6 points of slack — consider pulling in DF-28.',
              tone: 'text-emerald-500',
              delta: '+12%',
            },
            {
              icon: <Clock3 className="h-4 w-4 text-indigo-400" />,
              title: 'Review is the bottleneck',
              body: 'Cards spend an average of 1.9 days in "In Review" vs 0.4 days in progress. Two open PRs have been waiting over 24h for review.',
              tone: 'text-amber-500',
              delta: '1.9d',
            },
            {
              icon: <Lightbulb className="h-4 w-4 text-cyan-400" />,
              title: 'Bugs cluster around auth',
              body: '4 of the last 8 issues touch the auth flow (IS-2, IS-8, IS-10). A focused hardening pass could prevent recurring regressions.',
              tone: 'text-rose-500',
              delta: '4 issues',
            },
          ].map((insight) => (
            <Card key={insight.title} className="p-5">
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface2">{insight.icon}</span>
                <span className={`font-mono text-sm font-semibold ${insight.tone}`}>{insight.delta}</span>
              </div>
              <h3 className="mt-3 text-sm font-semibold text-ink">{insight.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-ink2">{insight.body}</p>
            </Card>
          ))}
        </div>
      </div>

      <p className="mt-6 flex items-center gap-1.5 text-[10px] text-ink3">
        <ArrowUpRight className="h-3 w-3" />
        Metrics are project signals per spec §12 — velocity, resolution time and progress are context, not leaderboards.
        <ArrowDownRight className="h-3 w-3" />
      </p>
    </motion.div>
  );
}
