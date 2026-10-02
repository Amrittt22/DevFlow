import { Plus } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Task, TaskStatus } from '../../lib/types';
import { STATUS_META } from '../../lib/meta';
import { TaskCard } from './TaskCard';
import { cn } from '../../lib/utils';

export function Column({
  status,
  tasks,
  onQuickAdd,
  isDragOver,
  onOpenTask,
}: {
  status: TaskStatus;
  tasks: Task[];
  onQuickAdd: (status: TaskStatus) => void;
  isDragOver: boolean;
  onOpenTask: (task: Task) => void;
}) {
  const { setNodeRef } = useDroppable({ id: `col:${status}`, data: { status } });
  const meta = STATUS_META[status];

  return (
    <div className="flex w-[300px] shrink-0 flex-col">
      {/* Column header */}
      <div className="flex items-center gap-2 px-1 pb-2.5">
        <span className={cn('h-2 w-2 rounded-full', meta.dot)} />
        <h2 className="text-[13px] font-semibold text-ink">{meta.label}</h2>
        <span className="rounded-md bg-surface2 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-ink3">
          {tasks.length}
        </span>
        <button
          onClick={() => onQuickAdd(status)}
          title={`Add task to ${meta.label}`}
          className="ml-auto inline-flex h-6 w-6 items-center justify-center rounded-md text-ink3 transition-colors hover:bg-surface2 hover:text-ink cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Droppable area */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-[120px] flex-1 flex-col gap-2 rounded-2xl border p-1.5 transition-colors duration-150',
          isDragOver ? 'border-accent/50 bg-accent/5' : 'border-transparent',
        )}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onOpen={onOpenTask} />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div
            className={cn(
              'flex flex-1 items-center justify-center rounded-xl border border-dashed py-8 text-[11px] transition-colors',
              isDragOver ? 'border-accent/50 text-accent' : 'border-border text-ink3',
            )}
          >
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}
