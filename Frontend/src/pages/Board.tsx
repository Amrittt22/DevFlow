import { DndContext, DragOverlay, PointerSensor, closestCorners, useSensor, useSensors, type DragEndEvent, type DragOverEvent, type DragStartEvent } from '@dnd-kit/core';
import { AnimatePresence, motion } from 'framer-motion';
import { Filter, Plus, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PRIORITY_META } from '../lib/meta';
import type { Priority, Task, TaskStatus } from '../lib/types';
import { TASK_STATUSES } from '../lib/types';
import { useAppStore, useCurrentProject, useProjectTasks } from '../store';
import { cn } from '../lib/utils';
import { Column } from '../components/kanban/Column';
import { TaskCard } from '../components/kanban/TaskCard';
import { TaskDetail } from '../components/kanban/TaskDetail';
import { AvatarGroup, LabelPicker } from '../components/Pickers';
import { Eyebrow, Popover } from '../components/ui';

export function Board() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const project = useCurrentProject();
  const allTasks = useProjectTasks();
  const { moveTaskTo, createTask, users } = useAppStore();

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [overColumn, setOverColumn] = useState<TaskStatus | null>(null);
  const [quickAddStatus, setQuickAddStatus] = useState<TaskStatus | null>(null);
  const [quickAddValue, setQuickAddValue] = useState('');

  // Filters
  const [query, setQuery] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<Priority | null>(null);
  const [labelFilter, setLabelFilter] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const findTask = (id: string) => allTasks.find((t) => t.id === id);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allTasks.filter((t) => {
      if (q && !(`${t.key} ${t.title}`.toLowerCase().includes(q))) return false;
      if (assigneeFilter && !t.assigneeIds.includes(assigneeFilter)) return false;
      if (priorityFilter && t.priority !== priorityFilter) return false;
      if (labelFilter && !t.labelIds.includes(labelFilter)) return false;
      return true;
    });
  }, [allTasks, query, assigneeFilter, priorityFilter, labelFilter]);

  const tasksByStatus = useMemo(() => {
    const map = new Map<TaskStatus, Task[]>();
    for (const s of TASK_STATUSES) map.set(s.id, []);
    for (const t of filtered) map.get(t.status)?.push(t);
    for (const list of map.values()) list.sort((a, b) => a.order - b.order);
    return map;
  }, [filtered]);

  // ─── Drag & drop ────────────────────────────────────────────────

  const onDragStart = (e: DragStartEvent) => {
    setActiveTask(findTask(String(e.active.id)) ?? null);
  };

  const onDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    if (!over) return;
    const task = findTask(String(active.id));
    if (!task) return;
    const overId = String(over.id);
    const overTask = findTask(overId);
    const targetStatus: TaskStatus | null = overTask
      ? overTask.status
      : overId.startsWith('col:')
        ? (overId.slice(4) as TaskStatus)
        : null;
    if (!targetStatus) return;
    setOverColumn(targetStatus);
    moveTaskTo(
      task.id,
      targetStatus,
      overTask && overTask.status === targetStatus ? overTask.id : undefined,
      { silent: true },
    );
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveTask(null);
    setOverColumn(null);
    if (!over) return;
    const task = findTask(String(active.id));
    if (!task) return;
    const overId = String(over.id);
    const overTask = findTask(overId);
    const targetStatus: TaskStatus = overTask
      ? overTask.status
      : overId.startsWith('col:')
        ? (overId.slice(4) as TaskStatus)
        : task.status;
    moveTaskTo(task.id, targetStatus, overTask ? overTask.id : undefined);
  };

  // ─── Task detail (deep-linkable) ────────────────────────────────

  const openTaskKey = (key: string) => setSearchParams({ task: key }, { replace: false });
  const openTask = (task: Task) => openTaskKey(task.key);
  const detailTask = searchParams.get('task') ? allTasks.find((t) => t.key === searchParams.get('task')) : undefined;
  const closeDetail = () => setSearchParams({}, { replace: false });

  // ─── Quick add ──────────────────────────────────────────────────

  const submitQuickAdd = (status: TaskStatus) => {
    const title = quickAddValue.trim();
    if (!title) return;
    createTask({ title, status, projectId: project?.id });
    setQuickAddValue('');
  };

  const clearFilters = () => {
    setQuery('');
    setAssigneeFilter(null);
    setPriorityFilter(null);
    setLabelFilter(null);
  };

  const hasFilters = query || assigneeFilter || priorityFilter || labelFilter;

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-6">
      {/* Page header */}
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <Eyebrow className="text-accent">Project board</Eyebrow>
          <h1 className="mt-0.5 text-xl font-bold tracking-tight text-ink">
            {project?.name}
            <span className="ml-2 font-mono text-sm font-medium text-ink3">{project?.key}</span>
          </h1>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink3" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by title or key…"
              className="h-9 w-52 rounded-lg border border-border bg-surface pl-8 pr-3 text-sm text-ink placeholder:text-ink3 focus:border-accent focus:outline-none"
            />
          </div>

          <Popover
            trigger={
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className={cn(
                  'flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors cursor-pointer',
                  hasFilters ? 'border-accent/40 bg-accent/10 text-accent' : 'border-border text-ink2 hover:bg-surface2',
                )}
              >
                <Filter className="h-3.5 w-3.5" />
                Filters
                {hasFilters && <X className="h-3 w-3" />}
              </button>
            }
            width="w-72"
          >
            {() => (
              <div className="space-y-3 p-3">
                <div>
                  <p className="mb-1.5 text-[10px] font-semibold tracking-widest text-ink3 uppercase">Assignee</p>
                  <div className="flex flex-wrap gap-1">
                    <button
                      onClick={() => setAssigneeFilter(null)}
                      className={cn(
                        'rounded-md border px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer',
                        !assigneeFilter ? 'border-accent/50 bg-accent/15 text-accent' : 'border-border text-ink2 hover:bg-surface2',
                      )}
                    >
                      Anyone
                    </button>
                    {users.slice(0, 8).map((u) => (
                      <button
                        key={u.id}
                        onClick={() => setAssigneeFilter(assigneeFilter === u.id ? null : u.id)}
                        className={cn(
                          'rounded-md border px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer',
                          assigneeFilter === u.id ? 'border-accent/50 bg-accent/15 text-accent' : 'border-border text-ink2 hover:bg-surface2',
                        )}
                      >
                        {u.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-1.5 text-[10px] font-semibold tracking-widest text-ink3 uppercase">Priority</p>
                  <div className="flex flex-wrap gap-1">
                    {(['urgent', 'high', 'medium', 'low'] as Priority[]).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPriorityFilter(priorityFilter === p ? null : p)}
                        className={cn(
                          'flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer',
                          priorityFilter === p ? 'border-accent/50 bg-accent/15 text-accent' : 'border-border text-ink2 hover:bg-surface2',
                        )}
                      >
                        <span className={cn('h-1.5 w-1.5 rounded-full', PRIORITY_META[p].dot)} />
                        {PRIORITY_META[p].label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-1.5 text-[10px] font-semibold tracking-widest text-ink3 uppercase">Label</p>
                  <LabelPicker
                    selected={labelFilter ? [labelFilter] : []}
                    onChange={(ids) => setLabelFilter(ids[0] ?? null)}
                    trigger={
                      <button className="w-full rounded-lg border border-border bg-surface2 px-2.5 py-1.5 text-left text-[11px] text-ink2 hover:border-borderstrong cursor-pointer">
                        {labelFilter ? useAppStore.getState().labels.find((l) => l.id === labelFilter)?.name : 'Choose label…'}
                      </button>
                    }
                  />
                </div>

                {hasFilters && (
                  <button onClick={clearFilters} className="w-full rounded-lg py-1.5 text-[11px] font-medium text-danger hover:bg-danger/10 cursor-pointer">
                    Clear all filters
                  </button>
                )}
              </div>
            )}
          </Popover>
        </div>
      </div>

      {/* Assignee filter indicator */}
      {assigneeFilter && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-ink3">Assigned to:</span>
          <AvatarGroup ids={[assigneeFilter]} />
          <button onClick={() => setAssigneeFilter(null)} className="text-[10px] font-medium text-danger hover:underline cursor-pointer">
            clear
          </button>
        </div>
      )}

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={() => { setActiveTask(null); setOverColumn(null); }}
      >
        <div className="mt-6 flex gap-4 overflow-x-auto pb-4">
          {TASK_STATUSES.map((s) => (
            <Column
              key={s.id}
              status={s.id}
              tasks={tasksByStatus.get(s.id) ?? []}
              onQuickAdd={(status) => { setQuickAddStatus(status); setQuickAddValue(''); }}
              isDragOver={overColumn === s.id && activeTask?.status !== s.id}
              onOpenTask={openTask}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={{ duration: 180, easing: 'ease' }}>
          {activeTask ? (
            <div className="w-[286px]">
              <TaskCard task={activeTask} overlay />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Quick-add inline form */}
      <AnimatePresence>
        {quickAddStatus && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="fixed bottom-6 left-1/2 z-40 w-[420px] -translate-x-1/2 rounded-2xl border border-border bg-surface p-3 shadow-pop"
          >
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={quickAddValue}
                onChange={(e) => setQuickAddValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitQuickAdd(quickAddStatus);
                  if (e.key === 'Escape') setQuickAddStatus(null);
                }}
                placeholder={`Add a task to ${TASK_STATUSES.find((s) => s.id === quickAddStatus)?.label}…`}
                className="h-9 flex-1 rounded-lg border border-border bg-surface2 px-3 text-sm focus:border-accent focus:outline-none"
              />
              <button
                onClick={() => submitQuickAdd(quickAddStatus)}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-white transition-colors hover:bg-accentstrong cursor-pointer"
                title="Add task"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                onClick={() => setQuickAddStatus(null)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-ink3 hover:bg-surface2 cursor-pointer"
                title="Cancel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 flex items-center gap-1 px-1 text-[10px] text-ink3">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Enter to add · Esc to close · rapid-fire multiple cards
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task detail slide-over */}
      {detailTask && <TaskDetail task={detailTask} onClose={closeDetail} />}

      {/* Keyboard hint */}
      <p className="mt-2 hidden items-center gap-2 text-[10px] text-ink3 md:flex">
        <kbd className="rounded border border-border bg-surface px-1 font-mono">drag</kbd>
        cards between columns to update status ·
        <kbd className="rounded border border-border bg-surface px-1 font-mono">click</kbd>
        a card for details, comments & attachments ·
        <button onClick={() => navigate('/app/sprints')} className="font-medium text-accent hover:underline cursor-pointer">
          view sprint →
        </button>
      </p>
    </div>
  );
}
