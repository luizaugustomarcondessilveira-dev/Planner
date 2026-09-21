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
// Two-Group Synchronization Engine
// ==========================================

export const KEYED_COLLECTIONS = ['roteiros', 'water', 'health', 'study'] as const;
export const UNKEYED_COLLECTIONS = ['journal', 'desabafos', 'goals', 'notices', 'events', 'people'] as const;

export type KeyedCollectionName = typeof KEYED_COLLECTIONS[number];
export type UnkeyedCollectionName = typeof UNKEYED_COLLECTIONS[number];

export function isKeyedCollection(col: string): col is KeyedCollectionName {
  return (KEYED_COLLECTIONS as readonly string[]).includes(col);
}

export function isUnkeyedCollection(col: string): col is UnkeyedCollectionName {
  return (UNKEYED_COLLECTIONS as readonly string[]).includes(col);
}

export interface KeyedSyncItem {
  key: string;
  data: any;
}

export interface UnkeyedSyncItem {
  id: string;
  data: any;
}

export interface CollectionSyncResult {
  collection: string;
  success: boolean;
  count: number;
  error?: {
    code?: string;
    message?: string;
    details?: string;
    hint?: string;
  };
}

/**
 * 1a. Sincronização de Coleções COM key (roteiros, water, health, study)
 * NÃO envia o campo 'id'.
 * Envia apenas: user_id, collection, key, data, updated_at
 * onConflict: 'user_id,collection,key'
 */
export async function syncKeyedCollection(
  userId: string,
  collection: string,
  items: KeyedSyncItem[]
): Promise<CollectionSyncResult> {
  if (!isSupabaseConfigured || !supabase || items.length === 0) {
    return { collection, success: true, count: 0 };
  }

  const now = new Date().toISOString();
  // DO NOT send id field!
  const payload = items.map((it) => ({
    user_id: userId,
    collection,
    key: it.key,
    data: it.data,
    updated_at: now,
  }));

  try {
    const { error } = await supabase
      .from('items')
      .upsert(payload, { onConflict: 'user_id,collection,key' });

    if (error) {
      console.error(`[Supabase Sync] Falha na coleção com key "${collection}":`, {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        collection,
      });
      return {
        collection,
        success: false,
        count: items.length,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        },
      };
    }

    return { collection, success: true, count: items.length };
  } catch (err: any) {
    console.error(`[Supabase Sync] Exceção inesperada na coleção "${collection}":`, err);
    return {
      collection,
      success: false,
      count: items.length,
      error: { message: err?.message || 'Erro de conexão ou exceção inesperada.' },
    };
  }
}

/**
 * 1b. Sincronização de Coleções SEM key (journal, desabafos, goals, notices, events, people)
 * Envia: id (UUID estável e reutilizado), user_id, collection, data, updated_at
 * onConflict: 'id'
 */
export async function syncUnkeyedCollection(
  userId: string,
  collection: string,
  items: UnkeyedSyncItem[]
): Promise<CollectionSyncResult> {
  if (!isSupabaseConfigured || !supabase || items.length === 0) {
    return { collection, success: true, count: 0 };
  }

  const now = new Date().toISOString();
  // Send id (stable UUID), user_id, collection, data, updated_at
  const payload = items.map((it) => ({
    id: ensureUUID(it.id),
    user_id: userId,
    collection,
    data: it.data,
    updated_at: now,
  }));

  try {
    const { error } = await supabase
      .from('items')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error(`[Supabase Sync] Falha na coleção sem key "${collection}":`, {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        collection,
      });
      return {
        collection,
        success: false,
        count: items.length,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        },
      };
    }

    return { collection, success: true, count: items.length };
  } catch (err: any) {
    console.error(`[Supabase Sync] Exceção inesperada na coleção "${collection}":`, err);
    return {
      collection,
      success: false,
      count: items.length,
      error: { message: err?.message || 'Erro de conexão ou exceção inesperada.' },
    };
  }
}

/**
 * Exclui itens por ID na tabela items
 */
export async function deleteItemsByIds(
  userId: string,
  ids: string[]
): Promise<{ success: boolean; error?: any }> {
  if (!isSupabaseConfigured || !supabase || ids.length === 0) {
    return { success: true };
  }

  try {
    const { error } = await supabase
      .from('items')
      .delete()
      .in('id', ids)
      .eq('user_id', userId);

    if (error) {
      console.error('[Supabase Sync] Erro ao deletar itens por ID:', {
        code: error.code,
        message: error.message,
        details: error.details,
      });
      return { success: false, error };
    }
    return { success: true };
  } catch (err: any) {
    console.error('[Supabase Sync] Exceção ao deletar itens:', err);
    return { success: false, error: err };
  }
}

// ==========================================
// Offline Queue & Difference Sync
// ==========================================

export interface PendingSyncItem {
  type: 'upsert_item' | 'upsert_keyed_item' | 'delete_item' | 'update_settings';
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
        }, { onConflict: 'user_id' });
        if (error) throw error;
      } else if (
        item.type === 'upsert_keyed_item' ||
        (item.type === 'upsert_item' && item.collection && isKeyedCollection(item.collection) && item.key)
      ) {
        // Group A: Keyed collection
        const res = await syncKeyedCollection(userId, item.collection!, [{ key: item.key!, data: item.data }]);
        if (!res.success) throw res.error;
      } else if (item.type === 'upsert_item' && item.collection && item.id) {
        // Group B: Unkeyed collection
        const res = await syncUnkeyedCollection(userId, item.collection, [{ id: item.id, data: item.data }]);
        if (!res.success) throw res.error;
      } else if (item.type === 'delete_item' && item.id) {
        const { error } = await supabase
          .from('items')
          .delete()
          .eq('id', item.id)
          .eq('user_id', userId);
        if (error) throw error;
      }
    } catch (err: any) {
      console.error('[Supabase Sync] Falha ao descarregar item da fila:', {
        type: item.type,
        collection: item.collection,
        id: item.id,
        key: item.key,
        error: err?.message || err,
      });
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

export interface MigrationResult {
  success: boolean;
  error?: string;
  syncedCollections?: string[];
  failedCollections?: string[];
}

export async function migrateLocalDataToCloud(
  userId: string,
  idMapping: Record<string, string> = {}
): Promise<MigrationResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase não conectado.' };
  }

  try {
    const now = new Date().toISOString();
    const syncedCols: string[] = [];
    const failedCols: string[] = [];

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

    // Upsert Settings with onConflict user_id
    const { error: settingsErr } = await supabase.from('user_settings').upsert(
      {
        user_id: userId,
        data: settingsPayload,
        updated_at: now,
      },
      { onConflict: 'user_id' }
    );

    if (settingsErr) {
      console.error('[Supabase Sync] Erro ao sincronizar user_settings:', settingsErr);
      failedCols.push('configuracoes');
    } else {
      syncedCols.push('configuracoes');
    }

    // 2. People (Group B - Unkeyed)
    idMapping['me'] = userId;
    const rawPeople = loadJSON<PersonProfile[]>('atelier_people', []);
    if (rawPeople.length > 0) {
      const cleanPeople: UnkeyedSyncItem[] = rawPeople.map((p) => {
        const pId = ensureUUID(p.id, idMapping);
        return {
          id: pId,
          data: { ...p, id: pId },
        };
      });
      const res = await syncUnkeyedCollection(userId, 'people', cleanPeople);
      if (res.success) syncedCols.push('people');
      else failedCols.push('people');
    }

    // 3. Events (Group B - Unkeyed)
    const rawEvents = loadJSON<CalendarEvent[]>('atelier_events', []);
    if (rawEvents.length > 0) {
      const cleanEvents: UnkeyedSyncItem[] = rawEvents.map((ev) => {
        const evId = ensureUUID(ev.id, idMapping);
        const remappedPersonId = ev.personId ? ensureUUID(ev.personId, idMapping) : userId;
        return {
          id: evId,
          data: { ...ev, id: evId, personId: remappedPersonId },
        };
      });
      const res = await syncUnkeyedCollection(userId, 'events', cleanEvents);
      if (res.success) syncedCols.push('events');
      else failedCols.push('events');
    }

    // 4. Notices (Group B - Unkeyed)
    const rawNotices = loadJSON<NoticeItem[]>('atelier_notices', []);
    if (rawNotices.length > 0) {
      const cleanNotices: UnkeyedSyncItem[] = rawNotices.map((not) => {
        const notId = ensureUUID(not.id, idMapping);
        const remappedPersonId = not.personId ? ensureUUID(not.personId, idMapping) : userId;
        return {
          id: notId,
          data: { ...not, id: notId, personId: remappedPersonId },
        };
      });
      const res = await syncUnkeyedCollection(userId, 'notices', cleanNotices);
      if (res.success) syncedCols.push('notices');
      else failedCols.push('notices');
    }

    // 5. Journal Entries (Group B - Unkeyed)
    const rawJournal = loadJSON<JournalEntry[]>('atelier_journal', []);
    if (rawJournal.length > 0) {
      const cleanJournal: UnkeyedSyncItem[] = rawJournal.map((entry) => {
        const entryId = ensureUUID(entry.id, idMapping);
        return {
          id: entryId,
          data: { ...entry, id: entryId },
        };
      });
      const res = await syncUnkeyedCollection(userId, 'journal', cleanJournal);
      if (res.success) syncedCols.push('journal');
      else failedCols.push('journal');
    }

    // 6. Desabafos (Group B - Unkeyed)
    const rawDesabafos = loadJSON<DesabafoEntry[]>('atelier_desabafos', []);
    if (rawDesabafos.length > 0) {
      const cleanDesabafos: UnkeyedSyncItem[] = rawDesabafos.map((d) => {
        const dId = ensureUUID(d.id, idMapping);
        return {
          id: dId,
          data: { ...d, id: dId },
        };
      });
      const res = await syncUnkeyedCollection(userId, 'desabafos', cleanDesabafos);
      if (res.success) syncedCols.push('desabafos');
      else failedCols.push('desabafos');
    }

    // 7. Goals (Group B - Unkeyed)
    const rawGoals = loadJSON<Goal[]>('atelier_goals', []);
    if (rawGoals.length > 0) {
      const cleanGoals: UnkeyedSyncItem[] = rawGoals.map((g) => {
        const gId = ensureUUID(g.id, idMapping);
        const milestones = (g.milestones || []).map((m) => ({
          ...m,
          id: ensureUUID(m.id, idMapping),
        }));
        return {
          id: gId,
          data: { ...g, id: gId, milestones },
        };
      });
      const res = await syncUnkeyedCollection(userId, 'goals', cleanGoals);
      if (res.success) syncedCols.push('goals');
      else failedCols.push('goals');
    }

    // 8. Daily Roteiros (Group A - Keyed: key = 'YYYY-MM-DD', NÃO envia id)
    const rawRoteiros = loadJSON<Record<string, RoteiroItem[]>>('atelier_daily_roteiros', {});
    const keyedRoteiros: KeyedSyncItem[] = [];
    for (const [dateKey, list] of Object.entries(rawRoteiros)) {
      if (!Array.isArray(list)) continue;
      const cleanList = list.map((item) => ({
        ...item,
        id: ensureUUID(item.id, idMapping),
      }));
      keyedRoteiros.push({
        key: dateKey,
        data: { items: cleanList },
      });
    }
    if (keyedRoteiros.length > 0) {
      const res = await syncKeyedCollection(userId, 'roteiros', keyedRoteiros);
      if (res.success) syncedCols.push('roteiros');
      else failedCols.push('roteiros');
    }

    // 9. Water per day (Group A - Keyed: key = 'YYYY-MM-DD', NÃO envia id)
    const rawCups = loadJSON<Record<string, number>>('atelier_daily_cups', {});
    const keyedWater: KeyedSyncItem[] = [];
    for (const [dateKey, count] of Object.entries(rawCups)) {
      if (typeof count !== 'number') continue;
      keyedWater.push({
        key: dateKey,
        data: { cupsCount: count },
      });
    }
    if (keyedWater.length > 0) {
      const res = await syncKeyedCollection(userId, 'water', keyedWater);
      if (res.success) syncedCols.push('water');
      else failedCols.push('water');
    }

    // 10. Study (Group A - Keyed: key = 'main', NÃO envia id)
    const rawStudy = loadJSON<StudyData | null>('atelier_study', null);
    if (rawStudy) {
      const res = await syncKeyedCollection(userId, 'study', [{ key: 'main', data: rawStudy }]);
      if (res.success) syncedCols.push('study');
      else failedCols.push('study');
    }

    if (failedCols.length > 0) {
      return {
        success: false,
        error: `Algumas coleções falharam ao sincronizar: ${failedCols.join(', ')}`,
        syncedCollections: syncedCols,
        failedCollections: failedCols,
      };
    }

    return {
      success: true,
      syncedCollections: syncedCols,
      failedCollections: [],
    };
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

