import React, { useState, useEffect } from 'react';
import { Task, Project, Priority, TaskStatus, Subtask } from '../types';
import {
  X,
  Calendar,
  Clock,
  Flag,
  FolderKanban,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Pin,
  Play,
  Hash,
  ListTodo,
} from 'lucide-react';
import { formatFriendlyDate, isOverdue } from '../utils/storage';
import { playTaskCompleteSound, playClickSound } from '../utils/audio';

interface TaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  projects: Project[];
  onStartPomodoro: (taskId: string) => void;
  activePomodoroTaskId: string | null;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  task,
  isOpen,
  onClose,
  onUpdateTask,
  onDeleteTask,
  projects,
  onStartPomodoro,
  activePomodoroTaskId,
}) => {
  const [currentTask, setCurrentTask] = useState<Task | null>(task);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newTagInput, setNewTagInput] = useState('');

  useEffect(() => {
    setCurrentTask(task);
    setNewSubtaskTitle('');
    setNewTagInput('');
  }, [task]);

  if (!isOpen || !currentTask) return null;

  const handleFieldChange = <K extends keyof Task>(key: K, value: Task[K]) => {
    const updated = { ...currentTask, [key]: value };
    setCurrentTask(updated);
    onUpdateTask(updated);
  };

  const handleToggleComplete = () => {
    const isDone = currentTask.status === 'done';
    const newStatus: TaskStatus = isDone ? 'todo' : 'done';
    const updated: Task = {
      ...currentTask,
      status: newStatus,
      completedAt: isDone ? undefined : new Date().toISOString(),
    };
    if (!isDone) {
      playTaskCompleteSound();
    } else {
      playClickSound();
    }
    setCurrentTask(updated);
    onUpdateTask(updated);
  };

  const handleAddSubtask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    const newSubtask: Subtask = {
      id: `st-${Date.now()}`,
      title: newSubtaskTitle.trim(),
      completed: false,
    };

    const updated = {
      ...currentTask,
      subtasks: [...(currentTask.subtasks || []), newSubtask],
    };
    setCurrentTask(updated);
    onUpdateTask(updated);
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (subtaskId: string) => {
    const updatedSubtasks = (currentTask.subtasks || []).map((st) => {
      if (st.id === subtaskId) {
        const nextState = !st.completed;
        if (nextState) playTaskCompleteSound();
        else playClickSound();
        return { ...st, completed: nextState };
      }
      return st;
    });

    const updated = { ...currentTask, subtasks: updatedSubtasks };
    setCurrentTask(updated);
    onUpdateTask(updated);
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    const updatedSubtasks = (currentTask.subtasks || []).filter((st) => st.id !== subtaskId);
    const updated = { ...currentTask, subtasks: updatedSubtasks };
    setCurrentTask(updated);
    onUpdateTask(updated);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTagInput.trim()) {
      e.preventDefault();
      const cleanTag = newTagInput.trim().toLowerCase().replace(/^#/, '');
      if (!currentTask.tags.includes(cleanTag)) {
        const updated = {
          ...currentTask,
          tags: [...currentTask.tags, cleanTag],
        };
        setCurrentTask(updated);
        onUpdateTask(updated);
      }
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updated = {
      ...currentTask,
      tags: currentTask.tags.filter((t) => t !== tagToRemove),
    };
    setCurrentTask(updated);
    onUpdateTask(updated);
  };

  const isDone = currentTask.status === 'done';
  const overdue = isOverdue(currentTask.dueDate, currentTask.status);
  const isPomodoroActive = activePomodoroTaskId === currentTask.id;
  const completedSubtasks = (currentTask.subtasks || []).filter((s) => s.completed).length;
  const totalSubtasks = currentTask.subtasks?.length || 0;
  const progressPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 p-4 backdrop-blur-xs transition-opacity overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl border border-neutral-200 bg-white shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-3.5 bg-neutral-50/50">
          <div className="flex items-center gap-3">
            {/* Completion status toggle */}
            <button
              onClick={handleToggleComplete}
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md border transition-colors bg-white hover:bg-neutral-50 border-neutral-200 text-neutral-800"
            >
              {isDone ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Completed</span>
                </>
              ) : (
                <>
                  <Circle className="h-4 w-4 text-neutral-400" />
                  <span>Mark Done</span>
                </>
              )}
            </button>

            {/* Pin task toggle */}
            <button
              onClick={() => handleFieldChange('isPinned', !currentTask.isPinned)}
              className={`h-8 w-8 flex items-center justify-center rounded-md border transition-colors ${
                currentTask.isPinned
                  ? 'border-amber-300 bg-amber-50 text-amber-600'
                  : 'border-neutral-200 bg-white text-neutral-400 hover:text-neutral-700'
              }`}
              title={currentTask.isPinned ? 'Unpin task' : 'Pin task to top'}
            >
              <Pin className={`h-4 w-4 ${currentTask.isPinned ? 'fill-amber-500' : ''}`} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Start Pomodoro Focus Button */}
            <button
              onClick={() => onStartPomodoro(currentTask.id)}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md border transition-colors ${
                isPomodoroActive
                  ? 'bg-amber-100 border-amber-300 text-amber-900 font-semibold'
                  : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <Play className="h-3 w-3 fill-current text-amber-600" />
              <span>{isPomodoroActive ? 'Focus Active' : 'Start Focus'}</span>
            </button>

            {/* Delete Task */}
            <button
              onClick={() => {
                if (window.confirm('Delete this task?')) {
                  onDeleteTask(currentTask.id);
                  onClose();
                }
              }}
              className="h-8 w-8 flex items-center justify-center rounded-md text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Delete task"
            >
              <Trash2 className="h-4 w-4" />
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="h-8 w-8 flex items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors ml-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Title Editor */}
          <div>
            <input
              type="text"
              value={currentTask.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              className="w-full text-lg sm:text-xl font-bold text-neutral-900 border-b border-transparent hover:border-neutral-200 focus:border-neutral-900 focus:outline-hidden py-1 transition-colors"
              placeholder="Task Title..."
            />
          </div>

          {/* Properties Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-50/80 p-4 rounded-xl border border-neutral-200/60 text-xs">
            {/* Project */}
            <div className="flex items-center justify-between">
              <span className="text-neutral-500 flex items-center gap-1.5">
                <FolderKanban className="h-3.5 w-3.5 text-neutral-400" />
                Project
              </span>
              <select
                value={currentTask.projectId}
                onChange={(e) => handleFieldChange('projectId', e.target.value)}
                className="font-medium text-neutral-800 bg-white border border-neutral-200 rounded px-2 py-1 focus:outline-hidden"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between">
              <span className="text-neutral-500 flex items-center gap-1.5">
                <ListTodo className="h-3.5 w-3.5 text-neutral-400" />
                Status
              </span>
              <select
                value={currentTask.status}
                onChange={(e) => handleFieldChange('status', e.target.value as TaskStatus)}
                className="font-medium text-neutral-800 bg-white border border-neutral-200 rounded px-2 py-1 focus:outline-hidden"
              >
                <option value="backlog">Backlog</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">In Review</option>
                <option value="done">Done</option>
              </select>
            </div>

            {/* Priority */}
            <div className="flex items-center justify-between">
              <span className="text-neutral-500 flex items-center gap-1.5">
                <Flag className="h-3.5 w-3.5 text-neutral-400" />
                Priority
              </span>
              <select
                value={currentTask.priority}
                onChange={(e) => handleFieldChange('priority', e.target.value as Priority)}
                className="font-medium text-neutral-800 bg-white border border-neutral-200 rounded px-2 py-1 focus:outline-hidden capitalize"
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Due Date & Time */}
            <div className="flex items-center justify-between">
              <span className="text-neutral-500 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                Due Date
              </span>
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  value={currentTask.dueDate}
                  onChange={(e) => handleFieldChange('dueDate', e.target.value)}
                  className="font-mono text-neutral-800 bg-white border border-neutral-200 rounded px-1.5 py-1 focus:outline-hidden"
                />
                <input
                  type="time"
                  value={currentTask.dueTime || ''}
                  onChange={(e) => handleFieldChange('dueTime', e.target.value || undefined)}
                  className="font-mono text-neutral-800 bg-white border border-neutral-200 rounded px-1 py-1 focus:outline-hidden text-[11px]"
                />
              </div>
            </div>

            {/* Estimated Pomodoros */}
            <div className="flex items-center justify-between">
              <span className="text-neutral-500 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-neutral-400" />
                Focus Cycles
              </span>
              <div className="flex items-center gap-1 font-mono tabular-nums">
                <span className="text-neutral-700">{currentTask.completedPomodoros} done /</span>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={currentTask.estimatedPomodoros}
                  onChange={(e) =>
                    handleFieldChange('estimatedPomodoros', Math.max(1, parseInt(e.target.value) || 1))
                  }
                  className="w-12 bg-white border border-neutral-200 rounded px-1.5 py-1 text-center font-bold"
                />
                <span className="text-neutral-400">est</span>
              </div>
            </div>
          </div>

          {/* Description / Notes */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-700 block">
              Notes & Description
            </label>
            <textarea
              rows={4}
              value={currentTask.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              placeholder="Add detailed task notes, acceptance criteria, or links..."
              className="w-full text-xs sm:text-sm text-neutral-800 placeholder:text-neutral-400 p-3 rounded-xl border border-neutral-200 focus:border-neutral-900 focus:outline-hidden resize-y leading-relaxed"
            />
          </div>

          {/* Subtasks Checklist */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-neutral-700">
                  Subtasks & Checklist
                </label>
                <span className="font-mono tabular-nums text-xs text-neutral-500">
                  ({completedSubtasks}/{totalSubtasks})
                </span>
              </div>

              {totalSubtasks > 0 && (
                <div className="w-24 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              )}
            </div>

            {/* Checklist Items */}
            <div className="space-y-1.5">
              {(currentTask.subtasks || []).map((subtask) => (
                <div
                  key={subtask.id}
                  className="flex items-center justify-between gap-2 p-2 rounded-lg border border-neutral-100 bg-neutral-50/50 hover:bg-neutral-50 transition-colors text-xs"
                >
                  <button
                    type="button"
                    onClick={() => handleToggleSubtask(subtask.id)}
                    className="flex items-center gap-2 text-left flex-1"
                  >
                    {subtask.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-neutral-400 shrink-0" />
                    )}
                    <span
                      className={
                        subtask.completed
                          ? 'line-through text-neutral-400'
                          : 'text-neutral-800 font-medium'
                      }
                    >
                      {subtask.title}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteSubtask(subtask.id)}
                    className="text-neutral-300 hover:text-rose-600 p-1 rounded"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Subtask input */}
            <form onSubmit={handleAddSubtask} className="flex gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="Add subtask step (press enter)..."
                className="flex-1 text-xs px-3 py-1.5 border border-neutral-200 rounded-lg focus:outline-hidden focus:border-neutral-900"
              />
              <button
                type="submit"
                disabled={!newSubtaskTitle.trim()}
                className="px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg disabled:opacity-40"
              >
                Add
              </button>
            </form>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-700 block">Tags</label>
            <div className="flex flex-wrap items-center gap-1.5">
              {currentTask.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-[11px] font-mono text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200/60"
                >
                  <Hash className="h-2.5 w-2.5 text-neutral-400" />
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-neutral-400 hover:text-rose-600 ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}

              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="+ Add tag & hit Enter"
                className="text-xs font-mono text-neutral-700 placeholder:text-neutral-400 px-2 py-0.5 border border-neutral-200 rounded focus:outline-hidden focus:border-neutral-900 w-36"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-neutral-100 px-6 py-3 bg-neutral-50/50 flex items-center justify-between text-[11px] text-neutral-400">
          <span>
            Created {formatFriendlyDate(currentTask.createdAt.split('T')[0])}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
