import React, { useState } from 'react';
import {
  Lock,
  Heart,
  Sparkles,
  Calendar,
  Tag,
  PenTool,
  BookOpen,
  Plus,
  Trash2,
  Check,
  Search,
  Volume2,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { JournalEntry, MoodType, AppImages } from '../../types';
import { soundEffects } from '../../utils/audio';
import { sanitizeImageUrl } from '../../lib/security';

interface DiarioViewProps {
  entries: JournalEntry[];
  onAddEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt'>) => void;
  onDeleteEntry: (id: string) => void;
  images: AppImages;
  onOpenImageManager: () => void;
  isPinActive?: boolean;
  onOpenPinSettings?: () => void;
  onLockNow?: () => void;
}

const MOODS: { type: MoodType; label: string; icon: string }[] = [
  { type: 'grata', label: 'Grata', icon: '✨' },
  { type: 'paz', label: 'Em Paz', icon: '🕊️' },
  { type: 'esperanca', label: 'Esperançosa', icon: '🌿' },
  { type: 'ansiosa', label: 'Ansiosa', icon: '🌧️' },
  { type: 'cansada', label: 'Cansada', icon: '🍂' },
];

export const DiarioView: React.FC<DiarioViewProps> = ({
  entries,
  onAddEntry,
  onDeleteEntry,
  images,
  onOpenImageManager,
  isPinActive,
  onOpenPinSettings,
  onLockNow,
}) => {
  const [selectedMood, setSelectedMood] = useState<MoodType>('grata');
  const [entryTitle, setEntryTitle] = useState('');
  const [entryContent, setEntryContent] = useState('');
  const [entryTags, setEntryTags] = useState('Salmos, Gratidão, Casa');
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [saveToast, setSaveToast] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryContent.trim()) return;

    soundEffects.playSereneChime();

    const moodObj = MOODS.find((m) => m.type === selectedMood);
    const tagsArray = entryTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    onAddEntry({
      dayNumber: entries.length + 1,
      dateStr: new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
      mood: selectedMood,
      moodLabel: moodObj?.label || 'Grata',
      title: entryTitle.trim() || 'Páginas de Serenidade',
      content: entryContent.trim(),
      tags: tagsArray,
      isLocked: false,
    });

    setEntryTitle('');
    setEntryContent('');
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  const filteredEntries = entries.filter((e) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      e.title.toLowerCase().includes(q) ||
      e.content.toLowerCase().includes(q) ||
      e.moodLabel.toLowerCase().includes(q) ||
      e.tags?.some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 pb-24 animate-fade-in max-w-xl mx-auto">
      {/* 1. Top Cover Banner with image & direct link trigger */}
      <div className="relative rounded-3xl bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] shadow-xs overflow-hidden">
        <div className="relative h-44 sm:h-52 w-full overflow-hidden">
          <img
            src={sanitizeImageUrl(images.journal, 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800')}
            alt="Capa do Diário da Alma"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#381E10]/90 via-[#381E10]/40 to-transparent" />

          <div className="absolute top-3 right-3 flex items-center gap-2">
            {isPinActive && onLockNow && (
              <button
                onClick={onLockNow}
                className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors flex items-center gap-1.5 px-3 text-xs"
                title="Bloquear Diário imediatamente com PIN"
              >
                <Lock className="w-3.5 h-3.5 text-[#E8A5B8]" />
                <span className="hidden sm:inline">Bloquear</span>
              </button>
            )}
            {onOpenPinSettings && (
              <button
                onClick={onOpenPinSettings}
                className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors"
                title="Configurações do PIN de privacidade"
              >
                <KeyRound className="w-3.5 h-3.5 text-[#E8A5B8]" />
              </button>
            )}
            <button
              onClick={onOpenImageManager}
              className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors"
              title="Alterar capa do diário"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#E8A5B8]" />
            </button>
          </div>

          <div className="absolute bottom-4 left-5 right-5 text-white">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] tracking-widest uppercase font-bold px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md">
                Livro de Memórias & Devoção
              </span>
              <span className="text-xs text-[#E8DDD4] font-mono">
                {entries.length} memórias escritas
              </span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold leading-tight">
              Diário da Alma
            </h2>
            <p className="text-xs text-white/80 mt-0.5">
              Onde o coração repousa e as promessas são lembradas
            </p>
          </div>
        </div>
      </div>

      {/* 2. Formulário: Escrever Nova Memória */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PenTool className="w-4 h-4 text-[#B88E72]" />
            <h3 className="font-serif text-xl font-semibold text-[#452414] dark:text-[#F6F1EC]">
              Registrar Momento de Hoje
            </h3>
          </div>
          <span className="text-xs text-[#8C6E5E] dark:text-[#B59D8F] font-mono">
            {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
          </span>
        </div>

        {saveToast && (
          <div className="p-3 rounded-2xl bg-[#FDF4F5] dark:bg-[#38262B] border border-[#E8A5B8] text-xs text-[#844E5F] dark:text-[#F2C4CE] flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Memória guardada com carinho no seu diário.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mood selector */}
          <div>
            <label className="block text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] mb-2">
              Estado de Espírito:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {MOODS.map((mood) => {
                const isSelected = selectedMood === mood.type;
                return (
                  <button
                    key={mood.type}
                    type="button"
                    onClick={() => setSelectedMood(mood.type)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-[#F2C4CE] dark:bg-[#4A2D35] border-[#E8A5B8] text-[#452414] dark:text-white font-bold shadow-xs'
                        : 'bg-[#FAF7F2] dark:bg-[#1E1712] border-[#EBDED5] dark:border-[#3D2E24] text-[#8C6E5E] hover:border-[#B88E72]'
                    }`}
                  >
                    <span>{mood.icon}</span>
                    <span>{mood.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title input */}
          <div>
            <input
              type="text"
              value={entryTitle}
              onChange={(e) => setEntryTitle(e.target.value)}
              placeholder="Título da reflexão (ex: As misericórdias que se renovam...)"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#FAF7F2] dark:bg-[#1E1712] border border-[#EBDED5] dark:border-[#3D2E24] text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
            />
          </div>

          {/* Content */}
          <div>
            <textarea
              rows={5}
              required
              value={entryContent}
              onChange={(e) => setEntryContent(e.target.value)}
              placeholder="O que tocou o seu coração hoje? Registre orações respondidas, gratidões simples e os cuidados de Deus..."
              className="w-full p-3.5 text-xs sm:text-sm leading-relaxed rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1712] border border-[#EBDED5] dark:border-[#3D2E24] text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
            />
          </div>

          {/* Tags */}
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#8C6E5E]" />
            <input
              type="text"
              value={entryTags}
              onChange={(e) => setEntryTags(e.target.value)}
              placeholder="Tags separadas por vírgula (ex: Gratidão, Família, Estudo)"
              className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-[#FAF7F2] dark:bg-[#1E1712] border border-[#EBDED5] dark:border-[#3D2E24] text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-semibold text-white bg-[#502916] hover:bg-[#6B3F2A] rounded-full shadow-sm transition-all flex items-center gap-2 active:scale-95"
            >
              <Heart className="w-3.5 h-3.5 fill-[#E8A5B8] text-[#E8A5B8]" />
              <span>Guardar Memória</span>
            </button>
          </div>
        </form>
      </div>

      {/* 3. Lista de Memórias Anteriores com Busca */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <h4 className="font-serif text-lg font-semibold text-[#452414] dark:text-[#F6F1EC]">
            Páginas Anteriores ({filteredEntries.length})
          </h4>

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#8C6E5E] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Buscar em memórias..."
              className="pl-8 pr-3 py-1 text-xs rounded-full bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] text-[#452414] dark:text-[#F6F1EC] focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-3">
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className="p-5 rounded-3xl bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] shadow-xs space-y-3 hover:border-[#B88E72] transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-[#8C6E5E] dark:text-[#B59D8F]">
                      Dia {entry.dayNumber} • {entry.dateStr}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#FAF7F2] dark:bg-[#1E1712] text-[#6B3F2A] dark:text-[#D8BDB0] font-medium border border-[#EBDED5] dark:border-[#3D2E24]">
                      {entry.moodLabel}
                    </span>
                  </div>
                  <h5 className="font-serif text-base font-semibold text-[#452414] dark:text-[#F6F1EC] mt-1">
                    {entry.title}
                  </h5>
                </div>

                <button
                  onClick={() => onDeleteEntry(entry.id)}
                  className="p-1 text-[#8C6E5E] hover:text-red-600 transition-colors"
                  title="Excluir página"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-xs text-[#452414] dark:text-[#E8DDD4] leading-relaxed line-clamp-3">
                {entry.content}
              </p>

              {entry.tags && entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {entry.tags.map((t, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-[#FAF7F2] dark:bg-[#2A2019] text-[#8C6E5E] dark:text-[#B59D8F]"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
