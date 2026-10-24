import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { X } from 'lucide-react'
import type { Label, Task, TaskPriority, TaskStatus } from '../../app/types'

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

export function LabelPicker({ labels, selectedLabelIds, onToggle, newLabelName, newLabelColor, onNewLabelNameChange, onNewLabelColorChange, onCreateLabel, isCreating, isLoading }: LabelPickerProps) {
  return <section className="mt-4 space-y-2"><div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wide text-quiet">Labels</p><span className="text-xs text-quiet">{selectedLabelIds.length} selected</span></div><div className="flex flex-wrap gap-2">{isLoading ? <span className="text-sm text-quiet">Loading labels…</span> : labels.length === 0 ? <span className="text-sm text-quiet">Create your first label below.</span> : labels.map((label) => { const selected = selectedLabelIds.includes(label.id); return <button key={label.id} type="button" onClick={() => onToggle(label.id)} className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${selected ? 'bg-black/[.05] dark:bg-white/[.1]' : 'border-transparent bg-black/[.03] dark:bg-white/[.05]'}`} style={{ borderColor: selected ? label.color : undefined, color: label.color }}><span className="h-2 w-2 rounded-full" style={{ backgroundColor: label.color }} />{label.name}</button> })}</div><div className="flex items-center gap-2"><input value={newLabelName} onChange={(event) => onNewLabelNameChange(event.target.value)} placeholder="New label" maxLength={40} className="min-w-0 flex-1 rounded-md border border-line bg-transparent px-3 py-2 text-sm outline-none focus:border-brand" /><input type="color" value={newLabelColor} onChange={(event) => onNewLabelColorChange(event.target.value)} aria-label="Label color" className="h-9 w-10 cursor-pointer rounded border border-line bg-transparent p-1" /><button type="button" onClick={onCreateLabel} disabled={isCreating || newLabelName.trim().length < 2} className="rounded-md bg-brand px-3 py-2 text-sm font-medium text-white disabled:opacity-50">{isCreating ? 'Adding…' : 'Add'}</button></div></section>
}

function Choices({ status, priority, onStatus, onPriority }: { status: TaskStatus; priority: TaskPriority; onStatus: (value: TaskStatus) => void; onPriority: (value: TaskPriority) => void }) {
  return <div className="mt-4 grid grid-cols-2 gap-3"><label className="text-sm font-medium">Status<select value={status} onChange={(event) => onStatus(event.target.value as TaskStatus)} className="mt-2 h-10 w-full rounded-md border border-line bg-canvas px-2 text-sm"><option value="TODO">Todo</option><option value="IN_PROGRESS">In progress</option><option value="DONE">Done</option></select></label><label className="text-sm font-medium">Priority<select value={priority} onChange={(event) => onPriority(event.target.value as TaskPriority)} className="mt-2 h-10 w-full rounded-md border border-line bg-canvas px-2 text-sm"><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option></select></label></div>
}

type TaskFormLabels = Pick<LabelPickerProps, 'labels' | 'newLabelName' | 'newLabelColor' | 'onNewLabelNameChange' | 'onNewLabelColorChange' | 'onCreateLabel' | 'isCreating' | 'isLoading'>

export function CreateTaskModal({ open, loading, projectName, labels, selectedLabelIds, onToggleLabel, onClose, onSubmit, ...labelProps }: { open: boolean; loading: boolean; projectName?: string; labels: Label[]; selectedLabelIds: string[]; onToggleLabel: (id: string) => void; onClose: () => void; onSubmit: (input: { title: string; description: string; status: TaskStatus; priority: TaskPriority; labelIds: string[] }) => Promise<void> } & TaskFormLabels) {
  const [title, setTitle] = useState(''); const [description, setDescription] = useState(''); const [status, setStatus] = useState<TaskStatus>('TODO'); const [priority, setPriority] = useState<TaskPriority>('MEDIUM')
  if (!open) return null
  const submit = async (event: FormEvent) => { event.preventDefault(); await onSubmit({ title, description, status, priority, labelIds: selectedLabelIds }); setTitle(''); setDescription(''); setStatus('TODO'); setPriority('MEDIUM'); onClose() }
  return <Modal><form onSubmit={(event) => void submit(event)} className="w-full max-w-md rounded-xl border border-line bg-panel p-5 shadow-xl"><Header title="Create a task" subtitle={`Add work to ${projectName ?? 'your project'}.`} onClose={onClose} /><label className="mt-5 block text-sm font-medium">Task title<input autoFocus minLength={2} maxLength={160} required value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2 h-10 w-full rounded-md border border-line bg-canvas px-3 text-sm outline-none focus:border-brand" /></label><label className="mt-4 block text-sm font-medium">Description<textarea maxLength={2000} value={description} onChange={(event) => setDescription(event.target.value)} className="mt-2 min-h-20 w-full resize-y rounded-md border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-brand" /></label><Choices status={status} priority={priority} onStatus={setStatus} onPriority={setPriority} /><LabelPicker labels={labels} selectedLabelIds={selectedLabelIds} onToggle={onToggleLabel} {...labelProps} /><Actions loading={loading} label="Create task" onCancel={onClose} /></form></Modal>
}

export function EditTaskModal({ task, updating, deleting, labels, selectedLabelIds, onToggleLabel, onClose, onUpdate, onDelete, ...labelProps }: { task: Task | null; updating: boolean; deleting: boolean; labels: Label[]; selectedLabelIds: string[]; onToggleLabel: (id: string) => void; onClose: () => void; onUpdate: (input: Partial<Task>) => Promise<void>; onDelete: () => Promise<void> } & TaskFormLabels) {
  const [title, setTitle] = useState(''); const [description, setDescription] = useState(''); const [status, setStatus] = useState<TaskStatus>('TODO'); const [priority, setPriority] = useState<TaskPriority>('MEDIUM'); const [dueDate, setDueDate] = useState('')
  useEffect(() => { if (task) { setTitle(task.title); setDescription(task.description ?? ''); setStatus(task.status); setPriority(task.priority); setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : '') } }, [task])
  if (!task) return null
  return <Modal><form onSubmit={(event) => { event.preventDefault(); void onUpdate({ title, description: description || null, status, priority, dueDate: dueDate ? new Date(dueDate).toISOString() : null }).then(onClose) }} className="w-full max-w-md rounded-xl border border-line bg-panel p-5 shadow-xl"><Header title="Edit task" subtitle="Update the task details and progress." onClose={onClose} /><label className="mt-5 block text-sm font-medium">Task title<input autoFocus minLength={2} maxLength={160} required value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2 h-10 w-full rounded-md border border-line bg-canvas px-3 text-sm outline-none focus:border-brand" /></label><label className="mt-4 block text-sm font-medium">Description<textarea maxLength={2000} value={description} onChange={(event) => setDescription(event.target.value)} className="mt-2 min-h-20 w-full resize-y rounded-md border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-brand" /></label><Choices status={status} priority={priority} onStatus={setStatus} onPriority={setPriority} /><label className="mt-4 block text-sm font-medium">Due date<input type="datetime-local" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="mt-2 h-10 w-full rounded-md border border-line bg-canvas px-3 text-sm outline-none focus:border-brand" /></label><LabelPicker labels={labels} selectedLabelIds={selectedLabelIds} onToggle={onToggleLabel} {...labelProps} /><div className="mt-5 flex justify-between"><button type="button" onClick={() => void onDelete()} disabled={deleting} className="text-sm font-semibold text-rose-600">{deleting ? 'Deleting…' : 'Delete task'}</button><Actions loading={updating} label="Save changes" onCancel={onClose} /></div></form></Modal>
}
