export type Priority = 'urgent' | 'high' | 'medium' | 'low';

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  projectId: string;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  tags: string[];
  subtasks: Subtask[];
  estimatedPomodoros: number;
  completedPomodoros: number;
  createdAt: string;
  completedAt?: string;
  isPinned?: boolean;
}

export interface Project {
  id: string;
  name: string;
  color: string; // Tailwind color class or hex
  description: string;
  iconName: string;
}

export type ViewMode = 'list' | 'board' | 'matrix' | 'calendar' | 'analytics';

export type DateFilterType = 'all' | 'today' | 'upcoming' | 'overdue' | 'completed';

export type GroupByOption = 'none' | 'dueDate' | 'project' | 'priority' | 'status';

export interface FilterState {
  search: string;
  status: 'all' | TaskStatus;
  priority: 'all' | Priority;
  projectId: 'all' | string;
  tag: 'all' | string;
  dateFilter: DateFilterType;
  sortBy: 'dueDate' | 'priority' | 'title' | 'createdAt';
  sortDirection: 'asc' | 'desc';
  groupBy: GroupByOption;
}

export type PomodoroMode = 'work' | 'short_break' | 'long_break';

export interface PomodoroState {
  mode: PomodoroMode;
  timeLeft: number; // in seconds
  isRunning: boolean;
  activeTaskId: string | null;
  sessionsCompletedToday: number;
  totalFocusMinutesToday: number;
}
