import { useEffect, useRef, useState } from 'react';
import { Check, Minus, Pause, Play, Plus, X } from 'lucide-react';
import type { OfflineActivity } from '../types';
import {
  formatRemainingSeconds,
  getDefaultTimerMinutes,
} from '../utils/pausaLogic';

interface OfflineTimerModalProps {
  activity: OfflineActivity | null;
  onClose: () => void;
  onComplete: (activityId: string) => void;
}

const MIN_MINUTES = 1;
const MAX_MINUTES = 90;

export function OfflineTimerModal({
  activity,
  onClose,
  onComplete,
}: OfflineTimerModalProps) {
  const initialMinutes = activity ? getDefaultTimerMinutes(activity.duration) : 15;
  const [totalSeconds, setTotalSeconds] = useState(initialMinutes * 60);
  const [remainingSeconds, setRemainingSeconds] = useState(initialMinutes * 60);
  const [isRunning, setIsRunning] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);

  const endsAtRef = useRef<number | null>(null);
  const completedRef = useRef(false);

  // Reset whenever a new activity opens
  useEffect(() => {
    if (!activity) return;
    const secs = getDefaultTimerMinutes(activity.duration) * 60;
    setTotalSeconds(secs);
    setRemainingSeconds(secs);
    setIsRunning(true);
    setIsCompleted(false);
    completedRef.current = false;
    endsAtRef.current = Date.now() + secs * 1000;
  }, [activity]);

  // Wall-clock tick so locking the phone screen keeps time accurate
  useEffect(() => {
    if (!activity || !isRunning || isCompleted) return;
    if (endsAtRef.current === null) {
      endsAtRef.current = Date.now() + remainingSeconds * 1000;
    }

    const tick = () => {
      if (endsAtRef.current === null) return;
      const diff = Math.max(0, Math.ceil((endsAtRef.current - Date.now()) / 1000));
      setRemainingSeconds(diff);
      if (diff <= 0 && !completedRef.current) {
        completedRef.current = true;
        setIsRunning(false);
        setIsCompleted(true);
        onComplete(activity.id);
      }
    };

    tick();
    const interval = window.setInterval(tick, 500);
    return () => window.clearInterval(interval);
  }, [activity, isRunning, isCompleted, onComplete, remainingSeconds]);

  if (!activity) return null;

  const handleToggleRun = () => {
    if (isCompleted) return;
    if (isRunning) {
      endsAtRef.current = null;
      setIsRunning(false);
    } else {
      endsAtRef.current = Date.now() + remainingSeconds * 1000;
      setIsRunning(true);
    }
  };

  const handleAdjustMinutes = (deltaMinutes: number) => {
    if (isCompleted) return;
    const nextSeconds = Math.min(
      MAX_MINUTES * 60,
      Math.max(MIN_MINUTES * 60, remainingSeconds + deltaMinutes * 60)
    );
    setRemainingSeconds(nextSeconds);
    setTotalSeconds((prev) => Math.max(prev, nextSeconds));
    if (isRunning) {
      endsAtRef.current = Date.now() + nextSeconds * 1000;
    }
  };

  const handleFinishNow = () => {
    if (!completedRef.current) {
      completedRef.current = true;
      onComplete(activity.id);
    }
    setIsRunning(false);
    setIsCompleted(true);
    setRemainingSeconds(0);
    endsAtRef.current = null;
  };

  const progressRatio =
    totalSeconds > 0
      ? Math.min(1, Math.max(0, (totalSeconds - remainingSeconds) / totalSeconds))
      : 1;

  const radius = 92;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progressRatio);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Timer para ${activity.title}`}
      className="fixed inset-0 z-50 bg-[#F6F4EF] flex flex-col justify-between px-4 sm:px-10 pt-safe pb-safe overflow-y-auto"
    >
      {/* Top Bar */}
      <div className="max-w-lg w-full mx-auto flex items-center justify-between pt-4 sm:pt-8">
        <span className="text-base font-semibold tracking-tight text-[#2B2D2B]">
          Pausa<span className="text-[#6A8D73]">.</span>
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar timer"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#6B6F6C] hover:text-[#2B2D2B] hover:bg-[#EAE6DE] transition-colors"
        >
          <X className="w-5 h-5" strokeWidth={1.6} />
        </button>
      </div>

      {/* Main Centered Timer */}
      <div className="max-w-lg w-full mx-auto my-auto py-8 flex flex-col items-center text-center">
        <p className="text-xs font-medium text-[#6A8D73] mb-1.5">
          {isCompleted ? 'Atividade concluída fora da tela' : 'Tempo fora da tela'}
        </p>
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#2B2D2B] [text-wrap:balance] max-w-md">
          {activity.title}
        </h2>

        {/* Calm Circular Progress Ring */}
        <div className="relative w-56 h-56 flex items-center justify-center my-8">
          <svg
            viewBox="0 0 210 210"
            className="w-full h-full -rotate-90"
            aria-hidden="true"
          >
            <circle
              cx="105"
              cy="105"
              r={radius}
              fill="#FFFFFF"
              stroke="#E5E2DC"
              strokeWidth="4"
            />
            <circle
              cx="105"
              cy="105"
              r={radius}
              fill="none"
              stroke="#6A8D73"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-[stroke-dashoffset] duration-300"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {isCompleted ? (
              <div className="flex flex-col items-center gap-1.5 text-[#6A8D73]">
                <Check className="w-8 h-8" strokeWidth={1.8} />
                <span className="text-sm font-medium">Concluído</span>
              </div>
            ) : (
              <>
                <span
                  data-testid="offline-timer-display"
                  className="text-4xl font-semibold tracking-tight text-[#2B2D2B] tabular-nums"
                >
                  {formatRemainingSeconds(remainingSeconds)}
                </span>
                <span className="text-xs text-[#6B6F6C] mt-1">
                  {isRunning ? 'Em andamento' : 'Pausado'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Time Adjusters (when active) */}
        {!isCompleted && (
          <div className="flex items-center justify-center gap-2 mb-6">
            <button
              type="button"
              onClick={() => handleAdjustMinutes(-5)}
              disabled={remainingSeconds <= MIN_MINUTES * 60}
              aria-label="Diminuir 5 minutos"
              className="min-h-[40px] px-3 rounded-xl bg-white border border-[#E5E2DC] hover:bg-[#FAF9F6] disabled:opacity-40 text-xs font-medium text-[#2B2D2B] tabular-nums transition-colors"
            >
              -5 min
            </button>
            <button
              type="button"
              onClick={() => handleAdjustMinutes(-1)}
              disabled={remainingSeconds <= MIN_MINUTES * 60}
              aria-label="Diminuir 1 minuto"
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-white border border-[#E5E2DC] hover:bg-[#FAF9F6] disabled:opacity-40 text-[#2B2D2B] transition-colors"
            >
              <Minus className="w-4 h-4" strokeWidth={1.7} />
            </button>
            <button
              type="button"
              onClick={() => handleAdjustMinutes(1)}
              disabled={remainingSeconds >= MAX_MINUTES * 60}
              aria-label="Aumentar 1 minuto"
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-white border border-[#E5E2DC] hover:bg-[#FAF9F6] disabled:opacity-40 text-[#2B2D2B] transition-colors"
            >
              <Plus className="w-4 h-4" strokeWidth={1.7} />
            </button>
            <button
              type="button"
              onClick={() => handleAdjustMinutes(5)}
              disabled={remainingSeconds >= MAX_MINUTES * 60}
              aria-label="Aumentar 5 minutos"
              className="min-h-[40px] px-3 rounded-xl bg-white border border-[#E5E2DC] hover:bg-[#FAF9F6] disabled:opacity-40 text-xs font-medium text-[#2B2D2B] tabular-nums transition-colors"
            >
              +5 min
            </button>
          </div>
        )}

        {/* Primary Controls */}
        {!isCompleted ? (
          <div className="w-full max-w-sm grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleToggleRun}
              className="min-h-[48px] px-4 py-3 rounded-xl bg-white border border-[#E5E2DC] hover:bg-[#FAF9F6] text-sm font-medium text-[#2B2D2B] inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4" strokeWidth={1.7} />
                  <span>Pausar</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" strokeWidth={1.7} />
                  <span>Continuar</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleFinishNow}
              className="min-h-[48px] px-4 py-3 rounded-xl bg-[#6A8D73] hover:bg-[#587860] text-white text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
            >
              <Check className="w-4 h-4" strokeWidth={1.8} />
              <span>Concluir</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4 w-full max-w-sm">
            <p className="text-sm text-[#6B6F6C]">
              Sua ação fora da tela foi contabilizada automaticamente.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-[#6A8D73] hover:bg-[#587860] text-white text-sm font-medium transition-colors"
            >
              Voltar ao Cardápio Offline
            </button>
          </div>
        )}
      </div>

      {/* Subtle footer sentence */}
      <div className="max-w-lg w-full mx-auto text-center">
        <p className="text-xs text-[#6B6F6C]">
          Pode bloquear a tela se preferir
        </p>
      </div>
    </div>
  );
}
