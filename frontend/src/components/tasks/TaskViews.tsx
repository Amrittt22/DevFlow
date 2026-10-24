import { useState, type ReactNode } from 'react'
import { CalendarDays, ChevronRight, CirclePlus, FolderKanban, List, Search, X } from 'lucide-react'
import type { DueDateFilter, Label, Task, TaskPriority, TaskStatus } from '../../app/types'

export function LabelBadges({ labels, compact = false }: { labels: Label[]; compact?: boolean }) {
  if (!labels.length) return null
  if (compact) {
    return <span className="ml-1 inline-flex items-center gap-1">{labels.slice(0, 2).map((label) => <span key={label.id} title={label.name} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: label.color }} />)}</span>
  }
  return <div className="mt-2 flex flex-wrap gap-1.5">{labels.map((label) => <span key={label.id} className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: `${label.color}20`, color: label.color }}>{label.name}</span>)}</div>
}

type TaskActions = {
  onEdit: (task: Task) => void
}

export function TaskBoard({ tasks, loading, hasProject, onCreate, onStatus, onEdit }: {
  tasks: Task[]
  loading: boolean
  hasProject: boolean
  onCreate: () => void
  onStatus: (id: string, status: TaskStatus) => void
  onEdit: (task: Task) => void
}) {
  const [dragged, setDragged] = useState<string | null>(null)
  const [target, setTarget] = useState<TaskStatus | null>(null)
  const columns: Array<{ status: TaskStatus; label: string; dot: string }> = [
    { status: 'TODO', label: 'Todo', dot: 'bg-slate-400' },
    { status: 'IN_PROGRESS', label: 'In progress', dot: 'bg-amber-400' },
    { status: 'DONE', label: 'Done', dot: 'bg-emerald-500' },
  ]
  const priority: Record<TaskPriority, string> = {
    LOW: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    MEDIUM: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    HIGH: 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  }
  if (!hasProject) return <EmptyState icon={<FolderKanban />} title="Select a project" text="Create or select a project to start tracking tasks." />
  if (loading) return <LoadingState />
  return <section className="pt-7">
    <header className="mb-5 flex items-center justify-between">
      <div><h2 className="font-display text-[17px] font-bold">Task board</h2><p className="mt-1 text-[11px] text-quiet">Organize work by its current status.</p></div>
      <button onClick={onCreate} className="flex items-center gap-1.5 rounded-md bg-brand px-3 py-2 text-[11px] font-semibold text-white"><CirclePlus size={15} /> Add task</button>
    </header>
    <div className="grid gap-4 md:grid-cols-3">
      {columns.map(({ status, label, dot }) => {
        const columnTasks = tasks.filter((task) => task.status === status)
        return <section key={status} onDragOver={(event) => { event.preventDefault(); setTarget(status) }} onDragLeave={() => setTarget(null)} onDrop={(event) => { event.preventDefault(); const task = tasks.find((item) => item.id === dragged); if (task && task.status !== status) onStatus(task.id, status); setDragged(null); setTarget(null) }} className={`min-h-[260px] rounded-xl border p-3 ${target === status ? 'border-brand bg-brand-soft' : 'border-line bg-black/[.015] dark:bg-white/[.02]'}`}>
          <div className="mb-3 flex items-center justify-between px-1"><h3 className="flex items-center gap-2 text-xs font-semibold"><i className={`h-2 w-2 rounded-full ${dot}`} />{label}</h3><span className="rounded bg-panel px-1.5 py-0.5 text-[10px] text-quiet">{columnTasks.length}</span></div>
          <div className="space-y-2">{columnTasks.map((task) => <article key={task.id} draggable onDragStart={() => setDragged(task.id)} onDragEnd={() => { setDragged(null); setTarget(null) }} className={`cursor-grab rounded-lg border border-line bg-panel p-3 shadow-soft ${dragged === task.id ? 'opacity-50' : ''}`}>
            <button type="button" onClick={() => onEdit(task)} className="w-full text-left"><h4 className="text-xs font-semibold">{task.title}</h4>{task.description && <p className="mt-1.5 line-clamp-2 text-[11px] text-quiet">{task.description}</p>}<span className={`mt-3 inline-flex rounded px-1.5 py-0.5 text-[9px] font-semibold ${priority[task.priority]}`}>{task.priority.toLowerCase()} priority</span><LabelBadges labels={task.labels} /></button>
            <select value={task.status} onChange={(event) => onStatus(task.id, event.target.value as TaskStatus)} className="mt-3 h-7 w-full rounded border border-line bg-canvas px-1.5 text-[10px] text-ink outline-none" aria-label={`Change status for ${task.title}`}><option value="TODO">Todo</option><option value="IN_PROGRESS">In progress</option><option value="DONE">Done</option></select>
          </article>)}{!columnTasks.length && <p className="rounded-lg border border-dashed border-line px-3 py-5 text-center text-[10px] text-quiet">No tasks</p>}</div>
        </section>
      })}
    </div>
  </section>
}

export function TaskList({ tasks, loading, hasProject, onEdit }: { tasks: Task[]; loading: boolean; hasProject: boolean; onEdit: TaskActions['onEdit'] }) {
  if (!hasProject) return <EmptyState icon={<List />} title="Select a project" text="Create or select a project to view its tasks." />
  if (loading) return <LoadingState />
  const status: Record<TaskStatus, string> = { TODO: 'bg-slate-100 text-slate-700', IN_PROGRESS: 'bg-amber-50 text-amber-700', DONE: 'bg-emerald-50 text-emerald-700' }
  return <section className="pt-7"><h2 className="font-display text-[17px] font-bold">Task list</h2><p className="mt-1 text-[11px] text-quiet">View and edit every task in this project.</p>{tasks.length ? <div className="mt-5 overflow-x-auto rounded-xl border border-line bg-panel"><table className="w-full min-w-[700px] border-collapse text-left text-xs"><thead className="border-b border-line text-[10px] uppercase tracking-wide text-quiet"><tr>{['Task', 'Status', 'Priority', 'Due date', 'Action'].map((heading) => <th key={heading} className="px-4 py-3">{heading}</th>)}</tr></thead><tbody>{tasks.map((task) => <tr key={task.id} className="border-b border-line last:border-0">  <td className="max-w-[320px] px-4 py-3"><strong className="block truncate">{task.title}</strong>{task.description && <span className="mt-1 block truncate text-[10px] text-quiet">{task.description}</span>}<LabelBadges labels={task.labels} /></td><td className="px-4 py-3"><span className={`rounded px-2 py-1 text-[10px] font-semibold ${status[task.status]}`}>{task.status.replace('_', ' ').toLowerCase()}</span></td><td className="px-4 py-3 text-[10px]">{task.priority.toLowerCase()}</td><td className="px-4 py-3 text-[11px] text-quiet">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}</td><td className="px-4 py-3 text-right"><button onClick={() => onEdit(task)} className="rounded-md border border-line px-2.5 py-1.5 text-[10px] font-semibold text-quiet">Edit</button></td></tr>)}</tbody></table></div> : <p className="mt-5 rounded-xl border border-dashed border-line p-12 text-center text-sm text-quiet">No tasks yet</p>}</section>
}

export function TaskCalendar({ tasks, loading, hasProject, onEdit }: { tasks: Task[]; loading: boolean; hasProject: boolean; onEdit: TaskActions['onEdit'] }) {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  if (!hasProject) return <EmptyState icon={<CalendarDays />} title="Select a project" text="Create or select a project to view its task calendar." />
  if (loading) return <LoadingState />
  const year = month.getFullYear(); const monthIndex = month.getMonth(); const first = new Date(year, monthIndex, 1).getDay(); const days = new Date(year, monthIndex + 1, 0).getDate()
  const cells = Array.from({ length: Math.ceil((first + days) / 7) * 7 }, (_, index) => index - first + 1)
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString()
  return <section className="pt-7"><header className="mb-5 flex items-center justify-between"><div><h2 className="font-display text-[17px] font-bold">Calendar</h2><p className="mt-1 text-[11px] text-quiet">Tasks appear on their due date.</p></div><div className="flex items-center gap-2"><button onClick={() => setMonth(new Date(year, monthIndex - 1, 1))} className="grid h-8 w-8 place-items-center rounded-md border border-line"><ChevronRight size={16} className="rotate-180" /></button><strong className="min-w-32 text-center text-xs">{month.toLocaleString('default', { month: 'long', year: 'numeric' })}</strong><button onClick={() => setMonth(new Date(year, monthIndex + 1, 1))} className="grid h-8 w-8 place-items-center rounded-md border border-line"><ChevronRight size={16} /></button></div></header><div className="overflow-x-auto rounded-xl border border-line bg-panel"><div className="min-w-[720px]"><div className="grid grid-cols-7 border-b border-line text-center text-[10px] font-semibold uppercase text-quiet">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <div key={day} className="px-3 py-2">{day}</div>)}</div><div className="grid grid-cols-7">{cells.map((day, index) => { if (day < 1 || day > days) return <div key={index} className="min-h-28 border-b border-r border-line bg-black/[.01]" />; const date = new Date(year, monthIndex, day); const dayTasks = tasks.filter((task) => task.dueDate && sameDay(new Date(task.dueDate), date)); return <div key={day} className="min-h-28 border-b border-r border-line p-2"><span className="text-[10px] text-quiet">{day}</span><div className="mt-1.5 space-y-1">{dayTasks.slice(0, 3).map((task) => <button key={task.id} onClick={() => onEdit(task)} className="block w-full truncate rounded bg-brand-soft px-1.5 py-1 text-left text-[9px] text-brand">{task.title}<LabelBadges labels={task.labels} compact /></button>)}</div></div> })}</div></div></div></section>
}

export function TaskFilterBar({ search, status, priority, dueDate, onSearch, onStatus, onPriority, onDueDate, onClear }: { search: string; status: TaskStatus | 'ALL'; priority: TaskPriority | 'ALL'; dueDate: DueDateFilter; onSearch: (value: string) => void; onStatus: (value: TaskStatus | 'ALL') => void; onPriority: (value: TaskPriority | 'ALL') => void; onDueDate: (value: DueDateFilter) => void; onClear: () => void }) {
  const active = Boolean(search) || status !== 'ALL' || priority !== 'ALL' || dueDate !== 'ALL'
  return <div className="mt-5 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-panel p-3"><label className="flex h-9 min-w-[180px] flex-1 items-center gap-2 rounded-md border border-line bg-canvas px-2.5 text-quiet"><Search size={15} /><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search tasks..." className="min-w-0 flex-1 bg-transparent text-xs text-ink outline-none" /></label><select value={status} onChange={(event) => onStatus(event.target.value as TaskStatus | 'ALL')} className="h-9 rounded-md border border-line bg-canvas px-2 text-xs"><option value="ALL">All statuses</option><option value="TODO">Todo</option><option value="IN_PROGRESS">In progress</option><option value="DONE">Done</option></select><select value={priority} onChange={(event) => onPriority(event.target.value as TaskPriority | 'ALL')} className="h-9 rounded-md border border-line bg-canvas px-2 text-xs"><option value="ALL">All priorities</option><option value="LOW">Low priority</option><option value="MEDIUM">Medium priority</option><option value="HIGH">High priority</option></select><select value={dueDate} onChange={(event) => onDueDate(event.target.value as DueDateFilter)} className="h-9 rounded-md border border-line bg-canvas px-2 text-xs"><option value="ALL">Any due date</option><option value="WITH_DUE_DATE">Has due date</option><option value="WITHOUT_DUE_DATE">No due date</option></select>{active && <button onClick={onClear} className="flex h-9 items-center gap-1 px-2 text-xs text-quiet"><X size={14} />Clear</button>}</div>
}

function EmptyState({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return <section className="flex h-[380px] flex-col items-center justify-center text-center text-quiet">{icon}<h2 className="mt-3 font-display text-lg font-bold text-ink">{title}</h2><p className="mt-1 text-sm">{text}</p></section>
}

function LoadingState() {
  return <section className="flex h-[380px] items-center justify-center text-sm text-quiet">Loading tasks…</section>
}
