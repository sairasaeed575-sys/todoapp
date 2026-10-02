import React, { useState } from 'react';
import { Task, Project } from '../../types';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle2,
  Circle,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { playTaskCompleteSound } from '../../utils/audio';

interface CalendarViewProps {
  tasks: Task[];
  projects: Project[];
  onSelectTask: (task: Task) => void;
  onToggleTaskComplete: (taskId: string) => void;
  onOpenQuickAdd: (defaultProjectId?: string, defaultDueDate?: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  projects,
  onSelectTask,
  onToggleTaskComplete,
  onOpenQuickAdd,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const projectMap = React.useMemo(() => {
    const map = new Map<string, Project>();
    projects.forEach((p) => map.set(p.id, p));
    return map;
  }, [projects]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  // Calendar calculations
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate()
  ).padStart(2, '0')}`;

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Build grid days
  const calendarCells = [];

  // Previous month trailing days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const prevM = month === 0 ? 11 : month - 1;
    const prevY = month === 0 ? year - 1 : year;
    const dateStr = `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    calendarCells.push({
      dateStr,
      dayNum,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarCells.push({
      dateStr,
      dayNum: d,
      isCurrentMonth: true,
    });
  }

  // Next month leading days to complete grid (multiples of 7)
  const remainingCells = (7 - (calendarCells.length % 7)) % 7;
  for (let d = 1; d <= remainingCells; d++) {
    const nextM = month === 11 ? 0 : month + 1;
    const nextY = month === 11 ? year + 1 : year;
    const dateStr = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarCells.push({
      dateStr,
      dayNum: d,
      isCurrentMonth: false,
    });
  }

  return (
    <div className="space-y-4">
      {/* Calendar Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-3">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold text-neutral-900 tracking-tight">
            {monthNames[month]} {year}
          </h2>
          <button
            onClick={goToToday}
            className="px-2.5 py-1 text-xs font-medium text-neutral-700 bg-white border border-neutral-200 hover:bg-neutral-50 rounded-md transition-colors"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="h-8 w-8 flex items-center justify-center rounded-md border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 transition-colors"
            title="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={nextMonth}
            className="h-8 w-8 flex items-center justify-center rounded-md border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 transition-colors"
            title="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-px rounded-xl border border-neutral-200 bg-neutral-200 overflow-hidden shadow-2xs">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((weekday) => (
          <div
            key={weekday}
            className="bg-neutral-100 py-2 text-center text-xs font-semibold text-neutral-500"
          >
            {weekday}
          </div>
        ))}

        {/* Days Grid */}
        {calendarCells.map((cell, idx) => {
          const isToday = cell.dateStr === todayStr;
          const dayTasks = tasks.filter((t) => t.dueDate === cell.dateStr);

          return (
            <div
              key={idx}
              className={`min-h-[110px] sm:min-h-[130px] p-1.5 flex flex-col justify-between transition-colors ${
                cell.isCurrentMonth ? 'bg-white hover:bg-neutral-50/50' : 'bg-neutral-50/70 text-neutral-400'
              }`}
            >
              {/* Day Number and Quick Add Button */}
              <div className="flex items-center justify-between pb-1">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-mono tabular-nums ${
                    isToday
                      ? 'bg-neutral-900 font-bold text-white'
                      : cell.isCurrentMonth
                      ? 'text-neutral-800 font-medium'
                      : 'text-neutral-400'
                  }`}
                >
                  {cell.dayNum}
                </span>

                <button
                  type="button"
                  onClick={() => onOpenQuickAdd(undefined, cell.dateStr)}
                  className="opacity-0 hover:opacity-100 h-5 w-5 flex items-center justify-center rounded text-neutral-400 hover:text-neutral-900 hover:bg-neutral-200/60 transition-opacity"
                  title={`Add task for ${cell.dateStr}`}
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>

              {/* Tasks within this day */}
              <div className="flex-1 space-y-1 overflow-y-auto max-h-[85px]">
                {dayTasks.map((task) => {
                  const project = projectMap.get(task.projectId);
                  const isDone = task.status === 'done';

                  return (
                    <div
                      key={task.id}
                      onClick={() => onSelectTask(task)}
                      className={`group flex items-center gap-1.5 px-1.5 py-1 rounded text-[11px] border border-neutral-200/70 transition-all cursor-pointer ${
                        isDone
                          ? 'bg-neutral-100/50 text-neutral-400 line-through'
                          : 'bg-white hover:border-neutral-300 hover:shadow-2xs text-neutral-800'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          playTaskCompleteSound();
                          onToggleTaskComplete(task.id);
                        }}
                        className="text-neutral-400 hover:text-emerald-600 shrink-0"
                      >
                        {isDone ? (
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        ) : (
                          <Circle className="h-3 w-3" />
                        )}
                      </button>

                      {project && (
                        <span
                          className="h-1.5 w-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: project.color }}
                        />
                      )}

                      <span className="truncate font-medium">{task.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
