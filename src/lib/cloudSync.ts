import { z } from 'zod';
import { supabase, isSupabaseConfigured } from './supabase';
import {
  AppImages,
  CalendarEvent,
  DesabafoEntry,
  Goal,
  HydrationConfig,
  JournalEntry,
  NoticeItem,
  PersonProfile,
  RoteiroItem,
  StudyData,
  AgendaAlarmConfig,
  MealPlan,
  EventCategory,
} from '../types';
import { ensureUUID, isUUID } from '../utils/uuid';
import { loadJSON, saveJSON } from '../utils/storage';

// ==========================================
// Zod Schemas for Runtime Validation
// ==========================================

export const RoteiroItemSchema = z.object({
  id: z.string(),
  time: z.string().optional(),
  title: z.string(),
  subtitle: z.string().default(''),
  done: z.boolean().default(false),
  statusTag: z.string().optional(),
});

export const CalendarEventSchema = z.object({
  id: z.string(),
  time: z.string(),
  title: z.string(),
  tag: z.string().default('Geral'),
  category: z.enum(['pessoal', 'familia', 'casamento', 'pequenos']).default('pessoal'),
  description: z.string().default(''),
  location: z.string().optional(),
  participants: z.string().optional(),
  personId: z.string().optional(),
  tagColor: z.string().optional(),
  dateStr: z.string(), // YYYY-MM-DD
  alarmEnabled: z.boolean().optional(),
  minutesBeforeAlarm: z.number().optional(),
});

export const NoticeItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string().default(''),
  dateStr: z.string(),
  timeStr: z.string(),
  soundAlert: z.boolean().default(false),
  done: z.boolean().default(false),
  category: z.string().optional(),
  personId: z.string().optional(),
  alarmEnabled: z.boolean().optional(),
  minutesBeforeAlarm: z.number().optional(),
});

export const JournalEntrySchema = z.object({
  id: z.string(),
  dayNumber: z.number().default(1),
  dateStr: z.string(),
  mood: z.enum(['grata', 'paz', 'ansiosa', 'esperanca', 'cansada']).default('grata'),
  moodLabel: z.string().default('Grata'),
  title: z.string().default(''),
  content: z.string().default(''),
  tags: z.array(z.string()).optional(),
  isLocked: z.boolean().optional(),
  createdAt: z.string().default(() => new Date().toISOString()),
});

export const DesabafoEntrySchema = z.object({
  id: z.string(),
  dateStr: z.string(),
  timeStr: z.string().default(''),
  emotion: z.string().default('Cansaço'),
  text: z.string().default(''),
  reliefNote: z.string().optional(),
  status: z.enum(['guardado', 'queimado', 'aliviado']).default('guardado'),
  createdAt: z.string().default(() => new Date().toISOString()),
});

export const MilestoneSchema = z.object({
  id: z.string(),
  title: z.string(),
  done: z.boolean().default(false),
  dueDate: z.string().optional(),
  percentage: z.number().optional(),
});

export const GoalSchema = z.object({
  id: z.string(),
  category: z.enum([
    'Vida com Deus',
    'Casamento',
    'Estética & Bem-Estar',
    'Casa Completa',
    'Faculdade (Direito)',
    'Carro Novo',
  ]).default('Vida com Deus'),
  title: z.string(),
  targetDate: z.string().default('Constante'),
  progressPercent: z.number().min(0).max(100).default(0),
  currentCount: z.number().optional(),
  totalCount: z.number().optional(),
  countLabel: z.string().optional(),
  milestones: z.array(MilestoneSchema).default([]),
  notes: z.string().optional(),
  isConquered: z.boolean().optional(),
});

export const PersonProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatarUrl: z.string().optional(),
  category: z.enum(['pessoal', 'familia', 'casamento', 'pequenos']).default('pessoal'),
  color: z.string().optional(),
  role: z.enum(['primary', 'spouse', 'kid', 'member']).optional(),
  birthDate: z.string().optional(),
  notes: z.string().optional(),
});

export const UserSettingsDataSchema = z.object({
  appTitle: z.string().default('Planner da Mulher'),
  isDarkMode: z.boolean().default(false),
  useUserPhotoAsLogo: z.boolean().default(false),
  alarmConfig: z.object({
    enabled: z.boolean().default(true),
    sound: z.enum([
      'sino-sereno',
      'harpa-aurora',
      'carrilhao-zen',
      'despertador-alento',
      'gotas-tranquilas',
    ]).default('sino-sereno'),
    minutesBefore: z.number().default(15),
    loopSound: z.boolean().optional(),
  }),
  hydrationConfig: z.object({
    cupSizeMl: z.number().default(1200),
    userWeightKg: z.number().default(60),
    calculatedGoalMl: z.number().default(2400),
    customGoalMl: z.number().optional(),
    remindersEnabled: z.boolean().default(true),
    reminderIntervalHours: z.number().default(2),
  }),
  images: z.object({
    avatar: z.string().default(''),
    logo: z.string().default(''),
    meal: z.string().default(''),
    journal: z.string().default(''),
    goalsQuote: z.string().default(''),
    studyDesk: z.string().default(''),
  }),
  userDefaultRoteiro: z.array(RoteiroItemSchema).default([]),
  autoApplyDefaultRoutine: z.boolean().default(false),
  meal: z.any().optional(),
});

export type UserSettingsData = z.infer<typeof UserSettingsDataSchema>;

export interface CloudItemRow {
  id: string;
  user_id: string;
  collection: string;
  key: string;
  data: any;
  created_at?: string;
  updated_at?: string;
}

export interface CloudState {
  hasCloudData: boolean;
  settings: UserSettingsData | null;
  settingsUpdatedAt?: string;
  items: {
    journal: JournalEntry[];
    desabafos: DesabafoEntry[];
    goals: Goal[];
    notices: NoticeItem[];
    events: CalendarEvent[];
    people: PersonProfile[];
    roteiros: Record<string, RoteiroItem[]>;
    dailyCups: Record<string, number>;
    study: StudyData | null;
    health: any | null;
  };
  itemTimestamps: Record<string, string>; // item id -> updated_at
}

// ==========================================
// Cloud Loading & Synchronization
// ==========================================

export async function loadCloudState(userId: string): Promise<CloudState> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase não configurado');
  }

  // 1. Fetch user_settings
  const { data: settingsRow, error: settingsError } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (settingsError && settingsError.code !== 'PGRST116') {
    console.warn('Erro ao carregar user_settings:', settingsError.message);
  }

  // 2. Fetch all items for this user
  const { data: itemRows, error: itemsError } = await supabase
    .from('items')
    .select('*')
    .eq('user_id', userId);

  if (itemsError) {
    console.warn('Erro ao carregar items:', itemsError.message);
    throw new Error('Não foi possível sincronizar os dados da nuvem.');
  }

  const rows: CloudItemRow[] = itemRows || [];
  const hasCloudData = Boolean(settingsRow || rows.length > 0);

  let parsedSettings: UserSettingsData | null = null;
  if (settingsRow && settingsRow.data) {
    const parseRes = UserSettingsDataSchema.safeParse(settingsRow.data);
    if (parseRes.success) {
      parsedSettings = parseRes.data;
    } else {
      console.warn('Configurações com campos parciais:', parseRes.error);
      parsedSettings = settingsRow.data as UserSettingsData;
    }
  }

  const result: CloudState = {
    hasCloudData,
    settings: parsedSettings,
    settingsUpdatedAt: settingsRow?.updated_at,
    items: {
      journal: [],
      desabafos: [],
      goals: [],
      notices: [],
      events: [],
      people: [],
      roteiros: {},
      dailyCups: {},
      study: null,
      health: null,
    },
    itemTimestamps: {},
  };

  // Map rows into state collections
  for (const row of rows) {
    if (row.id && row.updated_at) {
      result.itemTimestamps[row.id] = row.updated_at;
    }
    const col = row.collection;
    const data = row.data;
    if (!data) continue;

    try {
      if (col === 'journal') {
        const item = JournalEntrySchema.parse({ ...data, id: row.id });
        result.items.journal.push(item);
      } else if (col === 'desabafos') {
        const item = DesabafoEntrySchema.parse({ ...data, id: row.id });
        result.items.desabafos.push(item);
      } else if (col === 'goals') {
        const item = GoalSchema.parse({ ...data, id: row.id });
        result.items.goals.push(item);
      } else if (col === 'notices') {
        const item = NoticeItemSchema.parse({ ...data, id: row.id });
        result.items.notices.push(item);
      } else if (col === 'events') {
        const item = CalendarEventSchema.parse({ ...data, id: row.id });
        result.items.events.push(item);
      } else if (col === 'people') {
        const item = PersonProfileSchema.parse({ ...data, id: row.id });
        result.items.people.push(item);
      } else if (col === 'roteiros') {
        // key = 'YYYY-MM-DD', data = { items: [...] }
        const dateKey = row.key;
        if (dateKey && Array.isArray(data.items)) {
          const list: RoteiroItem[] = [];
          for (const raw of data.items) {
            const p = RoteiroItemSchema.safeParse(raw);
            if (p.success) list.push(p.data);
          }
          result.items.roteiros[dateKey] = list;
        }
      } else if (col === 'water') {
        // key = 'YYYY-MM-DD', data = { cupsCount: number }
        const dateKey = row.key;
        if (dateKey && typeof data.cupsCount === 'number') {
          result.items.dailyCups[dateKey] = data.cupsCount;
        }
      } else if (col === 'study') {
        result.items.study = data as StudyData;
      } else if (col === 'health') {
        result.items.health = data;
      }
    } catch (e) {
      console.warn(`Item inválido ignorado (${col}/${row.id}):`, e);
    }
  }

  return result;
}

// ==========================================
// Offline Queue & Difference Sync
// ==========================================

export interface PendingSyncItem {
  type: 'upsert_item' | 'delete_item' | 'update_settings';
  collection?: string;
  key?: string;
  id?: string;
  data?: any;
  timestamp: number;
}

const QUEUE_STORAGE_KEY = 'atelier_sync_queue';

export function getOfflineQueue(): PendingSyncItem[] {
  return loadJSON<PendingSyncItem[]>(QUEUE_STORAGE_KEY, []);
}

export function saveOfflineQueue(queue: PendingSyncItem[]) {
  saveJSON(QUEUE_STORAGE_KEY, queue);
}

export function enqueueSyncOperation(op: PendingSyncItem) {
  const queue = getOfflineQueue();
  // Filter out redundant operations for the same target
  const filtered = queue.filter((item) => {
    if (op.type === 'update_settings' && item.type === 'update_settings') return false;
    if (op.id && item.id && op.id === item.id) return false;
    if (op.collection && op.key && item.collection === op.collection && item.key === op.key) return false;
    return true;
  });
  filtered.push(op);
  saveOfflineQueue(filtered);
}

export async function flushOfflineQueue(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase || !navigator.onLine) {
    return false;
  }

  const queue = getOfflineQueue();
  if (queue.length === 0) return true;

  const remaining: PendingSyncItem[] = [];

  for (const item of queue) {
    try {
      const now = new Date().toISOString();
      if (item.type === 'update_settings') {
        const { error } = await supabase.from('user_settings').upsert({
          user_id: userId,
          data: item.data,
          updated_at: now,
        });
        if (error) throw error;
      } else if (item.type === 'upsert_item') {
        const { error } = await supabase.from('items').upsert({
          id: item.id,
          user_id: userId,
          collection: item.collection,
          key: item.key,
          data: item.data,
          updated_at: now,
        });
        if (error) throw error;
      } else if (item.type === 'delete_item') {
        const { error } = await supabase
          .from('items')
          .delete()
          .eq('id', item.id)
          .eq('user_id', userId);
        if (error) throw error;
      }
    } catch (err) {
      console.warn('Falha ao descarregar item da fila:', item, err);
      remaining.push(item);
    }
  }

  saveOfflineQueue(remaining);
  return remaining.length === 0;
}

// ==========================================
// Local Migration Inspection & Execution
// ==========================================

export interface LocalDataSummary {
  hasData: boolean;
  roteirosCount: number;
  eventsCount: number;
  noticesCount: number;
  journalCount: number;
  desabafosCount: number;
  goalsCount: number;
  peopleCount: number;
  appTitle: string;
  imagesConfigured: boolean;
  totalItems: number;
}

export function inspectLocalData(): LocalDataSummary {
  const appTitle = loadJSON<string>('atelier_app_title', '');
  const dailyRoteiros = loadJSON<Record<string, RoteiroItem[]>>('atelier_daily_roteiros', {});
  const events = loadJSON<CalendarEvent[]>('atelier_events', []);
  const notices = loadJSON<NoticeItem[]>('atelier_notices', []);
  const journal = loadJSON<JournalEntry[]>('atelier_journal', []);
  const desabafos = loadJSON<DesabafoEntry[]>('atelier_desabafos', []);
  const goals = loadJSON<Goal[]>('atelier_goals', []);
  const people = loadJSON<PersonProfile[]>('atelier_people', []);
  const images = loadJSON<AppImages | null>('atelier_images', null);

  const roteirosDays = Object.keys(dailyRoteiros).length;
  const eventsCount = Array.isArray(events) ? events.length : 0;
  const noticesCount = Array.isArray(notices) ? notices.length : 0;
  const journalCount = Array.isArray(journal) ? journal.length : 0;
  const desabafosCount = Array.isArray(desabafos) ? desabafos.length : 0;
  const goalsCount = Array.isArray(goals) ? goals.length : 0;
  const peopleCount = Array.isArray(people) ? people.length : 0;

  const totalItems =
    roteirosDays +
    eventsCount +
    noticesCount +
    journalCount +
    desabafosCount +
    goalsCount +
    peopleCount;

  return {
    hasData: totalItems > 0 || Boolean(appTitle),
    roteirosCount: roteirosDays,
    eventsCount,
    noticesCount,
    journalCount,
    desabafosCount,
    goalsCount,
    peopleCount,
    appTitle: appTitle || 'Planner da Mulher',
    imagesConfigured: Boolean(images?.avatar || images?.logo),
    totalItems,
  };
}

export async function migrateLocalDataToCloud(
  userId: string,
  idMapping: Record<string, string> = {}
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase não conectado.' };
  }

  try {
    const now = new Date().toISOString();

    // 1. Settings
    const appTitle = loadJSON<string>('atelier_app_title', 'Planner da Mulher');
    const isDarkMode = loadJSON<boolean>('atelier_dark_mode', false);
    const useUserPhotoAsLogo = loadJSON<boolean>('atelier_user_photo_logo', false);
    const alarmConfig = loadJSON<AgendaAlarmConfig>('atelier_alarm_config', {
      enabled: true,
      sound: 'sino-sereno',
      minutesBefore: 15,
      loopSound: true,
    });
    const hydrationConfig = loadJSON<HydrationConfig>('atelier_hydration_config', {
      cupSizeMl: 1200,
      userWeightKg: 60,
      calculatedGoalMl: 2400,
      customGoalMl: 2400,
      remindersEnabled: true,
      reminderIntervalHours: 2,
    });
    const images = loadJSON<AppImages | null>('atelier_images', null) || {
      avatar: '',
      logo: '',
      meal: '',
      journal: '',
      goalsQuote: '',
      studyDesk: '',
    };
    const userDefaultRoteiro = loadJSON<RoteiroItem[]>('atelier_routine_default', []).map((r) => ({
      ...r,
      id: ensureUUID(r.id, idMapping),
    }));
    const autoApplyDefaultRoutine = loadJSON<boolean>('atelier_auto_apply_routine', false);
    const meal = loadJSON<MealPlan | null>('atelier_meal', null);

    const settingsPayload: UserSettingsData = {
      appTitle,
      isDarkMode,
      useUserPhotoAsLogo,
      alarmConfig,
      hydrationConfig,
      images,
      userDefaultRoteiro,
      autoApplyDefaultRoutine,
      meal,
    };

    // Upsert Settings
    const { error: settingsErr } = await supabase.from('user_settings').upsert({
      user_id: userId,
      data: settingsPayload,
      updated_at: now,
    });

    if (settingsErr) {
      console.error('Erro migrando settings:', settingsErr);
      return { success: false, error: 'Falha ao salvar configurações na nuvem.' };
    }

    // 2. People & ID Mapping
    const rawPeople = loadJSON<PersonProfile[]>('atelier_people', []);
    const itemsToUpsert: CloudItemRow[] = [];

    // Map 'me' explicitly to primary if needed
    idMapping['me'] = userId;

    for (const p of rawPeople) {
      const pId = ensureUUID(p.id, idMapping);
      itemsToUpsert.push({
        id: pId,
        user_id: userId,
        collection: 'people',
        key: pId,
        data: {
          ...p,
          id: pId,
        },
        created_at: now,
        updated_at: now,
      });
    }

    // 3. Events with remapped personId
    const rawEvents = loadJSON<CalendarEvent[]>('atelier_events', []);
    for (const ev of rawEvents) {
      const evId = ensureUUID(ev.id, idMapping);
      const remappedPersonId = ev.personId ? ensureUUID(ev.personId, idMapping) : userId;
      itemsToUpsert.push({
        id: evId,
        user_id: userId,
        collection: 'events',
        key: evId,
        data: {
          ...ev,
          id: evId,
          personId: remappedPersonId,
        },
        created_at: now,
        updated_at: now,
      });
    }

    // 4. Notices with remapped personId
    const rawNotices = loadJSON<NoticeItem[]>('atelier_notices', []);
    for (const not of rawNotices) {
      const notId = ensureUUID(not.id, idMapping);
      const remappedPersonId = not.personId ? ensureUUID(not.personId, idMapping) : userId;
      itemsToUpsert.push({
        id: notId,
        user_id: userId,
        collection: 'notices',
        key: notId,
        data: {
          ...not,
          id: notId,
          personId: remappedPersonId,
        },
        created_at: now,
        updated_at: now,
      });
    }

    // 5. Journal Entries
    const rawJournal = loadJSON<JournalEntry[]>('atelier_journal', []);
    for (const entry of rawJournal) {
      const entryId = ensureUUID(entry.id, idMapping);
      itemsToUpsert.push({
        id: entryId,
        user_id: userId,
        collection: 'journal',
        key: entryId,
        data: {
          ...entry,
          id: entryId,
        },
        created_at: now,
        updated_at: now,
      });
    }

    // 6. Desabafos
    const rawDesabafos = loadJSON<DesabafoEntry[]>('atelier_desabafos', []);
    for (const d of rawDesabafos) {
      const dId = ensureUUID(d.id, idMapping);
      itemsToUpsert.push({
        id: dId,
        user_id: userId,
        collection: 'desabafos',
        key: dId,
        data: {
          ...d,
          id: dId,
        },
        created_at: now,
        updated_at: now,
      });
    }

    // 7. Goals
    const rawGoals = loadJSON<Goal[]>('atelier_goals', []);
    for (const g of rawGoals) {
      const gId = ensureUUID(g.id, idMapping);
      const milestones = (g.milestones || []).map((m) => ({
        ...m,
        id: ensureUUID(m.id, idMapping),
      }));
      itemsToUpsert.push({
        id: gId,
        user_id: userId,
        collection: 'goals',
        key: gId,
        data: {
          ...g,
          id: gId,
          milestones,
        },
        created_at: now,
        updated_at: now,
      });
    }

    // 8. Daily Roteiros (key = 'YYYY-MM-DD')
    const rawRoteiros = loadJSON<Record<string, RoteiroItem[]>>('atelier_daily_roteiros', {});
    for (const [dateKey, list] of Object.entries(rawRoteiros)) {
      if (!Array.isArray(list)) continue;
      const cleanList = list.map((item) => ({
        ...item,
        id: ensureUUID(item.id, idMapping),
      }));
      const rowId = ensureUUID(`roteiro_${dateKey}`, idMapping);
      itemsToUpsert.push({
        id: rowId,
        user_id: userId,
        collection: 'roteiros',
        key: dateKey,
        data: { items: cleanList },
        created_at: now,
        updated_at: now,
      });
    }

    // 9. Water per day (key = 'YYYY-MM-DD')
    const rawCups = loadJSON<Record<string, number>>('atelier_daily_cups', {});
    for (const [dateKey, count] of Object.entries(rawCups)) {
      if (typeof count !== 'number') continue;
      const rowId = ensureUUID(`water_${dateKey}`, idMapping);
      itemsToUpsert.push({
        id: rowId,
        user_id: userId,
        collection: 'water',
        key: dateKey,
        data: { cupsCount: count },
        created_at: now,
        updated_at: now,
      });
    }

    // 10. Study & Health
    const rawStudy = loadJSON<StudyData | null>('atelier_study', null);
    if (rawStudy) {
      const rowId = ensureUUID('study_main', idMapping);
      itemsToUpsert.push({
        id: rowId,
        user_id: userId,
        collection: 'study',
        key: 'main',
        data: rawStudy,
        created_at: now,
        updated_at: now,
      });
    }

    // Chunked upsert to Supabase
    const CHUNK_SIZE = 50;
    for (let i = 0; i < itemsToUpsert.length; i += CHUNK_SIZE) {
      const chunk = itemsToUpsert.slice(i, i + CHUNK_SIZE);
      const { error } = await supabase.from('items').upsert(chunk);
      if (error) {
        console.error('Erro salvando lote de items:', error);
        return { success: false, error: 'Falha ao salvar dados na nuvem.' };
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error('Erro na migração:', err);
    return { success: false, error: err?.message || 'Erro inesperado na sincronização.' };
  }
}

/**
 * Clears local atelier_* keys safely on explicit user confirmation.
 */
export function clearAllLocalAtelierData(): void {
  if (typeof localStorage === 'undefined') return;
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('atelier_') && key !== 'atelier_user_session') {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
}
