import { useState } from 'react';
import { Check, Plus, Shuffle, Timer, Trash2 } from 'lucide-react';
import { DURATION_LABELS } from '../data/pausaContent';
import type { OfflineActivity, OfflineDuration } from '../types';
import { filterOfflineActivities, pickSurpriseActivity } from '../utils/pausaLogic';
import { OfflineTimerModal } from './OfflineTimerModal';

interface OfflineTabProps {
  activities: OfflineActivity[];
  offlineCompletedCount: number;
  onCompleteActivity: () => void;
  onAddActivity: (title: string, duration: OfflineDuration) => void;
  onRemoveCustomActivity: (id: string) => void;
}

const FILTER_OPTIONS: Array<{ id: 'all' | OfflineDuration; label: string }> = [
  { id: 'all', label: 'Todos' },
  { id: '2min', label: '2 min' },
  { id: '15min', label: '15 min' },
  { id: '30min', label: '30+ min' },
];

export function OfflineTab({
  activities,
  offlineCompletedCount,
  onCompleteActivity,
  onAddActivity,
  onRemoveCustomActivity,
}: OfflineTabProps) {
  const [filter, setFilter] = useState<'all' | OfflineDuration>('all');
  const [surprisedActivity, setSurprisedActivity] = useState<OfflineActivity | null>(null);
  const [activeTimerActivity, setActiveTimerActivity] = useState<OfflineActivity | null>(null);
  const [recentlyDoneId, setRecentlyDoneId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDuration, setNewDuration] = useState<OfflineDuration>('15min');
  const [formError, setFormError] = useState<string | null>(null);

  const visibleActivities = filterOfflineActivities(activities, filter);

  const handleFilterChange = (nextFilter: 'all' | OfflineDuration) => {
    setFilter(nextFilter);
    if (
      surprisedActivity &&
      nextFilter !== 'all' &&
      surprisedActivity.duration !== nextFilter
    ) {
      setSurprisedActivity(null);
    }
  };

  const handleSurprise = () => {
    const picked = pickSurpriseActivity(
      activities,
      filter,
      surprisedActivity?.id ?? null
    );
    setSurprisedActivity(picked);
  };

  const handleComplete = (activityId: string) => {
    onCompleteActivity();
    setRecentlyDoneId(activityId);
    window.setTimeout(() => {
      setRecentlyDoneId((current) => (current === activityId ? null : current));
    }, 1800);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTitle.trim();
    if (!trimmed) {
      setFormError('Escreva uma pequena atividade fora da tela antes de salvar.');
      return;
    }
    onAddActivity(trimmed, newDuration);
    if (filter !== 'all' && filter !== newDuration) {
      setFilter(newDuration);
    }
    setNewTitle('');
    setFormError(null);
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Counter */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#2B2D2B]">
            Cardápio Offline
          </h1>
          <p className="text-sm text-[#6B6F6C] mt-1">
            Opções concretas para ocupar o tédio sem recorrer à rolagem automática.
          </p>
        </div>

        <div className="text-sm text-[#6B6F6C] sm:text-right shrink-0">
          <span data-testid="offline-completed-count" className="tabular-nums">
            <strong className="text-lg font-semibold text-[#6A8D73]">
              {offlineCompletedCount}
            </strong>{' '}
            {offlineCompletedCount === 1
              ? 'ação fora da tela concluída'
              : 'ações fora da tela concluídas'}
          </span>
        </div>
      </div>

      {/* Controls Bar: Segmented Duration Filter + Surprise + Add */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Filtrar atividades por tempo disponível"
          className="inline-grid grid-cols-4 gap-1 p-1 bg-[#EDEAE2] rounded-xl w-full md:w-auto"
        >
          {FILTER_OPTIONS.map((opt) => {
            const active = filter === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => handleFilterChange(opt.id)}
                className={`min-h-[42px] px-2 sm:px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-white text-[#2B2D2B] shadow-[0_1px_2px_rgba(43,45,43,0.06)]'
                    : 'text-[#6B6F6C] hover:text-[#2B2D2B]'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleSurprise}
            className="min-h-[44px] flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-[#6A8D73] hover:bg-[#587860] text-white text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
          >
            <Shuffle className="w-4 h-4" strokeWidth={1.7} />
            <span>Me surpreenda</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowAddForm((prev) => !prev);
              setFormError(null);
            }}
            aria-expanded={showAddForm}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white border border-[#E5E2DC] hover:bg-[#FAF9F6] text-[#2B2D2B] text-sm font-medium inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4 text-[#6A8D73]" strokeWidth={1.7} />
            <span>Nova ideia</span>
          </button>
        </div>
      </div>

      {/* Highlighted Surprise Card */}
      {surprisedActivity && (
        <section
          aria-live="polite"
          className="bg-white border border-[#6A8D73]/40 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <p className="text-xs text-[#6A8D73] font-medium">
              Sugestão sorteada · {DURATION_LABELS[surprisedActivity.duration]}
            </p>
            <p className="text-lg font-semibold text-[#2B2D2B] mt-1">
              {surprisedActivity.title}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTimerActivity(surprisedActivity)}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white border border-[#E5E2DC] hover:border-[#6A8D73] text-[#2B2D2B] text-sm font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Timer className="w-4 h-4 text-[#6A8D73]" strokeWidth={1.7} />
              <span>Iniciar timer</span>
            </button>
            <button
              type="button"
              onClick={() => handleComplete(surprisedActivity.id)}
              className={`min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                recentlyDoneId === surprisedActivity.id
                  ? 'bg-[#ECF2ED] text-[#587860]'
                  : 'bg-[#6A8D73] hover:bg-[#587860] text-white'
              }`}
            >
              <Check className="w-4 h-4" strokeWidth={1.8} />
              <span>
                {recentlyDoneId === surprisedActivity.id
                  ? 'Registrado'
                  : 'Concluí fora da tela'}
              </span>
            </button>
          </div>
        </section>
      )}

      {/* Custom Activity Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddSubmit}
          className="bg-white border border-[#E5E2DC] rounded-2xl p-5 sm:p-6 space-y-4"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-[#2B2D2B]">
              Adicionar atividade ao seu cardápio
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-8">
              <label
                htmlFor="custom-offline-title"
                className="block text-xs font-medium text-[#6B6F6C] mb-1.5"
              >
                O que você gosta de fazer longe das telas?
              </label>
              <input
                id="custom-offline-title"
                type="text"
                value={newTitle}
                onChange={(e) => {
                  setNewTitle(e.target.value);
                  if (formError) setFormError(null);
                }}
                placeholder="Ex.: Tocar violão por 10 minutos, regar as plantas..."
                maxLength={100}
                className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E5E2DC] text-base sm:text-sm text-[#2B2D2B] placeholder:text-[#6B6F6C]/70 focus:outline-none focus:border-[#6A8D73]"
              />
            </div>

            <div className="sm:col-span-4">
              <label
                htmlFor="custom-offline-duration"
                className="block text-xs font-medium text-[#6B6F6C] mb-1.5"
              >
                Tempo aproximado
              </label>
              <select
                id="custom-offline-duration"
                value={newDuration}
                onChange={(e) => setNewDuration(e.target.value as OfflineDuration)}
                className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E5E2DC] text-base sm:text-sm text-[#2B2D2B] focus:outline-none focus:border-[#6A8D73]"
              >
                <option value="2min">2 min</option>
                <option value="15min">15 min</option>
                <option value="30min">30+ min</option>
              </select>
            </div>
          </div>

          {formError && (
            <p role="alert" className="text-xs text-[#2B2D2B] font-medium">
              {formError}
            </p>
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setFormError(null);
              }}
              className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium text-[#6B6F6C] hover:text-[#2B2D2B] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#6A8D73] hover:bg-[#587860] text-white text-sm font-medium transition-colors"
            >
              Salvar atividade
            </button>
          </div>
        </form>
      )}

      {/* Activities Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleActivities.map((activity) => {
          const isJustDone = recentlyDoneId === activity.id;
          return (
            <article
              key={activity.id}
              className="bg-white border border-[#E5E2DC] rounded-2xl p-5 flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs text-[#6B6F6C]">
                    {DURATION_LABELS[activity.duration]}
                    {activity.isCustom ? ' · Sua ideia' : ''}
                  </span>
                  {activity.isCustom && (
                    <button
                      type="button"
                      onClick={() => onRemoveCustomActivity(activity.id)}
                      aria-label={`Remover atividade "${activity.title}"`}
                      className="min-h-[36px] min-w-[36px] -mr-2 flex items-center justify-center rounded-lg text-[#6B6F6C] hover:text-[#2B2D2B] hover:bg-[#F6F4EF] transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={1.6} />
                    </button>
                  )}
                </div>
                <h2 className="text-[15px] font-medium text-[#2B2D2B] leading-snug">
                  {activity.title}
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTimerActivity(activity)}
                  aria-label={`Iniciar timer para ${activity.title}`}
                  className="min-h-[44px] px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E5E2DC] hover:border-[#6A8D73] text-[#2B2D2B] text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                >
                  <Timer className="w-3.5 h-3.5 text-[#6A8D73]" strokeWidth={1.7} />
                  <span>Iniciar timer</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleComplete(activity.id)}
                  className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                    isJustDone
                      ? 'bg-[#ECF2ED] border-[#6A8D73]/30 text-[#587860]'
                      : 'bg-[#FAF9F6] border-[#E5E2DC] text-[#2B2D2B] hover:border-[#6A8D73] hover:text-[#587860]'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" strokeWidth={1.7} />
                  <span>
                    {isJustDone ? 'Registrado' : 'Concluí'}
                  </span>
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <OfflineTimerModal
        activity={activeTimerActivity}
        onClose={() => setActiveTimerActivity(null)}
        onComplete={(id) => handleComplete(id)}
      />
    </div>
  );
}
