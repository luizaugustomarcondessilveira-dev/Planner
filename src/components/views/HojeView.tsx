import React, { useState, useMemo, useEffect } from 'react';
import {
  Heart,
  Check,
  Plus,
  Utensils,
  Sparkles,
  Droplet,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Settings2,
  Clock,
  Volume2,
  X,
  RotateCcw,
  Calculator,
  Edit2,
  Trash2,
  BookmarkPlus,
  Sliders,
} from 'lucide-react';
import { RoteiroItem, MealPlan, AppImages, HydrationConfig } from '../../types';
import { soundEffects } from '../../utils/audio';
import { toLocalDateKey } from '../../utils/date';
import { sanitizeImageUrl } from '../../lib/security';

interface HojeViewProps {
  selectedDate: Date;
  onChangeDate: (date: Date) => void;
  userName?: string;
  roteiro: RoteiroItem[];
  onToggleRoteiro: (id: string) => void;
  onAddRoteiroItem: (item: Omit<RoteiroItem, 'id'>) => void;
  onEditRoteiroItem?: (id: string, updatedItem: Partial<RoteiroItem>) => void;
  onDeleteRoteiroItem?: (id: string) => void;
  onClearDayRoteiro?: () => void;
  onResetDayRoteiro?: () => void;
  onSaveAsDefaultRoteiro?: () => void;
  onApplyDefaultRoteiro?: () => void;
  userDefaultRoteiro?: RoteiroItem[];
  autoApplyDefaultRoutine?: boolean;
  onToggleAutoApplyDefault?: (enabled: boolean) => void;
  dayStats: Record<string, { total: number; done: number }>;
  meal: MealPlan;
  onUpdateMeal: (meal: MealPlan) => void;
  images: AppImages;
  onOpenSosPrayer: () => void;
  onOpenDesabafo: () => void;
  onOpenImageManager: () => void;
  hydrationConfig: HydrationConfig;
  onUpdateHydrationConfig: (cfg: HydrationConfig) => void;
  cupsDrankToday: number;
  onSetCupsDrankToday: (count: number) => void;
}

export const HojeView: React.FC<HojeViewProps> = ({
  selectedDate,
  onChangeDate,
  userName = 'Helena',
  roteiro,
  onToggleRoteiro,
  onAddRoteiroItem,
  onEditRoteiroItem,
  onDeleteRoteiroItem,
  onClearDayRoteiro,
  onResetDayRoteiro,
  onSaveAsDefaultRoteiro,
  onApplyDefaultRoteiro,
  userDefaultRoteiro = [],
  autoApplyDefaultRoutine = false,
  onToggleAutoApplyDefault,
  dayStats = {},
  meal,
  onUpdateMeal,
  images,
  onOpenSosPrayer,
  onOpenDesabafo,
  onOpenImageManager,
  hydrationConfig,
  onUpdateHydrationConfig,
  cupsDrankToday,
  onSetCupsDrankToday,
}) => {
  // Hydration calculator & settings modal
  const [isHydrationModalOpen, setIsHydrationModalOpen] = useState(false);
  const [calcWeight, setCalcWeight] = useState(hydrationConfig.userWeightKg || 60);
  const [tempCupSize, setTempCupSize] = useState(hydrationConfig.cupSizeMl || 1200);

  // Calendar month state
  const [calendarMonth, setCalendarMonth] = useState<Date>(
    () => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  );

  // Default routine management modal
  const [isRoutineSettingsOpen, setIsRoutineSettingsOpen] = useState(false);
  const [routineToast, setRoutineToast] = useState<string | null>(null);

  // Sync calendar month when selected date changes externally
  useEffect(() => {
    if (
      selectedDate.getFullYear() !== calendarMonth.getFullYear() ||
      selectedDate.getMonth() !== calendarMonth.getMonth()
    ) {
      setCalendarMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    }
  }, [selectedDate]);

  // New item modal
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemSubtitle, setNewItemSubtitle] = useState('');
  const [newItemTime, setNewItemTime] = useState('');

  // Edit roteiro item modal
  const [editingItem, setEditingItem] = useState<RoteiroItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editStatusTag, setEditStatusTag] = useState('');
  const [editDone, setEditDone] = useState(false);

  // Confirm clear day roteiro modal
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  // Recipe modal
  const [isViewingRecipe, setIsViewingRecipe] = useState(false);

  // Verses
  const [verseIdx, setVerseIdx] = useState(0);
  const verses = [
    {
      text: 'Tudo tem o seu tempo determinado, e há tempo para todo o propósito debaixo do céu.',
      ref: 'Eclesiastes 3:1',
    },
    {
      text: 'O Senhor é o meu pastor; nada me faltará. Deitar-me faz em verdes pastos, guia-me mansamente a águas tranquilas.',
      ref: 'Salmos 23:1-2',
    },
    {
      text: 'A quietude e a confiança são a vossa força.',
      ref: 'Isaías 30:15',
    },
    {
      text: 'Lâmpada para os meus pés é a tua palavra, e luz para o meu caminho.',
      ref: 'Salmos 119:105',
    },
  ];

  // Date helpers
  const isToday =
    selectedDate.toDateString() === new Date().toDateString();

  const formattedDateTitle = selectedDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const handlePrevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    onChangeDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    onChangeDate(next);
  };

  const handleGoToday = () => {
    onChangeDate(new Date());
  };

  // Hydration calculations
  const cupSizeMl = hydrationConfig.cupSizeMl || 1200;
  const goalMl = hydrationConfig.customGoalMl || hydrationConfig.calculatedGoalMl || 2400;
  const totalCupsNeeded = Math.max(1, Math.round(goalMl / cupSizeMl));
  const currentMlDrank = cupsDrankToday * cupSizeMl;
  const hydrationPercent = Math.min(100, Math.round((currentMlDrank / goalMl) * 100));

  const handleCupClick = (cupIndex: number) => {
    soundEffects.playWaterDrop();
    if (cupIndex === cupsDrankToday - 1) {
      onSetCupsDrankToday(cupsDrankToday - 1);
    } else {
      onSetCupsDrankToday(cupIndex + 1);
    }
  };

  const handleSaveHydrationConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const calculated = Math.round(calcWeight * 35);
    onUpdateHydrationConfig({
      ...hydrationConfig,
      userWeightKg: calcWeight,
      cupSizeMl: tempCupSize,
      calculatedGoalMl: calculated,
      customGoalMl: calculated,
    });
    setIsHydrationModalOpen(false);
  };

  const completedRoteiroCount = roteiro.filter((r) => r.done).length;

  const handleCreateRoteiroItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;
    onAddRoteiroItem({
      title: newItemTitle.trim(),
      subtitle: newItemSubtitle.trim() || 'Hábito intencional',
      time: newItemTime.trim() || undefined,
      done: false,
      statusTag: newItemTime.trim() || 'Pendente',
    });
    setNewItemTitle('');
    setNewItemSubtitle('');
    setNewItemTime('');
    setIsAddingItem(false);
  };

  const handleOpenEdit = (item: RoteiroItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingItem(item);
    setEditTitle(item.title);
    setEditSubtitle(item.subtitle);
    setEditTime(item.time || '');
    setEditStatusTag(item.statusTag || '');
    setEditDone(item.done);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editTitle.trim()) return;
    if (onEditRoteiroItem) {
      onEditRoteiroItem(editingItem.id, {
        title: editTitle.trim(),
        subtitle: editSubtitle.trim() || 'Hábito intencional',
        time: editTime.trim() || undefined,
        statusTag: editStatusTag.trim() || (editTime.trim() || 'Pendente'),
        done: editDone,
      });
    }
    setEditingItem(null);
  };

  const handleDeleteItem = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onDeleteRoteiroItem) {
      onDeleteRoteiroItem(id);
    }
    if (editingItem?.id === id) {
      setEditingItem(null);
    }
  };

  // Calendar month calculation & constants
  const calYear = calendarMonth.getFullYear();
  const calMonth = calendarMonth.getMonth();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay(); // 0 is Sunday
  const todayStr = toLocalDateKey(new Date());

  const monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];
  const calMonthTitle = `${monthNames[calMonth]} de ${calYear}`;

  const handlePrevMonth = () => {
    setCalendarMonth(new Date(calYear, calMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarMonth(new Date(calYear, calMonth + 1, 1));
  };

  // Month completion percentage
  const { daysWithItemsCount, completedDaysCount } = useMemo(() => {
    let withItems = 0;
    let completed = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dDate = new Date(calYear, calMonth, d);
      const dKey = toLocalDateKey(dDate);
      const stats = dayStats[dKey];
      if (stats && stats.total > 0) {
        withItems++;
        if (dKey <= todayStr && stats.done === stats.total) {
          completed++;
        }
      }
    }
    return { daysWithItemsCount: withItems, completedDaysCount: completed };
  }, [calYear, calMonth, daysInMonth, todayStr, dayStats]);

  const completionPercentText =
    daysWithItemsCount > 0
      ? `${Math.round((completedDaysCount / daysWithItemsCount) * 100)}%`
      : '—';

  const handleSaveAsDefault = () => {
    if (onSaveAsDefaultRoteiro) {
      onSaveAsDefaultRoteiro();
      setRoutineToast('Roteiro atual salvo como padrão com sucesso!');
      setTimeout(() => setRoutineToast(null), 3000);
    }
  };

  const handleApplyDefault = () => {
    if (onApplyDefaultRoteiro) {
      onApplyDefaultRoteiro();
      setRoutineToast('Roteiro padrão aplicado a este dia!');
      setTimeout(() => setRoutineToast(null), 3000);
    }
  };

  return (
    <div className="space-y-6 pb-24 animate-fade-in max-w-xl mx-auto">
      {/* 1. Interactive Date Navigator */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePrevDay}
            className="p-1.5 rounded-xl hover:bg-[#FAF7F2] dark:hover:bg-[#2F241C] text-[#8C6E5E] hover:text-[#452414] dark:hover:text-[#F6F1EC] transition-colors"
            title="Dia anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {!isToday && (
            <button
              onClick={handleGoToday}
              className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-[#FDF4F5] dark:bg-[#38262B] text-[#844E5F] dark:text-[#F2C4CE] border border-[#E8A5B8]"
            >
              Voltar para Hoje
            </button>
          )}
        </div>

        <div className="text-center">
          <span className="block text-[11px] tracking-[0.14em] uppercase font-bold text-[#8C6E5E] dark:text-[#B59D8F]">
            {formattedDateTitle}
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#452414] dark:text-[#F6F1EC] tracking-tight">
            Paz e graça, {userName || 'Helena'}
          </h2>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleNextDay}
            className="p-1.5 rounded-xl hover:bg-[#FAF7F2] dark:hover:bg-[#2F241C] text-[#8C6E5E] hover:text-[#452414] dark:hover:text-[#F6F1EC] transition-colors"
            title="Próximo dia"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Alento Diário Quote Card */}
      <div className="relative p-6 rounded-3xl bg-[#F6F3EE] dark:bg-[#241C16] border border-[#EBDED5] dark:border-[#3D2E24] shadow-xs overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-[11px] tracking-wider uppercase font-bold text-[#8C6E5E] dark:text-[#B59D8F]">
            <span className="text-sm font-serif italic text-[#B88E72]">99</span>
            <span>Alento Diário</span>
          </div>
          <button
            onClick={() => setVerseIdx((prev) => (prev + 1) % verses.length)}
            className="text-[11px] text-[#B88E72] hover:text-[#6B3F2A] dark:hover:text-[#F6F1EC] font-medium flex items-center gap-1"
            title="Outro versículo"
          >
            <Sparkles className="w-3 h-3" />
            Renovar
          </button>
        </div>

        <blockquote className="font-serif italic text-base sm:text-lg text-[#452414] dark:text-[#F6F1EC] leading-relaxed">
          "{verses[verseIdx].text}"
        </blockquote>
        <div className="mt-2 text-right">
          <span className="text-xs font-serif font-semibold text-[#6B3F2A] dark:text-[#D8BDB0]">
            — {verses[verseIdx].ref}
          </span>
        </div>
      </div>

      {/* 3. SOS Oração & Cantinho do Desabafo Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* SOS Card */}
        <div className="p-4 rounded-3xl bg-[#FDF4F5] dark:bg-[#2F2127] border border-[#E8A5B8]/50 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-[#3D2831] border border-[#E8A5B8] flex items-center justify-center text-[#E8A5B8] shadow-xs">
              <Heart className="w-5 h-5 fill-[#E8A5B8]" />
            </div>
            <div>
              <h4 className="font-serif text-sm font-semibold text-[#452414] dark:text-[#F6F1EC] leading-tight">
                SOS Oração
              </h4>
              <p className="text-[11px] text-[#8C6E5E] dark:text-[#B59D8F]">
                Respiração 4-7-8 & paz
              </p>
            </div>
          </div>
          <button
            onClick={onOpenSosPrayer}
            className="px-3 py-2 rounded-full text-xs font-semibold text-white bg-[#452414] hover:bg-[#6B3F2A] transition-all shadow-xs shrink-0 active:scale-95"
          >
            Acalmar
          </button>
        </div>

        {/* Desabafo Card */}
        <div className="p-4 rounded-3xl bg-[#FAF7F2] dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-[#2F241C] border border-[#B88E72] flex items-center justify-center text-[#6B3F2A] dark:text-[#E8A5B8] shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-serif text-sm font-semibold text-[#452414] dark:text-[#F6F1EC] leading-tight">
                Desabafo Íntimo
              </h4>
              <p className="text-[11px] text-[#8C6E5E] dark:text-[#B59D8F]">
                Escreva sem julgamentos
              </p>
            </div>
          </div>
          <button
            onClick={onOpenDesabafo}
            className="px-3 py-2 rounded-full text-xs font-semibold text-[#6B3F2A] dark:text-[#F6F1EC] bg-white dark:bg-[#382B22] border border-[#EBDED5] dark:border-[#3D2E24] hover:bg-[#FDF4F5] transition-all shadow-xs shrink-0 active:scale-95"
          >
            Desabafar
          </button>
        </div>
      </div>

      {/* 4. Templo & Saúde - Hidratação com Copo de 1.2L & Calculadora */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-[0.14em] font-semibold text-[#8C6E5E] dark:text-[#B59D8F] block">
              Templo & Saúde • Programação por Horários
            </span>
            <h3 className="font-serif text-xl font-semibold text-[#452414] dark:text-[#F6F1EC]">
              Hidratação do Dia ({cupSizeMl >= 1000 ? `${(cupSizeMl / 1000).toFixed(1)}L` : `${cupSizeMl}ml`} por copo)
            </h3>
          </div>

          <button
            onClick={() => setIsHydrationModalOpen(true)}
            className="p-2 rounded-full text-[#6B3F2A] dark:text-[#E8DDD4] hover:bg-[#FAF7F2] dark:hover:bg-[#2F241C] border border-[#EBDED5] dark:border-[#3D2E24] transition-colors flex items-center gap-1 text-xs"
            title="Configurar tamanho do copo e calcular meta"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Calculadora</span>
          </button>
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-between text-xs font-medium text-[#6B3F2A] dark:text-[#D8BDB0] bg-[#FAF7F2] dark:bg-[#1E1712] p-3 rounded-2xl border border-[#EBDED5] dark:border-[#3D2E24]">
          <div className="flex items-center gap-2">
            <Droplet className="w-4 h-4 text-[#E8A5B8] fill-[#E8A5B8]" />
            <span>
              <strong className="text-[#452414] dark:text-white font-bold">{cupsDrankToday}</strong> de {totalCupsNeeded} copos de {(cupSizeMl / 1000).toFixed(1)}L
            </span>
          </div>
          <span className="font-semibold">
            {(currentMlDrank / 1000).toFixed(1)}L de {(goalMl / 1000).toFixed(1)}L ({hydrationPercent}%)
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2.5 bg-[#F4EFEA] dark:bg-[#2A2019] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#F2C4CE] to-[#E8A5B8] transition-all duration-500 rounded-full"
            style={{ width: `${hydrationPercent}%` }}
          />
        </div>

        {/* Large 1.2L Cups Display */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {Array.from({ length: totalCupsNeeded }).map((_, index) => {
            const isFilled = index < cupsDrankToday;
            const cupNumber = index + 1;
            const turnLabel =
              cupNumber === 1
                ? 'Manhã (07h - 13h)'
                : cupNumber === 2
                ? 'Tarde (13h - 18h)'
                : cupNumber === 3
                ? 'Noite (18h - 22h)'
                : `Etapa ${cupNumber}`;

            return (
              <button
                key={index}
                onClick={() => handleCupClick(index)}
                className={`py-4 px-3 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 border ${
                  isFilled
                    ? 'bg-[#F2C4CE] dark:bg-[#4A2D35] border-[#E8A5B8] text-[#452414] dark:text-white shadow-xs scale-102 font-semibold'
                    : 'bg-[#FAF7F2] dark:bg-[#1E1712] border-[#EBDED5] dark:border-[#3D2E24] text-[#8C6E5E] dark:text-[#B59D8F] hover:border-[#B88E72]'
                }`}
                title={`Copo ${cupNumber} de ${(cupSizeMl / 1000).toFixed(1)}L - Clique para marcar/desmarcar`}
              >
                <div className="relative">
                  <Droplet
                    className={`w-6 h-6 ${
                      isFilled
                        ? 'fill-[#6B3F2A] dark:fill-[#F2C4CE] text-[#6B3F2A] dark:text-[#F2C4CE]'
                        : 'text-[#8C6E5E]'
                    }`}
                  />
                  {isFilled && (
                    <Check className="w-3 h-3 stroke-[3] text-white absolute inset-0 m-auto" />
                  )}
                </div>
                <span className="text-xs font-bold mt-1.5">
                  Copo {cupNumber} ({(cupSizeMl / 1000).toFixed(1)}L)
                </span>
                <span className="text-[10px] text-[#8C6E5E] dark:text-[#B59D8F] mt-0.5">
                  {turnLabel}
                </span>
              </button>
            );
          })}
        </div>

        {/* Schedule note */}
        <div className="flex items-center justify-between text-[11px] text-[#8C6E5E] dark:text-[#B59D8F] pt-1">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#B88E72]" />
            Próximo gole recomendado: a cada 45 minutos
          </span>
          <span className="text-[#6B3F2A] dark:text-[#D8BDB0] font-medium">
            Sons suaves de água ativados 💧
          </span>
        </div>
      </div>

      {/* 5. Ritmo & Constância - Roteiro do Dia integrado à data selecionada */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] shadow-xs space-y-4">
        {/* Feedback Toast */}
        {routineToast && (
          <div className="p-2.5 rounded-xl bg-[#FDF4F5] dark:bg-[#38262B] border border-[#E8A5B8] text-xs font-semibold text-[#844E5F] dark:text-[#F2C4CE] text-center animate-fade-in flex items-center justify-between">
            <span className="flex-1 text-center">{routineToast}</span>
            <button onClick={() => setRoutineToast(null)} className="p-1 hover:text-[#452414]">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-[0.14em] font-semibold text-[#8C6E5E] dark:text-[#B59D8F] block">
              Ritmo & Constância • {isToday ? 'Hoje' : formattedDateTitle}
            </span>
            <h3 className="font-serif text-xl font-semibold text-[#452414] dark:text-[#F6F1EC]">
              Roteiro do Dia
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#6B3F2A] dark:text-[#F2C4CE] bg-[#FDF4F5] dark:bg-[#38262B] border border-[#E8A5B8]/40 px-3 py-1 rounded-full">
              {completedRoteiroCount} de {roteiro.length} concluídos
            </span>

            <button
              onClick={() => setIsRoutineSettingsOpen(true)}
              className="p-1.5 rounded-full text-[#8C6E5E] hover:text-[#6B3F2A] dark:hover:text-[#F6F1EC] hover:bg-[#FAF7F2] dark:hover:bg-[#2F241C] border border-[#EBDED5] dark:border-[#3D2E24] transition-colors"
              title="Gerenciar Roteiro Padrão"
            >
              <BookmarkPlus className="w-4 h-4" />
            </button>

            {roteiro.length > 0 && onClearDayRoteiro && (
              <button
                onClick={() => setIsConfirmingClear(true)}
                className="p-1.5 rounded-full text-[#8C6E5E] hover:text-red-600 dark:hover:text-red-400 hover:bg-[#FDF4F5] dark:hover:bg-[#382126] border border-[#EBDED5] dark:border-[#3D2E24] transition-colors"
                title="Apagar todo o roteiro deste dia"
                aria-label="Apagar todo o roteiro"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => setIsAddingItem(true)}
              className="p-1.5 rounded-full text-[#6B3F2A] dark:text-[#F6F1EC] hover:bg-[#FAF7F2] dark:hover:bg-[#2F241C] border border-[#EBDED5] dark:border-[#3D2E24] transition-colors"
              title="Adicionar novo hábito a este dia"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal to add roteiro item */}
        {isAddingItem && (
          <form
            onSubmit={handleCreateRoteiroItem}
            className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1712] border border-[#EBDED5] dark:border-[#3D2E24] space-y-3 animate-fade-in"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#452414] dark:text-[#F6F1EC]">
                Adicionar Hábito ao Roteiro
              </span>
              <button
                type="button"
                onClick={() => setIsAddingItem(false)}
                className="text-[#8C6E5E] hover:text-[#452414]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Ex: Leitura dos Salmos ou Caminhada..."
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] rounded-xl text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
              required
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Subtítulo / Intenção..."
                value={newItemSubtitle}
                onChange={(e) => setNewItemSubtitle(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] rounded-xl text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
              />
              <input
                type="text"
                placeholder="Horário (ex: 15:00)..."
                value={newItemTime}
                onChange={(e) => setNewItemTime(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] rounded-xl text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingItem(false)}
                className="px-3 py-1.5 text-xs text-[#8C6E5E] hover:text-[#452414]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#6B3F2A] hover:bg-[#502916] rounded-full"
              >
                Adicionar
              </button>
            </div>
          </form>
        )}

        {/* Checklist or Empty State */}
        {roteiro.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-2xl bg-[#FAF7F2]/60 dark:bg-[#1E1712]/60 border border-dashed border-[#EBDED5] dark:border-[#3D2E24] space-y-3">
            <p className="text-xs text-[#8C6E5E] dark:text-[#B59D8F]">
              Nenhum hábito no roteiro deste dia.
            </p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setIsAddingItem(true)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-white bg-[#502916] hover:bg-[#6B3F2A] flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar Hábito
              </button>
              {userDefaultRoteiro.length > 0 && onApplyDefaultRoteiro ? (
                <button
                  type="button"
                  onClick={handleApplyDefault}
                  className="px-4 py-2 rounded-full text-xs font-medium text-[#6B3F2A] dark:text-[#F6F1EC] bg-white dark:bg-[#2A2019] border border-[#EBDED5] dark:border-[#3D2E24] hover:bg-[#FAF7F2] flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Aplicar Roteiro Padrão ({userDefaultRoteiro.length} itens)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsRoutineSettingsOpen(true)}
                  className="px-4 py-2 rounded-full text-xs font-medium text-[#6B3F2A] dark:text-[#F6F1EC] bg-white dark:bg-[#2A2019] border border-[#EBDED5] dark:border-[#3D2E24] hover:bg-[#FAF7F2] flex items-center gap-1.5 transition-colors"
                >
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  Configurar Roteiro Padrão
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {roteiro.map((item) => {
              return (
                <div
                  key={item.id}
                  onClick={() => onToggleRoteiro(item.id)}
                  className={`group flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    item.done
                      ? 'bg-[#FAF7F2]/60 dark:bg-[#1E1712]/60 border-[#EBDED5] dark:border-[#3D2E24] text-[#8C6E5E]'
                      : 'bg-white dark:bg-[#251D17] border-[#EBDED5] dark:border-[#3D2E24] hover:border-[#B88E72] text-[#452414] dark:text-[#F6F1EC]'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div
                      className={`w-6 h-6 shrink-0 rounded-lg flex items-center justify-center transition-all ${
                        item.done
                          ? 'bg-[#452414] dark:bg-[#E8A5B8] text-white dark:text-[#251D17]'
                          : 'border-2 border-[#B88E72] bg-white dark:bg-[#2A2019]'
                      }`}
                    >
                      {item.done && <Check className="w-4 h-4 stroke-[3]" />}
                    </div>

                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.time && (
                          <span
                            className={`text-xs font-mono font-medium ${
                              item.done ? 'line-through text-[#8C6E5E]' : 'text-[#6B3F2A] dark:text-[#D8BDB0]'
                            }`}
                          >
                            {item.time} •
                          </span>
                        )}
                        <span
                          className={`text-sm font-semibold truncate ${
                            item.done ? 'line-through text-[#8C6E5E]' : 'text-[#452414] dark:text-[#F6F1EC]'
                          }`}
                        >
                          {item.title}
                        </span>
                      </div>
                      <p className="text-xs text-[#8C6E5E] dark:text-[#B59D8F] mt-0.5 line-clamp-1">{item.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.statusTag && (
                      <span
                        className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${
                          item.done
                            ? 'bg-[#F4EFEA] dark:bg-[#1E1712] text-[#8C6E5E]'
                            : item.statusTag === 'Agora'
                            ? 'bg-[#FDF4F5] dark:bg-[#38262B] text-[#6B3F2A] dark:text-[#F2C4CE] border border-[#E8A5B8] font-bold'
                            : 'bg-[#FAF7F2] dark:bg-[#2A2019] text-[#8C6E5E]'
                        }`}
                      >
                        {item.done ? 'Feito' : item.statusTag}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={(e) => handleOpenEdit(item, e)}
                      className="p-1.5 rounded-lg text-[#8C6E5E] hover:text-[#6B3F2A] dark:hover:text-[#F6F1EC] hover:bg-[#FAF7F2] dark:hover:bg-[#382B22] transition-colors"
                      title="Editar hábito"
                      aria-label="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteItem(item.id, e)}
                      className="p-1.5 rounded-lg text-[#8C6E5E] hover:text-red-600 dark:hover:text-red-400 hover:bg-[#FDF4F5] dark:hover:bg-[#382126] transition-colors"
                      title="Apagar este hábito do dia"
                      aria-label="Apagar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. Cardápio Planejado */}
      <div className="relative rounded-3xl bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] shadow-xs overflow-hidden">
        <div className="relative h-48 sm:h-56 w-full overflow-hidden">
          <img
            src={sanitizeImageUrl(images.meal, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800')}
            alt={meal.dishName}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform hover:scale-105 duration-700"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#452414]/90 via-[#452414]/40 to-transparent" />

          <button
            onClick={onOpenImageManager}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors"
            title="Alterar link direto desta imagem no HTML"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#E8A5B8]" />
          </button>

          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-white/90 dark:bg-[#251D17]/90 backdrop-blur-md text-[10px] tracking-wider uppercase font-bold text-[#6B3F2A] dark:text-[#F2C4CE]">
              {meal.subtitle}
            </span>
          </div>

          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between text-white">
            <div>
              <h3 className="font-serif text-lg sm:text-xl font-semibold leading-tight">
                {meal.title}
              </h3>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-white/25 backdrop-blur-md font-medium">
              Leve • {meal.time}
            </span>
          </div>
        </div>

        <div className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="font-serif text-base font-semibold text-[#452414] dark:text-[#F6F1EC]">
                {meal.dishName}
              </h4>
              <p className="text-xs text-[#8C6E5E] dark:text-[#B59D8F] mt-1 leading-relaxed">
                {meal.description}
              </p>
            </div>
            <button
              onClick={() => setIsViewingRecipe(true)}
              className="p-2 rounded-full text-[#8C6E5E] hover:text-[#6B3F2A] hover:bg-[#FAF7F2] dark:hover:bg-[#2F241C] transition-colors shrink-0"
              title="Ver receita"
            >
              <Utensils className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {meal.tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-xs px-3 py-1 rounded-full font-medium bg-[#FAF7F2] dark:bg-[#2A2019] text-[#6B3F2A] dark:text-[#D8BDB0] border border-[#EBDED5] dark:border-[#3D2E24]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Recipe Modal */}
      {isViewingRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#231A14]/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#FAF7F2] dark:bg-[#1E1712] rounded-3xl border border-[#EBDED5] dark:border-[#3D2E24] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl font-semibold text-[#452414] dark:text-[#F6F1EC]">
                Receita & Preparo Afetuoso
              </h3>
              <button
                onClick={() => setIsViewingRecipe(false)}
                className="p-1 text-[#8C6E5E] hover:text-[#452414]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#6B3F2A] dark:text-[#D8BDB0] leading-relaxed">
              <strong>Preparo do Salmão:</strong> Sele o filé com uma pitada de flor de sal, azeite de alecrim e gotas de limão siciliano. Sirva com o purê aveludado de mandioquinha cozida no vapor e mix de folhas verdes frescas.
            </p>

            <div className="p-3 rounded-2xl bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] text-xs text-[#8C6E5E] dark:text-[#B59D8F] space-y-1">
              <div>• Tempo de preparo: 25 minutos</div>
              <div>• Rendimento: 2 porções afetuosas</div>
              <div>• Harmonização: Chá gelado de hibisco com rodelas de maçã</div>
            </div>

            <button
              onClick={() => setIsViewingRecipe(false)}
              className="w-full py-2.5 text-xs font-semibold text-white bg-[#6B3F2A] hover:bg-[#502916] rounded-full"
            >
              Concluído
            </button>
          </div>
        </div>
      )}

      {/* 7. Graça e Disciplina - Constância Mensal Integrada (Calendário Dinâmico) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-[0.14em] font-semibold text-[#8C6E5E] dark:text-[#B59D8F] block">
              Graça e Disciplina • Toque em qualquer dia para ver o roteiro
            </span>
            <h3 className="font-serif text-xl font-semibold text-[#452414] dark:text-[#F6F1EC]">
              Constância Mensal Integrada
            </h3>
          </div>

          <div className="text-right">
            <span className="font-serif text-2xl font-bold text-[#452414] dark:text-[#F6F1EC]">
              {completionPercentText}
            </span>
            <span className="block text-[10px] text-[#8C6E5E] dark:text-[#B59D8F]">dias completos</span>
          </div>
        </div>

        {/* Month Selector Controls */}
        <div className="flex items-center justify-between px-1 py-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 rounded-full hover:bg-[#FAF7F2] dark:hover:bg-[#2F241C] text-[#8C6E5E] hover:text-[#452414] dark:hover:text-[#F6F1EC] transition-colors"
            title="Mês anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="font-serif text-sm font-semibold text-[#452414] dark:text-[#F6F1EC]">
            {calMonthTitle}
          </span>

          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-full hover:bg-[#FAF7F2] dark:hover:bg-[#2F241C] text-[#8C6E5E] hover:text-[#452414] dark:hover:text-[#F6F1EC] transition-colors"
            title="Próximo mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-semibold text-[#8C6E5E] dark:text-[#B59D8F]">
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
            <div key={i} className="py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Interactive Month Grid */}
        <div className="grid grid-cols-7 gap-2 text-center">
          {/* Leading empty slots for proper weekday alignment */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="h-9" />
          ))}

          {/* Real days of the month */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dayDate = new Date(calYear, calMonth, dayNum);
            const dateKey = toLocalDateKey(dayDate);
            const isCurrentlySelected =
              selectedDate.getFullYear() === calYear &&
              selectedDate.getMonth() === calMonth &&
              selectedDate.getDate() === dayNum;
            const isFuture = dateKey > todayStr;
            const stats = dayStats[dateKey] || { total: 0, done: 0 };

            let statusStyle =
              'bg-[#FAF7F2] dark:bg-[#1E1712] text-[#8C6E5E] dark:text-[#B59D8F] border border-transparent hover:border-[#EBDED5] dark:hover:border-[#3D2E24]';
            let tooltipText = `Dia ${dayNum} • Sem itens`;

            if (stats.total > 0) {
              if (stats.done === 0) {
                // Pendente: contorno rosa
                statusStyle =
                  'border-2 border-[#E8A5B8] bg-white dark:bg-[#251D17] text-[#452414] dark:text-[#F6F1EC] font-medium';
                tooltipText = `Dia ${dayNum} • Pendente (0/${stats.total})`;
              } else if (stats.done > 0 && stats.done < stats.total) {
                // Parcial: preenchimento rosa suave
                statusStyle =
                  'bg-[#FDF4F5] dark:bg-[#38262B] border-2 border-[#E8A5B8] text-[#844E5F] dark:text-[#F2C4CE] font-semibold';
                tooltipText = `Dia ${dayNum} • Parcial (${stats.done}/${stats.total})`;
              } else if (stats.done === stats.total) {
                // Todos feitos
                if (isFuture) {
                  // Dias futuros: contorno se tiver itens programados
                  statusStyle =
                    'border-2 border-[#E8A5B8] bg-white dark:bg-[#251D17] text-[#452414] dark:text-[#F6F1EC] font-medium';
                  tooltipText = `Dia ${dayNum} • Programado (${stats.total} itens)`;
                } else {
                  // Completo: rosa sólido
                  statusStyle =
                    'bg-[#F2C4CE] dark:bg-[#4A2D35] text-[#452414] dark:text-[#F6F1EC] font-bold border border-[#E8A5B8]';
                  tooltipText = `Dia ${dayNum} • Completo (${stats.done}/${stats.total})`;
                }
              }
            }

            return (
              <button
                key={dayNum}
                type="button"
                onClick={() => {
                  const target = new Date(calYear, calMonth, dayNum);
                  onChangeDate(target);
                }}
                className={`h-9 flex flex-col items-center justify-center rounded-full text-xs transition-all cursor-pointer ${statusStyle} ${
                  isCurrentlySelected
                    ? 'ring-4 ring-[#844E5F]/40 dark:ring-[#E8A5B8]/50 shadow-md font-bold scale-105'
                    : ''
                }`}
                title={tooltipText}
              >
                <span>{dayNum}</span>
              </button>
            );
          })}
        </div>

        {/* Legend & Selected Day Info */}
        <div className="pt-3 border-t border-[#EBDED5] dark:border-[#3D2E24] flex flex-wrap items-center justify-between gap-2 text-xs text-[#8C6E5E] dark:text-[#B59D8F]">
          <div className="flex items-center gap-3 flex-wrap text-[11px]">
            <span className="flex items-center gap-1.5" title="Sem nenhum hábito cadastrado">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FAF7F2] dark:bg-[#1E1712] border border-[#EBDED5] dark:border-[#3D2E24]" />
              Sem itens
            </span>
            <span className="flex items-center gap-1.5" title="Itens cadastrados mas nenhum marcado">
              <span className="w-2.5 h-2.5 rounded-full bg-white dark:bg-[#251D17] border-2 border-[#E8A5B8]" />
              Pendente
            </span>
            <span className="flex items-center gap-1.5" title="Parte dos hábitos marcados">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FDF4F5] dark:bg-[#38262B] border-2 border-[#E8A5B8]" />
              Parcial
            </span>
            <span className="flex items-center gap-1.5" title="Todos os hábitos concluídos">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F2C4CE] dark:bg-[#4A2D35] border border-[#E8A5B8]" />
              Completo
            </span>
          </div>

          <span className="text-[11px] font-medium text-[#6B3F2A] dark:text-[#D8BDB0]">
            Dia Selecionado: {selectedDate.getDate()} de{' '}
            {selectedDate.toLocaleDateString('pt-BR', { month: 'short' })}
          </span>
        </div>
      </div>

      {/* Routine Default Settings Modal */}
      {isRoutineSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#231A14]/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#FAF7F2] dark:bg-[#1E1712] rounded-3xl border border-[#EBDED5] dark:border-[#3D2E24] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookmarkPlus className="w-5 h-5 text-[#844E5F] dark:text-[#E8A5B8]" />
                <h3 className="font-serif text-xl font-semibold text-[#452414] dark:text-[#F6F1EC]">
                  Roteiro Padrão
                </h3>
              </div>
              <button
                onClick={() => setIsRoutineSettingsOpen(false)}
                className="p-1 text-[#8C6E5E] hover:text-[#452414] dark:hover:text-[#F6F1EC]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#8C6E5E] dark:text-[#B59D8F] leading-relaxed">
              Você pode salvar a lista de hábitos do dia selecionado como o seu modelo padrão, ou aplicá-lo rapidamente a novos dias.
            </p>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-[#452414] dark:text-[#F6F1EC]">
                <span>Modelo Padrão Salvo:</span>
                <span className="text-[#844E5F] dark:text-[#E8A5B8]">{userDefaultRoteiro.length} hábito(s)</span>
              </div>

              {userDefaultRoteiro.length > 0 ? (
                <ul className="text-xs text-[#8C6E5E] dark:text-[#B59D8F] space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {userDefaultRoteiro.map((it, idx) => (
                    <li key={idx} className="flex items-center justify-between">
                      <span className="truncate">{it.title}</span>
                      {it.time && <span className="font-mono text-[11px] text-[#6B3F2A] dark:text-[#D8BDB0]">{it.time}</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[#8C6E5E] italic">Nenhum modelo padrão cadastrado ainda.</p>
              )}
            </div>

            {/* Auto-apply toggle */}
            {onToggleAutoApplyDefault && (
              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] cursor-pointer">
                <div>
                  <span className="text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] block">
                    Preencher automaticamente novos dias
                  </span>
                  <span className="text-[10px] text-[#8C6E5E] dark:text-[#B59D8F]">
                    Aplica seu modelo padrão ao abrir dias sem hábitos
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={autoApplyDefaultRoutine}
                  onChange={(e) => onToggleAutoApplyDefault(e.target.checked)}
                  className="w-4 h-4 rounded text-[#6B3F2A] accent-[#6B3F2A] focus:ring-0"
                />
              </label>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  handleSaveAsDefault();
                  setIsRoutineSettingsOpen(false);
                }}
                disabled={roteiro.length === 0}
                className="w-full py-2.5 text-xs font-semibold text-white bg-[#6B3F2A] hover:bg-[#502916] disabled:opacity-50 disabled:cursor-not-allowed rounded-full flex items-center justify-center gap-2 transition-colors"
              >
                <BookmarkPlus className="w-4 h-4" />
                Salvar Hábitos de Hoje ({roteiro.length}) como Padrão
              </button>

              {userDefaultRoteiro.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    handleApplyDefault();
                    setIsRoutineSettingsOpen(false);
                  }}
                  className="w-full py-2.5 text-xs font-semibold text-[#6B3F2A] dark:text-[#F6F1EC] bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] hover:bg-[#FAF7F2] rounded-full flex items-center justify-center gap-2 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Aplicar Modelo Padrão a Este Dia
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hydration Settings & Calculator Modal */}
      {isHydrationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#231A14]/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#FAF7F2] dark:bg-[#1E1712] rounded-3xl border border-[#EBDED5] dark:border-[#3D2E24] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-[#E8A5B8]" />
                <h3 className="font-serif text-xl font-semibold text-[#452414] dark:text-[#F6F1EC]">
                  Calculadora de Água & Copo
                </h3>
              </div>
              <button
                onClick={() => setIsHydrationModalOpen(false)}
                className="p-1 text-[#8C6E5E] hover:text-[#452414]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHydrationConfig} className="space-y-4">
              {/* Cup size input (1.2L user highlighted) */}
              <div>
                <label className="block text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] mb-1">
                  Capacidade do seu copo ou garrafa (em ml)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="50"
                    value={tempCupSize}
                    onChange={(e) => setTempCupSize(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] text-[#452414] dark:text-[#F6F1EC] font-mono"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8C6E5E]">
                    ml ({(tempCupSize / 1000).toFixed(1)}L)
                  </span>
                </div>
                <p className="text-[11px] text-[#8C6E5E] mt-1">
                  Ex: Copo térmico ou garrafa de <strong>1.200 ml (1,2L)</strong>
                </p>
              </div>

              {/* Weight calculator */}
              <div>
                <label className="block text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] mb-1">
                  Seu peso corporal (em kg)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={calcWeight}
                    onChange={(e) => setCalcWeight(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] text-[#452414] dark:text-[#F6F1EC] font-mono"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8C6E5E]">
                    kg
                  </span>
                </div>
              </div>

              {/* Result preview */}
              <div className="p-4 rounded-2xl bg-[#FDF4F5] dark:bg-[#2F2127] border border-[#E8A5B8]/60 text-xs space-y-1.5 text-[#6B3F2A] dark:text-[#F2C4CE]">
                <div className="font-semibold flex items-center justify-between">
                  <span>Meta diária calculada:</span>
                  <span className="font-mono text-sm">{Math.round(calcWeight * 35)} ml ({(Math.round(calcWeight * 35) / 1000).toFixed(1)}L)</span>
                </div>
                <div className="text-[11px] text-[#8C6E5E] dark:text-[#B59D8F]">
                  Fórmula: {calcWeight}kg × 35ml/kg = <strong>{Math.round(calcWeight * 35)} ml</strong>
                </div>
                <div className="text-[11px] font-semibold text-[#452414] dark:text-white pt-1">
                  👉 Isso equivale a <strong>{Math.max(1, Math.round((calcWeight * 35) / tempCupSize))} copos de {(tempCupSize / 1000).toFixed(1)}L</strong> por dia.
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsHydrationModalOpen(false)}
                  className="px-4 py-2 text-xs text-[#8C6E5E] hover:text-[#452414]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-xs font-semibold text-white bg-[#502916] hover:bg-[#6B3F2A] rounded-full"
                >
                  Salvar Configurações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal to Edit Roteiro Item */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#231A14]/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-[#FAF7F2] dark:bg-[#1E1712] rounded-3xl border border-[#EBDED5] dark:border-[#3D2E24] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-xl font-semibold text-[#452414] dark:text-[#F6F1EC]">
                  Editar Hábito do Roteiro
                </h3>
                <p className="text-xs text-[#8C6E5E] dark:text-[#B59D8F]">
                  Altere os detalhes ou exclua este hábito
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-[#8C6E5E] hover:text-[#452414] dark:hover:text-[#F6F1EC] p-1"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[#452414] dark:text-[#F6F1EC] mb-1">
                  Título do Hábito *
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Ex: Leitura dos Salmos ou Caminhada..."
                  className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] rounded-xl text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#452414] dark:text-[#F6F1EC] mb-1">
                  Subtítulo / Intenção
                </label>
                <input
                  type="text"
                  value={editSubtitle}
                  onChange={(e) => setEditSubtitle(e.target.value)}
                  placeholder="Ex: Salmos, café em silêncio e gratidão"
                  className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] rounded-xl text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-[#452414] dark:text-[#F6F1EC] mb-1">
                    Horário
                  </label>
                  <input
                    type="text"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    placeholder="Ex: 08:00"
                    className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] rounded-xl text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#452414] dark:text-[#F6F1EC] mb-1">
                    Tag / Status
                  </label>
                  <input
                    type="text"
                    value={editStatusTag}
                    onChange={(e) => setEditStatusTag(e.target.value)}
                    placeholder="Ex: Feito, Agora, Pendente"
                    className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] rounded-xl text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
                  />
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24]">
                  <input
                    type="checkbox"
                    checked={editDone}
                    onChange={(e) => setEditDone(e.target.checked)}
                    className="rounded text-[#502916] focus:ring-[#502916] w-4 h-4"
                  />
                  <span className="text-xs text-[#452414] dark:text-[#F6F1EC] font-medium">
                    Marcar hábito como concluído
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#EBDED5] dark:border-[#3D2E24]">
                <button
                  type="button"
                  onClick={() => handleDeleteItem(editingItem.id)}
                  className="px-3.5 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-[#FDF4F5] dark:hover:bg-[#382126] rounded-full flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Apagar Hábito
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="px-4 py-2 text-xs text-[#8C6E5E] hover:text-[#452414] dark:hover:text-[#F6F1EC]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-white bg-[#502916] hover:bg-[#6B3F2A] rounded-full shadow-xs"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal to Confirm Clear Day Roteiro */}
      {isConfirmingClear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#231A14]/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm bg-[#FAF7F2] dark:bg-[#1E1712] rounded-3xl border border-[#EBDED5] dark:border-[#3D2E24] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="font-serif text-lg font-semibold text-[#452414] dark:text-[#F6F1EC]">
                Apagar Roteiro do Dia?
              </h4>
              <button
                type="button"
                onClick={() => setIsConfirmingClear(false)}
                className="text-[#8C6E5E] hover:text-[#452414] dark:hover:text-[#F6F1EC]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#8C6E5E] dark:text-[#B59D8F] leading-relaxed">
              Você tem certeza que deseja apagar todos os hábitos do roteiro de {isToday ? 'hoje' : formattedDateTitle}? Você sempre poderá adicionar novos ou restaurar o modelo padrão.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmingClear(false)}
                className="px-4 py-2 text-xs font-medium text-[#8C6E5E] hover:text-[#452414] dark:hover:text-[#F6F1EC]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onClearDayRoteiro) onClearDayRoteiro();
                  setIsConfirmingClear(false);
                }}
                className="px-5 py-2 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-full shadow-xs"
              >
                Apagar Tudo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
