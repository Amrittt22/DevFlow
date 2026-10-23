import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Activity, AlignLeft, Bell, CalendarDays, Check, ChevronDown, ChevronRight, CircleHelp, CirclePlus, Command, FileText, Filter, FolderKanban, Home, Inbox, LayoutGrid, List, LogOut, Moon, MoreHorizontal, Search, Settings, Share2, SlidersHorizontal, Sun, Users, X } from 'lucide-react'
import AuthPage from '../features/auth/AuthPage'
import { useAuth } from '../features/auth/AuthContext'
import { signOut } from '../services/auth.service'
import {
  createWorkspaceInBackend,
  fetchWorkspacesFromBackend,
  fetchCurrentUserFromBackend,
  type Workspace,
} from '../services/api.service'
import { apiRequest } from '../lib/api'

const events = [
  { icon: CirclePlus, tone: 'violet', title: 'Maya Chen created a task', detail: 'Add keyboard shortcuts to the task board', time: '12 min ago', initials: 'MC', avatar: 'bg-orange-200 text-orange-900', project: 'Product' },
  { icon: Check, tone: 'green', title: 'Arjun Patel completed a task', detail: 'Set up project onboarding flow', time: '38 min ago', initials: 'AP', avatar: 'bg-emerald-200 text-emerald-900', project: 'Website redesign' },
  { icon: Users, tone: 'blue', title: 'Maya Chen invited 3 people to', detail: 'Mobile app sprint', time: '1 hour ago', initials: 'MC', avatar: 'bg-orange-200 text-orange-900', project: 'Mobile app' },
  { icon: FileText, tone: 'orange', title: 'Noah Kim opened an issue', detail: 'Search results are not updating', time: '2 hours ago', initials: 'NK', avatar: 'bg-indigo-200 text-indigo-900', project: 'Product' },
  { icon: Activity, tone: 'pink', title: 'Sofia Garcia moved a task to In review', detail: 'Update the billing settings page', time: '3 hours ago', initials: 'SG', avatar: 'bg-pink-200 text-pink-900', project: 'Website redesign' },
]
const navItems = [{ label: 'Home', icon: Home }, { label: 'My tasks', icon: Check }, { label: 'Inbox', icon: Inbox, count: '4' }, { label: 'Activity', icon: Activity }]
type Project = {
  id: string
  name: string
  slug: string
  description: string | null
  createdAt: string
  updatedAt: string
}

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'
type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH'
type DueDateFilter = 'ALL' | 'WITH_DUE_DATE' | 'WITHOUT_DUE_DATE'

type Task = {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  dueDate: string | null
  projectId: string
  createdAt: string
  updatedAt: string
}
const tabs = [{ label: 'Overview', icon: LayoutGrid }, { label: 'List', icon: List }, { label: 'Board', icon: FolderKanban }, { label: 'Calendar', icon: CalendarDays }, { label: 'Timeline', icon: SlidersHorizontal }, { label: 'Files', icon: FileText }, { label: 'Activity', icon: Activity }]
const tone = { violet: 'bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-300', green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300', blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300', orange: 'bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-300', pink: 'bg-pink-50 text-pink-600 dark:bg-pink-950 dark:text-pink-300' }

function getActiveProjectStorageKey(workspaceId: string) {
  return `devflow-active-project:${workspaceId}`
}

export default function App() {
  const { user, isLoading } = useAuth()
  const [dark, setDark] = useState(() => localStorage.getItem('devflow-theme') === 'dark')
  const [activeNav, setActiveNav] = useState('Activity')
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem('devflow-active-tab')

    return tabs.some((tab) => tab.label === savedTab)
      ? savedTab!
      : 'Activity'
  })
  const [filter, setFilter] = useState(false)
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState('')
  const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false)
  const [workspaceName, setWorkspaceName] = useState('')
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
  const [loadedProjectsWorkspaceId, setLoadedProjectsWorkspaceId] = useState('')
  const [isLoadingProjects, setIsLoadingProjects] = useState(false)
  const [projectModalOpen, setProjectModalOpen] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(
    () => localStorage.getItem('devflow-active-workspace') ?? '',
  )
  const [activeProjectId, setActiveProjectId] = useState(() => {
    const savedWorkspaceId = localStorage.getItem('devflow-active-workspace')

    if (!savedWorkspaceId) {
      return ''
    }

    return (
      localStorage.getItem(getActiveProjectStorageKey(savedWorkspaceId)) ?? ''
    )
  })
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoadingTasks, setIsLoadingTasks] = useState(false)
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('TODO')
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('MEDIUM')
  const [taskSearch, setTaskSearch] = useState('')
  const [taskStatusFilter, setTaskStatusFilter] = useState<
    TaskStatus | 'ALL'
  >('ALL')
  const [taskPriorityFilter, setTaskPriorityFilter] = useState<
    TaskPriority | 'ALL'
  >('ALL')
  const [dueDateFilter, setDueDateFilter] = useState<DueDateFilter>('ALL')
  const [isCreatingTask, setIsCreatingTask] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editTaskTitle, setEditTaskTitle] = useState('')
  const [editTaskDescription, setEditTaskDescription] = useState('')
  const [editTaskStatus, setEditTaskStatus] = useState<TaskStatus>('TODO')
  const [editTaskPriority, setEditTaskPriority] = useState<TaskPriority>('MEDIUM')
  const [editTaskDueDate, setEditTaskDueDate] = useState('')
  const [isUpdatingTask, setIsUpdatingTask] = useState(false)
  const [isDeletingTask, setIsDeletingTask] = useState(false)
  const activeWorkspace = workspaces.find(
    (workspace) => workspace.id === activeWorkspaceId,
  )
  const activeProject = projects.find(
    (project) => project.id === activeProjectId,
  )
  const filteredTasks = tasks.filter((task) => {
    const searchText = `${task.title} ${task.description ?? ''}`.toLowerCase()
    const matchesSearch = searchText.includes(taskSearch.trim().toLowerCase())

    const matchesStatus =
      taskStatusFilter === 'ALL' || task.status === taskStatusFilter

    const matchesPriority =
      taskPriorityFilter === 'ALL' || task.priority === taskPriorityFilter

    const matchesDueDate =
      dueDateFilter === 'ALL' ||
      (dueDateFilter === 'WITH_DUE_DATE' && Boolean(task.dueDate)) ||
      (dueDateFilter === 'WITHOUT_DUE_DATE' && !task.dueDate)

    return matchesSearch && matchesStatus && matchesPriority && matchesDueDate
  })
  const shown = events.filter((event) => `${event.title} ${event.detail} ${event.project}`.toLowerCase().includes(query.toLowerCase()))
  const notify = (message: string) => setNotice(message)
  useEffect(() => {
    if (isLoading || !user) return

    let cancelled = false
    setIsLoadingWorkspaces(true)

    fetchWorkspacesFromBackend()
      .then((loadedWorkspaces) => {
        if (!cancelled) {
          const savedWorkspaceId = localStorage.getItem('devflow-active-workspace')
          const selectedWorkspaceId = loadedWorkspaces.some(
            (workspace) => workspace.id === savedWorkspaceId,
          )
            ? savedWorkspaceId!
            : loadedWorkspaces[0]?.id ?? ''

          setWorkspaces(loadedWorkspaces)
          setActiveWorkspaceId(selectedWorkspaceId)

          if (selectedWorkspaceId) {
            localStorage.setItem('devflow-active-workspace', selectedWorkspaceId)
          } else {
            localStorage.removeItem('devflow-active-workspace')
          }
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          notify(
            error instanceof Error ? error.message : 'Could not load workspaces',
          )
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingWorkspaces(false)
      })

    return () => {
      cancelled = true
    }
  }, [isLoading, user?.id])
  useEffect(() => {
    if (!activeWorkspaceId) {
      setProjects([])
      setLoadedProjectsWorkspaceId('')
      setActiveProjectId('')
      return
    }

    let cancelled = false
    setIsLoadingProjects(true)
    setProjects([])
    setLoadedProjectsWorkspaceId('')
    setActiveProjectId('')

    apiRequest<{ projects: Project[] }>(
      `/api/v1/workspaces/${activeWorkspaceId}/projects`,
    )
      .then(({ projects: loadedProjects }) => {
        if (!cancelled) {
          setProjects(loadedProjects)
          setLoadedProjectsWorkspaceId(activeWorkspaceId)
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setProjects([])
          notify(
            error instanceof Error ? error.message : 'Could not load projects',
          )
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingProjects(false)
      })

    return () => {
      cancelled = true
    }
  }, [activeWorkspaceId])
  useEffect(() => {
    if (
      !activeWorkspaceId ||
      loadedProjectsWorkspaceId !== activeWorkspaceId
    ) {
      return
    }

    const storageKey = getActiveProjectStorageKey(activeWorkspaceId)
    const savedProjectId = localStorage.getItem(storageKey)
    const selectedProjectId = projects.some(
      (project) => project.id === savedProjectId,
    )
      ? savedProjectId!
      : projects[0]?.id ?? ''

    setActiveProjectId(selectedProjectId)

    if (selectedProjectId) {
      localStorage.setItem(storageKey, selectedProjectId)
    } else {
      localStorage.removeItem(storageKey)
    }
  }, [projects, activeWorkspaceId, loadedProjectsWorkspaceId])
  useEffect(() => {
    if (!activeProject?.id) {
      setTasks([])
      return
    }

    let cancelled = false
    setIsLoadingTasks(true)

    apiRequest<{ tasks: Task[] }>(`/api/v1/projects/${activeProject.id}/tasks`)
      .then(({ tasks: loadedTasks }) => {
        if (!cancelled) setTasks(loadedTasks)
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setTasks([])
          notify(error instanceof Error ? error.message : 'Could not load tasks')
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingTasks(false)
      })

    return () => {
      cancelled = true
    }
  }, [activeProject?.id])
  useEffect(() => {
    localStorage.setItem('devflow-active-tab', activeTab)
  }, [activeTab])
  function toggleTheme() { const next = !dark; setDark(next); localStorage.setItem('devflow-theme', next ? 'dark' : 'light') }
  async function handleSignOut() {
    const { error } = await signOut()
    if (error) notify(error.message)
  }
  async function checkBackendConnection() {
    try {
      const backendUser = await fetchCurrentUserFromBackend()
      notify(`Backend verified: ${backendUser.email ?? backendUser.id}`)
    } catch (error) {
      notify(
        error instanceof Error ? error.message : 'Backend request failed',
      )
    }
  }
  async function handleCreateWorkspace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsCreatingWorkspace(true)

    try {
      const workspace = await createWorkspaceInBackend(workspaceName)
      setWorkspaces((currentWorkspaces) => [...currentWorkspaces, workspace])
      setActiveWorkspaceId(workspace.id)
      localStorage.setItem('devflow-active-workspace', workspace.id)
      notify(`Workspace "${workspace.name}" created`)
      setWorkspaceModalOpen(false)
      setWorkspaceName('')
    } catch (error) {
      notify(
        error instanceof Error ? error.message : 'Could not create workspace',
      )
    } finally {
      setIsCreatingWorkspace(false)
    }
  }
  async function handleCreateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!activeWorkspaceId) {
      notify('Create a workspace before creating a project')
      return
    }

    setIsCreatingProject(true)

    try {
      const { project } = await apiRequest<{ project: Project }>(
        `/api/v1/workspaces/${activeWorkspaceId}/projects`,
        {
          method: 'POST',
          body: JSON.stringify({
            name: projectName,
            description: projectDescription || undefined,
          }),
        },
      )

      setProjects((currentProjects) => [project, ...currentProjects])
      setActiveProjectId(project.id)
      localStorage.setItem(
        getActiveProjectStorageKey(activeWorkspaceId),
        project.id,
      )
      setProjectModalOpen(false)
      setProjectName('')
      setProjectDescription('')
      notify(`Project "${project.name}" created`)
    } catch (error) {
      notify(
        error instanceof Error ? error.message : 'Could not create project',
      )
    } finally {
      setIsCreatingProject(false)
    }
  }
  async function handleCreateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!activeProject?.id) {
      notify('Select a project before creating a task')
      return
    }

    setIsCreatingTask(true)

    try {
      const { task } = await apiRequest<{ task: Task }>(
        `/api/v1/projects/${activeProject.id}/tasks`,
        {
          method: 'POST',
          body: JSON.stringify({
            title: taskTitle,
            description: taskDescription || undefined,
            status: taskStatus,
            priority: taskPriority,
          }),
        },
      )

      setTasks((currentTasks) => [task, ...currentTasks])
      setTaskModalOpen(false)
      setTaskTitle('')
      setTaskDescription('')
      setTaskStatus('TODO')
      setTaskPriority('MEDIUM')
      notify(`Task "${task.title}" created`)
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not create task')
    } finally {
      setIsCreatingTask(false)
    }
  }

  async function handleUpdateTaskStatus(
    taskId: string,
    status: TaskStatus,
  ) {
    try {
      const { task } = await apiRequest<{ task: Task }>(
        `/api/v1/tasks/${taskId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        },
      )

      setTasks((currentTasks) =>
        currentTasks.map((currentTask) =>
          currentTask.id === task.id ? task : currentTask,
        ),
      )

      notify(`Task moved to ${status.replace('_', ' ').toLowerCase()}`)
    } catch (error) {
      notify(
        error instanceof Error ? error.message : 'Could not update task',
      )
    }
  }

  function openTaskEditor(task: Task) {
    setEditingTask(task)
    setEditTaskTitle(task.title)
    setEditTaskDescription(task.description ?? '')
    setEditTaskStatus(task.status)
    setEditTaskPriority(task.priority)
    setEditTaskDueDate(
      task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : '',
    )
  }

  async function handleEditTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!editingTask) {
      return
    }

    setIsUpdatingTask(true)

    try {
      const { task } = await apiRequest<{ task: Task }>(
        `/api/v1/tasks/${editingTask.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            title: editTaskTitle,
            description: editTaskDescription || null,
            status: editTaskStatus,
            priority: editTaskPriority,
            dueDate: editTaskDueDate
              ? new Date(editTaskDueDate).toISOString()
              : null,
          }),
        },
      )

      setTasks((currentTasks) =>
        currentTasks.map((currentTask) =>
          currentTask.id === task.id ? task : currentTask,
        ),
      )

      setEditingTask(null)
      notify(`Task "${task.title}" updated`)
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not update task')
    } finally {
      setIsUpdatingTask(false)
    }
  }
  async function handleDeleteTask() {
    if (!editingTask) {
      return
    }

    const shouldDelete = window.confirm(
      `Delete "${editingTask.title}"? This action cannot be undone.`,
    )

    if (!shouldDelete) {
      return
    }

    setIsDeletingTask(true)

    try {
      await apiRequest<{ success: boolean }>(
        `/api/v1/tasks/${editingTask.id}`,
        {
          method: 'DELETE',
        },
      )

      setTasks((currentTasks) =>
        currentTasks.filter((task) => task.id !== editingTask.id),
      )

      setEditingTask(null)
      notify(`Task "${editingTask.title}" deleted`)
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not delete task')
    } finally {
      setIsDeletingTask(false)
    }
  }


  if (isLoading) {
    return <div className={`${dark ? 'dark' : ''} grid min-h-screen place-items-center bg-canvas text-ink`}>Checking your session…</div>
  }

  if (!user) {
    return <div className={`${dark ? 'dark' : ''} min-h-screen`}><AuthPage /></div>
  }

  return <div className={`${dark ? 'dark' : ''} min-h-screen bg-canvas text-ink`}>
    <div className="flex min-h-screen">
      <aside className="sticky top-0 flex h-screen w-[252px] shrink-0 flex-col border-r border-line bg-panel p-3.5 max-[680px]:w-[62px] max-[680px]:px-2">
        <button className="mb-5 flex h-12 items-center gap-2.5 rounded-lg border border-line px-2 text-left max-[680px]:justify-center max-[680px]:border-0 max-[680px]:px-0"><span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-orange-400 to-rose-500 font-display text-base font-extrabold text-white">D</span><span className="flex min-w-0 flex-1 flex-col max-[680px]:hidden"><strong className="text-xs">DevFlow Studio</strong><small className="text-[10px] text-quiet">devflow.team</small></span><ChevronDown size={15} className="text-quiet max-[680px]:hidden" /></button>
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-0.5 border-b border-line pb-4">{navItems.map(({ label, icon: Icon, count }) => <button key={label} onClick={() => setActiveNav(label)} className={`flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-left text-xs transition hover:bg-black/[.04] dark:hover:bg-white/[.05] max-[680px]:justify-center max-[680px]:px-0 ${activeNav === label ? 'bg-brand-soft font-semibold text-brand dark:bg-violet-950/60 dark:text-violet-300' : 'text-quiet'}`}><Icon size={17} /><span className="flex-1 max-[680px]:hidden">{label}</span>{count && <small className="text-[10px] max-[680px]:hidden">{count}</small>}</button>)}</div>
          <SideSection title="WORKSPACE" onAdd={() => { setWorkspaceName(''); setWorkspaceModalOpen(true) }}><SideLink icon={FolderKanban} label="Project board" onClick={() => notify('Your project board is ready')} /><SideLink icon={FileText} label="Templates" onClick={() => notify('Templates are coming soon')} /><SideLink icon={CalendarDays} label="Upcoming projects" count="12" onClick={() => notify('Showing upcoming projects')} /><SideLink icon={Users} label="Team members" count="8" onClick={() => notify('Showing all team members')} /></SideSection>
          <SideSection title="YOUR WORKSPACES" onAdd={() => { setWorkspaceName(''); setWorkspaceModalOpen(true) }}>
            {isLoadingWorkspaces ? (
              <p className="px-2.5 py-2 text-[10px] text-quiet max-[680px]:hidden">Loading workspaces…</p>
            ) : workspaces.length ? (
              workspaces.map((workspace, index) => {
                const colors = ['violet', 'orange', 'blue', 'green', 'pink']
                return (
                  <button
                    key={workspace.id}
                    onClick={() => {
                      setActiveWorkspaceId(workspace.id)
                      localStorage.setItem('devflow-active-workspace', workspace.id)
                    }}
                    className={`flex h-[34px] w-full items-center gap-2.5 rounded-md px-2.5 text-left text-xs hover:bg-black/[.04] dark:hover:bg-white/[.05] max-[680px]:justify-center max-[680px]:px-0 ${activeWorkspace?.id === workspace.id ? 'bg-brand-soft font-semibold text-brand dark:bg-violet-950/60 dark:text-violet-300' : 'text-quiet'}`}
                  >
                    <ProjectGlyph color={colors[index % colors.length]} />
                    <span className="flex-1 truncate max-[680px]:hidden">{workspace.name}</span>
                  </button>
                )
              })
            ) : (
              <p className="px-2.5 py-2 text-[10px] text-quiet max-[680px]:hidden">No workspaces yet</p>
            )}
          </SideSection>
          <SideSection
            title="YOUR PROJECTS"
            onAdd={() => {
              if (!activeWorkspaceId) {
                notify('Create a workspace first')
                return
              }

              setProjectName('')
              setProjectDescription('')
              setProjectModalOpen(true)
            }}
          >
            {isLoadingProjects ? (
              <p className="px-2.5 py-2 text-[10px] text-quiet max-[680px]:hidden">Loading projects…</p>
            ) : projects.length ? (
              projects.map((project, index) => {
                const colors = ['violet', 'orange', 'blue', 'green', 'pink']

                return (
                  <button
                    key={project.id}
                    onClick={() => {
                      setActiveProjectId(project.id)
                      localStorage.setItem(
                        getActiveProjectStorageKey(activeWorkspaceId),
                        project.id,
                      )
                    }}
                    className={`flex h-[34px] w-full items-center gap-2.5 rounded-md px-2.5 text-left text-xs hover:bg-black/[.04] dark:hover:bg-white/[.05] max-[680px]:justify-center max-[680px]:px-0 ${activeProject?.id === project.id
                      ? 'bg-black/[.04] font-semibold dark:bg-white/[.05]'
                      : 'text-quiet'
                      }`}
                  >
                    <ProjectGlyph color={colors[index % colors.length]} />
                    <span className="flex-1 truncate max-[680px]:hidden">{project.name}</span>
                  </button>
                )
              })
            ) : (
              <p className="px-2.5 py-2 text-[10px] text-quiet max-[680px]:hidden">No projects yet</p>
            )}
          </SideSection>
        </div>
        <div className="border-t border-line pt-2"><div className="flex items-center gap-2 rounded-md px-1.5 py-2"><Avatar initials={user.email?.slice(0, 2).toUpperCase() ?? 'U'} color="bg-violet-800 text-white" /><span className="flex-1 truncate max-[680px]:hidden"><strong className="block truncate text-xs">{user.email ?? 'Signed in'}</strong><small className="text-[10px] text-quiet">Workspace member</small></span><button aria-label="Account settings" onClick={() => notify('Account settings are coming soon')} className="text-quiet max-[680px]:hidden"><MoreHorizontal size={18} /></button></div><div className="flex gap-4 px-2 py-2 max-[680px]:flex-col max-[680px]:items-center max-[680px]:gap-3 max-[680px]:px-0"><SmallIcon label="Help" onClick={() => notify('Help center is coming soon')}><CircleHelp size={17} /></SmallIcon><SmallIcon label={dark ? 'Light mode' : 'Dark mode'} onClick={toggleTheme}>{dark ? <Sun size={17} /> : <Moon size={17} />}</SmallIcon><SmallIcon label="Settings" onClick={() => notify('Settings are coming soon')}><Settings size={17} /></SmallIcon></div><button aria-label="Sign out" onClick={() => void handleSignOut()} className="mt-1 flex w-full items-center gap-2 rounded-md px-2 py-2 text-[11px] text-quiet hover:bg-black/[.04] dark:hover:bg-white/[.05] max-[680px]:justify-center"><LogOut size={16} /><span className="max-[680px]:hidden">Sign out</span></button><button type="button" onClick={() => void checkBackendConnection()} className="mt-1 flex w-full items-center gap-2 rounded-md px-2 py-2 text-[11px] text-quiet hover:bg-black/[.04] dark:hover:bg-white/[.05] max-[680px]:justify-center"><Activity size={16} /><span className="max-[680px]:hidden">Check backend connection</span></button></div>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 flex h-[68px] items-center justify-between border-b border-line bg-panel px-8 max-[900px]:px-6 max-[680px]:h-[58px] max-[680px]:px-3.5">
          <div className="flex items-center gap-3 text-[11px] text-quiet max-[680px]:gap-2"><button className="hidden rounded-md p-1.5 hover:bg-black/5 max-[680px]:grid" aria-label="Open navigation"><AlignLeft size={18} /></button><span className="max-[680px]:hidden">Workspaces</span><ChevronRight className="max-[680px]:hidden" size={14} /><span className="flex items-center gap-1.5"><ProjectGlyph color="violet" small />{activeWorkspace?.name ?? 'No workspace selected'}</span><ChevronRight size={14} /><strong className="text-ink">Activity</strong></div>
          <div className="flex items-center gap-4 max-[680px]:gap-2"><label className="flex h-[34px] w-[218px] items-center gap-2 rounded-lg border border-line px-2.5 text-quiet max-[680px]:w-8 max-[680px]:justify-center max-[680px]:border-0 max-[680px]:px-0"><Search size={16} /><input aria-label="Search activity" placeholder="Search anything..." value={query} onChange={(e) => setQuery(e.target.value)} className="min-w-0 flex-1 bg-transparent text-[11px] text-ink outline-none placeholder:text-quiet max-[680px]:hidden" /><kbd className="flex items-center gap-0.5 rounded border border-line px-1 text-[9px] max-[680px]:hidden"><Command size={11} />K</kbd></label><button aria-label="Notifications" onClick={() => notify('You’re all caught up')} className="relative text-quiet"><Bell size={18} /><i className="absolute right-0 top-0 h-1.5 w-1.5 rounded-full border border-panel bg-orange-400" /></button><Avatar initials="AM" color="bg-violet-800 text-white" /></div>
        </header>
        <div className="mx-auto max-w-[1120px] px-[42px] max-[900px]:px-[26px] max-[680px]:px-[17px] max-[420px]:px-3">
          <div className="flex min-h-[125px] items-center justify-between gap-5 pt-2 max-[680px]:min-h-[110px]"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-panel text-2xl text-brand shadow-soft max-[680px]:h-[34px] max-[680px]:w-[34px]">✳</div><div><div className="flex items-center gap-2.5"><h1 className="font-display text-[21px] font-bold tracking-tight max-[680px]:text-lg">{activeProject?.name ?? activeWorkspace?.name ?? 'Create your first workspace'}</h1><button className="flex items-center gap-1.5 rounded-full border border-line bg-panel px-2 py-1 text-[10px] text-quiet"><i className="h-1.5 w-1.5 rounded-full bg-emerald-400" />On track<ChevronDown size={13} /></button></div><p className="mt-1 text-[11px] text-quiet max-[680px]:max-w-[180px]">Everything your team is building, in one place.</p></div></div><div className="flex items-center gap-3 max-[680px]:gap-1"><div className="flex -space-x-2 max-[680px]:hidden">{[['MC', 'bg-orange-200 text-orange-900'], ['AP', 'bg-emerald-200 text-emerald-900'], ['NK', 'bg-indigo-200 text-indigo-900'], ['SG', 'bg-pink-200 text-pink-900']].map(([n, c]) => <Avatar key={n} initials={n} color={c} />)}<span className="grid h-7 w-7 place-items-center rounded-full border-2 border-panel bg-brand text-[9px] font-bold text-white">+4</span></div><button onClick={() => notify('Share link copied')} className="flex h-[34px] items-center gap-1.5 rounded-md border border-line bg-panel px-3 text-[11px] font-semibold text-quiet hover:bg-black/[.03] dark:hover:bg-white/[.05]"><Share2 size={15} />Share</button><button aria-label="More project options" onClick={() => notify('More project options')} className="grid h-[30px] w-[30px] place-items-center rounded-md border border-line text-quiet"><MoreHorizontal size={19} /></button></div></div>
          <nav className="flex h-[47px] items-stretch gap-6 overflow-x-auto border-b border-line max-[680px]:gap-4" aria-label="Project sections">{tabs.map(({ label, icon: Icon }) => <button key={label} onClick={() => setActiveTab(label)} className={`relative flex shrink-0 items-center gap-1.5 text-[11px] ${activeTab === label ? 'font-semibold text-brand after:absolute after:inset-x-0 after:bottom-[-1px] after:h-0.5 after:rounded after:bg-brand' : 'text-quiet hover:text-ink'}`}><Icon size={15} />{label}{label === 'Activity' && <em className="rounded bg-brand-soft px-1.5 py-0.5 text-[9px] not-italic text-brand dark:bg-violet-950">12</em>}</button>)}<button className="text-quiet" aria-label="Add tab" onClick={() => notify('Custom tabs are coming soon')}><CirclePlus size={17} /></button></nav>
          {['Board', 'List', 'Calendar'].includes(activeTab) && activeProject && (
            <TaskFilterBar
              search={taskSearch}
              status={taskStatusFilter}
              priority={taskPriorityFilter}
              dueDate={dueDateFilter}
              onSearchChange={setTaskSearch}
              onStatusChange={setTaskStatusFilter}
              onPriorityChange={setTaskPriorityFilter}
              onDueDateChange={setDueDateFilter}
              onClear={() => {
                setTaskSearch('')
                setTaskStatusFilter('ALL')
                setTaskPriorityFilter('ALL')
                setDueDateFilter('ALL')
              }}
            />
          )}
          {activeTab === 'Activity' ? <section className="max-w-[850px] pt-7"><div className="flex items-center justify-between"><div><h2 className="flex items-center gap-2 font-display text-[15px] font-bold"><Activity size={17} className="text-brand" />Activity</h2><p className="ml-[26px] mt-1.5 text-[11px] text-quiet">Catch up on what’s happening across your project.</p></div><button onClick={() => setFilter(!filter)} className={`flex h-[31px] items-center gap-1.5 rounded-md border border-line bg-panel px-2.5 text-[10px] text-quiet hover:bg-black/[.03] dark:hover:bg-white/[.05] ${filter ? 'text-brand' : ''}`}><Filter size={15} />Filter{filter && <span className="grid h-4 w-4 place-items-center rounded-full bg-brand text-[9px] text-white">1</span>}</button></div>
            {filter && <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] text-quiet"><span>Showing activity from</span>{['Everyone', 'All activity'].map((x) => <button key={x} onClick={() => setFilter(false)} className="flex items-center gap-1 rounded bg-brand-soft px-2 py-1.5 text-brand dark:bg-violet-950">{x}<X size={13} /></button>)}<button onClick={() => setFilter(false)}>Clear filters</button></div>}
            <div className="mb-4 mt-7 flex items-center gap-3 text-[10px] font-semibold text-quiet"><span>Today</span><div className="h-px flex-1 bg-line" /></div>
            {shown.length ? <div>{shown.map((event, index) => { const Icon = event.icon; return <article key={event.title} className="relative flex gap-3 pb-5"><div className={`z-[1] grid h-[25px] w-[25px] shrink-0 place-items-center rounded-lg border border-line bg-panel ${tone[event.tone as keyof typeof tone]}`}><Icon size={15} /></div>{index < shown.length - 1 && <div className="absolute bottom-[-1px] left-3 top-7 w-px bg-line" />}<div className="min-w-0 flex-1"><div className="mb-2 flex min-h-[25px] items-center gap-2"><Avatar initials={event.initials} color={event.avatar} small /><p className="m-0 flex items-center gap-2 text-[10px] max-[680px]:block"><strong className="font-semibold">{event.title}</strong><span className="text-[9px] text-quiet max-[680px]:block">{event.time}</span></p></div><div className="flex min-h-[60px] items-center justify-between rounded-lg border border-line bg-panel px-3 shadow-soft transition hover:-translate-y-px hover:border-violet-300"><div className="flex min-w-0 items-center gap-2.5"><ProjectGlyph color={event.tone} /><div className="flex min-w-0 flex-col gap-1"><strong className="truncate text-[11px] font-semibold">{event.detail}</strong><span className="text-[9px] text-quiet">{event.project} <i className="not-italic">·</i> Updated just now</span></div></div><button onClick={() => notify(`Opened: ${event.detail}`)} className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-quiet hover:bg-black/[.04] dark:hover:bg-white/[.05]" aria-label={`Open ${event.detail}`}><ChevronRight size={16} /></button></div></div></article> })}</div> : <div className="flex min-h-[190px] flex-col items-center justify-center gap-2 text-quiet"><Search size={21} /><strong className="text-xs text-ink">No matching activity</strong><span className="text-[10px]">Try a different search.</span></div>}
            <button onClick={() => notify('You’re viewing the latest activity')} className="ml-[38px] mt-1 flex items-center gap-1.5 text-[10px] text-quiet"><span>You’re all caught up</span><Check size={14} className="text-emerald-500" /></button>
          </section> : activeTab === 'Board' ? (
            <TaskBoard
              tasks={filteredTasks}
              isLoading={isLoadingTasks}
              hasProject={Boolean(activeProject)}
              onCreateTask={() => {
                setTaskTitle('')
                setTaskDescription('')
                setTaskStatus('TODO')
                setTaskPriority('MEDIUM')
                setTaskModalOpen(true)
              }}
              onUpdateStatus={handleUpdateTaskStatus}
              onEditTask={openTaskEditor}
            />
          ) : activeTab === 'List' ? (
            <TaskList
              tasks={filteredTasks}
              isLoading={isLoadingTasks}
              hasProject={Boolean(activeProject)}
              onEditTask={openTaskEditor}
            />
          ) : activeTab === 'Calendar' ? (
            <TaskCalendar
              tasks={filteredTasks}
              isLoading={isLoadingTasks}
              hasProject={Boolean(activeProject)}
              onEditTask={openTaskEditor}
            />
          ) : (<section className="flex h-[430px] flex-col items-center justify-center text-center"><div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-soft text-brand dark:bg-violet-950"><FolderKanban size={22} /></div><h2 className="mt-4 font-display text-[17px] font-bold">{activeTab} is ready for your team</h2><p className="mb-4 mt-1 text-[11px] text-quiet">Project {activeTab.toLowerCase()} will show up here as you build out DevFlow.</p><button onClick={() => setActiveTab('Activity')} className="rounded-md bg-brand px-3 py-2 text-[11px] font-semibold text-white">Back to activity</button></section>)}
          <footer className="mt-[72px] flex justify-between border-t border-line py-4 text-[9px] text-quiet"><span>Made for teams that build</span><span className="flex items-center gap-1.5"><i className="h-1.5 w-1.5 rounded-full bg-emerald-400" />All systems operational</span></footer>
        </div>
      </main>
    </div>
    {workspaceModalOpen && (
      <div className="fixed inset-0 z-30 grid place-items-center bg-black/40 p-4">
        <form
          onSubmit={(event) => void handleCreateWorkspace(event)}
          className="w-full max-w-md rounded-xl border border-line bg-panel p-5 shadow-xl"
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-display text-lg font-bold">Create a workspace</h2>
              <p className="mt-1 text-sm text-quiet">
                Give your team a shared place to organize work.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setWorkspaceModalOpen(false)}
              className="text-quiet hover:text-ink"
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          </div>

          <label
            htmlFor="workspace-name"
            className="mt-5 block text-sm font-medium"
          >
            Workspace name
          </label>
          <input
            id="workspace-name"
            autoFocus
            minLength={2}
            maxLength={80}
            required
            value={workspaceName}
            onChange={(event) => setWorkspaceName(event.target.value)}
            placeholder="For example, Design Team"
            className="mt-2 h-10 w-full rounded-md border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-brand"
          />

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setWorkspaceModalOpen(false)}
              className="rounded-md border border-line px-3 py-2 text-sm text-quiet"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreatingWorkspace || workspaceName.trim().length < 2}
              className="rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isCreatingWorkspace ? 'Creating…' : 'Create workspace'}
            </button>
          </div>
        </form>
      </div>
    )}
    {projectModalOpen && (
      <div className="fixed inset-0 z-30 grid place-items-center bg-black/40 p-4">
        <form
          onSubmit={(event) => void handleCreateProject(event)}
          className="w-full max-w-md rounded-xl border border-line bg-panel p-5 shadow-xl"
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-display text-lg font-bold">Create a project</h2>
              <p className="mt-1 text-sm text-quiet">
                Add work your team can organize and track.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setProjectModalOpen(false)}
              className="text-quiet hover:text-ink"
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          </div>

          <label htmlFor="project-name" className="mt-5 block text-sm font-medium">
            Project name
          </label>
          <input
            id="project-name"
            autoFocus
            minLength={2}
            maxLength={80}
            required
            value={projectName}
            onChange={(event) => setProjectName(event.target.value)}
            placeholder="For example, Marketing website"
            className="mt-2 h-10 w-full rounded-md border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-brand"
          />

          <label htmlFor="project-description" className="mt-4 block text-sm font-medium">
            Description <span className="text-quiet">(optional)</span>
          </label>
          <textarea
            id="project-description"
            maxLength={500}
            value={projectDescription}
            onChange={(event) => setProjectDescription(event.target.value)}
            placeholder="What is this project for?"
            className="mt-2 min-h-24 w-full resize-y rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-brand"
          />

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setProjectModalOpen(false)}
              className="rounded-md border border-line px-3 py-2 text-sm text-quiet"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreatingProject || projectName.trim().length < 2}
              className="rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isCreatingProject ? 'Creating…' : 'Create project'}
            </button>
          </div>
        </form>
      </div>
    )}
    {taskModalOpen && (
      <div className="fixed inset-0 z-30 grid place-items-center bg-black/40 p-4">
        <form
          onSubmit={(event) => void handleCreateTask(event)}
          className="w-full max-w-md rounded-xl border border-line bg-panel p-5 shadow-xl"
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-display text-lg font-bold">Create a task</h2>
              <p className="mt-1 text-sm text-quiet">Add work to {activeProject?.name ?? 'your project'}.</p>
            </div>
            <button type="button" onClick={() => setTaskModalOpen(false)} className="text-quiet hover:text-ink" aria-label="Close dialog">
              <X size={18} />
            </button>
          </div>

          <label htmlFor="task-title" className="mt-5 block text-sm font-medium">Task title</label>
          <input
            id="task-title"
            autoFocus
            minLength={2}
            maxLength={160}
            required
            value={taskTitle}
            onChange={(event) => setTaskTitle(event.target.value)}
            placeholder="For example, Design the task board"
            className="mt-2 h-10 w-full rounded-md border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-brand"
          />

          <label htmlFor="task-description" className="mt-4 block text-sm font-medium">Description <span className="text-quiet">(optional)</span></label>
          <textarea
            id="task-description"
            maxLength={2000}
            value={taskDescription}
            onChange={(event) => setTaskDescription(event.target.value)}
            placeholder="Add useful context for the team."
            className="mt-2 min-h-20 w-full resize-y rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-brand"
          />

          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="text-sm font-medium">Status
              <select value={taskStatus} onChange={(event) => setTaskStatus(event.target.value as TaskStatus)} className="mt-2 h-10 w-full rounded-md border border-line bg-canvas px-2 text-sm text-ink outline-none focus:border-brand">
                <option value="TODO">Todo</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="DONE">Done</option>
              </select>
            </label>
            <label className="text-sm font-medium">Priority
              <select value={taskPriority} onChange={(event) => setTaskPriority(event.target.value as TaskPriority)} className="mt-2 h-10 w-full rounded-md border border-line bg-canvas px-2 text-sm text-ink outline-none focus:border-brand">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </label>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={() => setTaskModalOpen(false)} className="rounded-md border border-line px-3 py-2 text-sm text-quiet">Cancel</button>
            <button type="submit" disabled={isCreatingTask || taskTitle.trim().length < 2} className="rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
              {isCreatingTask ? 'Creating…' : 'Create task'}
            </button>
          </div>
        </form>
      </div>
    )}
    {editingTask && (
      <div className="fixed inset-0 z-30 grid place-items-center bg-black/40 p-4">
        <form
          onSubmit={(event) => void handleEditTask(event)}
          className="w-full max-w-md rounded-xl border border-line bg-panel p-5 shadow-xl"
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-display text-lg font-bold">Edit task</h2>
              <p className="mt-1 text-sm text-quiet">
                Update the task details and progress.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setEditingTask(null)}
              className="text-quiet hover:text-ink"
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          </div>

          <label htmlFor="edit-task-title" className="mt-5 block text-sm font-medium">
            Task title
          </label>
          <input
            id="edit-task-title"
            autoFocus
            minLength={2}
            maxLength={160}
            required
            value={editTaskTitle}
            onChange={(event) => setEditTaskTitle(event.target.value)}
            className="mt-2 h-10 w-full rounded-md border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-brand"
          />

          <label htmlFor="edit-task-description" className="mt-4 block text-sm font-medium">
            Description
          </label>
          <textarea
            id="edit-task-description"
            maxLength={2000}
            value={editTaskDescription}
            onChange={(event) => setEditTaskDescription(event.target.value)}
            className="mt-2 min-h-20 w-full resize-y rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-brand"
          />

          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="text-sm font-medium">
              Status
              <select
                value={editTaskStatus}
                onChange={(event) =>
                  setEditTaskStatus(event.target.value as TaskStatus)
                }
                className="mt-2 h-10 w-full rounded-md border border-line bg-canvas px-2 text-sm text-ink outline-none focus:border-brand"
              >
                <option value="TODO">Todo</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="DONE">Done</option>
              </select>
            </label>

            <label className="text-sm font-medium">
              Priority
              <select
                value={editTaskPriority}
                onChange={(event) =>
                  setEditTaskPriority(event.target.value as TaskPriority)
                }
                className="mt-2 h-10 w-full rounded-md border border-line bg-canvas px-2 text-sm text-ink outline-none focus:border-brand"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </label>
          </div>

          <label htmlFor="edit-task-due-date" className="mt-4 block text-sm font-medium">
            Due date <span className="text-quiet">(optional)</span>
          </label>
          <input
            id="edit-task-due-date"
            type="datetime-local"
            value={editTaskDueDate}
            onChange={(event) => setEditTaskDueDate(event.target.value)}
            className="mt-2 h-10 w-full rounded-md border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-brand"
          />

          <div className="mt-5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => void handleDeleteTask()}
              disabled={isDeletingTask || isUpdatingTask}
              className="mr-auto rounded-md px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-rose-950"
            >
              {isDeletingTask ? 'Deleting…' : 'Delete task'}
            </button>

            <button
              type="button"
              onClick={() => setEditingTask(null)}
              disabled={isDeletingTask}
              className="rounded-md border border-line px-3 py-2 text-sm text-quiet disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                isUpdatingTask ||
                isDeletingTask ||
                editTaskTitle.trim().length < 2
              }
              className="rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUpdatingTask ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    )}
    {notice && <div role="status" className="fixed bottom-5 right-6 z-20 flex items-center gap-2 rounded-lg border border-line bg-panel px-3 py-2.5 text-[11px] shadow-xl"><Check size={16} className="text-emerald-500" />{notice}<button className="ml-1 text-quiet" onClick={() => setNotice('')} aria-label="Dismiss"><X size={15} /></button></div>}
    <button onClick={toggleTheme} className="fixed bottom-4 right-4 z-10 hidden h-10 w-10 place-items-center rounded-full border border-line bg-panel text-quiet shadow-soft max-[680px]:grid" aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>{dark ? <Sun size={17} /> : <Moon size={17} />}</button>
  </div>
}

function TaskBoard({
  tasks,
  isLoading,
  hasProject,
  onCreateTask,
  onUpdateStatus,
  onEditTask,
}: {
  tasks: Task[]
  isLoading: boolean
  hasProject: boolean
  onCreateTask: () => void
  onUpdateStatus: (taskId: string, status: TaskStatus) => void
  onEditTask: (task: Task) => void
}) {
  const columns: Array<{ status: TaskStatus; label: string; dot: string }> = [
    { status: 'TODO', label: 'Todo', dot: 'bg-slate-400' },
    { status: 'IN_PROGRESS', label: 'In progress', dot: 'bg-amber-400' },
    { status: 'DONE', label: 'Done', dot: 'bg-emerald-500' },
  ]
  const priorityStyles: Record<TaskPriority, string> = {
    LOW: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    MEDIUM: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    HIGH: 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  }
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<TaskStatus | null>(null)

  function handleDrop(status: TaskStatus) {
    const draggedTask = tasks.find((task) => task.id === draggedTaskId)

    if (draggedTask && draggedTask.status !== status) {
      onUpdateStatus(draggedTask.id, status)
    }

    setDraggedTaskId(null)
    setDropTarget(null)
  }

  if (!hasProject) {
    return (
      <section className="flex h-[380px] flex-col items-center justify-center text-center">
        <FolderKanban size={24} className="text-brand" />
        <h2 className="mt-3 font-display text-lg font-bold">Select a project</h2>
        <p className="mt-1 text-sm text-quiet">Create or select a project to start tracking tasks.</p>
      </section>
    )
  }

  return (
    <section className="pt-7">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="font-display text-[17px] font-bold">Task board</h2>
          <p className="mt-1 text-[11px] text-quiet">Organize work by its current status.</p>
        </div>
        <button onClick={onCreateTask} className="flex items-center gap-1.5 rounded-md bg-brand px-3 py-2 text-[11px] font-semibold text-white">
          <CirclePlus size={15} /> Add task
        </button>
      </div>

      {isLoading ? (
        <p className="py-12 text-center text-sm text-quiet">Loading tasks…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {columns.map(({ status, label, dot }) => {
            const columnTasks = tasks.filter((task) => task.status === status)

            return (
              <section
                key={status}
                onDragOver={(event) => {
                  event.preventDefault()
                  setDropTarget(status)
                }}
                onDragLeave={() => setDropTarget(null)}
                onDrop={(event) => {
                  event.preventDefault()
                  handleDrop(status)
                }}
                className={`min-h-[260px] rounded-xl border p-3 transition ${dropTarget === status
                  ? 'border-brand bg-brand-soft dark:bg-violet-950/40'
                  : 'border-line bg-black/[.015] dark:bg-white/[.02]'
                  }`}
              >
                <div className="mb-3 flex items-center justify-between px-1">
                  <h3 className="flex items-center gap-2 text-xs font-semibold"><i className={`h-2 w-2 rounded-full ${dot}`} />{label}</h3>
                  <span className="rounded bg-panel px-1.5 py-0.5 text-[10px] text-quiet">{columnTasks.length}</span>
                </div>
                <div className="space-y-2">
                  {columnTasks.map((task) => (
                    <article
                      key={task.id}
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.effectAllowed = 'move'
                        setDraggedTaskId(task.id)
                      }}
                      onDragEnd={() => {
                        setDraggedTaskId(null)
                        setDropTarget(null)
                      }}
                      className={`cursor-grab rounded-lg border border-line bg-panel p-3 shadow-soft transition active:cursor-grabbing ${draggedTaskId === task.id ? 'opacity-50' : ''
                        }`}
                    >
                      <button
                        type="button"
                        onClick={() => onEditTask(task)}
                        className="w-full text-left"
                      >
                        <h4 className="text-xs font-semibold">{task.title}</h4>

                        {task.description && (
                          <p className="mt-1.5 line-clamp-2 text-[11px] text-quiet">
                            {task.description}
                          </p>
                        )}

                        <span
                          className={`mt-3 inline-flex rounded px-1.5 py-0.5 text-[9px] font-semibold ${priorityStyles[task.priority]}`}
                        >
                          {task.priority.toLowerCase()} priority
                        </span>
                      </button>
                      <select
                        value={task.status}
                        onChange={(event) =>
                          onUpdateStatus(task.id, event.target.value as TaskStatus)
                        }
                        className="mt-3 h-7 w-full rounded border border-line bg-canvas px-1.5 text-[10px] text-ink outline-none focus:border-brand"
                        aria-label={`Change status for ${task.title}`}
                      >
                        <option value="TODO">Todo</option>
                        <option value="IN_PROGRESS">In progress</option>
                        <option value="DONE">Done</option>
                      </select>
                    </article>
                  ))}
                  {!columnTasks.length && <p className="rounded-lg border border-dashed border-line px-3 py-5 text-center text-[10px] text-quiet">No tasks</p>}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </section>
  )
}

function TaskList({
  tasks,
  isLoading,
  hasProject,
  onEditTask,
}: {
  tasks: Task[]
  isLoading: boolean
  hasProject: boolean
  onEditTask: (task: Task) => void
}) {
  const statusStyles: Record<TaskStatus, string> = {
    TODO: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    IN_PROGRESS:
      'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    DONE: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  }

  const priorityStyles: Record<TaskPriority, string> = {
    LOW: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    MEDIUM:
      'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    HIGH: 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  }

  if (!hasProject) {
    return (
      <section className="flex h-[380px] flex-col items-center justify-center text-center">
        <List size={24} className="text-brand" />
        <h2 className="mt-3 font-display text-lg font-bold">Select a project</h2>
        <p className="mt-1 text-sm text-quiet">
          Create or select a project to view its tasks.
        </p>
      </section>
    )
  }

  if (isLoading) {
    return (
      <section className="flex h-[380px] items-center justify-center">
        <p className="text-sm text-quiet">Loading tasks…</p>
      </section>
    )
  }

  return (
    <section className="pt-7">
      <div className="mb-5">
        <h2 className="font-display text-[17px] font-bold">Task list</h2>
        <p className="mt-1 text-[11px] text-quiet">
          View and edit every task in this project.
        </p>
      </div>

      {tasks.length ? (
        <div className="overflow-x-auto rounded-xl border border-line bg-panel">
          <table className="w-full min-w-[700px] border-collapse text-left">
            <thead className="border-b border-line bg-black/[.02] text-[10px] uppercase tracking-wide text-quiet dark:bg-white/[.03]">
              <tr>
                <th className="px-4 py-3 font-semibold">Task</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Priority</th>
                <th className="px-4 py-3 font-semibold">Due date</th>
                <th className="px-4 py-3 text-right font-semibold">Action</th>
              </tr>
            </thead>

            <tbody>
              {tasks.map((task) => (
                <tr
                  key={task.id}
                  className="border-b border-line last:border-0 hover:bg-black/[.02] dark:hover:bg-white/[.03]"
                >
                  <td className="max-w-[320px] px-4 py-3">
                    <strong className="block truncate text-xs">{task.title}</strong>

                    {task.description && (
                      <span className="mt-1 block truncate text-[10px] text-quiet">
                        {task.description}
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded px-2 py-1 text-[10px] font-semibold ${statusStyles[task.status]}`}
                    >
                      {task.status.replace('_', ' ').toLowerCase()}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded px-2 py-1 text-[10px] font-semibold ${priorityStyles[task.priority]}`}
                    >
                      {task.priority.toLowerCase()}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-[11px] text-quiet">
                    {task.dueDate
                      ? new Date(task.dueDate).toLocaleDateString()
                      : 'No due date'}
                  </td>

                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onEditTask(task)}
                      className="rounded-md border border-line px-2.5 py-1.5 text-[10px] font-semibold text-quiet hover:bg-black/[.04] dark:hover:bg-white/[.05]"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-line text-center">
          <List size={22} className="text-quiet" />
          <strong className="mt-3 text-sm">No tasks yet</strong>
          <p className="mt-1 text-[11px] text-quiet">
            Create a task from the Board tab to see it here.
          </p>
        </div>
      )}
    </section>
  )
}

function TaskCalendar({
  tasks,
  isLoading,
  hasProject,
  onEditTask,
}: {
  tasks: Task[]
  isLoading: boolean
  hasProject: boolean
  onEditTask: (task: Task) => void
}) {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })

  const year = visibleMonth.getFullYear()
  const month = visibleMonth.getMonth()
  const firstDayOfMonth = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const leadingEmptyDays = firstDayOfMonth.getDay()
  const totalCells = Math.ceil((leadingEmptyDays + daysInMonth) / 7) * 7

  const calendarDays = Array.from({ length: totalCells }, (_, index) => {
    const dayNumber = index - leadingEmptyDays + 1

    if (dayNumber < 1 || dayNumber > daysInMonth) {
      return null
    }

    return new Date(year, month, dayNumber)
  })

  const today = new Date()

  function isSameDay(firstDate: Date, secondDate: Date) {
    return (
      firstDate.getFullYear() === secondDate.getFullYear() &&
      firstDate.getMonth() === secondDate.getMonth() &&
      firstDate.getDate() === secondDate.getDate()
    )
  }

  function getTasksForDay(date: Date) {
    return tasks.filter((task) => {
      if (!task.dueDate) {
        return false
      }

      return isSameDay(new Date(task.dueDate), date)
    })
  }

  if (!hasProject) {
    return (
      <section className="flex h-[380px] flex-col items-center justify-center text-center">
        <CalendarDays size={24} className="text-brand" />
        <h2 className="mt-3 font-display text-lg font-bold">
          Select a project
        </h2>
        <p className="mt-1 text-sm text-quiet">
          Create or select a project to view its task calendar.
        </p>
      </section>
    )
  }

  if (isLoading) {
    return (
      <section className="flex h-[380px] items-center justify-center">
        <p className="text-sm text-quiet">Loading tasks…</p>
      </section>
    )
  }

  return (
    <section className="pt-7">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="font-display text-[17px] font-bold">Calendar</h2>
          <p className="mt-1 text-[11px] text-quiet">
            Tasks appear on their due date.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setVisibleMonth(new Date(year, month - 1, 1))}
            className="grid h-8 w-8 place-items-center rounded-md border border-line text-quiet hover:bg-black/[.04] dark:hover:bg-white/[.05]"
            aria-label="Previous month"
          >
            <ChevronRight size={16} className="rotate-180" />
          </button>

          <strong className="min-w-32 text-center text-xs">
            {visibleMonth.toLocaleString('default', {
              month: 'long',
              year: 'numeric',
            })}
          </strong>

          <button
            type="button"
            onClick={() => setVisibleMonth(new Date(year, month + 1, 1))}
            className="grid h-8 w-8 place-items-center rounded-md border border-line text-quiet hover:bg-black/[.04] dark:hover:bg-white/[.05]"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-panel">
        <div className="min-w-[720px]">
          <div className="grid grid-cols-7 border-b border-line bg-black/[.02] dark:bg-white/[.03]">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(
              (dayName) => (
                <div
                  key={dayName}
                  className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-quiet"
                >
                  {dayName}
                </div>
              ),
            )}
          </div>

          <div className="grid grid-cols-7">
            {calendarDays.map((date, index) => {
              if (!date) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="min-h-28 border-b border-r border-line bg-black/[.01] dark:bg-white/[.01]"
                  />
                )
              }

              const dayTasks = getTasksForDay(date)
              const isToday = isSameDay(date, today)

              return (
                <div
                  key={date.toISOString()}
                  className="min-h-28 border-b border-r border-line p-2 last:border-r-0"
                >
                  <span
                    className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-semibold ${
                      isToday ? 'bg-brand text-white' : 'text-quiet'
                    }`}
                  >
                    {date.getDate()}
                  </span>

                  <div className="mt-1.5 space-y-1">
                    {dayTasks.slice(0, 3).map((task) => (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => onEditTask(task)}
                        className="block w-full truncate rounded bg-brand-soft px-1.5 py-1 text-left text-[9px] font-medium text-brand hover:bg-violet-200 dark:bg-violet-950 dark:text-violet-300"
                        title={task.title}
                      >
                        {task.title}
                      </button>
                    ))}

                    {dayTasks.length > 3 && (
                      <span className="block px-1 text-[9px] text-quiet">
                        +{dayTasks.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <p className="mt-3 text-[10px] text-quiet">
        Tasks without a due date do not appear on the calendar.
      </p>
    </section>
  )
}

function TaskFilterBar({
  search,
  status,
  priority,
  dueDate,
  onSearchChange,
  onStatusChange,
  onPriorityChange,
  onDueDateChange,
  onClear,
}: {
  search: string
  status: TaskStatus | 'ALL'
  priority: TaskPriority | 'ALL'
  dueDate: DueDateFilter
  onSearchChange: (value: string) => void
  onStatusChange: (value: TaskStatus | 'ALL') => void
  onPriorityChange: (value: TaskPriority | 'ALL') => void
  onDueDateChange: (value: DueDateFilter) => void
  onClear: () => void
}) {
  const hasActiveFilters =
    Boolean(search) ||
    status !== 'ALL' ||
    priority !== 'ALL' ||
    dueDate !== 'ALL'

  return (
    <div className="mt-5 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-panel p-3">
      <label className="flex h-9 min-w-[180px] flex-1 items-center gap-2 rounded-md border border-line bg-canvas px-2.5 text-quiet">
        <Search size={15} />

        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search tasks..."
          className="min-w-0 flex-1 bg-transparent text-xs text-ink outline-none placeholder:text-quiet"
        />
      </label>

      <select
        value={status}
        onChange={(event) =>
          onStatusChange(event.target.value as TaskStatus | 'ALL')
        }
        className="h-9 rounded-md border border-line bg-canvas px-2 text-xs text-ink outline-none focus:border-brand"
        aria-label="Filter by status"
      >
        <option value="ALL">All statuses</option>
        <option value="TODO">Todo</option>
        <option value="IN_PROGRESS">In progress</option>
        <option value="DONE">Done</option>
      </select>

      <select
        value={priority}
        onChange={(event) =>
          onPriorityChange(event.target.value as TaskPriority | 'ALL')
        }
        className="h-9 rounded-md border border-line bg-canvas px-2 text-xs text-ink outline-none focus:border-brand"
        aria-label="Filter by priority"
      >
        <option value="ALL">All priorities</option>
        <option value="LOW">Low priority</option>
        <option value="MEDIUM">Medium priority</option>
        <option value="HIGH">High priority</option>
      </select>

      <select
        value={dueDate}
        onChange={(event) =>
          onDueDateChange(event.target.value as DueDateFilter)
        }
        className="h-9 rounded-md border border-line bg-canvas px-2 text-xs text-ink outline-none focus:border-brand"
        aria-label="Filter by due date"
      >
        <option value="ALL">Any due date</option>
        <option value="WITH_DUE_DATE">Has due date</option>
        <option value="WITHOUT_DUE_DATE">No due date</option>
      </select>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClear}
          className="flex h-9 items-center gap-1 rounded-md px-2 text-xs text-quiet hover:bg-black/[.04] dark:hover:bg-white/[.05]"
        >
          <X size={14} />
          Clear
        </button>
      )}
    </div>
  )
}

function SideSection({ title, onAdd, children }: { title: string; onAdd: () => void; children: ReactNode }) { return <section className="pt-4"><div className="mb-1 flex h-6 items-center justify-between px-2.5 text-[9px] font-bold tracking-[.08em] text-quiet max-[680px]:justify-center"><span className="max-[680px]:hidden">{title}</span><button className="max-[680px]:hidden" onClick={onAdd} aria-label={`Add ${title.toLowerCase()}`}><CirclePlus size={15} /></button></div>{children}</section> }
function SideLink({ icon: Icon, label, count, onClick }: { icon: typeof Home; label: string; count?: string; onClick: () => void }) { return <button onClick={onClick} className="flex h-[35px] w-full items-center gap-2.5 rounded-md px-2.5 text-left text-xs text-quiet hover:bg-black/[.04] dark:hover:bg-white/[.05] max-[680px]:justify-center max-[680px]:px-0"><Icon size={16} /><span className="flex-1 max-[680px]:hidden">{label}</span>{count && <small className="text-[10px] max-[680px]:hidden">{count}</small>}</button> }
function Avatar({ initials, color, small = false }: { initials: string; color: string; small?: boolean }) { return <span className={`${small ? 'h-[22px] w-[22px] text-[8px]' : 'h-[28px] w-[28px] text-[9px]'} grid shrink-0 place-items-center rounded-full border-2 border-panel font-bold ${color}`}>{initials}</span> }
function ProjectGlyph({ color, small = false }: { color: string; small?: boolean }) { const styles: Record<string, string> = { violet: 'bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-300', orange: 'bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-300', blue: 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300', green: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300', pink: 'bg-pink-100 text-pink-600 dark:bg-pink-950 dark:text-pink-300' }; return <span className={`${small ? 'h-2 w-2' : 'h-[22px] w-[22px] rounded-md'} grid shrink-0 place-items-center ${styles[color] ?? styles.violet}`}><i className="h-2 w-2 rotate-45 rounded-[2px] border-[1.5px] border-current" /></span> }
function SmallIcon({ children, label, onClick }: { children: ReactNode; label: string; onClick: () => void }) { return <button aria-label={label} title={label} onClick={onClick} className="text-quiet hover:text-ink">{children}</button> }
