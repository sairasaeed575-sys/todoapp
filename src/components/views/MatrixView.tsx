import React from 'react';
import { Task, Project, Priority } from '../../types';
import {
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  Play,
  Flame,
  Calendar,
  Users,
  Archive,
} from 'lucide-react';
import { formatFriendlyDate, isOverdue } from '../../utils/storage';
import { playTaskCompleteSound, playClickSound } from '../../utils/audio';

interface MatrixViewProps {
  tasks: Task[];
  projects: Project[];
  onSelectTask: (task: Task) => void;
  onToggleTaskComplete: (taskId: string) => void;
  onUpdateTask: (task: Task) => void;
  onOpenQuickAdd: (defaultPriority?: Priority, defaultDueDate?: string) => void;
  onStartPomodoro: (taskId: string) => void;
}

export const MatrixView: React.FC<MatrixViewProps> = ({
  tasks,
  projects,
  onSelectTask,
  onToggleTaskComplete,
  onUpdateTask,
  onOpenQuickAdd,
  onStartPomodoro,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const projectMap = React.useMemo(() => {
    const map = new Map<string, Project>();
    projects.forEach((p) => map.set(p.id, p));
    return map;
  }, [projects]);

  // Eisenhower Classification
  // Q1: Do First (Urgent & Important)
  // Q2: Schedule (Not Urgent but Important)
  // Q3: Delegate (Urgent but Not Important)
  // Q4: Eliminate / Defer (Neither Urgent nor Important)
  const isImportant = (t: Task) => t.priority === 'urgent' || t.priority === 'high';
  const isUrgent = (t: Task) =>
    t.priority === 'urgent' || t.dueDate === todayStr || isOverdue(t.dueDate, t.status);

  const quadrants = [
    {
      id: 'q1',
      title: 'Do First',
      subtitle: 'Urgent & Important',
      action: 'Handle immediately before others',
      icon: Flame,
      headerClass: 'border-l-4 border-l-rose-500 bg-rose-50/30',
      badgeClass: 'text-rose-700 font-semibold',
      filter: (t: Task) => t.status !== 'done' && isImportant(t) && isUrgent(t),
      defaultPriority: 'urgent' as Priority,
      defaultDueDate: todayStr,
    },
    {
      id: 'q2',
      title: 'Schedule',
      subtitle: 'Important, Not Urgent',
      action: 'Dedicated time for deep work & strategic leverage',
      icon: Calendar,
      headerClass: 'border-l-4 border-l-blue-500 bg-blue-50/30',
      badgeClass: 'text-blue-700 font-semibold',
      filter: (t: Task) => t.status !== 'done' && isImportant(t) && !isUrgent(t),
      defaultPriority: 'high' as Priority,
      defaultDueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    },
    {
      id: 'q3',
      title: 'Delegate / Quick',
      subtitle: 'Urgent, Less Critical',
      action: 'Batch, automate, or execute in 5-minute sprints',
      icon: Users,
      headerClass: 'border-l-4 border-l-amber-500 bg-amber-50/30',
      badgeClass: 'text-amber-700 font-semibold',
      filter: (t: Task) => t.status !== 'done' && !isImportant(t) && isUrgent(t),
      defaultPriority: 'medium' as Priority,
      defaultDueDate: todayStr,
    },
    {
      id: 'q4',
      title: 'Backlog / Prune',
      subtitle: 'Neither Urgent nor Critical',
      action: 'Re-evaluate, defer, or eliminate',
      icon: Archive,
      headerClass: 'border-l-4 border-l-neutral-400 bg-neutral-50/50',
      badgeClass: 'text-neutral-600 font-semibold',
      filter: (t: Task) => t.status !== 'done' && !isImportant(t) && !isUrgent(t),
      defaultPriority: 'low' as Priority,
      defaultDueDate: '',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Intro info bar */}
      <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
        <div>
          <h2 className="text-sm font-bold text-neutral-900">
            Eisenhower Decision Matrix
          </h2>
          <p className="text-xs text-neutral-500">
            Prioritize by urgency and impact to avoid urgency traps.
          </p>
        </div>
      </div>

      {/* 2x2 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {quadrants.map((quad) => {
          const quadTasks = tasks.filter(quad.filter);
          const Icon = quad.icon;

          return (
            <div
              key={quad.id}
              className={`rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs flex flex-col min-h-[320px] ${quad.headerClass}`}
            >
              {/* Quadrant Header */}
              <div className="flex items-start justify-between pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-white border border-neutral-200 flex items-center justify-center shadow-2xs">
                    <Icon className="h-4 w-4 text-neutral-700" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-neutral-900 tracking-tight">
                        {quad.title}
                      </h3>
                      <span className={`text-[11px] ${quad.badgeClass}`}>
                        · {quad.subtitle}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-0.5">{quad.action}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="font-mono tabular-nums text-xs text-neutral-500 bg-white border border-neutral-200 px-2 py-0.5 rounded">
                    {quadTasks.length}
                  </span>
                  <button
                    onClick={() => onOpenQuickAdd(quad.defaultPriority, quad.defaultDueDate)}
                    className="h-6 w-6 flex items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
                    title={`Add task to ${quad.title}`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Tasks List */}
              <div className="flex-1 space-y-2 mt-3 overflow-y-auto max-h-[360px] pr-1">
                {quadTasks.map((task) => {
                  const project = projectMap.get(task.projectId);
                  const overdue = isOverdue(task.dueDate, task.status);

                  return (
                    <div
                      key={task.id}
                      onClick={() => onSelectTask(task)}
                      className="group flex items-start justify-between gap-2 p-2.5 rounded-lg border border-neutral-200/80 bg-white hover:border-neutral-300 hover:bg-neutral-50/50 transition-all cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            playTaskCompleteSound();
                            onToggleTaskComplete(task.id);
                          }}
                          className="mt-0.5 text-neutral-400 hover:text-emerald-600 transition-colors shrink-0"
                        >
                          <Circle className="h-3.5 w-3.5" />
                        </button>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-neutral-900 truncate">
                            {task.title}
                          </p>
                          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-neutral-500">
                            {project && (
                              <span className="flex items-center gap-1 text-neutral-700">
                                <span
                                  className="h-1.5 w-1.5 rounded-full"
                                  style={{ backgroundColor: project.color }}
                                />
                                <span>{project.name}</span>
                              </span>
                            )}
                            {project && <span aria-hidden="true">·</span>}
                            <span
                              className={`font-mono tabular-nums ${
                                overdue ? 'text-rose-600 font-semibold' : 'text-neutral-600'
                              }`}
                            >
                              {formatFriendlyDate(task.dueDate)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStartPomodoro(task.id);
                          }}
                          className="h-6 px-1.5 flex items-center gap-1 text-[10px] text-neutral-600 hover:bg-neutral-100 rounded"
                          title="Focus with timer"
                        >
                          <Play className="h-2.5 w-2.5 fill-current text-amber-600" />
                          <span>Focus</span>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {quadTasks.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-28 border border-dashed border-neutral-200 rounded-lg text-center p-3 text-[11px] text-neutral-400">
                    <span>No active tasks in this quadrant</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
