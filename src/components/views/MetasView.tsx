import React, { useState } from 'react';
import {
  Target,
  Plus,
  CheckCircle2,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Award,
  Trash2,
  X,
} from 'lucide-react';
import { Goal, Milestone, AppImages } from '../../types';
import { soundEffects } from '../../utils/audio';
import { sanitizeImageUrl } from '../../lib/security';

interface MetasViewProps {
  goals: Goal[];
  onToggleMilestone: (goalId: string, milestoneId: string) => void;
  onAddGoal: (goal: Omit<Goal, 'id'>) => void;
  onDeleteGoal: (goalId: string) => void;
  images: AppImages;
  onOpenImageManager: () => void;
}

const CATEGORIES = [
  'Vida com Deus',
  'Casamento',
  'Estética & Bem-Estar',
  'Casa Completa',
  'Faculdade (Direito)',
  'Carro Novo',
] as const;

export const MetasView: React.FC<MetasViewProps> = ({
  goals,
  onToggleMilestone,
  onAddGoal,
  onDeleteGoal,
  images,
  onOpenImageManager,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(goals[0]?.id || null);

  // New goal modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<Goal['category']>('Vida com Deus');
  const [newTargetDate, setNewTargetDate] = useState('Dezembro 2025');
  const [newMilestonesText, setNewMilestonesText] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    soundEffects.playSereneChime();

    const rawMilestones = newMilestonesText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const generatedMilestones: Milestone[] =
      rawMilestones.length > 0
        ? rawMilestones.map((m, idx) => ({
            id: `m_${Date.now()}_${idx}`,
            title: m,
            done: false,
          }))
        : [
            { id: `m_${Date.now()}_1`, title: 'Primeiro passo prático', done: false },
            { id: `m_${Date.now()}_2`, title: 'Constância semanal', done: false },
          ];

    onAddGoal({
      title: newTitle.trim(),
      category: newCategory,
      targetDate: newTargetDate.trim() || 'Em breve',
      progressPercent: 0,
      milestones: generatedMilestones,
      notes: newNotes.trim() || undefined,
    });

    setNewTitle('');
    setNewMilestonesText('');
    setNewNotes('');
    setIsModalOpen(false);
  };

  const handleMilestoneClick = (goalId: string, milestoneId: string) => {
    soundEffects.playWaterDrop();
    onToggleMilestone(goalId, milestoneId);
  };

  const filteredGoals = goals.filter((g) => {
    if (selectedCategory === 'todos') return true;
    return g.category === selectedCategory;
  });

  const conqueredCount = goals.filter((g) => g.progressPercent === 100 || g.isConquered).length;

  return (
    <div className="space-y-6 pb-24 animate-fade-in max-w-xl mx-auto">
      {/* 1. Header Banner with image & quote */}
      <div className="relative rounded-3xl bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] shadow-xs overflow-hidden">
        <div className="relative h-44 sm:h-52 w-full overflow-hidden">
          <img
            src={sanitizeImageUrl(images.goalsQuote, 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=800')}
            alt="Metas e Propósitos"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#361E11]/90 via-[#361E11]/45 to-transparent" />

          <button
            onClick={onOpenImageManager}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors"
            title="Alterar imagem do banner de metas"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#E8A5B8]" />
          </button>

          <div className="absolute bottom-4 left-5 right-5 text-white">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] tracking-widest uppercase font-bold px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md">
                Visão de Futuro & Frutos
              </span>
              <span className="text-xs text-[#E8DDD4] font-mono">
                {conqueredCount} de {goals.length} concluídas
              </span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold leading-tight">
              Metas & Propósitos
            </h2>
            <p className="text-xs text-white/80 mt-0.5">
              Pequenos começos geram grandes colheitas
            </p>
          </div>
        </div>
      </div>

      {/* 2. Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setSelectedCategory('todos')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all ${
            selectedCategory === 'todos'
              ? 'bg-[#502916] text-white border-[#502916]'
              : 'bg-white dark:bg-[#251D17] border-[#EBDED5] dark:border-[#3D2E24] text-[#8C6E5E] dark:text-[#B59D8F]'
          }`}
        >
          Todas as Metas ({goals.length})
        </button>

        {CATEGORIES.map((cat) => {
          const count = goals.filter((g) => g.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all ${
                selectedCategory === cat
                  ? 'bg-[#FDF4F5] dark:bg-[#38262B] border-[#E8A5B8] text-[#452414] dark:text-white'
                  : 'bg-white dark:bg-[#251D17] border-[#EBDED5] dark:border-[#3D2E24] text-[#8C6E5E] dark:text-[#B59D8F]'
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* 3. New Goal Action Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full py-3.5 px-6 rounded-full bg-[#502916] hover:bg-[#6B3F2A] text-white font-medium text-sm flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.99]"
      >
        <Plus className="w-4 h-4" />
        <span>+ Nova Meta ou Propósito</span>
      </button>

      {/* 4. Goals Cards List */}
      <div className="space-y-4">
        {filteredGoals.map((goal) => {
          const isExpanded = expandedGoalId === goal.id;
          const isComplete = goal.progressPercent === 100;

          return (
            <div
              key={goal.id}
              className={`p-5 rounded-3xl bg-white dark:bg-[#251D17] border transition-all duration-200 shadow-xs space-y-3 ${
                isComplete
                  ? 'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/10'
                  : 'border-[#EBDED5] dark:border-[#3D2E24] hover:border-[#B88E72]'
              }`}
            >
              {/* Card top */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#FAF7F2] dark:bg-[#1E1712] text-[#6B3F2A] dark:text-[#D8BDB0] border border-[#EBDED5] dark:border-[#3D2E24]">
                      {goal.category}
                    </span>
                    <span className="text-xs text-[#8C6E5E] dark:text-[#B59D8F]">
                      Prazo: {goal.targetDate}
                    </span>
                  </div>

                  <h4 className="font-serif text-base font-semibold text-[#452414] dark:text-[#F6F1EC]">
                    {goal.title}
                  </h4>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-bold text-[#6B3F2A] dark:text-[#E8A5B8]">
                    {goal.progressPercent}%
                  </span>
                  <button
                    onClick={() => onDeleteGoal(goal.id)}
                    className="p-1 text-[#8C6E5E] hover:text-red-600 transition-colors"
                    title="Excluir meta"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-[#FAF7F2] dark:bg-[#1E1712] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#F2C4CE] to-[#B88E72] rounded-full transition-all duration-500"
                  style={{ width: `${goal.progressPercent}%` }}
                />
              </div>

              {/* Milestones count toggle */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-[#8C6E5E] dark:text-[#B59D8F]">
                  {goal.milestones.filter((m) => m.done).length} de {goal.milestones.length} etapas concluídas
                </span>

                <button
                  onClick={() => setExpandedGoalId(isExpanded ? null : goal.id)}
                  className="flex items-center gap-1 text-[#6B3F2A] dark:text-[#D8BDB0] font-semibold hover:underline"
                >
                  <span>{isExpanded ? 'Ocultar Etapas' : 'Ver Etapas'}</span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Expanded Milestones Checklist */}
              {isExpanded && (
                <div className="pt-2 border-t border-[#EBDED5]/60 dark:border-[#3D2E24] space-y-2 animate-fade-in">
                  {goal.milestones.map((milestone) => (
                    <div
                      key={milestone.id}
                      onClick={() => handleMilestoneClick(goal.id, milestone.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                        milestone.done
                          ? 'bg-[#FAF7F2]/60 dark:bg-[#1E1712]/60 border-[#EBDED5] text-[#8C6E5E]'
                          : 'bg-white dark:bg-[#251D17] border-[#EBDED5] dark:border-[#3D2E24] hover:border-[#B88E72] text-[#452414] dark:text-[#F6F1EC]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center transition-all ${
                            milestone.done
                              ? 'bg-[#6B3F2A] text-white'
                              : 'border border-[#B88E72] bg-white dark:bg-[#2A2019]'
                          }`}
                        >
                          {milestone.done && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                        <span className={`text-xs ${milestone.done ? 'line-through opacity-70' : 'font-medium'}`}>
                          {milestone.title}
                        </span>
                      </div>
                    </div>
                  ))}

                  {goal.notes && (
                    <div className="p-3 rounded-xl bg-[#FAF7F2] dark:bg-[#1E1712] border border-[#EBDED5]/60 dark:border-[#3D2E24] text-[11px] text-[#6B3F2A] dark:text-[#D8BDB0] italic">
                      💡 {goal.notes}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal: Nova Meta */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#231A14]/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#FAF7F2] dark:bg-[#1E1712] rounded-3xl border border-[#EBDED5] dark:border-[#3D2E24] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl font-semibold text-[#452414] dark:text-[#F6F1EC]">
                Criar Nova Meta
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-[#8C6E5E] hover:text-[#452414]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] mb-1">
                  Título do Propósito
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Leitura Bíblica Anual, Reforma da Varanda..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] rounded-xl text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] mb-1">
                    Categoria
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as Goal['category'])}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] rounded-xl text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] mb-1">
                    Prazo Desejado
                  </label>
                  <input
                    type="text"
                    value={newTargetDate}
                    onChange={(e) => setNewTargetDate(e.target.value)}
                    placeholder="Ex: Dezembro 2025"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] rounded-xl text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] mb-1">
                  Etapas Práticas (uma por linha)
                </label>
                <textarea
                  rows={3}
                  value={newMilestonesText}
                  onChange={(e) => setNewMilestonesText(e.target.value)}
                  placeholder="Ex:&#10;Comprar a Bíblia de estudos&#10;Ler 3 capítulos por dia&#10;Fazer diário devocional"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] rounded-xl text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] mb-1">
                  Notas de Inspiração / Oração
                </label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Ex: Dedicado ao Senhor para fortalecer nosso lar."
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] rounded-xl text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-[#8C6E5E] hover:text-[#452414]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-xs font-semibold text-white bg-[#502916] hover:bg-[#6B3F2A] rounded-full"
                >
                  Salvar Meta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
