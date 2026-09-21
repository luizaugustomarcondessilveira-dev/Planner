import React, { useState } from 'react';
import {
  X,
  Calendar,
  Plus,
  Trash2,
  CheckCircle2,
  CalendarPlus,
  Award,
} from 'lucide-react';
import { Subject, SubjectExam } from '../../types';
import { toLocalDateKey, getDaysDiffFromToday, formatDateShortBR } from '../../utils/date';

interface EditSubjectExamsModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: Subject;
  onUpdateExams: (subjectId: string, exams: SubjectExam[]) => void;
  onAddEventToAgenda: (eventData: {
    title: string;
    dateStr: string;
    time?: string;
    description?: string;
  }) => { added: boolean; message: string };
}

export const EditSubjectExamsModal: React.FC<EditSubjectExamsModalProps> = ({
  isOpen,
  onClose,
  subject,
  onUpdateExams,
  onAddEventToAgenda,
}) => {
  const [exams, setExams] = useState<SubjectExam[]>(subject.exams || []);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(toLocalDateKey(new Date(Date.now() + 14 * 86400000)));
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setExams(subject.exams || []);
      setNewTitle('');
      setNewDate(toLocalDateKey(new Date(Date.now() + 14 * 86400000)));
      setToastMessage(null);
    }
  }, [isOpen, subject]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleAddExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate) return;
    const newExam: SubjectExam = {
      id: crypto.randomUUID(),
      title: newTitle.trim(),
      date: newDate,
      done: false,
    };
    const updated = [...exams, newExam];
    setExams(updated);
    onUpdateExams(subject.id, updated);
    setNewTitle('');
  };

  const handleToggleDone = (examId: string) => {
    const updated = exams.map((ex) =>
      ex.id === examId ? { ...ex, done: !ex.done } : ex
    );
    setExams(updated);
    onUpdateExams(subject.id, updated);
  };

  const handleDeleteExam = (examId: string) => {
    const updated = exams.filter((ex) => ex.id !== examId);
    setExams(updated);
    onUpdateExams(subject.id, updated);
  };

  const handleAddToAgenda = (exam: SubjectExam) => {
    const res = onAddEventToAgenda({
      title: `[Prova] ${subject.name} - ${exam.title}`,
      dateStr: exam.date,
      time: '08:00',
      description: `Avaliação da disciplina ${subject.name}${subject.professor ? ` (${subject.professor})` : ''}.`,
    });
    showToast(res.message);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#231A14]/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md max-h-[90vh] bg-[#FAF7F2] dark:bg-[#1E1712] rounded-3xl border border-[#EBDED5] dark:border-[#3D2E24] p-6 space-y-4 shadow-2xl overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#FAF7F2] dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] flex items-center justify-center text-[#6B3F2A] dark:text-[#E8DDD4]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-semibold text-[#452414] dark:text-[#F6F1EC]">
                Provas & Avaliações
              </h3>
              <p className="text-xs text-[#8C6E5E] dark:text-[#B59D8F]">
                {subject.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8C6E5E] hover:text-[#452414] dark:hover:text-[#F6F1EC] rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {toastMessage && (
          <div className="p-2.5 rounded-2xl bg-[#502916] text-white text-xs text-center font-medium animate-fade-in">
            {toastMessage}
          </div>
        )}

        {/* Add Exam Form */}
        <form onSubmit={handleAddExam} className="p-3.5 rounded-2xl bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] space-y-3">
          <span className="text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] block">
            Adicionar Nova Prova ou Trabalho
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Ex.: P1 · Teoria Geral"
              maxLength={100}
              required
              className="w-full px-3 py-2 text-xs bg-[#FAF7F2] dark:bg-[#1E1712] border border-[#EBDED5] dark:border-[#3D2E24] rounded-xl text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
            />
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs bg-[#FAF7F2] dark:bg-[#1E1712] border border-[#EBDED5] dark:border-[#3D2E24] rounded-xl text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
            />
          </div>
          <button
            type="submit"
            disabled={!newTitle.trim() || !newDate}
            className="w-full py-2.5 rounded-xl bg-[#502916] hover:bg-[#6B3F2A] text-white text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Prova</span>
          </button>
        </form>

        {/* Exams List */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-[#8C6E5E] dark:text-[#B59D8F] block">
            Provas Cadastradas ({exams.length})
          </span>

          {exams.length === 0 ? (
            <div className="p-4 rounded-2xl bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] text-center text-xs text-[#8C6E5E] dark:text-[#B59D8F]">
              Nenhuma avaliação cadastrada para esta disciplina.
            </div>
          ) : (
            <div className="space-y-2">
              {exams.map((exam) => {
                const diff = getDaysDiffFromToday(exam.date);
                let badgeClass = 'bg-[#FAF7F2] dark:bg-[#251D17] text-[#6B3F2A] dark:text-[#D8BDB0] border-[#EBDED5] dark:border-[#3D2E24]';
                let badgeText = `${formatDateShortBR(exam.date)} · Faltam ${diff}d`;
                if (exam.done) {
                  badgeText = `${formatDateShortBR(exam.date)} · Concluída`;
                  badgeClass = 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40';
                } else if (diff < 0) {
                  badgeText = `${formatDateShortBR(exam.date)} · Atrasada (${Math.abs(diff)}d)`;
                  badgeClass = 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/40';
                } else if (diff === 0) {
                  badgeText = `${formatDateShortBR(exam.date)} · Hoje!`;
                  badgeClass = 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/40';
                }

                return (
                  <div
                    key={exam.id}
                    className="p-3 rounded-2xl bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleToggleDone(exam.id)}
                        className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all ${
                          exam.done
                            ? 'bg-[#6B3F2A] text-white'
                            : 'border border-[#B88E72] bg-[#FAF7F2] dark:bg-[#1E1712]'
                        }`}
                      >
                        {exam.done && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>
                      <div className="min-w-0">
                        <h5
                          className={`text-xs font-semibold truncate ${
                            exam.done
                              ? 'line-through text-[#8C6E5E] dark:text-[#8C6E5E]'
                              : 'text-[#452414] dark:text-[#F6F1EC]'
                          }`}
                        >
                          {exam.title}
                        </h5>
                        <span
                          className={`inline-block text-[10px] px-2 py-0.5 mt-0.5 rounded-full border ${badgeClass}`}
                        >
                          {badgeText}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleAddToAgenda(exam)}
                        title="Adicionar à Agenda"
                        className="p-1.5 text-[#8C6E5E] hover:text-[#6B3F2A] dark:hover:text-[#F6F1EC] rounded-lg hover:bg-[#FAF7F2] dark:hover:bg-[#1E1712]"
                      >
                        <CalendarPlus className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteExam(exam.id)}
                        title="Excluir Prova"
                        className="p-1.5 text-[#8C6E5E] hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 px-4 rounded-2xl bg-[#502916] hover:bg-[#6B3F2A] text-white text-xs font-semibold shadow-xs"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
