import { motion } from 'framer-motion';
import {
  Building2,
  Check,
  GitBranch,
  KeyRound,
  Moon,
  RotateCcw,
  Shield,
  Sun,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '../store';
import { Avatar, Badge, Button, Card, CardHeader, Eyebrow, Field, Input, Select, Switch, Tabs } from '../components/ui';
import { cn } from '../lib/utils';

export function Settings() {
  const {
    user,
    theme,
    setTheme,
    workspaces,
    currentWorkspaceId,
    projects,
    currentProjectId,
    users,
    github,
    connectGitHub,
    disconnectGitHub,
    liveSimulation,
    toggleLiveSimulation,
    resetDemo,
    pushToast,
  } = useAppStore();

  const [tab, setTab] = useState('profile');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('developer');
  const workspace = workspaces.find((w) => w.id === currentWorkspaceId);

  const invite = () => {
    if (!inviteEmail.trim()) return;
    pushToast({
      title: 'Invite sent',
      body: `${inviteEmail} will join ${workspace?.name} as ${inviteRole}.`,
      kind: 'success',
    });
    setInviteEmail('');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-[900px] px-6 py-6">
      <div>
        <Eyebrow className="text-accent">Workspace</Eyebrow>
        <h1 className="mt-0.5 text-xl font-bold tracking-tight text-ink">Settings</h1>
      </div>

      <div className="mt-5">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'profile', label: 'Profile' },
            { id: 'workspace', label: 'Workspace' },
            { id: 'members', label: 'Members' },
            { id: 'integrations', label: 'Integrations' },
            { id: 'appearance', label: 'Appearance' },
          ]}
        />
      </div>

      <div className="mt-5 space-y-4">
        {tab === 'profile' && (
          <>
            <Card className="p-6">
              <CardHeader title="Profile" subtitle="How you appear across DevFlow" />
              <div className="flex items-center gap-5 px-5 pb-2">
                {user && <Avatar name={user.name} color={user.color} size="xl" />}
                <div className="flex-1">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Full name">
                      <Input defaultValue={user?.name} onBlur={(e) => e.target.value && pushToast({ title: 'Profile updated', kind: 'success' })} />
                    </Field>
                    <Field label="Title">
                      <Input defaultValue={user?.title} />
                    </Field>
                    <Field label="Email">
                      <Input defaultValue={user?.email} type="email" />
                    </Field>
                    <Field label="Handle">
                      <Input defaultValue={`@${user?.handle}`} />
                    </Field>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-border px-5 py-4">
                <p className="text-xs text-ink3">Signed in via Supabase Auth (magic link)</p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => pushToast({ title: 'Profile updated', body: 'Changes are live across your workspace.', kind: 'success' })}
                >
                  Save changes
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <CardHeader title="Security" subtitle="Session and authentication" />
              <div className="space-y-3 px-5 pb-5">
                <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                  <div className="flex items-center gap-3">
                    <KeyRound className="h-4 w-4 text-ink3" />
                    <div>
                      <p className="text-sm font-medium text-ink">Supabase session</p>
                      <p className="text-[11px] text-ink3">Refresh-token rotation, httpOnly cookie, 24h expiry</p>
                    </div>
                  </div>
                  <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500">Active</Badge>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Shield className="h-4 w-4 text-ink3" />
                    <div>
                      <p className="text-sm font-medium text-ink">RBAC policy</p>
                      <p className="text-[11px] text-ink3">Role: {user?.role} · resource-level authorization enforced server-side</p>
                    </div>
                  </div>
                  <Badge className="border-info/30 bg-info/10 text-info">{user?.role}</Badge>
                </div>
              </div>
            </Card>
          </>
        )}

        {tab === 'workspace' && (
          <Card className="p-6">
            <CardHeader title={workspace?.name ?? 'Workspace'} subtitle={`${workspace?.plan} plan · ${workspace?.memberIds.length} members`} />
            <div className="space-y-5 px-5 pb-5">
              <Field label="Workspace name">
                <Input defaultValue={workspace?.name} />
              </Field>
              <Field label="Plan">
                <div className="grid grid-cols-3 gap-3">
                  {(['Free', 'Pro', 'Enterprise'] as const).map((plan) => (
                    <button
                      key={plan}
                      className={cn(
                        'rounded-xl border p-3.5 text-left transition-all cursor-pointer',
                        workspace?.plan === plan
                          ? 'border-accent/50 bg-accent/10'
                          : 'border-border hover:border-borderstrong',
                      )}
                    >
                      <p className="text-sm font-semibold text-ink">{plan}</p>
                      <p className="mt-0.5 text-[10px] text-ink3">
                        {plan === 'Free' ? '3 projects' : plan === 'Pro' ? 'Unlimited projects' : 'SSO + SLA'}
                      </p>
                      {workspace?.plan === plan && <Badge className="mt-2 border-accent/40 bg-accent/15 text-accent">Current</Badge>}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Default project">
                <Select defaultValue={currentProjectId} className="w-full">
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.key})
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="flex justify-end border-t border-border pt-4">
                <Button variant="primary" size="sm" onClick={() => pushToast({ title: 'Workspace updated', kind: 'success' })}>
                  Save
                </Button>
              </div>
            </div>
          </Card>
        )}

        {tab === 'members' && (
          <>
            <Card className="p-6">
              <CardHeader
                title="Members"
                subtitle={`${users.length} people in ${workspace?.name}`}
                action={
                  <Button variant="secondary" size="sm" onClick={() => setTab('members')}>
                    <UserPlus className="h-3.5 w-3.5" />
                    Invite
                  </Button>
                }
              />
              <div className="px-5 pb-5">
                <div className="grid grid-cols-[44px_1fr_130px_130px] items-center gap-3 border-b border-border pb-2 text-[10px] font-semibold tracking-widest text-ink3 uppercase">
                  <span />
                  <span>Member</span>
                  <span>Role</span>
                  <span>Status</span>
                </div>
                {users.map((u) => (
                  <div key={u.id} className="grid grid-cols-[44px_1fr_130px_130px] items-center gap-3 border-b border-border py-2.5 last:border-0">
                    <Avatar name={u.name} color={u.color} size="md" />
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-ink">
                        {u.name}
                        {u.id === user?.id && <span className="ml-1.5 text-[10px] font-medium text-ink3">(you)</span>}
                      </p>
                      <p className="truncate font-mono text-[10px] text-ink3">{u.email}</p>
                    </div>
                    <Select
                      defaultValue={u.role}
                      className="h-7 text-xs"
                      onChange={() => pushToast({ title: 'Role updated', body: `${u.name} is now ${'developer'}.`, kind: 'success' })}
                    >
                      <option value="admin">Admin</option>
                      <option value="pm">Project Manager</option>
                      <option value="developer">Developer</option>
                    </Select>
                    <span className="flex items-center gap-1.5 text-[11px] text-ink2">
                      <span className={cn('h-1.5 w-1.5 rounded-full', u.online ? 'live-dot bg-emerald-500' : 'bg-slate-400')} />
                      {u.online ? 'Online' : 'Away'}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <CardHeader title="Invite teammate" subtitle="Sends a magic link via Supabase Auth" />
              <div className="flex items-end gap-3 px-5 pb-5">
                <div className="flex-1">
                  <Field label="Email">
                    <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="teammate@company.com" onKeyDown={(e) => e.key === 'Enter' && invite()} />
                  </Field>
                </div>
                <Field label="Role">
                  <Select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                    <option value="developer">Developer</option>
                    <option value="pm">Project Manager</option>
                    <option value="admin">Admin</option>
                  </Select>
                </Field>
                <Button variant="primary" onClick={invite} disabled={!inviteEmail.trim()}>
                  <UserPlus className="h-4 w-4" />
                  Send invite
                </Button>
              </div>
            </Card>
          </>
        )}

        {tab === 'integrations' && (
          <>
            <Card className="p-6">
              <CardHeader title="GitHub" subtitle="OAuth connection with webhook delivery" />
              <div className="space-y-3 px-5 pb-5">
                <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3.5">
                  <div className="flex items-center gap-3.5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-neutral-700 to-neutral-900 text-white">
                      <GitBranch className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink">github.com/{github.connected ? github.login : 'connect-account'}</p>
                      <p className="text-[11px] text-ink3">
                        {github.connected
                          ? `${github.repos.length} repos · ${github.pullRequests.length} PRs synced · webhooks active`
                          : 'Connect to sync repos, PRs, commits and webhook events'}
                      </p>
                    </div>
                  </div>
                  {github.connected ? (
                    <Button variant="danger" size="sm" onClick={disconnectGitHub}>
                      Disconnect
                    </Button>
                  ) : (
                    <Button variant="primary" size="sm" onClick={connectGitHub}>
                      Connect
                    </Button>
                  )}
                </div>

                {github.connected && (
                  <div className="rounded-xl border border-border px-4 py-3">
                    <p className="text-[10px] font-semibold tracking-widest text-ink3 uppercase">Webhook endpoints</p>
                    <div className="mt-2 space-y-2">
                      {[
                        { url: '/api/integrations/github/webhooks/devflow', events: 'push, pull_request, issues', status: 'healthy' },
                        { url: '/api/integrations/github/webhooks/devflow-cli', events: 'release, workflow_run', status: 'healthy' },
                      ].map((w) => (
                        <div key={w.url} className="flex items-center gap-3 rounded-lg bg-surface2/60 px-3 py-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span className="flex-1 truncate font-mono text-[11px] text-ink2">{w.url}</span>
                          <span className="hidden font-mono text-[10px] text-ink3 md:block">{w.events}</span>
                          <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500">{w.status}</Badge>
                        </div>
                      ))}
                    </div>
                    <p className="mt-2.5 text-[10px] leading-relaxed text-ink3">
                      Deliveries are verified with HMAC-SHA256 signature checks and retried with exponential backoff (idempotent by delivery id).
                    </p>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <CardHeader title="Realtime gateway" subtitle="Socket.IO simulation for the demo" />
              <div className="flex items-center justify-between px-5 pb-5">
                <div>
                  <p className="text-sm font-medium text-ink">Simulate teammate activity</p>
                  <p className="mt-0.5 text-[11px] text-ink3">
                    Fake teammates move cards, comment and open PRs — exercising the same event pipeline as production.
                  </p>
                </div>
                <Switch checked={liveSimulation} onChange={toggleLiveSimulation} />
              </div>
            </Card>
          </>
        )}

        {tab === 'appearance' && (
          <Card className="p-6">
            <CardHeader title="Theme" subtitle="Semantic tokens — dark and light are first-class" />
            <div className="grid grid-cols-2 gap-4 px-5 pb-6">
              {(['dark', 'light'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setTheme(mode)}
                  className={cn(
                    'relative overflow-hidden rounded-2xl border-2 p-4 text-left transition-all cursor-pointer',
                    theme === mode ? 'border-accent shadow-[0_0_0_4px_var(--ring)]' : 'border-border hover:border-borderstrong',
                  )}
                >
                  <div
                    className={cn(
                      'h-24 rounded-xl border',
                      mode === 'dark' ? 'bg-[#0f1219] border-[#1e2432]' : 'bg-white border-[#e2e5ee]',
                    )}>
                    <div className="flex gap-1.5 p-2.5">
                      <div className={cn('h-3 w-3 rounded-full', mode === 'dark' ? 'bg-indigo-500' : 'bg-indigo-500')} />
                      <div className={cn('h-3 w-3 rounded-full', mode === 'dark' ? 'bg-[#1e2432]' : 'bg-[#e2e5ee]')} />
                      <div className={cn('h-3 w-3 rounded-full', mode === 'dark' ? 'bg-[#1e2432]' : 'bg-[#e2e5ee]')} />
                    </div>
                    <div className={cn('mx-2.5 mt-2 h-1.5 w-2/3 rounded-full', mode === 'dark' ? 'bg-[#2c3448]' : 'bg-[#eef0f6]')} />
                    <div className={cn('mx-2.5 mt-1.5 h-1.5 w-1/2 rounded-full', mode === 'dark' ? 'bg-[#1e2432]' : 'bg-[#eef0f6]')} />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-sm font-medium text-ink">
                      {mode === 'dark' ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
                      {mode === 'dark' ? 'Dark' : 'Light'}
                    </span>
                    {theme === mode && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Danger zone */}
        <Card className="border-danger/30 p-6">
          <CardHeader title="Demo data" subtitle="Restore the workspace to its seeded state" />
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-5">
            <p className="max-w-md text-xs leading-relaxed text-ink2">
              Resets all tasks, issues, comments, activity and notifications to the original curated dataset. Useful
              when exploring the demo.
            </p>
            <div className="flex gap-2">
              <Button
                variant="danger"
                size="sm"
                onClick={async () => {
                  await resetDemo();
                  setTab('profile');
                }}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset demo data
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  localStorage.removeItem('devflow-store-v1');
                  window.location.reload();
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear storage
              </Button>
            </div>
          </div>
        </Card>

        <p className="flex items-center gap-2 text-[11px] text-ink3">
          <Building2 className="h-3.5 w-3.5" />
          DevFlow Labs · Pro plan · PostgreSQL + Prisma + Redis + Supabase · spec §15 security model
        </p>
      </div>
    </motion.div>
  );
}
