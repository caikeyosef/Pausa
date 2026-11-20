import type {
  ArchetypeDetails,
  DayPeriodId,
  DimensionKey,
  OfflineActivity,
  OfflineDuration,
  PausaAppState,
  ProfileArchetypeId,
  TriggerId,
} from '../types';

export interface ProfileQuestion {
  key: DimensionKey;
  shortLabel: string;
  dimensionTitle: string;
  statement: string;
}

export const PROFILE_QUESTIONS: ProfileQuestion[] = [
  {
    key: 'impulsividade',
    shortLabel: 'Impulsividade',
    dimensionTitle: 'Impulsividade da atenção',
    statement:
      'Desbloqueio o celular e abro redes sociais no piloto automático, sem nem lembrar o que fui fazer.',
  },
  {
    key: 'vigilancia',
    shortLabel: 'Vigilância',
    dimensionTitle: 'Vigilância online',
    statement:
      'Sinto necessidade frequente de checar notificações ou mensagens, mesmo quando estou ocupado.',
  },
  {
    key: 'regulacaoEmocional',
    shortLabel: 'Emocional',
    dimensionTitle: 'Regulação emocional',
    statement:
      'Recorro ao celular para aliviar o tédio, o estresse ou a ansiedade nos momentos difíceis.',
  },
  {
    key: 'fomo',
    shortLabel: 'FoMO',
    dimensionTitle: 'FoMO (medo de perder algo)',
    statement:
      'Fico inquieto pensando que estou perdendo alguma conversa, novidade ou assunto se ficar desconectado.',
  },
  {
    key: 'multitarefa',
    shortLabel: 'Multitarefa',
    dimensionTitle: 'Multitarefa e distração',
    statement:
      'Costumo olhar o celular no meio de outras atividades (trabalho, estudo, conversas ou filmes), quebrando meu foco.',
  },
  {
    key: 'perdaControle',
    shortLabel: 'Controle',
    dimensionTitle: 'Perda de controle',
    statement:
      'Já tentei diminuir o tempo nas redes sociais, mas acabo voltando ao uso excessivo rapidamente.',
  },
];

export const LIKERT_LABELS: Array<{ value: number; label: string }> = [
  { value: 1, label: 'Quase nunca' },
  { value: 2, label: 'Raramente' },
  { value: 3, label: 'Às vezes' },
  { value: 4, label: 'Com frequência' },
  { value: 5, label: 'Quase sempre' },
];

export const ARCHETYPES: Record<ProfileArchetypeId, ArchetypeDetails> = {
  piloto_automatico: {
    id: 'piloto_automatico',
    title: 'Piloto Automático',
    summary:
      'Seu uso costuma acontecer por reflexo motor e fragmentação do foco, antes mesmo de você decidir abrir um aplicativo.',
    recommendationTitle: 'Comece pelo Botão de Pausa',
    recommendationBody:
      'Criar um pequeno intervalo de 8 segundos devolve a escolha consciente ao seu cérebro antes que o hábito automático assuma o controle.',
    recommendedTab: 'pausar',
    recommendedTabLabel: 'Ir para Pausar',
  },
  vigilante_conectado: {
    id: 'vigilante_conectado',
    title: 'Vigilante Conectado',
    summary:
      'Sua atenção fica em estado de alerta constante por causa de notificações, mensagens e da sensação de estar perdendo algo.',
    recommendationTitle: 'Comece pelo Checklist de Ambiente',
    recommendationBody:
      'Reduzir os avisos sonoros e visuais no celular alivia a pressão de checagem sem exigir esforço contínuo de força de vontade.',
    recommendedTab: 'ambiente',
    recommendedTabLabel: 'Ir para Ambiente',
  },
  refugio_emocional: {
    id: 'refugio_emocional',
    title: 'Refúgio Emocional',
    summary:
      'O celular tem funcionado como um alívio imediato para desconfortos como tédio, cansaço, estresse ou ansiedade.',
    recommendationTitle: 'Comece pelo Diário de Gatilhos + Cardápio Offline',
    recommendationBody:
      'Nomear o que você sente no momento do impulso e ter alternativas concretas fora da tela ajuda a cuidar da necessidade real.',
    recommendedTab: 'diario',
    recommendedTabLabel: 'Ir para Diário',
  },
  equilibrio_construcao: {
    id: 'equilibrio_construcao',
    title: 'Equilíbrio em Construção',
    summary:
      'Você já percebe o impacto do uso excessivo e talvez tenha tentado cortes bruscos que não se sustentaram a longo prazo.',
    recommendationTitle: 'Foque em pequenas metas progressivas',
    recommendationBody:
      'A evidência científica mostra que reduzir de forma moderada e realista (30 a 60 min/dia) gera mais bem-estar do que a abstinência rígida.',
    recommendedTab: 'pausar',
    recommendedTabLabel: 'Começar devagar',
  },
};

export const TRIGGERS: Array<{ id: TriggerId; label: string; hint: string }> = [
  { id: 'tedio', label: 'Tédio', hint: 'Momento vazio ou espera' },
  { id: 'ansiedade', label: 'Ansiedade / Estresse', hint: 'Pressão ou inquietação' },
  { id: 'fomo', label: 'FoMO', hint: 'Medo de ficar por fora' },
  { id: 'procrastinacao', label: 'Procrastinação', hint: 'Adiando uma tarefa' },
  { id: 'cansaco', label: 'Cansaço', hint: 'Energia baixa ou exaustão' },
  { id: 'habito', label: 'Hábito Automático', hint: 'Abri sem perceber' },
];

export const DAY_PERIODS: Array<{ id: DayPeriodId; label: string }> = [
  { id: 'manha', label: 'Manhã' },
  { id: 'tarde', label: 'Tarde' },
  { id: 'noite', label: 'Noite' },
  { id: 'antes_dormir', label: 'Antes de dormir' },
];

export const DURATION_LABELS: Record<OfflineDuration, string> = {
  '2min': '2 min',
  '15min': '15 min',
  '30min': '30+ min',
};

export const DEFAULT_OFFLINE_ACTIVITIES: OfflineActivity[] = [
  { id: 'off-2-1', title: "Beber um copo d'água com calma", duration: '2min' },
  { id: 'off-2-2', title: 'Alongar pescoço e ombros', duration: '2min' },
  { id: 'off-2-3', title: 'Olhar pela janela sem telas', duration: '2min' },
  { id: 'off-2-4', title: 'Fazer 5 respirações profundas', duration: '2min' },
  { id: 'off-15-1', title: 'Ler 5 páginas de um livro', duration: '15min' },
  { id: 'off-15-2', title: 'Caminhar sem o celular', duration: '15min' },
  { id: 'off-15-3', title: 'Organizar a mesa ao seu redor', duration: '15min' },
  {
    id: 'off-15-4',
    title: 'Tomar um café ou chá prestando atenção no sabor',
    duration: '15min',
  },
  { id: 'off-30-1', title: 'Fazer 30 minutos de atividade física', duration: '30min' },
  { id: 'off-30-2', title: 'Cozinhar algo novo', duration: '30min' },
  { id: 'off-30-3', title: 'Desenhar ou escrever no papel', duration: '30min' },
  { id: 'off-30-4', title: 'Encontrar ou ligar para um amigo', duration: '30min' },
];

export interface EnvironmentChecklistItem {
  id: string;
  title: string;
  whyTitle: string;
  whyBody: string;
}

export const ENVIRONMENT_CHECKLIST: EnvironmentChecklistItem[] = [
  {
    id: 'env-grayscale',
    title: 'Ativar a escala de cinza nas configurações do celular.',
    whyTitle: 'Reduz o estímulo visual imediato',
    whyBody:
      'Ícones coloridos e badges chamam a atenção do sistema visual primitivo. Sem cores saturadas, a tela perde parte do apelo compulsivo e fica mais fácil usá-la apenas como ferramenta.',
  },
  {
    id: 'env-notifications',
    title:
      'Desativar notificações não essenciais (manter apenas ligações e mensagens diretas).',
    whyTitle: 'Interrompe o ciclo de recompensas variáveis',
    whyBody:
      'Cada alerta imprevisível gera um pico rápido de expectativa e quebra o foco por vários minutos. Silenciar avisos automáticos devolve a você o momento de escolher quando checar.',
  },
  {
    id: 'env-groups',
    title: 'Silenciar grupos de mensagens muito movimentados.',
    whyTitle: 'Diminui a vigilância constante',
    whyBody:
      'Fluxos contínuos de mensagens criam a falsa urgência de responder na hora. Silenciar grupos permite ler com presença nos momentos que você reservar para isso.',
  },
  {
    id: 'env-homescreen',
    title: 'Retirar aplicativos de redes sociais da primeira tela inicial.',
    whyTitle: 'Adiciona fricção saudável ao hábito',
    whyBody:
      'Quando o aplicativo não está sob o polegar assim que você desbloqueia a tela, aqueles 2 segundos extras para buscá-lo já quebram boa parte dos acessos no piloto automático.',
  },
  {
    id: 'env-charger',
    title: 'Deixar o carregador fora do quarto ou longe da cama 1 hora antes de dormir.',
    whyTitle: 'Protege o descanso e o início do dia',
    whyBody:
      'A rolagem noturna adia o sono quando a autorregulação está mais cansada. Manter o aparelho fora do alcance da cama reduz o uso noturno e evita começar a manhã já reativo.',
  },
];

export function createSampleAppState(now: Date = new Date()): PausaAppState {
  const todayIso = (hoursAgo: number) =>
    new Date(now.getTime() - hoursAgo * 60 * 60 * 1000).toISOString();

  return {
    profile: {
      answers: {
        impulsividade: 4,
        vigilancia: 3,
        regulacaoEmocional: 5,
        fomo: 2,
        multitarefa: 4,
        perdaControle: 3,
      },
      dailyGoalMinutes: 45,
      completedAt: todayIso(48),
    },
    grayscaleMode: false,
    pauses: [
      { id: 'sample-p1', outcome: 'resisted', createdAt: todayIso(5) },
      { id: 'sample-p2', outcome: 'resisted', createdAt: todayIso(2.5) },
      { id: 'sample-p3', outcome: 'conscious', createdAt: todayIso(1.5), timerMinutes: 5 },
      { id: 'sample-p4', outcome: 'resisted', createdAt: todayIso(0.5) },
    ],
    activeTimer: null,
    customOfflineActivities: [
      {
        id: 'sample-custom-1',
        title: 'Regar as plantas da sala sem pressa',
        duration: '2min',
        isCustom: true,
      },
    ],
    offlineCompletedCount: 6,
    journalEntries: [
      {
        id: 'sample-j1',
        trigger: 'cansaco',
        period: 'antes_dormir',
        needNote: 'Desacelerar a mente e dormir mais cedo',
        createdAt: todayIso(14),
        source: 'journal',
      },
      {
        id: 'sample-j2',
        trigger: 'tedio',
        period: 'antes_dormir',
        needNote: 'Ler um capítulo curto no papel antes de apagar a luz',
        createdAt: todayIso(38),
        source: 'pause',
      },
      {
        id: 'sample-j3',
        trigger: 'ansiedade',
        period: 'tarde',
        needNote: 'Fazer uma pausa de 5 minutos longe da tela do trabalho',
        createdAt: todayIso(4),
        source: 'pause',
      },
      {
        id: 'sample-j4',
        trigger: 'habito',
        period: 'manha',
        needNote: 'Tomar café antes de abrir qualquer mensagem',
        createdAt: todayIso(7),
        source: 'journal',
      },
      {
        id: 'sample-j5',
        trigger: 'procrastinacao',
        period: 'tarde',
        needNote: 'Dividir a tarefa difícil em um passo de 10 minutos',
        createdAt: todayIso(28),
        source: 'journal',
      },
      {
        id: 'sample-j6',
        trigger: 'cansaco',
        period: 'antes_dormir',
        needNote: 'Descanso real sem estímulo luminoso',
        createdAt: todayIso(62),
        source: 'journal',
      },
      {
        id: 'sample-j7',
        trigger: 'ansiedade',
        period: 'noite',
        needNote: 'Conversar com alguém de confiança ou anotar preocupações',
        createdAt: todayIso(20),
        source: 'pause',
      },
    ],
    checkedEnvironmentIds: ['env-notifications', 'env-groups', 'env-homescreen'],
    lastAnalysis: null,
  };
}
