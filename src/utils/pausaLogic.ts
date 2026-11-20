import {
  ARCHETYPES,
  DAY_PERIODS,
  ENVIRONMENT_CHECKLIST,
  PROFILE_QUESTIONS,
  TRIGGERS,
} from '../data/pausaContent';
import type {
  ArchetypeDetails,
  DayPeriodId,
  JournalEntry,
  OfflineActivity,
  OfflineDuration,
  PausaAppState,
  PauseRecord,
  ProfileAnswers,
  ProfileArchetypeId,
  TriggerId,
} from '../types';

export const STORAGE_KEY = 'pausa_app_state_v1';

export const DEFAULT_PROFILE_ANSWERS: ProfileAnswers = {
  impulsividade: 3,
  vigilancia: 3,
  regulacaoEmocional: 3,
  fomo: 2,
  multitarefa: 3,
  perdaControle: 3,
};

export const INITIAL_APP_STATE: PausaAppState = {
  profile: null,
  grayscaleMode: false,
  pauses: [],
  activeTimer: null,
  customOfflineActivities: [],
  offlineCompletedCount: 0,
  journalEntries: [],
  checkedEnvironmentIds: [],
  lastAnalysis: null,
};

/**
 * Determines the user's dominant digital profile archetype from the 6 answers (1-5).
 * - Piloto Automático: highest weight on impulsividade (1) & multitarefa (5)
 * - Vigilante Conectado: highest weight on vigilancia (2) & fomo (4)
 * - Refúgio Emocional: highest weight on regulacaoEmocional (3)
 * - Equilíbrio em Construção: highest weight on perdaControle (6) or high overall average (>= 4.0)
 */
export function calculateDominantArchetype(answers: ProfileAnswers): ArchetypeDetails {
  const values = Object.values(answers);
  const overallAvg = values.reduce((acc, v) => acc + v, 0) / values.length;

  const pilotoScore = (answers.impulsividade + answers.multitarefa) / 2;
  const vigilanteScore = (answers.vigilancia + answers.fomo) / 2;
  const refugioScore = answers.regulacaoEmocional;
  const controleScore = answers.perdaControle;

  const candidates: Array<{ id: ProfileArchetypeId; score: number }> = [
    { id: 'piloto_automatico', score: pilotoScore },
    { id: 'vigilante_conectado', score: vigilanteScore },
    { id: 'refugio_emocional', score: refugioScore },
    { id: 'equilibrio_construcao', score: controleScore },
  ];

  const maxScore = Math.max(...candidates.map((c) => c.score));

  // If overall average is very high (>= 4.0) and perdaControle is also high (>= 4),
  // reinforce gradual realistic goals via Equilíbrio em Construção.
  if (overallAvg >= 4.0 && controleScore >= 4 && controleScore >= maxScore - 0.5) {
    return ARCHETYPES.equilibrio_construcao;
  }

  // If perdaControle is strictly the highest or tied for highest with overallAvg >= 3.5
  if (controleScore === maxScore && (controleScore > Math.max(pilotoScore, vigilanteScore, refugioScore) || overallAvg >= 3.5)) {
    return ARCHETYPES.equilibrio_construcao;
  }

  // Deterministic priority among top scorers
  const top = candidates.find((c) => c.score === maxScore) ?? candidates[0];
  return ARCHETYPES[top.id];
}

export function getDimensionScores(answers: ProfileAnswers) {
  return PROFILE_QUESTIONS.map((q) => ({
    key: q.key,
    shortLabel: q.shortLabel,
    label: q.dimensionTitle,
    score: answers[q.key],
    percentage: Math.round((answers[q.key] / 5) * 100),
  }));
}

export function getCurrentDayPeriod(date: Date = new Date()): DayPeriodId {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'manha';
  if (hour >= 12 && hour < 18) return 'tarde';
  if (hour >= 18 && hour < 22) return 'noite';
  return 'antes_dormir';
}

export function isSameLocalDay(isoDate: string, referenceDate: Date = new Date()): boolean {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return false;
  return (
    d.getFullYear() === referenceDate.getFullYear() &&
    d.getMonth() === referenceDate.getMonth() &&
    d.getDate() === referenceDate.getDate()
  );
}

export function countPausesWonToday(
  pauses: PauseRecord[],
  referenceDate: Date = new Date()
): number {
  return pauses.filter(
    (p) => p.outcome === 'resisted' && isSameLocalDay(p.createdAt, referenceDate)
  ).length;
}

export interface TriggerStat {
  id: TriggerId;
  label: string;
  count: number;
  percentage: number;
}

export interface PeriodStat {
  id: DayPeriodId;
  label: string;
  count: number;
  percentage: number;
}

export interface JournalAnalytics {
  totalEntries: number;
  topTriggers: TriggerStat[];
  periodDistribution: PeriodStat[];
  isBedtimeConcentrated: boolean;
}

export function analyzeJournalEntries(entries: JournalEntry[]): JournalAnalytics {
  const totalEntries = entries.length;

  const triggerCounts = new Map<TriggerId, number>();
  const periodCounts = new Map<DayPeriodId, number>();

  for (const entry of entries) {
    triggerCounts.set(entry.trigger, (triggerCounts.get(entry.trigger) ?? 0) + 1);
    periodCounts.set(entry.period, (periodCounts.get(entry.period) ?? 0) + 1);
  }

  const topTriggers: TriggerStat[] = TRIGGERS.map((t) => {
    const count = triggerCounts.get(t.id) ?? 0;
    return {
      id: t.id,
      label: t.label,
      count,
      percentage: totalEntries > 0 ? Math.round((count / totalEntries) * 100) : 0,
    };
  })
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const periodDistribution: PeriodStat[] = DAY_PERIODS.map((p) => {
    const count = periodCounts.get(p.id) ?? 0;
    return {
      id: p.id,
      label: p.label,
      count,
      percentage: totalEntries > 0 ? Math.round((count / totalEntries) * 100) : 0,
    };
  });

  const bedtimeCount = periodCounts.get('antes_dormir') ?? 0;
  const maxPeriodCount = Math.max(...periodDistribution.map((p) => p.count), 0);
  const isBedtimeConcentrated =
    totalEntries >= 2 &&
    bedtimeCount > 0 &&
    (bedtimeCount === maxPeriodCount || bedtimeCount / totalEntries >= 0.35);

  return {
    totalEntries,
    topTriggers,
    periodDistribution,
    isBedtimeConcentrated,
  };
}

export function calculateEnvironmentProgress(checkedIds: string[]) {
  const validIds = new Set(ENVIRONMENT_CHECKLIST.map((item) => item.id));
  const uniqueValidChecked = new Set(checkedIds.filter((id) => validIds.has(id)));
  const total = ENVIRONMENT_CHECKLIST.length;
  const completed = uniqueValidChecked.size;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { completed, total, percentage };
}

export function filterOfflineActivities(
  activities: OfflineActivity[],
  filter: 'all' | OfflineDuration
): OfflineActivity[] {
  if (filter === 'all') return activities;
  return activities.filter((a) => a.duration === filter);
}

export function pickSurpriseActivity(
  activities: OfflineActivity[],
  filter: 'all' | OfflineDuration,
  previousId?: string | null,
  randomFn: () => number = Math.random
): OfflineActivity | null {
  const filtered = filterOfflineActivities(activities, filter);
  if (filtered.length === 0) return null;
  if (filtered.length === 1) return filtered[0];

  const candidates = previousId
    ? filtered.filter((a) => a.id !== previousId)
    : filtered;
  const pool = candidates.length > 0 ? candidates : filtered;
  const index = Math.min(pool.length - 1, Math.floor(randomFn() * pool.length));
  return pool[index];
}

export function formatRemainingSeconds(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatRelativeDatePtBr(isoDate: string, now: Date = new Date()): string {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return '';

  const timeStr = d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (isSameLocalDay(isoDate, now)) {
    return `Hoje · ${timeStr}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameLocalDay(isoDate, yesterday)) {
    return `Ontem · ${timeStr}`;
  }

  const dayMonth = d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
  return `${dayMonth} · ${timeStr}`;
}

export function loadPersistedState(): PausaAppState {
  if (typeof window === 'undefined') return INITIAL_APP_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_APP_STATE;
    const parsed = JSON.parse(raw) as Partial<PausaAppState>;
    return {
      ...INITIAL_APP_STATE,
      ...parsed,
      pauses: Array.isArray(parsed.pauses) ? parsed.pauses : [],
      customOfflineActivities: Array.isArray(parsed.customOfflineActivities)
        ? parsed.customOfflineActivities
        : [],
      journalEntries: Array.isArray(parsed.journalEntries) ? parsed.journalEntries : [],
      checkedEnvironmentIds: Array.isArray(parsed.checkedEnvironmentIds)
        ? parsed.checkedEnvironmentIds
        : [],
      offlineCompletedCount:
        typeof parsed.offlineCompletedCount === 'number'
          ? parsed.offlineCompletedCount
          : 0,
      grayscaleMode: Boolean(parsed.grayscaleMode),
    };
  } catch {
    return INITIAL_APP_STATE;
  }
}

export function savePersistedState(state: PausaAppState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors gracefully
  }
}
