import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { X } from 'lucide-react'
import type { Label, Task, TaskPriority, TaskStatus , WorkspaceMember} from '../../app/types'
import type { WorkspaceInvite } from '../../hooks/useWorkspaceInvites'

function Modal({ children }: { children: ReactNode }) {
  return <div className="fixed inset-0 z-30 grid place-items-center bg-black/40 p-4">{children}</div>
}

function Header({ title, subtitle, onClose }: { title: string; subtitle?: string; onClose: () => void }) {
  return <div className="flex items-start justify-between"><div><h2 className="font-display text-lg font-bold">{title}</h2>{subtitle && <p className="mt-1 text-sm text-quiet">{subtitle}</p>}</div><button type="button" onClick={onClose} className="text-quiet" aria-label="Close dialog"><X size={18} /></button></div>
}

function Actions({ loading, label, onCancel }: { loading: boolean; label: string; onCancel: () => void }) {
  return <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onCancel} className="rounded-md border border-line px-3 py-2 text-sm text-quiet">Cancel</button><button type="submit" disabled={loading} className="rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">{loading ? 'Saving…' : label}</button></div>
}

export function WorkspaceModal({ open, loading, onClose, onSubmit }: { open: boolean; loading: boolean; onClose: () => void; onSubmit: (name: string) => Promise<void> }) {
  const [name, setName] = useState('')
  if (!open) return null
  return <Modal><form onSubmit={(event) => { event.preventDefault(); void onSubmit(name).then(() => { setName(''); onClose() }) }} className="w-full max-w-md rounded-xl border border-line bg-panel p-5 shadow-xl"><Header title="Create a workspace" onClose={onClose} /><label className="mt-5 block text-sm font-medium">Workspace name<input autoFocus minLength={2} maxLength={80} required value={name} onChange={(event) => setName(event.target.value)} className="mt-2 h-10 w-full rounded-md border border-line bg-canvas px-3 text-sm outline-none focus:border-brand" /></label><Actions loading={loading} label="Create workspace" onCancel={onClose} /></form></Modal>
}

export function ProjectModal({ open, loading, onClose, onSubmit }: { open: boolean; loading: boolean; onClose: () => void; onSubmit: (name: string, description: string) => Promise<void> }) {
  const [name, setName] = useState(''); const [description, setDescription] = useState('')
  if (!open) return null
  return <Modal><form onSubmit={(event) => { event.preventDefault(); void onSubmit(name, description).then(() => { setName(''); setDescription(''); onClose() }) }} className="w-full max-w-md rounded-xl border border-line bg-panel p-5 shadow-xl"><Header title="Create a project" onClose={onClose} /><label className="mt-5 block text-sm font-medium">Project name<input autoFocus minLength={2} maxLength={80} required value={name} onChange={(event) => setName(event.target.value)} className="mt-2 h-10 w-full rounded-md border border-line bg-canvas px-3 text-sm outline-none focus:border-brand" /></label><label className="mt-4 block text-sm font-medium">Description<textarea maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} className="mt-2 min-h-24 w-full resize-y rounded-md border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-brand" /></label><Actions loading={loading} label="Create project" onCancel={onClose} /></form></Modal>
}

type LabelPickerProps = {
  labels: Label[]
  selectedLabelIds: string[]
  onToggle: (labelId: string) => void
  newLabelName: string
  newLabelColor: string
  onNewLabelNameChange: (value: string) => void
  onNewLabelColorChange: (value: string) => void
  onCreateLabel: () => void
  isCreating: boolean
  isLoading: boolean
}

export function InviteMemberModal({
  open,
  loading,
  workspaceName,
  onClose,
  onSubmit,
}: {
  open: boolean
  loading: boolean
  workspaceName?: string
  onClose: () => void
  onSubmit: (email: string, role: 'ADMIN' | 'MEMBER') => Promise<void>
}) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER')
  const [error, setError] = useState('')

  if (!open) return null

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    try {
      await onSubmit(email, role)
      setEmail('')
      setRole('MEMBER')
      onClose()
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Could not send invitation.',
      )
    }
  }

  return (
    <Modal>
      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="w-full max-w-md rounded-xl border border-line bg-panel p-5 shadow-xl"
      >
        <Header
          title="Invite workspace member"
          subtitle={`Invite someone to ${workspaceName ?? 'this workspace'}.`}
          onClose={onClose}
        />

        <label className="mt-5 block text-sm font-medium">
          Email address
          <input
            type="email"
            autoFocus
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="teammate@example.com"
            className="mt-2 h-10 w-full rounded-md border border-line bg-canvas px-3 text-sm outline-none focus:border-brand"
          />
        </label>

        <label className="mt-4 block text-sm font-medium">
          Workspace role
          <select
            value={role}
            onChange={(event) =>
              setRole(event.target.value as 'ADMIN' | 'MEMBER')
            }
            className="mt-2 h-10 w-full rounded-md border border-line bg-canvas px-3 text-sm outline-none focus:border-brand"
          >
            <option value="MEMBER">Member</option>
            <option value="ADMIN">Admin</option>
          </select>
        </label>

        <p className="mt-3 text-xs text-quiet">
          Members can work on tasks. Admins can also invite members.
        </p>

        {error && (
          <p className="mt-3 text-sm text-rose-600" role="alert">
            {error}
          </p>
        )}

        <Actions
          loading={loading}
          label="Send invitation"
          onCancel={onClose}
        />
      </form>
    </Modal>
  )
}

export function InvitationLinkModal({
  open,
  email,
  inviteUrl,
  onClose,
}: {
  open: boolean
  email: string
  inviteUrl: string
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  async function copyInviteLink() {
    setError('')

    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
    } catch {
      setError('Could not copy the link. Select it and copy it manually.')
    }
  }

  return (
    <Modal>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="invitation-link-title"
        className="w-full max-w-lg rounded-xl border border-line bg-panel p-5 shadow-xl"
      >
        <Header
          title="Share invitation link"
          subtitle={`Send this link to ${email}.`}
          onClose={onClose}
        />

        <label className="mt-5 block text-sm font-medium">
          Invitation link
          <input
            readOnly
            value={inviteUrl}
            onFocus={(event) => event.currentTarget.select()}
            className="mt-2 h-10 w-full rounded-md border border-line bg-canvas px-3 text-xs text-quiet outline-none focus:border-brand"
          />
        </label>

        {error && (
          <p className="mt-3 text-sm text-rose-600" role="alert">
            {error}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-line px-3 py-2 text-sm text-quiet"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => void copyInviteLink()}
            className="rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white"
          >
            {copied ? 'Copied' : 'Copy link'}
          </button>
        </div>
      </section>
    </Modal>
  )
}

export function WorkspaceInvitesModal({
  open,
  loading,
  workspaceName,
  invites,
  onClose,
  actionInviteId,
  onRevoke,
  onResend,
}: {
  open: boolean
  loading: boolean
  workspaceName?: string
  invites: WorkspaceInvite[]
  onClose: () => void
  actionInviteId: string | null
  onRevoke: (inviteId: string) => Promise<void>
  onResend: (invite: WorkspaceInvite) => Promise<void>
}) {
  if (!open) return null

  return (
    <Modal>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="workspace-invitations-title"
        className="w-full max-w-2xl rounded-xl border border-line bg-panel p-5 shadow-xl"
      >
        <Header
          title="Workspace invitations"
          subtitle={`Invitation history for ${workspaceName ?? 'this workspace'}.`}
          onClose={onClose}
        />

        <div className="mt-5 max-h-[60vh] overflow-y-auto rounded-lg border border-line">
          {loading ? (
            <p className="p-5 text-sm text-quiet">
              Loading invitations…
            </p>
          ) : invites.length === 0 ? (
            <div className="p-5">
              <p className="text-sm font-medium">No invitations yet</p>
              <p className="mt-1 text-sm text-quiet">
                Invite a teammate to start collaborating.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {invites.map((invite) => {
                const statusClasses = {
                  PENDING: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
                  ACCEPTED: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
                  REVOKED: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
                  EXPIRED: 'bg-black/[.05] text-quiet dark:bg-white/[.08]',
                }[invite.status]

                const formattedDate = new Intl.DateTimeFormat(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }).format(new Date(invite.createdAt))
                const isActionPending =
                  actionInviteId === invite.id ||
                  actionInviteId === invite.email
                const canResend = invite.status !== 'ACCEPTED'
                const canRevoke = invite.status === 'PENDING'

                return (
                  <li
                    key={invite.id}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {invite.email}
                      </p>
                      <p className="mt-1 text-xs text-quiet">
                        Invited as {invite.role.toLowerCase()} · {formattedDate}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClasses}`}
                      >
                        {invite.status.toLowerCase()}
                      </span>
                      {canResend && (
                        <button
                          type="button"
                          disabled={isActionPending}
                          onClick={() => void onResend(invite)}
                          className="rounded-md border border-line px-2.5 py-1.5 text-[11px] font-semibold text-quiet disabled:opacity-50"
                        >
                          {isActionPending ? 'Sending…' : 'Resend'}
                        </button>
                      )}
                      {canRevoke && (
                        <button
                          type="button"
                          disabled={isActionPending}
                          onClick={() => {
                            if (
                              window.confirm(
                                `Revoke the invitation for ${invite.email}?`,
                              )
                            ) {
                              void onRevoke(invite.id)
                            }
                          }}
                          className="rounded-md border border-rose-200 px-2.5 py-1.5 text-[11px] font-semibold text-rose-600 disabled:opacity-50 dark:border-rose-900/50 dark:text-rose-300"
                        >
                          {isActionPending ? 'Working…' : 'Revoke'}
                        </button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-line px-3 py-2 text-sm text-quiet"
          >
            Close
          </button>
        </div>
      </section>
    </Modal>
  )
}

export function LabelPicker({ labels, selectedLabelIds, onToggle, newLabelName, newLabelColor, onNewLabelNameChange, onNewLabelColorChange, onCreateLabel, isCreating, isLoading }: LabelPickerProps) {
  return <section className="mt-4 space-y-2"><div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wide text-quiet">Labels</p><span className="text-xs text-quiet">{selectedLabelIds.length} selected</span></div><div className="flex flex-wrap gap-2">{isLoading ? <span className="text-sm text-quiet">Loading labels…</span> : labels.length === 0 ? <span className="text-sm text-quiet">Create your first label below.</span> : labels.map((label) => { const selected = selectedLabelIds.includes(label.id); return <button key={label.id} type="button" onClick={() => onToggle(label.id)} className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${selected ? 'bg-black/[.05] dark:bg-white/[.1]' : 'border-transparent bg-black/[.03] dark:bg-white/[.05]'}`} style={{ borderColor: selected ? label.color : undefined, color: label.color }}><span className="h-2 w-2 rounded-full" style={{ backgroundColor: label.color }} />{label.name}</button> })}</div><div className="flex items-center gap-2"><input value={newLabelName} onChange={(event) => onNewLabelNameChange(event.target.value)} placeholder="New label" maxLength={40} className="min-w-0 flex-1 rounded-md border border-line bg-transparent px-3 py-2 text-sm outline-none focus:border-brand" /><input type="color" value={newLabelColor} onChange={(event) => onNewLabelColorChange(event.target.value)} aria-label="Label color" className="h-9 w-10 cursor-pointer rounded border border-line bg-transparent p-1" /><button type="button" onClick={onCreateLabel} disabled={isCreating || newLabelName.trim().length < 2} className="rounded-md bg-brand px-3 py-2 text-sm font-medium text-white disabled:opacity-50">{isCreating ? 'Adding…' : 'Add'}</button></div></section>
}
export function AssigneePicker({
  members,
  selectedUserIds,
  onToggle,
  isLoading,
}: {
  members: WorkspaceMember[]
  selectedUserIds: string[]
  onToggle: (userId: string) => void
  isLoading: boolean
}) {
  return (
    <section className="mt-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-quiet">
          Assignees
        </p>

        <span className="text-xs text-quiet">
          {selectedUserIds.length} selected
        </span>
      </div>

      {isLoading ? (
        <p className="text-sm text-quiet">Loading workspace members…</p>
      ) : members.length === 0 ? (
        <p className="text-sm text-quiet">
          No workspace members are available.
        </p>
      ) : (
        <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-line bg-canvas p-1">
          {members.map((member) => {
            const isSelected = selectedUserIds.includes(member.id)
            const name = member.displayName?.trim() || member.email

            return (
              <button
                key={member.id}
                type="button"
                onClick={() => onToggle(member.id)}
                className={`flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition ${
                  isSelected
                    ? 'bg-brand-soft text-brand'
                    : 'hover:bg-black/[.04] dark:hover:bg-white/[.05]'
                }`}
              >
                <span
                  className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${
                    isSelected
                      ? 'border-brand bg-brand text-white'
                      : 'border-line'
                  }`}
                >
                  {isSelected ? '✓' : ''}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {name}
                  </span>

                  {member.displayName && (
                    <span className="block truncate text-xs text-quiet">
                      {member.email}
                    </span>
                  )}
                </span>

                <span className="text-[10px] font-semibold uppercase text-quiet">
                  {member.role.toLowerCase()}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}

function Choices({ status, priority, onStatus, onPriority }: { status: TaskStatus; priority: TaskPriority; onStatus: (value: TaskStatus) => void; onPriority: (value: TaskPriority) => void }) {
  return <div className="mt-4 grid grid-cols-2 gap-3"><label className="text-sm font-medium">Status<select value={status} onChange={(event) => onStatus(event.target.value as TaskStatus)} className="mt-2 h-10 w-full rounded-md border border-line bg-canvas px-2 text-sm"><option value="TODO">Todo</option><option value="IN_PROGRESS">In progress</option><option value="DONE">Done</option></select></label><label className="text-sm font-medium">Priority<select value={priority} onChange={(event) => onPriority(event.target.value as TaskPriority)} className="mt-2 h-10 w-full rounded-md border border-line bg-canvas px-2 text-sm"><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option></select></label></div>
}

type TaskFormLabels = Pick<LabelPickerProps, 'labels' | 'newLabelName' | 'newLabelColor' | 'onNewLabelNameChange' | 'onNewLabelColorChange' | 'onCreateLabel' | 'isCreating' | 'isLoading'>

type TaskFormAssignees = {
  members: WorkspaceMember[]
  selectedAssigneeIds: string[]
  onToggleAssignee: (userId: string) => void
  isLoadingMembers: boolean
}

export function CreateTaskModal({
  open,
  loading,
  projectName,
  labels,
  selectedLabelIds,
  onToggleLabel,
  members,
  selectedAssigneeIds,
  onToggleAssignee,
  isLoadingMembers,
  onClose,
  onSubmit,
  ...labelProps
}: {
  open: boolean
  loading: boolean
  projectName?: string
  labels: Label[]
  selectedLabelIds: string[]
  onToggleLabel: (id: string) => void
  onClose: () => void
  onSubmit: (input: {
    title: string
    description: string
    status: TaskStatus
    priority: TaskPriority
    labelIds: string[]
    assigneeIds: string[]
  }) => Promise<void>
} & TaskFormLabels &
  TaskFormAssignees) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TaskStatus>('TODO')
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM')

  if (!open) return null

  async function submit(event: FormEvent) {
    event.preventDefault()

    await onSubmit({
      title,
      description,
      status,
      priority,
      labelIds: selectedLabelIds,
      assigneeIds: selectedAssigneeIds,
    })

    setTitle('')
    setDescription('')
    setStatus('TODO')
    setPriority('MEDIUM')
    onClose()
  }

  return (
    <Modal>
      <form
        onSubmit={(event) => void submit(event)}
        className="w-full max-w-md rounded-xl border border-line bg-panel p-5 shadow-xl"
      >
        <Header
          title="Create a task"
          subtitle={`Add work to ${projectName ?? 'your project'}.`}
          onClose={onClose}
        />
        <label className="mt-5 block text-sm font-medium">
          Task title
          <input
            autoFocus
            minLength={2}
            maxLength={160}
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-2 h-10 w-full rounded-md border border-line bg-canvas px-3 text-sm outline-none focus:border-brand"
          />
        </label>
        <label className="mt-4 block text-sm font-medium">
          Description
          <textarea
            maxLength={2000}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="mt-2 min-h-20 w-full resize-y rounded-md border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </label>
        <Choices
          status={status}
          priority={priority}
          onStatus={setStatus}
          onPriority={setPriority}
        />
        <LabelPicker
          labels={labels}
          selectedLabelIds={selectedLabelIds}
          onToggle={onToggleLabel}
          {...labelProps}
        />
        <AssigneePicker
          members={members}
          selectedUserIds={selectedAssigneeIds}
          onToggle={onToggleAssignee}
          isLoading={isLoadingMembers}
        />
        <Actions
          loading={loading}
          label="Create task"
          onCancel={onClose}
        />
      </form>
    </Modal>
  )
}

export function EditTaskModal({ task, updating, deleting, labels, selectedLabelIds, onToggleLabel, members, selectedAssigneeIds, onToggleAssignee, isLoadingMembers, onClose, onUpdate, onDelete, ...labelProps }: { task: Task | null; updating: boolean; deleting: boolean; labels: Label[]; selectedLabelIds: string[]; onToggleLabel: (id: string) => void; onClose: () => void; onUpdate: (input: Partial<Task>) => Promise<void>; onDelete: () => Promise<void> } & TaskFormLabels & TaskFormAssignees) {
  const [title, setTitle] = useState(''); const [description, setDescription] = useState(''); const [status, setStatus] = useState<TaskStatus>('TODO'); const [priority, setPriority] = useState<TaskPriority>('MEDIUM'); const [dueDate, setDueDate] = useState('')
  useEffect(() => { if (task) { setTitle(task.title); setDescription(task.description ?? ''); setStatus(task.status); setPriority(task.priority); setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : '') } }, [task])
  if (!task) return null
  return <Modal><form onSubmit={(event) => { event.preventDefault(); void onUpdate({ title, description: description || null, status, priority, dueDate: dueDate ? new Date(dueDate).toISOString() : null }).then(onClose) }} className="w-full max-w-md rounded-xl border border-line bg-panel p-5 shadow-xl"><Header title="Edit task" subtitle="Update the task details and progress." onClose={onClose} /><label className="mt-5 block text-sm font-medium">Task title<input autoFocus minLength={2} maxLength={160} required value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2 h-10 w-full rounded-md border border-line bg-canvas px-3 text-sm outline-none focus:border-brand" /></label><label className="mt-4 block text-sm font-medium">Description<textarea maxLength={2000} value={description} onChange={(event) => setDescription(event.target.value)} className="mt-2 min-h-20 w-full resize-y rounded-md border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-brand" /></label><Choices status={status} priority={priority} onStatus={setStatus} onPriority={setPriority} /><label className="mt-4 block text-sm font-medium">Due date<input type="datetime-local" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="mt-2 h-10 w-full rounded-md border border-line bg-canvas px-3 text-sm outline-none focus:border-brand" /></label><LabelPicker labels={labels} selectedLabelIds={selectedLabelIds} onToggle={onToggleLabel} {...labelProps} /><AssigneePicker members={members} selectedUserIds={selectedAssigneeIds} onToggle={onToggleAssignee} isLoading={isLoadingMembers} /><div className="mt-5 flex justify-between"><button type="button" onClick={() => void onDelete()} disabled={deleting} className="text-sm font-semibold text-rose-600">{deleting ? 'Deleting…' : 'Delete task'}</button><Actions loading={updating} label="Save changes" onCancel={onClose} /></div></form></Modal>
}
