export type AppTab = 'hoje' | 'agenda' | 'diario' | 'metas' | 'estudos';

export type MoodType = 'grata' | 'paz' | 'ansiosa' | 'esperanca' | 'cansada';

export interface RoteiroItem {
  id: string;
  time?: string;
  title: string;
  subtitle: string;
  done: boolean;
  statusTag?: string; // 'Feito' | 'Agora' | '08:00' etc.
}

export interface MealPlan {
  title: string;
  subtitle: string;
  dishName: string;
  description: string;
  time: string;
  kcal: number;
  tags: string[];
  imageUrl: string;
}

export type EventCategory = 'pessoal' | 'familia' | 'casamento' | 'pequenos';

export type AlarmSoundType =
  | 'sino-sereno'
  | 'harpa-aurora'
  | 'carrilhao-zen'
  | 'despertador-alento'
  | 'gotas-tranquilas';

export interface AgendaAlarmConfig {
  enabled: boolean;
  sound: AlarmSoundType;
  minutesBefore: number; // 0, 5, 10, 15, 30, 60
  loopSound?: boolean;
}

export interface PersonProfile {
  id: string;
  name: string;
  avatarUrl?: string;
  category: EventCategory;
  color?: string;
  role?: 'primary' | 'spouse' | 'kid' | 'member';
  birthDate?: string; // YYYY-MM-DD
  notes?: string;
}

export interface KidProfile {
  id: string;
  name: string;
  photoUrl: string;
  birthDate?: string;
  notes?: string;
}

export interface ActiveAlarmPopup {
  id: string;
  title: string;
  subtitle?: string;
  timeStr?: string;
  time?: string;
  description?: string;
  location?: string;
  category?: string;
  minutesBefore: number;
}

export interface CalendarEvent {
  id: string;
  time: string;
  title: string;
  tag: string;
  category: EventCategory;
  description: string;
  location?: string;
  participants?: string;
  personId?: string;
  tagColor?: string;
  dateStr?: string; // YYYY-MM-DD
  alarmEnabled?: boolean;
  minutesBeforeAlarm?: number;
}

export interface NoticeItem {
  id: string;
  title: string;
  subtitle: string;
  dateStr: string;
  timeStr: string;
  soundAlert: boolean;
  done: boolean;
  category?: string;
  personId?: string;
  alarmEnabled?: boolean;
  minutesBeforeAlarm?: number;
}

export interface JournalEntry {
  id: string;
  dayNumber: number;
  dateStr: string;
  mood: MoodType;
  moodLabel: string;
  title: string;
  content: string;
  tags?: string[];
  isLocked?: boolean;
  createdAt: string;
}

export interface DesabafoEntry {
  id: string;
  dateStr: string;
  timeStr: string;
  emotion: string;
  text: string;
  reliefNote?: string;
  status: 'guardado' | 'queimado' | 'aliviado';
  createdAt: string;
}

export interface Milestone {
  id: string;
  title: string;
  done: boolean;
  dueDate?: string;
  percentage?: number;
}

export interface Goal {
  id: string;
  category:
    | 'Vida com Deus'
    | 'Casamento'
    | 'Estética & Bem-Estar'
    | 'Casa Completa'
    | 'Faculdade (Direito)'
    | 'Carro Novo';
  title: string;
  targetDate: string;
  progressPercent: number;
  currentCount?: number;
  totalCount?: number;
  countLabel?: string;
  milestones: Milestone[];
  notes?: string;
  isConquered?: boolean;
}

export interface HydrationConfig {
  cupSizeMl: number; // e.g. 1200 for 1.2L copo
  userWeightKg: number; // e.g. 60
  calculatedGoalMl: number; // calculated from weight (e.g. 60 * 35 = 2100 ml)
  customGoalMl?: number;
  remindersEnabled: boolean;
  reminderIntervalHours: number;
}

export interface DayHydrationLog {
  cupsCount: number;
  totalMl: number;
  timestamps: string[];
}

export interface UserSession {
  email: string;
  name: string;
  isLoggedIn: boolean;
  lastSyncedAt?: string;
  color?: string;
  category?: EventCategory;
}

export interface AppImages {
  avatar: string;
  logo: string;
  meal: string;
  journal: string;
  goalsQuote: string;
  studyDesk: string;
}

export interface StudyStep {
  id: string;
  title: string;
  done: boolean;
}

export interface StudyProject {
  id: string;
  title: string;
  advisor?: string;
  dueDate?: string; // YYYY-MM-DD
  steps: StudyStep[];
}

export interface SubjectExam {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  done: boolean;
}

export interface Subject {
  id: string;
  name: string;
  term?: string; // semestre / período
  professor?: string;
  currentGrade?: number;
  goalGrade?: number;
  studyProgress: number; // 0-100
  workloadHours?: number;
  absences?: number;
  exams: SubjectExam[];
}

export interface ExamTarget {
  id: string;
  name: string; // ex: "1ª Fase OAB"
  date: string; // YYYY-MM-DD
  notes?: string;
}

export interface FocusSettings {
  focusMin: number;
  breakMin: number;
  longBreakMin?: number;
  cyclesBeforeLong?: number;
  soundEnabled: boolean;
}

export interface StudySession {
  id: string;
  dateStr: string; // YYYY-MM-DD
  subjectId?: string;
  minutes: number;
}

export interface StudyBanner {
  kicker: string;
  title: string;
  subtitle: string;
}

export interface StudyData {
  banner: StudyBanner;
  projects: StudyProject[];
  subjects: Subject[];
  examTargets: ExamTarget[];
  focusSettings: FocusSettings;
  sessions: StudySession[];
}

