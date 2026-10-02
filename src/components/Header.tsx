import React from 'react';
import { ViewMode, PomodoroState } from '../types';
import {
  ListTodo,
  Kanban,
  Grid2X2,
  CalendarDays,
  BarChart3,
  Plus,
  Search,
  Timer,
  SlidersHorizontal,
} from 'lucide-react';
import avatarImg from '../assets/images/avatar_user_1790922661206.jpg';

interface HeaderProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onOpenQuickAdd: () => void;
  onOpenCommandPalette: () => void;
  onOpenSettings: () => void;
  onTogglePomodoro: () => void;
  pomodoroState: PomodoroState;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  onOpenQuickAdd,
  onOpenCommandPalette,
  onOpenSettings,
  onTogglePomodoro,
  pomodoroState,
  isSidebarOpen,
  onToggleSidebar,
}) => {
  const views: { id: ViewMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'list', label: 'List', icon: ListTodo },
    { id: 'board', label: 'Kanban', icon: Kanban },
    { id: 'matrix', label: 'Eisenhower', icon: Grid2X2 },
    { id: 'calendar', label: 'Calendar', icon: CalendarDays },
    { id: 'analytics', label: 'Velocity', icon: BarChart3 },
  ];

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-neutral-200 bg-white/95 px-4 backdrop-blur-md sm:px-6">
      {/* Zone 1: Single text element wordmark with toggle for mobile */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? 'Collapse navigation' : 'Expand navigation'}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>

        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            onViewChange('list');
          }}
          className="text-lg font-bold tracking-tight text-neutral-900 flex items-center gap-2 group"
        >
          <span className="h-2 w-2 rounded-full bg-neutral-900 group-hover:scale-125 transition-transform" />
          <span>Vantage</span>
        </a>
      </div>

      {/* Zone 2: Navigation views (Segmented interactive controls) */}
      <nav className="hidden md:flex items-center gap-1 rounded-lg bg-neutral-100 p-1 border border-neutral-200/60">
        {views.map((v) => {
          const Icon = v.icon;
          const isActive = currentView === v.id;
          return (
            <button
              key={v.id}
              onClick={() => onViewChange(v.id)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-neutral-900' : 'text-neutral-500'}`} />
              <span>{v.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-2">
        {/* Quick Search trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="hidden sm:flex items-center gap-2 h-9 px-3 text-xs font-medium text-neutral-500 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg transition-colors"
          title="Search tasks & jump (Cmd + K)"
        >
          <Search className="h-3.5 w-3.5 text-neutral-400" />
          <span className="hidden lg:inline">Search tasks...</span>
          <kbd className="hidden lg:inline px-1.5 py-0.5 text-[10px] font-mono bg-white border border-neutral-200 rounded text-neutral-400 shadow-2xs">
            ⌘K
          </kbd>
        </button>

        {/* Pomodoro Widget toggle */}
        <button
          onClick={onTogglePomodoro}
          className={`flex items-center gap-2 h-9 px-2.5 sm:px-3 text-xs font-medium rounded-lg border transition-colors ${
            pomodoroState.isRunning
              ? 'border-amber-500/30 bg-amber-50 text-amber-900'
              : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
          }`}
          title="Toggle Focus Timer"
        >
          <Timer className={`h-3.5 w-3.5 ${pomodoroState.isRunning ? 'text-amber-600 animate-pulse' : 'text-neutral-500'}`} />
          <span className="font-mono tabular-nums font-semibold">
            {formatSeconds(pomodoroState.timeLeft)}
          </span>
          <span className="hidden sm:inline text-[11px] text-neutral-500 capitalize">
            {pomodoroState.mode === 'work' ? 'Focus' : 'Break'}
          </span>
        </button>

        {/* Add Task Button */}
        <button
          onClick={onOpenQuickAdd}
          className="flex items-center gap-1.5 h-9 px-3.5 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-xs transition-colors whitespace-nowrap"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">New Task</span>
        </button>

        {/* User avatar & settings button */}
        <button
          onClick={onOpenSettings}
          className="relative ml-1 h-9 w-9 rounded-full ring-1 ring-neutral-200 hover:ring-neutral-400 transition-all overflow-hidden shrink-0"
          title="Preferences & Data settings"
        >
          <img
            src={avatarImg}
            alt="User profile"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
        </button>
      </div>
    </header>
  );
};
