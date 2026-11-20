import { useState } from 'react';
import { BookOpen, Loader2, Moon, Sparkles, Trash2 } from 'lucide-react';
import { DAY_PERIODS, TRIGGERS } from '../data/pausaContent';
import type {
  DayPeriodId,
  DigitalProfile,
  JournalEntry,
  PatternAnalysisResult,
  TriggerId,
} from '../types';
import {
  analyzeJournalEntries,
  calculateDominantArchetype,
  formatRelativeDatePtBr,
  getCurrentDayPeriod,
  getDimensionScores,
} from '../utils/pausaLogic';

interface JournalTabProps {
  entries: JournalEntry[];
  profile: DigitalProfile | null;
  environmentCompleted: number;
  environmentTotal: number;
  pausesWonToday: number;
  lastAnalysis: PatternAnalysisResult | null;
  onAddEntry: (trigger: TriggerId, period: DayPeriodId, needNote?: string) => void;
  onDeleteEntry: (id: string) => void;
  onSaveAnalysis: (analysis: PatternAnalysisResult) => void;
}

export function JournalTab({
  entries,
  profile,
  environmentCompleted,
  environmentTotal,
  pausesWonToday,
  lastAnalysis,
  onAddEntry,
  onDeleteEntry,
  onSaveAnalysis,
}: JournalTabProps) {
  const [selectedTrigger, setSelectedTrigger] = useState<TriggerId>('comparacao');
  const [selectedPeriod, setSelectedPeriod] = useState<DayPeriodId>(() =>
    getCurrentDayPeriod()
  );
  const [needNote, setNeedNote] = useState('');
  const [justSaved, setJustSaved] = useState(false);
  const [showComparisonReminder, setShowComparisonReminder] = useState(false);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const analytics = analyzeJournalEntries(entries);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddEntry(selectedTrigger, selectedPeriod, needNote.trim() || undefined);
    setNeedNote('');
    setJustSaved(true);
    setShowComparisonReminder(selectedTrigger === 'comparacao');
    window.setTimeout(() => setJustSaved(false), 2000);
  };

  const handleAnalyzePatterns = async () => {
    if (entries.length === 0 && !profile) {
      setAnalysisError(
        'Adicione ao menos um registro no diário para analisar seus padrões.'
      );
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const archetype = profile ? calculateDominantArchetype(profile.answers) : null;
      const payload = {
        profile: profile
          ? {
              dominantTitle: archetype?.title ?? 'Equilíbrio em Construção',
              dailyGoalMinutes: profile.dailyGoalMinutes,
              dimensions: getDimensionScores(profile.answers).map((d) => ({
                label: d.label,
                score: d.score,
              })),
            }
          : null,
        journalSummary: {
          totalEntries: analytics.totalEntries,
          topTriggers: analytics.topTriggers.map((t) => ({
            label: t.label,
            count: t.count,
            percentage: t.percentage,
          })),
          periodDistribution: analytics.periodDistribution.map((p) => ({
            label: p.label,
            count: p.count,
          })),
          isBedtimeConcentrated: analytics.isBedtimeConcentrated,
          comparisonCount: entries.filter((e) => e.trigger === 'comparacao').length,
          recentReflections: entries.slice(0, 10).map((entry) => ({
            trigger:
              TRIGGERS.find((t) => t.id === entry.trigger)?.label ?? entry.trigger,
            period:
              DAY_PERIODS.find((p) => p.id === entry.period)?.label ?? entry.period,
            needNote: entry.needNote,
          })),
        },
        environmentCompleted,
        environmentTotal,
        pausesWonToday,
      };

      const res = await fetch('/api/analyze-patterns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as {
        summary?: string;
        recommendations?: Array<{ title: string; action: string }>;
        error?: string;
      };

      if (!res.ok) {
        throw new Error(
          data.error || 'Não foi possível concluir a análise agora.'
        );
      }

      if (!data.summary || !Array.isArray(data.recommendations)) {
        throw new Error('Resposta inesperada ao analisar padrões.');
      }

      onSaveAnalysis({
        summary: data.summary,
        recommendations: data.recommendations,
        generatedAt: new Date().toISOString(),
      });
    } catch (err) {
      setAnalysisError(
        err instanceof Error
          ? err.message
          : 'Erro de conexão ao consultar a análise de padrões.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const maxPeriodCount = Math.max(
    ...analytics.periodDistribution.map((p) => p.count),
    1
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#2B2D2B]">
          Diário de Gatilhos
        </h1>
        <p className="text-sm text-[#6B6F6C] mt-1">
          Observar o impulso em 1 toque ajuda a descobrir o que você realmente busca quando
          pega o celular.
        </p>
      </div>

      {/* Main 2-column layout on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: 1-tap Fast Logger */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-5 bg-white border border-[#E5E2DC] rounded-2xl p-5 sm:p-6 space-y-5"
        >
          <div>
            <h2 className="text-base font-semibold text-[#2B2D2B]">
              Registro rápido
            </h2>
            <p className="text-xs text-[#6B6F6C] mt-0.5">
              Qual gatilho emocional apareceu?
            </p>
          </div>

          <div
            role="radiogroup"
            aria-label="Selecionar gatilho emocional"
            className="grid grid-cols-2 gap-2"
          >
            {TRIGGERS.map((trigger) => {
              const selected = selectedTrigger === trigger.id;
              return (
                <button
                  key={trigger.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setSelectedTrigger(trigger.id)}
                  className={`min-h-[48px] px-3 py-2.5 rounded-xl border text-left transition-colors ${
                    selected
                      ? 'bg-[#6A8D73] border-[#6A8D73] text-white'
                      : 'bg-[#FAF9F6] border-[#E5E2DC] text-[#2B2D2B] hover:border-[#6A8D73]/50'
                  }`}
                >
                  <span className="block text-sm font-medium leading-tight">
                    {trigger.label}
                  </span>
                  <span
                    className={`block text-[11px] mt-0.5 ${
                      selected ? 'text-white/85' : 'text-[#6B6F6C]'
                    }`}
                  >
                    {trigger.hint}
                  </span>
                </button>
              );
            })}
          </div>

          <div>
            <p className="text-xs font-medium text-[#6B6F6C] mb-2">
              Período do dia
            </p>
            <div
              role="radiogroup"
              aria-label="Selecionar período do dia"
              className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2"
            >
              {DAY_PERIODS.map((period) => {
                const selected = selectedPeriod === period.id;
                return (
                  <button
                    key={period.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setSelectedPeriod(period.id)}
                    className={`min-h-[42px] px-3 py-2 rounded-xl border text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                      selected
                        ? 'bg-[#ECF2ED] border-[#6A8D73] text-[#2B2D2B]'
                        : 'bg-[#FAF9F6] border-[#E5E2DC] text-[#6B6F6C] hover:text-[#2B2D2B]'
                    }`}
                  >
                    {period.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label
              htmlFor="journal-need-note"
              className="block text-xs font-medium text-[#6B6F6C] mb-1.5"
            >
              O que eu realmente precisava nesse momento? (opcional)
            </label>
            <input
              id="journal-need-note"
              type="text"
              value={needNote}
              onChange={(e) => setNeedNote(e.target.value)}
              placeholder="Ex.: descansar os olhos, respirar, companhia..."
              maxLength={140}
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E5E2DC] text-sm text-[#2B2D2B] placeholder:text-[#6B6F6C]/70 focus:outline-none focus:border-[#6A8D73]"
            />
          </div>

          <button
            type="submit"
            className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-[#6A8D73] hover:bg-[#587860] text-white text-sm font-medium transition-colors"
          >
            {justSaved ? 'Registro salvo no diário' : 'Registrar no diário'}
          </button>

          {showComparisonReminder && (
            <p
              role="status"
              data-testid="comparison-reminder"
              className="text-xs sm:text-sm text-[#2B2D2B] bg-[#F6F4EF] border border-[#E5E2DC] rounded-xl p-3.5 leading-relaxed"
            >
              Lembrete: o feed mistura o melhor recorte de dezenas de vidas contra um dia
              comum da sua.
            </p>
          )}
        </form>

        {/* Right: Insights + Gemini Pattern Analysis + History */}
        <div className="lg:col-span-7 space-y-5">
          {/* Top 3 Triggers & Period Distribution */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <section className="bg-white border border-[#E5E2DC] rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-[#2B2D2B] mb-4">
                Top 3 gatilhos frequentes
              </h2>
              {analytics.topTriggers.length === 0 ? (
                <p className="text-xs text-[#6B6F6C] leading-relaxed">
                  Seus gatilhos mais comuns aparecerão aqui assim que você fizer o
                  primeiro registro.
                </p>
              ) : (
                <div className="space-y-3.5">
                  {analytics.topTriggers.map((item) => (
                    <div key={item.id} className="space-y-1.5">
                      <div className="flex items-baseline justify-between gap-2 text-sm">
                        <span className="font-medium text-[#2B2D2B] truncate">
                          {item.label}
                        </span>
                        <span className="text-xs text-[#6B6F6C] tabular-nums shrink-0">
                          {item.count}x · {item.percentage}%
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-[#F0EDE6] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#6A8D73]"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="bg-white border border-[#E5E2DC] rounded-2xl p-5 flex flex-col justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-[#2B2D2B] mb-4">
                  Distribuição por período
                </h2>
                <div className="space-y-3">
                  {analytics.periodDistribution.map((period) => {
                    const widthPct =
                      analytics.totalEntries > 0
                        ? Math.round((period.count / maxPeriodCount) * 100)
                        : 0;
                    const highlightBedtime =
                      period.id === 'antes_dormir' && analytics.isBedtimeConcentrated;
                    return (
                      <div key={period.id} className="space-y-1">
                        <div className="flex items-baseline justify-between text-xs">
                          <span
                            className={
                              highlightBedtime
                                ? 'font-semibold text-[#6A8D73]'
                                : 'text-[#2B2D2B]'
                            }
                          >
                            {period.label}
                          </span>
                          <span className="text-[#6B6F6C] tabular-nums">
                            {period.count}
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-[#F0EDE6] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              highlightBedtime ? 'bg-[#587860]' : 'bg-[#6A8D73]/65'
                            }`}
                            style={{ width: `${widthPct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {analytics.isBedtimeConcentrated && (
                <div className="pt-3 border-t border-[#E5E2DC] flex items-start gap-2 text-xs text-[#2B2D2B] leading-relaxed">
                  <Moon
                    className="w-4 h-4 text-[#6A8D73] shrink-0 mt-0.5"
                    strokeWidth={1.6}
                  />
                  <span>
                    Concentração maior <strong>antes de dormir</strong> — manter o
                    carregador fora do quarto costuma aliviar esse período.
                  </span>
                </div>
              )}
            </section>
          </div>

          {/* Targeted Gemini Pattern Analysis */}
          <section className="bg-white border border-[#E5E2DC] rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-[#2B2D2B]">
                  Leitura dos seus padrões
                </h2>
                <p className="text-xs text-[#6B6F6C] mt-0.5">
                  Cruza seu perfil digital com o diário para sugerir 2 a 3 passos
                  práticos sem julgamento.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAnalyzePatterns}
                disabled={isAnalyzing}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#6A8D73] hover:bg-[#587860] disabled:opacity-60 text-white text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.7} />
                    <span>Analisando...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" strokeWidth={1.7} />
                    <span>Analisar meus padrões</span>
                  </>
                )}
              </button>
            </div>

            {analysisError && (
              <p
                role="alert"
                className="text-xs sm:text-sm text-[#2B2D2B] bg-[#F6F4EF] border border-[#E5E2DC] rounded-xl p-3.5 leading-relaxed"
              >
                {analysisError}
              </p>
            )}

            {lastAnalysis && (
              <div className="pt-4 border-t border-[#E5E2DC] space-y-4">
                <p className="text-sm text-[#2B2D2B] leading-relaxed">
                  {lastAnalysis.summary}
                </p>
                <ol className="space-y-3">
                  {lastAnalysis.recommendations.map((rec, idx) => (
                    <li
                      key={`${rec.title}-${idx}`}
                      className="bg-[#FAF9F6] border border-[#E5E2DC] rounded-xl p-3.5"
                    >
                      <p className="text-sm font-semibold text-[#2B2D2B]">
                        {idx + 1}. {rec.title}
                      </p>
                      <p className="text-xs sm:text-sm text-[#6B6F6C] mt-1 leading-relaxed">
                        {rec.action}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </section>

          {/* Chronological History */}
          <section className="bg-white border border-[#E5E2DC] rounded-2xl p-5 sm:p-6">
            <div className="flex items-baseline justify-between gap-2 mb-4">
              <h2 className="text-base font-semibold text-[#2B2D2B]">
                Histórico recente
              </h2>
              <span className="text-xs text-[#6B6F6C] tabular-nums">
                {entries.length} {entries.length === 1 ? 'registro' : 'registros'}
              </span>
            </div>

            {entries.length === 0 ? (
              <div className="py-6 text-center space-y-2">
                <BookOpen
                  className="w-6 h-6 text-[#6B6F6C]/60 mx-auto"
                  strokeWidth={1.5}
                />
                <p className="text-sm text-[#6B6F6C]">
                  Nenhum gatilho anotado ainda.
                </p>
                <p className="text-xs text-[#6B6F6C]">
                  Use o formulário ao lado ou faça uma Pausa Consciente para começar.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-[#E5E2DC]">
                {entries.slice(0, 12).map((entry) => {
                  const triggerLabel =
                    TRIGGERS.find((t) => t.id === entry.trigger)?.label ??
                    entry.trigger;
                  const periodLabel =
                    DAY_PERIODS.find((p) => p.id === entry.period)?.label ??
                    entry.period;
                  return (
                    <li
                      key={entry.id}
                      className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
                          <span className="font-medium text-[#2B2D2B]">
                            {triggerLabel}
                          </span>
                          <span aria-hidden="true" className="text-[#6B6F6C]">
                            ·
                          </span>
                          <span className="text-xs text-[#6B6F6C]">
                            {periodLabel}
                          </span>
                          <span aria-hidden="true" className="text-[#6B6F6C]">
                            ·
                          </span>
                          <span className="text-xs text-[#6B6F6C] tabular-nums">
                            {formatRelativeDatePtBr(entry.createdAt)}
                          </span>
                        </div>
                        {entry.needNote && (
                          <p className="text-xs sm:text-sm text-[#6B6F6C] mt-1 leading-relaxed">
                            “{entry.needNote}”
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => onDeleteEntry(entry.id)}
                        aria-label={`Excluir registro de ${triggerLabel}`}
                        className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-[#6B6F6C] hover:text-[#2B2D2B] hover:bg-[#F6F4EF] transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={1.6} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
