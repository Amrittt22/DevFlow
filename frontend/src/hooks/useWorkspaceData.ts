import { useEffect, useState } from 'react'
import {
  createWorkspaceInBackend,
  fetchWorkspacesFromBackend,
  type Workspace,
} from '../services/api.service'
import { apiRequest } from '../lib/api'
import type { Project } from '../app/types'

function projectStorageKey(workspaceId: string) {
  return `devflow-active-project:${workspaceId}`
}

export function useWorkspaceData(
  isLoadingAuth: boolean,
  userId: string | undefined,
  notify: (message: string) => void,
) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(
    () => localStorage.getItem('devflow-active-workspace') ?? '',
  )
  const [projects, setProjects] = useState<Project[]>([])
  const [loadedProjectsWorkspaceId, setLoadedProjectsWorkspaceId] =
    useState('')
  const [activeProjectId, setActiveProjectId] = useState(() => {
    const workspaceId = localStorage.getItem('devflow-active-workspace')
    return workspaceId ? localStorage.getItem(projectStorageKey(workspaceId)) ?? '' : ''
  })
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(true)
  const [isLoadingProjects, setIsLoadingProjects] = useState(false)
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false)
  const [isCreatingProject, setIsCreatingProject] = useState(false)

  useEffect(() => {
    if (isLoadingAuth || !userId) return
    let cancelled = false
    setIsLoadingWorkspaces(true)

    fetchWorkspacesFromBackend()
      .then((loaded) => {
        if (cancelled) return
        const saved = localStorage.getItem('devflow-active-workspace')
        const selected = loaded.some((workspace) => workspace.id === saved)
          ? saved!
          : loaded[0]?.id ?? ''
        setWorkspaces(loaded)
        setActiveWorkspaceId(selected)
        if (selected) localStorage.setItem('devflow-active-workspace', selected)
        else localStorage.removeItem('devflow-active-workspace')
      })
      .catch((error: unknown) => {
        if (!cancelled) notify(error instanceof Error ? error.message : 'Could not load workspaces')
      })
      .finally(() => {
        if (!cancelled) setIsLoadingWorkspaces(false)
      })

    return () => {
      cancelled = true
    }
  }, [isLoadingAuth, notify, userId])

  useEffect(() => {
    if (!activeWorkspaceId) {
      setProjects([])
      setActiveProjectId('')
      setLoadedProjectsWorkspaceId('')
      return
    }
    let cancelled = false
    setIsLoadingProjects(true)
    setProjects([])
    setLoadedProjectsWorkspaceId('')

    apiRequest<{ projects: Project[] }>(
      `/api/v1/workspaces/${activeWorkspaceId}/projects`,
    )
      .then(({ projects: loaded }) => {
        if (!cancelled) {
          setProjects(loaded)
          setLoadedProjectsWorkspaceId(activeWorkspaceId)
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setProjects([])
          setLoadedProjectsWorkspaceId('')
          notify(error instanceof Error ? error.message : 'Could not load projects')
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingProjects(false)
      })

    return () => {
      cancelled = true
    }
  }, [activeWorkspaceId, notify])

  useEffect(() => {
    if (
      !activeWorkspaceId ||
      loadedProjectsWorkspaceId !== activeWorkspaceId
    ) {
      return
    }

    const key = projectStorageKey(activeWorkspaceId)
    const saved = localStorage.getItem(key)
    const selected = projects.some((project) => project.id === saved)
      ? saved!
      : projects[0]?.id ?? ''
    setActiveProjectId(selected)
    if (selected) localStorage.setItem(key, selected)
    else localStorage.removeItem(key)
  }, [activeWorkspaceId, loadedProjectsWorkspaceId, projects])

  async function createWorkspace(name: string) {
    setIsCreatingWorkspace(true)
    try {
      const workspace = await createWorkspaceInBackend(name)
      setWorkspaces((current) => [...current, workspace])
      setActiveWorkspaceId(workspace.id)
      localStorage.setItem('devflow-active-workspace', workspace.id)
      notify(`Workspace "${workspace.name}" created`)
      return workspace
    } finally {
      setIsCreatingWorkspace(false)
    }
  }

  async function createProject(name: string, description: string) {
    if (!activeWorkspaceId) throw new Error('Create a workspace before creating a project')
    setIsCreatingProject(true)
    try {
      const { project } = await apiRequest<{ project: Project }>(
        `/api/v1/workspaces/${activeWorkspaceId}/projects`,
        { method: 'POST', body: JSON.stringify({ name, description: description || undefined }) },
      )
      setProjects((current) => [project, ...current])
      setActiveProjectId(project.id)
      localStorage.setItem(projectStorageKey(activeWorkspaceId), project.id)
      notify(`Project "${project.name}" created`)
      return project
    } finally {
      setIsCreatingProject(false)
    }
  }

  return {
    workspaces,
    projects,
    activeWorkspaceId,
    activeProjectId,
    activeWorkspace: workspaces.find((workspace) => workspace.id === activeWorkspaceId),
    activeProject: projects.find((project) => project.id === activeProjectId),
    isLoadingWorkspaces,
    isLoadingProjects,
    isCreatingWorkspace,
    isCreatingProject,
    setActiveWorkspaceId: (id: string) => {
      setActiveWorkspaceId(id)
      localStorage.setItem('devflow-active-workspace', id)
    },
    setActiveProjectId: (id: string) => {
      setActiveProjectId(id)
      if (activeWorkspaceId) localStorage.setItem(projectStorageKey(activeWorkspaceId), id)
    },
    createWorkspace,
    createProject,
  }
}
