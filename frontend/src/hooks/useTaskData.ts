import { useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../lib/api'
import type { DueDateFilter, Task, TaskPriority, TaskStatus } from '../app/types'

export function useTaskData(
  projectId: string | undefined,
  notify: (message: string) => void,
) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoadingTasks, setIsLoadingTasks] = useState(false)
  const [isCreatingTask, setIsCreatingTask] = useState(false)
  const [isUpdatingTask, setIsUpdatingTask] = useState(false)
  const [isDeletingTask, setIsDeletingTask] = useState(false)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<TaskStatus | 'ALL'>('ALL')
  const [priority, setPriority] = useState<TaskPriority | 'ALL'>('ALL')
  const [dueDate, setDueDate] = useState<DueDateFilter>('ALL')

  useEffect(() => {
    if (!projectId) {
      setTasks([])
      return
    }
    let cancelled = false
    setIsLoadingTasks(true)
    apiRequest<{ tasks: Task[] }>(`/api/v1/projects/${projectId}/tasks`)
      .then(({ tasks: loaded }) => {
        if (!cancelled) setTasks(loaded)
      })
      .catch((error: unknown) => {
        if (!cancelled) notify(error instanceof Error ? error.message : 'Could not load tasks')
      })
      .finally(() => {
        if (!cancelled) setIsLoadingTasks(false)
      })
    return () => {
      cancelled = true
    }
  }, [notify, projectId])

  const filteredTasks = useMemo(() => tasks.filter((task) => {
    const text = `${task.title} ${task.description ?? ''}`.toLowerCase()
    return (
      text.includes(search.trim().toLowerCase()) &&
      (status === 'ALL' || task.status === status) &&
      (priority === 'ALL' || task.priority === priority) &&
      (dueDate === 'ALL' ||
        (dueDate === 'WITH_DUE_DATE' && Boolean(task.dueDate)) ||
        (dueDate === 'WITHOUT_DUE_DATE' && !task.dueDate))
    )
  }), [dueDate, priority, search, status, tasks])

  async function createTask(input: {
    title: string
    description: string
    status: TaskStatus
    priority: TaskPriority
    labelIds: string[]
    assigneeIds: string[]
  }) {
    if (!projectId) throw new Error('Select a project before creating a task')
    setIsCreatingTask(true)
    const { labelIds, assigneeIds, ...taskInput } = input
    try {
      const { task } = await apiRequest<{ task: Task }>(`/api/v1/projects/${projectId}/tasks`, {
        method: 'POST',
        body: JSON.stringify({
          ...taskInput,
          description: taskInput.description || undefined,
        }),
      })
      let taskWithLabels = task
      if (labelIds.length > 0) {
        const response = await apiRequest<{ task: Task }>(
          `/api/v1/tasks/${task.id}/labels`,
          {
            method: 'PUT',
            body: JSON.stringify({ labelIds }),
          },
        )
        taskWithLabels = response.task
      }
      if (assigneeIds.length > 0) {
        const response = await apiRequest<{ task: Task }>(
          `/api/v1/tasks/${task.id}/assignees`,
          {
            method: 'PUT',
            body: JSON.stringify({ userIds: assigneeIds }),
          },
        )

        taskWithLabels = response.task
      }
      setTasks((current) => [taskWithLabels, ...current])
      notify(`Task "${taskWithLabels.title}" created`)
    } finally {
      setIsCreatingTask(false)
    }
  }

  async function updateTask(taskId: string, input: Partial<Task>) {
    setIsUpdatingTask(true)
    try {
      const { task } = await apiRequest<{ task: Task }>(`/api/v1/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      })
      setTasks((current) => current.map((item) => item.id === task.id ? task : item))
      return task
    } finally {
      setIsUpdatingTask(false)
    }

  }

  async function setTaskLabels(taskId: string, labelIds: string[]) {
    const { task } = await apiRequest<{ task: Task }>(
      `/api/v1/tasks/${taskId}/labels`,
      {
        method: 'PUT',
        body: JSON.stringify({ labelIds }),
      },
    )
    setTasks((current) => current.map((item) => item.id === task.id ? task : item))
    return task
  }
async function setTaskAssignees(
  taskId: string,
  userIds: string[],
) {
  const { task } = await apiRequest<{ task: Task }>(
    `/api/v1/tasks/${taskId}/assignees`,
    {
      method: 'PUT',
      body: JSON.stringify({ userIds }),
    },
  )

  setTasks((current) =>
    current.map((item) => (item.id === task.id ? task : item)),
  )

  return task
}
  async function deleteTask(task: Task) {
    setIsDeletingTask(true)
    try {
      await apiRequest<{ success: boolean }>(`/api/v1/tasks/${task.id}`, { method: 'DELETE' })
      setTasks((current) => current.filter((item) => item.id !== task.id))
      notify(`Task "${task.title}" deleted`)
    } finally {
      setIsDeletingTask(false)
    }
  }

  return {
    tasks: filteredTasks,
    isLoadingTasks,
    isCreatingTask,
    isUpdatingTask,
    isDeletingTask,
    search,
    status,
    priority,
    dueDate,
    setSearch,
    setStatus,
    setPriority,
    setDueDate,
    clearFilters: () => {
      setSearch('')
      setStatus('ALL')
      setPriority('ALL')
      setDueDate('ALL')
    },
    createTask,
    updateTask,
    setTaskLabels,
    setTaskAssignees,
    deleteTask,
  }
}
