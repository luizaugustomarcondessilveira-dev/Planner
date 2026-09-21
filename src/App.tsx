import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { HojeView } from './components/views/HojeView';
import { AgendaView } from './components/views/AgendaView';
import { DiarioView } from './components/views/DiarioView';
import { MetasView } from './components/views/MetasView';
import { EstudosView } from './components/views/EstudosView';

import { ImageManagerModal } from './components/modals/ImageManagerModal';
import { SosPrayerModal } from './components/modals/SosPrayerModal';
import { ProfileModal } from './components/modals/ProfileModal';
import { DesabafoModal } from './components/modals/DesabafoModal';
import { LoginModal } from './components/modals/LoginModal';
import { AppointmentAlarmPopup } from './components/modals/AppointmentAlarmPopup';
import { AlarmSettingsModal } from './components/modals/AlarmSettingsModal';
import { KidsManagerModal } from './components/modals/KidsManagerModal';
import { AuthWelcomeView } from './components/auth/AuthWelcomeView';
import { PrivacyConsentModal } from './components/auth/PrivacyConsentModal';
import { AALogo } from './components/AALogo';
import { supabase, isSupabaseConfigured } from './lib/supabase';

import {
  AppTab,
  AppImages,
  RoteiroItem,
  MealPlan,
  CalendarEvent,
  JournalEntry,
  Goal,
  DesabafoEntry,
  NoticeItem,
  HydrationConfig,
  UserSession,
  KidProfile,
  AgendaAlarmConfig,
  ActiveAlarmPopup,
  PersonProfile,
  StudyData,
  EventCategory,
  SyncState,
} from './types';
import { loadJSON, saveJSON } from './utils/storage';
import { toLocalDateKey } from './utils/date';
import { soundEffects } from './utils/audio';

const DEFAULT_STUDY_DATA: StudyData = {
  banner: {
    kicker: 'Estudos & Formação',
    title: 'Cantinho dos Estudos',
    subtitle: 'Foco sereno, anotações de doutrina e passos constantes.',
  },
  projects: [],
  subjects: [],
  examTargets: [],
  focusSettings: {
    focusMin: 25,
    breakMin: 5,
    longBreakMin: 15,
    cyclesBeforeLong: 4,
    soundEnabled: true,
  },
  sessions: [],
};

const DEFAULT_SPOUSE: PersonProfile = {
  id: 'lucas',
  name: 'Lucas',
  category: 'familia',
  color: '#B88E72',
  role: 'spouse',
};

const DEFAULT_PEOPLE_LIST: PersonProfile[] = [
  DEFAULT_SPOUSE,
  {
    id: 'pequenos',
    name: 'Theo',
    category: 'pequenos',
    color: '#E8A5B8',
    role: 'kid',
    birthDate: '2022-04-12',
    notes: 'Natação, pediatra e carinho.',
    avatarUrl:
      'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80',
  },
];

const DEFAULT_ALARM_CONFIG: AgendaAlarmConfig = {
  enabled: true,
  sound: 'harpa-aurora',
  minutesBefore: 5,
  loopSound: true,
};

const DEFAULT_IMAGES: AppImages = {
  avatar:
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
  logo:
    'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80',
  meal:
    'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80',
  journal:
    'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
  goalsQuote:
    'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=800&q=80',
  studyDesk:
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80',
};

const DEFAULT_ROTEIRO: RoteiroItem[] = [];

const BLANK_ROTEIRO: RoteiroItem[] = [];

const DEFAULT_MEAL: MealPlan = {
  title: 'Almoço Planejado com Afeto',
  subtitle: 'Cardápio Saudável',
  dishName: 'Salmão com Ervas e Purê de Mandioquinha',
  description:
    'Acompanhado de salada verde crocante com tomatinhos cereja e molho de mostarda e mel.',
  time: '12:30',
  kcal: 480,
  tags: ['Rico em Ômega 3', 'Sem Glúten', 'Anti-inflamatório'],
  imageUrl: DEFAULT_IMAGES.meal,
};

const DEFAULT_EVENTS: CalendarEvent[] = [
  {
    id: 'e1',
    time: '09:00',
    title: 'Orientação de TCC com Profa. Ana',
    tag: 'Pessoal',
    category: 'pessoal',
    personId: 'me',
    description: 'Revisão dos capítulos 2 e 3 do Direito Constitucional.',
    location: 'Google Meet',
    participants: 'Orientação Acadêmica',
    tagColor: '#6B3F2A',
  },
  {
    id: 'e2',
    time: '14:30',
    title: 'Consulta Pediátrica de Rotina',
    tag: 'Filhos',
    category: 'pequenos',
    personId: 'pequenos',
    description: 'Acompanhamento de rotina e vacinas.',
    location: 'Clínica Bem-Cuidar',
    participants: 'Em família com os filhos',
    tagColor: '#E8A5B8',
  },
  {
    id: 'e3',
    time: '19:30',
    title: 'Jantar Romântico & Alinhamento Semanal',
    tag: 'Casamento',
    category: 'casamento',
    personId: 'lucas',
    description: 'Tempo de qualidade, oração conjunta e conversa com o cônjuge.',
    location: 'Bistrô Jardim Secreto',
    participants: 'Em casal',
    tagColor: '#B88E72',
  },
];

const DEFAULT_NOTICES: NoticeItem[] = [
  {
    id: 'n1',
    title: 'Natação do Theo amanhã',
    subtitle: 'Separar sunga, toalha e touca com antecedência.',
    dateStr: toLocalDateKey(new Date(Date.now() + 86400000)),
    timeStr: '08:30',
    soundAlert: true,
    done: false,
    category: 'pequenos',
  },
  {
    id: 'n2',
    title: 'Entrega da primeira versão do TCC',
    subtitle: 'Enviar arquivo PDF com capa e referências no portal.',
    dateStr: toLocalDateKey(new Date(Date.now() + 2 * 86400000)),
    timeStr: '18:00',
    soundAlert: true,
    done: false,
    category: 'pessoal',
  },
  {
    id: 'n3',
    title: 'Flores frescas para o altar de casa',
    subtitle: 'Comprar eucalipto e lírios na feira de sábado cedo.',
    dateStr: toLocalDateKey(new Date(Date.now() + 3 * 86400000)),
    timeStr: '09:00',
    soundAlert: false,
    done: true,
    category: 'familia',
  },
];

const DEFAULT_JOURNAL_ENTRIES: JournalEntry[] = [
  {
    id: 'j1',
    dayNumber: 16,
    dateStr: '16 de Outubro, 2024',
    mood: 'grata',
    moodLabel: 'Grata & Em Paz',
    title: 'A Graça nos Pequenos Começos',
    content:
      'Hoje o sol entrou suave pela janela da sala de jantar. Senti uma paz tão profunda ao agradecer pelas pequenas vitórias desta manhã. O Theo sorriu ao acordar, e o café estava fresco e aromático. Lembrei-me do versículo de Lamentações: as misericórdias do Senhor se renovam a cada manhã.\n\nNo Direito, os estudos avançam devagar, mas com clareza. Confio no tempo que Deus preparou para cada colheita.',
    tags: ['Oração', 'Maternidade', 'Paz'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'j2',
    dayNumber: 14,
    dateStr: '14 de Outubro, 2024',
    mood: 'paz',
    moodLabel: 'Serena & Focada',
    title: 'Constância Silenciosa no TCC',
    content:
      'Finalizei a primeira seção teórica. Às vezes a mente tenta acelerar, mas o coração encontra serenidade quando respira fundo e foca no parágrafo presente. A disciplina não precisa ser árdua; pode ser um ato diário de amor ao futuro que estamos construindo.',
    tags: ['Direito', 'Foco', 'Propósito'],
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_DESABAFOS: DesabafoEntry[] = [
  {
    id: 'd1',
    dateStr: '15 de Outubro, 2024',
    timeStr: '22:15',
    emotion: 'Cansaço com Gratidão',
    text:
      'Hoje o dia foi intenso. Conciliar a maternidade com o prazo do TCC às vezes pesa nos ombros. Mas ao olhar o Theo dormindo em paz, percebo que tudo vale a pena. Entreguei minhas ansiedades em oração antes de fechar os olhos.',
    status: 'guardado',
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_GOALS: Goal[] = [
  {
    id: 'g1',
    title: 'Aprovação & Defesa Brilhante do TCC em Direito',
    category: 'Faculdade (Direito)',
    progressPercent: 65,
    targetDate: 'Dezembro 2024',
    notes:
      'Concluir os capítulos finais com redação impecável, jurisprudência atualizada e defesa com serenidade.',
    milestones: [
      { id: 'm1', title: 'Estrutura e introdução aprovadas', done: true },
      { id: 'm2', title: 'Capítulo 1 e 2: Marco Teórico', done: true },
      { id: 'm3', title: 'Capítulo 3: Análise Jurisprudencial', done: false },
      { id: 'm4', title: 'Conclusão e revisão ortográfica/ABNT', done: false },
      { id: 'm5', title: 'Simulação da apresentação oral', done: false },
    ],
  },
  {
    id: 'g2',
    title: 'Cultivar um Lar de Paz, Oração e Mesa Posta',
    category: 'Vida com Deus',
    progressPercent: 80,
    targetDate: 'Constante',
    notes:
      'Manter os momentos diários de devocional com o Lucas e o Theo, e refeições nutritivas com afeto.',
    milestones: [
      { id: 'm2_1', title: 'Devocional diário ao amanhecer', done: true },
      { id: 'm2_2', title: 'Mesa posta no jantar pelo menos 5x/semana', done: true },
      { id: 'm2_3', title: 'Culto familiar aos domingos com os pequenos', done: true },
      { id: 'm2_4', title: 'Noite de casal sem telas uma vez por semana', done: false },
    ],
  },
  {
    id: 'g3',
    title: 'Saúde Integral, Pilates e Hidratação Plena',
    category: 'Estética & Bem-Estar',
    progressPercent: 50,
    targetDate: 'Novembro 2024',
    notes:
      'Alcançar a meta de 2.400ml diários de água (2 garrafas de 1.2L) e prática regular de movimento.',
    milestones: [
      { id: 'm3_1', title: 'Beber 2 garrafas de 1.2L todos os dias', done: true },
      { id: 'm3_2', title: 'Pilates 3x por semana sem faltar', done: false },
      { id: 'm3_3', title: 'Exames de rotina e vitaminas em dia', done: true },
    ],
  },
];

export function App() {
  const [currentTab, setCurrentTab] = useState<AppTab>('hoje');

  // App Title customization
  const [appTitle, setAppTitle] = useState<string>(() => {
    return loadJSON<string>('atelier_app_title', 'Atelier & Alento');
  });

  // Dark mode
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return loadJSON<boolean>('atelier_dark_mode', false);
  });

  // User Photo as Logo toggle
  const [useUserPhotoAsLogo, setUseUserPhotoAsLogo] = useState<boolean>(() => {
    return loadJSON<boolean>('atelier_user_photo_logo', false);
  });

  // User Session (managed with real Supabase Auth)
  const [userSession, setUserSession] = useState<UserSession>(() => {
    return loadJSON<UserSession>('atelier_user_session', {
      email: '',
      name: 'Helena',
      isLoggedIn: false,
    });
  });

  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);
  const [needsPrivacyConsent, setNeedsPrivacyConsent] = useState<boolean>(false);
  const [isSubmittingConsent, setIsSubmittingConsent] = useState<boolean>(false);
  const [syncState, setSyncState] = useState<SyncState>(() =>
    typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'sincronizado'
  );

  // Selected Date for HojeView navigation
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Images state
  const [images, setImages] = useState<AppImages>(() => {
    return loadJSON<AppImages>('atelier_images', DEFAULT_IMAGES);
  });

  // Daily routines per date (dateKey: YYYY-MM-DD)
  const [dailyRoteiros, setDailyRoteiros] = useState<Record<string, RoteiroItem[]>>(() => {
    const saved = loadJSON<Record<string, RoteiroItem[]> | null>('atelier_daily_roteiros', null);
    if (saved && typeof saved === 'object') {
      return saved;
    }
    return {};
  });

  // User configured default routine model
  const [userDefaultRoteiro, setUserDefaultRoteiro] = useState<RoteiroItem[]>(() => {
    return loadJSON<RoteiroItem[]>('atelier_routine_default', []);
  });

  // Auto-apply user default routine to new days (default false)
  const [autoApplyDefaultRoutine, setAutoApplyDefaultRoutine] = useState<boolean>(() => {
    return loadJSON<boolean>('atelier_auto_apply_routine', false);
  });

  // Hydration config (with 1.2L default cup as user requested)
  const [hydrationConfig, setHydrationConfig] = useState<HydrationConfig>(() => {
    return loadJSON<HydrationConfig>('atelier_hydration_config', {
      cupSizeMl: 1200,
      userWeightKg: 60,
      calculatedGoalMl: 2400,
      customGoalMl: 2400,
      remindersEnabled: true,
      reminderIntervalHours: 2,
    });
  });

  // Cups drank per day (dateKey: cupsCount)
  const [dailyCupsDrank, setDailyCupsDrank] = useState<Record<string, number>>(() => {
    const todayKey = toLocalDateKey(new Date());
    const saved = loadJSON<Record<string, number> | null>('atelier_daily_cups', null);
    if (saved && typeof saved === 'object') {
      return saved;
    }
    return { [todayKey]: 1 };
  });

  // Meal state
  const [meal, setMeal] = useState<MealPlan>(() => {
    return loadJSON<MealPlan>('atelier_meal', DEFAULT_MEAL);
  });

  // Calendar Events (Migração e validação de dateStr e personId)
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    const todayStr = toLocalDateKey(new Date());
    const rawEvents = loadJSON<CalendarEvent[]>('atelier_events', DEFAULT_EVENTS);
    return rawEvents.map((ev) => {
      let assignedPersonId = ev.personId;
      if (!assignedPersonId) {
        if (ev.category === 'pessoal') assignedPersonId = 'me';
        else if (ev.category === 'casamento' || ev.category === 'familia')
          assignedPersonId = 'lucas';
        else if (ev.category === 'pequenos') assignedPersonId = 'pequenos';
        else assignedPersonId = 'me';
      }
      return {
        ...ev,
        personId: assignedPersonId,
        dateStr: ev.dateStr || todayStr,
      };
    });
  });

  // Notices with sound alerts
  const [notices, setNotices] = useState<NoticeItem[]>(() => {
    return loadJSON<NoticeItem[]>('atelier_notices', DEFAULT_NOTICES);
  });

  // Journal Entries
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => {
    return loadJSON<JournalEntry[]>('atelier_journal', DEFAULT_JOURNAL_ENTRIES);
  });

  // Desabafos
  const [desabafos, setDesabafos] = useState<DesabafoEntry[]>(() => {
    return loadJSON<DesabafoEntry[]>('atelier_desabafos', DEFAULT_DESABAFOS);
  });

  // Goals
  const [goals, setGoals] = useState<Goal[]>(() => {
    return loadJSON<Goal[]>('atelier_goals', DEFAULT_GOALS);
  });

  // Study State (Cantinho dos Estudos, Projetos, Disciplinas, Pomodoro)
  const [studyData, setStudyData] = useState<StudyData>(() => {
    return loadJSON<StudyData>('atelier_study', DEFAULT_STUDY_DATA);
  });

  // People profiles (cônjuge + filhos) - Fonte única de verdade
  const [people, setPeople] = useState<PersonProfile[]>(() => {
    const saved = loadJSON<PersonProfile[] | null>('atelier_people', null);
    if (saved && Array.isArray(saved) && saved.length > 0) {
      return saved.filter((p: PersonProfile) => p.id !== 'me' && p.role !== 'primary');
    }

    const savedKids = loadJSON<any[] | null>('atelier_kids', null);
    let migratedKids: PersonProfile[] = [];
    if (savedKids && Array.isArray(savedKids) && savedKids.length > 0) {
      migratedKids = savedKids.map((k: any) => ({
        id: k.id || `k_${Date.now()}`,
        name: (k.name || 'Theo').trim(),
        avatarUrl: k.photoUrl || '',
        category: 'pequenos',
        color: '#E8A5B8',
        role: 'kid',
      }));
    }

    if (migratedKids.length > 0) {
      return [DEFAULT_SPOUSE, ...migratedKids];
    }

    return DEFAULT_PEOPLE_LIST;
  });

  // Pessoa principal derivada de userSession.name e images.avatar (com color e category opcionais)
  const allPeople = useMemo<PersonProfile[]>(() => {
    const principal: PersonProfile = {
      id: 'me',
      name: userSession.name || 'Helena',
      avatarUrl: images.avatar || '',
      category: userSession.category || 'pessoal',
      color: userSession.color || '#6B3F2A',
      role: 'primary',
    };
    return [principal, ...people];
  }, [userSession.name, userSession.color, userSession.category, images.avatar, people]);

  // Kids derivado de people (role 'kid' ou category 'pequenos')
  const kids = useMemo<KidProfile[]>(() => {
    return people
      .filter((p) => p.role === 'kid' || p.category === 'pequenos')
      .map((p) => ({
        id: p.id,
        name: p.name,
        photoUrl: p.avatarUrl || '',
        birthDate: p.birthDate,
        notes: p.notes,
      }));
  }, [people]);

  // Agenda Alarm Configuration (Custom sounds, minutes before)
  const [alarmConfig, setAlarmConfig] = useState<AgendaAlarmConfig>(() => {
    return loadJSON<AgendaAlarmConfig>('atelier_alarm_config', DEFAULT_ALARM_CONFIG);
  });

  // Active alarm popup on screen
  const [activeAlarm, setActiveAlarm] = useState<ActiveAlarmPopup | null>(null);

  // Modals visibility
  const [isImageManagerOpen, setIsImageManagerOpen] = useState(false);
  const [isSosPrayerOpen, setIsSosPrayerOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDesabafoOpen, setIsDesabafoOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAlarmSettingsOpen, setIsAlarmSettingsOpen] = useState(false);
  const [isKidsManagerOpen, setIsKidsManagerOpen] = useState(false);

  // Set to prevent re-triggering the same alarm within the same minute
  const triggeredAlarmsRef = useRef<Set<string>>(new Set());

  // Desbloqueio de áudio em navegadores mobile (iOS Safari / Web Audio Context)
  useEffect(() => {
    const unlock = () => {
      soundEffects.unlockAudio();
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  // Solicitar permissão de notificação do navegador
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    }
  }, []);

  // Alarm clock watcher: checks every 10 seconds if an appointment or notice alarm should sound & popup
  useEffect(() => {
    if (!alarmConfig.enabled) return;

    const checkAlarms = () => {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentTotalMinutes = currentHours * 60 + currentMinutes;
      const todayLocalStr = toLocalDateKey(now);
      const currentDayNumStr = String(now.getDate());

      // 1. Checar eventos da agenda
      events.forEach((ev) => {
        if (ev.alarmEnabled === false) return;
        if (!ev.time) return;

        // Ignorar evento com dateStr diferente de hoje (data LOCAL)
        if (
          ev.dateStr &&
          ev.dateStr.trim() !== '' &&
          ev.dateStr !== todayLocalStr &&
          !ev.dateStr.toLowerCase().includes('hoje')
        ) {
          return;
        }

        const [h, m] = ev.time.split(':').map(Number);
        if (isNaN(h) || isNaN(m)) return;

        const eventTotalMinutes = h * 60 + m;
        const minutesBefore = ev.minutesBeforeAlarm ?? alarmConfig.minutesBefore ?? 5;
        const targetTriggerMinute = eventTotalMinutes - minutesBefore;

        const alarmKey = `${todayLocalStr}_ev_${ev.id}_${eventTotalMinutes}_${minutesBefore}`;

        if (
          currentTotalMinutes >= targetTriggerMinute &&
          currentTotalMinutes <= eventTotalMinutes &&
          !triggeredAlarmsRef.current.has(alarmKey)
        ) {
          triggeredAlarmsRef.current.add(alarmKey);

          setActiveAlarm({
            id: `alarm_ev_${ev.id}_${Date.now()}`,
            title: ev.title,
            subtitle: ev.description || '',
            description: ev.description || '',
            timeStr: ev.time,
            time: ev.time,
            category: ev.category,
            location: ev.location || '',
            minutesBefore,
          });

          if (
            typeof window !== 'undefined' &&
            'Notification' in window &&
            Notification.permission === 'granted' &&
            document.hidden
          ) {
            try {
              new Notification(`⏰ Despertador: ${ev.title}`, {
                body: `${ev.time} • ${ev.description || 'Horário do seu compromisso.'}`,
              });
            } catch (e) {}
          }
        }
      });

      // 2. Checar avisos (notices) com soundAlert=true, done=false e data/hora de hoje
      notices.forEach((not) => {
        if (!not.soundAlert || not.done) return;
        if (!not.timeStr) return;

        if (
          not.dateStr &&
          not.dateStr.trim() !== '' &&
          not.dateStr !== todayLocalStr &&
          !not.dateStr.toLowerCase().includes('hoje') &&
          !not.dateStr.toLowerCase().includes(currentDayNumStr)
        ) {
          return;
        }

        const [nh, nm] = not.timeStr.split(':').map(Number);
        if (isNaN(nh) || isNaN(nm)) return;

        const noticeTotalMinutes = nh * 60 + nm;
        const minutesBefore = not.minutesBeforeAlarm ?? 0;
        const targetTriggerMinute = noticeTotalMinutes - minutesBefore;

        const alarmKey = `${todayLocalStr}_not_${not.id}_${not.dateStr}_${not.timeStr}_${not.title}_${minutesBefore}`;

        if (
          currentTotalMinutes >= targetTriggerMinute &&
          currentTotalMinutes <= noticeTotalMinutes &&
          !triggeredAlarmsRef.current.has(alarmKey)
        ) {
          triggeredAlarmsRef.current.add(alarmKey);

          setActiveAlarm({
            id: `alarm_not_${not.id}_${Date.now()}`,
            title: not.title,
            subtitle: not.subtitle || '',
            description: not.subtitle || '',
            timeStr: not.timeStr,
            time: not.timeStr,
            category: not.category || 'pequenos',
            location: '',
            minutesBefore,
          });

          if (
            typeof window !== 'undefined' &&
            'Notification' in window &&
            Notification.permission === 'granted' &&
            document.hidden
          ) {
            try {
              new Notification(`🔔 Aviso: ${not.title}`, {
                body: `${not.timeStr} • ${not.subtitle || 'Lembrete importante.'}`,
              });
            } catch (e) {}
          }
        }
      });
    };

    checkAlarms();
    const interval = setInterval(checkAlarms, 10000);
    return () => clearInterval(interval);
  }, [events, notices, alarmConfig]);

  // Listen to network status (Online / Offline)
  useEffect(() => {
    const handleOnline = () => setSyncState('sincronizado');
    const handleOffline = () => setSyncState('offline');
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Supabase Auth session & onAuthStateChange listener
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsAuthLoading(false);
      return;
    }

    let isMounted = true;

    const handleSession = async (session: any) => {
      if (!isMounted) return;
      if (session?.user) {
        const user = session.user;
        const email = user.email || '';
        const rawName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          (email ? email.split('@')[0] : 'Helena');

        try {
          // Check profile for consent and profile identity
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          if (error) {
            console.warn('Profile query warning:', error.message);
          }

          if (!profile || !profile.consent_accepted_at) {
            if (isMounted) setNeedsPrivacyConsent(true);
          } else {
            if (isMounted) setNeedsPrivacyConsent(false);
          }

          if (isMounted) {
            setUserSession({
              id: user.id,
              email,
              name: profile?.display_name || rawName,
              color: profile?.color || '#6B3F2A',
              category: (profile?.category as EventCategory) || 'pessoal',
              avatarUrl: profile?.avatar_thumb || user.user_metadata?.avatar_url || '',
              consentAcceptedAt: profile?.consent_accepted_at,
              consentVersion: profile?.consent_version,
              isLoggedIn: true,
              lastSyncedAt:
                'Hoje às ' +
                new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            });

            if (profile?.avatar_thumb) {
              setImages((prev) => ({ ...prev, avatar: profile.avatar_thumb }));
            }
            setAuthErrorMessage(null);
            setSyncState('sincronizado');
          }
        } catch (e) {
          console.error('Error loading user profile:', e);
          if (isMounted) {
            setUserSession({
              id: user.id,
              email,
              name: rawName,
              isLoggedIn: true,
              lastSyncedAt:
                'Hoje às ' +
                new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            });
          }
        }
      } else {
        if (isMounted) {
          setUserSession({
            email: '',
            name: 'Helena',
            isLoggedIn: false,
          });
          setNeedsPrivacyConsent(false);
        }
      }

      if (isMounted) {
        setIsAuthLoading(false);
      }
    };

    // Initial getSession check
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.warn('Supabase getSession error:', error.message);
        if (isMounted) {
          setAuthErrorMessage('Sua sessão expirou. Faça login com o Google para continuar.');
          setIsAuthLoading(false);
        }
      } else {
        handleSession(session);
      }
    });

    // Subscribe to auth state transitions
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        if (isMounted) {
          setUserSession({
            email: '',
            name: 'Helena',
            isLoggedIn: false,
          });
          setNeedsPrivacyConsent(false);
          setIsAuthLoading(false);
        }
      } else if (
        event === 'SIGNED_IN' ||
        event === 'TOKEN_REFRESHED' ||
        event === 'USER_UPDATED'
      ) {
        handleSession(session);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Sync Dark Mode with DOM
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    saveJSON('atelier_dark_mode', isDarkMode);
  }, [isDarkMode]);

  // Persist State to localStorage safely
  useEffect(() => {
    saveJSON('atelier_app_title', appTitle);
  }, [appTitle]);

  useEffect(() => {
    saveJSON('atelier_user_photo_logo', useUserPhotoAsLogo);
  }, [useUserPhotoAsLogo]);

  useEffect(() => {
    saveJSON('atelier_user_session', userSession);
  }, [userSession]);

  useEffect(() => {
    saveJSON('atelier_images', images);
  }, [images]);

  useEffect(() => {
    saveJSON('atelier_people', people);
  }, [people]);

  useEffect(() => {
    saveJSON('atelier_alarm_config', alarmConfig);
  }, [alarmConfig]);

  useEffect(() => {
    saveJSON('atelier_daily_roteiros', dailyRoteiros);
  }, [dailyRoteiros]);

  useEffect(() => {
    saveJSON('atelier_hydration_config', hydrationConfig);
  }, [hydrationConfig]);

  useEffect(() => {
    saveJSON('atelier_daily_cups', dailyCupsDrank);
  }, [dailyCupsDrank]);

  useEffect(() => {
    saveJSON('atelier_meal', meal);
  }, [meal]);

  useEffect(() => {
    saveJSON('atelier_events', events);
  }, [events]);

  useEffect(() => {
    saveJSON('atelier_routine_default', userDefaultRoteiro);
  }, [userDefaultRoteiro]);

  useEffect(() => {
    saveJSON('atelier_auto_apply_routine', autoApplyDefaultRoutine);
  }, [autoApplyDefaultRoutine]);

  useEffect(() => {
    saveJSON('atelier_notices', notices);
  }, [notices]);

  useEffect(() => {
    saveJSON('atelier_journal', journalEntries);
  }, [journalEntries]);

  useEffect(() => {
    saveJSON('atelier_desabafos', desabafos);
  }, [desabafos]);

  useEffect(() => {
    saveJSON('atelier_goals', goals);
  }, [goals]);

  useEffect(() => {
    saveJSON('atelier_study', studyData);
  }, [studyData]);

  // Derived dayStats summary from dailyRoteiros for interactive month constancy calendar
  const dayStats = useMemo(() => {
    const stats: Record<string, { total: number; done: number }> = {};
    for (const [dateKey, items] of Object.entries(dailyRoteiros)) {
      if (Array.isArray(items)) {
        stats[dateKey] = {
          total: items.length,
          done: items.filter((it) => it.done).length,
        };
      }
    }
    return stats;
  }, [dailyRoteiros]);

  // Roteiro for selected date (Empty if unedited, unless auto-apply is enabled)
  const currentDateKey = toLocalDateKey(selectedDate);
  const currentRoteiro = useMemo(() => {
    if (dailyRoteiros[currentDateKey] !== undefined) {
      return dailyRoteiros[currentDateKey];
    }
    if (autoApplyDefaultRoutine && userDefaultRoteiro.length > 0) {
      return userDefaultRoteiro.map((item) => ({ ...item, done: false }));
    }
    return [];
  }, [dailyRoteiros, currentDateKey, autoApplyDefaultRoutine, userDefaultRoteiro]);

  const currentCups = dailyCupsDrank[currentDateKey] || 0;

  // Handlers for HojeView
  const handleToggleRoteiro = (id: string) => {
    setDailyRoteiros((prev) => {
      const dayList =
        prev[currentDateKey] !== undefined
          ? prev[currentDateKey]
          : autoApplyDefaultRoutine && userDefaultRoteiro.length > 0
          ? userDefaultRoteiro.map((it) => ({ ...it, done: false }))
          : [];
      const updated = dayList.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item
      );
      return { ...prev, [currentDateKey]: updated };
    });
  };

  const handleAddRoteiroItem = (newItem: Omit<RoteiroItem, 'id'>) => {
    setDailyRoteiros((prev) => {
      const dayList =
        prev[currentDateKey] !== undefined
          ? prev[currentDateKey]
          : autoApplyDefaultRoutine && userDefaultRoteiro.length > 0
          ? userDefaultRoteiro.map((it) => ({ ...it, done: false }))
          : [];
      const created: RoteiroItem = {
        ...newItem,
        id: `r_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      };
      return { ...prev, [currentDateKey]: [...dayList, created] };
    });
  };

  const handleEditRoteiroItem = (id: string, updatedItem: Partial<RoteiroItem>) => {
    setDailyRoteiros((prev) => {
      const dayList =
        prev[currentDateKey] !== undefined
          ? prev[currentDateKey]
          : autoApplyDefaultRoutine && userDefaultRoteiro.length > 0
          ? userDefaultRoteiro.map((it) => ({ ...it, done: false }))
          : [];
      const updated = dayList.map((item) =>
        item.id === id ? { ...item, ...updatedItem } : item
      );
      return { ...prev, [currentDateKey]: updated };
    });
  };

  const handleDeleteRoteiroItem = (id: string) => {
    setDailyRoteiros((prev) => {
      const dayList =
        prev[currentDateKey] !== undefined
          ? prev[currentDateKey]
          : autoApplyDefaultRoutine && userDefaultRoteiro.length > 0
          ? userDefaultRoteiro.map((it) => ({ ...it, done: false }))
          : [];
      const updated = dayList.filter((item) => item.id !== id);
      return { ...prev, [currentDateKey]: updated };
    });
  };

  const handleClearDayRoteiro = () => {
    setDailyRoteiros((prev) => ({
      ...prev,
      [currentDateKey]: [],
    }));
  };

  const handleApplyDefaultRoteiro = () => {
    setDailyRoteiros((prev) => ({
      ...prev,
      [currentDateKey]: userDefaultRoteiro.map((item) => ({
        ...item,
        id: `r_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        done: false,
      })),
    }));
  };

  const handleSaveCurrentAsDefaultRoteiro = () => {
    const current = dailyRoteiros[currentDateKey] || [];
    const defaultList = current.map((item) => ({
      ...item,
      done: false,
      statusTag: item.time || 'Pendente',
    }));
    setUserDefaultRoteiro(defaultList);
    soundEffects.playSereneChime();
  };

  const handleToggleAutoApplyDefault = (enabled: boolean) => {
    setAutoApplyDefaultRoutine(enabled);
  };

  const handleSetCupsDrankToday = (count: number) => {
    setDailyCupsDrank((prev) => ({
      ...prev,
      [currentDateKey]: Math.max(0, count),
    }));
  };

  // Handlers for Agenda
  const handleAddEvent = (newEvent: Omit<CalendarEvent, 'id'>) => {
    const created: CalendarEvent = {
      ...newEvent,
      id: `ev_${Date.now()}`,
    };
    setEvents((prev) => [created, ...prev]);
  };

  const handleEditEvent = (id: string, updatedEvent: Omit<CalendarEvent, 'id'>) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...updatedEvent, id } : e)));
  };

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const handleAddNotice = (newNotice: Omit<NoticeItem, 'id'>) => {
    const created: NoticeItem = {
      ...newNotice,
      id: `not_${Date.now()}`,
    };
    setNotices((prev) => [created, ...prev]);
  };

  const handleToggleNotice = (id: string) => {
    setNotices((prev) =>
      prev.map((n) => (n.id === id ? { ...n, done: !n.done } : n))
    );
  };

  const handleEditNotice = (id: string, updatedData: Partial<Omit<NoticeItem, 'id'>>) => {
    if (!updatedData.title || !updatedData.title.trim()) return;
    setNotices((prev) =>
      prev.map((n) => {
        if (n.id === id) {
          return {
            ...n,
            ...updatedData,
            title: updatedData.title!.trim(),
            subtitle: updatedData.subtitle !== undefined ? updatedData.subtitle.trim() : n.subtitle,
            dateStr: updatedData.dateStr || n.dateStr,
            timeStr: updatedData.timeStr || n.timeStr,
          };
        }
        return n;
      })
    );
  };

  const handleDeleteNotice = (id: string) => {
    setNotices((prev) => prev.filter((n) => n.id !== id));
  };

  const handleUpdatePerson = (updatedPerson: PersonProfile) => {
    const trimmedName = updatedPerson.name.trim();
    if (updatedPerson.id === 'me' || updatedPerson.role === 'primary') {
      setUserSession((prev) => ({
        ...prev,
        name: trimmedName || prev.name,
        color: updatedPerson.color || prev.color,
        category: updatedPerson.category || prev.category,
      }));
      if (updatedPerson.avatarUrl !== undefined) {
        setImages((prev) => ({
          ...prev,
          avatar: updatedPerson.avatarUrl || prev.avatar,
        }));
      }
    } else {
      setPeople((prev) =>
        prev.map((p) =>
          p.id === updatedPerson.id
            ? {
                ...p,
                ...updatedPerson,
                name: trimmedName || p.name,
                avatarUrl:
                  updatedPerson.avatarUrl !== undefined
                    ? updatedPerson.avatarUrl
                    : p.avatarUrl,
              }
            : p
        )
      );
    }
  };

  const handleAddPerson = (newPerson: PersonProfile) => {
    const trimmedName = newPerson.name.trim();
    if (!trimmedName) return;

    setPeople((prev) => [
      ...prev,
      {
        ...newPerson,
        name: trimmedName,
        id: newPerson.id || crypto.randomUUID(),
      },
    ]);
  };

  const handleDeletePerson = (personId: string, reassignToPersonId?: string) => {
    if (personId === 'me') return; // Cannot delete primary user

    // 1. Remove person from people list
    setPeople((prev) => prev.filter((p) => p.id !== personId));

    // 2. Handle events linked to this person
    if (reassignToPersonId) {
      const targetPerson = allPeople.find((p) => p.id === reassignToPersonId);
      setEvents((prev) =>
        prev.map((ev) => {
          if (ev.personId === personId) {
            return {
              ...ev,
              personId: reassignToPersonId,
              category: targetPerson ? targetPerson.category : ev.category,
              tagColor: targetPerson ? targetPerson.color : ev.tagColor,
            };
          }
          return ev;
        })
      );
    } else {
      // Delete events linked to this person
      setEvents((prev) => prev.filter((ev) => ev.personId !== personId));
    }
  };

  const handleUpdateKids = (updatedKids: KidProfile[]) => {
    setPeople((prev) => {
      const nonKids = prev.filter((p) => p.role !== 'kid' && p.category !== 'pequenos');
      const updatedKidProfiles: PersonProfile[] = updatedKids.map((k) => {
        const existing = prev.find((p) => p.id === k.id);
        return {
          id: k.id,
          name: k.name.trim(),
          avatarUrl: k.photoUrl,
          category: 'pequenos',
          color: existing?.color || '#E8A5B8',
          role: 'kid',
          birthDate: k.birthDate || existing?.birthDate,
          notes: k.notes || existing?.notes,
        };
      });
      return [...nonKids, ...updatedKidProfiles];
    });
  };

  // Handlers for Diario
  const handleAddJournalEntry = (newEntry: Omit<JournalEntry, 'id' | 'createdAt'>) => {
    const created: JournalEntry = {
      ...newEntry,
      id: `j_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setJournalEntries((prev) => [created, ...prev]);
  };

  const handleDeleteJournalEntry = (id: string) => {
    setJournalEntries((prev) => prev.filter((j) => j.id !== id));
  };

  // Handlers for Desabafo
  const handleSaveDesabafo = (entry: Omit<DesabafoEntry, 'id' | 'createdAt'>) => {
    const created: DesabafoEntry = {
      ...entry,
      id: `des_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setDesabafos((prev) => [created, ...prev]);
  };

  const handleDeleteDesabafo = (id: string) => {
    setDesabafos((prev) => prev.filter((d) => d.id !== id));
  };

  // Handlers for Metas
  const handleToggleMilestone = (goalId: string, milestoneId: string) => {
    setGoals((prev) =>
      prev.map((goal) => {
        if (goal.id !== goalId) return goal;
        const updatedMilestones = goal.milestones.map((m) =>
          m.id === milestoneId ? { ...m, done: !m.done } : m
        );
        const doneCount = updatedMilestones.filter((m) => m.done).length;
        const percent = Math.round((doneCount / updatedMilestones.length) * 100);
        return {
          ...goal,
          milestones: updatedMilestones,
          progressPercent: percent,
        };
      })
    );
  };

  const handleAddGoal = (newGoal: Omit<Goal, 'id'>) => {
    const created: Goal = {
      ...newGoal,
      id: `g_${Date.now()}`,
    };
    setGoals((prev) => [created, ...prev]);
  };

  const handleDeleteGoal = (goalId: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
  };

  // Real Supabase Google Login Handler
  const handleLoginWithGoogle = async () => {
    if (!isSupabaseConfigured || !supabase) {
      setAuthErrorMessage(
        'Configuração do Supabase ausente. Defina as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.'
      );
      return;
    }
    setAuthErrorMessage(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      setAuthErrorMessage(error.message);
      throw error;
    }
  };

  // Real Privacy Consent Acceptance Handler
  const handleAcceptPrivacyConsent = async () => {
    if (!userSession.id || !supabase) return;
    setIsSubmittingConsent(true);
    const now = new Date().toISOString();
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: userSession.id,
        display_name: userSession.name || 'Helena',
        color: userSession.color || '#6B3F2A',
        category: userSession.category || 'pessoal',
        avatar_thumb: images.avatar || userSession.avatarUrl || null,
        consent_accepted_at: now,
        consent_version: '1.0',
      });

      if (error) {
        throw error;
      }

      setUserSession((prev) => ({
        ...prev,
        consentAcceptedAt: now,
        consentVersion: '1.0',
      }));
      setNeedsPrivacyConsent(false);
    } catch (err: unknown) {
      console.error('Consent error:', err);
      throw err;
    } finally {
      setIsSubmittingConsent(false);
    }
  };

  // Real Logout Handler (cleans localStorage atelier_* keys and signs out)
  const handleRealLogout = async () => {
    try {
      setSyncState('sincronizando');
      if (supabase) {
        supabase.removeAllChannels();
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn('SignOut warning:', err);
    } finally {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('atelier_')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      } catch (e) {
        console.warn('Failed clearing storage:', e);
      }

      setUserSession({
        email: '',
        name: 'Helena',
        isLoggedIn: false,
      });
      setNeedsPrivacyConsent(false);
      setSyncState('sincronizado');
    }
  };

  // Manual Sync Handler with Supabase
  const handleManualSync = async () => {
    setSyncState('sincronizando');
    try {
      if (userSession.id && supabase) {
        await supabase.from('profiles').upsert({
          id: userSession.id,
          display_name: userSession.name || 'Helena',
          color: userSession.color || '#6B3F2A',
          category: userSession.category || 'pessoal',
          avatar_thumb: images.avatar || null,
          consent_accepted_at: userSession.consentAcceptedAt || new Date().toISOString(),
          consent_version: userSession.consentVersion || '1.0',
        });
      }
      setUserSession((prev) => ({
        ...prev,
        lastSyncedAt:
          'Hoje às ' +
          new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      }));
      setSyncState('sincronizado');
    } catch (err) {
      setSyncState('erro');
      throw err;
    }
  };

  // Export full JSON backup
  const handleExportData = () => {
    try {
      const backup = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        appTitle,
        userSession,
        images,
        people: allPeople,
        kids,
        alarmConfig,
        dailyRoteiros,
        userDefaultRoteiro,
        autoApplyDefaultRoutine,
        hydrationConfig,
        dailyCupsDrank,
        meal,
        events,
        notices,
        journalEntries,
        desabafos,
        goals,
        studyData,
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', url);
      downloadAnchor.setAttribute(
        'download',
        `atelier_alento_backup_${toLocalDateKey(new Date())}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error('Failed to export backup:', err);
      alert('Erro ao gerar arquivo de backup.');
    }
  };

  // Import JSON backup
  const handleImportData = (jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.appTitle) setAppTitle(data.appTitle);
      if (data.userSession) setUserSession(data.userSession);
      if (data.images) setImages(data.images);
      if (data.people && Array.isArray(data.people)) {
        setPeople(data.people.filter((p: any) => p.id !== 'me' && p.role !== 'primary'));
      } else if (data.kids && Array.isArray(data.kids)) {
        const migratedKids: PersonProfile[] = data.kids.map((k: any) => ({
          id: k.id || `k_${Date.now()}`,
          name: (k.name || 'Theo').trim(),
          avatarUrl: k.photoUrl || '',
          category: 'pequenos',
          color: '#E8A5B8',
          role: 'kid',
        }));
        setPeople([DEFAULT_SPOUSE, ...migratedKids]);
      }
      if (data.alarmConfig) setAlarmConfig(data.alarmConfig);
      if (data.dailyRoteiros) setDailyRoteiros(data.dailyRoteiros);
      if (data.userDefaultRoteiro && Array.isArray(data.userDefaultRoteiro)) {
        setUserDefaultRoteiro(data.userDefaultRoteiro);
      }
      if (typeof data.autoApplyDefaultRoutine === 'boolean') {
        setAutoApplyDefaultRoutine(data.autoApplyDefaultRoutine);
      }
      if (data.hydrationConfig) setHydrationConfig(data.hydrationConfig);
      if (data.dailyCupsDrank) setDailyCupsDrank(data.dailyCupsDrank);
      if (data.meal) setMeal(data.meal);
      if (data.events && Array.isArray(data.events)) {
        const todayStr = toLocalDateKey(new Date());
        setEvents(
          data.events.map((ev: any) => {
            let assignedPersonId = ev.personId;
            if (!assignedPersonId) {
              if (ev.category === 'pessoal') assignedPersonId = 'me';
              else if (ev.category === 'casamento' || ev.category === 'familia')
                assignedPersonId = 'lucas';
              else if (ev.category === 'pequenos') assignedPersonId = 'pequenos';
              else assignedPersonId = 'me';
            }
            return {
              ...ev,
              personId: assignedPersonId,
              dateStr: ev.dateStr || todayStr,
            };
          })
        );
      }
      if (data.notices) setNotices(data.notices);
      if (data.journalEntries) setJournalEntries(data.journalEntries);
      if (data.desabafos) setDesabafos(data.desabafos);
      if (data.goals) setGoals(data.goals);
      if (data.studyData) setStudyData(data.studyData);
    } catch (err) {
      console.error('Failed to parse backup:', err);
    }
  };

  // Helper to add event from Study view into agenda
  const handleAddEventFromStudy = (eventData: {
    title: string;
    dateStr: string;
    time?: string;
    category?: EventCategory;
    description?: string;
  }) => {
    const existing = events.find(
      (e) =>
        e.dateStr === eventData.dateStr &&
        e.title.trim().toLowerCase() === eventData.title.trim().toLowerCase()
    );
    if (existing) {
      return { added: false, message: 'Este compromisso já está registrado na sua agenda.' };
    }
    const newEvent: CalendarEvent = {
      id: crypto.randomUUID(),
      title: eventData.title.trim(),
      dateStr: eventData.dateStr,
      time: eventData.time || '08:00',
      category: eventData.category || 'pessoal',
      personId: 'me',
      tag: 'Estudos',
      tagColor: '#6B3F2A',
      description: eventData.description || 'Cadastrado a partir da aba Estudos.',
      location: 'Estudos',
    };
    setEvents((prev) => [...prev, newEvent]);
    return { added: true, message: 'Adicionado à sua agenda com sucesso!' };
  };

  // Alarm action handlers (AppointmentAlarmPopup is the sole owner of sound management)
  const handleDismissAlarm = () => {
    setActiveAlarm(null);
  };

  const handleSnoozeAlarm = (minutes: number) => {
    const current = activeAlarm;
    setActiveAlarm(null);

    if (current) {
      setTimeout(() => {
        setActiveAlarm({
          ...current,
          id: `snoozed_${Date.now()}`,
          minutesBefore: 0,
        });
      }, minutes * 60 * 1000);
    }
  };

  const handleTriggerTestAlarm = () => {
    setActiveAlarm({
      id: `test_${Date.now()}`,
      title: 'Consulta Pediátrica de Rotina',
      subtitle: 'Lembrete sonoro com pop-up adaptado para celular.',
      description: 'Lembrete sonoro com pop-up adaptado para celular.',
      timeStr: '14:30',
      time: '14:30',
      category: 'pequenos',
      location: 'Clínica Bem-Cuidar',
      minutesBefore: alarmConfig.minutesBefore,
    });
  };

  // If authentication is being resolved
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#1E1712] flex flex-col items-center justify-center p-6 text-center">
        <div className="p-2 rounded-full ring-4 ring-[#E8A5B8]/30 animate-pulse mb-4">
          <AALogo size={56} />
        </div>
        <h2 className="font-serif text-xl font-semibold text-[#452414] dark:text-[#F6F1EC]">
          Atelier & Alento
        </h2>
        <p className="text-xs text-[#8C6E5E] dark:text-[#B59D8F] mt-1">
          Verificando acesso seguro...
        </p>
      </div>
    );
  }

  // If user is not authenticated, show strictly the Google OAuth Welcome View (no planner data exposed)
  if (!userSession.isLoggedIn) {
    return (
      <AuthWelcomeView
        onLoginWithGoogle={handleLoginWithGoogle}
        isLoading={isAuthLoading}
        errorMessage={authErrorMessage}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#1A140F] text-[#452414] dark:text-[#F6F1EC] transition-colors flex flex-col font-sans selection:bg-[#E8A5B8] selection:text-[#452414]">
      {/* 1. Header with active tab indicator, customizable title, logo toggle, dark mode, login, and desabafo trigger */}
      <Header
        currentTab={currentTab}
        images={images}
        appTitle={appTitle}
        onUpdateAppTitle={setAppTitle}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
        userSession={userSession}
        syncState={syncState}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onOpenDesabafoModal={() => setIsDesabafoOpen(true)}
        onOpenImageManager={() => setIsImageManagerOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        useUserPhotoAsLogo={useUserPhotoAsLogo}
        onToggleUserPhotoAsLogo={() => setUseUserPhotoAsLogo((prev) => !prev)}
      />

      {/* 2. Main Content View Area */}
      <main className="flex-1 w-full max-w-xl mx-auto px-4 sm:px-6 pt-4">
        {currentTab === 'hoje' && (
          <HojeView
            selectedDate={selectedDate}
            onChangeDate={setSelectedDate}
            userName={userSession.name}
            roteiro={currentRoteiro}
            onToggleRoteiro={handleToggleRoteiro}
            onAddRoteiroItem={handleAddRoteiroItem}
            onEditRoteiroItem={handleEditRoteiroItem}
            onDeleteRoteiroItem={handleDeleteRoteiroItem}
            onClearDayRoteiro={handleClearDayRoteiro}
            onResetDayRoteiro={handleApplyDefaultRoteiro}
            onSaveAsDefaultRoteiro={handleSaveCurrentAsDefaultRoteiro}
            onApplyDefaultRoteiro={handleApplyDefaultRoteiro}
            userDefaultRoteiro={userDefaultRoteiro}
            autoApplyDefaultRoutine={autoApplyDefaultRoutine}
            onToggleAutoApplyDefault={handleToggleAutoApplyDefault}
            dayStats={dayStats}
            meal={meal}
            onUpdateMeal={setMeal}
            images={images}
            onOpenSosPrayer={() => setIsSosPrayerOpen(true)}
            onOpenDesabafo={() => setIsDesabafoOpen(true)}
            onOpenImageManager={() => setIsImageManagerOpen(true)}
            hydrationConfig={hydrationConfig}
            onUpdateHydrationConfig={setHydrationConfig}
            cupsDrankToday={currentCups}
            onSetCupsDrankToday={handleSetCupsDrankToday}
          />
        )}

        {currentTab === 'agenda' && (
          <AgendaView
            events={events}
            onAddEvent={handleAddEvent}
            onEditEvent={handleEditEvent}
            onDeleteEvent={handleDeleteEvent}
            notices={notices}
            onAddNotice={handleAddNotice}
            onEditNotice={handleEditNotice}
            onToggleNotice={handleToggleNotice}
            onDeleteNotice={handleDeleteNotice}
            userName={userSession.name}
            people={allPeople}
            onAddPerson={handleAddPerson}
            onUpdatePerson={handleUpdatePerson}
            onDeletePerson={handleDeletePerson}
            kids={kids}
            onOpenKidsManager={() => setIsKidsManagerOpen(true)}
            alarmConfig={alarmConfig}
            onOpenAlarmSettings={() => setIsAlarmSettingsOpen(true)}
            onTriggerTestAlarm={handleTriggerTestAlarm}
            syncState={syncState}
          />
        )}

        {currentTab === 'diario' && (
          <DiarioView
            entries={journalEntries}
            onAddEntry={handleAddJournalEntry}
            onDeleteEntry={handleDeleteJournalEntry}
            images={images}
            onOpenImageManager={() => setIsImageManagerOpen(true)}
          />
        )}

        {currentTab === 'metas' && (
          <MetasView
            goals={goals}
            onToggleMilestone={handleToggleMilestone}
            onAddGoal={handleAddGoal}
            onDeleteGoal={handleDeleteGoal}
            images={images}
            onOpenImageManager={() => setIsImageManagerOpen(true)}
          />
        )}

        {currentTab === 'estudos' && (
          <EstudosView
            images={images}
            onOpenImageManager={() => setIsImageManagerOpen(true)}
            studyData={studyData}
            onUpdateStudyData={setStudyData}
            onAddEventToAgenda={handleAddEventFromStudy}
          />
        )}
      </main>

      {/* 3. Bottom Tab Navigation Bar */}
      <Navigation currentTab={currentTab} onChangeTab={setCurrentTab} />

      {/* 4. Modals */}
      <ImageManagerModal
        isOpen={isImageManagerOpen}
        onClose={() => setIsImageManagerOpen(false)}
        images={images}
        onUpdateImages={setImages}
        onResetImages={() => setImages(DEFAULT_IMAGES)}
      />

      <SosPrayerModal
        isOpen={isSosPrayerOpen}
        onClose={() => setIsSosPrayerOpen(false)}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        images={images}
        onUpdateAvatar={(url) => setImages((prev) => ({ ...prev, avatar: url }))}
        userSession={userSession}
        onUpdateSessionProfile={(name, email) =>
          setUserSession((prev) => ({ ...prev, name, email }))
        }
        useUserPhotoAsLogo={useUserPhotoAsLogo}
        onToggleUserPhotoAsLogo={() => setUseUserPhotoAsLogo((prev) => !prev)}
        onOpenImageManager={() => {
          setIsProfileOpen(false);
          setIsImageManagerOpen(true);
        }}
        onOpenKidsManager={() => {
          setIsProfileOpen(false);
          setIsKidsManagerOpen(true);
        }}
      />

      <DesabafoModal
        isOpen={isDesabafoOpen}
        onClose={() => setIsDesabafoOpen(false)}
        desabafos={desabafos}
        onSaveDesabafo={handleSaveDesabafo}
        onDeleteDesabafo={handleDeleteDesabafo}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        userSession={userSession}
        syncState={syncState}
        onLogout={handleRealLogout}
        onManualSync={handleManualSync}
        onExportData={handleExportData}
        onImportData={handleImportData}
      />

      {/* Mandatory First-access Privacy Consent Modal */}
      {needsPrivacyConsent && (
        <PrivacyConsentModal
          userName={userSession.name}
          onAcceptConsent={handleAcceptPrivacyConsent}
          isSubmitting={isSubmittingConsent}
        />
      )}

      {/* Mobile-friendly Pop-up de Despertador de Compromisso */}
      {activeAlarm && (
        <AppointmentAlarmPopup
          alarm={activeAlarm}
          soundType={alarmConfig.sound}
          loopSound={alarmConfig.loopSound ?? true}
          onDismiss={handleDismissAlarm}
          onSnooze={handleSnoozeAlarm}
        />
      )}

      {/* Modal de Configuração de Som e Antecedência do Despertador */}
      <AlarmSettingsModal
        isOpen={isAlarmSettingsOpen}
        onClose={() => setIsAlarmSettingsOpen(false)}
        config={alarmConfig}
        onUpdateConfig={setAlarmConfig}
        onSaveConfig={setAlarmConfig}
        onTriggerTestAlarm={handleTriggerTestAlarm}
      />

      {/* Modal de Personalização dos Filhos e Fotos */}
      <KidsManagerModal
        isOpen={isKidsManagerOpen}
        onClose={() => setIsKidsManagerOpen(false)}
        kids={kids}
        onUpdateKids={handleUpdateKids}
      />
    </div>
  );
}

export default App;
