import { useEffect, useState } from 'react';
import { ArrowRight, RotateCcw, X, Database, Trash2 } from 'lucide-react';
import { LIKERT_LABELS, PROFILE_QUESTIONS } from '../data/pausaContent';
import type { DigitalProfile, DimensionKey, ProfileAnswers, TabId } from '../types';
import { calculateDominantArchetype, DEFAULT_PROFILE_ANSWERS } from '../utils/pausaLogic';
import { ProfileRadarChart } from './ProfileRadarChart';

interface ProfileMapModalProps {
  mode: 'onboarding' | 'profile';
  existingProfile: DigitalProfile | null;
  onSaveProfile: (profile: DigitalProfile, navigateToTab?: TabId) => void;
  onFinishOnboarding?: (navigateToTab?: TabId) => void;
  onClose?: () => void;
  onLoadSampleData: () => void;
  onClearAllData: () => void;
}

export function ProfileMapModal({
  mode,
  existingProfile,
  onSaveProfile,
  onFinishOnboarding,
  onClose,
  onLoadSampleData,
  onClearAllData,
}: ProfileMapModalProps) {
  const [step, setStep] = useState<'questions' | 'result'>(
    mode === 'profile' && existingProfile ? 'result' : 'questions'
  );
  const [answers, setAnswers] = useState<ProfileAnswers>(
    existingProfile?.answers ?? DEFAULT_PROFILE_ANSWERS
  );
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState<number>(
    existingProfile?.dailyGoalMinutes ?? 45
  );
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (existingProfile) {
      setAnswers(existingProfile.answers);
      setDailyGoalMinutes(existingProfile.dailyGoalMinutes);
    }
  }, [existingProfile]);

  const archetype = calculateDominantArchetype(answers);

  const handleAnswerChange = (key: DimensionKey, value: number) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const handleFinishQuestions = () => {
    const updated: DigitalProfile = {
      answers,
      dailyGoalMinutes,
      completedAt: new Date().toISOString(),
    };
    onSaveProfile(updated);
    setStep('result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateGoal = (nextMinutes: number) => {
    setDailyGoalMinutes(nextMinutes);
    if (step === 'result') {
      onSaveProfile({
        answers,
        dailyGoalMinutes: nextMinutes,
        completedAt: existingProfile?.completedAt ?? new Date().toISOString(),
      });
    }
  };

  const handleEnterRecommended = () => {
    onSaveProfile(
      {
        answers,
        dailyGoalMinutes,
        completedAt: existingProfile?.completedAt ?? new Date().toISOString(),
      },
      archetype.recommendedTab
    );
    if (mode === 'onboarding') {
      onFinishOnboarding?.(archetype.recommendedTab);
    } else {
      onClose?.();
    }
  };

  const handleResetToSample = () => {
    onLoadSampleData();
    setConfirmClear(false);
    setStep('result');
  };

  const handleConfirmClear = () => {
    onClearAllData();
    setConfirmClear(false);
  };

  const isOverlay = mode === 'profile';

  const content = (
    <div className="w-full max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-medium text-[#6A8D73] mb-1">
            {step === 'questions' ? 'Mapa do Perfil Digital' : 'Seu Perfil Digital'}
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#2B2D2B] [text-wrap:balance]">
            {step === 'questions'
              ? 'Como o celular entra na sua rotina hoje?'
              : archetype.title}
          </h1>
          <p className="text-sm text-[#6B6F6C] mt-1.5 max-w-xl leading-relaxed">
            {step === 'questions'
              ? 'Responda sem julgamento. O objetivo não é zerar telas, mas encontrar um ritmo mais consciente.'
              : archetype.summary}
          </p>
        </div>

        {isOverlay && onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar perfil"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#6B6F6C] hover:text-[#2B2D2B] hover:bg-[#EFECE5] transition-colors shrink-0"
          >
            <X className="w-5 h-5" strokeWidth={1.6} />
          </button>
        )}
      </div>

      {step === 'questions' ? (
        <div className="space-y-4">
          {PROFILE_QUESTIONS.map((q, index) => {
            const currentVal = answers[q.key];
            return (
              <section
                key={q.key}
                className="bg-white border border-[#E5E2DC] rounded-2xl p-5 sm:p-6"
              >
                <div className="flex items-baseline justify-between gap-3 mb-2">
                  <span className="text-xs font-medium text-[#6B6F6C]">
                    {index + 1}. {q.dimensionTitle}
                  </span>
                  <span className="text-xs text-[#6A8D73] font-medium tabular-nums shrink-0">
                    {LIKERT_LABELS.find((l) => l.value === currentVal)?.label}
                  </span>
                </div>
                <p className="text-[15px] text-[#2B2D2B] leading-relaxed mb-4">
                  “{q.statement}”
                </p>

                <div
                  role="radiogroup"
                  aria-label={q.dimensionTitle}
                  className="grid grid-cols-5 gap-2"
                >
                  {LIKERT_LABELS.map((option) => {
                    const selected = currentVal === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        aria-label={`${q.dimensionTitle}: ${option.value} - ${option.label}`}
                        onClick={() => handleAnswerChange(q.key, option.value)}
                        className={`min-h-[44px] rounded-xl border text-sm font-medium tabular-nums transition-colors flex flex-col items-center justify-center px-1 py-2 ${
                          selected
                            ? 'bg-[#6A8D73] border-[#6A8D73] text-white'
                            : 'bg-[#FAF9F6] border-[#E5E2DC] text-[#2B2D2B] hover:border-[#6A8D73]/50'
                        }`}
                      >
                        <span>{option.value}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[11px] text-[#6B6F6C] mt-2 px-0.5">
                  <span>1 · Quase nunca</span>
                  <span>5 · Quase sempre</span>
                </div>
              </section>
            );
          })}

          {/* Daily Realistic Goal Selector */}
          <section className="bg-white border border-[#E5E2DC] rounded-2xl p-5 sm:p-6">
            <div className="flex items-baseline justify-between gap-4 mb-1">
              <label
                htmlFor="onboarding-goal-slider"
                className="text-base font-semibold text-[#2B2D2B]"
              >
                Seu Ponto Ideal em redes sociais
              </label>
              <span className="text-xl font-semibold text-[#6A8D73] tabular-nums whitespace-nowrap">
                {dailyGoalMinutes} min/dia
              </span>
            </div>
            <p className="text-sm text-[#6B6F6C] mb-5 leading-relaxed">
              Pesquisas em saúde digital mostram que metas moderadas entre 30 e 60 minutos
              por dia são mais sustentáveis do que cortar tudo de uma vez.
            </p>
            <input
              id="onboarding-goal-slider"
              type="range"
              min={20}
              max={90}
              step={5}
              value={dailyGoalMinutes}
              onChange={(e) => setDailyGoalMinutes(Number(e.target.value))}
              className="w-full pausa-slider"
            />
            <div className="flex justify-between text-xs text-[#6B6F6C] tabular-nums mt-2">
              <span>20 min</span>
              <span>45 min (sugerido)</span>
              <span>90 min</span>
            </div>
          </section>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            {mode === 'onboarding' ? (
              <button
                type="button"
                onClick={handleResetToSample}
                className="min-h-[44px] px-4 py-2.5 text-sm font-medium text-[#6B6F6C] hover:text-[#2B2D2B] rounded-xl transition-colors text-center sm:text-left"
              >
                Ver exemplo preenchido
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStep('result')}
                className="min-h-[44px] px-4 py-2.5 text-sm font-medium text-[#6B6F6C] hover:text-[#2B2D2B] rounded-xl transition-colors"
              >
                Cancelar
              </button>
            )}

            <button
              type="button"
              onClick={handleFinishQuestions}
              className="min-h-[48px] px-6 py-3 rounded-xl bg-[#6A8D73] hover:bg-[#587860] text-white text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
            >
              <span>Ver meu Mapa Digital</span>
              <ArrowRight className="w-4 h-4" strokeWidth={1.8} />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Chart Card */}
          <section className="bg-white border border-[#E5E2DC] rounded-2xl p-5 sm:p-6">
            <div className="flex items-center justify-between gap-2 mb-5">
              <h2 className="text-sm font-semibold text-[#2B2D2B]">
                As 6 dimensões do seu hábito digital
              </h2>
              <span className="text-xs text-[#6B6F6C] tabular-nums">Escala 1 a 5</span>
            </div>
            <ProfileRadarChart answers={answers} />
          </section>

          {/* Recommended starting point & Daily Goal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <section className="bg-white border border-[#E5E2DC] rounded-2xl p-5 flex flex-col justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-[#6A8D73] mb-1">
                  Próximo passo sugerido
                </p>
                <h2 className="text-base font-semibold text-[#2B2D2B]">
                  {archetype.recommendationTitle}
                </h2>
                <p className="text-sm text-[#6B6F6C] mt-1.5 leading-relaxed">
                  {archetype.recommendationBody}
                </p>
              </div>
              <button
                type="button"
                onClick={handleEnterRecommended}
                className="min-h-[44px] w-full px-4 py-2.5 rounded-xl bg-[#6A8D73] hover:bg-[#587860] text-white text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
              >
                <span>{archetype.recommendedTabLabel}</span>
                <ArrowRight className="w-4 h-4" strokeWidth={1.8} />
              </button>
            </section>

            <section className="bg-white border border-[#E5E2DC] rounded-2xl p-5 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <label
                    htmlFor="profile-goal-slider"
                    className="text-base font-semibold text-[#2B2D2B]"
                  >
                    Seu Ponto Ideal
                  </label>
                  <span className="text-lg font-semibold text-[#6A8D73] tabular-nums whitespace-nowrap">
                    {dailyGoalMinutes} min/dia
                  </span>
                </div>
                <p className="text-sm text-[#6B6F6C] leading-relaxed">
                  Ajuste sua meta realista sempre que sua semana mudar. Redução gradual
                  funciona melhor que cobrança.
                </p>
              </div>
              <div>
                <input
                  id="profile-goal-slider"
                  type="range"
                  min={20}
                  max={90}
                  step={5}
                  value={dailyGoalMinutes}
                  onChange={(e) => handleUpdateGoal(Number(e.target.value))}
                  className="w-full pausa-slider"
                />
                <div className="flex justify-between text-xs text-[#6B6F6C] tabular-nums mt-2">
                  <span>20 min</span>
                  <span>45 min</span>
                  <span>90 min</span>
                </div>
              </div>
            </section>
          </div>

          {/* Utility row: Refazer + Carregar dados de exemplo / Limpar dados */}
          <div className="pt-3 border-t border-[#E5E2DC] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep('questions')}
              className="min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-medium text-[#2B2D2B] hover:bg-[#EFECE5] inline-flex items-center justify-center sm:justify-start gap-2 transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4 text-[#6B6F6C]" strokeWidth={1.6} />
              <span>Refazer Mapa</span>
            </button>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleResetToSample}
                className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#E5E2DC] bg-white hover:bg-[#FAF9F6] text-xs font-medium text-[#2B2D2B] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <Database className="w-3.5 h-3.5 text-[#6A8D73]" strokeWidth={1.6} />
                <span>Carregar dados de exemplo</span>
              </button>

              {!confirmClear ? (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-medium text-[#6B6F6C] hover:text-[#2B2D2B] hover:bg-[#EFECE5] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={1.6} />
                  <span>Limpar dados</span>
                </button>
              ) : (
                <div className="inline-flex items-center gap-1.5 bg-white border border-[#E5E2DC] rounded-xl px-2.5 py-1">
                  <span className="text-xs text-[#6B6F6C]">Limpar tudo?</span>
                  <button
                    type="button"
                    onClick={handleConfirmClear}
                    className="min-h-[36px] px-2.5 rounded-lg bg-[#2B2D2B] text-white text-xs font-medium hover:bg-[#3D403D] transition-colors"
                  >
                    Confirmar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="min-h-[36px] px-2 rounded-lg text-xs text-[#6B6F6C] hover:text-[#2B2D2B]"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (!isOverlay) {
    return (
      <main className="min-h-dvh bg-[#F6F4EF] px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-3xl mx-auto mb-8 flex items-center justify-between">
          <span className="text-xl font-semibold tracking-tight text-[#2B2D2B]">
            Pausa<span className="text-[#6A8D73]">.</span>
          </span>
          <span className="text-xs text-[#6B6F6C]">
            Menos piloto automático, mais presença.
          </span>
        </div>
        {content}
      </main>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Meu Perfil Digital"
      className="fixed inset-0 z-50 bg-[#F6F4EF]/95 backdrop-blur-sm overflow-y-auto px-4 sm:px-6 py-6 sm:py-10"
    >
      {content}
    </div>
  );
}
