export type Project = {
  id: string
  name: string
  slug: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH'
export type DueDateFilter = 'ALL' | 'WITH_DUE_DATE' | 'WITHOUT_DUE_DATE'

export type Label = {
  id: string
  name: string
  color: string
}

export type Task = {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  dueDate: string | null
  projectId: string
  createdAt: string
  updatedAt: string
  labels: Label[]
}
