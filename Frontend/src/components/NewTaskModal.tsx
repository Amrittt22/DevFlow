import { useState } from 'react';
import { Calendar, Flag } from 'lucide-react';
import type { TaskStatus } from '../lib/types';
import { STATUS_META } from '../lib/meta';
import { useAppStore } from '../store';
import { AssigneePicker, LabelPicker } from './Pickers';
import { Button, Field, Input, Modal, Select, Textarea } from './ui';
import { isoDate } from '../lib/utils';

export function NewTaskModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { createTask, projects, currentProjectId, sprints, users } = useAppStore();
  const project = projects.find((p) => p.id === currentProjectId);
  const projectSprints = sprints.filter((s) => s.projectId === currentProjectId && s.status !== 'completed');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'urgent' | 'high' | 'medium' | 'low'>('medium');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [assignees, setAssignees] = useState<string[]>([]);
  const [labelIds, setLabelIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [sprintId, setSprintId] = useState('');

  const reset = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setStatus('todo');
    setAssignees([]);
    setLabelIds([]);
    setDueDate('');
    setSprintId('');
  };

  const submit = () => {
    if (!title.trim()) return;
    createTask({
      title: title.trim(),
      description: description.trim(),
      priority,
      status,
      assigneeIds: assignees,
      labelIds,
      dueDate: dueDate || undefined,
      sprintId: sprintId || undefined,
      projectId: currentProjectId,
    });
    reset();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} width="max-w-xl">
      <div className="border-b border-border px-5 py-4">
        <p className="text-[11px] font-semibold tracking-widest text-ink3 uppercase">New task</p>
        <h2 className="mt-0.5 text-base font-semibold text-ink">
          {project?.name} <span className="font-mono text-sm text-ink3">· {project?.key}</span>
        </h2>
      </div>

      <div className="space-y-4 px-5 py-5">
        <Field label="Title">
          <Input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
        </Field>

        <Field label="Description">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add context, acceptance criteria, links…"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)} className="w-full">
              {Object.entries(STATUS_META).map(([id, m]) => (
                <option key={id} value={id}>
                  {m.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Priority">
            <Select value={priority} onChange={(e) => setPriority(e.target.value as typeof priority)} className="w-full">
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Assignees">
            <AssigneePicker
              selected={assignees}
              onChange={setAssignees}
              projectMemberIds={project?.memberIds}
              trigger={
                <button className="flex h-9 w-full items-center gap-2 rounded-lg border border-border bg-surface2 px-3 text-left text-sm text-ink2 transition-colors hover:border-borderstrong cursor-pointer">
                  {assignees.length === 0 ? (
                    <span className="text-ink3">Select people…</span>
                  ) : (
                    <span className="flex flex-wrap gap-1">
                      {assignees.slice(0, 3).map((id) => {
                        const u = users.find((x) => x.id === id);
                        return u ? (
                          <span key={id} className="rounded-md bg-surface3 px-1.5 py-0.5 text-[10px] font-medium text-ink2">
                            {u.name.split(' ')[0]}
                          </span>
                        ) : null;
                      })}
                      {assignees.length > 3 && <span className="text-[10px] text-ink3">+{assignees.length - 3}</span>}
                    </span>
                  )}
                </button>
              }
            />
          </Field>
          <Field label="Sprint">
            <Select value={sprintId} onChange={(e) => setSprintId(e.target.value)} className="w-full">
              <option value="">No sprint</option>
              {projectSprints.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Labels">
            <LabelPicker
              selected={labelIds}
              onChange={setLabelIds}
              trigger={
                <button className="flex h-9 w-full items-center gap-2 rounded-lg border border-border bg-surface2 px-3 text-left text-sm text-ink2 transition-colors hover:border-borderstrong cursor-pointer">
                  {labelIds.length === 0 ? <span className="text-ink3">Add labels…</span> : (
                    <span className="text-xs font-mono text-ink2">{labelIds.length} selected</span>
                  )}
                </button>
              }
            />
          </Field>
          <Field label="Due date">
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink3" />
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="pl-8" min={isoDate(0)} />
            </div>
          </Field>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border px-5 py-4">
        <span className="flex items-center gap-1.5 text-[11px] text-ink3">
          <Flag className="h-3 w-3" />
          Saved as {project?.key}-{Math.max(1, useAppStore.getState().tasks.filter((t) => t.projectId === currentProjectId).length + 1)} · reporter is you
        </span>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={!title.trim()}>
            Create task
          </Button>
        </div>
      </div>
    </Modal>
  );
}
