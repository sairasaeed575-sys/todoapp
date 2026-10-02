/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Task,
  Project,
  ViewMode,
  FilterState,
  TaskStatus,
  Priority,
  PomodoroState,
} from './types';
import {
  loadTasksFromStorage,
  saveTasksToStorage,
  loadProjectsFromStorage,
  saveProjectsToStorage,
  loadStatsFromStorage,
  saveStatsToStorage,
} from './utils/storage';
import { getInitialTasks, INITIAL_PROJECTS } from './data/initialData';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { QuickAddBar } from './components/QuickAddBar';
import { ListView } from './components/views/ListView';
import { BoardView } from './components/views/BoardView';
import { MatrixView } from './components/views/MatrixView';
import { CalendarView } from './components/views/CalendarView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { TaskModal } from './components/TaskModal';
import { PomodoroTimer } from './components/PomodoroTimer';
import { CommandPalette } from './components/CommandPalette';
import { ProjectModal } from './components/ProjectModal';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  // Persistence state
  const [tasks, setTasks] = useState<Task[]>(loadTasksFromStorage);
  const [projects, setProjects] = useState<Project[]>(loadProjectsFromStorage);

  const initialStats = useMemo(() => loadStatsFromStorage(), []);

  // UI state
  const [currentView, setCurrentView] = useState<ViewMode>('list');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Modals state
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddDefaults, setQuickAddDefaults] = useState<{
    projectId?: string;
    dueDate?: string;
    priority?: Priority;
    status?: TaskStatus;
  }>({});

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isPomodoroOpen, setIsPomodoroOpen] = useState(false);

  // Pomodoro state
  const [pomodoroState, setPomodoroState] = useState<PomodoroState>({
    mode: 'work',
    timeLeft: 25 * 60,
    isRunning: false,
    activeTaskId: null,
    sessionsCompletedToday: initialStats.sessionsCompletedToday,
    totalFocusMinutesToday: initialStats.totalFocusMinutesToday,
  });

  // Filter state
  const [filter, setFilter] = useState<FilterState>({
    search: '',
    status: 'all',
    priority: 'all',
    projectId: 'all',
    tag: 'all',
    dateFilter: 'all',
    sortBy: 'dueDate',
    sortDirection: 'asc',
    groupBy: 'dueDate',
  });

  // Save tasks on change
  useEffect(() => {
    saveTasksToStorage(tasks);
  }, [tasks]);

  // Save projects on change
  useEffect(() => {
    saveProjectsToStorage(projects);
  }, [projects]);

  // Save stats on change
  useEffect(() => {
    saveStatsToStorage({
      sessionsCompletedToday: pomodoroState.sessionsCompletedToday,
      totalFocusMinutesToday: pomodoroState.totalFocusMinutesToday,
      lastActiveDate: new Date().toISOString().split('T')[0],
    });
  }, [pomodoroState.sessionsCompletedToday, pomodoroState.totalFocusMinutesToday]);

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside input or textarea
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      // Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      if (isInput) return;

      if (e.key.toLowerCase() === 'n' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setQuickAddDefaults({});
        setIsQuickAddOpen(true);
      } else if (e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setIsPomodoroOpen((prev) => !prev);
      } else if (e.key === '1') {
        setCurrentView('list');
      } else if (e.key === '2') {
        setCurrentView('board');
      } else if (e.key === '3') {
        setCurrentView('matrix');
      } else if (e.key === '4') {
        setCurrentView('calendar');
      } else if (e.key === '5') {
        setCurrentView('analytics');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter tasks for active view
  const filteredTasks = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    return tasks
      .filter((task) => {
        // Search query
        if (filter.search.trim()) {
          const q = filter.search.toLowerCase();
          const matchTitle = task.title.toLowerCase().includes(q);
          const matchDesc = task.description.toLowerCase().includes(q);
          const matchTag = task.tags.some((t) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchDesc && !matchTag) return false;
        }

        // Project filter
        if (filter.projectId !== 'all' && task.projectId !== filter.projectId) {
          return false;
        }

        // Status filter
        if (filter.status !== 'all' && task.status !== filter.status) {
          return false;
        }

        // Priority filter
        if (filter.priority !== 'all' && task.priority !== filter.priority) {
          return false;
        }

        // Tag filter
        if (filter.tag !== 'all' && !task.tags.includes(filter.tag)) {
          return false;
        }

        // Date filter
        if (filter.dateFilter === 'today') {
          if (task.status === 'done' || (task.dueDate !== todayStr && task.dueDate > todayStr)) {
            return false;
          }
        } else if (filter.dateFilter === 'upcoming') {
          if (task.status === 'done' || task.dueDate <= todayStr) {
            return false;
          }
        } else if (filter.dateFilter === 'completed') {
          if (task.status !== 'done') {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        // Pinned tasks always on top
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;

        if (filter.sortBy === 'dueDate') {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.localeCompare(b.dueDate);
        }

        if (filter.sortBy === 'priority') {
          const priorityWeight: Record<Priority, number> = {
            urgent: 4,
            high: 3,
            medium: 2,
            low: 1,
          };
          return priorityWeight[b.priority] - priorityWeight[a.priority];
        }

        if (filter.sortBy === 'title') {
          return a.title.localeCompare(b.title);
        }

        if (filter.sortBy === 'createdAt') {
          return b.createdAt.localeCompare(a.createdAt);
        }

        return 0;
      });
  }, [tasks, filter]);

  // Handlers
  const handleToggleTaskComplete = useCallback((taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const willBeDone = t.status !== 'done';
          return {
            ...t,
            status: willBeDone ? 'done' : 'todo',
            completedAt: willBeDone ? new Date().toISOString() : undefined,
          };
        }
        return t;
      })
    );
  }, []);

  const handleUpdateTaskStatus = useCallback((taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            status: newStatus,
            completedAt: newStatus === 'done' ? new Date().toISOString() : undefined,
          };
        }
        return t;
      })
    );
  }, []);

  const handleUpdateTask = useCallback((updatedTask: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    setSelectedTask(updatedTask);
  }, []);

  const handleDeleteTask = useCallback((taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (selectedTask?.id === taskId) {
      setSelectedTask(null);
    }
  }, [selectedTask]);

  const handleAddTask = useCallback((newTaskData: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...newTaskData,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: quickAddDefaults.status || newTaskData.status || 'todo',
    };
    setTasks((prev) => [newTask, ...prev]);
  }, [quickAddDefaults]);

  const handleAddProject = useCallback((newProject: Project) => {
    setProjects((prev) => [...prev, newProject]);
  }, []);

  const handleStartPomodoro = useCallback((taskId?: string) => {
    setPomodoroState((prev) => ({
      ...prev,
      activeTaskId: taskId || prev.activeTaskId,
      isRunning: true,
    }));
    setIsPomodoroOpen(true);
  }, []);

  const handleIncrementTaskPomodoro = useCallback((taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            completedPomodoros: (t.completedPomodoros || 0) + 1,
          };
        }
        return t;
      })
    );
  }, []);

  const openQuickAddWithDefaults = (
    defaultProjectId?: string,
    defaultDueDate?: string,
    defaultPriority?: Priority,
    defaultStatus?: TaskStatus
  ) => {
    setQuickAddDefaults({
      projectId: defaultProjectId,
      dueDate: defaultDueDate,
      priority: defaultPriority,
      status: defaultStatus,
    });
    setIsQuickAddOpen(true);
  };

  const handleResetDemoData = () => {
    const freshTasks = getInitialTasks();
    setTasks(freshTasks);
    setProjects(INITIAL_PROJECTS);
  };

  const handleClearCompleted = () => {
    setTasks((prev) => prev.filter((t) => t.status !== 'done'));
  };

  return (
    <div className="flex h-screen w-full flex-col bg-neutral-50 overflow-hidden text-neutral-900 font-sans">
      {/* 3-Zone Header */}
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        onOpenQuickAdd={() => openQuickAddWithDefaults()}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onTogglePomodoro={() => setIsPomodoroOpen((prev) => !prev)}
        pomodoroState={pomodoroState}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      />

      {/* Main Workspace Frame */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Navigation Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          projects={projects}
          tasks={tasks}
          filter={filter}
          onFilterChange={(updates) => setFilter((prev) => ({ ...prev, ...updates }))}
          onOpenNewProject={() => setIsNewProjectOpen(true)}
          focusMinutesToday={pomodoroState.totalFocusMinutesToday}
          sessionsCompletedToday={pomodoroState.sessionsCompletedToday}
        />

        {/* Viewport Content Canvas */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {currentView === 'list' && (
              <ListView
                tasks={filteredTasks}
                projects={projects}
                filter={filter}
                onFilterChange={(updates) => setFilter((prev) => ({ ...prev, ...updates }))}
                onToggleTaskComplete={handleToggleTaskComplete}
                onSelectTask={setSelectedTask}
                onDeleteTask={handleDeleteTask}
                onOpenQuickAdd={(proj, date) => openQuickAddWithDefaults(proj, date)}
                onStartPomodoro={handleStartPomodoro}
                activePomodoroTaskId={pomodoroState.activeTaskId}
              />
            )}

            {currentView === 'board' && (
              <BoardView
                tasks={filteredTasks}
                projects={projects}
                onUpdateTaskStatus={handleUpdateTaskStatus}
                onSelectTask={setSelectedTask}
                onToggleTaskComplete={handleToggleTaskComplete}
                onOpenQuickAdd={(proj, status) =>
                  openQuickAddWithDefaults(proj, undefined, undefined, status)
                }
                onStartPomodoro={handleStartPomodoro}
                activePomodoroTaskId={pomodoroState.activeTaskId}
              />
            )}

            {currentView === 'matrix' && (
              <MatrixView
                tasks={filteredTasks}
                projects={projects}
                onSelectTask={setSelectedTask}
                onToggleTaskComplete={handleToggleTaskComplete}
                onUpdateTask={handleUpdateTask}
                onOpenQuickAdd={(priority, date) =>
                  openQuickAddWithDefaults(undefined, date, priority)
                }
                onStartPomodoro={handleStartPomodoro}
              />
            )}

            {currentView === 'calendar' && (
              <CalendarView
                tasks={tasks}
                projects={projects}
                onSelectTask={setSelectedTask}
                onToggleTaskComplete={handleToggleTaskComplete}
                onOpenQuickAdd={(proj, date) => openQuickAddWithDefaults(proj, date)}
              />
            )}

            {currentView === 'analytics' && (
              <AnalyticsView
                tasks={tasks}
                projects={projects}
                focusMinutesToday={pomodoroState.totalFocusMinutesToday}
                sessionsCompletedToday={pomodoroState.sessionsCompletedToday}
              />
            )}
          </div>
        </main>
      </div>

      {/* Quick Add Bar Modal */}
      <QuickAddBar
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onAddTask={handleAddTask}
        projects={projects}
        defaultProjectId={quickAddDefaults.projectId}
        defaultDueDate={quickAddDefaults.dueDate}
      />

      {/* Task Details Drawer/Modal */}
      <TaskModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
        projects={projects}
        onStartPomodoro={handleStartPomodoro}
        activePomodoroTaskId={pomodoroState.activeTaskId}
      />

      {/* Pomodoro Focus Timer (Floating or Zen) */}
      <PomodoroTimer
        state={pomodoroState}
        setState={setPomodoroState}
        isOpen={isPomodoroOpen}
        onClose={() => setIsPomodoroOpen(false)}
        tasks={tasks}
        onToggleTaskComplete={handleToggleTaskComplete}
        onIncrementTaskPomodoro={handleIncrementTaskPomodoro}
      />

      {/* Command Palette (Cmd + K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        tasks={tasks}
        projects={projects}
        onSelectTask={setSelectedTask}
        onViewChange={setCurrentView}
        onOpenQuickAdd={() => openQuickAddWithDefaults()}
        onStartPomodoro={handleStartPomodoro}
      />

      {/* Project Creation Modal */}
      <ProjectModal
        isOpen={isNewProjectOpen}
        onClose={() => setIsNewProjectOpen(false)}
        onAddProject={handleAddProject}
      />

      {/* Settings & Data Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        tasks={tasks}
        projects={projects}
        onImportData={(newTasks, newProjects) => {
          setTasks(newTasks);
          setProjects(newProjects);
        }}
        onResetDemoData={handleResetDemoData}
        onClearCompletedTasks={handleClearCompleted}
      />
    </div>
  );
}
