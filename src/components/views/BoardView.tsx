import React, { useState } from 'react';
import { Task, Project, TaskStatus, Priority } from '../../types';
import {
  Plus,
  Clock,
  CheckCircle2,
  Circle,
  MoreHorizontal,
  ArrowRight,
  ArrowLeft,
  Pin,
  Play,
  ListTodo,
} from 'lucide-react';
import { formatFriendlyDate, isOverdue } from '../../utils/storage';
import { playTaskCompleteSound, playClickSound } from '../../utils/audio';

interface BoardViewProps {
  tasks: Task[];
  projects: Project[];
  onUpdateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  onSelectTask: (task: Task) => void;
  onToggleTaskComplete: (taskId: string) => void;
  onOpenQuickAdd: (defaultProjectId?: string, defaultStatus?: TaskStatus) => void;
  onStartPomodoro: (taskId: string) => void;
  activePomodoroTaskId: string | null;
}

export const BoardView: React.FC<BoardViewProps> = ({
  tasks,
  projects,
  onUpdateTaskStatus,
  onSelectTask,
  onToggleTaskComplete,
  onOpenQuickAdd,
  onStartPomodoro,
  activePomodoroTaskId,
}) => {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const projectMap = React.useMemo(() => {
    const map = new Map<string, Project>();
    projects.forEach((p) => map.set(p.id, p));
    return map;
  }, [projects]);

  const columns: { id: TaskStatus; label: string; description: string }[] = [
    { id: 'backlog', label: 'Backlog', description: 'Ideas & future scope' },
    { id: 'todo', label: 'Ready / To Do', description: 'Committed for active sprint' },
    { id: 'in_progress', label: 'In Progress', description: 'Actively being developed' },
    { id: 'review', label: 'In Review', description: 'Quality & design check' },
    { id: 'done', label: 'Done', description: 'Completed & shipped' },
  ];

  const priorityLabels: Record<Priority, { label: string; textClass: string }> = {
    urgent: { label: 'Urgent', textClass: 'text-rose-600 font-semibold' },
    high: { label: 'High', textClass: 'text-amber-600 font-medium' },
    medium: { label: 'Medium', textClass: 'text-neutral-600' },
    low: { label: 'Low', textClass: 'text-neutral-400' },
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      playClickSound();
      onUpdateTaskStatus(taskId, targetStatus);
    }
    setDraggedTaskId(null);
  };

  const moveTaskStep = (task: Task, direction: 'prev' | 'next', e: React.MouseEvent) => {
    e.stopPropagation();
    const statusOrder: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'review', 'done'];
    const currentIndex = statusOrder.indexOf(task.status);
    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

    if (newIndex >= 0 && newIndex < statusOrder.length) {
      playClickSound();
      onUpdateTaskStatus(task.id, statusOrder[newIndex]);
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-6 pt-1 snap-x select-none">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.id);

        return (
          <div
            key={col.id}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
            className="flex flex-col w-72 sm:w-80 shrink-0 rounded-xl bg-neutral-100/70 border border-neutral-200/80 p-3 min-h-[600px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 px-1">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-neutral-800 tracking-tight">
                    {col.label}
                  </h3>
                  <span className="font-mono tabular-nums text-[11px] text-neutral-500 bg-white border border-neutral-200 px-1.5 py-0.5 rounded">
                    {colTasks.length}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-0.5 truncate">{col.description}</p>
              </div>

              <button
                onClick={() => onOpenQuickAdd(undefined, col.id)}
                className="h-6 w-6 flex items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-200 hover:text-neutral-900 transition-colors"
                title={`Add task to ${col.label}`}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Column Cards */}
            <div className="flex-1 space-y-2.5 overflow-y-auto pr-0.5">
              {colTasks.map((task) => {
                const project = projectMap.get(task.projectId);
                const isDone = task.status === 'done';
                const overdue = isOverdue(task.dueDate, task.status);
                const isPomodoroActive = activePomodoroTaskId === task.id;
                const hasSubtasks = task.subtasks && task.subtasks.length > 0;
                const completedSubtasks = task.subtasks?.filter((st) => st.completed).length || 0;

                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onClick={() => onSelectTask(task)}
                    className={`group relative rounded-lg border border-neutral-200 bg-white p-3 shadow-2xs hover:border-neutral-300 hover:shadow-xs transition-all cursor-grab active:cursor-grabbing ${
                      isDone ? 'opacity-70 bg-neutral-50' : ''
                    }`}
                  >
                    {/* Header Row of Card */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isDone) {
                              playTaskCompleteSound();
                            } else {
                              playClickSound();
                            }
                            onToggleTaskComplete(task.id);
                          }}
                          className="mt-0.5 text-neutral-400 hover:text-emerald-600 shrink-0 transition-colors"
                        >
                          {isDone ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Circle className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <span
                          className={`text-xs font-semibold leading-tight line-clamp-2 ${
                            isDone ? 'line-through text-neutral-400' : 'text-neutral-900'
                          }`}
                        >
                          {task.title}
                        </span>
                      </div>

                      {task.isPinned && (
                        <Pin className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />
                      )}
                    </div>

                    {/* Card Description Snippet if available */}
                    {task.description && (
                      <p className="mt-1.5 text-[11px] text-neutral-500 line-clamp-2 leading-relaxed">
                        {task.description}
                      </p>
                    )}

                    {/* Clean Zero-Pill Card Metadata */}
                    <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] text-neutral-500 border-t border-neutral-100 pt-2">
                      {project && (
                        <span className="flex items-center gap-1 text-neutral-700 font-medium truncate max-w-[120px]">
                          <span
                            className="h-1.5 w-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: project.color }}
                          />
                          <span className="truncate">{project.name}</span>
                        </span>
                      )}

                      {project && <span aria-hidden="true">·</span>}

                      {/* Priority */}
                      <span className={priorityLabels[task.priority].textClass}>
                        {priorityLabels[task.priority].label}
                      </span>

                      {task.dueDate && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span
                            className={`font-mono tabular-nums ${
                              overdue ? 'text-rose-600 font-semibold' : 'text-neutral-600'
                            }`}
                          >
                            {formatFriendlyDate(task.dueDate)}
                          </span>
                        </>
                      )}

                      {hasSubtasks && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums text-neutral-500">
                            {completedSubtasks}/{task.subtasks.length}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Interactive move arrows on hover */}
                    <div className="mt-2 pt-2 border-t border-neutral-100 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={col.id === 'backlog'}
                          onClick={(e) => moveTaskStep(task, 'prev', e)}
                          className="h-6 px-1.5 flex items-center gap-1 text-[10px] text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                          title="Move left"
                        >
                          <ArrowLeft className="h-3 w-3" />
                          <span>Back</span>
                        </button>
                        <button
                          type="button"
                          disabled={col.id === 'done'}
                          onClick={(e) => moveTaskStep(task, 'next', e)}
                          className="h-6 px-1.5 flex items-center gap-1 text-[10px] text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                          title="Move right"
                        >
                          <span>Forward</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onStartPomodoro(task.id);
                        }}
                        className={`h-6 px-1.5 flex items-center gap-1 text-[10px] rounded transition-colors ${
                          isPomodoroActive
                            ? 'bg-amber-100 text-amber-900 font-semibold'
                            : 'hover:bg-neutral-100 text-neutral-600'
                        }`}
                        title="Focus Timer"
                      >
                        <Play className="h-2.5 w-2.5 fill-current text-amber-600" />
                        <span>Focus</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {colTasks.length === 0 && (
                <div className="flex flex-col items-center justify-center h-32 rounded-lg border border-dashed border-neutral-300/80 text-center p-3 text-[11px] text-neutral-400">
                  <span>Drop tasks here</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
