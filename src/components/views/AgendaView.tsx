import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Video,
  MapPin,
  Clock,
  Bell,
  CheckCircle2,
  Calendar as CalendarIcon,
  X,
  BookOpen,
  Heart,
  Baby,
  Volume2,
  Trash2,
  Edit2,
  Sparkles,
  Camera,
  Settings,
  HardDrive,
  UserPlus,
  CalendarDays,
  Users,
} from 'lucide-react';
import {
  CalendarEvent,
  EventCategory,
  NoticeItem,
  KidProfile,
  AgendaAlarmConfig,
  PersonProfile,
} from '../../types';
import { soundEffects } from '../../utils/audio';
import {
  toLocalDateKey,
  getISOWeekNumber,
  getWeekDates,
  getMonthYearTitle,
  formatDateDisplay,
  formatDateShortBR,
  calculateAgeDisplay,
} from '../../utils/date';
import { EditPersonModal } from '../modals/EditPersonModal';

type AgendaCategoryTab = 'todos' | 'pessoal' | 'familia' | 'pequenos';

interface AgendaViewProps {
  events?: CalendarEvent[];
  onAddEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  onEditEvent?: (id: string, event: Omit<CalendarEvent, 'id'>) => void;
  onDeleteEvent?: (id: string) => void;
  notices?: NoticeItem[];
  onAddNotice: (notice: Omit<NoticeItem, 'id'>) => void;
  onEditNotice?: (id: string, notice: Partial<Omit<NoticeItem, 'id'>>) => void;
  onToggleNotice: (id: string) => void;
  onDeleteNotice: (id: string) => void;
  userName?: string;
  people?: PersonProfile[];
  onAddPerson?: (newPerson: PersonProfile) => void;
  onUpdatePerson?: (updatedPerson: PersonProfile) => void;
  onDeletePerson?: (personId: string, reassignToPersonId?: string) => void;
  kids?: KidProfile[];
  onOpenKidsManager?: () => void;
  alarmConfig: AgendaAlarmConfig;
  onOpenAlarmSettings: () => void;
  onTriggerTestAlarm: () => void;
}

const FALLBACK_PEOPLE: PersonProfile[] = [
  { id: 'me', name: 'Helena', category: 'pessoal', color: '#6B3F2A', role: 'primary' },
  { id: 'lucas', name: 'Lucas', category: 'familia', color: '#B88E72', role: 'spouse' },
  { id: 'pequenos', name: 'Theo', category: 'pequenos', color: '#E8A5B8', role: 'kid', birthDate: '2022-04-12', notes: 'Natação, pediatra e carinho.' },
];

export const AgendaView: React.FC<AgendaViewProps> = ({
  events = [],
  onAddEvent,
  onEditEvent,
  onDeleteEvent,
  notices = [],
  onAddNotice,
  onEditNotice,
  onToggleNotice,
  onDeleteNotice,
  userName = 'Helena',
  people = FALLBACK_PEOPLE,
  onAddPerson,
  onUpdatePerson,
  onDeletePerson,
  kids = [],
  onOpenKidsManager,
  alarmConfig,
  onOpenAlarmSettings,
  onTriggerTestAlarm,
}) => {
  const activePeople = people && people.length > 0 ? people : FALLBACK_PEOPLE;
  const todayStr = useMemo(() => toLocalDateKey(new Date()), []);

  // Category Tabs: 'todos' | 'pessoal' | 'familia' | 'pequenos'
  const [activeCategoryTab, setActiveCategoryTab] = useState<AgendaCategoryTab>(() => {
    try {
      const saved = localStorage.getItem('atelier_agenda_active_category_tab') as AgendaCategoryTab | null;
      if (saved && ['todos', 'pessoal', 'familia', 'pequenos'].includes(saved)) {
        return saved;
      }
    } catch (e) {}
    return 'todos';
  });

  const [selectedMember, setSelectedMember] = useState<string>('todos');
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);
  const [weekOffset, setWeekOffset] = useState<number>(0);

  // Persist tab choice
  const handleSelectTab = (tab: AgendaCategoryTab) => {
    setActiveCategoryTab(tab);
    setSelectedMember('todos');
    try {
      localStorage.setItem('atelier_agenda_active_category_tab', tab);
    } catch (e) {}
  };

  // People counts per category
  const counts = useMemo(() => {
    const pessoal = activePeople.filter((p) => p.category === 'pessoal').length;
    const familia = activePeople.filter((p) => p.category === 'familia' || p.category === 'casamento').length;
    const pequenos = activePeople.filter((p) => p.category === 'pequenos').length;
    return { pessoal, familia, pequenos, total: activePeople.length };
  }, [activePeople]);

  // Available dynamic tabs
  const availableTabs = useMemo(() => {
    const list: { id: AgendaCategoryTab; label: string; icon: typeof Users; count?: number }[] = [
      { id: 'todos', label: 'Todos', icon: Users, count: counts.total },
    ];
    if (counts.pessoal > 0) {
      list.push({ id: 'pessoal', label: `Pessoal (${counts.pessoal})`, icon: BookOpen, count: counts.pessoal });
    }
    if (counts.familia > 0) {
      list.push({ id: 'familia', label: `Família & Casal (${counts.familia})`, icon: Heart, count: counts.familia });
    }
    if (counts.pequenos > 0) {
      list.push({ id: 'pequenos', label: `Filhos (${counts.pequenos})`, icon: Baby, count: counts.pequenos });
    }
    return list;
  }, [counts]);

  // If active tab becomes unavailable, fall back to 'todos'
  useEffect(() => {
    if (!availableTabs.some((t) => t.id === activeCategoryTab)) {
      setActiveCategoryTab('todos');
    }
  }, [availableTabs, activeCategoryTab]);

  // People visible in the current active tab
  const tabPeople = useMemo(() => {
    if (activeCategoryTab === 'todos') return activePeople;
    if (activeCategoryTab === 'pessoal') return activePeople.filter((p) => p.category === 'pessoal');
    if (activeCategoryTab === 'familia')
      return activePeople.filter((p) => p.category === 'familia' || p.category === 'casamento');
    if (activeCategoryTab === 'pequenos') return activePeople.filter((p) => p.category === 'pequenos');
    return activePeople;
  }, [activeCategoryTab, activePeople]);

  // Person editing and creation modals
  const [editingPerson, setEditingPerson] = useState<PersonProfile | null>(null);
  const [isCreatingPerson, setIsCreatingPerson] = useState(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);

  const startPress = (person: PersonProfile) => {
    isLongPressRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setIsCreatingPerson(false);
      setEditingPerson(person);
    }, 500);
  };

  const endPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleChipClick = (personId: string) => {
    if (isLongPressRef.current) {
      isLongPressRef.current = false;
      return;
    }
    setSelectedMember(personId);
  };

  // Helper to determine effective category for an event
  const getEventCategory = (ev: CalendarEvent): EventCategory => {
    if (ev.personId) {
      const p = activePeople.find((person) => person.id === ev.personId);
      if (p && p.category) return p.category;
    }
    return ev.category || 'pessoal';
  };

  // Helper to check if event matches active tab & selected member filter
  const eventMatchesFilters = (ev: CalendarEvent): boolean => {
    // 1. Member filter
    if (selectedMember !== 'todos') {
      if (ev.personId !== selectedMember) return false;
    }

    // 2. Tab filter
    if (activeCategoryTab === 'todos') return true;
    const cat = getEventCategory(ev);
    if (activeCategoryTab === 'pessoal') return cat === 'pessoal';
    if (activeCategoryTab === 'familia') return cat === 'familia' || cat === 'casamento';
    if (activeCategoryTab === 'pequenos') return cat === 'pequenos';

    return true;
  };

  // Calculate week days dynamically
  const currentWeekDays = useMemo(() => {
    return getWeekDates(new Date(), weekOffset);
  }, [weekOffset]);

  // Calendar title (Month + Year + Week Number)
  const calendarTitleInfo = useMemo(() => {
    const wednesday = currentWeekDays[3]?.date || new Date();
    const monthYear = getMonthYearTitle(wednesday);
    const weekNum = getISOWeekNumber(wednesday);
    return { monthYear, weekNum };
  }, [currentWeekDays]);

  const handleGoToday = () => {
    setWeekOffset(0);
    setSelectedDateStr(todayStr);
  };

  // Map dots for each day in current week respecting active tab
  const weekDaysWithDots = useMemo(() => {
    return currentWeekDays.map((day) => {
      const dayEvents = events.filter(
        (ev) => (ev.dateStr || todayStr) === day.dateStr && eventMatchesFilters(ev)
      );
      const dots = dayEvents.slice(0, 4).map((ev) => {
        const person = ev.personId ? activePeople.find((p) => p.id === ev.personId) : null;
        return person?.color || ev.tagColor || '#6B3F2A';
      });
      return {
        ...day,
        dots,
      };
    });
  }, [currentWeekDays, events, todayStr, activePeople, activeCategoryTab, selectedMember]);

  // Filter events strictly matching selectedDateStr and filters
  const filteredEvents = useMemo(() => {
    return events
      .filter((ev) => {
        const evDate = ev.dateStr || todayStr;
        if (evDate !== selectedDateStr) return false;
        return eventMatchesFilters(ev);
      })
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [events, selectedDateStr, todayStr, activeCategoryTab, selectedMember]);

  // Next upcoming events per category for summary card
  const upcomingSummaryData = useMemo(() => {
    const futureEvents = events
      .filter((e) => (e.dateStr || todayStr) >= todayStr)
      .sort((a, b) => ((a.dateStr || todayStr) + a.time).localeCompare((b.dateStr || todayStr) + b.time));

    const kidsList = activePeople.filter((p) => p.category === 'pequenos');
    const familyList = activePeople.filter((p) => p.category === 'familia' || p.category === 'casamento');
    const personalList = activePeople.filter((p) => p.category === 'pessoal');

    return {
      futureEvents,
      kidsList,
      familyList,
      personalList,
    };
  }, [events, activePeople, todayStr]);

  // Modal for new/edit event
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [newEventDate, setNewEventDate] = useState<string>(todayStr);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('10:00');
  const [newCategory, setNewCategory] = useState<EventCategory>('pessoal');
  const [newEventPersonId, setNewEventPersonId] = useState<string>('me');
  const [newDescription, setNewDescription] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newParticipants, setNewParticipants] = useState('');
  const [newEventAlarm, setNewEventAlarm] = useState(true);
  const [newEventAlarmBefore, setNewEventAlarmBefore] = useState(5);

  // Modal for new/edit notice / aviso com alerta sonoro
  const [isNewNoticeModalOpen, setIsNewNoticeModalOpen] = useState(false);
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeSubtitle, setNoticeSubtitle] = useState('');
  const [noticeDate, setNoticeDate] = useState<string>(todayStr);
  const [noticeTime, setNoticeTime] = useState('08:30');
  const [noticePersonId, setNoticePersonId] = useState<string>('none');
  const [noticeSound, setNoticeSound] = useState(true);

  const formatNoticeDate = (dStr: string) => {
    if (!dStr) return 'Em breve';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dStr)) {
      const [y, m, d] = dStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
    }
    return dStr;
  };

  const getSoundName = (sound: string) => {
    switch (sound) {
      case 'harpa-aurora':
        return 'Harpa da Aurora';
      case 'carrilhao-zen':
        return 'Carrilhão Zen';
      case 'despertador-alento':
        return 'Despertador Alento';
      case 'gotas-tranquilas':
        return 'Gotas Tranquilas';
      case 'sino-sereno':
      default:
        return 'Sino Sereno';
    }
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const chosenPerson = activePeople.find((p) => p.id === newEventPersonId);

    const eventData = {
      title: newTitle.trim(),
      time: newTime,
      dateStr: newEventDate || selectedDateStr,
      category: newCategory,
      tag:
        newCategory === 'pessoal'
          ? 'Pessoal'
          : newCategory === 'familia'
          ? 'Família & Casal'
          : newCategory === 'casamento'
          ? 'Casamento'
          : 'Filhos',
      description: newDescription.trim() || 'Compromisso agendado com serenidade.',
      location: newLocation.trim() || undefined,
      participants: newParticipants.trim() || (chosenPerson ? chosenPerson.name : undefined),
      personId: newEventPersonId,
      alarmEnabled: newEventAlarm,
      minutesBeforeAlarm: newEventAlarmBefore,
      tagColor:
        chosenPerson?.color ||
        (newCategory === 'pessoal'
          ? '#6B3F2A'
          : newCategory === 'pequenos'
          ? '#E8A5B8'
          : '#B88E72'),
    };

    if (editingEventId && onEditEvent) {
      onEditEvent(editingEventId, eventData);
    } else {
      onAddEvent(eventData);
    }

    setEditingEventId(null);
    setNewTitle('');
    setNewDescription('');
    setNewLocation('');
    setNewParticipants('');
    setIsNewEventModalOpen(false);
  };

  const openEditEventModal = (event: CalendarEvent) => {
    setEditingEventId(event.id);
    setNewEventDate(event.dateStr || selectedDateStr);
    setNewTitle(event.title);
    setNewTime(event.time);
    setNewCategory(event.category);
    setNewEventPersonId(event.personId || (activePeople[0]?.id || 'me'));
    setNewDescription(event.description);
    setNewLocation(event.location || '');
    setNewParticipants(event.participants || '');
    setNewEventAlarm(event.alarmEnabled ?? true);
    setNewEventAlarmBefore(event.minutesBeforeAlarm ?? 5);
    setIsNewEventModalOpen(true);
  };

  const openNewEventModal = () => {
    setEditingEventId(null);
    setNewEventDate(selectedDateStr);
    setNewTitle('');
    setNewTime('10:00');

    // Preselect person and category intelligently based on active tab & selection
    let defaultPerson: PersonProfile | undefined;
    if (selectedMember !== 'todos') {
      defaultPerson = activePeople.find((p) => p.id === selectedMember);
    } else if (activeCategoryTab === 'pequenos') {
      defaultPerson = activePeople.find((p) => p.category === 'pequenos');
    } else if (activeCategoryTab === 'familia') {
      defaultPerson = activePeople.find((p) => p.category === 'familia' || p.category === 'casamento');
    } else if (activeCategoryTab === 'pessoal') {
      defaultPerson = activePeople.find((p) => p.id === 'me' || p.category === 'pessoal');
    }

    if (!defaultPerson) {
      defaultPerson = activePeople[0] || FALLBACK_PEOPLE[0];
    }

    setNewEventPersonId(defaultPerson.id);
    setNewCategory(defaultPerson.category || 'pessoal');
    setNewDescription('');
    setNewLocation('');
    setNewParticipants('');
    setNewEventAlarm(true);
    setNewEventAlarmBefore(5);
    setIsNewEventModalOpen(true);
  };

  const openNewNoticeModal = () => {
    setEditingNoticeId(null);
    setNoticeTitle('');
    setNoticeSubtitle('');
    setNoticeDate(selectedDateStr || todayStr);
    setNoticeTime('08:30');
    if (selectedMember !== 'todos') {
      setNoticePersonId(selectedMember);
    } else if (activeCategoryTab !== 'todos') {
      const matched = activePeople.find((p) => p.category === activeCategoryTab);
      setNoticePersonId(matched ? matched.id : 'none');
    } else {
      setNoticePersonId('none');
    }
    setNoticeSound(true);
    setIsNewNoticeModalOpen(true);
  };

  const openEditNoticeModal = (notice: NoticeItem) => {
    setEditingNoticeId(notice.id);
    setNoticeTitle(notice.title);
    setNoticeSubtitle(notice.subtitle || '');
    setNoticeDate(notice.dateStr || todayStr);
    setNoticeTime(notice.timeStr || '08:30');
    setNoticePersonId(notice.personId || 'none');
    setNoticeSound(notice.soundAlert ?? true);
    setIsNewNoticeModalOpen(true);
  };

  const handleCreateOrEditNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim()) return;

    let category: string | undefined = undefined;
    if (noticePersonId !== 'none') {
      const matchedPerson = activePeople.find((p) => p.id === noticePersonId);
      if (matchedPerson) {
        category = matchedPerson.category;
      }
    }

    if (noticeSound) {
      soundEffects.playSereneChime();
    }

    const noticePayload = {
      title: noticeTitle.trim(),
      subtitle: noticeSubtitle.trim() || 'Lembrete importante dos próximos dias',
      dateStr: noticeDate.trim() || todayStr,
      timeStr: noticeTime.trim() || '09:00',
      soundAlert: noticeSound,
      personId: noticePersonId !== 'none' ? noticePersonId : undefined,
      category,
    };

    if (editingNoticeId && onEditNotice) {
      onEditNotice(editingNoticeId, noticePayload);
    } else {
      onAddNotice({
        ...noticePayload,
        done: false,
      });
    }

    setEditingNoticeId(null);
    setNoticeTitle('');
    setNoticeSubtitle('');
    setIsNewNoticeModalOpen(false);
  };

  const isNoticeExpired = (notice: NoticeItem): boolean => {
    if (!notice.dateStr || notice.done) return false;
    const now = new Date();
    const today = toLocalDateKey(now);
    if (notice.dateStr < today) return true;
    if (notice.dateStr === today) {
      const [h, m] = (notice.timeStr || '00:00').split(':').map(Number);
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const noticeMinutes = (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
      return currentMinutes > noticeMinutes;
    }
    return false;
  };

  const filteredAndSortedNotices = useMemo(() => {
    return [...notices]
      .filter((n) => {
        if (selectedMember !== 'todos') {
          if (n.personId !== selectedMember) return false;
        }
        if (activeCategoryTab !== 'todos') {
          let cat = n.category;
          if (n.personId) {
            const p = activePeople.find((person) => person.id === n.personId);
            if (p) cat = p.category;
          }
          if (activeCategoryTab === 'pessoal') return cat === 'pessoal' || (!cat && !n.personId);
          if (activeCategoryTab === 'familia') return cat === 'familia' || cat === 'casamento';
          if (activeCategoryTab === 'pequenos') return cat === 'pequenos';
        }
        return true;
      })
      .sort((a, b) => {
        if (a.done !== b.done) {
          return a.done ? 1 : -1;
        }
        const dateA = a.dateStr || '9999-99-99';
        const dateB = b.dateStr || '9999-99-99';
        const timeA = a.timeStr || '00:00';
        const timeB = b.timeStr || '00:00';
        return (dateA + timeA).localeCompare(dateB + timeB);
      });
  }, [notices, activeCategoryTab, selectedMember, activePeople]);

  const handleTestChime = () => {
    soundEffects.playSereneChime();
  };

  const getCategoryIcon = (category: EventCategory) => {
    if (category === 'pessoal') {
      return <BookOpen className="w-4 h-4 text-white" />;
    }
    if (category === 'pequenos') {
      return <Baby className="w-4 h-4 text-white" />;
    }
    if (category === 'familia') {
      return <Users className="w-4 h-4 text-white" />;
    }
    return <Heart className="w-4 h-4 text-white fill-white" />;
  };

  const getDisplayTagLabel = (event: CalendarEvent): string => {
    if (event.category === 'pequenos' || event.tag === 'Pequenos' || event.tag === 'Filhos') {
      return 'Filhos';
    }
    if (event.category === 'familia' || event.tag === 'Família' || event.tag === 'Família & Casal') {
      return 'Família & Casal';
    }
    if (event.category === 'casamento' || event.tag === 'Casamento') {
      return 'Casamento';
    }
    return 'Pessoal';
  };

  const openCreatePersonModal = () => {
    setIsCreatingPerson(true);
    setEditingPerson(null);
  };

  return (
    <div className="space-y-6 pb-24 animate-fade-in max-w-xl mx-auto">
      {/* 1. Storage Status Badge */}
      <div className="flex items-center justify-between px-3.5 py-2 rounded-2xl bg-[#F6F3EE] dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] text-[11px] text-[#8C6E5E] dark:text-[#B59D8F]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="font-semibold text-[#6B3F2A] dark:text-[#E8DDD4] tracking-wider uppercase text-[10px]">
            Salvo neste aparelho
          </span>
        </div>
        <div className="flex items-center gap-1 font-medium">
          <HardDrive className="w-3.5 h-3.5 text-[#B88E72]" />
          <span>Memória Local</span>
        </div>
      </div>

      {/* 2. Category Tabs Navigation */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#F0EDE9] dark:bg-[#2A2019] border border-[#EBDED5] dark:border-[#3D2E24] overflow-x-auto no-scrollbar">
        {availableTabs.map((tab) => {
          const isSelected = activeCategoryTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleSelectTab(tab.id)}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
                isSelected
                  ? 'bg-white dark:bg-[#382B22] text-[#452414] dark:text-white shadow-xs'
                  : 'text-[#8C6E5E] dark:text-[#A89284] hover:text-[#452414]'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Dynamic Person Chips for Active Tab */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {/* Ver Todos da Aba */}
        <button
          type="button"
          onClick={() => setSelectedMember('todos')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all shrink-0 ${
            selectedMember === 'todos'
              ? 'bg-[#502916] text-white border-[#502916] shadow-xs'
              : 'bg-white dark:bg-[#251D17] border-[#EBDED5] dark:border-[#3D2E24] text-[#8C6E5E] dark:text-[#B59D8F]'
          }`}
        >
          {activeCategoryTab === 'todos' ? 'Ver Todos' : `Todos (${tabPeople.length})`}
        </button>

        {/* Dynamic Person Chips with Long-Press & Edit Pencil */}
        {tabPeople.map((person) => {
          const isSelected = selectedMember === person.id;

          return (
            <div
              key={person.id}
              onPointerDown={() => startPress(person)}
              onPointerUp={endPress}
              onPointerLeave={endPress}
              onPointerCancel={endPress}
              onContextMenu={(e) => e.preventDefault()}
              onClick={() => handleChipClick(person.id)}
              className={`group relative px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer select-none shrink-0 ${
                isSelected
                  ? 'bg-[#FDF4F5] dark:bg-[#38262B] border-[#E8A5B8] text-[#452414] dark:text-white shadow-xs'
                  : 'bg-white dark:bg-[#251D17] border-[#EBDED5] dark:border-[#3D2E24] text-[#8C6E5E] dark:text-[#B59D8F] hover:border-[#B88E72]'
              }`}
              title={`Clique para filtrar ou segure/clique no lápis para editar ${person.name}`}
            >
              {person.avatarUrl ? (
                <img
                  src={person.avatarUrl}
                  alt={person.name}
                  className="w-5 h-5 rounded-full object-cover border shrink-0"
                  style={{ borderColor: person.color || '#E8A5B8' }}
                />
              ) : (
                <span
                  className="w-5 h-5 rounded-full text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-xs"
                  style={{ backgroundColor: person.color || '#6B3F2A' }}
                >
                  {person.name ? person.name.trim()[0].toUpperCase() : '?'}
                </span>
              )}

              <span className="truncate max-w-[120px]">{person.name}</span>

              {/* Small Edit Pencil */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  endPress();
                  setIsCreatingPerson(false);
                  setEditingPerson(person);
                }}
                className="p-1 rounded-full text-[#8C6E5E] hover:text-[#502916] dark:hover:text-[#F6F1EC] hover:bg-black/5 dark:hover:bg-white/10 transition-colors ml-0.5"
                title={`Editar perfil de ${person.name}`}
                aria-label={`Editar ${person.name}`}
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
          );
        })}

        {/* Button: + Adicionar pessoa */}
        <button
          type="button"
          onClick={openCreatePersonModal}
          className="px-3 py-1.5 rounded-full text-xs font-semibold text-[#6B3F2A] dark:text-[#E8DDD4] bg-[#FAF7F2] dark:bg-[#2A2019] border border-dashed border-[#B88E72] hover:bg-[#F0EDE9] transition-colors flex items-center gap-1 shrink-0"
          title="Cadastrar nova pessoa ou membro da família"
        >
          <UserPlus className="w-3.5 h-3.5 text-[#B88E72]" />
          <span>+ Pessoa</span>
        </button>

        {/* Button to customize child photo & info */}
        {(activeCategoryTab === 'pequenos' || activeCategoryTab === 'todos') && (
          <button
            type="button"
            onClick={onOpenKidsManager}
            className="p-1.5 rounded-full text-[#8C6E5E] dark:text-[#B59D8F] hover:text-[#452414] dark:hover:text-[#F6F1EC] hover:bg-white dark:hover:bg-[#2A2019] border border-[#EBDED5] dark:border-[#3D2E24] transition-colors shrink-0"
            title="Configurar fotos e dados dos filhos"
          >
            <Camera className="w-3.5 h-3.5 text-[#E8A5B8]" />
          </button>
        )}
      </div>

      {/* 4. Compact Summary Card per Active Tab */}
      {activeCategoryTab === 'pequenos' && (
        <div className="p-4 rounded-3xl bg-[#FDF4F5] dark:bg-[#2D1F25] border border-[#E8A5B8] space-y-3 shadow-xs animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Baby className="w-4 h-4 text-[#844E5F] dark:text-[#F2C4CE]" />
              <h4 className="font-serif text-sm font-semibold text-[#452414] dark:text-[#F6F1EC]">
                Espaço dos Filhos
              </h4>
            </div>
            <button
              onClick={openCreatePersonModal}
              className="text-[11px] font-semibold text-[#844E5F] dark:text-[#F2C4CE] hover:underline"
            >
              + Adicionar filho
            </button>
          </div>

          {upcomingSummaryData.kidsList.length === 0 ? (
            <p className="text-xs text-[#8C6E5E] dark:text-[#B59D8F]">
              Nenhum filho cadastrado ainda. Toque em "+ Adicionar filho" para personalizar a rotina.
            </p>
          ) : (
            <div className="space-y-2.5">
              {upcomingSummaryData.kidsList.map((kid) => {
                const ageText = calculateAgeDisplay(kid.birthDate);
                const nextKidEvent = upcomingSummaryData.futureEvents.find(
                  (ev) => ev.personId === kid.id
                );

                return (
                  <div
                    key={kid.id}
                    className="p-3 rounded-2xl bg-white/80 dark:bg-[#1E1712]/80 border border-[#E8A5B8]/40 flex items-start gap-3"
                  >
                    {kid.avatarUrl ? (
                      <img
                        src={kid.avatarUrl}
                        alt={kid.name}
                        className="w-10 h-10 rounded-full object-cover border-2 shrink-0 shadow-xs"
                        style={{ borderColor: kid.color || '#E8A5B8' }}
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-xs"
                        style={{ backgroundColor: kid.color || '#E8A5B8' }}
                      >
                        {kid.name ? kid.name[0].toUpperCase() : '?'}
                      </div>
                    )}

                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#452414] dark:text-[#F6F1EC]">
                          {kid.name}
                        </span>
                        {ageText && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FAF7F2] dark:bg-[#2A2019] border border-[#EBDED5] dark:border-[#3D2E24] text-[#844E5F] dark:text-[#F2C4CE] font-semibold">
                            {ageText}
                          </span>
                        )}
                      </div>

                      {kid.notes && (
                        <p className="text-[11px] text-[#8C6E5E] dark:text-[#B59D8F] line-clamp-1">
                          {kid.notes}
                        </p>
                      )}

                      <div className="pt-1 flex items-center gap-1.5 text-[10px] text-[#6B3F2A] dark:text-[#E8DDD4]">
                        <Clock className="w-3 h-3 text-[#E8A5B8] shrink-0" />
                        {nextKidEvent ? (
                          <span className="truncate">
                            Próximo: {formatDateShortBR(nextKidEvent.dateStr)} às {nextKidEvent.time} — {nextKidEvent.title}
                          </span>
                        ) : (
                          <span className="italic text-[#8C6E5E] dark:text-[#B59D8F]">
                            Sem consultas ou vacinas agendadas
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeCategoryTab === 'familia' && (
        <div className="p-4 rounded-3xl bg-[#FAF7F2] dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] space-y-2.5 shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-[#B88E72]" />
            <h4 className="font-serif text-sm font-semibold text-[#452414] dark:text-[#F6F1EC]">
              Resumo de Família & Casal
            </h4>
          </div>

          <div className="space-y-1.5">
            {upcomingSummaryData.futureEvents
              .filter((ev) => {
                const cat = getEventCategory(ev);
                return cat === 'familia' || cat === 'casamento';
              })
              .slice(0, 3)
              .map((ev) => (
                <div
                  key={ev.id}
                  className="p-2.5 rounded-xl bg-white dark:bg-[#1E1712] border border-[#EBDED5] dark:border-[#3D2E24] flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-mono font-bold text-[#6B3F2A] dark:text-[#E8A5B8] shrink-0">
                      {formatDateShortBR(ev.dateStr)} {ev.time}
                    </span>
                    <span className="truncate font-medium text-[#452414] dark:text-[#F6F1EC]">
                      {ev.title}
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FAF7F2] dark:bg-[#2A2019] text-[#8C6E5E] border border-[#EBDED5] dark:border-[#3D2E24] shrink-0">
                    {ev.tag}
                  </span>
                </div>
              ))}

            {upcomingSummaryData.futureEvents.filter((ev) => {
              const cat = getEventCategory(ev);
              return cat === 'familia' || cat === 'casamento';
            }).length === 0 && (
              <p className="text-xs text-[#8C6E5E] dark:text-[#B59D8F] italic">
                Nenhum compromisso de casal ou família agendado para os próximos dias.
              </p>
            )}
          </div>
        </div>
      )}

      {activeCategoryTab === 'pessoal' && (
        <div className="p-4 rounded-3xl bg-[#FAF7F2] dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] space-y-2.5 shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#6B3F2A] dark:text-[#E8DDD4]" />
            <h4 className="font-serif text-sm font-semibold text-[#452414] dark:text-[#F6F1EC]">
              Resumo Pessoal ({userName})
            </h4>
          </div>

          <div className="space-y-1.5">
            {upcomingSummaryData.futureEvents
              .filter((ev) => getEventCategory(ev) === 'pessoal')
              .slice(0, 3)
              .map((ev) => (
                <div
                  key={ev.id}
                  className="p-2.5 rounded-xl bg-white dark:bg-[#1E1712] border border-[#EBDED5] dark:border-[#3D2E24] flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-mono font-bold text-[#6B3F2A] dark:text-[#E8A5B8] shrink-0">
                      {formatDateShortBR(ev.dateStr)} {ev.time}
                    </span>
                    <span className="truncate font-medium text-[#452414] dark:text-[#F6F1EC]">
                      {ev.title}
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FAF7F2] dark:bg-[#2A2019] text-[#8C6E5E] border border-[#EBDED5] dark:border-[#3D2E24] shrink-0">
                    {ev.tag}
                  </span>
                </div>
              ))}

            {upcomingSummaryData.futureEvents.filter((ev) => getEventCategory(ev) === 'pessoal').length === 0 && (
              <p className="text-xs text-[#8C6E5E] dark:text-[#B59D8F] italic">
                Nenhum compromisso pessoal agendado para os próximos dias.
              </p>
            )}
          </div>
        </div>
      )}

      {activeCategoryTab === 'todos' && (
        <div className="p-4 rounded-3xl bg-[#FAF7F2] dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] space-y-2.5 shadow-xs animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-[#B88E72]" />
              <h4 className="font-serif text-sm font-semibold text-[#452414] dark:text-[#F6F1EC]">
                Próximos Compromissos Gerais
              </h4>
            </div>
            <span className="text-[10px] text-[#8C6E5E] dark:text-[#B59D8F]">
              {events.filter((e) => (e.dateStr || todayStr) === todayStr).length} hoje
            </span>
          </div>

          <div className="space-y-1.5">
            {upcomingSummaryData.futureEvents.slice(0, 3).map((ev) => {
              const person = activePeople.find((p) => p.id === ev.personId);
              return (
                <div
                  key={ev.id}
                  className="p-2.5 rounded-xl bg-white dark:bg-[#1E1712] border border-[#EBDED5] dark:border-[#3D2E24] flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-mono font-bold text-[#6B3F2A] dark:text-[#E8A5B8] shrink-0">
                      {formatDateShortBR(ev.dateStr)} {ev.time}
                    </span>
                    <span className="truncate font-medium text-[#452414] dark:text-[#F6F1EC]">
                      {ev.title}
                    </span>
                  </div>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0"
                    style={{
                      backgroundColor: `${person?.color || '#6B3F2A'}15`,
                      color: person?.color || '#6B3F2A',
                    }}
                  >
                    {person?.name || getDisplayTagLabel(ev)}
                  </span>
                </div>
              );
            })}

            {upcomingSummaryData.futureEvents.length === 0 && (
              <p className="text-xs text-[#8C6E5E] dark:text-[#B59D8F] italic">
                Nenhum compromisso agendado nos próximos dias.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Despertador de Compromissos Banner */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FDF4F5] dark:bg-[#38262B] border border-[#E8A5B8] flex items-center justify-center text-[#844E5F] dark:text-[#F2C4CE] shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-serif text-sm font-semibold text-[#452414] dark:text-[#F6F1EC]">
                Despertador de Compromissos
              </h4>
              <span
                className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  alarmConfig.enabled
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                }`}
              >
                {alarmConfig.enabled ? 'Ativo' : 'Pausado'}
              </span>
            </div>
            <p className="text-xs text-[#8C6E5E] dark:text-[#B59D8F]">
              {alarmConfig.enabled
                ? `${
                    alarmConfig.minutesBefore === 0
                      ? 'Desperta na hora exata'
                      : `${alarmConfig.minutesBefore} min antes`
                  } • ${getSoundName(alarmConfig.sound)}`
                : 'Despertador pausado'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onOpenAlarmSettings}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#6B3F2A] dark:text-[#F2C4CE] bg-[#FAF7F2] dark:bg-[#38262B] hover:bg-[#F0EDE9] border border-[#EBDED5] dark:border-[#3D2E24] transition-colors flex items-center gap-1"
          >
            <Settings className="w-3.5 h-3.5 text-[#B88E72]" />
            <span>Configurar</span>
          </button>
          <button
            onClick={onTriggerTestAlarm}
            className="p-2 rounded-xl text-xs text-[#8C6E5E] dark:text-[#B59D8F] hover:text-[#452414] hover:bg-[#FAF7F2] dark:hover:bg-[#2A2019] border border-[#EBDED5] dark:border-[#3D2E24] transition-colors"
            title="Testar alarme sonoro e pop-up agora"
          >
            <Volume2 className="w-4 h-4 text-[#B88E72]" />
          </button>
        </div>
      </div>

      {/* 5. Dynamic Calendar Week Strip */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-xl font-semibold text-[#452414] dark:text-[#F6F1EC]">
              {calendarTitleInfo.monthYear}
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FAF7F2] dark:bg-[#1E1712] border border-[#EBDED5] dark:border-[#3D2E24] text-[#8C6E5E] font-medium">
              Semana {calendarTitleInfo.weekNum}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {weekOffset !== 0 && (
              <button
                type="button"
                onClick={handleGoToday}
                className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-[#FDF4F5] dark:bg-[#38262B] text-[#844E5F] dark:text-[#F2C4CE] border border-[#E8A5B8] hover:bg-[#F2C4CE]/40 transition-colors"
              >
                Hoje
              </button>
            )}
            <button
              onClick={() => setWeekOffset((prev) => prev - 1)}
              className="p-1.5 rounded-full text-[#8C6E5E] hover:text-[#452414] hover:bg-[#FAF7F2] dark:hover:bg-[#2F241C] transition-colors"
              title="Semana anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setWeekOffset((prev) => prev + 1)}
              className="p-1.5 rounded-full text-[#8C6E5E] hover:text-[#452414] hover:bg-[#FAF7F2] dark:hover:bg-[#2F241C] transition-colors"
              title="Próxima semana"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days Row */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center">
          {weekDaysWithDots.map((item) => {
            const isSelected = item.dateStr === selectedDateStr;
            return (
              <button
                key={item.dateStr}
                onClick={() => setSelectedDateStr(item.dateStr)}
                className={`py-2 px-1 rounded-2xl flex flex-col items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-[#452414] dark:bg-[#E8A5B8] text-white dark:text-[#251D17] shadow-sm scale-105'
                    : item.isToday
                    ? 'bg-[#FAF7F2] dark:bg-[#2F241C] text-[#6B3F2A] border border-[#E8A5B8]'
                    : 'hover:bg-[#FAF7F2] dark:hover:bg-[#2F241C] text-[#8C6E5E]'
                }`}
              >
                <span className="text-[10px] font-semibold uppercase">{item.dayName}</span>
                <span
                  className={`text-sm font-serif font-bold mt-0.5 ${
                    isSelected
                      ? 'text-white dark:text-[#251D17]'
                      : item.isToday
                      ? 'text-[#6B3F2A] dark:text-[#E8A5B8]'
                      : 'text-[#452414] dark:text-[#F6F1EC]'
                  }`}
                >
                  {item.dayNum}
                </span>

                <div className="flex items-center gap-1 mt-1.5 h-1.5">
                  {item.dots.length > 0 ? (
                    item.dots.map((dotColor, idx) => (
                      <span
                        key={idx}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          backgroundColor: isSelected ? '#FFFFFF' : dotColor,
                        }}
                      />
                    ))
                  ) : (
                    <span className="w-1.5 h-1.5 opacity-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="pt-2 border-t border-[#EBDED5] dark:border-[#3D2E24] flex items-center justify-center gap-3 sm:gap-4 text-[11px] text-[#8C6E5E] dark:text-[#B59D8F] flex-wrap">
          {activePeople.map((person) => {
            const categoryLabel =
              person.category === 'pessoal'
                ? 'Pessoal'
                : person.category === 'pequenos'
                ? 'Filhos'
                : 'Família & Casal';
            return (
              <span key={person.id} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: person.color || '#6B3F2A' }}
                />
                <span className="font-medium text-[#452414] dark:text-[#F6F1EC]">{person.name}</span>
                <span className="opacity-75 text-[10px]">({categoryLabel})</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* 6. Primary Action: + Novo Compromisso */}
      <button
        type="button"
        onClick={openNewEventModal}
        className="w-full py-3.5 px-6 rounded-full bg-[#502916] hover:bg-[#6B3F2A] text-white font-medium text-sm flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.99]"
      >
        <Plus className="w-4 h-4" />
        <span>+ Novo Compromisso</span>
      </button>

      {/* 7. Events List for Selected Day */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h4 className="font-serif text-lg font-semibold text-[#452414] dark:text-[#F6F1EC]">
            Eventos de {formatDateDisplay(selectedDateStr)} ({filteredEvents.length})
          </h4>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] text-center space-y-2">
            <CalendarIcon className="w-8 h-8 text-[#B88E72] mx-auto opacity-50" />
            <p className="text-xs text-[#8C6E5E] dark:text-[#B59D8F] font-medium">
              Nenhum compromisso agendado para {formatDateDisplay(selectedDateStr)}
              {activeCategoryTab !== 'todos' ? ` nesta categoria.` : '.'}
            </p>
            <button
              onClick={openNewEventModal}
              className="text-xs font-semibold text-[#6B3F2A] dark:text-[#E8A5B8] hover:underline"
            >
              + Adicionar compromisso neste dia
            </button>
          </div>
        ) : (
          filteredEvents.map((event) => {
            const linkedPerson = event.personId
              ? activePeople.find((p) => p.id === event.personId)
              : activePeople.find((p) => p.category === event.category);

            const avatar = linkedPerson?.avatarUrl;
            const markerColor = linkedPerson?.color || event.tagColor || '#6B3F2A';
            const personDisplayName = linkedPerson?.name;
            const effectiveCategory = getEventCategory(event);

            return (
              <div
                key={event.id}
                className="p-4 rounded-2xl bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] shadow-xs hover:border-[#B88E72] transition-all space-y-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {avatar ? (
                      <div className="relative shrink-0">
                        <img
                          src={avatar}
                          alt={personDisplayName || 'Avatar'}
                          className="w-10 h-10 rounded-full object-cover border-2 shadow-xs"
                          style={{ borderColor: markerColor }}
                        />
                        {effectiveCategory === 'pequenos' && (
                          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#E8A5B8] text-white flex items-center justify-center text-[9px]">
                            👶
                          </span>
                        )}
                      </div>
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-xs"
                        style={{ backgroundColor: markerColor }}
                      >
                        {getCategoryIcon(effectiveCategory)}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold text-[#6B3F2A] dark:text-[#E8A5B8]">
                          {event.time}
                        </span>
                        <h5 className="text-sm font-semibold text-[#452414] dark:text-[#F6F1EC]">
                          {event.title}
                        </h5>
                        {event.alarmEnabled !== false && alarmConfig.enabled && (
                          <span
                            className="flex items-center gap-1 text-[10px] font-medium text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800"
                            title="Despertador ativo para este compromisso"
                          >
                            <Bell className="w-2.5 h-2.5" />
                            <span>{event.minutesBeforeAlarm ?? alarmConfig.minutesBefore}m</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#8C6E5E] dark:text-[#B59D8F] mt-0.5">
                        {event.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-[#FAF7F2] dark:bg-[#1E1712] text-[#6B3F2A] dark:text-[#F2C4CE] border border-[#EBDED5] dark:border-[#3D2E24]"
                    >
                      {getDisplayTagLabel(event)}
                    </span>
                    <button
                      type="button"
                      onClick={() => openEditEventModal(event)}
                      className="p-1 text-[#8C6E5E] hover:text-[#B88E72] transition-colors"
                      title="Editar evento"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {onDeleteEvent && (
                      <button
                        type="button"
                        onClick={() => onDeleteEvent(event.id)}
                        className="p-1 text-[#8C6E5E] hover:text-red-600 transition-colors"
                        title="Excluir evento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-[#EBDED5]/60 dark:border-[#3D2E24] flex items-center justify-between text-xs text-[#8C6E5E] dark:text-[#B59D8F]">
                  {event.location && (
                    <div className="flex items-center gap-1.5">
                      {event.location.includes('Meet') ? (
                        <Video className="w-3.5 h-3.5 text-[#6B3F2A] dark:text-[#E8A5B8]" />
                      ) : (
                        <MapPin className="w-3.5 h-3.5 text-[#B88E72]" />
                      )}
                      <span>{event.location}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 ml-auto">
                    <span className="text-[11px] font-medium text-[#6B3F2A] dark:text-[#E8A5B8]">
                      {event.participants || personDisplayName || ''}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 8. Avisos & Próximos Dias com Alertas Sonoros */}
      <div className="p-5 rounded-3xl bg-[#FAF7F2] dark:bg-[#201813] border border-[#EBDED5] dark:border-[#3D2E24] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#844E5F] dark:text-[#E8A5B8]" />
            <h4 className="font-serif text-base font-semibold text-[#452414] dark:text-[#F6F1EC]">
              Avisos & Próximos Dias ({filteredAndSortedNotices.length})
            </h4>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestChime}
              className="p-1.5 rounded-full text-[#6B3F2A] dark:text-[#E8A5B8] bg-white dark:bg-[#2A2019] border border-[#EBDED5] dark:border-[#3D2E24] hover:bg-[#FDF4F5] transition-colors flex items-center gap-1 text-[11px]"
              title="Testar som do alerta sereno"
            >
              <Volume2 className="w-3 h-3" />
              <span className="hidden sm:inline">Ouvir Som</span>
            </button>

            <button
              type="button"
              onClick={openNewNoticeModal}
              className="p-1.5 rounded-full text-white bg-[#502916] hover:bg-[#6B3F2A] transition-colors"
              title="Adicionar novo aviso"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {filteredAndSortedNotices.length === 0 ? (
          <div className="p-6 rounded-2xl bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] text-center space-y-1.5">
            <p className="text-xs text-[#8C6E5E] dark:text-[#B59D8F]">
              Nenhum aviso cadastrado{activeCategoryTab !== 'todos' ? ' para esta categoria.' : '.'}
            </p>
            <button
              type="button"
              onClick={openNewNoticeModal}
              className="text-xs font-semibold text-[#6B3F2A] dark:text-[#E8A5B8] hover:underline"
            >
              + Criar primeiro aviso
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredAndSortedNotices.map((notice) => {
              const expired = !notice.done && isNoticeExpired(notice);
              const linkedPerson = notice.personId
                ? activePeople.find((p) => p.id === notice.personId)
                : undefined;

              return (
                <div
                  key={notice.id}
                  className={`p-4 rounded-2xl bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] space-y-1.5 transition-all ${
                    notice.done ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => onToggleNotice(notice.id)}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                          notice.done
                            ? 'bg-[#6B3F2A] text-white border-[#6B3F2A]'
                            : 'border-[#B88E72] bg-white dark:bg-[#1E1712]'
                        }`}
                      >
                        {notice.done && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>
                      <h5
                        className={`text-xs font-semibold ${
                          notice.done
                            ? 'line-through text-[#8C6E5E]'
                            : 'text-[#452414] dark:text-[#F6F1EC]'
                        }`}
                      >
                        {notice.title}
                      </h5>

                      {expired && (
                        <span className="text-[10px] font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-900">
                          vencido
                        </span>
                      )}

                      {linkedPerson && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#FAF7F2] dark:bg-[#2A2019] border border-[#EBDED5] dark:border-[#3D2E24] text-[#6B3F2A] dark:text-[#E8A5B8]">
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: linkedPerson.color || '#E8A5B8' }}
                          />
                          {linkedPerson.name}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditNoticeModal(notice)}
                        className="p-1 text-[#8C6E5E] hover:text-[#6B3F2A] dark:hover:text-[#F2C4CE] transition-colors"
                        title="Editar aviso"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {notice.soundAlert && (
                        <button
                          type="button"
                          onClick={handleTestChime}
                          className="p-1 text-emerald-600 dark:text-emerald-400"
                          title="Alerta sonoro ativo (clique para testar som)"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onDeleteNotice(notice.id)}
                        className="p-1 text-[#8C6E5E] hover:text-red-600 transition-colors"
                        title="Excluir aviso"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {notice.subtitle && (
                    <p className="text-xs text-[#8C6E5E] dark:text-[#B59D8F] pl-7">
                      {notice.subtitle}
                    </p>
                  )}

                  <div className="pt-2 pl-7 flex items-center justify-between text-[11px] text-[#B88E72] dark:text-[#D8BDB0]">
                    <span>
                      {formatNoticeDate(notice.dateStr)} às {notice.timeStr}
                    </span>
                    {notice.soundAlert && (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-400">
                        <Sparkles className="w-2.5 h-2.5" />
                        Notificação ativa
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Novo / Editar Aviso com Alerta Sonoro */}
      {isNewNoticeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#231A14]/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#FAF7F2] dark:bg-[#1E1712] rounded-3xl border border-[#EBDED5] dark:border-[#3D2E24] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl font-semibold text-[#452414] dark:text-[#F6F1EC]">
                {editingNoticeId ? 'Editar Aviso' : 'Novo Aviso com Alerta Sonoro'}
              </h3>
              <button
                type="button"
                onClick={() => setIsNewNoticeModalOpen(false)}
                className="p-1 text-[#8C6E5E] hover:text-[#452414]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrEditNotice} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] mb-1">
                  Título do Aviso *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Natação, Consulta Isabella, Entrega TCC..."
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] rounded-xl text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] mb-1">
                  Instruções / O que levar ou preparar
                </label>
                <input
                  type="text"
                  placeholder="Ex: Separar carteirinha, exames e touca..."
                  value={noticeSubtitle}
                  onChange={(e) => setNoticeSubtitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] rounded-xl text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] mb-1">
                    Data do Aviso
                  </label>
                  <input
                    type="date"
                    required
                    value={noticeDate}
                    onChange={(e) => setNoticeDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] rounded-xl text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] mb-1">
                    Horário
                  </label>
                  <input
                    type="time"
                    required
                    value={noticeTime}
                    onChange={(e) => setNoticeTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] rounded-xl text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] mb-1">
                  Pessoa Vinculada (Opcional)
                </label>
                <select
                  value={noticePersonId}
                  onChange={(e) => setNoticePersonId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] rounded-xl text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
                >
                  <option value="none">Geral (Sem pessoa específica)</option>
                  {activePeople.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.category === 'pessoal' ? 'Pessoal' : p.category === 'pequenos' ? 'Filhos' : 'Família & Casal'})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-[#8C6E5E] dark:text-[#B59D8F] mt-1">
                  Ao selecionar uma pessoa, o aviso aparecerá na aba correspondente (ex.: Filhos, Pessoal ou Família).
                </p>
              </div>

              {/* Sound alert switch */}
              <div className="p-3 rounded-2xl bg-[#FDF4F5] dark:bg-[#2F2127] border border-[#E8A5B8]/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-[#E8A5B8]" />
                  <span className="text-xs font-medium text-[#452414] dark:text-[#F6F1EC]">
                    Tocar Alerta Sonoro Sereno
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={noticeSound}
                  onChange={(e) => setNoticeSound(e.target.checked)}
                  className="w-4 h-4 accent-[#6B3F2A]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewNoticeModalOpen(false)}
                  className="px-4 py-2 text-xs text-[#8C6E5E] hover:text-[#452414]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-xs font-semibold text-white bg-[#502916] hover:bg-[#6B3F2A] rounded-full"
                >
                  {editingNoticeId ? 'Salvar Alterações' : 'Criar Aviso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Novo/Editar Compromisso */}
      {isNewEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#231A14]/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#FAF7F2] dark:bg-[#1E1712] rounded-3xl border border-[#EBDED5] dark:border-[#3D2E24] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl font-semibold text-[#452414] dark:text-[#F6F1EC]">
                {editingEventId ? 'Editar Compromisso' : 'Novo Compromisso'}
              </h3>
              <button
                onClick={() => setIsNewEventModalOpen(false)}
                className="p-1 text-[#8C6E5E] hover:text-[#452414]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] mb-1">
                  Título do Evento
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Consulta Pediátrica, Jantar em Casal, Estudos..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] rounded-xl text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] mb-1">
                    Data do Compromisso
                  </label>
                  <input
                    type="date"
                    required
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] rounded-xl text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] mb-1">
                    Horário
                  </label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] rounded-xl text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] mb-1">
                    Pessoa / Perfil
                  </label>
                  <select
                    value={newEventPersonId}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      setNewEventPersonId(selectedId);
                      const matched = activePeople.find((p) => p.id === selectedId);
                      if (matched) {
                        setNewCategory(matched.category);
                      }
                    }}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] rounded-xl text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
                  >
                    {activePeople.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.category === 'pessoal' ? 'Pessoal' : p.category === 'pequenos' ? 'Filhos' : 'Família & Casal'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] mb-1">
                    Categoria
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as EventCategory)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] rounded-xl text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
                  >
                    <option value="pessoal">Pessoal</option>
                    <option value="familia">Família & Casal</option>
                    <option value="casamento">Casamento</option>
                    <option value="pequenos">Filhos</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] mb-1">
                  Local ou Link
                </label>
                <input
                  type="text"
                  placeholder="Ex: Google Meet ou Endereço..."
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] rounded-xl text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] mb-1">
                  Participantes
                </label>
                <input
                  type="text"
                  placeholder="Ex: Em casal, Orientador individual, Dra. Marina..."
                  value={newParticipants}
                  onChange={(e) => setNewParticipants(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] rounded-xl text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] mb-1">
                  Notas / Detalhes
                </label>
                <textarea
                  rows={2}
                  placeholder="Observações importantes..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] rounded-xl text-[#452414] dark:text-[#F6F1EC] placeholder-[#B59D8F] focus:outline-none focus:border-[#6B3F2A]"
                />
              </div>

              {/* Alarm for this event */}
              <div className="p-3 rounded-2xl bg-[#FDF4F5] dark:bg-[#2E2127] border border-[#E8A5B8]/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#844E5F] dark:text-[#E8A5B8]" />
                    <span className="text-xs font-semibold text-[#452414] dark:text-[#F6F1EC]">
                      Despertador / Alarme Sonoro
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={newEventAlarm}
                    onChange={(e) => setNewEventAlarm(e.target.checked)}
                    className="w-4 h-4 accent-[#6B3F2A]"
                  />
                </div>

                {newEventAlarm && (
                  <div className="flex items-center justify-between text-xs text-[#8C6E5E] dark:text-[#B59D8F] pt-1 border-t border-[#E8A5B8]/30">
                    <span>Despertar com antecedência:</span>
                    <select
                      value={newEventAlarmBefore}
                      onChange={(e) => setNewEventAlarmBefore(Number(e.target.value))}
                      className="px-2 py-1 text-xs rounded-lg bg-white dark:bg-[#1E1712] border border-[#EBDED5] dark:border-[#3D2E24] text-[#452414] dark:text-[#F6F1EC]"
                    >
                      <option value={0}>Na hora do evento</option>
                      <option value={5}>5 minutos antes</option>
                      <option value={10}>10 minutos antes</option>
                      <option value={15}>15 minutos antes</option>
                      <option value={30}>30 minutos antes</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewEventModalOpen(false)}
                  className="px-4 py-2 text-xs text-[#8C6E5E] hover:text-[#452414]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-xs font-semibold text-white bg-[#502916] hover:bg-[#6B3F2A] rounded-full"
                >
                  {editingEventId ? 'Salvar Alterações' : 'Agendar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar / Cadastrar Pessoa */}
      <EditPersonModal
        isOpen={Boolean(editingPerson) || isCreatingPerson}
        onClose={() => {
          setEditingPerson(null);
          setIsCreatingPerson(false);
        }}
        person={editingPerson}
        isNewPerson={isCreatingPerson}
        allPeople={activePeople}
        eventsCount={events.filter((e) => e.personId === (editingPerson?.id || '')).length}
        onSavePerson={(updatedPerson) => {
          if (isCreatingPerson && onAddPerson) {
            onAddPerson(updatedPerson);
          } else if (onUpdatePerson) {
            onUpdatePerson(updatedPerson);
          }
          setEditingPerson(null);
          setIsCreatingPerson(false);
        }}
        onDeletePerson={(personId, reassignToPersonId) => {
          if (onDeletePerson) {
            onDeletePerson(personId, reassignToPersonId);
          }
          setEditingPerson(null);
          setIsCreatingPerson(false);
        }}
      />
    </div>
  );
};
