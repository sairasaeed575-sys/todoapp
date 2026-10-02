import React, { useState, useEffect } from 'react';
import { PomodoroMode, PomodoroState, Task } from '../types';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Maximize2,
  Minimize2,
  X,
  CheckCircle2,
  Flame,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { playClickSound, playTimerFinishSound, playTaskCompleteSound } from '../utils/audio';

interface PomodoroTimerProps {
  state: PomodoroState;
  setState: React.Dispatch<React.SetStateAction<PomodoroState>>;
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onToggleTaskComplete: (taskId: string) => void;
  onIncrementTaskPomodoro: (taskId: string) => void;
}

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  state,
  setState,
  isOpen,
  onClose,
  tasks,
  onToggleTaskComplete,
  onIncrementTaskPomodoro,
}) => {
  const [isZenMode, setIsZenMode] = useState(false);

  const activeTask = tasks.find((t) => t.id === state.activeTaskId);

  // Time configurations (in seconds)
  const MODE_TIMES: Record<PomodoroMode, number> = {
    work: 25 * 60,
    short_break: 5 * 60,
    long_break: 15 * 60,
  };

  // Timer tick effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (state.isRunning) {
      interval = setInterval(() => {
        setState((prev) => {
          if (prev.timeLeft <= 1) {
            playTimerFinishSound();

            if (prev.mode === 'work') {
              if (prev.activeTaskId) {
                onIncrementTaskPomodoro(prev.activeTaskId);
              }
              const nextSessions = prev.sessionsCompletedToday + 1;
              const nextMode: PomodoroMode = nextSessions % 4 === 0 ? 'long_break' : 'short_break';
              return {
                ...prev,
                mode: nextMode,
                timeLeft: MODE_TIMES[nextMode],
                isRunning: false,
                sessionsCompletedToday: nextSessions,
                totalFocusMinutesToday: prev.totalFocusMinutesToday + 25,
              };
            } else {
              return {
                ...prev,
                mode: 'work',
                timeLeft: MODE_TIMES['work'],
                isRunning: false,
              };
            }
          }

          return {
            ...prev,
            timeLeft: prev.timeLeft - 1,
          };
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.isRunning, onIncrementTaskPomodoro]);

  if (!isOpen && !isZenMode) return null;

  const toggleRunning = () => {
    playClickSound();
    setState((prev) => ({ ...prev, isRunning: !prev.isRunning }));
  };

  const handleReset = () => {
    playClickSound();
    setState((prev) => ({
      ...prev,
      timeLeft: MODE_TIMES[prev.mode],
      isRunning: false,
    }));
  };

  const handleSwitchMode = (newMode: PomodoroMode) => {
    playClickSound();
    setState((prev) => ({
      ...prev,
      mode: newMode,
      timeLeft: MODE_TIMES[newMode],
      isRunning: false,
    }));
  };

  const handleSkip = () => {
    playClickSound();
    if (state.mode === 'work') {
      const nextSessions = state.sessionsCompletedToday + 1;
      const nextMode: PomodoroMode = nextSessions % 4 === 0 ? 'long_break' : 'short_break';
      setState((prev) => ({
        ...prev,
        mode: nextMode,
        timeLeft: MODE_TIMES[nextMode],
        isRunning: false,
      }));
    } else {
      setState((prev) => ({
        ...prev,
        mode: 'work',
        timeLeft: MODE_TIMES['work'],
        isRunning: false,
      }));
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalModeDuration = MODE_TIMES[state.mode];
  const progressPercent = ((totalModeDuration - state.timeLeft) / totalModeDuration) * 100;

  // Zen Focus Mode Overlay
  if (isZenMode) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-neutral-950 text-white p-6 sm:p-12 animate-in fade-in duration-200">
        {/* Top Controls */}
        <div className="w-full max-w-4xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Zen Focus State
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsZenMode(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-xs font-medium text-neutral-300 border border-neutral-800"
            >
              <Minimize2 className="h-3.5 w-3.5" />
              <span>Exit Zen Mode</span>
            </button>
          </div>
        </div>

        {/* Center Display */}
        <div className="flex flex-col items-center justify-center text-center space-y-6 max-w-lg">
          {/* Active Task Info */}
          {activeTask ? (
            <div className="space-y-1">
              <span className="text-xs text-amber-400 font-semibold tracking-wide uppercase">
                Active Objective
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white line-clamp-2">
                {activeTask.title}
              </h2>
              {activeTask.description && (
                <p className="text-xs text-neutral-400 max-w-md line-clamp-2">
                  {activeTask.description}
                </p>
              )}
            </div>
          ) : (
            <div className="text-xs text-neutral-500">
              No task bound. Focus on your primary priority.
            </div>
          )}

          {/* Huge Timer */}
          <div className="text-7xl sm:text-9xl font-bold font-mono tabular-nums text-white tracking-tighter select-none">
            {formatTime(state.timeLeft)}
          </div>

          <div className="flex items-center gap-2 text-xs text-neutral-400 capitalize">
            <span>{state.mode.replace('_', ' ')}</span>
            <span>·</span>
            <span className="font-mono tabular-nums">
              Session {state.sessionsCompletedToday + 1}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 pt-4">
            <button
              onClick={handleReset}
              className="h-12 w-12 flex items-center justify-center rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors border border-neutral-800"
              title="Reset timer"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            <button
              onClick={toggleRunning}
              className="h-16 w-16 flex items-center justify-center rounded-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold shadow-lg shadow-amber-500/20 transition-transform active:scale-95"
            >
              {state.isRunning ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7 ml-1" />}
            </button>

            <button
              onClick={handleSkip}
              className="h-12 w-12 flex items-center justify-center rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors border border-neutral-800"
              title="Skip interval"
            >
              <SkipForward className="h-4 w-4" />
            </button>
          </div>

          {/* Quick complete active task in zen mode */}
          {activeTask && (
            <button
              onClick={() => {
                playTaskCompleteSound();
                onToggleTaskComplete(activeTask.id);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-xs font-medium text-emerald-400 border border-neutral-800 mt-4"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Mark Task Completed</span>
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="text-[11px] text-neutral-600 font-mono">
          Press Space to toggle · Esc to exit
        </div>
      </div>
    );
  }

  // Floating Popover Mode
  return (
    <div className="fixed bottom-6 right-6 z-40 w-80 rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xl animate-in slide-in-from-bottom-5 duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
        <div className="flex items-center gap-1.5">
          <Flame className="h-4 w-4 text-amber-500" />
          <span className="text-xs font-bold text-neutral-900">Focus Assistant</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsZenMode(true)}
            className="h-7 w-7 flex items-center justify-center rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            title="Full-screen Zen Mode"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onClose}
            className="h-7 w-7 flex items-center justify-center rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center gap-1 rounded-lg bg-neutral-100 p-1 my-3 text-xs">
        <button
          onClick={() => handleSwitchMode('work')}
          className={`flex-1 py-1 rounded text-center font-medium transition-colors ${
            state.mode === 'work' ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Focus (25m)
        </button>
        <button
          onClick={() => handleSwitchMode('short_break')}
          className={`flex-1 py-1 rounded text-center font-medium transition-colors ${
            state.mode === 'short_break' ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Short (5m)
        </button>
        <button
          onClick={() => handleSwitchMode('long_break')}
          className={`flex-1 py-1 rounded text-center font-medium transition-colors ${
            state.mode === 'long_break' ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Long (15m)
        </button>
      </div>

      {/* Active Task Link */}
      <div className="my-2 p-2 rounded-lg bg-neutral-50 border border-neutral-200/60 text-xs">
        <span className="text-[10px] uppercase font-semibold text-neutral-400 block mb-0.5">
          Bound Task
        </span>
        {activeTask ? (
          <div className="flex items-center justify-between gap-1">
            <span className="font-medium text-neutral-800 truncate">{activeTask.title}</span>
            <button
              onClick={() => {
                playTaskCompleteSound();
                onToggleTaskComplete(activeTask.id);
              }}
              className="text-neutral-400 hover:text-emerald-600 shrink-0"
              title="Mark done"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <span className="text-neutral-500 italic">No specific task selected</span>
        )}
      </div>

      {/* Main Timer Display */}
      <div className="my-4 text-center">
        <div className="text-5xl font-bold font-mono tabular-nums text-neutral-900 tracking-tight">
          {formatTime(state.timeLeft)}
        </div>

        {/* Progress track */}
        <div className="mt-3 h-1.5 w-full rounded-full bg-neutral-100 overflow-hidden">
          <div
            className="h-full bg-amber-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 pt-1">
        <button
          onClick={handleReset}
          className="h-9 w-9 flex items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors"
          title="Reset"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        <button
          onClick={toggleRunning}
          className="h-10 px-5 flex items-center gap-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs shadow-xs transition-colors"
        >
          {state.isRunning ? (
            <>
              <Pause className="h-4 w-4" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="h-4 w-4 fill-current" />
              <span>Start</span>
            </>
          )}
        </button>

        <button
          onClick={handleSkip}
          className="h-9 w-9 flex items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors"
          title="Skip"
        >
          <SkipForward className="h-4 w-4" />
        </button>
      </div>

      {/* Bottom status */}
      <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500">
        <span>Today: {state.sessionsCompletedToday} sessions</span>
        <span className="font-mono tabular-nums">{state.totalFocusMinutesToday}m logged</span>
      </div>
    </div>
  );
};
