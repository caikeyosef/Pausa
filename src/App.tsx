import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Compass,
  Contrast,
  PauseCircle,
  ShieldCheck,
  User,
} from 'lucide-react';
import {
  createSampleAppState,
  DEFAULT_OFFLINE_ACTIVITIES,
} from './data/pausaContent';
import { EnvironmentTab } from './components/EnvironmentTab';
import { JournalTab } from './components/JournalTab';
import { OfflineTab } from './components/OfflineTab';
import { PauseModal } from './components/PauseModal';
import { PauseTab } from './components/PauseTab';
import { ProfileMapModal } from './components/ProfileMapModal';
import type {
  DayPeriodId,
  DigitalProfile,
  OfflineDuration,
  PatternAnalysisResult,
  PausaAppState,
  TabId,
  TriggerId,
} from './types';
import {
  calculateDominantArchetype,
  calculateEnvironmentProgress,
  countPausesWonToday,
  DEFAULT_PROFILE_ANSWERS,
  INITIAL_APP_STATE,
  loadPersistedState,
  savePersistedState,
} from './utils/pausaLogic';

const NAV_TABS: Array<{
  id: TabId;
  label: string;
  Icon: typeof PauseCircle;
}> = [
  { id: 'pausar', label: 'Pausar', Icon: PauseCircle },
  { id: 'offline', label: 'Offline', Icon: Compass },
  { id: 'diario', label: 'Diário', Icon: BookOpen },
  { id: 'ambiente', label: 'Ambiente', Icon: ShieldCheck },
];

function getInitialState(): PausaAppState {
  const persisted = loadPersistedState();
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1' && !persisted.profile) {
      return {
        ...persisted,
        profile: {
          answers: DEFAULT_PROFILE_ANSWERS,
          dailyGoalMinutes: 45,
          completedAt: new Date().toISOString(),
        },
      };
    }
  }
  return persisted;
}

export default function App() {
  const [state, setState] = useState<PausaAppState>(getInitialState);
  const [onboardingDone, setOnboardingDone] = useState<boolean>(() =>
    Boolean(getInitialState().profile)
  );
  const [activeTab, setActiveTab] = useState<TabId>('pausar');
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Persist to localStorage on every state update
  useEffect(() => {
    savePersistedState(state);
  }, [state]);

  // Sync Grayscale Mode on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (state.grayscaleMode) {
      root.classList.add('pausa-grayscale');
    } else {
      root.classList.remove('pausa-grayscale');
    }
    return () => {
      root.classList.remove('pausa-grayscale');
    };
  }, [state.grayscaleMode]);

  const allOfflineActivities = useMemo(
    () => [...state.customOfflineActivities, ...DEFAULT_OFFLINE_ACTIVITIES],
    [state.customOfflineActivities]
  );

  const archetype = useMemo(
    () =>
      state.profile ? calculateDominantArchetype(state.profile.answers) : null,
    [state.profile]
  );

  const pausesWonToday = useMemo(
    () => countPausesWonToday(state.pauses),
    [state.pauses]
  );

  const environmentProgress = useMemo(
    () => calculateEnvironmentProgress(state.checkedEnvironmentIds),
    [state.checkedEnvironmentIds]
  );

  const handleSaveProfile = (profile: DigitalProfile, navigateToTab?: TabId) => {
    setState((prev) => ({
      ...prev,
      profile,
    }));
    if (navigateToTab) {
      setActiveTab(navigateToTab);
    }
  };

  const handleToggleGrayscale = () => {
    setState((prev) => ({
      ...prev,
      grayscaleMode: !prev.grayscaleMode,
    }));
  };

  const handleResistedPause = () => {
    setState((prev) => ({
      ...prev,
      pauses: [
        {
          id: `pause-${Date.now()}`,
          outcome: 'resisted',
          createdAt: new Date().toISOString(),
        },
        ...prev.pauses,
      ],
    }));
  };

  const handleStartConsciousTimer = (minutes: number | null) => {
    const now = new Date();
    setState((prev) => ({
      ...prev,
      pauses: [
        {
          id: `pause-${Date.now()}`,
          outcome: 'conscious',
          createdAt: now.toISOString(),
          timerMinutes: minutes ?? undefined,
        },
        ...prev.pauses,
      ],
      activeTimer: minutes
        ? {
            startedAt: now.toISOString(),
            durationMinutes: minutes,
            endsAt: new Date(now.getTime() + minutes * 60 * 1000).toISOString(),
          }
        : null,
    }));
  };

  const handleDismissTimer = () => {
    setState((prev) => ({ ...prev, activeTimer: null }));
  };

  const handleAddJournalEntry = (
    trigger: TriggerId,
    period: DayPeriodId,
    needNote?: string,
    source: 'pause' | 'journal' = 'journal'
  ) => {
    setState((prev) => ({
      ...prev,
      journalEntries: [
        {
          id: `journal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          trigger,
          period,
          needNote,
          createdAt: new Date().toISOString(),
          source,
        },
        ...prev.journalEntries,
      ],
    }));
  };

  const handleDeleteJournalEntry = (id: string) => {
    setState((prev) => ({
      ...prev,
      journalEntries: prev.journalEntries.filter((e) => e.id !== id),
    }));
  };

  const handleSaveAnalysis = (analysis: PatternAnalysisResult) => {
    setState((prev) => ({
      ...prev,
      lastAnalysis: analysis,
    }));
  };

  const handleCompleteOfflineActivity = () => {
    setState((prev) => ({
      ...prev,
      offlineCompletedCount: prev.offlineCompletedCount + 1,
    }));
  };

  const handleAddCustomOfflineActivity = (
    title: string,
    duration: OfflineDuration
  ) => {
    setState((prev) => ({
      ...prev,
      customOfflineActivities: [
        {
          id: `custom-${Date.now()}`,
          title,
          duration,
          isCustom: true,
        },
        ...prev.customOfflineActivities,
      ],
    }));
  };

  const handleRemoveCustomOfflineActivity = (id: string) => {
    setState((prev) => ({
      ...prev,
      customOfflineActivities: prev.customOfflineActivities.filter(
        (a) => a.id !== id
      ),
    }));
  };

  const handleToggleEnvironmentItem = (id: string) => {
    setState((prev) => {
      const exists = prev.checkedEnvironmentIds.includes(id);
      return {
        ...prev,
        checkedEnvironmentIds: exists
          ? prev.checkedEnvironmentIds.filter((item) => item !== id)
          : [...prev.checkedEnvironmentIds, id],
      };
    });
  };

  const handleLoadSampleData = () => {
    const sample = createSampleAppState();
    setState((prev) => ({
      ...sample,
      grayscaleMode: prev.grayscaleMode,
    }));
  };

  const handleClearAllData = () => {
    setState(INITIAL_APP_STATE);
    setOnboardingDone(false);
    setIsProfileOpen(false);
    setActiveTab('pausar');
  };

  // Initial Onboarding: Digital Profile Map
  if (!onboardingDone || !state.profile) {
    return (
      <ProfileMapModal
        mode="onboarding"
        existingProfile={state.profile}
        onSaveProfile={handleSaveProfile}
        onFinishOnboarding={(tab) => {
          if (tab) setActiveTab(tab);
          setOnboardingDone(true);
        }}
        onLoadSampleData={handleLoadSampleData}
        onClearAllData={handleClearAllData}
      />
    );
  }

  return (
    <div className="min-h-dvh bg-[#F6F4EF] text-[#2B2D2B] flex flex-col">
      {/* Compact Sticky Top Bar (52px) */}
      <header className="sticky top-0 z-30 h-[52px] bg-[#F6F4EF]/90 backdrop-blur-md border-b border-[#E5E2DC]">
        <div className="max-w-5xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('pausar')}
            className="text-lg font-semibold tracking-tight text-[#2B2D2B] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6A8D73] rounded-md"
          >
            Pausa<span className="text-[#6A8D73]">.</span>
          </button>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleToggleGrayscale}
              aria-pressed={state.grayscaleMode}
              aria-label="Alternar modo tons de cinza"
              title="Modo tons de cinza"
              className={`min-h-[40px] px-3 rounded-xl text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                state.grayscaleMode
                  ? 'bg-[#2B2D2B] text-white'
                  : 'text-[#6B6F6C] hover:text-[#2B2D2B] hover:bg-[#EAE6DE]'
              }`}
            >
              <Contrast className="w-4 h-4" strokeWidth={1.6} />
              <span className="hidden sm:inline">Tons de cinza</span>
            </button>

            <button
              type="button"
              onClick={() => setIsProfileOpen(true)}
              aria-label="Abrir Meu Perfil Digital"
              className="min-h-[40px] px-3 rounded-xl text-xs font-medium text-[#2B2D2B] hover:bg-[#EAE6DE] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <User className="w-4 h-4 text-[#6A8D73]" strokeWidth={1.6} />
              <span>Meu Perfil</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area (bottom padding leaves clear room above 60px fixed bottom nav) */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-24">
        {activeTab === 'pausar' && (
          <PauseTab
            dailyGoalMinutes={state.profile.dailyGoalMinutes}
            pausesWonToday={pausesWonToday}
            offlineCompletedCount={state.offlineCompletedCount}
            environmentProgress={environmentProgress}
            archetype={archetype}
            activeTimer={state.activeTimer}
            onOpenPauseModal={() => setIsPauseModalOpen(true)}
            onDismissTimer={handleDismissTimer}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'offline' && (
          <OfflineTab
            activities={allOfflineActivities}
            offlineCompletedCount={state.offlineCompletedCount}
            onCompleteActivity={handleCompleteOfflineActivity}
            onAddActivity={handleAddCustomOfflineActivity}
            onRemoveCustomActivity={handleRemoveCustomOfflineActivity}
          />
        )}

        {activeTab === 'diario' && (
          <JournalTab
            entries={state.journalEntries}
            profile={state.profile}
            environmentCompleted={environmentProgress.completed}
            environmentTotal={environmentProgress.total}
            pausesWonToday={pausesWonToday}
            lastAnalysis={state.lastAnalysis}
            onAddEntry={(trigger, period, note) =>
              handleAddJournalEntry(trigger, period, note, 'journal')
            }
            onDeleteEntry={handleDeleteJournalEntry}
            onSaveAnalysis={handleSaveAnalysis}
          />
        )}

        {activeTab === 'ambiente' && (
          <EnvironmentTab
            checkedIds={state.checkedEnvironmentIds}
            onToggleItem={handleToggleEnvironmentItem}
          />
        )}
      </main>

      {/* Fixed Bottom 4-Tab Navigation Bar (60px height — total sticky <= 112px = 13.3% on 844px mobile) */}
      <nav
        aria-label="Navegação principal"
        className="fixed bottom-0 left-0 right-0 z-30 h-[60px] bg-white/95 backdrop-blur-md border-t border-[#E5E2DC]"
      >
        <div className="max-w-xl mx-auto h-full grid grid-cols-4 items-center px-2">
          {NAV_TABS.map(({ id, label, Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => setActiveTab(id)}
                className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors whitespace-nowrap ${
                  isActive
                    ? 'text-[#6A8D73]'
                    : 'text-[#6B6F6C] hover:text-[#2B2D2B]'
                }`}
              >
                <Icon
                  className="w-5 h-5"
                  strokeWidth={isActive ? 2 : 1.5}
                />
                <span className="text-[11px] font-medium tracking-tight">
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Full-Screen Conscious Pause Modal */}
      <PauseModal
        isOpen={isPauseModalOpen}
        allActivities={allOfflineActivities}
        onClose={() => setIsPauseModalOpen(false)}
        onResistedPause={handleResistedPause}
        onLogTriggerFromPause={(trigger, period) =>
          handleAddJournalEntry(trigger, period, undefined, 'pause')
        }
        onCompleteOfflineActivity={handleCompleteOfflineActivity}
        onStartConsciousTimer={handleStartConsciousTimer}
      />

      {/* Profile Map View / Redo Overlay */}
      {isProfileOpen && (
        <ProfileMapModal
          mode="profile"
          existingProfile={state.profile}
          onSaveProfile={handleSaveProfile}
          onClose={() => setIsProfileOpen(false)}
          onLoadSampleData={handleLoadSampleData}
          onClearAllData={handleClearAllData}
        />
      )}
    </div>
  );
}
