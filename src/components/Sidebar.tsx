import React from 'react';
import { Project, FilterState, Task } from '../types';
import {
  Inbox,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  FolderKanban,
  Plus,
  Hash,
  Flame,
} from 'lucide-react';
import { isOverdue } from '../utils/storage';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  tasks: Task[];
  filter: FilterState;
  onFilterChange: (updates: Partial<FilterState>) => void;
  onOpenNewProject: () => void;
  focusMinutesToday: number;
  sessionsCompletedToday: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  projects,
  tasks,
  filter,
  onFilterChange,
  onOpenNewProject,
  focusMinutesToday,
  sessionsCompletedToday,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Counts
  const allTasksCount = tasks.filter((t) => t.status !== 'done').length;
  const todayCount = tasks.filter((t) => t.status !== 'done' && (t.dueDate === todayStr || isOverdue(t.dueDate, t.status))).length;
  const upcomingCount = tasks.filter((t) => t.status !== 'done' && t.dueDate > todayStr).length;
  const highPriorityCount = tasks.filter((t) => t.status !== 'done' && (t.priority === 'urgent' || t.priority === 'high')).length;
  const completedCount = tasks.filter((t) => t.status === 'done').length;

  // Extract unique tags
  const allTags = Array.from(new Set(tasks.flatMap((t) => t.tags))).slice(0, 10);

  const smartFilters = [
    {
      id: 'all',
      label: 'All Active',
      icon: Inbox,
      count: allTasksCount,
      active: filter.dateFilter === 'all' && filter.priority === 'all' && filter.status === 'all' && filter.projectId === 'all' && filter.tag === 'all',
      onClick: () =>
        onFilterChange({
          dateFilter: 'all',
          priority: 'all',
          status: 'all',
          projectId: 'all',
          tag: 'all',
        }),
    },
    {
      id: 'today',
      label: 'Today',
      icon: Calendar,
      count: todayCount,
      active: filter.dateFilter === 'today',
      onClick: () =>
        onFilterChange({
          dateFilter: 'today',
          projectId: 'all',
          tag: 'all',
        }),
    },
    {
      id: 'upcoming',
      label: 'Upcoming',
      icon: Clock,
      count: upcomingCount,
      active: filter.dateFilter === 'upcoming',
      onClick: () =>
        onFilterChange({
          dateFilter: 'upcoming',
          projectId: 'all',
          tag: 'all',
        }),
    },
    {
      id: 'high_priority',
      label: 'Urgent & High',
      icon: AlertCircle,
      count: highPriorityCount,
      active: filter.priority === 'high' || filter.priority === 'urgent',
      onClick: () =>
        onFilterChange({
          priority: filter.priority === 'urgent' ? 'all' : 'urgent',
          dateFilter: 'all',
          projectId: 'all',
        }),
    },
    {
      id: 'completed',
      label: 'Completed',
      icon: CheckCircle2,
      count: completedCount,
      active: filter.dateFilter === 'completed' || filter.status === 'done',
      onClick: () =>
        onFilterChange({
          dateFilter: 'completed',
          status: 'done',
          projectId: 'all',
        }),
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-30 bg-neutral-900/30 backdrop-blur-xs transition-opacity md:hidden"
        />
      )}

      <aside
        className={`fixed top-16 bottom-0 left-0 z-30 flex w-64 flex-col border-r border-neutral-200 bg-white transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Smart Nav Filters */}
          <div>
            <div className="px-3 pb-2 text-[11px] font-semibold text-neutral-400 tracking-wider">
              PERSPECTIVES
            </div>
            <nav className="space-y-0.5">
              {smartFilters.map((f) => {
                const Icon = f.icon;
                return (
                  <button
                    key={f.id}
                    onClick={f.onClick}
                    className={`group flex w-full items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                      f.active
                        ? 'bg-neutral-900 text-white font-semibold'
                        : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon
                        className={`h-4 w-4 shrink-0 ${
                          f.active ? 'text-white' : 'text-neutral-400 group-hover:text-neutral-600'
                        }`}
                      />
                      <span className="truncate">{f.label}</span>
                    </div>
                    <span
                      className={`font-mono tabular-nums text-[11px] ${
                        f.active ? 'text-neutral-300' : 'text-neutral-400'
                      }`}
                    >
                      {f.count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Projects List */}
          <div>
            <div className="flex items-center justify-between px-3 pb-2">
              <span className="text-[11px] font-semibold text-neutral-400 tracking-wider">
                PROJECTS
              </span>
              <button
                onClick={onOpenNewProject}
                className="flex h-5 w-5 items-center justify-center rounded text-neutral-400 hover:bg-neutral-100 hover:text-neutral-800 transition-colors"
                title="New Project"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="space-y-0.5">
              {projects.map((proj) => {
                const isSelected = filter.projectId === proj.id;
                const count = tasks.filter((t) => t.projectId === proj.id && t.status !== 'done').length;
                return (
                  <button
                    key={proj.id}
                    onClick={() =>
                      onFilterChange({
                        projectId: isSelected ? 'all' : proj.id,
                        dateFilter: 'all',
                      })
                    }
                    className={`group flex w-full items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                      isSelected
                        ? 'bg-neutral-100 text-neutral-900 font-semibold'
                        : 'text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: proj.color }}
                      />
                      <span className="truncate">{proj.name}</span>
                    </div>
                    <span className="font-mono tabular-nums text-[11px] text-neutral-400">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tags */}
          {allTags.length > 0 && (
            <div>
              <div className="px-3 pb-2 text-[11px] font-semibold text-neutral-400 tracking-wider">
                TAGS
              </div>
              <div className="flex flex-wrap gap-1 px-3">
                {allTags.map((tag) => {
                  const isSelected = filter.tag === tag;
                  return (
                    <button
                      key={tag}
                      onClick={() =>
                        onFilterChange({
                          tag: isSelected ? 'all' : tag,
                        })
                      }
                      className={`inline-flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded transition-colors ${
                        isSelected
                          ? 'bg-neutral-900 text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/80 hover:text-neutral-900'
                      }`}
                    >
                      <Hash className="h-2.5 w-2.5 opacity-60" />
                      <span>{tag}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Quiet Daily Focus Summary at bottom */}
        <div className="border-t border-neutral-200 p-3 bg-neutral-50/50">
          <div className="flex items-center justify-between text-xs text-neutral-600 mb-1">
            <span className="flex items-center gap-1.5 font-medium text-neutral-800">
              <Flame className="h-3.5 w-3.5 text-amber-500" />
              Focus Today
            </span>
            <span className="font-mono tabular-nums text-neutral-900 font-semibold">
              {focusMinutesToday} min
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-neutral-500">
            <span>Completed pomodoros</span>
            <span className="font-mono tabular-nums">{sessionsCompletedToday} sessions</span>
          </div>
        </div>
      </aside>
    </>
  );
};
