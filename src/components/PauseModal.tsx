import { useEffect, useState } from 'react';
import { Check, RefreshCw, Timer, X } from 'lucide-react';
import { TRIGGERS } from '../data/pausaContent';
import type { OfflineActivity, TriggerId } from '../types';
import { getCurrentDayPeriod, pickSurpriseActivity } from '../utils/pausaLogic';

interface PauseModalProps {
  isOpen: boolean;
  allActivities: OfflineActivity[];
  onClose: () => void;
  onResistedPause: () => void;
  onLogTriggerFromPause: (trigger: TriggerId, period: ReturnType<typeof getCurrentDayPeriod>) => void;
  onCompleteOfflineActivity: () => void;
  onStartConsciousTimer: (minutes: number | null) => void;
}

type PauseStage = 'breathing' | 'decision' | 'resisted_followup' | 'conscious_timer';

const PAUSE_DURATION_SECONDS = 8;

export function PauseModal({
  isOpen,
  allActivities,
  onClose,
  onResistedPause,
  onLogTriggerFromPause,
  onCompleteOfflineActivity,
  onStartConsciousTimer,
}: PauseModalProps) {
  const [stage, setStage] = useState<PauseStage>('breathing');
  const [secondsLeft, setSecondsLeft] = useState<number>(PAUSE_DURATION_SECONDS);
  const [selectedTrigger, setSelectedTrigger] = useState<TriggerId | null>(null);
  const [suggestedActivity, setSuggestedActivity] = useState<OfflineActivity | null>(null);
  const [activityDone, setActivityDone] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setStage('breathing');
    setSecondsLeft(PAUSE_DURATION_SECONDS);
    setSelectedTrigger(null);
    setActivityDone(false);
    setSuggestedActivity(pickSurpriseActivity(allActivities, 'all'));
  }, [isOpen, allActivities]);

  useEffect(() => {
    if (!isOpen || stage !== 'breathing') return;
    if (secondsLeft <= 0) {
      setStage('decision');
      return;
    }
    const timer = window.setTimeout(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [isOpen, stage, secondsLeft]);

  if (!isOpen) return null;

  const isInhale = secondsLeft > 4;

  const handleChooseResist = () => {
    onResistedPause();
    setStage('resisted_followup');
  };

  const handleTriggerTap = (triggerId: TriggerId) => {
    if (selectedTrigger) return;
    setSelectedTrigger(triggerId);
    onLogTriggerFromPause(triggerId, getCurrentDayPeriod());
  };

  const handleSwapActivity = () => {
    setSuggestedActivity((prev) =>
      pickSurpriseActivity(allActivities, 'all', prev?.id ?? null)
    );
    setActivityDone(false);
  };

  const handleMarkActivityDone = () => {
    if (activityDone) return;
    setActivityDone(true);
    onCompleteOfflineActivity();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pausa consciente"
      className="fixed inset-0 z-50 bg-[#F6F4EF] flex flex-col justify-between px-5 py-6 sm:p-10 overflow-y-auto"
    >
      {/* Top bar */}
      <div className="max-w-xl w-full mx-auto flex items-center justify-between">
        <span className="text-base font-semibold tracking-tight text-[#2B2D2B]">
          Pausa<span className="text-[#6A8D73]">.</span>
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar pausa"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#6B6F6C] hover:text-[#2B2D2B] hover:bg-[#EAE6DE] transition-colors"
        >
          <X className="w-5 h-5" strokeWidth={1.6} />
        </button>
      </div>

      {/* Main focal center */}
      <div className="max-w-xl w-full mx-auto my-auto py-8 flex flex-col items-center text-center">
        {(stage === 'breathing' || stage === 'decision') && (
          <>
            {/* Breathing circle */}
            <div className="relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center mb-8">
              <div
                aria-hidden="true"
                className={`absolute inset-0 rounded-full bg-[#6A8D73]/15 ${
                  stage === 'breathing' ? 'animate-breathe' : 'scale-100 opacity-70'
                }`}
              />
              <div
                aria-hidden="true"
                className="absolute inset-5 rounded-full border border-[#6A8D73]/30 bg-white/70"
              />
              <div className="relative z-10 flex flex-col items-center justify-center">
                {stage === 'breathing' ? (
                  <>
                    <span
                      data-testid="pause-countdown"
                      className="text-4xl font-semibold text-[#2B2D2B] tabular-nums"
                    >
                      {secondsLeft}s
                    </span>
                    <span className="text-xs font-medium text-[#6A8D73] mt-1.5">
                      {isInhale ? 'Inspire devagar...' : 'Solte o ar...'}
                    </span>
                  </>
                ) : (
                  <span className="text-sm font-medium text-[#6A8D73] px-4">
                    Pronto para escolher
                  </span>
                )}
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#2B2D2B] [text-wrap:balance] max-w-md leading-snug">
              Você realmente precisa abrir isso agora ou é piloto automático?
            </h2>

            {stage === 'breathing' ? (
              <p className="text-sm text-[#6B6F6C] mt-4 max-w-sm leading-relaxed">
                Aguarde alguns segundos para deixar o impulso inicial perder força.
              </p>
            ) : (
              <div className="w-full max-w-md mt-8 space-y-3">
                <button
                  type="button"
                  onClick={handleChooseResist}
                  className="w-full min-h-[52px] px-5 py-3.5 rounded-2xl bg-[#6A8D73] hover:bg-[#587860] text-white text-sm sm:text-base font-medium transition-colors"
                >
                  Desisti, quero outra coisa
                </button>
                <button
                  type="button"
                  onClick={() => setStage('conscious_timer')}
                  className="w-full min-h-[52px] px-5 py-3.5 rounded-2xl bg-white border border-[#E5E2DC] hover:bg-[#FAF9F6] text-[#2B2D2B] text-sm sm:text-base font-medium transition-colors"
                >
                  Vou abrir conscientemente
                </button>
              </div>
            )}
          </>
        )}

        {stage === 'resisted_followup' && (
          <div className="w-full text-left space-y-6">
            <div className="text-center">
              <p className="text-xs font-medium text-[#6A8D73] mb-1">
                Pausa registrada com presença
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-[#2B2D2B]">
                O que puxou sua atenção agora?
              </h2>
              <p className="text-sm text-[#6B6F6C] mt-1">
                Toque em 1 opção para salvar no seu Diário de Gatilhos.
              </p>
            </div>

            {/* 1-tap trigger buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {TRIGGERS.map((trigger) => {
                const isSelected = selectedTrigger === trigger.id;
                return (
                  <button
                    key={trigger.id}
                    type="button"
                    disabled={Boolean(selectedTrigger)}
                    onClick={() => handleTriggerTap(trigger.id)}
                    className={`min-h-[48px] px-3 py-2.5 rounded-xl border text-sm font-medium text-left transition-colors ${
                      isSelected
                        ? 'bg-[#6A8D73] border-[#6A8D73] text-white'
                        : selectedTrigger
                          ? 'bg-white/60 border-[#E5E2DC] text-[#6B6F6C]/60'
                          : 'bg-white border-[#E5E2DC] text-[#2B2D2B] hover:border-[#6A8D73]'
                    }`}
                  >
                    {trigger.label}
                  </button>
                );
              })}
            </div>

            {selectedTrigger && (
              <p className="text-xs text-[#6A8D73] text-center font-medium">
                Salvo no Diário de Gatilhos automaticamente.
              </p>
            )}

            {/* Instant offline suggestion */}
            {suggestedActivity && (
              <div className="bg-white border border-[#E5E2DC] rounded-2xl p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-[#6B6F6C]">
                      Sugestão fora da tela ·{' '}
                      {suggestedActivity.duration === '2min'
                        ? '2 min'
                        : suggestedActivity.duration === '15min'
                          ? '15 min'
                          : '30+ min'}
                    </p>
                    <p className="text-base font-semibold text-[#2B2D2B] mt-1">
                      {suggestedActivity.title}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSwapActivity}
                    aria-label="Sortear outra sugestão offline"
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#6B6F6C] hover:text-[#2B2D2B] hover:bg-[#F6F4EF] transition-colors shrink-0"
                  >
                    <RefreshCw className="w-4 h-4" strokeWidth={1.6} />
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    type="button"
                    onClick={handleMarkActivityDone}
                    disabled={activityDone}
                    className={`min-h-[44px] flex-1 px-4 py-2.5 rounded-xl text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors ${
                      activityDone
                        ? 'bg-[#ECF2ED] text-[#587860]'
                        : 'bg-[#6A8D73] hover:bg-[#587860] text-white'
                    }`}
                  >
                    <Check className="w-4 h-4" strokeWidth={1.8} />
                    <span>
                      {activityDone ? 'Concluída fora da tela' : 'Concluí fora da tela'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="min-h-[44px] px-4 py-2.5 rounded-xl border border-[#E5E2DC] bg-white hover:bg-[#FAF9F6] text-sm font-medium text-[#2B2D2B] transition-colors"
                  >
                    Voltar ao início
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {stage === 'conscious_timer' && (
          <div className="w-full max-w-md space-y-6">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#ECF2ED] text-[#6A8D73] flex items-center justify-center mx-auto mb-4">
                <Timer className="w-6 h-6" strokeWidth={1.6} />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-[#2B2D2B]">
                Tudo bem abrir com intenção
              </h2>
              <p className="text-sm text-[#6B6F6C] mt-2 leading-relaxed">
                Usar redes sociais conscientemente faz parte do equilíbrio. Quer um
                lembrete gentil para voltar depois?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  onStartConsciousTimer(5);
                  onClose();
                }}
                className="min-h-[52px] rounded-2xl bg-[#6A8D73] hover:bg-[#587860] text-white text-sm font-medium transition-colors"
              >
                Lembrar em 5 min
              </button>
              <button
                type="button"
                onClick={() => {
                  onStartConsciousTimer(10);
                  onClose();
                }}
                className="min-h-[52px] rounded-2xl bg-[#6A8D73] hover:bg-[#587860] text-white text-sm font-medium transition-colors"
              >
                Lembrar em 10 min
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                onStartConsciousTimer(null);
                onClose();
              }}
              className="w-full min-h-[48px] rounded-2xl border border-[#E5E2DC] bg-white hover:bg-[#FAF9F6] text-sm font-medium text-[#6B6F6C] hover:text-[#2B2D2B] transition-colors"
            >
              Abrir agora sem timer
            </button>
          </div>
        )}
      </div>

      {/* Subtle grounding footer */}
      <div className="max-w-xl w-full mx-auto text-center">
        <p className="text-xs text-[#6B6F6C]">
          Sem culpa, sem bloqueios forçados — apenas um espaço entre o impulso e a ação.
        </p>
      </div>
    </div>
  );
}
