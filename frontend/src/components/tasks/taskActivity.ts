import type { Label, WorkspaceMember } from '../../app/types'

export type TaskActivityType =
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'STATUS_CHANGED'
  | 'LABELS_CHANGED'
  | 'ASSIGNEES_CHANGED'
  | 'TASK_DELETED'

export type TaskActivity = {
  id: string
  taskId: string | null
  projectId: string
  actorId: string | null
  type: TaskActivityType
  details: unknown
  createdAt: string
  actor: {
    id: string
    displayName: string | null
  } | null
}

export type ActivityChange = {
  from: string | null
  to: string | null
}

export type ActivityPresentation = {
  actorName: string
  action: string
  changes: Array<{
    label: string
    change: ActivityChange
  }>
  addedLabels: string[]
  removedLabels: string[]
  addedAssignees: string[]
  removedAssignees: string[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function toNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : value == null ? null : String(value)
}

function readChange(value: unknown): ActivityChange | null {
  if (!isRecord(value)) return null

  return {
    from: toNullableString(value.from),
    to: toNullableString(value.to),
  }
}

function readChanges(details: unknown): Record<string, ActivityChange> {
  if (!isRecord(details) || !isRecord(details.changes)) return {}

  return Object.entries(details.changes).reduce<Record<string, ActivityChange>>(
    (changes, [field, value]) => {
      const change = readChange(value)
      if (change) changes[field] = change
      return changes
    },
    {},
  )
}

function readIds(details: unknown, key: string): string[] {
  if (!isRecord(details) || !Array.isArray(details[key])) return []
  return details[key].filter((value): value is string => typeof value === 'string')
}

function readableFieldName(field: string) {
  return field
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/^\w/, (letter) => letter.toUpperCase())
}

function resolveLabelNames(ids: string[], labels: Label[]) {
  const labelsById = new Map(labels.map((label) => [label.id, label.name]))
  return ids.map((id) => labelsById.get(id) ?? `Label ID ${id}`)
}

function resolveMemberNames(ids: string[], members: WorkspaceMember[]) {
  const membersById = new Map(
    members.map((member) => [member.id, member.displayName?.trim() || member.email]),
  )
  return ids.map((id) => membersById.get(id) ?? `User ID ${id}`)
}

export function formatActivityValue(value: string | null) {
  if (value === null || value === '') return 'none'
  if (value === 'IN_PROGRESS') return 'In progress'
  return value.replace(/_/g, ' ').toLowerCase()
}

export function formatTaskActivity(
  activity: TaskActivity,
  labels: Label[],
  members: WorkspaceMember[],
): ActivityPresentation {
  const actorName = activity.actor?.displayName?.trim() || 'Unknown user'
  const changes = readChanges(activity.details)
  const changeEntries = Object.entries(changes).map(([field, change]) => ({
    label: readableFieldName(field),
    change,
  }))

  switch (activity.type) {
    case 'TASK_CREATED':
      return {
        actorName,
        action: 'created this task.',
        changes: [],
        addedLabels: [],
        removedLabels: [],
        addedAssignees: [],
        removedAssignees: [],
      }
    case 'STATUS_CHANGED':
      return {
        actorName,
        action: 'changed the task status.',
        changes: changeEntries.filter(({ label }) => label === 'Status'),
        addedLabels: [],
        removedLabels: [],
        addedAssignees: [],
        removedAssignees: [],
      }
    case 'LABELS_CHANGED':
      return {
        actorName,
        action: 'updated the labels.',
        changes: [],
        addedLabels: resolveLabelNames(
          readIds(activity.details, 'addedLabelIds'),
          labels,
        ),
        removedLabels: resolveLabelNames(
          readIds(activity.details, 'removedLabelIds'),
          labels,
        ),
        addedAssignees: [],
        removedAssignees: [],
      }
    case 'ASSIGNEES_CHANGED':
      return {
        actorName,
        action: 'updated the assignees.',
        changes: [],
        addedLabels: [],
        removedLabels: [],
        addedAssignees: resolveMemberNames(
          readIds(activity.details, 'addedUserIds'),
          members,
        ),
        removedAssignees: resolveMemberNames(
          readIds(activity.details, 'removedUserIds'),
          members,
        ),
      }
    case 'TASK_DELETED':
      return {
        actorName,
        action: 'deleted this task.',
        changes: [],
        addedLabels: [],
        removedLabels: [],
        addedAssignees: [],
        removedAssignees: [],
      }
    case 'TASK_UPDATED':
      return {
        actorName,
        action: 'updated this task.',
        changes: changeEntries,
        addedLabels: [],
        removedLabels: [],
        addedAssignees: [],
        removedAssignees: [],
      }
  }
}

export function parseTaskActivities(value: unknown): TaskActivity[] {
  if (!Array.isArray(value)) return []

  return value.filter((activity): activity is TaskActivity => {
    if (!isRecord(activity)) return false
    if (
      typeof activity.id !== 'string' ||
      typeof activity.projectId !== 'string' ||
      typeof activity.createdAt !== 'string' ||
      typeof activity.type !== 'string'
    ) {
      return false
    }

    return [
      'TASK_CREATED',
      'TASK_UPDATED',
      'STATUS_CHANGED',
      'LABELS_CHANGED',
      'ASSIGNEES_CHANGED',
      'TASK_DELETED',
    ].includes(activity.type)
  })
}
