import React, { useState } from 'react';
import { Task, Project, Priority, GroupByOption, FilterState } from '../../types';
import {
  CheckCircle2,
  Circle,
  Clock,
  Pin,
  MoreVertical,
  ChevronDown,
  ChevronRight,
  Plus,
  Play,
  CheckSquare,
  Square,
  Trash2,
  Flag,
  ArrowUpDown,
  Layers,
} from 'lucide-react';
import { formatFriendlyDate, isOverdue } from '../../utils/storage';
import { playTaskCompleteSound, playClickSound } from '../../utils/audio';

interface ListViewProps {
  tasks: Task[];
  projects: Project[];
  filter: FilterState;
  onFilterChange: (updates: Partial<FilterState>) => void;
  onToggleTaskComplete: (taskId: string) => void;
  onSelectTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenQuickAdd: (defaultProjectId?: string, defaultDueDate?: string) => void;
  onStartPomodoro: (taskId: string) => void;
  activePomodoroTaskId: string | null;
}

interface TaskGroup {
  key: string;
  title: string;
  color?: string;
  items: Task[];
}

export const ListView: React.FC<ListViewProps> = ({
  tasks,
  projects,
  filter,
  onFilterChange,
  onToggleTaskComplete,
  onSelectTask,
  onDeleteTask,
  onOpenQuickAdd,
  onStartPomodoro,
  activePomodoroTaskId,
}) => {
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [expandedSubtasks, setExpandedSubtasks] = useState<Record<string, boolean>>({});

  const projectMap = React.useMemo(() => {
    const map = new Map<string, Project>();
    projects.forEach((p) => map.set(p.id, p));
    return map;
  }, [projects]);

  // Priority metadata mapping
  const priorityInfo: Record<Priority, { label: string; textClass: string }> = {
    urgent: { label: 'Urgent', textClass: 'text-rose-600 font-semibold' },
    high: { label: 'High', textClass: 'text-amber-600 font-medium' },
    medium: { label: 'Medium', textClass: 'text-neutral-600' },
    low: { label: 'Low', textClass: 'text-neutral-400' },
  };

  const toggleGroupCollapse = (groupKey: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const toggleSubtasksExpand = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedSubtasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const toggleSelectTask = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedTaskIds.length === tasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(tasks.map((t) => t.id));
    }
  };

  const handleBulkComplete = () => {
    selectedTaskIds.forEach((id) => onToggleTaskComplete(id));
    setSelectedTaskIds([]);
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Delete ${selectedTaskIds.length} selected tasks?`)) {
      selectedTaskIds.forEach((id) => onDeleteTask(id));
      setSelectedTaskIds([]);
    }
  };

  // Grouping logic
  const groupedTasks: TaskGroup[] = React.useMemo(() => {
    if (filter.groupBy === 'none') {
      return [{ key: 'all', title: 'All Tasks', items: tasks }];
    }

    if (filter.groupBy === 'dueDate') {
      const groups: Record<string, Task[]> = {
        Overdue: [],
        Today: [],
        Tomorrow: [],
        Upcoming: [],
        'No Date': [],
      };

      const todayStr = new Date().toISOString().split('T')[0];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      tasks.forEach((t) => {
        if (!t.dueDate) {
          groups['No Date'].push(t);
        } else if (isOverdue(t.dueDate, t.status)) {
          groups['Overdue'].push(t);
        } else if (t.dueDate === todayStr) {
          groups['Today'].push(t);
        } else if (t.dueDate === tomorrowStr) {
          groups['Tomorrow'].push(t);
        } else {
          groups['Upcoming'].push(t);
        }
      });

      return Object.entries(groups)
        .filter(([_, items]) => items.length > 0)
        .map(([key, items]) => ({ key, title: key, items }));
    }

    if (filter.groupBy === 'project') {
      const groups: Record<string, Task[]> = {};
      projects.forEach((p) => {
        groups[p.id] = [];
      });
      groups['unassigned'] = [];

      tasks.forEach((t) => {
        if (groups[t.projectId]) {
          groups[t.projectId].push(t);
        } else {
          groups['unassigned'].push(t);
        }
      });

      return Object.entries(groups)
        .filter(([_, items]) => items.length > 0)
        .map(([projId, items]) => {
          const proj = projectMap.get(projId);
          return {
            key: projId,
            title: proj ? proj.name : 'Unassigned',
            color: proj?.color,
            items,
          };
        });
    }

    if (filter.groupBy === 'priority') {
      const order: Priority[] = ['urgent', 'high', 'medium', 'low'];
      return order
        .map((p) => ({
          key: p,
          title: priorityInfo[p].label,
          items: tasks.filter((t) => t.priority === p),
        }))
        .filter((g) => g.items.length > 0);
    }

    if (filter.groupBy === 'status') {
      const statuses = [
        { key: 'todo', title: 'To Do' },
        { key: 'in_progress', title: 'In Progress' },
        { key: 'review', title: 'In Review' },
        { key: 'backlog', title: 'Backlog' },
        { key: 'done', title: 'Done' },
      ];
      return statuses
        .map((s) => ({
          key: s.key,
          title: s.title,
          items: tasks.filter((t) => t.status === s.key),
        }))
        .filter((g) => g.items.length > 0);
    }

    return [{ key: 'all', title: 'All Tasks', items: tasks }];
  }, [tasks, filter.groupBy, projects, projectMap]);

  return (
    <div className="space-y-4">
      {/* Top Filter and Grouping Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-3">
        {/* Bulk action bar if items selected */}
        {selectedTaskIds.length > 0 ? (
          <div className="flex items-center gap-3 bg-neutral-900 text-white px-3 py-1.5 rounded-lg text-xs animate-in fade-in">
            <span className="font-semibold">{selectedTaskIds.length} selected</span>
            <div className="h-3 w-px bg-neutral-700" />
            <button
              onClick={handleBulkComplete}
              className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Mark Done</span>
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 hover:text-rose-400 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete</span>
            </button>
            <button
              onClick={() => setSelectedTaskIds([])}
              className="text-neutral-400 hover:text-white transition-colors"
            >
              Clear
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-800 transition-colors"
              title="Select all"
            >
              <Square className="h-3.5 w-3.5 text-neutral-400" />
              <span className="hidden sm:inline">Select All</span>
            </button>
            <span className="text-xs text-neutral-400">·</span>
            <span className="text-xs text-neutral-500 font-mono tabular-nums">
              {tasks.length} total tasks
            </span>
          </div>
        )}

        {/* View Options: Group By & Sort By */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-neutral-600 bg-white border border-neutral-200 rounded-lg px-2.5 py-1">
            <Layers className="h-3.5 w-3.5 text-neutral-400" />
            <span className="text-neutral-500 hidden sm:inline">Group:</span>
            <select
              value={filter.groupBy}
              onChange={(e) => onFilterChange({ groupBy: e.target.value as GroupByOption })}
              className="bg-transparent font-medium focus:outline-hidden cursor-pointer text-neutral-800"
            >
              <option value="none">None</option>
              <option value="dueDate">Due Date</option>
              <option value="project">Project</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-neutral-600 bg-white border border-neutral-200 rounded-lg px-2.5 py-1">
            <ArrowUpDown className="h-3.5 w-3.5 text-neutral-400" />
            <span className="text-neutral-500 hidden sm:inline">Sort:</span>
            <select
              value={filter.sortBy}
              onChange={(e) =>
                onFilterChange({
                  sortBy: e.target.value as FilterState['sortBy'],
                })
              }
              className="bg-transparent font-medium focus:outline-hidden cursor-pointer text-neutral-800"
            >
              <option value="dueDate">Due Date</option>
              <option value="priority">Priority</option>
              <option value="title">Title</option>
              <option value="createdAt">Date Created</option>
            </select>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {tasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-neutral-200 rounded-xl bg-white/50">
          <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mb-3">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-semibold text-neutral-900">No tasks found</h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm">
            Everything on your agenda is clear or matches no current filters.
          </p>
          <button
            onClick={() => onOpenQuickAdd()}
            className="mt-4 flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add First Task</span>
          </button>
        </div>
      )}

      {/* Task Groups */}
      <div className="space-y-6">
        {groupedTasks.map((group) => {
          const isCollapsed = collapsedGroups[group.key];
          return (
            <div key={group.key} className="space-y-2">
              {/* Group Header */}
              {filter.groupBy !== 'none' && (
                <div
                  onClick={() => toggleGroupCollapse(group.key)}
                  className="flex items-center justify-between py-1 cursor-pointer select-none group"
                >
                  <div className="flex items-center gap-2">
                    {isCollapsed ? (
                      <ChevronRight className="h-4 w-4 text-neutral-400 group-hover:text-neutral-700" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-neutral-400 group-hover:text-neutral-700" />
                    )}
                    <h3 className="text-xs font-bold text-neutral-800 tracking-tight flex items-center gap-2">
                      {group.color && (
                        <span
                          className="h-2 w-2 rounded-full inline-block"
                          style={{ backgroundColor: group.color }}
                        />
                      )}
                      <span>{group.title}</span>
                    </h3>
                    <span className="font-mono tabular-nums text-[11px] text-neutral-400">
                      ({group.items.length})
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenQuickAdd(
                        filter.groupBy === 'project' ? group.key : undefined,
                        filter.groupBy === 'dueDate' && group.key === 'Today'
                          ? new Date().toISOString().split('T')[0]
                          : undefined
                      );
                    }}
                    className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-900 transition-opacity"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add task</span>
                  </button>
                </div>
              )}

              {/* Task Items */}
              {!isCollapsed && (
                <div className="divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-2xs">
                  {group.items.map((task) => {
                    const isSelected = selectedTaskIds.includes(task.id);
                    const isDone = task.status === 'done';
                    const overdue = isOverdue(task.dueDate, task.status);
                    const project = projectMap.get(task.projectId);
                    const hasSubtasks = task.subtasks && task.subtasks.length > 0;
                    const completedSubtasks = task.subtasks?.filter((st) => st.completed).length || 0;
                    const isSubtasksOpen = expandedSubtasks[task.id];
                    const isPomodoroActive = activePomodoroTaskId === task.id;

                    return (
                      <div
                        key={task.id}
                        onClick={() => onSelectTask(task)}
                        className={`group relative flex flex-col p-3 transition-colors cursor-pointer hover:bg-neutral-50/80 ${
                          isDone ? 'bg-neutral-50/40 text-neutral-400' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Selection Checkbox */}
                          <button
                            type="button"
                            onClick={(e) => toggleSelectTask(task.id, e)}
                            className="mt-0.5 text-neutral-300 hover:text-neutral-600 transition-colors shrink-0"
                          >
                            {isSelected ? (
                              <CheckSquare className="h-4 w-4 text-neutral-900" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </button>

                          {/* Completion Toggle */}
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
                            className="mt-0.5 text-neutral-400 hover:text-emerald-600 transition-colors shrink-0"
                            title={isDone ? 'Mark as incomplete' : 'Mark as done'}
                          >
                            {isDone ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <Circle className="h-4 w-4 hover:border-neutral-900" />
                            )}
                          </button>

                          {/* Main Task Content */}
                          <div className="flex-1 min-w-0 pr-2">
                            <div className="flex items-center gap-2">
                              {task.isPinned && (
                                <Pin className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />
                              )}
                              <span
                                className={`text-xs sm:text-sm font-medium leading-snug truncate ${
                                  isDone
                                    ? 'line-through text-neutral-400'
                                    : 'text-neutral-900'
                                }`}
                              >
                                {task.title}
                              </span>
                            </div>

                            {/* Clean Zero-Pill Inline Metadata with typographic separators */}
                            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-neutral-500">
                              {/* Project indicator */}
                              {project && (
                                <span className="flex items-center gap-1 font-medium text-neutral-700">
                                  <span
                                    className="h-1.5 w-1.5 rounded-full"
                                    style={{ backgroundColor: project.color }}
                                  />
                                  <span>{project.name}</span>
                                </span>
                              )}

                              {project && <span aria-hidden="true">·</span>}

                              {/* Due Date */}
                              <span
                                className={`flex items-center gap-1 font-mono tabular-nums ${
                                  overdue
                                    ? 'text-rose-600 font-semibold'
                                    : isDone
                                    ? 'text-neutral-400'
                                    : 'text-neutral-600'
                                }`}
                              >
                                <Clock className="h-3 w-3 shrink-0" />
                                <span>{formatFriendlyDate(task.dueDate)}</span>
                                {task.dueTime && <span>at {task.dueTime}</span>}
                                {overdue && <span>(Overdue)</span>}
                              </span>

                              <span aria-hidden="true">·</span>

                              {/* Priority (Text label, not color alone) */}
                              <span className={priorityInfo[task.priority].textClass}>
                                {priorityInfo[task.priority].label}
                              </span>

                              {/* Subtask count */}
                              {hasSubtasks && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <button
                                    onClick={(e) => toggleSubtasksExpand(task.id, e)}
                                    className="hover:text-neutral-900 underline underline-offset-2 font-mono tabular-nums"
                                  >
                                    {completedSubtasks}/{task.subtasks.length} subtasks
                                  </button>
                                </>
                              )}

                              {/* Pomodoro count */}
                              {task.estimatedPomodoros > 0 && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="font-mono tabular-nums text-neutral-600">
                                    {task.completedPomodoros}/{task.estimatedPomodoros} focus
                                  </span>
                                </>
                              )}

                              {/* Tags as clean unboxed text */}
                              {task.tags.length > 0 && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="text-neutral-400">
                                    {task.tags.map((tg) => `#${tg}`).join(' ')}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Quick Action buttons */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            {/* Start Pomodoro Focus on this task */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onStartPomodoro(task.id);
                              }}
                              className={`h-7 px-2 flex items-center gap-1 text-[11px] font-medium rounded border transition-colors ${
                                isPomodoroActive
                                  ? 'bg-amber-100 border-amber-300 text-amber-900'
                                  : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                              }`}
                              title="Focus with Pomodoro"
                            >
                              <Play className="h-3 w-3 fill-current text-amber-600" />
                              <span className="hidden sm:inline">Focus</span>
                            </button>

                            {/* Delete single task */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteTask(task.id);
                              }}
                              className="h-7 w-7 flex items-center justify-center text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              title="Delete task"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Inline Expandable Subtasks */}
                        {isSubtasksOpen && hasSubtasks && (
                          <div className="mt-2 ml-10 pl-3 border-l-2 border-neutral-200 space-y-1.5 py-1">
                            {task.subtasks.map((st) => (
                              <div
                                key={st.id}
                                className="flex items-center gap-2 text-xs text-neutral-600"
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    st.completed ? 'bg-emerald-500' : 'bg-neutral-300'
                                  }`}
                                />
                                <span className={st.completed ? 'line-through text-neutral-400' : ''}>
                                  {st.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
