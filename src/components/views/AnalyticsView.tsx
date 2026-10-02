import React from 'react';
import { Task, Project, Priority } from '../../types';
import {
  CheckCircle2,
  Clock,
  Flame,
  TrendingUp,
  Target,
  BarChart3,
  Calendar,
  AlertCircle,
} from 'lucide-react';

interface AnalyticsViewProps {
  tasks: Task[];
  projects: Project[];
  focusMinutesToday: number;
  sessionsCompletedToday: number;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  tasks,
  projects,
  focusMinutesToday,
  sessionsCompletedToday,
}) => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const activeTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const urgentTasks = tasks.filter((t) => t.priority === 'urgent' && t.status !== 'done').length;
  const highTasks = tasks.filter((t) => t.priority === 'high' && t.status !== 'done').length;

  const totalPomodorosCompleted = tasks.reduce((sum, t) => sum + (t.completedPomodoros || 0), 0);
  const totalEstimatedPomodoros = tasks.reduce((sum, t) => sum + (t.estimatedPomodoros || 0), 0);

  // Project distribution
  const projectStats = projects.map((p) => {
    const pTasks = tasks.filter((t) => t.projectId === p.id);
    const pCompleted = pTasks.filter((t) => t.status === 'done').length;
    const rate = pTasks.length > 0 ? Math.round((pCompleted / pTasks.length) * 100) : 0;
    return {
      ...p,
      total: pTasks.length,
      completed: pCompleted,
      active: pTasks.length - pCompleted,
      rate,
    };
  });

  // Priority distribution
  const priorities: Priority[] = ['urgent', 'high', 'medium', 'low'];
  const priorityStats = priorities.map((pr) => {
    const prTasks = tasks.filter((t) => t.priority === pr);
    const prCompleted = prTasks.filter((t) => t.status === 'done').length;
    return {
      priority: pr,
      count: prTasks.length,
      active: prTasks.length - prCompleted,
    };
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="border-b border-neutral-200 pb-3">
        <h2 className="text-sm font-bold text-neutral-900">Task Velocity & Focus Analytics</h2>
        <p className="text-xs text-neutral-500">
          Real-time productivity metrics computed from your live workspace.
        </p>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Completion Rate */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-medium">Completion Rate</span>
            <Target className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-neutral-900">
              {completionRate}%
            </span>
            <span className="text-xs text-neutral-500 font-mono tabular-nums">
              ({completedTasks}/{totalTasks} tasks)
            </span>
          </div>
          {/* Progress track */}
          <div className="mt-3 h-1.5 w-full rounded-full bg-neutral-100 overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Focus Minutes Today */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-medium">Focus Logged Today</span>
            <Flame className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-neutral-900">
              {focusMinutesToday}
            </span>
            <span className="text-xs text-neutral-500">minutes</span>
          </div>
          <div className="mt-3 text-[11px] text-neutral-500 font-mono tabular-nums">
            {sessionsCompletedToday} focus sessions completed
          </div>
        </div>

        {/* Metric 3: Active Workload */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-medium">Active Backlog</span>
            <Clock className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-neutral-900">
              {activeTasks}
            </span>
            <span className="text-xs text-neutral-500">pending items</span>
          </div>
          <div className="mt-3 text-[11px] text-neutral-500 font-mono tabular-nums">
            {urgentTasks} urgent · {highTasks} high priority
          </div>
        </div>

        {/* Metric 4: Pomodoro Estimation Accuracy */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-medium">Focus Cycles</span>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-neutral-900">
              {totalPomodorosCompleted}
            </span>
            <span className="text-xs text-neutral-500 font-mono tabular-nums">
              / {totalEstimatedPomodoros} estimated
            </span>
          </div>
          <div className="mt-3 text-[11px] text-neutral-500 font-mono tabular-nums">
            {Math.round((totalPomodorosCompleted * 25) / 60)} hrs total deep work
          </div>
        </div>
      </div>

      {/* Project Breakdown Table */}
      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-neutral-900 tracking-tight">
            Workload Distribution by Project
          </h3>
          <span className="text-[11px] text-neutral-400">
            {projects.length} active initiatives
          </span>
        </div>

        <div className="divide-y divide-neutral-100">
          {projectStats.map((p) => (
            <div key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-50/50 transition-colors">
              <div className="flex items-center gap-3 min-w-48">
                <span
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: p.color }}
                />
                <div>
                  <h4 className="text-xs font-semibold text-neutral-900">{p.name}</h4>
                  <p className="text-[11px] text-neutral-500">{p.description}</p>
                </div>
              </div>

              {/* Progress Bar & Numeric Data */}
              <div className="flex items-center gap-6 sm:w-72 justify-between sm:justify-end">
                <div className="flex-1 max-w-[140px]">
                  <div className="flex justify-between text-[11px] text-neutral-500 mb-1">
                    <span>Progress</span>
                    <span className="font-mono tabular-nums">{p.rate}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        backgroundColor: p.color,
                        width: `${p.rate}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="text-right text-xs font-mono tabular-nums">
                  <div className="font-semibold text-neutral-900">{p.active} active</div>
                  <div className="text-[11px] text-neutral-400">{p.completed} completed</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Priority Distribution Bar Chart */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs">
        <h3 className="text-xs font-bold text-neutral-900 tracking-tight mb-3">
          Active Tasks by Priority
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {priorityStats.map((pr) => {
            const colors: Record<Priority, string> = {
              urgent: 'bg-rose-500',
              high: 'bg-amber-500',
              medium: 'bg-neutral-400',
              low: 'bg-neutral-200',
            };
            return (
              <div
                key={pr.priority}
                className="p-3 rounded-lg border border-neutral-100 bg-neutral-50/60"
              >
                <div className="flex items-center justify-between text-xs text-neutral-500 capitalize">
                  <span className="font-medium text-neutral-800">{pr.priority}</span>
                  <span className="font-mono tabular-nums font-bold text-neutral-900">
                    {pr.active}
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full bg-neutral-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${colors[pr.priority]}`}
                    style={{
                      width: `${totalTasks > 0 ? (pr.active / totalTasks) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
