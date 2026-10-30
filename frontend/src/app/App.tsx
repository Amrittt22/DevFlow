import { useCallback, useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import { Activity, CalendarDays, Check, ChevronDown, CirclePlus, FolderKanban, Home, Inbox, LayoutGrid, List, LogOut, Moon, Sun, Users } from 'lucide-react'
import AuthPage from '../features/auth/AuthPage'
import ResetPasswordPage from '../features/auth/ResetPasswordPage'
import { useAuth } from '../features/auth/AuthContext'
import { signOut } from '../services/auth.service'
import { fetchCurrentUserFromBackend, type Workspace } from '../services/api.service'
import { useWorkspaceData } from '../hooks/useWorkspaceData'
import { useTaskData } from '../hooks/useTaskData'
import { useLabelData } from '../hooks/useLabelData'
import { useWorkspaceMembers } from '../hooks/useWorkspaceMembers'
import { useWorkspaceInvites } from '../hooks/useWorkspaceInvites'
import type { Task, TaskStatus, WorkspaceMember } from './types'
import { TaskBoard, TaskCalendar, TaskFilterBar, TaskList } from '../components/tasks/TaskViews'
import WorkspaceMembersPanel from '../components/workspaces/WorkspaceMembersPanel'
import { CreateTaskModal, EditTaskModal, InvitationLinkModal, ProjectModal, WorkspaceModal , InviteMemberModal,WorkspaceInvitesModal} from '../components/modals/TaskModals'
import InvitePage from '../features/invites/InvitePage'
import { apiRequest } from '../lib/api'

const tabs = [
  { label: 'Overview', icon: LayoutGrid },
  { label: 'List', icon: List },
  { label: 'Board', icon: FolderKanban },
  { label: 'Calendar', icon: CalendarDays },
  { label: 'Members', icon: Users },
]

export default function App() {
  const { user, isLoading: isLoadingAuth } = useAuth()
  const isInvitePage = window.location.pathname === '/invite'
  const isResetPasswordPage = window.location.pathname === '/reset-password'
  const [dark, setDark] = useState(() => localStorage.getItem('devflow-theme') === 'dark')
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem('devflow-active-tab')

    return tabs.some((tab) => tab.label === savedTab)
      ? savedTab!
      : 'Board'
  })
  const [notice, setNotice] = useState('')
  const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false)
  const [projectModalOpen, setProjectModalOpen] = useState(false)
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [createTaskLabelIds, setCreateTaskLabelIds] = useState<string[]>([])
  const [editTaskLabelIds, setEditTaskLabelIds] = useState<string[]>([])
  const [createTaskAssigneeIds, setCreateTaskAssigneeIds] = useState<string[]>([])
  const [editTaskAssigneeIds, setEditTaskAssigneeIds] = useState<string[]>([])
  const [newLabelName, setNewLabelName] = useState('')
  const [newLabelColor, setNewLabelColor] = useState('#7C3AED')
  const notify = useCallback((message: string) => setNotice(message), [])
  const workspace = useWorkspaceData(isLoadingAuth, user?.id, notify)
  const task = useTaskData(workspace.activeProject?.id, notify)
  const label = useLabelData(workspace.activeWorkspaceId, notify)
  const member = useWorkspaceMembers(workspace.activeWorkspaceId, notify)
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [invitesModalOpen, setInvitesModalOpen] = useState(false)
  const [invitationLink, setInvitationLink] = useState<{
    email: string
    url: string
  } | null>(null)
  const [isInvitingMember, setIsInvitingMember] = useState(false)
  const canInviteMembers =
    workspace.activeWorkspace?.role === 'OWNER' ||
    workspace.activeWorkspace?.role === 'ADMIN'
  const invitation = useWorkspaceInvites(
    workspace.activeWorkspaceId,
    canInviteMembers,
    notify,
  )

  useEffect(() => {
    localStorage.setItem('devflow-active-tab', activeTab)
  }, [activeTab])

  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => setNotice(''), 4000)
    return () => window.clearTimeout(timeout)
  }, [notice])

  function toggleTheme() {
    const next = !dark
    setDark(next)
    localStorage.setItem('devflow-theme', next ? 'dark' : 'light')
  }

  async function handleSignOut() {
    const { error } = await signOut()
    if (error) notify(error.message)
  }

  async function handleBackendCheck() {
    try {
      const backendUser = await fetchCurrentUserFromBackend()
      notify(`Backend verified: ${backendUser.email ?? backendUser.id}`)
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Backend request failed')
    }
  }

  async function inviteWorkspaceMember(
    email: string,
    role: 'ADMIN' | 'MEMBER',
  ) {
    if (!workspace.activeWorkspaceId) {
      throw new Error('Select a workspace before sending an invitation.')
    }

    setIsInvitingMember(true)

    try {
      const result = await apiRequest<{
        invite: {
          email: string
        }
        emailSent: boolean
        inviteUrl: string
      }>(`/api/v1/workspaces/${workspace.activeWorkspaceId}/invites`, {
        method: 'POST',
        body: JSON.stringify({ email, role }),
      })

      invitation.refreshInvites()
      if (result.emailSent) {
        notify(`Invitation sent to ${result.invite.email}`)
      } else {
        setInvitationLink({
          email: result.invite.email,
          url: result.inviteUrl,
        })
      }
    } finally {
      setIsInvitingMember(false)
    }
  }

  async function updateStatus(id: string, status: TaskStatus) {
    try {
      await task.updateTask(id, { status })
      notify(`Task moved to ${status.replace('_', ' ').toLowerCase()}`)
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not update task')
    }
  }

  async function changeMemberRole(
    userId: string,
    role: 'ADMIN' | 'MEMBER',
  ) {
    try {
      const updated = await member.updateMemberRole(userId, role)
      notify(
        `${updated.displayName || updated.email} is now ${role.toLowerCase()}`,
      )
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : 'Could not update member role',
      )
      await member.refreshMembers()
    }
  }

  async function removeWorkspaceMember(target: WorkspaceMember) {
    const confirmed = window.confirm(
      `Remove ${target.displayName || target.email} from this workspace? ` +
        'Their assignments in this workspace will also be cleared.',
    )

    if (!confirmed) return

    try {
      await member.removeMember(target.id)
      notify(`${target.email} was removed from the workspace`)
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : 'Could not remove workspace member',
      )
    }
  }

  async function updateEditingTask(input: Partial<Task>) {
    if (!editingTask) return
    try {
      const updated = await task.updateTask(editingTask.id, input)
      notify(`Task "${updated.title}" updated`)
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not update task')
      throw error
    }

  }

  function toggleLabel(id: string, setIds: Dispatch<SetStateAction<string[]>>) {
    setIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  function openTaskEditor(selectedTask: Task) {
    setEditingTask(selectedTask)
    setEditTaskLabelIds(selectedTask.labels.map((label) => label.id))
    setEditTaskAssigneeIds(
      selectedTask.assignees.map((assignee) => assignee.id),
    )
  }

  async function createLabel(target: 'create' | 'edit') {
    try {
      const created = await label.createLabel(newLabelName, newLabelColor)
      const setter = target === 'create' ? setCreateTaskLabelIds : setEditTaskLabelIds
      setter((current) => [...current, created.id])
      setNewLabelName('')
      setNewLabelColor('#7C3AED')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not create label')
    }
  }

  async function deleteEditingTask() {
    if (!editingTask) return
    if (!window.confirm(`Delete "${editingTask.title}"? This action cannot be undone.`)) return
    try {
      await task.deleteTask(editingTask)
      setEditingTask(null)
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not delete task')
      throw error
    }

  }

  function closeCreateTaskModal() {
    setTaskModalOpen(false)
    setCreateTaskLabelIds([])
    setCreateTaskAssigneeIds([])
  }

  if (isLoadingAuth) return <div className={`${dark ? 'dark' : ''} grid min-h-screen place-items-center bg-canvas text-ink`}>Checking your session…</div>
  if (isResetPasswordPage) {
    return (
      <div className={`${dark ? 'dark' : ''} min-h-screen`}>
        <ResetPasswordPage />
      </div>
    )
  }

 if (!user) {
  return (
    <div className={`${dark ? 'dark' : ''} min-h-screen`}>
      <AuthPage />
    </div>
  )
}

if (isInvitePage) {
  return (
    <div className={`${dark ? 'dark' : ''} min-h-screen`}>
      <InvitePage user={user} />
    </div>
  )
}

  return <div className={`${dark ? 'dark' : ''} min-h-screen bg-canvas text-ink`}>
    <div className="flex min-h-screen">
      <Sidebar workspaces={workspace.workspaces} projects={workspace.projects} activeWorkspaceId={workspace.activeWorkspaceId} activeProjectId={workspace.activeProjectId} isLoading={workspace.isLoadingWorkspaces} onWorkspace={workspace.setActiveWorkspaceId} onProject={workspace.setActiveProjectId} onAddWorkspace={() => setWorkspaceModalOpen(true)} onAddProject={() => workspace.activeWorkspaceId ? setProjectModalOpen(true) : notify('Create a workspace first')} onNotify={notify} />
      <main className="min-w-0 flex-1">
        <header className="flex min-h-[76px] items-center justify-between border-b border-line bg-panel px-6 max-[680px]:px-4">
          <div><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-quiet">Workspace</p><h1 className="font-display text-xl font-bold">{workspace.activeProject?.name ?? workspace.activeWorkspace?.name ?? 'DevFlow'}</h1></div>
          <div className="flex items-center gap-3">{canInviteMembers && workspace.activeWorkspace && (<><button type="button" onClick={() => setInvitesModalOpen(true)} className="hidden items-center gap-1.5 rounded-md border border-line px-3 py-2 text-xs font-semibold text-quiet hover:bg-black/[.04] sm:flex dark:hover:bg-white/[.05]"><Users size={15} />Manage invitations</button><button type="button" onClick={() => setInviteModalOpen(true)} className="hidden items-center gap-1.5 rounded-md border border-line px-3 py-2 text-xs font-semibold text-quiet hover:bg-black/[.04] sm:flex dark:hover:bg-white/[.05]"><Users size={15} />Invite member</button></>)}<button onClick={() => void handleBackendCheck()} className="hidden text-xs text-quiet hover:text-ink sm:block">Check backend</button><button onClick={toggleTheme} className="text-quiet" aria-label="Toggle theme">{dark ? <Sun size={17} /> : <Moon size={17} />}</button><button onClick={() => void handleSignOut()} className="text-quiet" aria-label="Sign out"><LogOut size={17} /></button></div>
        </header>
        <div className="mx-auto max-w-[1200px] px-6 py-5 max-[680px]:px-4">
          <nav className="flex gap-1 overflow-x-auto border-b border-line">{tabs.map(({ label, icon: Icon }) => <button key={label} onClick={() => setActiveTab(label)} className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold ${activeTab === label ? 'border-brand text-brand' : 'border-transparent text-quiet'}`}><Icon size={14} />{label}</button>)}</nav>
          {['Board', 'List', 'Calendar'].includes(activeTab) && <TaskFilterBar search={task.search} status={task.status} priority={task.priority} dueDate={task.dueDate} onSearch={task.setSearch} onStatus={task.setStatus} onPriority={task.setPriority} onDueDate={task.setDueDate} onClear={task.clearFilters} />}
          {activeTab === 'Board' && <TaskBoard tasks={task.tasks} loading={task.isLoadingTasks} hasProject={Boolean(workspace.activeProject)} onCreate={() => setTaskModalOpen(true)} onStatus={(id, status) => void updateStatus(id, status)} onEdit={openTaskEditor} />}
          {activeTab === 'List' && <TaskList tasks={task.tasks} loading={task.isLoadingTasks} hasProject={Boolean(workspace.activeProject)} onEdit={openTaskEditor} />}
          {activeTab === 'Calendar' && <TaskCalendar tasks={task.tasks} loading={task.isLoadingTasks} hasProject={Boolean(workspace.activeProject)} onEdit={openTaskEditor} />}
          {activeTab === 'Overview' && <Overview tasks={task.tasks} onCreate={() => setTaskModalOpen(true)} />}
          {activeTab === 'Members' && (
            <WorkspaceMembersPanel
              workspaceName={workspace.activeWorkspace?.name}
              actorRole={workspace.activeWorkspace?.role}
              members={member.members}
              loading={member.isLoadingMembers}
              updating={member.isUpdatingMember}
              onRoleChange={changeMemberRole}
              onRemove={removeWorkspaceMember}
            />
          )}
        </div>
      </main>
    </div>
    {notice && <div className="fixed bottom-5 right-5 z-40 rounded-lg border border-line bg-panel px-4 py-3 text-sm shadow-xl">{notice}</div>}
    <WorkspaceModal open={workspaceModalOpen} loading={workspace.isCreatingWorkspace} onClose={() => setWorkspaceModalOpen(false)} onSubmit={async (name) => { try { await workspace.createWorkspace(name) } catch (error) { notify(error instanceof Error ? error.message : 'Could not create workspace'); throw error } }} />
    <ProjectModal open={projectModalOpen} loading={workspace.isCreatingProject} onClose={() => setProjectModalOpen(false)} onSubmit={async (name, description) => { try { await workspace.createProject(name, description) } catch (error) { notify(error instanceof Error ? error.message : 'Could not create project'); throw error } }} />
    <CreateTaskModal open={taskModalOpen} loading={task.isCreatingTask} projectName={workspace.activeProject?.name} labels={label.labels} selectedLabelIds={createTaskLabelIds} onToggleLabel={(id) => toggleLabel(id, setCreateTaskLabelIds)} members={member.members} selectedAssigneeIds={createTaskAssigneeIds} onToggleAssignee={(id) => toggleLabel(id, setCreateTaskAssigneeIds)} isLoadingMembers={member.isLoadingMembers} newLabelName={newLabelName} newLabelColor={newLabelColor} onNewLabelNameChange={setNewLabelName} onNewLabelColorChange={setNewLabelColor} onCreateLabel={() => void createLabel('create')} isCreating={label.isCreating} isLoading={label.isLoading} onClose={closeCreateTaskModal} onSubmit={async (input) => { try { await task.createTask(input); setCreateTaskLabelIds([]); setCreateTaskAssigneeIds([]) } catch (error) { notify(error instanceof Error ? error.message : 'Could not create task'); throw error } }} />
    <EditTaskModal task={editingTask} updating={task.isUpdatingTask} deleting={task.isDeletingTask} labels={label.labels} selectedLabelIds={editTaskLabelIds} onToggleLabel={(id) => toggleLabel(id, setEditTaskLabelIds)} members={member.members} selectedAssigneeIds={editTaskAssigneeIds} onToggleAssignee={(id) => toggleLabel(id, setEditTaskAssigneeIds)} isLoadingMembers={member.isLoadingMembers} newLabelName={newLabelName} newLabelColor={newLabelColor} onNewLabelNameChange={setNewLabelName} onNewLabelColorChange={setNewLabelColor} onCreateLabel={() => void createLabel('edit')} isCreating={label.isCreating} isLoading={label.isLoading} onClose={() => setEditingTask(null)} onUpdate={async (input) => { try { await updateEditingTask(input); await task.setTaskLabels(editingTask!.id, editTaskLabelIds); await task.setTaskAssignees(editingTask!.id, editTaskAssigneeIds) } catch (error) { notify(error instanceof Error ? error.message : 'Could not save task assignees'); throw error } }} onDelete={deleteEditingTask} />
    <InvitationLinkModal open={Boolean(invitationLink)} email={invitationLink?.email ?? ''} inviteUrl={invitationLink?.url ?? ''} onClose={() => setInvitationLink(null)} />
    <WorkspaceInvitesModal open={invitesModalOpen} loading={invitation.isLoadingInvites} workspaceName={workspace.activeWorkspace?.name} invites={invitation.invites} actionInviteId={invitation.actionInviteId} onRevoke={invitation.revokeInvite} onResend={invitation.resendInvite} onClose={() => setInvitesModalOpen(false)} />
    <InviteMemberModal open={inviteModalOpen} loading={isInvitingMember} workspaceName={workspace.activeWorkspace?.name} onClose={() => setInviteModalOpen(false)} onSubmit={inviteWorkspaceMember} />
  </div>
}

function Sidebar({ workspaces, projects, activeWorkspaceId, activeProjectId, isLoading, onWorkspace, onProject, onAddWorkspace, onAddProject, onNotify }: { workspaces: Workspace[]; projects: Array<{ id: string; name: string }>; activeWorkspaceId: string; activeProjectId: string; isLoading: boolean; onWorkspace: (id: string) => void; onProject: (id: string) => void; onAddWorkspace: () => void; onAddProject: () => void; onNotify: (message: string) => void }) {
  return <aside className="sticky top-0 flex h-screen w-[252px] shrink-0 flex-col border-r border-line bg-panel p-3.5 max-[680px]:w-[62px] max-[680px]:px-2"><div className="mb-5 flex h-12 items-center gap-2.5 rounded-lg border border-line px-2 max-[680px]:justify-center max-[680px]:border-0"><span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-orange-400 to-rose-500 font-display text-base font-extrabold text-white">D</span><strong className="text-xs max-[680px]:hidden">DevFlow Studio</strong><ChevronDown size={15} className="ml-auto text-quiet max-[680px]:hidden" /></div><div className="space-y-1 border-b border-line pb-4"><SideLink icon={Home} label="Home" onClick={() => onNotify('Home')} /><SideLink icon={Check} label="My tasks" onClick={() => onNotify('My tasks')} /><SideLink icon={Inbox} label="Inbox" onClick={() => onNotify('Inbox')} /><SideLink icon={Activity} label="Activity" onClick={() => onNotify('Activity')} /></div><Section title="YOUR WORKSPACES" onAdd={onAddWorkspace}>{isLoading ? <p className="px-2 py-2 text-[10px] text-quiet">Loading…</p> : workspaces.map((item) => <button key={item.id} onClick={() => onWorkspace(item.id)} className={`flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-xs ${activeWorkspaceId === item.id ? 'bg-brand-soft font-semibold text-brand' : 'text-quiet'}`}><Users size={14} /><span className="truncate max-[680px]:hidden">{item.name}</span></button>)}</Section><Section title="YOUR PROJECTS" onAdd={onAddProject}>{projects.map((item) => <button key={item.id} onClick={() => onProject(item.id)} className={`flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-xs ${activeProjectId === item.id ? 'bg-brand-soft font-semibold text-brand' : 'text-quiet'}`}><FolderKanban size={14} /><span className="truncate max-[680px]:hidden">{item.name}</span></button>)}</Section></aside>
}

function Section({ title, onAdd, children }: { title: string; onAdd: () => void; children: ReactNode }) {
  return <section className="pt-4"><div className="mb-1 flex items-center justify-between px-2 text-[9px] font-bold tracking-[.08em] text-quiet"><span className="max-[680px]:hidden">{title}</span><button onClick={onAdd} aria-label={`Add ${title.toLowerCase()}`}><CirclePlus size={14} /></button></div>{children}</section>
}

function SideLink({ icon: Icon, label, onClick }: { icon: typeof Home; label: string; onClick: () => void }) {
  return <button onClick={onClick} className="flex h-9 w-full items-center gap-2.5 rounded-md px-2 text-left text-xs text-quiet hover:bg-black/[.04] max-[680px]:justify-center"><Icon size={16} /><span className="max-[680px]:hidden">{label}</span></button>
}

function Overview({ tasks, onCreate }: { tasks: Task[]; onCreate: () => void }) {
  return <section className="pt-8"><div className="rounded-xl border border-line bg-panel p-6"><p className="text-xs font-semibold uppercase tracking-wide text-brand">Project overview</p><h2 className="mt-2 font-display text-2xl font-bold">Keep your team moving</h2><p className="mt-2 max-w-lg text-sm text-quiet">Track tasks, priorities, and due dates from one focused workspace.</p><button onClick={onCreate} className="mt-5 inline-flex items-center gap-2 rounded-md bg-brand px-3 py-2 text-xs font-semibold text-white"><CirclePlus size={15} /> Add task</button></div><div className="mt-5 grid gap-3 sm:grid-cols-3">{[['Total tasks', tasks.length], ['In progress', tasks.filter((task) => task.status === 'IN_PROGRESS').length], ['Completed', tasks.filter((task) => task.status === 'DONE').length]].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-line bg-panel p-4"><p className="text-xs text-quiet">{label}</p><strong className="mt-2 block text-2xl">{value}</strong></div>)}</div></section>
}
