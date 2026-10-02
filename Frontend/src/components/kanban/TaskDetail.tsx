import { Calendar, Clock, Hash, MessageSquare, Paperclip, Send, Trash2, Upload } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Task, TaskStatus } from '../../lib/types';
import { PRIORITY_META, STATUS_META } from '../../lib/meta';
import { useAppStore } from '../../store';
import { timeAgo } from '../../lib/utils';
import { AssigneePicker, LabelPicker } from '../Pickers';
import { Avatar, Button, IconButton, Input, Select, SlideOver, SlideOverHeader, Textarea } from '../ui';

const SAMPLE_FILES = [
  'screenshot-drag-preview.png',
  'error-trace-403.log',
  'api-contract-changes.pdf',
  'kanban-mockup-v4.fig',
  'prisma-migration.sql',
  'perf-benchmark-results.json',
  'webhook-payload.txt',
];

export function TaskDetail({ task, onClose }: { task: Task; onClose: () => void }) {
  const {
    users,
    labels,
    sprints,
    comments,
    attachments,
    activities,
    projects,
    updateTask,
    moveTaskTo,
    addComment,
    addAttachment,
    deleteTask,
    user,
  } = useAppStore();

  const project = projects.find((p) => p.id === task.projectId);

  const [commentDraft, setCommentDraft] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(task.title);
  const scrollRef = useRef<HTMLDivElement>(null);

  const taskComments = useMemo(
    () => comments.filter((c) => c.parentId === task.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [comments, task.id],
  );
  const taskAttachments = useMemo(
    () => attachments.filter((a) => a.parentId === task.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [attachments, task.id],
  );
  const taskActivity = useMemo(
    () => activities.filter((a) => a.entityRef === task.key).slice(0, 12),
    [activities, task.key],
  );
  const projectSprints = sprints.filter((s) => s.projectId === task.projectId);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [taskComments.length]);

  const sendComment = () => {
    const body = commentDraft.trim();
    if (!body) return;
    addComment(task.id, 'task', body);
    setCommentDraft('');
  };

  const attachSample = () => {
    const name = SAMPLE_FILES[Math.floor(Math.random() * SAMPLE_FILES.length)];
    addAttachment(task.id, 'task', name);
  };

  const reporter = users.find((u) => u.id === task.reporterId);
  const assignees = task.assigneeIds.map((id) => users.find((u) => u.id === id)).filter(Boolean);

  return (
    <SlideOver open onClose={onClose} width={600}>
      <SlideOverHeader
        onClose={onClose}
        subtitle={`Reported by ${reporter?.name ?? 'unknown'} · ${timeAgo(task.createdAt)}`}
        title={
          <span className="rounded-md border border-border bg-surface2 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-accent">
            {task.key}
          </span>
        }
      >
        <IconButton label="Delete task" onClick={() => { deleteTask(task.id); onClose(); }}>
          <Trash2 className="h-4 w-4" />
        </IconButton>
      </SlideOverHeader>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-6 px-5 py-5">
          {/* Title + status */}
          <div>
            {editingTitle ? (
              <Input
                autoFocus
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={() => { setEditingTitle(false); if (titleDraft.trim()) updateTask(task.id, { title: titleDraft.trim() }); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { setEditingTitle(false); if (titleDraft.trim()) updateTask(task.id, { title: titleDraft.trim() }); }
                  if (e.key === 'Escape') { setEditingTitle(false); setTitleDraft(task.title); }
                }}
              />
            ) : (
              <h1
                onClick={() => { setTitleDraft(task.title); setEditingTitle(true); }}
                className="cursor-text text-lg leading-snug font-semibold tracking-tight text-ink hover:text-accent"
                title="Click to edit"
              >
                {task.title}
              </h1>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Select
                value={task.status}
                onChange={(e) => moveTaskTo(task.id, e.target.value as TaskStatus)}
                className="h-7 border-transparent bg-surface2 text-xs font-medium"
              >
                {Object.entries(STATUS_META).map(([id, m]) => (
                  <option key={id} value={id}>
                    {m.label}
                  </option>
                ))}
              </Select>
              <Select
                value={task.priority}
                onChange={(e) => updateTask(task.id, { priority: e.target.value as Task['priority'] })}
                className={`h-7 border-transparent text-xs font-medium ${PRIORITY_META[task.priority].text}`}
              >
                {Object.entries(PRIORITY_META).map(([id, m]) => (
                  <option key={id} value={id}>
                    {m.label} priority
                  </option>
                ))}
              </Select>
              <span className="flex items-center gap-1 rounded-md bg-surface2 px-1.5 py-0.5 font-mono text-[10px] font-medium text-ink2">
                <Hash className="h-2.5 w-2.5" />
                {task.points ?? 0}pt
              </span>
              {task.dueDate && (
                <span className="flex items-center gap-1 rounded-md bg-surface2 px-1.5 py-0.5 text-[10px] font-medium text-ink2">
                  <Calendar className="h-2.5 w-2.5" />
                  {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-[110px_1fr] gap-y-3 text-sm">
            <span className="text-xs font-medium text-ink3">Assignees</span>
            <AssigneePicker
              selected={task.assigneeIds}
              onChange={(ids) => updateTask(task.id, { assigneeIds: ids })}
              projectMemberIds={project?.memberIds}
              trigger={
                <button className="flex min-h-7 flex-wrap items-center gap-1.5 rounded-lg border border-dashed border-border px-2 py-1 text-xs text-ink2 transition-colors hover:border-borderstrong cursor-pointer">
                  {assignees.length === 0 ? (
                    <span className="text-ink3">Add assignees…</span>
                  ) : (
                    assignees.map(
                      (u) =>
                        u && (
                          <span key={u.id} className="flex items-center gap-1.5 rounded-md bg-surface2 py-0.5 pr-2 pl-0.5 text-[11px] font-medium">
                            <Avatar name={u.name} color={u.color} size="xs" />
                            {u.name.split(' ')[0]}
                          </span>
                        ),
                    )
                  )}
                </button>
              }
            />

            <span className="text-xs font-medium text-ink3">Labels</span>
            <LabelPicker
              selected={task.labelIds}
              onChange={(ids) => updateTask(task.id, { labelIds: ids })}
              trigger={
                <button className="flex min-h-7 flex-wrap items-center gap-1.5 rounded-lg border border-dashed border-border px-2 py-1 text-xs text-ink2 transition-colors hover:border-borderstrong cursor-pointer">
                  {task.labelIds.length === 0 ? (
                    <span className="text-ink3">Add labels…</span>
                  ) : (
                    task.labelIds.map((id) => {
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

            <span className="text-xs font-medium text-ink3">Sprint</span>
            <Select value={task.sprintId ?? ''} onChange={(e) => updateTask(task.id, { sprintId: e.target.value || undefined })} className="h-7 w-full text-xs">
              <option value="">No sprint</option>
              {projectSprints.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>

            <span className="text-xs font-medium text-ink3">Due date</span>
            <Input type="date" value={task.dueDate ?? ''} onChange={(e) => updateTask(task.id, { dueDate: e.target.value || undefined })} className="h-7 w-44 text-xs" />

            <span className="text-xs font-medium text-ink3">Points</span>
            <Input
              type="number"
              min={0}
              max={21}
              value={task.points ?? ''}
              placeholder="—"
              onChange={(e) => updateTask(task.id, { points: e.target.value === '' ? undefined : Number(e.target.value) })}
              className="h-7 w-20 text-xs"
            />
          </div>

          {/* Description */}
          <div>
            <p className="mb-2 text-xs font-semibold text-ink3">Description</p>
            <Textarea
              value={task.description}
              onChange={(e) => updateTask(task.id, { description: e.target.value })}
              placeholder="Add a description…"
              className="min-h-[110px] text-[13px] leading-relaxed"
            />
          </div>

          {/* Attachments */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold text-ink3">Attachments · {taskAttachments.length}</p>
              <Button variant="ghost" size="sm" onClick={attachSample}>
                <Upload className="h-3 w-3" />
                Attach file
              </Button>
            </div>
            {taskAttachments.length === 0 ? (
              <button
                onClick={attachSample}
                className="flex w-full flex-col items-center gap-1.5 rounded-xl border border-dashed border-border py-6 text-ink3 transition-colors hover:border-borderstrong hover:text-ink2 cursor-pointer"
              >
                <Paperclip className="h-4 w-4" />
                <span className="text-xs">Drop files or click to attach (Supabase Storage)</span>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {taskAttachments.map((a) => {
                  const uploader = users.find((u) => u.id === a.uploadedById);
                  return (
                    <div key={a.id} className="flex items-center gap-2.5 rounded-xl border border-border bg-surface2 px-3 py-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface3 text-ink3">
                        <Paperclip className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-medium text-ink">{a.name}</span>
                        <span className="block text-[10px] text-ink3">
                          {a.size} · {uploader?.name.split(' ')[0]} · {timeAgo(a.createdAt)}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Comments */}
          <div>
            <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-ink3">
              <MessageSquare className="h-3.5 w-3.5" />
              Comments · {taskComments.length}
            </p>
            <div className="space-y-4">
              {taskComments.map((c) => {
                const author = users.find((u) => u.id === c.authorId);
                const isYou = c.authorId === user?.id;
                return (
                  <div key={c.id} className="flex gap-3">
                    {author && <Avatar name={author.name} color={author.color} size="md" />}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[13px] font-semibold text-ink">
                          {author?.name} {isYou && <span className="text-[10px] font-medium text-ink3">(you)</span>}
                        </span>
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
          {taskActivity.length > 0 && (
            <div>
              <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-ink3">
                <Clock className="h-3.5 w-3.5" />
                Activity
              </p>
              <div className="relative space-y-3 pl-5">
                <span className="absolute top-1 bottom-1 left-1.25 w-px bg-border" />
                {taskActivity.map((a) => {
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

          <p className="pb-2 text-[10px] text-ink3">
            Created {timeAgo(task.createdAt)} · Updated {timeAgo(task.updatedAt)}
          </p>
        </div>
      </div>

      {/* Comment composer */}
      <div className="border-t border-border p-4">
        <div className="flex items-end gap-3">
          {user && <Avatar name={user.name} color={user.color} size="md" />}
          <div className="flex-1 rounded-xl border border-border bg-surface2 focus-within:border-accent">
            <Textarea
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendComment();
                }
              }}
              placeholder="Write a comment…  (Enter to send)"
              className="min-h-11 rounded-xl border-0 bg-transparent py-2.5 text-[13px]"
            />
          </div>
          <Button variant="primary" size="md" onClick={sendComment} disabled={!commentDraft.trim()} className="h-11 w-11 p-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </SlideOver>
  );
}
