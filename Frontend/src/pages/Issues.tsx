import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, ChevronRight, CircleDot, Filter, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ISSUE_STATUS_META, PRIORITY_META } from '../lib/meta';
import type { Issue, IssueStatus, Priority } from '../lib/types';
import { useAppStore, useCurrentProject, useProjectIssues } from '../store';
import { timeAgo } from '../lib/utils';
import { Avatar, Button, Card, Eyebrow, EmptyState, Input, Select, SlideOver, SlideOverHeader } from '../components/ui';
import { AssigneePicker, LabelPicker, PriorityChip, AvatarGroup } from '../components/Pickers';
import { cn } from '../lib/utils';

export function Issues() {
  const project = useCurrentProject();
  const issues = useProjectIssues();
  const { users, createIssue } = useAppStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<IssueStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [showNew, setShowNew] = useState(false);

  // New issue form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [labelIds, setLabelIds] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return issues
      .filter((i) => {
        if (q && !(`${i.key} ${i.title}`.toLowerCase().includes(q))) return false;
        if (statusFilter !== 'all' && i.status !== statusFilter) return false;
        if (priorityFilter !== 'all' && i.priority !== priorityFilter) return false;
        return true;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [issues, query, statusFilter, priorityFilter]);

  const detailIssue = searchParams.get('issue') ? issues.find((i) => i.key === searchParams.get('issue')) : undefined;
  const closeDetail = () => setSearchParams({}, { replace: false });

  const submit = () => {
    if (!title.trim()) return;
    const issue = createIssue({
      title: title.trim(),
      description: description.trim(),
      priority,
      assigneeIds,
      labelIds,
      projectId: project?.id,
    });
    setTitle('');
    setDescription('');
    setPriority('medium');
    setAssigneeIds([]);
    setLabelIds([]);
    setShowNew(false);
    setSearchParams({ issue: issue.key });
  };

  const counts = {
    all: issues.length,
    open: issues.filter((i) => i.status === 'open').length,
    in_progress: issues.filter((i) => i.status === 'in_progress').length,
    closed: issues.filter((i) => i.status === 'closed').length,
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-300 px-6 py-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <Eyebrow className="text-accent">Issue tracker</Eyebrow>
          <h1 className="mt-0.5 text-xl font-bold tracking-tight text-ink">
            Issues <span className="ml-1 font-mono text-sm font-medium text-ink3">{project?.key}-IS</span>
          </h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink3" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search issues…" className="h-9 w-52 pl-8" />
          </div>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="h-9">
            <option value="all">All statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="closed">Closed</option>
          </Select>
          <Select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as typeof priorityFilter)} className="h-9">
            <option value="all">All priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </Select>
          <Button variant="primary" size="md" onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4" />
            New issue
          </Button>
        </div>
      </div>

      {/* Status tabs */}
      <div className="mt-5 flex items-center gap-1 border-b border-border">
        {(
          [
            { id: 'all', label: 'All' },
            { id: 'open', label: 'Open' },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'closed', label: 'Closed' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id === 'all' ? 'all' : tab.id)}
            className={cn(
              'relative px-3 py-2 text-sm font-medium transition-colors cursor-pointer',
              statusFilter === tab.id ? 'text-ink' : 'text-ink3 hover:text-ink2',
            )}
          >
            {tab.label}
            <span className={cn('ml-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-semibold', statusFilter === tab.id ? 'bg-accent/15 text-accent' : 'bg-surface2 text-ink3')}>
              {counts[tab.id]}
            </span>
            {statusFilter === tab.id && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent" />}
          </button>
        ))}
        <span className="ml-auto flex items-center gap-1.5 text-[10px] text-ink3">
          <Filter className="h-3 w-3" />
          {filtered.length} shown
        </span>
      </div>

      {/* List */}
      <Card className="mt-4 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<CircleDot className="h-5 w-5" />}
              title="No issues match"
              body="Try clearing filters, or open a new issue to track a bug or feature request."
              action={
                <Button variant="primary" size="sm" onClick={() => setShowNew(true)}>
                  <Plus className="h-3.5 w-3.5" /> New issue
                </Button>
              }
            />
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-[70px_1fr_110px_110px_130px_24px] items-center gap-3 border-b border-border bg-surface2/40 px-5 py-2.5 text-[10px] font-semibold tracking-widest text-ink3 uppercase max-lg:grid-cols-[70px_1fr_110px_130px_24px]">
              <span>Key</span>
              <span>Title</span>
              <span className="max-lg:hidden">Status</span>
              <span>Priority</span>
              <span>Assignees</span>
              <span />
            </div>
            {filtered.map((issue, idx) => (
              <IssueRow
                key={issue.id}
                issue={issue}
                index={idx}
                onOpen={() => setSearchParams({ issue: issue.key })}
              />
            ))}
          </div>
        )}
      </Card>

      {/* New issue modal */}
      {showNew && (
        <div className="fixed inset-0 z-90 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && setShowNew(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-xl rounded-2xl border border-border bg-surface shadow-pop"
          >
            <div className="border-b border-border px-5 py-4">
              <p className="text-[11px] font-semibold tracking-widest text-ink3 uppercase">New issue</p>
              <h2 className="mt-0.5 text-base font-semibold text-ink">
                {project?.name} <span className="font-mono text-sm text-ink3">· {project?.key}-IS</span>
              </h2>
            </div>
            <div className="space-y-4 px-5 py-5">
              <Input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Issue title" onKeyDown={(e) => e.key === 'Enter' && submit()} />
              <div className="min-h-20">
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the problem or feature (optional)" className="h-auto min-h-20 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="mb-1.5 text-xs font-medium text-ink2">Priority</p>
                  <div className="flex gap-1">
                    {(['urgent', 'high', 'medium', 'low'] as Priority[]).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPriority(p)}
                        className={cn(
                          'flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium cursor-pointer',
                          priority === p ? 'border-accent/50 bg-accent/15 text-accent' : 'border-border text-ink2 hover:bg-surface2',
                        )}
                      >
                        <span className={cn('h-1.5 w-1.5 rounded-full', PRIORITY_META[p].dot)} />
                        {PRIORITY_META[p].label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-medium text-ink2">Assignees</p>
                  <AssigneePicker
                    selected={assigneeIds}
                    onChange={setAssigneeIds}
                    projectMemberIds={project?.memberIds}
                    trigger={
                      <button className="flex h-8 w-full items-center rounded-lg border border-border bg-surface2 px-2.5 text-left text-xs text-ink2 cursor-pointer">
                        {assigneeIds.length === 0 ? 'Select people…' : assigneeIds.map((id) => users.find((u) => u.id === id)?.name.split(' ')[0]).join(', ')}
                      </button>
                    }
                  />
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-medium text-ink2">Labels</p>
                <LabelPicker
                  selected={labelIds}
                  onChange={setLabelIds}
                  trigger={
                    <button className="flex h-8 w-full items-center rounded-lg border border-border bg-surface2 px-2.5 text-left text-xs text-ink2 cursor-pointer">
                      {labelIds.length === 0 ? 'Add labels…' : `${labelIds.length} selected`}
                    </button>
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
              <Button variant="ghost" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button variant="primary" onClick={submit} disabled={!title.trim()}>Create issue</Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Detail slide-over */}
      {detailIssue && <IssueDetail issue={detailIssue} onClose={closeDetail} />}
    </motion.div>
  );
}

function IssueRow({ issue, index, onOpen }: { issue: Issue; index: number; onOpen: () => void }) {
  const { users, labels } = useAppStore();
  const assignees = issue.assigneeIds.map((id) => users.find((u) => u.id === id)).filter(Boolean) as { id: string; name: string; color: string }[];
  const meta = ISSUE_STATUS_META[issue.status];

  return (
    <motion.button
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.2), duration: 0.25 }}
      onClick={onOpen}
      className="group grid w-full grid-cols-[70px_1fr_110px_110px_130px_24px] items-center gap-3 border-b border-border px-5 py-3 text-left transition-colors last:border-0 hover:bg-surface2/50 max-lg:grid-cols-[70px_1fr_110px_130px_24px] cursor-pointer"
    >
      <span className="font-mono text-[11px] font-semibold text-accent">{issue.key}</span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-medium text-ink group-hover:text-accent">{issue.title}</span>
        <span className="mt-0.5 flex items-center gap-2">
          {issue.labelIds.slice(0, 2).map((id) => {
            const l = labels.find((x) => x.id === id);
            return l ? (
              <span key={id} className="rounded px-1 py-px font-mono text-[9px] font-medium" style={{ background: `${l.color}1f`, color: l.color }}>
                {l.name}
              </span>
            ) : null;
          })}
          {issue.linkedPrNumbers.length > 0 && (
            <span className="rounded bg-surface2 px-1 py-px font-mono text-[9px] font-medium text-ink3">
              PR #{issue.linkedPrNumbers.join(', #')}
            </span>
          )}
        </span>
      </span>
      <span className="max-lg:hidden">
        <span className={cn('inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium', meta.chip)}>
          {issue.status === 'open' && <AlertCircle className="h-3 w-3" />}
          {issue.status === 'in_progress' && <CircleDot className="h-3 w-3" />}
          {issue.status === 'closed' && <CheckCircle2 className="h-3 w-3" />}
          {meta.label}
        </span>
      </span>
      <span>
        <PriorityChip priority={issue.priority} />
      </span>
      <span>
        {assignees.length > 0 ? (
          <AvatarGroup ids={assignees.map((a) => a.id)} />
        ) : (
          <span className="text-[10px] text-ink3">Unassigned</span>
        )}
      </span>
      <ChevronRight className="h-3.5 w-3.5 text-ink3 opacity-0 transition-opacity group-hover:opacity-100" />
    </motion.button>
  );
}

export function IssueDetail({ issue, onClose }: { issue: Issue; onClose: () => void }) {
  const { users, labels, comments, attachments, activities, updateIssue, addComment, addAttachment, user } = useAppStore();
  const [commentDraft, setCommentDraft] = useState('');

  const issueComments = comments.filter((c) => c.parentId === issue.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const issueAttachments = attachments.filter((a) => a.parentId === issue.id);
  const issueActivity = activities.filter((a) => a.entityRef === issue.key).slice(0, 8);
  const reporter = users.find((u) => u.id === issue.reporterId);

  const sendComment = () => {
    const body = commentDraft.trim();
    if (!body) return;
    addComment(issue.id, 'issue', body);
    setCommentDraft('');
  };

  const linkedTasks = issue.linkedTaskIds
    .map((id) => useAppStore.getState().tasks.find((t) => t.id === id))
    .filter(Boolean);

  return (
    <SlideOver open onClose={onClose} width={600}>
      <SlideOverHeader
        onClose={onClose}
        subtitle={`Reported by ${reporter?.name ?? 'unknown'} · ${timeAgo(issue.createdAt)}`}
        title={
          <span className="rounded-md border border-border bg-surface2 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-accent">
            {issue.key}
          </span>
        }
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-6 px-5 py-5">
          <div>
            <h1 className="text-lg leading-snug font-semibold tracking-tight text-ink">{issue.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Select
                value={issue.status}
                onChange={(e) => updateIssue(issue.id, { status: e.target.value as IssueStatus })}
                className="h-7 border-transparent bg-surface2 text-xs font-medium"
              >
                {Object.entries(ISSUE_STATUS_META).map(([id, m]) => (
                  <option key={id} value={id}>
                    {m.label}
                  </option>
                ))}
              </Select>
              <Select
                value={issue.priority}
                onChange={(e) => updateIssue(issue.id, { priority: e.target.value as Priority })}
                className={`h-7 border-transparent text-xs font-medium ${issue.priority === 'urgent' ? 'text-rose-500' : issue.priority === 'high' ? 'text-orange-500' : issue.priority === 'medium' ? 'text-sky-500' : 'text-slate-400'}`}
              >
                {(['urgent', 'high', 'medium', 'low'] as Priority[]).map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_META[p].label} priority
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold text-ink3">Description</p>
            <p className="rounded-xl border border-border bg-surface2/50 px-4 py-3 text-[13px] leading-relaxed text-ink2">
              {issue.description || 'No description provided.'}
            </p>
          </div>

          <div className="grid grid-cols-[110px_1fr] gap-y-3 text-sm">
            <span className="text-xs font-medium text-ink3">Assignees</span>
            <AssigneePicker
              selected={issue.assigneeIds}
              onChange={(ids) => updateIssue(issue.id, { assigneeIds: ids })}
              trigger={
                <button className="flex min-h-7 flex-wrap items-center gap-1.5 rounded-lg border border-dashed border-border px-2 py-1 text-xs text-ink2 cursor-pointer">
                  {issue.assigneeIds.length === 0 ? (
                    <span className="text-ink3">Add assignees…</span>
                  ) : (
                    issue.assigneeIds.map((id) => {
                      const u = users.find((x) => x.id === id);
                      return u ? (
                        <span key={id} className="flex items-center gap-1.5 rounded-md bg-surface2 py-0.5 pr-2 pl-0.5 text-[11px] font-medium">
                          <Avatar name={u.name} color={u.color} size="xs" />
                          {u.name.split(' ')[0]}
                        </span>
                      ) : null;
                    })
                  )}
                </button>
              }
            />
            <span className="text-xs font-medium text-ink3">Labels</span>
            <LabelPicker
              selected={issue.labelIds}
              onChange={(ids) => updateIssue(issue.id, { labelIds: ids })}
              trigger={
                <button className="flex min-h-7 flex-wrap items-center gap-1.5 rounded-lg border border-dashed border-border px-2 py-1 text-xs text-ink2 cursor-pointer">
                  {issue.labelIds.length === 0 ? (
                    <span className="text-ink3">Add labels…</span>
                  ) : (
                    issue.labelIds.map((id) => {
                      const l = labels.find((x) => x.id === id);
                      return l ? (
                        <span key={id} className="rounded-md px-1.5 py-0.5 font-mono text-[10px] font-medium" style={{ background: `${l.color}1f`, color: l.color, border: `1px solid ${l.color}40` }}>
                          {l.name}
                        </span>
                      ) : null;
                    })
                  )}
                </button>
              }
            />
          </div>

          {/* Linked tasks */}
          {linkedTasks.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold text-ink3">Linked tasks</p>
              <div className="space-y-1.5">
                {linkedTasks.map(
                  (t) =>
                    t && (
                      <button
                        key={t.id}
                        onClick={() => {
                          onClose();
                          setTimeout(() => window.history.replaceState(null, '', `/app/board?task=${t.key}`), 50);
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-surface2/50 px-3 py-2 text-left transition-colors hover:border-borderstrong cursor-pointer"
                      >
                        <span className={`h-1.5 w-1.5 rounded-full`} style={{ background: issue.status === 'closed' ? '#10b981' : '#6366f1' }} />
                        <span className="font-mono text-[10px] font-medium text-ink3">{t.key}</span>
                        <span className="truncate text-xs font-medium text-ink">{t.title}</span>
                        <ChevronRight className="ml-auto h-3.5 w-3.5 text-ink3" />
                      </button>
                    ),
                )}
              </div>
            </div>
          )}

          {/* Attachments */}
          <div>
            <p className="mb-2 text-xs font-semibold text-ink3">Attachments · {issueAttachments.length}</p>
            {issueAttachments.length === 0 ? (
              <button
                onClick={() => addAttachment(issue.id, 'issue', 'issue-evidence.png')}
                className="flex w-full flex-col items-center gap-1.5 rounded-xl border border-dashed border-border py-6 text-ink3 transition-colors hover:border-borderstrong cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span className="text-xs">Attach reproduction files</span>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {issueAttachments.map((a) => (
                  <div key={a.id} className="flex items-center gap-2.5 rounded-xl border border-border bg-surface2 px-3 py-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface3 text-ink3">
                      <AlertCircle className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium text-ink">{a.name}</span>
                      <span className="block text-[10px] text-ink3">{a.size}</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Comments */}
          <div>
            <p className="mb-3 text-xs font-semibold text-ink3">Comments · {issueComments.length}</p>
            <div className="space-y-4">
              {issueComments.map((c) => {
                const author = users.find((u) => u.id === c.authorId);
                return (
                  <div key={c.id} className="flex gap-3">
                    {author && <Avatar name={author.name} color={author.color} size="md" />}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[13px] font-semibold text-ink">{author?.name}</span>
                        <span className="text-[10px] text-ink3">{timeAgo(c.createdAt)}</span>
                      </div>
                      <p className="mt-1 rounded-xl rounded-tl-sm border border-border bg-surface2 px-3 py-2 text-[13px] leading-relaxed text-ink2">
                        {c.body}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activity */}
          {issueActivity.length > 0 && (
            <div>
              <p className="mb-3 text-xs font-semibold text-ink3">Activity</p>
              <div className="relative space-y-3 pl-5">
                <span className="absolute top-1 bottom-1 left-1.25 w-px bg-border" />
                {issueActivity.map((a) => {
                  const actor = users.find((u) => u.id === a.actorId);
                  return (
                    <div key={a.id} className="relative">
                      <span className="absolute top-1.5 left-[-17.5px] h-2 w-2 rounded-full border-2 border-surface bg-accent" />
                      <p className="text-xs leading-relaxed text-ink2">
                        <span className="font-semibold text-ink">{actor?.name.split(' ')[0]}</span> {a.message}
                        <span className="ml-1.5 text-[10px] text-ink3">{timeAgo(a.createdAt)}</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border p-4">
        <div className="flex items-end gap-3">
          {user && <Avatar name={user.name} color={user.color} size="md" />}
          <div className="flex-1 rounded-xl border border-border bg-surface2 focus-within:border-accent">
            <textarea
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendComment();
                }
              }}
              placeholder="Comment on this issue… (Enter to send)"
              className="min-h-11 rounded-xl border-0 bg-transparent px-3 py-2.5 text-[13px] focus:outline-none resize-y"
            />
          </div>
          <Button variant="primary" onClick={sendComment} disabled={!commentDraft.trim()} className="h-11 w-11 p-0">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </SlideOver>
  );
}
