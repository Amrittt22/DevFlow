import { useCallback, useEffect, useState } from 'react'
import {
  ArrowRightLeft,
  CirclePlus,
  Pencil,
  RefreshCw,
  Tags,
  Trash2,
  Users,
} from 'lucide-react'
import type { Label, WorkspaceMember } from '../../app/types'
import { apiRequest } from '../../lib/api'
import {
  formatActivityValue,
  formatTaskActivity,
  parseTaskActivities,
  type ActivityPresentation,
  type TaskActivity,
  type TaskActivityType,
} from './taskActivity'

type TaskActivityTimelineProps = {
  taskId: string
  labels?: Label[]
  members?: WorkspaceMember[]
  refreshToken?: number
}

const activityIcons: Record<
  TaskActivityType,
  typeof CirclePlus
> = {
  TASK_CREATED: CirclePlus,
  TASK_UPDATED: Pencil,
  STATUS_CHANGED: ArrowRightLeft,
  LABELS_CHANGED: Tags,
  ASSIGNEES_CHANGED: Users,
  TASK_DELETED: Trash2,
}

function relativeTime(createdAt: string) {
  const timestamp = new Date(createdAt).getTime()
  if (Number.isNaN(timestamp)) return 'at an unknown time'

  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000))
  if (seconds < 60) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`
  return new Date(createdAt).toLocaleDateString()
}

function absoluteTime(createdAt: string) {
  const date = new Date(createdAt)
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : date.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
}

function initials(name: string) {
  return name
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?'
}

function ValueBadge({ value, status }: { value: string | null; status?: boolean }) {
  return (
    <span
      className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold ${
        status
          ? 'bg-brand-soft text-brand dark:bg-brand/20'
          : 'bg-black/[.05] text-ink dark:bg-white/[.08]'
      }`}
    >
      {formatActivityValue(value)}
    </span>
  )
}

function ChangedValues({
  changes,
}: {
  changes: ActivityPresentation['changes']
}) {
  return (
    <div className="mt-2 space-y-1.5 text-[11px] text-quiet">
      {changes.map(({ label, change }) => (
        <div key={label} className="flex flex-wrap items-center gap-1.5">
          <span className="font-medium text-ink">{label}:</span>
          <ValueBadge value={change.from} status={label === 'Status'} />
          <span aria-hidden="true">to</span>
          <ValueBadge value={change.to} status={label === 'Status'} />
        </div>
      ))}
    </div>
  )
}

function ChangedItems({
  added,
  removed,
  label,
}: {
  added: string[]
  removed: string[]
  label: string
}) {
  if (!added.length && !removed.length) return null

  return (
    <div className="mt-2 space-y-1 text-[11px]">
      <p className="text-quiet">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {added.map((item) => (
          <span
            key={`added-${item}`}
            className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-700 dark:text-emerald-300"
          >
            + {item}
          </span>
        ))}
        {removed.map((item) => (
          <span
            key={`removed-${item}`}
            className="rounded-full bg-rose-500/10 px-2 py-0.5 font-medium text-rose-700 dark:text-rose-300"
          >
            - {item}
          </span>
        ))}
      </div>
    </div>
  )
}

function ActivityItem({
  activity,
  labels,
  members,
  isLast,
}: {
  activity: TaskActivity
  labels: Label[]
  members: WorkspaceMember[]
  isLast: boolean
}) {
  const presentation = formatTaskActivity(activity, labels, members)
  const Icon = activityIcons[activity.type]

  return (
    <li className="relative flex gap-3 pb-5 last:pb-0">
      {!isLast && (
        <div className="absolute left-3 top-7 bottom-0 w-px bg-line" />
      )}
      <div className="relative z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-line bg-panel text-brand">
        <Icon size={13} aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <span
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand text-[9px] font-bold text-white"
            title={presentation.actorName}
            aria-label={`Actor: ${presentation.actorName}`}
          >
            {initials(presentation.actorName)}
          </span>
          <p className="min-w-0 flex-1 text-xs leading-5">
            <strong>{presentation.actorName}</strong>{' '}
            {presentation.action}
            <time
              className="ml-1 inline-block text-[10px] text-quiet"
              dateTime={activity.createdAt}
              title={absoluteTime(activity.createdAt)}
            >
              {relativeTime(activity.createdAt)}
            </time>
          </p>
        </div>
        <ChangedValues changes={presentation.changes} />
        <ChangedItems
          added={presentation.addedLabels}
          removed={presentation.removedLabels}
          label="Label changes"
        />
        <ChangedItems
          added={presentation.addedAssignees}
          removed={presentation.removedAssignees}
          label="Assignee changes"
        />
      </div>
    </li>
  )
}

function TimelineSkeleton() {
  return (
    <div className="space-y-5" aria-label="Loading activity" role="status">
      {[1, 2, 3].map((item) => (
        <div key={item} className="flex gap-3">
          <span className="h-6 w-6 shrink-0 animate-pulse rounded-full bg-black/[.08] dark:bg-white/[.08]" />
          <div className="flex-1 space-y-2">
            <span className="block h-3 w-3/4 animate-pulse rounded bg-black/[.08] dark:bg-white/[.08]" />
            <span className="block h-2.5 w-1/2 animate-pulse rounded bg-black/[.08] dark:bg-white/[.08]" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function TaskActivityTimeline({
  taskId,
  labels = [],
  members = [],
  refreshToken = 0,
}: TaskActivityTimelineProps) {
  const [activities, setActivities] = useState<TaskActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshCount, setRefreshCount] = useState(0)

  const loadActivities = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await apiRequest<{ activities: unknown }>(
        `/api/v1/tasks/${taskId}/activity`,
      )
      setActivities(
        parseTaskActivities(response.activities).sort(
          (first, second) =>
            new Date(second.createdAt).getTime() -
            new Date(first.createdAt).getTime(),
        ),
      )
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Could not load task activity.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [taskId])

  useEffect(() => {
    void loadActivities()
  }, [loadActivities, refreshCount, refreshToken])

  return (
    <section aria-labelledby="task-activity-heading">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 id="task-activity-heading" className="text-sm font-semibold">
            Activity
          </h3>
          <p className="mt-1 text-[11px] text-quiet">
            A history of changes made to this task.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setRefreshCount((count) => count + 1)}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-[11px] font-semibold text-quiet hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Refresh activity"
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <TimelineSkeleton />
      ) : error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm dark:border-rose-900/50 dark:bg-rose-950/30">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => setRefreshCount((count) => count + 1)}
            className="mt-3 rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white"
          >
            Retry
          </button>
        </div>
      ) : activities.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line px-4 py-8 text-center text-xs text-quiet">
          No activity yet. Changes to this task will appear here.
        </p>
      ) : (
        <ol className="space-y-0">
          {activities.map((activity, index) => (
            <ActivityItem
              key={activity.id}
              activity={activity}
              labels={labels}
              members={members}
              isLast={index === activities.length - 1}
            />
          ))}
        </ol>
      )}
    </section>
  )
}
