export type TabId = 'pausar' | 'offline' | 'diario' | 'ambiente';

export type DimensionKey =
  | 'impulsividade'
  | 'vigilancia'
  | 'regulacaoEmocional'
  | 'fomo'
  | 'multitarefa'
  | 'perdaControle';

export type ProfileArchetypeId =
  | 'piloto_automatico'
  | 'vigilante_conectado'
  | 'refugio_emocional'
  | 'equilibrio_construcao';

export type ProfileAnswers = Record<DimensionKey, number>;

export interface DigitalProfile {
  answers: ProfileAnswers;
  dailyGoalMinutes: number;
  completedAt: string;
}

export interface ArchetypeDetails {
  id: ProfileArchetypeId;
  title: string;
  summary: string;
  recommendationTitle: string;
  recommendationBody: string;
  recommendedTab: TabId;
  recommendedTabLabel: string;
}

export type TriggerId =
  | 'comparacao'
  | 'tedio'
  | 'ansiedade'
  | 'fomo'
  | 'procrastinacao'
  | 'cansaco'
  | 'habito';

export type DayPeriodId = 'manha' | 'tarde' | 'noite' | 'antes_dormir';

export interface JournalEntry {
  id: string;
  trigger: TriggerId;
  period: DayPeriodId;
  needNote?: string;
  createdAt: string;
  source?: 'pause' | 'journal';
}

export type OfflineDuration = '2min' | '15min' | '30min';

export interface OfflineActivity {
  id: string;
  title: string;
  duration: OfflineDuration;
  isCustom?: boolean;
}

export interface PauseRecord {
  id: string;
  outcome: 'resisted' | 'conscious';
  createdAt: string;
  timerMinutes?: number;
}

export interface ActiveConsciousTimer {
  startedAt: string;
  durationMinutes: number;
  endsAt: string;
}

export interface PatternAnalysisResult {
  summary: string;
  recommendations: Array<{
    title: string;
    action: string;
  }>;
  generatedAt: string;
}

export interface PausaAppState {
  profile: DigitalProfile | null;
  grayscaleMode: boolean;
  simulateNightMode: boolean;
  pauses: PauseRecord[];
  activeTimer: ActiveConsciousTimer | null;
  customOfflineActivities: OfflineActivity[];
  offlineCompletedCount: number;
  journalEntries: JournalEntry[];
  checkedEnvironmentIds: string[];
  lastAnalysis: PatternAnalysisResult | null;
}
