import React, { useState, useEffect, useRef } from 'react';
import { Task, Project, ViewMode } from '../types';
import {
  Search,
  CheckCircle2,
  Circle,
  Clock,
  Layers,
  ListTodo,
  Kanban,
  Grid2X2,
  CalendarDays,
  BarChart3,
  Plus,
  Timer,
  Hash,
  ArrowRight,
} from 'lucide-react';
import { formatFriendlyDate } from '../utils/storage';
import { playClickSound } from '../utils/audio';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  projects: Project[];
  onSelectTask: (task: Task) => void;
  onViewChange: (view: ViewMode) => void;
  onOpenQuickAdd: () => void;
  onStartPomodoro: (taskId?: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  tasks,
  projects,
  onSelectTask,
  onViewChange,
  onOpenQuickAdd,
  onStartPomodoro,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter tasks based on query
  const cleanQuery = query.toLowerCase().trim();

  const matchingTasks = tasks
    .filter(
      (t) =>
        t.title.toLowerCase().includes(cleanQuery) ||
        t.description.toLowerCase().includes(cleanQuery) ||
        t.tags.some((tag) => tag.toLowerCase().includes(cleanQuery))
    )
    .slice(0, 5);

  const navigationActions = [
    { id: 'view-list', title: 'Go to List View', icon: ListTodo, action: () => onViewChange('list') },
    { id: 'view-board', title: 'Go to Kanban Board', icon: Kanban, action: () => onViewChange('board') },
    { id: 'view-matrix', title: 'Go to Eisenhower Decision Matrix', icon: Grid2X2, action: () => onViewChange('matrix') },
    { id: 'view-calendar', title: 'Go to Calendar View', icon: CalendarDays, action: () => onViewChange('calendar') },
    { id: 'view-analytics', title: 'View Velocity & Analytics', icon: BarChart3, action: () => onViewChange('analytics') },
    { id: 'act-new', title: 'Create New Task...', icon: Plus, action: () => onOpenQuickAdd() },
    { id: 'act-focus', title: 'Start Focus Pomodoro', icon: Timer, action: () => onStartPomodoro() },
  ].filter((a) => a.title.toLowerCase().includes(cleanQuery));

  const totalItems = matchingTasks.length + navigationActions.length;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, totalItems));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + totalItems) % Math.max(1, totalItems));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      executeCurrentSelection();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const executeCurrentSelection = () => {
    if (selectedIndex < matchingTasks.length) {
      const selected = matchingTasks[selectedIndex];
      if (selected) {
        playClickSound();
        onSelectTask(selected);
        onClose();
      }
    } else {
      const actionIndex = selectedIndex - matchingTasks.length;
      const selectedAction = navigationActions[actionIndex];
      if (selectedAction) {
        playClickSound();
        selectedAction.action();
        onClose();
      }
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center bg-neutral-900/40 p-4 pt-20 backdrop-blur-xs transition-opacity"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-2xl border border-neutral-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-neutral-100">
          <Search className="h-5 w-5 text-neutral-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a task name, tag, or action..."
            className="w-full text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden"
          />
          <kbd className="hidden sm:inline px-1.5 py-0.5 text-[10px] font-mono bg-neutral-100 border border-neutral-200 rounded text-neutral-500">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-4">
          {/* Tasks Results */}
          {matchingTasks.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                Tasks
              </div>
              <div className="space-y-1">
                {matchingTasks.map((t, idx) => {
                  const isSelected = selectedIndex === idx;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        playClickSound();
                        onSelectTask(t);
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors text-left ${
                        isSelected
                          ? 'bg-neutral-900 text-white font-medium'
                          : 'text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {t.status === 'done' ? (
                          <CheckCircle2
                            className={`h-4 w-4 shrink-0 ${
                              isSelected ? 'text-emerald-400' : 'text-emerald-600'
                            }`}
                          />
                        ) : (
                          <Circle
                            className={`h-4 w-4 shrink-0 ${
                              isSelected ? 'text-neutral-400' : 'text-neutral-400'
                            }`}
                          />
                        )}
                        <span className="truncate">{t.title}</span>
                      </div>

                      <div
                        className={`flex items-center gap-1.5 text-[11px] font-mono tabular-nums shrink-0 ${
                          isSelected ? 'text-neutral-300' : 'text-neutral-400'
                        }`}
                      >
                        <span>{formatFriendlyDate(t.dueDate)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions / Views */}
          {navigationActions.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                Views & Actions
              </div>
              <div className="space-y-1">
                {navigationActions.map((a, idx) => {
                  const isSelected = selectedIndex === matchingTasks.length + idx;
                  const Icon = a.icon;
                  return (
                    <button
                      key={a.id}
                      onClick={() => {
                        playClickSound();
                        a.action();
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors text-left ${
                        isSelected
                          ? 'bg-neutral-900 text-white font-medium'
                          : 'text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`h-4 w-4 shrink-0 ${
                            isSelected ? 'text-white' : 'text-neutral-500'
                          }`}
                        />
                        <span>{a.title}</span>
                      </div>
                      <ArrowRight
                        className={`h-3 w-3 ${
                          isSelected ? 'text-neutral-300' : 'text-neutral-300'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {matchingTasks.length === 0 && navigationActions.length === 0 && (
            <div className="py-8 text-center text-xs text-neutral-400">
              No matching tasks or navigation commands.
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="border-t border-neutral-100 px-4 py-2 bg-neutral-50/50 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span>Vantage Spotlight</span>
        </div>
      </div>
    </div>
  );
};
