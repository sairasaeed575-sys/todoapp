import { Task, Project } from '../types';

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'Product Architecture',
    color: '#3B82F6', // Blue
    description: 'Core platform architecture, performance optimizations, and infrastructure.',
    iconName: 'Layers',
  },
  {
    id: 'proj-2',
    name: 'Design System',
    color: '#8B5CF6', // Purple
    description: 'Components, typography tokens, accessibility standards, and patterns.',
    iconName: 'Palette',
  },
  {
    id: 'proj-3',
    name: 'Marketing & Growth',
    color: '#10B981', // Emerald
    description: 'Product launches, changelogs, user interviews, and landing analytics.',
    iconName: 'TrendingUp',
  },
  {
    id: 'proj-4',
    name: 'Personal & Routine',
    color: '#F59E0B', // Amber
    description: 'Daily habits, reading lists, exercise, and focus routines.',
    iconName: 'UserCheck',
  },
];

function getRelativeDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

export function getInitialTasks(): Task[] {
  const today = getRelativeDate(0);
  const tomorrow = getRelativeDate(1);
  const in3Days = getRelativeDate(3);
  const in5Days = getRelativeDate(5);
  const yesterday = getRelativeDate(-1);

  return [
    {
      id: 'task-1',
      title: 'Audit client-side bundle size & chunk splitting',
      description: 'Analyze webpack/vite stats to isolate vendor chunks exceeding 150kb. Target sub-second initial LCP across 3G mobile emulations.',
      status: 'in_progress',
      priority: 'urgent',
      projectId: 'proj-1',
      dueDate: today,
      dueTime: '14:30',
      tags: ['performance', 'vite', 'frontend'],
      subtasks: [
        { id: 'sub-1', title: 'Generate visual bundle analysis report', completed: true },
        { id: 'sub-2', title: 'Dynamic import heavy syntax highlighter & charts', completed: true },
        { id: 'sub-3', title: 'Measure mobile LCP before and after chunking', completed: false },
      ],
      estimatedPomodoros: 4,
      completedPomodoros: 2,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      isPinned: true,
    },
    {
      id: 'task-2',
      title: 'Refactor typography tokens to Plus Jakarta Sans & JetBrains Mono',
      description: 'Migrate legacy CSS classes to clean variable-based typography tokens. Verify WCAG AA 4.5:1 contrast ratio across light and dark canvas surfaces.',
      status: 'todo',
      priority: 'high',
      projectId: 'proj-2',
      dueDate: today,
      dueTime: '17:00',
      tags: ['design-tokens', 'accessibility'],
      subtasks: [
        { id: 'sub-4', title: 'Configure font-variant-numeric: tabular-nums for numeric columns', completed: true },
        { id: 'sub-5', title: 'Audit button label text contrast in muted states', completed: false },
        { id: 'sub-6', title: 'Document scale guidelines in design spec', completed: false },
      ],
      estimatedPomodoros: 3,
      completedPomodoros: 1,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      isPinned: true,
    },
    {
      id: 'task-3',
      title: 'Conduct user interview with 3 beta design leads',
      description: 'Review their day-to-day workflow in the Kanban and Eisenhower Matrix views. Note any friction in quick-add keyboard shortcuts.',
      status: 'todo',
      priority: 'high',
      projectId: 'proj-3',
      dueDate: tomorrow,
      dueTime: '11:00',
      tags: ['interviews', 'ux-feedback', 'research'],
      subtasks: [
        { id: 'sub-7', title: 'Draft 5 focused questions on daily task grouping', completed: true },
        { id: 'sub-8', title: 'Set up recording link & permission form', completed: false },
        { id: 'sub-9', title: 'Synthesize feedback notes into action items', completed: false },
      ],
      estimatedPomodoros: 2,
      completedPomodoros: 0,
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: 'task-4',
      title: 'Morning 5km endurance run & hydration check',
      description: 'Keep zone 2 heart rate pace around 140 bpm. 10 minutes warm down stretch afterwards.',
      status: 'done',
      priority: 'medium',
      projectId: 'proj-4',
      dueDate: today,
      tags: ['health', 'routine'],
      subtasks: [
        { id: 'sub-10', title: 'Hydrate 500ml water with electrolytes', completed: true },
        { id: 'sub-11', title: 'Complete 5.2 km route', completed: true },
        { id: 'sub-12', title: 'Post-run mobility stretch', completed: true },
      ],
      estimatedPomodoros: 1,
      completedPomodoros: 1,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      completedAt: new Date().toISOString(),
    },
    {
      id: 'task-5',
      title: 'Write release changelog for v2.4 sprint milestone',
      description: 'Detail new calendar scheduling view, Eisenhower priority matrix, and Pomodoro focus ambient mode. Include short GIFs of interactions.',
      status: 'backlog',
      priority: 'medium',
      projectId: 'proj-3',
      dueDate: in3Days,
      tags: ['marketing', 'changelog', 'release'],
      subtasks: [
        { id: 'sub-13', title: 'Collect PR summaries from engineering log', completed: false },
        { id: 'sub-14', title: 'Record 20-second screen capture of matrix drag-and-drop', completed: false },
        { id: 'sub-15', title: 'Review with product marketing team', completed: false },
      ],
      estimatedPomodoros: 3,
      completedPomodoros: 0,
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    },
    {
      id: 'task-6',
      title: 'Implement drag-and-drop reordering for Kanban cards',
      description: 'Ensure smooth pointer transitions with accessible keyboard fallbacks (Space to grab, Arrow keys to reposition, Enter to drop).',
      status: 'review',
      priority: 'high',
      projectId: 'proj-1',
      dueDate: tomorrow,
      dueTime: '16:00',
      tags: ['kanban', 'interaction', 'keyboard-nav'],
      subtasks: [
        { id: 'sub-16', title: 'Add ARIA live announcements for column transfers', completed: true },
        { id: 'sub-17', title: 'Handle empty column drop targets smoothly', completed: true },
      ],
      estimatedPomodoros: 3,
      completedPomodoros: 2,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 'task-7',
      title: 'Read chapter 4 of High Output Management',
      description: 'Focus on leverage principles, managerial output indicators, and task-relevant maturity concepts.',
      status: 'todo',
      priority: 'low',
      projectId: 'proj-4',
      dueDate: in5Days,
      tags: ['reading', 'leadership'],
      subtasks: [
        { id: 'sub-18', title: 'Read pages 82–114', completed: false },
        { id: 'sub-19', title: 'Jot down 3 key managerial leverage ideas', completed: false },
      ],
      estimatedPomodoros: 2,
      completedPomodoros: 0,
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
      id: 'task-8',
      title: 'Review production error logging telemetry & rate limits',
      description: 'Identify spurious 429 throttling spikes on search endpoint during peak European business hours.',
      status: 'todo',
      priority: 'urgent',
      projectId: 'proj-1',
      dueDate: yesterday, // intentional overdue task for realism
      dueTime: '09:00',
      tags: ['backend', 'security', 'monitoring'],
      subtasks: [
        { id: 'sub-20', title: 'Check IP rate limit bucket configurations', completed: false },
        { id: 'sub-21', title: 'Add cache-control headers on static query responses', completed: false },
      ],
      estimatedPomodoros: 2,
      completedPomodoros: 0,
      createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    },
  ];
}
