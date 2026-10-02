import { motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  Clock,
  ExternalLink,
  GitBranch,
  GitCommit,
  GitFork,
  GitPullRequest,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  Star,
  Unplug,
  XCircle,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore, useCurrentProject } from '../store';
import { timeAgo } from '../lib/utils';
import { Avatar, Badge, Button, Card, CardHeader, Eyebrow, Tabs } from '../components/ui';
import { cn } from '../lib/utils';

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  Rust: '#f74c00',
  Go: '#00add8',
  Python: '#3572a5',
};

export function GitHub() {
  const project = useCurrentProject();
  const { github, connectGitHub, disconnectGitHub, syncGitHub, users } = useAppStore();
  const [tab, setTab] = useState('repos');
  const [syncing, setSyncing] = useState(false);

  const doSync = async () => {
    setSyncing(true);
    await syncGitHub();
    setSyncing(false);
  };

  if (!github.connected) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto flex max-w-2xl flex-col items-center px-6 py-24 text-center">
        <div className="dot-grid relative flex h-24 w-24 items-center justify-center rounded-3xl border border-border bg-surface shadow-card">
          <GitBranch className="h-10 w-10 text-accent" />
        </div>
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-ink">Connect GitHub</h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-ink2">
          Sync repositories, pull requests, branches and commits into {project?.name}. Link issues to PRs and
          receive webhook events — with signature verification and idempotent delivery (spec §11).
        </p>
        <div className="mt-6 grid grid-cols-3 gap-3 text-left">
          {[
            { icon: <GitPullRequest className="h-4 w-4" />, title: 'PR intelligence', body: 'Status, checks, +/− lines' },
            { icon: <GitCommit className="h-4 w-4" />, title: 'Commit feed', body: 'Per-branch activity stream' },
            { icon: <Zap className="h-4 w-4" />, title: 'Webhooks', body: 'Retries + signature checks' },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-surface p-3.5">
              <span className="text-accent">{f.icon}</span>
              <p className="mt-2 text-xs font-semibold text-ink">{f.title}</p>
              <p className="mt-0.5 text-[10px] text-ink3">{f.body}</p>
            </div>
          ))}
        </div>
        <Button variant="primary" size="lg" className="mt-8" onClick={connectGitHub}>
          <Plus className="h-4 w-4" />
          Connect GitHub — OAuth
        </Button>
        <p className="mt-3 text-[10px] text-ink3">Demo mode: simulated connection, no real OAuth round-trip.</p>
      </motion.div>
    );
  }

  const openPrs = github.pullRequests.filter((pr) => pr.state === 'open');
  const mergedThisWeek = github.pullRequests.filter((pr) => pr.state === 'merged').length;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-[1200px] px-6 py-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-neutral-700 to-neutral-900 text-white">
            <GitBranch className="h-5 w-5" />
          </div>
          <div>
            <Eyebrow className="text-accent">Integration</Eyebrow>
            <h1 className="text-xl font-bold tracking-tight text-ink">
              GitHub <span className="font-mono text-sm font-medium text-ink3">@{github.login}</span>
            </h1>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500">
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Connected
          </Badge>
          <Button variant="secondary" size="md" onClick={doSync} disabled={syncing}>
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Sync now
          </Button>
          <Button variant="ghost" size="md" onClick={disconnectGitHub}>
            <Unplug className="h-4 w-4" />
            Disconnect
          </Button>
        </div>
      </div>

      {/* Summary strip */}
      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Repositories', value: github.repos.length, icon: <GitFork className="h-4 w-4" /> },
          { label: 'Open PRs', value: openPrs.length, icon: <GitPullRequest className="h-4 w-4" /> },
          { label: 'Merged (all)', value: mergedThisWeek, icon: <GitMergeIcon /> },
          { label: 'Active branches', value: github.branches.length, icon: <GitBranch className="h-4 w-4" /> },
        ].map((s) => (
          <Card key={s.label} className="flex items-center gap-3.5 p-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">{s.icon}</span>
            <div>
              <p className="font-mono text-xl font-semibold text-ink">{s.value}</p>
              <p className="text-[10px] tracking-wide text-ink3 uppercase">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="mt-6">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'repos', label: 'Repositories' },
            { id: 'prs', label: 'Pull requests' },
            { id: 'commits', label: 'Commits' },
            { id: 'branches', label: 'Branches' },
          ]}
          counts={{ repos: github.repos.length, prs: github.pullRequests.length, commits: github.commits.length, branches: github.branches.length }}
        />

        <div className="mt-4">
          {tab === 'repos' && (
            <div className="grid gap-4 md:grid-cols-2">
              {github.repos.map((repo, i) => (
                <motion.div key={repo.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="group h-full p-5 transition-all hover:border-borderstrong hover:shadow-pop">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface2 text-sm font-bold text-ink2">
                          {repo.name[0].toUpperCase()}
                        </span>
                        <div>
                          <Link to="#" className="text-sm font-semibold text-ink group-hover:text-accent" onClick={(e) => e.preventDefault()}>
                            {repo.fullName}
                          </Link>
                          <p className="mt-0.5 flex items-center gap-2 text-[10px] text-ink3">
                            <span className="flex items-center gap-1">
                              <span className="h-2 w-2 rounded-full" style={{ background: LANGUAGE_COLORS[repo.language] ?? '#8b93a7' }} />
                              {repo.language}
                            </span>
                            {repo.isPrivate && (
                              <span className="flex items-center gap-0.5">
                                <Lock className="h-2.5 w-2.5" /> Private
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <ExternalLink className="h-4 w-4 text-ink3 opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <p className="mt-3 line-clamp-2 min-h-[32px] text-xs leading-relaxed text-ink2">{repo.description}</p>
                    <div className="mt-4 flex items-center gap-4 border-t border-border pt-3 text-[11px] text-ink3">
                      <span className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-amber-500" />
                        <span className="font-mono font-semibold text-ink2">{repo.stars}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <GitFork className="h-3.5 w-3.5" />
                        <span className="font-mono font-semibold text-ink2">{repo.forks}</span>
                      </span>
                      <span className="ml-auto">Updated {timeAgo(repo.updatedAt)}</span>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {tab === 'prs' && (
            <Card className="overflow-hidden">
              <CardHeader
                title="Pull requests"
                subtitle="Linked to DevFlow issues via webhook events"
                action={
                  <Button variant="secondary" size="sm">
                    <Plus className="h-3.5 w-3.5" />
                    New PR
                  </Button>
                }
              />
              <div>
                {github.pullRequests.map((pr) => {
                  const author = users.find((u) => u.id === pr.authorId);
                  return (
                    <div key={pr.id} className="flex items-center gap-3.5 border-b border-border px-5 py-3.5 transition-colors last:border-0 hover:bg-surface2/40">
                      <span
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                          pr.state === 'open' && 'bg-emerald-500/15 text-emerald-500',
                          pr.state === 'merged' && 'bg-violet-500/15 text-violet-500',
                          pr.state === 'closed' && 'bg-rose-500/15 text-rose-500',
                        )}
                      >
                        {pr.state === 'open' ? <GitPullRequest className="h-4 w-4" /> : pr.state === 'merged' ? <GitMergeIcon className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-[13px] font-semibold text-ink">{pr.title}</span>
                          <span className="font-mono text-[10px] font-medium text-ink3">#{pr.number}</span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-[10px] text-ink3">
                          <span className="font-mono">
                            {pr.source} → {pr.target}
                          </span>
                          <span>·</span>
                          <span>{repoName(pr.repo)}</span>
                          <span>·</span>
                          <span>{timeAgo(pr.createdAt)}</span>
                        </div>
                      </div>
                      {pr.linkedIssueKey && (
                        <Link to={`/app/issues?issue=${pr.linkedIssueKey}`} className="hidden rounded-md border border-accent/30 bg-accent/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-accent hover:bg-accent/20 md:block">
                          {pr.linkedIssueKey}
                        </Link>
                      )}
                      <span className="hidden font-mono text-[10px] text-ink3 lg:block">
                        <span className="text-emerald-500">+{pr.additions}</span>{' '}
                        <span className="text-rose-500">−{pr.deletions}</span>
                      </span>
                      <Badge
                        className={cn(
                          pr.checks === 'success' && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500',
                          pr.checks === 'pending' && 'border-amber-500/30 bg-amber-500/10 text-amber-500',
                          pr.checks === 'failure' && 'border-rose-500/30 bg-rose-500/10 text-rose-500',
                        )}
                      >
                        {pr.checks === 'success' && <CheckCircle2 className="h-3 w-3" />}
                        {pr.checks === 'pending' && <Clock className="h-3 w-3" />}
                        {pr.checks === 'failure' && <AlertTriangle className="h-3 w-3" />}
                        {pr.checks}
                      </Badge>
                      {author && <Avatar name={author.name} color={author.color} size="sm" />}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {tab === 'commits' && (
            <Card className="overflow-hidden">
              <CardHeader title="Commit activity" subtitle="Across connected repositories" />
              <div>
                {github.commits.map((commit) => {
                  const author = users.find((u) => u.id === commit.authorId);
                  return (
                    <div key={commit.id} className="flex items-center gap-3.5 border-b border-border px-5 py-3 transition-colors last:border-0 hover:bg-surface2/40">
                      {author && <Avatar name={author.name} color={author.color} size="sm" />}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-ink">{commit.message}</p>
                        <p className="mt-0.5 flex items-center gap-2 text-[10px] text-ink3">
                          <span>{author?.name}</span>
                          <span>committed to</span>
                          <span className="font-medium text-ink2">{repoName(commit.repo)}</span>
                          <span>·</span>
                          <span>{timeAgo(commit.createdAt)}</span>
                        </p>
                      </div>
                      <span className="rounded-md border border-border bg-surface2 px-2 py-0.5 font-mono text-[10px] font-semibold text-ink2">
                        {commit.sha}
                      </span>
                      <GitCommit className="h-4 w-4 text-ink3" />
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {tab === 'branches' && (
            <Card className="overflow-hidden">
              <CardHeader title="Branches" subtitle="With protection rules and last commit" />
              <div>
                {github.branches.map((branch) => {
                  const committer = users.find((u) => u.id === branch.committerId);
                  return (
                    <div key={`${branch.repo}-${branch.name}`} className="flex items-center gap-3.5 border-b border-border px-5 py-3.5 transition-colors last:border-0 hover:bg-surface2/40">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface2 text-ink2">
                        <GitBranch className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[13px] font-semibold text-ink">{branch.name}</span>
                          {branch.isProtected && (
                            <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-500">
                              <Lock className="h-2.5 w-2.5" />
                              protected
                            </Badge>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-[11px] text-ink3">
                          {branch.lastCommitMessage} · {committer?.name} · {branch.ago} ago
                        </p>
                      </div>
                      <span className="font-mono text-[10px] text-ink3">{repoName(branch.repo)}</span>
                      <CircleDot className="h-3.5 w-3.5 text-emerald-500" />
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function GitMergeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="18" cy="18" r="3" />
      <circle cx="6" cy="6" r="3" />
      <path d="M6 21V9a9 9 0 0 0 9 9" />
    </svg>
  );
}

function repoName(full: string) {
  return full.split('/')[1] ?? full;
}
