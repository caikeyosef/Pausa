import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeJournalEntries,
  calculateDominantArchetype,
  calculateEnvironmentProgress,
  countPausesWonToday,
  filterOfflineActivities,
  formatRemainingSeconds,
  getCurrentDayPeriod,
  getDefaultTimerMinutes,
  isNightTime,
  pickSurpriseActivity,
} from './pausaLogic';
import { DEFAULT_OFFLINE_ACTIVITIES } from '../data/pausaContent';
import type { JournalEntry, PauseRecord } from '../types';

test('calculateDominantArchetype identifies Piloto Automático when impulsividade and multitarefa dominate', () => {
  const result = calculateDominantArchetype({
    impulsividade: 5,
    vigilancia: 2,
    regulacaoEmocional: 2,
    fomo: 1,
    multitarefa: 5,
    perdaControle: 2,
  });
  assert.equal(result.id, 'piloto_automatico');
  assert.equal(result.recommendedTab, 'pausar');
});

test('calculateDominantArchetype identifies Vigilante Conectado when vigilancia and fomo dominate', () => {
  const result = calculateDominantArchetype({
    impulsividade: 2,
    vigilancia: 5,
    regulacaoEmocional: 2,
    fomo: 4,
    multitarefa: 2,
    perdaControle: 2,
  });
  assert.equal(result.id, 'vigilante_conectado');
  assert.equal(result.recommendedTab, 'ambiente');
});

test('calculateDominantArchetype identifies Refúgio Emocional when regulacaoEmocional dominates', () => {
  const result = calculateDominantArchetype({
    impulsividade: 3,
    vigilancia: 2,
    regulacaoEmocional: 5,
    fomo: 2,
    multitarefa: 3,
    perdaControle: 2,
  });
  assert.equal(result.id, 'refugio_emocional');
  assert.equal(result.recommendedTab, 'diario');
});

test('calculateDominantArchetype identifies Equilíbrio em Construção when perdaControle dominates or overall average is high', () => {
  const direct = calculateDominantArchetype({
    impulsividade: 3,
    vigilancia: 3,
    regulacaoEmocional: 3,
    fomo: 2,
    multitarefa: 3,
    perdaControle: 5,
  });
  assert.equal(direct.id, 'equilibrio_construcao');

  const highAvg = calculateDominantArchetype({
    impulsividade: 5,
    vigilancia: 4,
    regulacaoEmocional: 5,
    fomo: 4,
    multitarefa: 4,
    perdaControle: 5,
  });
  assert.equal(highAvg.id, 'equilibrio_construcao');
});

test('analyzeJournalEntries computes top 3 triggers, period distribution, and bedtime concentration', () => {
  const entries: JournalEntry[] = [
    { id: '1', trigger: 'tedio', period: 'antes_dormir', createdAt: '2026-11-19T23:00:00Z' },
    { id: '2', trigger: 'tedio', period: 'antes_dormir', createdAt: '2026-11-18T23:15:00Z' },
    { id: '3', trigger: 'ansiedade', period: 'tarde', createdAt: '2026-11-19T15:00:00Z' },
    { id: '4', trigger: 'cansaco', period: 'antes_dormir', createdAt: '2026-11-17T23:30:00Z' },
    { id: '5', trigger: 'habito', period: 'manha', createdAt: '2026-11-19T08:00:00Z' },
  ];

  const stats = analyzeJournalEntries(entries);
  assert.equal(stats.totalEntries, 5);
  assert.equal(stats.topTriggers.length, 3);
  assert.equal(stats.topTriggers[0].id, 'tedio');
  assert.equal(stats.topTriggers[0].count, 2);
  assert.equal(stats.topTriggers[0].percentage, 40);
  assert.equal(stats.isBedtimeConcentrated, true);

  const bedtimeBucket = stats.periodDistribution.find((p) => p.id === 'antes_dormir');
  assert.equal(bedtimeBucket?.count, 3);
});

test('calculateEnvironmentProgress counts only valid unique checklist IDs across all 7 items', () => {
  assert.deepEqual(calculateEnvironmentProgress([]), {
    completed: 0,
    total: 7,
    percentage: 0,
  });
  assert.deepEqual(
    calculateEnvironmentProgress([
      'env-grayscale',
      'env-notifications',
      'env-mute-comparison',
      'env-auto-intercept',
      'env-grayscale',
      'unknown-id',
    ]),
    {
      completed: 4,
      total: 7,
      percentage: 57,
    }
  );
});

test('filterOfflineActivities and pickSurpriseActivity respect duration filter and avoid repeating previous item', () => {
  const twoMin = filterOfflineActivities(DEFAULT_OFFLINE_ACTIVITIES, '2min');
  assert.equal(twoMin.length, 4);
  assert.ok(twoMin.every((item) => item.duration === '2min'));

  const picked = pickSurpriseActivity(
    DEFAULT_OFFLINE_ACTIVITIES,
    '2min',
    twoMin[0].id,
    () => 0
  );
  assert.ok(picked);
  assert.notEqual(picked.id, twoMin[0].id);
  assert.equal(picked.duration, '2min');
});

test('countPausesWonToday counts only resisted pauses on the reference local day', () => {
  const ref = new Date(2026, 10, 19, 15, 0, 0); // Nov 19, 2026 local
  const todayMorning = new Date(2026, 10, 19, 9, 30, 0).toISOString();
  const todayAfternoon = new Date(2026, 10, 19, 14, 0, 0).toISOString();
  const yesterday = new Date(2026, 10, 18, 20, 0, 0).toISOString();

  const pauses: PauseRecord[] = [
    { id: '1', outcome: 'resisted', createdAt: todayMorning },
    { id: '2', outcome: 'conscious', createdAt: todayAfternoon, timerMinutes: 5 },
    { id: '3', outcome: 'resisted', createdAt: todayAfternoon },
    { id: '4', outcome: 'resisted', createdAt: yesterday },
  ];

  assert.equal(countPausesWonToday(pauses, ref), 2);
});

test('getCurrentDayPeriod, isNightTime, getDefaultTimerMinutes, and formatRemainingSeconds work accurately', () => {
  assert.equal(getCurrentDayPeriod(new Date(2026, 10, 19, 9, 0)), 'manha');
  assert.equal(getCurrentDayPeriod(new Date(2026, 10, 19, 14, 0)), 'tarde');
  assert.equal(getCurrentDayPeriod(new Date(2026, 10, 19, 20, 0)), 'noite');
  assert.equal(getCurrentDayPeriod(new Date(2026, 10, 19, 23, 30)), 'antes_dormir');
  assert.equal(isNightTime(new Date(2026, 10, 19, 21, 59)), false);
  assert.equal(isNightTime(new Date(2026, 10, 19, 22, 0)), true);
  assert.equal(isNightTime(new Date(2026, 10, 20, 0, 30)), true);
  assert.equal(isNightTime(new Date(2026, 10, 20, 4, 59)), true);
  assert.equal(isNightTime(new Date(2026, 10, 20, 5, 0)), false);
  assert.equal(getDefaultTimerMinutes('2min'), 2);
  assert.equal(getDefaultTimerMinutes('15min'), 15);
  assert.equal(getDefaultTimerMinutes('30min'), 30);
  assert.equal(formatRemainingSeconds(305), '05:05');
  assert.equal(formatRemainingSeconds(0), '00:00');
});

test('analyzeJournalEntries ranks Comparação trigger accurately', () => {
  const entries: JournalEntry[] = [
    { id: 'c1', trigger: 'comparacao', period: 'noite', createdAt: '2026-11-19T21:00:00Z' },
    { id: 'c2', trigger: 'comparacao', period: 'tarde', createdAt: '2026-11-19T16:00:00Z' },
    { id: 'c3', trigger: 'tedio', period: 'manha', createdAt: '2026-11-19T09:00:00Z' },
  ];
  const stats = analyzeJournalEntries(entries);
  assert.equal(stats.topTriggers[0].id, 'comparacao');
  assert.equal(stats.topTriggers[0].label, 'Comparação');
  assert.equal(stats.topTriggers[0].count, 2);
});
