import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, MessageSquare, Paperclip } from 'lucide-react';
import type { Task } from '../../lib/types';
import { useAppStore } from '../../store';
import { dueIn } from '../../lib/utils';
import { AvatarGroup, LabelChips, PriorityChip } from '../Pickers';
import { cn } from '../../lib/utils';

export function TaskCard({ task, overlay = false, onOpen }: { task: Task; overlay?: boolean; onOpen?: (task: Task) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { task } });

  const comments = useAppStore((s) => s.comments.filter((c) => c.parentId === task.id).length);
  const attachments = useAppStore((s) => s.attachments.filter((a) => a.parentId === task.id).length);
  const due = dueIn(task.dueDate);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      onClick={() => onOpen?.(task)}
      className={cn(
        'group relative cursor-grab rounded-xl border bg-surface p-3 shadow-card transition-all duration-150 active:cursor-grabbing',
        overlay ? 'rotate-[2deg] scale-[1.03] border-accent shadow-pop' : 'border-border hover:border-borderstrong hover:shadow-pop',
        isDragging && 'opacity-25',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-[10px] font-medium text-ink3">{task.key}</span>
        <PriorityChip priority={task.priority} />
      </div>

      <p className="mt-1.5 text-[13px] leading-snug font-medium text-ink">{task.title}</p>

      {task.labelIds.length > 0 && (
        <div className="mt-2">
          <LabelChips ids={task.labelIds} />
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AvatarGroup ids={task.assigneeIds} />
          {task.points !== undefined && (
            <span className="rounded-md bg-surface2 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-ink2">
              {task.points}pt
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-ink3">
          {comments > 0 && (
            <span className="flex items-center gap-1 text-[10px]">
              <MessageSquare className="h-3 w-3" />
              {comments}
            </span>
          )}
          {attachments > 0 && (
            <span className="flex items-center gap-1 text-[10px]">
              <Paperclip className="h-3 w-3" />
              {attachments}
            </span>
          )}
          {task.dueDate && (
            <span
              className={cn(
                'flex items-center gap-1 text-[10px] font-medium',
                due.tone === 'overdue' && 'text-danger',
                due.tone === 'today' && 'text-warning',
                due.tone === 'soon' && 'text-info',
                due.tone === 'later' && 'text-ink3',
              )}
            >
              <Calendar className="h-3 w-3" />
              {due.label.replace('Due ', '')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
