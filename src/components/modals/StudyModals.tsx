import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  BookOpen,
  Calendar,
  Clock,
  Award,
  Check,
  Volume2,
  VolumeX,
  FileText,
  User,
  GraduationCap,
} from 'lucide-react';
import {
  StudyBanner,
  StudyProject,
  Subject,
  ExamTarget,
  FocusSettings,
} from '../../types';
import { toLocalDateKey } from '../../utils/date';

// -------------------------------------------------------------
// 1. Edit Banner Modal
// -------------------------------------------------------------
interface EditStudyBannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  banner: StudyBanner;
  onSave: (banner: StudyBanner) => void;
}

export const EditStudyBannerModal: React.FC<EditStudyBannerModalProps> = ({
  isOpen,
  onClose,
  banner,
  onSave,
}) => {
  const [kicker, setKicker] = useState(banner.kicker || '');
  const [title, setTitle] = useState(banner.title || '');
  const [subtitle, setSubtitle] = useState(banner.subtitle || '');

  useEffect(() => {
    if (isOpen) {
      setKicker(banner.kicker || '');
      setTitle(banner.title || '');
      setSubtitle(banner.subtitle || '');
    }
  }, [isOpen, banner]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      kicker: kicker.trim() || 'Estudos & Formação',
      title: title.trim(),
      subtitle: subtitle.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#231A14]/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-[#FAF7F2] dark:bg-[#1E1712] rounded-3xl border border-[#EBDED5] dark:border-[#3D2E24] p-6 space-y-5 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#FDF4F5] dark:bg-[#38262B] border border-[#E8A5B8] flex items-center justify-center text-[#6B3F2A] dark:text-[#F2C4CE]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-semibold text-[#452414] dark:text-[#F6F1EC]">
                Personalizar Banner
              </h3>
              <p className="text-xs text-[#8C6E5E] dark:text-[#B59D8F]">
                Ajuste o título e a descrição dos seus estudos
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] mb-1">
              Etiqueta Superior (Kicker)
            </label>
            <input
              type="text"
              value={kicker}
              onChange={(e) => setKicker(e.target.value)}
              placeholder="Ex.: Faculdade de Direito & OAB"
              maxLength={80}
              className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] rounded-2xl text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] mb-1">
              Título Principal *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Cantinho dos Estudos & TCC"
              maxLength={120}
              required
              className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] rounded-2xl text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] mb-1">
              Frase de Inspiração / Subtítulo
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Ex.: Foco sereno, anotações de doutrina e passos constantes."
              maxLength={200}
              className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] rounded-2xl text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] text-xs font-medium text-[#6B3F2A] dark:text-[#E8DDD4]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex-1 py-3 px-4 rounded-2xl bg-[#502916] hover:bg-[#6B3F2A] text-white text-xs font-semibold shadow-xs disabled:opacity-50"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 2. Edit Project Modal (Trabalhos & Entregas)
// -------------------------------------------------------------
interface EditStudyProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: StudyProject | null;
  onSave: (projectData: Omit<StudyProject, 'id' | 'steps'>) => void;
}

export const EditStudyProjectModal: React.FC<EditStudyProjectModalProps> = ({
  isOpen,
  onClose,
  project,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [advisor, setAdvisor] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (project) {
        setTitle(project.title || '');
        setAdvisor(project.advisor || '');
        setDueDate(project.dueDate || '');
      } else {
        setTitle('');
        setAdvisor('');
        setDueDate(toLocalDateKey(new Date(Date.now() + 30 * 86400000)));
      }
    }
  }, [isOpen, project]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      advisor: advisor.trim() || undefined,
      dueDate: dueDate || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#231A14]/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-[#FAF7F2] dark:bg-[#1E1712] rounded-3xl border border-[#EBDED5] dark:border-[#3D2E24] p-6 space-y-5 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#FAF7F2] dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] flex items-center justify-center text-[#6B3F2A] dark:text-[#E8DDD4]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-semibold text-[#452414] dark:text-[#F6F1EC]">
                {project ? 'Editar Trabalho / Projeto' : 'Novo Trabalho ou Entrega'}
              </h3>
              <p className="text-xs text-[#8C6E5E] dark:text-[#B59D8F]">
                TCC, artigo, relatório ou projeto acadêmico
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] mb-1">
              Título do Trabalho ou Projeto *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: TCC: Análise de Princípios Constitucionais"
              maxLength={200}
              required
              className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] rounded-2xl text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] mb-1">
              Orientador(a) / Professor(a) (Opcional)
            </label>
            <input
              type="text"
              value={advisor}
              onChange={(e) => setAdvisor(e.target.value)}
              placeholder="Ex.: Profa. Dra. Marina Silva"
              maxLength={100}
              className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] rounded-2xl text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] mb-1">
              Data de Entrega / Prazo Final
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] rounded-2xl text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] text-xs font-medium text-[#6B3F2A] dark:text-[#E8DDD4]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex-1 py-3 px-4 rounded-2xl bg-[#502916] hover:bg-[#6B3F2A] text-white text-xs font-semibold shadow-xs disabled:opacity-50"
            >
              {project ? 'Salvar Alterações' : 'Cadastrar Trabalho'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 3. Edit Subject Modal (Disciplinas)
// -------------------------------------------------------------
interface EditStudySubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject?: Subject | null;
  onSave: (subjectData: Omit<Subject, 'id' | 'exams'>) => void;
}

export const EditStudySubjectModal: React.FC<EditStudySubjectModalProps> = ({
  isOpen,
  onClose,
  subject,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [term, setTerm] = useState('');
  const [professor, setProfessor] = useState('');
  const [currentGrade, setCurrentGrade] = useState<string>('');
  const [goalGrade, setGoalGrade] = useState<string>('9.0');
  const [studyProgress, setStudyProgress] = useState<number>(0);
  const [workloadHours, setWorkloadHours] = useState<string>('');
  const [absences, setAbsences] = useState<string>('0');

  useEffect(() => {
    if (isOpen) {
      if (subject) {
        setName(subject.name || '');
        setTerm(subject.term || '');
        setProfessor(subject.professor || '');
        setCurrentGrade(subject.currentGrade !== undefined ? String(subject.currentGrade) : '');
        setGoalGrade(subject.goalGrade !== undefined ? String(subject.goalGrade) : '9.0');
        setStudyProgress(subject.studyProgress ?? 0);
        setWorkloadHours(subject.workloadHours !== undefined ? String(subject.workloadHours) : '');
        setAbsences(subject.absences !== undefined ? String(subject.absences) : '0');
      } else {
        setName('');
        setTerm('');
        setProfessor('');
        setCurrentGrade('');
        setGoalGrade('9.0');
        setStudyProgress(0);
        setWorkloadHours('60');
        setAbsences('0');
      }
    }
  }, [isOpen, subject]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedCurrentGrade = currentGrade ? Math.min(10, Math.max(0, parseFloat(currentGrade))) : undefined;
    const parsedGoalGrade = goalGrade ? Math.min(10, Math.max(0, parseFloat(goalGrade))) : undefined;
    const parsedWorkload = workloadHours ? Math.max(0, parseInt(workloadHours, 10)) : undefined;
    const parsedAbsences = absences ? Math.max(0, parseInt(absences, 10)) : 0;

    onSave({
      name: name.trim(),
      term: term.trim() || undefined,
      professor: professor.trim() || undefined,
      currentGrade: isNaN(parsedCurrentGrade as number) ? undefined : parsedCurrentGrade,
      goalGrade: isNaN(parsedGoalGrade as number) ? undefined : parsedGoalGrade,
      studyProgress: Math.min(100, Math.max(0, studyProgress)),
      workloadHours: isNaN(parsedWorkload as number) ? undefined : parsedWorkload,
      absences: isNaN(parsedAbsences) ? 0 : parsedAbsences,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#231A14]/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md max-h-[90vh] bg-[#FAF7F2] dark:bg-[#1E1712] rounded-3xl border border-[#EBDED5] dark:border-[#3D2E24] p-6 space-y-4 shadow-2xl overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#FAF7F2] dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] flex items-center justify-center text-[#6B3F2A] dark:text-[#E8DDD4]">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-semibold text-[#452414] dark:text-[#F6F1EC]">
                {subject ? 'Editar Disciplina' : 'Nova Disciplina'}
              </h3>
              <p className="text-xs text-[#8C6E5E] dark:text-[#B59D8F]">
                Notas, faltas e acompanhamento acadêmico
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

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] mb-1">
              Nome da Disciplina *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Direito Civil & Contratos"
              maxLength={200}
              required
              className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] rounded-2xl text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] mb-1">
                Semestre / Período
              </label>
              <input
                type="text"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Ex.: 7º Semestre"
                maxLength={40}
                className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] rounded-2xl text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] mb-1">
                Professor(a)
              </label>
              <input
                type="text"
                value={professor}
                onChange={(e) => setProfessor(e.target.value)}
                placeholder="Ex.: Prof. Carlos Eduardo"
                maxLength={100}
                className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] rounded-2xl text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] mb-1">
                Nota Atual (0 - 10)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={currentGrade}
                onChange={(e) => setCurrentGrade(e.target.value)}
                placeholder="Ex.: 8.5"
                className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] rounded-2xl text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] mb-1">
                Meta de Nota (0 - 10)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={goalGrade}
                onChange={(e) => setGoalGrade(e.target.value)}
                placeholder="Ex.: 9.0"
                className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] rounded-2xl text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] mb-1">
                Faltas Registradas
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={absences}
                onChange={(e) => setAbsences(e.target.value)}
                placeholder="0"
                className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] rounded-2xl text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] mb-1">
                Carga Horária (h)
              </label>
              <input
                type="number"
                min="0"
                max="400"
                value={workloadHours}
                onChange={(e) => setWorkloadHours(e.target.value)}
                placeholder="60"
                className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] rounded-2xl text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-[#452414] dark:text-[#F6F1EC]">
                Progresso de Estudo do Conteúdo: {studyProgress}%
              </label>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={studyProgress}
              onChange={(e) => setStudyProgress(parseInt(e.target.value, 10))}
              className="w-full accent-[#6B3F2A] cursor-pointer"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] text-xs font-medium text-[#6B3F2A] dark:text-[#E8DDD4]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 py-3 px-4 rounded-2xl bg-[#502916] hover:bg-[#6B3F2A] text-white text-xs font-semibold shadow-xs disabled:opacity-50"
            >
              {subject ? 'Salvar Disciplina' : 'Cadastrar Disciplina'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 4. Edit Target Exam Modal (Alvos de Prova / Concurso)
// -------------------------------------------------------------
interface EditExamTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  examTarget?: ExamTarget | null;
  onSave: (targetData: Omit<ExamTarget, 'id'>) => void;
}

export const EditExamTargetModal: React.FC<EditExamTargetModalProps> = ({
  isOpen,
  onClose,
  examTarget,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (examTarget) {
        setName(examTarget.name || '');
        setDate(examTarget.date || '');
        setNotes(examTarget.notes || '');
      } else {
        setName('');
        setDate(toLocalDateKey(new Date(Date.now() + 60 * 86400000)));
        setNotes('');
      }
    }
  }, [isOpen, examTarget]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !date) return;
    onSave({
      name: name.trim(),
      date,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#231A14]/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-[#FAF7F2] dark:bg-[#1E1712] rounded-3xl border border-[#EBDED5] dark:border-[#3D2E24] p-6 space-y-5 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#FDF4F5] dark:bg-[#38262B] border border-[#E8A5B8] flex items-center justify-center text-[#6B3F2A] dark:text-[#F2C4CE]">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-semibold text-[#452414] dark:text-[#F6F1EC]">
                {examTarget ? 'Editar Prova Alvo' : 'Nova Prova ou Concurso Alvo'}
              </h3>
              <p className="text-xs text-[#8C6E5E] dark:text-[#B59D8F]">
                OAB, concurso público, residência ou certificação
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] mb-1">
              Nome do Exame ou Concurso *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: 1ª Fase OAB · XLIII Exame Unificado"
              maxLength={200}
              required
              className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] rounded-2xl text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] mb-1">
              Data da Prova *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] rounded-2xl text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] mb-1">
              Observações / Foco Estratégico (Opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex.: Resolver 100 questões de Ética e Constitucional por semana"
              maxLength={200}
              className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] rounded-2xl text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] text-xs font-medium text-[#6B3F2A] dark:text-[#E8DDD4]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !date}
              className="flex-1 py-3 px-4 rounded-2xl bg-[#502916] hover:bg-[#6B3F2A] text-white text-xs font-semibold shadow-xs disabled:opacity-50"
            >
              {examTarget ? 'Salvar Alterações' : 'Cadastrar Prova'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 5. Edit Focus Settings Modal (Configurações do Pomodoro)
// -------------------------------------------------------------
interface EditFocusSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: FocusSettings;
  onSave: (newSettings: FocusSettings) => void;
}

export const EditFocusSettingsModal: React.FC<EditFocusSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [focusMin, setFocusMin] = useState(settings.focusMin || 25);
  const [breakMin, setBreakMin] = useState(settings.breakMin || 5);
  const [longBreakMin, setLongBreakMin] = useState(settings.longBreakMin || 15);
  const [cyclesBeforeLong, setCyclesBeforeLong] = useState(settings.cyclesBeforeLong || 4);
  const [soundEnabled, setSoundEnabled] = useState(settings.soundEnabled ?? true);

  useEffect(() => {
    if (isOpen) {
      setFocusMin(settings.focusMin || 25);
      setBreakMin(settings.breakMin || 5);
      setLongBreakMin(settings.longBreakMin || 15);
      setCyclesBeforeLong(settings.cyclesBeforeLong || 4);
      setSoundEnabled(settings.soundEnabled ?? true);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      focusMin: Math.max(1, Math.min(120, focusMin)),
      breakMin: Math.max(1, Math.min(60, breakMin)),
      longBreakMin: Math.max(1, Math.min(60, longBreakMin)),
      cyclesBeforeLong: Math.max(1, Math.min(10, cyclesBeforeLong)),
      soundEnabled,
    });
    onClose();
  };

  const applyPreset = (f: number, b: number) => {
    setFocusMin(f);
    setBreakMin(b);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#231A14]/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-[#FAF7F2] dark:bg-[#1E1712] rounded-3xl border border-[#EBDED5] dark:border-[#3D2E24] p-6 space-y-5 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#FAF7F2] dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] flex items-center justify-center text-[#6B3F2A] dark:text-[#E8DDD4]">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-semibold text-[#452414] dark:text-[#F6F1EC]">
                Configurar Foco Profundo
              </h3>
              <p className="text-xs text-[#8C6E5E] dark:text-[#B59D8F]">
                Personalize os ciclos e tempos de estudo
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

        {/* Predefinições Rápidas */}
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] block">
            Predefinições Rápidas
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => applyPreset(25, 5)}
              className={`flex-1 py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                focusMin === 25 && breakMin === 5
                  ? 'bg-[#502916] text-white border-[#502916]'
                  : 'bg-white dark:bg-[#251D17] border-[#EBDED5] dark:border-[#3D2E24] text-[#452414] dark:text-[#F6F1EC]'
              }`}
            >
              25m Foco / 5m Pausa
            </button>
            <button
              type="button"
              onClick={() => applyPreset(50, 10)}
              className={`flex-1 py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                focusMin === 50 && breakMin === 10
                  ? 'bg-[#502916] text-white border-[#502916]'
                  : 'bg-white dark:bg-[#251D17] border-[#EBDED5] dark:border-[#3D2E24] text-[#452414] dark:text-[#F6F1EC]'
              }`}
            >
              50m Foco / 10m Pausa
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] mb-1">
                Foco (minutos)
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={focusMin}
                onChange={(e) => setFocusMin(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] rounded-2xl text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] mb-1">
                Pausa Curta (minutos)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={breakMin}
                onChange={(e) => setBreakMin(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] rounded-2xl text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] mb-1">
                Pausa Longa (minutos)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={longBreakMin}
                onChange={(e) => setLongBreakMin(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] rounded-2xl text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] mb-1">
                Ciclos até Pausa Longa
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={cyclesBeforeLong}
                onChange={(e) => setCyclesBeforeLong(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] rounded-2xl text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] flex items-center justify-between">
            <div className="flex items-center gap-2">
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-[#6B3F2A] dark:text-[#F2C4CE]" />
              ) : (
                <VolumeX className="w-4 h-4 text-[#8C6E5E]" />
              )}
              <div>
                <span className="text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] block">
                  Sinal Sonoro Suave ao Concluir
                </span>
                <span className="text-[11px] text-[#8C6E5E] dark:text-[#B59D8F]">
                  Toca um carrilhão sereno ao finalizar cada ciclo
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
              className="w-4 h-4 accent-[#6B3F2A] rounded cursor-pointer"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] text-xs font-medium text-[#6B3F2A] dark:text-[#E8DDD4]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-2xl bg-[#502916] hover:bg-[#6B3F2A] text-white text-xs font-semibold shadow-xs"
            >
              Salvar Ajustes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
