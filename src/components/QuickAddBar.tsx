import React, { useState, useRef, useEffect } from 'react';
import { Project, Priority, Task } from '../types';
import {
  Calendar,
  Flag,
  FolderKanban,
  Plus,
  X,
  ListPlus,
  CornerDownLeft,
} from 'lucide-react';
import { playClickSound } from '../utils/audio';

interface QuickAddBarProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  projects: Project[];
  defaultProjectId?: string;
  defaultDueDate?: string;
}

export const QuickAddBar: React.FC<QuickAddBarProps> = ({
  isOpen,
  onClose,
  onAddTask,
  projects,
  defaultProjectId,
  defaultDueDate,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState(defaultProjectId || projects[0]?.id || '');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState(defaultDueDate || new Date().toISOString().split('T')[0]);
  const [tagsInput, setTagsInput] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [subtasksInput, setSubtasksInput] = useState<string[]>([]);
  const [newSubtask, setNewSubtask] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      if (defaultProjectId) setProjectId(defaultProjectId);
      if (defaultDueDate) setDueDate(defaultDueDate);
    } else {
      setTitle('');
      setDescription('');
      setTagsInput('');
      setSubtasksInput([]);
      setNewSubtask('');
      setShowDetails(false);
    }
  }, [isOpen, defaultProjectId, defaultDueDate]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) return;

    playClickSound();

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase().replace(/^#/, ''))
      .filter((t) => t.length > 0);

    const subtasks = subtasksInput.map((st, idx) => ({
      id: `st-${Date.now()}-${idx}`,
      title: st,
      completed: false,
    }));

    onAddTask({
      title: title.trim(),
      description: description.trim(),
      status: 'todo',
      priority,
      projectId: projectId || projects[0]?.id || 'proj-1',
      dueDate,
      tags: parsedTags,
      subtasks,
      estimatedPomodoros: 2,
      completedPomodoros: 0,
      isPinned: false,
    });

    setTitle('');
    setDescription('');
    setTagsInput('');
    setSubtasksInput([]);
    setNewSubtask('');
    onClose();
  };

  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      setSubtasksInput([...subtasksInput, newSubtask.trim()]);
      setNewSubtask('');
    }
  };

  const removeSubtask = (idx: number) => {
    setSubtasksInput(subtasksInput.filter((_, i) => i !== idx));
  };

  const setDatePreset = (daysAhead: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    setDueDate(d.toISOString().split('T')[0]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-neutral-900/40 p-4 pt-16 sm:pt-24 backdrop-blur-xs transition-opacity">
      <div className="w-full max-w-2xl rounded-xl border border-neutral-200 bg-white shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Quick Capture Task
            </span>
            <button
              type="button"
              onClick={onClose}
              className="h-6 w-6 flex items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Title Input */}
          <div>
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Prepare architecture diagram for review..."
              className="w-full text-base sm:text-lg font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !showDetails && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
          </div>

          {/* Description */}
          <div>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add optional notes, links, or acceptance criteria..."
              className="w-full text-xs sm:text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-hidden resize-none border-b border-neutral-100 pb-2"
            />
          </div>

          {/* Subtask Section toggle */}
          {showDetails && (
            <div className="space-y-2 border-t border-neutral-100 pt-3">
              <div className="flex items-center justify-between text-xs font-medium text-neutral-600">
                <span>Checklist / Subtasks ({subtasksInput.length})</span>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {subtasksInput.map((st, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-neutral-50 border border-neutral-200/50">
                    <span className="text-neutral-800">{st}</span>
                    <button
                      type="button"
                      onClick={() => removeSubtask(idx)}
                      className="text-neutral-400 hover:text-rose-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubtask();
                    }
                  }}
                  placeholder="Type subtask step & hit enter..."
                  className="flex-1 text-xs px-2.5 py-1.5 border border-neutral-200 rounded-md focus:outline-hidden focus:border-neutral-900"
                />
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  className="px-2.5 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md"
                >
                  Add Step
                </button>
              </div>
            </div>
          )}

          {/* Controls Bar: Project, Priority, Due Date, Tags */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-100 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              {/* Project selector */}
              <div className="flex items-center gap-1.5 border border-neutral-200 rounded-lg px-2.5 py-1 bg-neutral-50 text-neutral-700">
                <FolderKanban className="h-3.5 w-3.5 text-neutral-400" />
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="bg-transparent text-xs font-medium focus:outline-hidden cursor-pointer"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority Selector */}
              <div className="flex items-center gap-1.5 border border-neutral-200 rounded-lg px-2.5 py-1 bg-neutral-50 text-neutral-700">
                <Flag className="h-3.5 w-3.5 text-neutral-400" />
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="bg-transparent text-xs font-medium focus:outline-hidden cursor-pointer capitalize"
                >
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              {/* Due Date selector */}
              <div className="flex items-center gap-1.5 border border-neutral-200 rounded-lg px-2.5 py-1 bg-neutral-50 text-neutral-700">
                <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="bg-transparent text-xs font-medium focus:outline-hidden cursor-pointer"
                />
              </div>

              {/* Toggle subtasks list input */}
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className={`flex items-center gap-1.5 border rounded-lg px-2.5 py-1 text-xs transition-colors ${
                  showDetails
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <ListPlus className="h-3.5 w-3.5" />
                <span>Subtasks</span>
              </button>
            </div>

            {/* Quick date shortcuts */}
            <div className="flex items-center gap-1 text-[11px] text-neutral-500">
              <button
                type="button"
                onClick={() => setDatePreset(0)}
                className="hover:text-neutral-900 underline underline-offset-2"
              >
                Today
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => setDatePreset(1)}
                className="hover:text-neutral-900 underline underline-offset-2"
              >
                Tomorrow
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => setDatePreset(7)}
                className="hover:text-neutral-900 underline underline-offset-2"
              >
                +1 Week
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-neutral-100 pt-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-neutral-400">Tags:</span>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="tech, sprint, bug (comma separated)"
                className="text-xs text-neutral-700 focus:outline-hidden placeholder:text-neutral-300 w-48 sm:w-64"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim()}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors"
              >
                <span>Save Task</span>
                <CornerDownLeft className="h-3 w-3 opacity-70" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
