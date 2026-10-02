import React, { useRef } from 'react';
import { Task, Project } from '../types';
import {
  X,
  Download,
  Upload,
  RotateCcw,
  Volume2,
  VolumeX,
  Trash2,
  Keyboard,
  ShieldCheck,
} from 'lucide-react';
import { isSoundEnabled, setSoundEnabled, playClickSound } from '../utils/audio';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  projects: Project[];
  onImportData: (tasks: Task[], projects: Project[]) => void;
  onResetDemoData: () => void;
  onClearCompletedTasks: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  tasks,
  projects,
  onImportData,
  onResetDemoData,
  onClearCompletedTasks,
}) => {
  const [soundOn, setSoundOn] = React.useState(isSoundEnabled());
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) playClickSound();
  };

  const handleExportJSON = () => {
    playClickSound();
    const data = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      tasks,
      projects,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vantage-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.tasks)) {
          playClickSound();
          onImportData(parsed.tasks, Array.isArray(parsed.projects) ? parsed.projects : projects);
          alert('Tasks and projects successfully restored!');
          onClose();
        } else {
          alert('Invalid Vantage JSON backup format.');
        }
      } catch (err) {
        alert('Failed to read file: invalid JSON');
      }
    };
    reader.readAsText(file);
  };

  const shortcuts = [
    { key: '⌘ + K', desc: 'Open Command Palette' },
    { key: 'N', desc: 'Quick capture new task' },
    { key: '1 – 5', desc: 'Switch view (List, Board, Matrix, Calendar, Velocity)' },
    { key: 'Space', desc: 'Toggle Pomodoro Timer (in Zen mode)' },
    { key: 'Esc', desc: 'Close open modal or drawer' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 p-4 backdrop-blur-xs transition-opacity">
      <div className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4 bg-neutral-50/50">
          <h3 className="text-xs font-bold text-neutral-900 tracking-tight">
            Preferences & Data Management
          </h3>
          <button
            onClick={onClose}
            className="h-6 w-6 flex items-center justify-center rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Audio Feedback */}
          <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
            <div>
              <div className="text-xs font-semibold text-neutral-900 flex items-center gap-2">
                {soundOn ? (
                  <Volume2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <VolumeX className="h-4 w-4 text-neutral-400" />
                )}
                <span>Haptic Audio Cues</span>
              </div>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Play subtle harmonic bells upon task completion & focus cycles
              </p>
            </div>
            <button
              onClick={toggleSound}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                soundOn
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'bg-neutral-100 text-neutral-600 border-neutral-200 hover:bg-neutral-200'
              }`}
            >
              {soundOn ? 'Enabled' : 'Muted'}
            </button>
          </div>

          {/* Backup & Restore */}
          <div className="space-y-3 pb-4 border-b border-neutral-100">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
              Data Portability
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleExportJSON}
                className="flex items-center justify-center gap-2 p-2.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-xs font-medium text-neutral-800 transition-colors"
              >
                <Download className="h-4 w-4 text-neutral-500" />
                <span>Export JSON</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 p-2.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-xs font-medium text-neutral-800 transition-colors"
              >
                <Upload className="h-4 w-4 text-neutral-500" />
                <span>Import JSON</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="space-y-2 pb-4 border-b border-neutral-100">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
              <Keyboard className="h-3.5 w-3.5" />
              <span>Keyboard Shortcuts</span>
            </div>
            <div className="space-y-1.5">
              {shortcuts.map((sc) => (
                <div key={sc.key} className="flex items-center justify-between text-xs py-1">
                  <span className="text-neutral-600">{sc.desc}</span>
                  <kbd className="px-2 py-0.5 text-[11px] font-mono bg-neutral-100 border border-neutral-200 rounded text-neutral-700">
                    {sc.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          {/* Danger / Reset Zone */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
              Workspace Actions
            </span>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => {
                  if (window.confirm('Reset workspace to sample tasks and projects?')) {
                    onResetDemoData();
                    onClose();
                  }
                }}
                className="flex-1 flex items-center justify-center gap-1.5 p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-xs font-medium text-neutral-700 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Demo Tasks</span>
              </button>

              <button
                onClick={() => {
                  if (window.confirm('Remove all completed tasks?')) {
                    onClearCompletedTasks();
                  }
                }}
                className="flex-1 flex items-center justify-center gap-1.5 p-2 rounded-lg border border-neutral-200 hover:bg-rose-50 hover:border-rose-200 text-xs font-medium text-rose-600 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Prune Completed</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-100 px-6 py-3 bg-neutral-50/50 flex items-center justify-between text-[11px] text-neutral-400">
          <span>Vantage Task Engine</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-200 bg-neutral-100 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
