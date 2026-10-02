import { Task, Project } from '../types';
import { INITIAL_PROJECTS, getInitialTasks } from '../data/initialData';

const TASKS_KEY = 'vantage_tasks_v2';
const PROJECTS_KEY = 'vantage_projects_v2';
const STATS_KEY = 'vantage_stats_v2';

export interface PersistedStats {
  sessionsCompletedToday: number;
  totalFocusMinutesToday: number;
  lastActiveDate: string;
}

export function loadTasksFromStorage(): Task[] {
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load tasks from localStorage', e);
  }
  const defaultTasks = getInitialTasks();
  saveTasksToStorage(defaultTasks);
  return defaultTasks;
}

export function saveTasksToStorage(tasks: Task[]): void {
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error('Failed to save tasks to localStorage', e);
  }
}

export function loadProjectsFromStorage(): Project[] {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load projects from localStorage', e);
  }
  saveProjectsToStorage(INITIAL_PROJECTS);
  return INITIAL_PROJECTS;
}

export function saveProjectsToStorage(projects: Project[]): void {
  try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  } catch (e) {
    console.error('Failed to save projects to localStorage', e);
  }
}

export function loadStatsFromStorage(): PersistedStats {
  const todayStr = new Date().toISOString().split('T')[0];
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) {
      const parsed: PersistedStats = JSON.parse(raw);
      if (parsed.lastActiveDate === todayStr) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return {
    sessionsCompletedToday: 3,
    totalFocusMinutesToday: 75,
    lastActiveDate: todayStr,
  };
}

export function saveStatsToStorage(stats: PersistedStats): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    // ignore
  }
}

export function formatFriendlyDate(dateStr?: string): string {
  if (!dateStr) return 'No due date';
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [year, month, day] = dateStr.split('-').map(Number);
  const target = new Date(year, month - 1, day);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 1 && diffDays < 7) {
    return target.toLocaleDateString('en-US', { weekday: 'short' });
  }

  return target.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function isOverdue(dateStr?: string, status?: string): boolean {
  if (!dateStr || status === 'done') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [year, month, day] = dateStr.split('-').map(Number);
  const target = new Date(year, month - 1, day);
  target.setHours(0, 0, 0, 0);

  return target.getTime() < today.getTime();
}
