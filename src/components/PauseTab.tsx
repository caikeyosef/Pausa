import { useEffect, useState } from 'react';
import { ArrowUpRight, CheckCircle2, Pause, Timer } from 'lucide-react';
import type { ActiveConsciousTimer, ArchetypeDetails, TabId } from '../types';
import { formatRemainingSeconds } from '../utils/pausaLogic';

interface PauseTabProps {
  dailyGoalMinutes: number;
  pausesWonToday: number;
  offlineCompletedCount: number;
  environmentProgress: { completed: number; total: number; percentage: number };
  archetype: ArchetypeDetails | null;
  activeTimer: ActiveConsciousTimer | null;
  onOpenPauseModal: () => void;
  onDismissTimer: () => void;
  onNavigateTab: (tab: TabId) => void;
}

export function PauseTab({
  dailyGoalMinutes,
  pausesWonToday,
  offlineCompletedCount,
  environmentProgress,
  archetype,
  activeTimer,
  onOpenPauseModal,
  onDismissTimer,
  onNavigateTab,
}: PauseTabProps) {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);

  useEffect(() => {
    if (!activeTimer) {
      setRemainingSeconds(0);
      return;
    }

    const updateRemaining = () => {
      const diffMs = new Date(activeTimer.endsAt).getTime() - Date.now();
      setRemainingSeconds(Math.max(0, Math.ceil(diffMs / 1000)));
    };

    updateRemaining();
    const interval = window.setInterval(updateRemaining, 1000);
    return () => window.clearInterval(interval);
  }, [activeTimer]);

  const timerEnded = Boolean(activeTimer) && remainingSeconds === 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
      {/* Primary Focal Column: The Conscious Pause Button */}
      <section className="lg:col-span-7 flex flex-col items-center text-center py-4 sm:py-8">
        <p className="text-xs sm:text-sm text-[#6B6F6C] mb-2">
          Menos piloto automático, mais presença.
        </p>

        {/* Quiet unboxed daily status metadata */}
        <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-xs sm:text-sm text-[#6B6F6C] mb-8 sm:mb-10">
          <span className="tabular-nums">
            Meta diária: <strong className="font-semibold text-[#2B2D2B]">{dailyGoalMinutes} min</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums" data-testid="pauses-won-today">
            Pausas vencidas hoje:{' '}
            <strong className="font-semibold text-[#2B2D2B]">{pausesWonToday}</strong>
          </span>
        </div>

        {/* Central Circular Sage Pause Button */}
        <div className="relative flex items-center justify-center">
          <div className="w-60 h-60 sm:w-68 sm:h-68 rounded-full border border-[#6A8D73]/20 flex items-center justify-center">
            <button
              type="button"
              onClick={onOpenPauseModal}
              className="w-52 h-52 sm:w-56 sm:h-56 rounded-full bg-[#6A8D73] hover:bg-[#587860] active:scale-[0.98] text-white flex flex-col items-center justify-center px-6 transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6A8D73] shadow-[0_14px_34px_-14px_rgba(106,141,115,0.55)] cursor-pointer"
            >
              <Pause className="w-7 h-7 mb-3 opacity-90" strokeWidth={1.6} aria-hidden="true" />
              <span className="text-xl sm:text-2xl font-semibold tracking-tight leading-tight">
                Fazer uma Pausa.
              </span>
              <span className="text-xs text-white/85 mt-2 leading-snug max-w-[160px]">
                Toque antes de abrir uma rede social
              </span>
            </button>
          </div>
        </div>

        {/* Optional Gentle Conscious Timer Banner */}
        {activeTimer && (
          <div className="mt-8 w-full max-w-md bg-white border border-[#E5E2DC] rounded-2xl p-4 sm:p-5 text-left flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#ECF2ED] text-[#6A8D73] flex items-center justify-center shrink-0">
                {timerEnded ? (
                  <CheckCircle2 className="w-5 h-5" strokeWidth={1.6} />
                ) : (
                  <Timer className="w-5 h-5" strokeWidth={1.6} />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#2B2D2B]">
                  {timerEnded
                    ? 'Seu tempo gentil chegou ao fim'
                    : 'Uso consciente em andamento'}
                </p>
                <p className="text-xs text-[#6B6F6C] mt-0.5 tabular-nums">
                  {timerEnded
                    ? 'Se quiser, este é um bom momento para fechar o aplicativo.'
                    : `Restam ${formatRemainingSeconds(remainingSeconds)} de ${activeTimer.durationMinutes} min`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onDismissTimer}
              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#E5E2DC] hover:bg-[#F6F4EF] text-xs font-medium text-[#2B2D2B] whitespace-nowrap shrink-0 transition-colors"
            >
              Encerrar
            </button>
          </div>
        )}
      </section>

      {/* Secondary Calm Rhythm Column */}
      <aside className="lg:col-span-5 space-y-4">
        <div className="bg-white border border-[#E5E2DC] rounded-2xl p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-[#2B2D2B] mb-4">
            Seu ritmo hoje
          </h2>
          <dl className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <dt className="text-xs text-[#6B6F6C]">Pausas vencidas hoje</dt>
              <dd className="text-2xl font-semibold text-[#2B2D2B] tabular-nums">
                {pausesWonToday}
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs text-[#6B6F6C]">Ações fora da tela</dt>
              <dd className="text-2xl font-semibold text-[#2B2D2B] tabular-nums">
                {offlineCompletedCount}
              </dd>
            </div>
            <div className="space-y-1 pt-3 border-t border-[#E5E2DC]">
              <dt className="text-xs text-[#6B6F6C]">Meta diária realista</dt>
              <dd className="text-base font-semibold text-[#6A8D73] tabular-nums">
                {dailyGoalMinutes} min/dia
              </dd>
            </div>
            <div className="space-y-1 pt-3 border-t border-[#E5E2DC]">
              <dt className="text-xs text-[#6B6F6C]">Blindagem do ambiente</dt>
              <dd className="text-base font-semibold text-[#2B2D2B] tabular-nums">
                {environmentProgress.completed}/{environmentProgress.total} ativos
              </dd>
            </div>
          </dl>
        </div>

        {archetype && (
          <div className="bg-white border border-[#E5E2DC] rounded-2xl p-5 sm:p-6">
            <p className="text-xs text-[#6B6F6C]">
              Perfil dominante · <span className="text-[#6A8D73] font-medium">{archetype.title}</span>
            </p>
            <p className="text-sm font-semibold text-[#2B2D2B] mt-1.5">
              {archetype.recommendationTitle}
            </p>
            <p className="text-sm text-[#6B6F6C] mt-1 leading-relaxed">
              {archetype.recommendationBody}
            </p>
            {archetype.recommendedTab !== 'pausar' && (
              <button
                type="button"
                onClick={() => onNavigateTab(archetype.recommendedTab)}
                className="mt-4 min-h-[44px] inline-flex items-center gap-1.5 text-sm font-medium text-[#6A8D73] hover:text-[#587860] transition-colors"
              >
                <span>{archetype.recommendedTabLabel}</span>
                <ArrowUpRight className="w-4 h-4" strokeWidth={1.7} />
              </button>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
