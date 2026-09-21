import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  GraduationCap,
  Play,
  Pause,
  RotateCcw,
  BookOpen,
  CheckCircle2,
  FileText,
  Clock,
  Sparkles,
  Award,
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  CalendarPlus,
  Settings,
  Calendar,
  Layers,
  ChevronDown,
} from 'lucide-react';
import {
  AppImages,
  StudyData,
  StudyProject,
  StudyStep,
  Subject,
  SubjectExam,
  ExamTarget,
  FocusSettings,
} from '../../types';
import { soundEffects } from '../../utils/audio';
import {
  toLocalDateKey,
  getDaysDiffFromToday,
  formatDateShortBR,
  getWeekDates,
} from '../../utils/date';
import {
  EditStudyBannerModal,
  EditStudyProjectModal,
  EditStudySubjectModal,
  EditExamTargetModal,
  EditFocusSettingsModal,
} from '../modals/StudyModals';
import { EditSubjectExamsModal } from '../modals/EditSubjectExamsModal';

interface EstudosViewProps {
  images: AppImages;
  onOpenImageManager: () => void;
  studyData: StudyData;
  onUpdateStudyData: (updater: (prev: StudyData) => StudyData) => void;
  onAddEventToAgenda: (eventData: {
    title: string;
    dateStr: string;
    time?: string;
    category?: any;
    description?: string;
  }) => { added: boolean; message: string };
}

interface PomodoroTimerState {
  targetEndTime: number | null;
  remainingSeconds: number;
  isActive: boolean;
  mode: 'foco' | 'pausa' | 'pausaLonga';
  currentCycle: number;
  selectedSubjectId: string;
}

export const EstudosView: React.FC<EstudosViewProps> = ({
  images,
  onOpenImageManager,
  studyData,
  onUpdateStudyData,
  onAddEventToAgenda,
}) => {
  // -------------------------------------------------------------
  // Modals & Popups State
  // -------------------------------------------------------------
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<StudyProject | null>(null);

  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  const [isExamsModalOpen, setIsExamsModalOpen] = useState(false);
  const [activeSubjectForExams, setActiveSubjectForExams] = useState<Subject | null>(null);

  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<ExamTarget | null>(null);

  const [isFocusSettingsModalOpen, setIsFocusSettingsModalOpen] = useState(false);

  // Sorting for subjects
  const [subjectSortMode, setSubjectSortMode] = useState<'nextExam' | 'name'>('nextExam');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Step adding inline per project
  const [newStepTitles, setNewStepTitles] = useState<Record<string, string>>({});

  // -------------------------------------------------------------
  // Pomodoro Focus Timer with Absolute Timestamp Precision
  // -------------------------------------------------------------
  const focusSettings = studyData.focusSettings || {
    focusMin: 25,
    breakMin: 5,
    longBreakMin: 15,
    cyclesBeforeLong: 4,
    soundEnabled: true,
  };

  const getDurationForMode = (m: 'foco' | 'pausa' | 'pausaLonga') => {
    if (m === 'foco') return focusSettings.focusMin * 60;
    if (m === 'pausaLonga') return (focusSettings.longBreakMin || 15) * 60;
    return focusSettings.breakMin * 60;
  };

  const [timerState, setTimerState] = useState<PomodoroTimerState>(() => {
    try {
      const saved = localStorage.getItem('atelier_pomodoro_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.remainingSeconds === 'number') {
          // If was active, calculate elapsed
          if (parsed.isActive && parsed.targetEndTime) {
            const now = Date.now();
            const left = Math.max(0, Math.ceil((parsed.targetEndTime - now) / 1000));
            return {
              ...parsed,
              remainingSeconds: left,
              isActive: left > 0,
            };
          }
          return parsed;
        }
      }
    } catch (e) {
      // fallback
    }
    return {
      targetEndTime: null,
      remainingSeconds: focusSettings.focusMin * 60,
      isActive: false,
      mode: 'foco',
      currentCycle: 1,
      selectedSubjectId: '',
    };
  });

  // Save timer state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('atelier_pomodoro_state', JSON.stringify(timerState));
  }, [timerState]);

  // Timer interval with absolute Date.now() calculation
  useEffect(() => {
    let interval: any = null;

    if (timerState.isActive && timerState.targetEndTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const secondsLeft = Math.ceil((timerState.targetEndTime! - now) / 1000);

        if (secondsLeft <= 0) {
          // Timer finished!
          clearInterval(interval);

          if (timerState.mode === 'foco') {
            // Record session
            if (focusSettings.soundEnabled) {
              soundEffects.playSereneChime();
            }

            const todayKey = toLocalDateKey(new Date());
            const newSession = {
              id: crypto.randomUUID(),
              dateStr: todayKey,
              subjectId: timerState.selectedSubjectId || undefined,
              minutes: focusSettings.focusMin,
            };

            onUpdateStudyData((prev) => ({
              ...prev,
              sessions: [...(prev.sessions || []), newSession],
            }));

            showToast('Parabéns! Sessão de foco concluída com serenidade.');

            // Determine next break mode
            const cyclesBeforeLong = focusSettings.cyclesBeforeLong || 4;
            const isLongBreak = timerState.currentCycle % cyclesBeforeLong === 0;
            const nextMode = isLongBreak ? 'pausaLonga' : 'pausa';
            const nextDuration = getDurationForMode(nextMode);

            setTimerState((prev) => ({
              ...prev,
              isActive: false,
              targetEndTime: null,
              mode: nextMode,
              remainingSeconds: nextDuration,
              currentCycle: prev.currentCycle + 1,
            }));
          } else {
            // Break finished
            if (focusSettings.soundEnabled) {
              soundEffects.playSereneChime();
            }
            showToast('Pausa finalizada. Pronta para retomar o foco?');

            const nextDuration = getDurationForMode('foco');
            setTimerState((prev) => ({
              ...prev,
              isActive: false,
              targetEndTime: null,
              mode: 'foco',
              remainingSeconds: nextDuration,
            }));
          }
        } else {
          setTimerState((prev) => ({
            ...prev,
            remainingSeconds: secondsLeft,
          }));
        }
      }, 500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerState.isActive, timerState.targetEndTime, timerState.mode, focusSettings]);

  const handleStartTimer = () => {
    const target = Date.now() + timerState.remainingSeconds * 1000;
    setTimerState((prev) => ({
      ...prev,
      isActive: true,
      targetEndTime: target,
    }));
  };

  const handlePauseTimer = () => {
    const left = timerState.targetEndTime
      ? Math.max(0, Math.ceil((timerState.targetEndTime - Date.now()) / 1000))
      : timerState.remainingSeconds;

    setTimerState((prev) => ({
      ...prev,
      isActive: false,
      targetEndTime: null,
      remainingSeconds: left,
    }));
  };

  const handleResetTimer = () => {
    const duration = getDurationForMode(timerState.mode);
    setTimerState((prev) => ({
      ...prev,
      isActive: false,
      targetEndTime: null,
      remainingSeconds: duration,
    }));
  };

  const handleSwitchMode = (newMode: 'foco' | 'pausa' | 'pausaLonga') => {
    const duration = getDurationForMode(newMode);
    setTimerState((prev) => ({
      ...prev,
      isActive: false,
      targetEndTime: null,
      mode: newMode,
      remainingSeconds: duration,
    }));
  };

  const handleApplyPreset = (focoMin: number, pausaMin: number) => {
    onUpdateStudyData((prev) => ({
      ...prev,
      focusSettings: {
        ...prev.focusSettings,
        focusMin: focoMin,
        breakMin: pausaMin,
      },
    }));
    setTimerState((prev) => ({
      ...prev,
      isActive: false,
      targetEndTime: null,
      remainingSeconds: focoMin * 60,
      mode: 'foco',
    }));
    showToast(`Predefinição ${focoMin}/${pausaMin} min aplicada.`);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(Math.max(0, secs) / 60);
    const rem = Math.max(0, secs) % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  // -------------------------------------------------------------
  // Study Statistics (Today & Weekly)
  // -------------------------------------------------------------
  const todayKey = toLocalDateKey(new Date());
  const sessions = studyData.sessions || [];

  const todaySessions = useMemo(() => {
    return sessions.filter((s) => s.dateStr === todayKey);
  }, [sessions, todayKey]);

  const todayTotalMinutes = useMemo(() => {
    return todaySessions.reduce((acc, s) => acc + s.minutes, 0);
  }, [todaySessions]);

  const weekDates = useMemo(() => getWeekDates(new Date()), []);
  const weekDateSet = useMemo(() => new Set(weekDates.map((w) => w.dateStr)), [weekDates]);

  const weekSessions = useMemo(() => {
    return sessions.filter((s) => weekDateSet.has(s.dateStr));
  }, [sessions, weekDateSet]);

  const weekTotalMinutes = useMemo(() => {
    return weekSessions.reduce((acc, s) => acc + s.minutes, 0);
  }, [weekSessions]);

  const weeklyBySubject = useMemo(() => {
    const map: Record<string, number> = {};
    weekSessions.forEach((s) => {
      const key = s.subjectId || 'geral';
      map[key] = (map[key] || 0) + s.minutes;
    });
    return map;
  }, [weekSessions]);

  // -------------------------------------------------------------
  // Project (Trabalhos & Entregas) Handlers
  // -------------------------------------------------------------
  const handleSaveProject = (projectData: Omit<StudyProject, 'id' | 'steps'>) => {
    if (editingProject) {
      onUpdateStudyData((prev) => ({
        ...prev,
        projects: (prev.projects || []).map((p) =>
          p.id === editingProject.id ? { ...p, ...projectData } : p
        ),
      }));
      showToast('Trabalho atualizado com sucesso!');
    } else {
      const newProject: StudyProject = {
        id: crypto.randomUUID(),
        ...projectData,
        steps: [],
      };
      onUpdateStudyData((prev) => ({
        ...prev,
        projects: [...(prev.projects || []), newProject],
      }));
      showToast('Novo trabalho cadastrado com sucesso!');
    }
  };

  const handleDeleteProject = (projectId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este trabalho e todas as suas etapas?')) {
      onUpdateStudyData((prev) => ({
        ...prev,
        projects: (prev.projects || []).filter((p) => p.id !== projectId),
      }));
      showToast('Trabalho removido.');
    }
  };

  const handleAddStepToProject = (projectId: string) => {
    const title = (newStepTitles[projectId] || '').trim();
    if (!title) return;

    const newStep: StudyStep = {
      id: crypto.randomUUID(),
      title,
      done: false,
    };

    onUpdateStudyData((prev) => ({
      ...prev,
      projects: (prev.projects || []).map((p) =>
        p.id === projectId ? { ...p, steps: [...(p.steps || []), newStep] } : p
      ),
    }));

    setNewStepTitles((prev) => ({ ...prev, [projectId]: '' }));
  };

  const handleToggleStep = (projectId: string, stepId: string) => {
    onUpdateStudyData((prev) => ({
      ...prev,
      projects: (prev.projects || []).map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          steps: (p.steps || []).map((st) =>
            st.id === stepId ? { ...st, done: !st.done } : st
          ),
        };
      }),
    }));
  };

  const handleDeleteStep = (projectId: string, stepId: string) => {
    onUpdateStudyData((prev) => ({
      ...prev,
      projects: (prev.projects || []).map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          steps: (p.steps || []).filter((st) => st.id !== stepId),
        };
      }),
    }));
  };

  const handleReorderStep = (projectId: string, stepIndex: number, direction: 'up' | 'down') => {
    onUpdateStudyData((prev) => ({
      ...prev,
      projects: (prev.projects || []).map((p) => {
        if (p.id !== projectId) return p;
        const steps = [...(p.steps || [])];
        const targetIndex = direction === 'up' ? stepIndex - 1 : stepIndex + 1;
        if (targetIndex < 0 || targetIndex >= steps.length) return p;
        const temp = steps[stepIndex];
        steps[stepIndex] = steps[targetIndex];
        steps[targetIndex] = temp;
        return { ...p, steps };
      }),
    }));
  };

  const handleAddProjectToAgenda = (project: StudyProject) => {
    if (!project.dueDate) {
      showToast('Este trabalho não tem uma data de entrega definida.');
      return;
    }
    const res = onAddEventToAgenda({
      title: `[Entrega] ${project.title}`,
      dateStr: project.dueDate,
      time: '08:00',
      description: `Prazo final de entrega do trabalho.${project.advisor ? ` Orientação: ${project.advisor}.` : ''}`,
    });
    showToast(res.message);
  };

  // -------------------------------------------------------------
  // Subject (Disciplinas) Handlers
  // -------------------------------------------------------------
  const handleSaveSubject = (subjectData: Omit<Subject, 'id' | 'exams'>) => {
    if (editingSubject) {
      onUpdateStudyData((prev) => ({
        ...prev,
        subjects: (prev.subjects || []).map((s) =>
          s.id === editingSubject.id ? { ...s, ...subjectData } : s
        ),
      }));
      showToast('Disciplina atualizada com sucesso!');
    } else {
      const newSubject: Subject = {
        id: crypto.randomUUID(),
        ...subjectData,
        exams: [],
      };
      onUpdateStudyData((prev) => ({
        ...prev,
        subjects: [...(prev.subjects || []), newSubject],
      }));
      showToast('Disciplina cadastrada com sucesso!');
    }
  };

  const handleDeleteSubject = (subjectId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta disciplina e todas as suas provas?')) {
      onUpdateStudyData((prev) => ({
        ...prev,
        subjects: (prev.subjects || []).filter((s) => s.id !== subjectId),
      }));
      showToast('Disciplina removida.');
    }
  };

  const handleUpdateSubjectProgress = (subjectId: string, progress: number) => {
    onUpdateStudyData((prev) => ({
      ...prev,
      subjects: (prev.subjects || []).map((s) =>
        s.id === subjectId ? { ...s, studyProgress: progress } : s
      ),
    }));
  };

  const handleUpdateSubjectExams = (subjectId: string, exams: SubjectExam[]) => {
    onUpdateStudyData((prev) => ({
      ...prev,
      subjects: (prev.subjects || []).map((s) =>
        s.id === subjectId ? { ...s, exams } : s
      ),
    }));
  };

  // Sorted subjects
  const sortedSubjects = useMemo(() => {
    const subs = [...(studyData.subjects || [])];
    if (subjectSortMode === 'name') {
      return subs.sort((a, b) => a.name.localeCompare(b.name));
    }
    // Sort by next upcoming exam
    return subs.sort((a, b) => {
      const getNextExamDate = (s: Subject) => {
        const upcomingExams = (s.exams || [])
          .filter((ex) => !ex.done)
          .map((ex) => ex.date)
          .sort();
        return upcomingExams[0] || '9999-99-99';
      };
      return getNextExamDate(a).localeCompare(getNextExamDate(b));
    });
  }, [studyData.subjects, subjectSortMode]);

  // -------------------------------------------------------------
  // Exam Targets (Provas e Concursos Alvo) Handlers
  // -------------------------------------------------------------
  const handleSaveExamTarget = (targetData: Omit<ExamTarget, 'id'>) => {
    if (editingTarget) {
      onUpdateStudyData((prev) => ({
        ...prev,
        examTargets: (prev.examTargets || []).map((t) =>
          t.id === editingTarget.id ? { ...t, ...targetData } : t
        ),
      }));
      showToast('Prova alvo atualizada!');
    } else {
      const newTarget: ExamTarget = {
        id: crypto.randomUUID(),
        ...targetData,
      };
      onUpdateStudyData((prev) => ({
        ...prev,
        examTargets: [...(prev.examTargets || []), newTarget],
      }));
      showToast('Prova alvo cadastrada com sucesso!');
    }
  };

  const handleDeleteExamTarget = (targetId: string) => {
    if (window.confirm('Deseja excluir esta prova alvo?')) {
      onUpdateStudyData((prev) => ({
        ...prev,
        examTargets: (prev.examTargets || []).filter((t) => t.id !== targetId),
      }));
      showToast('Prova alvo removida.');
    }
  };

  const handleAddTargetToAgenda = (target: ExamTarget) => {
    const res = onAddEventToAgenda({
      title: `[Prova Alvo] ${target.name}`,
      dateStr: target.date,
      time: '08:00',
      description: target.notes || 'Exame ou concurso alvo cadastrado na aba Estudos.',
    });
    showToast(res.message);
  };

  // Banner details with fallbacks
  const banner = studyData.banner || {
    kicker: 'Faculdade de Direito & OAB',
    title: 'Cantinho dos Estudos & TCC',
    subtitle: 'Foco profundo, anotações de doutrina e passos constantes.',
  };

  return (
    <div className="space-y-6 pb-24 animate-fade-in max-w-xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-[#452414] dark:bg-[#FAF7F2] text-white dark:text-[#452414] text-xs font-semibold shadow-xl flex items-center gap-2 animate-fade-in border border-[#EBDED5] dark:border-[#3D2E24]">
          <CheckCircle2 className="w-4 h-4 text-[#E8A5B8] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header Banner with Direct HTML Image and Edit Controls */}
      <div className="relative rounded-3xl overflow-hidden border border-[#EBDED5] dark:border-[#3D2E24] shadow-xs h-48 bg-[#452414]">
        <img
          src={images.studyDesk}
          alt="Ambiente de Estudos e TCC"
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#452414]/95 via-[#452414]/50 to-transparent" />

        {/* Buttons top right: Edit banner info & Change Photo */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <button
            onClick={() => setIsBannerModalOpen(true)}
            className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors"
            title="Editar título e frase do banner"
          >
            <Edit2 className="w-3.5 h-3.5 text-white" />
          </button>
          <button
            onClick={onOpenImageManager}
            className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors"
            title="Alterar foto do banner"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#E8A5B8]" />
          </button>
        </div>

        <div className="absolute bottom-4 left-5 right-5 text-white">
          <span className="text-[10px] tracking-[0.14em] uppercase font-bold text-[#E8A5B8] block">
            {banner.kicker || 'Estudos & Formação'}
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold leading-tight">
            {banner.title || 'Cantinho dos Estudos'}
          </h2>
          <p className="text-xs text-white/80 mt-0.5 line-clamp-2">
            {banner.subtitle || 'Foco sereno, anotações de doutrina e passos constantes.'}
          </p>
        </div>
      </div>

      {/* 2. Pomodoro Focus Timer Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1E1712] border border-[#EBDED5] dark:border-[#3D2E24] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[#8C6E5E] dark:text-[#B59D8F] block">
              Sessão de Foco Sereno
            </span>
            <h3 className="font-serif text-lg font-semibold text-[#452414] dark:text-[#F6F1EC]">
              {timerState.mode === 'foco'
                ? `Foco Profundo (${focusSettings.focusMin}m)`
                : timerState.mode === 'pausaLonga'
                ? `Pausa Longa (${focusSettings.longBreakMin || 15}m)`
                : `Pausa Curta (${focusSettings.breakMin}m)`}
            </h3>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 p-1 rounded-full bg-[#FAF7F2] dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24]">
              <button
                onClick={() => handleSwitchMode('foco')}
                className={`px-3 py-1 text-xs rounded-full font-medium transition-all ${
                  timerState.mode === 'foco'
                    ? 'bg-[#502916] text-white shadow-xs'
                    : 'text-[#8C6E5E] dark:text-[#B59D8F] hover:text-[#452414] dark:hover:text-[#F6F1EC]'
                }`}
              >
                Foco
              </button>
              <button
                onClick={() => handleSwitchMode('pausa')}
                className={`px-3 py-1 text-xs rounded-full font-medium transition-all ${
                  timerState.mode === 'pausa'
                    ? 'bg-[#502916] text-white shadow-xs'
                    : 'text-[#8C6E5E] dark:text-[#B59D8F] hover:text-[#452414] dark:hover:text-[#F6F1EC]'
                }`}
              >
                Pausa
              </button>
            </div>

            <button
              onClick={() => setIsFocusSettingsModalOpen(true)}
              className="p-2 rounded-full bg-[#FAF7F2] dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] text-[#8C6E5E] dark:text-[#B59D8F] hover:text-[#452414] dark:hover:text-[#F6F1EC]"
              title="Ajustar tempos do pomodoro"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Subject Selector before starting */}
        <div>
          <label className="block text-[11px] font-semibold text-[#8C6E5E] dark:text-[#B59D8F] mb-1">
            Matéria em estudo nesta sessão:
          </label>
          <select
            value={timerState.selectedSubjectId}
            onChange={(e) =>
              setTimerState((prev) => ({ ...prev, selectedSubjectId: e.target.value }))
            }
            className="w-full px-3.5 py-2 text-xs bg-[#FAF7F2] dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] rounded-2xl text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
          >
            <option value="">Geral / Sem matéria específica</option>
            {(studyData.subjects || []).map((subj) => (
              <option key={subj.id} value={subj.id}>
                {subj.name} {subj.term ? `(${subj.term})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Display Timer */}
        <div className="py-2 text-center">
          <div className="font-serif text-5xl sm:text-6xl font-semibold text-[#452414] dark:text-[#F6F1EC] tracking-tight">
            {formatTime(timerState.remainingSeconds)}
          </div>
          <p className="text-xs text-[#8C6E5E] dark:text-[#B59D8F] mt-1">
            {timerState.isActive
              ? 'Concentre-se com calma; o tempo continua preciso mesmo em segundo plano.'
              : 'Clique em iniciar quando estiver pronta.'}
          </p>
        </div>

        {/* Timer Actions & Presets */}
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={timerState.isActive ? handlePauseTimer : handleStartTimer}
              className="px-8 py-3 rounded-full text-xs font-semibold text-white bg-[#502916] hover:bg-[#6B3F2A] shadow-xs flex items-center gap-2 transition-all"
            >
              {timerState.isActive ? (
                <>
                  <Pause className="w-4 h-4" />
                  Pausar Foco
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Iniciar Foco
                </>
              )}
            </button>

            <button
              onClick={handleResetTimer}
              className="p-3 rounded-full text-[#8C6E5E] dark:text-[#B59D8F] hover:text-[#452414] dark:hover:text-[#F6F1EC] bg-[#FAF7F2] dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] transition-colors"
              title="Reiniciar tempo"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Quick presets switch */}
          <div className="flex items-center justify-center gap-2 pt-1">
            <span className="text-[10px] uppercase font-semibold text-[#8C6E5E] dark:text-[#B59D8F]">
              Predefinições:
            </span>
            <button
              onClick={() => handleApplyPreset(25, 5)}
              className={`px-2.5 py-0.5 text-[11px] rounded-full border transition-all ${
                focusSettings.focusMin === 25 && focusSettings.breakMin === 5
                  ? 'bg-[#502916] text-white border-[#502916]'
                  : 'bg-[#FAF7F2] dark:bg-[#251D17] border-[#EBDED5] dark:border-[#3D2E24] text-[#8C6E5E] dark:text-[#B59D8F]'
              }`}
            >
              25 / 5m
            </button>
            <button
              onClick={() => handleApplyPreset(50, 10)}
              className={`px-2.5 py-0.5 text-[11px] rounded-full border transition-all ${
                focusSettings.focusMin === 50 && focusSettings.breakMin === 10
                  ? 'bg-[#502916] text-white border-[#502916]'
                  : 'bg-[#FAF7F2] dark:bg-[#251D17] border-[#EBDED5] dark:border-[#3D2E24] text-[#8C6E5E] dark:text-[#B59D8F]'
              }`}
            >
              50 / 10m
            </button>
          </div>
        </div>

        {/* Statistics Summary */}
        <div className="pt-3 border-t border-[#EBDED5] dark:border-[#3D2E24] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#452414] dark:text-[#F6F1EC]">
              Hoje: {todayTotalMinutes} min / {todaySessions.length} {todaySessions.length === 1 ? 'sessão' : 'sessões'}
            </span>
            <span className="text-[11px] text-[#8C6E5E] dark:text-[#B59D8F]">
              Semana: {weekTotalMinutes} min
            </span>
          </div>

          {/* Weekly breakdown by subject */}
          {Object.keys(weeklyBySubject).length > 0 && (
            <div className="p-3 rounded-2xl bg-[#FAF7F2] dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] space-y-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#8C6E5E] dark:text-[#B59D8F] block">
                Tempo de estudo por disciplina esta semana:
              </span>
              <div className="space-y-1">
                {Object.entries(weeklyBySubject).map(([subId, mins]) => {
                  const subObj = (studyData.subjects || []).find((s) => s.id === subId);
                  const subName = subObj ? subObj.name : 'Geral / Outros';
                  return (
                    <div key={subId} className="flex items-center justify-between text-xs">
                      <span className="text-[#452414] dark:text-[#F6F1EC] truncate max-w-[200px]">
                        {subName}
                      </span>
                      <span className="font-semibold text-[#6B3F2A] dark:text-[#E8DDD4]">
                        {mins} min
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Trabalhos e Entregas (Projetos / TCC) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[#8C6E5E] dark:text-[#B59D8F] block">
              Acompanhamento de Etapas
            </span>
            <h3 className="font-serif text-lg font-semibold text-[#452414] dark:text-[#F6F1EC]">
              Trabalhos e Entregas
            </h3>
          </div>
          <button
            onClick={() => {
              setEditingProject(null);
              setIsProjectModalOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-full bg-[#FAF7F2] dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] text-xs font-semibold text-[#6B3F2A] dark:text-[#E8DDD4] hover:bg-[#502916] hover:text-white transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Trabalho</span>
          </button>
        </div>

        {(studyData.projects || []).length === 0 ? (
          /* Empty State for Projects */
          <div className="p-8 rounded-3xl bg-white dark:bg-[#1E1712] border border-[#EBDED5] dark:border-[#3D2E24] text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-[#FAF7F2] dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] flex items-center justify-center mx-auto text-[#8C6E5E] dark:text-[#B59D8F]">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif text-base font-semibold text-[#452414] dark:text-[#F6F1EC]">
                Nenhum trabalho ou entrega cadastrado
              </h4>
              <p className="text-xs text-[#8C6E5E] dark:text-[#B59D8F] max-w-xs mx-auto mt-1">
                Adicione seu TCC, artigo, relatório ou projeto acadêmico para acompanhar capítulos e prazos.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingProject(null);
                setIsProjectModalOpen(true);
              }}
              className="px-5 py-2.5 rounded-full bg-[#502916] hover:bg-[#6B3F2A] text-white text-xs font-semibold shadow-xs inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Primeiro Trabalho / Projeto</span>
            </button>
          </div>
        ) : (
          /* Projects List */
          <div className="space-y-4">
            {(studyData.projects || []).map((project) => {
              const steps = project.steps || [];
              const doneCount = steps.filter((s) => s.done).length;
              const totalCount = steps.length;
              const progressPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

              // Countdown calculation
              let deadlineBadge = null;
              if (project.dueDate) {
                const diff = getDaysDiffFromToday(project.dueDate);
                if (diff < 0) {
                  deadlineBadge = (
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 font-semibold">
                      Atrasado há {Math.abs(diff)} {Math.abs(diff) === 1 ? 'dia' : 'dias'}
                    </span>
                  );
                } else if (diff === 0) {
                  deadlineBadge = (
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 font-semibold">
                      Vence hoje!
                    </span>
                  );
                } else if (diff === 1) {
                  deadlineBadge = (
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#FDF4F5] dark:bg-[#38262B] border border-[#E8A5B8] text-[#844E5F] dark:text-[#F2C4CE] font-medium">
                      Prazo: Amanhã
                    </span>
                  );
                } else {
                  deadlineBadge = (
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#FDF4F5] dark:bg-[#38262B] border border-[#E8A5B8] text-[#844E5F] dark:text-[#F2C4CE] font-medium">
                      Prazo: {formatDateShortBR(project.dueDate)} ({diff} dias)
                    </span>
                  );
                }
              }

              return (
                <div
                  key={project.id}
                  className="p-6 rounded-3xl bg-white dark:bg-[#1E1712] border border-[#EBDED5] dark:border-[#3D2E24] shadow-xs space-y-4"
                >
                  {/* Project Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {deadlineBadge}
                        {project.advisor && (
                          <span className="text-[11px] text-[#8C6E5E] dark:text-[#B59D8F]">
                            Orientação: {project.advisor}
                          </span>
                        )}
                      </div>
                      <h4 className="font-serif text-base sm:text-lg font-semibold text-[#452414] dark:text-[#F6F1EC] leading-snug">
                        {project.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {project.dueDate && (
                        <button
                          onClick={() => handleAddProjectToAgenda(project)}
                          title="Adicionar data à agenda"
                          className="p-1.5 text-[#8C6E5E] dark:text-[#B59D8F] hover:text-[#6B3F2A] dark:hover:text-[#F6F1EC] rounded-lg hover:bg-[#FAF7F2] dark:hover:bg-[#251D17]"
                        >
                          <CalendarPlus className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setEditingProject(project);
                          setIsProjectModalOpen(true);
                        }}
                        title="Editar trabalho"
                        className="p-1.5 text-[#8C6E5E] dark:text-[#B59D8F] hover:text-[#6B3F2A] dark:hover:text-[#F6F1EC] rounded-lg hover:bg-[#FAF7F2] dark:hover:bg-[#251D17]"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        title="Excluir trabalho"
                        className="p-1.5 text-[#8C6E5E] hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#8C6E5E] dark:text-[#B59D8F]">
                        Progresso do Trabalho
                      </span>
                      <span className="font-semibold text-[#452414] dark:text-[#F6F1EC]">
                        {doneCount}/{totalCount} etapas ({progressPercent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#FAF7F2] dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] overflow-hidden">
                      <div
                        className="h-full bg-[#6B3F2A] rounded-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Steps Checklist */}
                  <div className="space-y-2">
                    {steps.map((step, idx) => (
                      <div
                        key={step.id}
                        className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-[#FAF7F2] dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] hover:border-[#B88E72] transition-colors"
                      >
                        <div
                          onClick={() => handleToggleStep(project.id, step.id)}
                          className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                        >
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all ${
                              step.done
                                ? 'bg-[#6B3F2A] text-white'
                                : 'border border-[#B88E72] bg-white dark:bg-[#1E1712]'
                            }`}
                          >
                            {step.done && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </div>
                          <span
                            className={`text-xs font-medium truncate ${
                              step.done
                                ? 'line-through text-[#8C6E5E] dark:text-[#8C6E5E]'
                                : 'text-[#452414] dark:text-[#F6F1EC]'
                            }`}
                          >
                            {step.title}
                          </span>
                        </div>

                        {/* Reorder and delete step actions */}
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleReorderStep(project.id, idx, 'up')}
                            className="p-1 text-[#8C6E5E] disabled:opacity-25 hover:text-[#452414] dark:hover:text-[#F6F1EC]"
                            title="Mover para cima"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === steps.length - 1}
                            onClick={() => handleReorderStep(project.id, idx, 'down')}
                            className="p-1 text-[#8C6E5E] disabled:opacity-25 hover:text-[#452414] dark:hover:text-[#F6F1EC]"
                            title="Mover para baixo"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteStep(project.id, step.id)}
                            className="p-1 text-[#8C6E5E] hover:text-rose-600 ml-1"
                            title="Excluir etapa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Step Inline */}
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={newStepTitles[project.id] || ''}
                      onChange={(e) =>
                        setNewStepTitles((prev) => ({
                          ...prev,
                          [project.id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddStepToProject(project.id);
                        }
                      }}
                      placeholder="Adicionar nova etapa (ex.: Capítulo 3, Revisão ABNT...)"
                      maxLength={160}
                      className="flex-1 px-3.5 py-2 text-xs bg-white dark:bg-[#1E1712] border border-[#EBDED5] dark:border-[#3D2E24] rounded-2xl text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddStepToProject(project.id)}
                      disabled={!(newStepTitles[project.id] || '').trim()}
                      className="px-4 py-2 rounded-2xl bg-[#502916] hover:bg-[#6B3F2A] text-white text-xs font-semibold shadow-xs disabled:opacity-40"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Desempenho por Disciplina */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[#8C6E5E] dark:text-[#B59D8F] block">
              Matérias da Faculdade & Cursos
            </span>
            <h3 className="font-serif text-lg font-semibold text-[#452414] dark:text-[#F6F1EC]">
              Desempenho por Disciplina
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setSubjectSortMode((prev) => (prev === 'nextExam' ? 'name' : 'nextExam'))
              }
              className="px-2.5 py-1.5 rounded-full bg-[#FAF7F2] dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] text-[11px] font-medium text-[#8C6E5E] dark:text-[#B59D8F] hover:text-[#452414] dark:hover:text-[#F6F1EC]"
              title="Alternar ordenação"
            >
              {subjectSortMode === 'nextExam' ? 'Por Próxima Prova' : 'Por Nome'}
            </button>
            <button
              onClick={() => {
                setEditingSubject(null);
                setIsSubjectModalOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-full bg-[#FAF7F2] dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] text-xs font-semibold text-[#6B3F2A] dark:text-[#E8DDD4] hover:bg-[#502916] hover:text-white transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Disciplina</span>
            </button>
          </div>
        </div>

        {(studyData.subjects || []).length === 0 ? (
          /* Empty State for Subjects */
          <div className="p-8 rounded-3xl bg-white dark:bg-[#1E1712] border border-[#EBDED5] dark:border-[#3D2E24] text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-[#FAF7F2] dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] flex items-center justify-center mx-auto text-[#8C6E5E] dark:text-[#B59D8F]">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif text-base font-semibold text-[#452414] dark:text-[#F6F1EC]">
                Adicione sua primeira disciplina
              </h4>
              <p className="text-xs text-[#8C6E5E] dark:text-[#B59D8F] max-w-xs mx-auto mt-1">
                Cadastre suas matérias para gerenciar notas, faltas, datas de provas e progresso de estudo.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingSubject(null);
                setIsSubjectModalOpen(true);
              }}
              className="px-5 py-2.5 rounded-full bg-[#502916] hover:bg-[#6B3F2A] text-white text-xs font-semibold shadow-xs inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Primeira Disciplina</span>
            </button>
          </div>
        ) : (
          /* Subjects List */
          <div className="space-y-4">
            {sortedSubjects.map((subject) => {
              const exams = subject.exams || [];
              const pendingExams = exams.filter((ex) => !ex.done);
              const nextExam = pendingExams.sort((a, b) => a.date.localeCompare(b.date))[0];

              return (
                <div
                  key={subject.id}
                  className="p-6 rounded-3xl bg-white dark:bg-[#1E1712] border border-[#EBDED5] dark:border-[#3D2E24] shadow-xs space-y-4"
                >
                  {/* Subject Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        {subject.term && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FAF7F2] dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] text-[#6B3F2A] dark:text-[#D8BDB0] font-medium">
                            {subject.term}
                          </span>
                        )}
                        {subject.professor && (
                          <span className="text-[11px] text-[#8C6E5E] dark:text-[#B59D8F]">
                            Prof.: {subject.professor}
                          </span>
                        )}
                      </div>
                      <h4 className="font-serif text-base sm:text-lg font-semibold text-[#452414] dark:text-[#F6F1EC]">
                        {subject.name}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          setActiveSubjectForExams(subject);
                          setIsExamsModalOpen(true);
                        }}
                        title="Gerenciar provas da disciplina"
                        className="p-1.5 text-[#8C6E5E] dark:text-[#B59D8F] hover:text-[#6B3F2A] dark:hover:text-[#F6F1EC] rounded-lg hover:bg-[#FAF7F2] dark:hover:bg-[#251D17] flex items-center gap-1 text-xs"
                      >
                        <Calendar className="w-4 h-4" />
                        <span className="text-[11px] font-medium hidden sm:inline">Provas ({exams.length})</span>
                      </button>
                      <button
                        onClick={() => {
                          setEditingSubject(subject);
                          setIsSubjectModalOpen(true);
                        }}
                        title="Editar disciplina"
                        className="p-1.5 text-[#8C6E5E] dark:text-[#B59D8F] hover:text-[#6B3F2A] dark:hover:text-[#F6F1EC] rounded-lg hover:bg-[#FAF7F2] dark:hover:bg-[#251D17]"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSubject(subject.id)}
                        title="Excluir disciplina"
                        className="p-1.5 text-[#8C6E5E] hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Metrics Badges: Nota, Meta, Faltas, Carga */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="p-2.5 rounded-2xl bg-[#FAF7F2] dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] text-center">
                      <span className="text-[10px] text-[#8C6E5E] dark:text-[#B59D8F] block">
                        Nota Atual
                      </span>
                      <span className="font-serif text-sm font-bold text-[#452414] dark:text-[#F6F1EC]">
                        {subject.currentGrade !== undefined ? `${subject.currentGrade}` : '—'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-[#FAF7F2] dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] text-center">
                      <span className="text-[10px] text-[#8C6E5E] dark:text-[#B59D8F] block">
                        Meta de Nota
                      </span>
                      <span className="font-serif text-sm font-bold text-[#6B3F2A] dark:text-[#E8DDD4]">
                        {subject.goalGrade !== undefined ? `${subject.goalGrade}` : '—'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-[#FAF7F2] dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] text-center">
                      <span className="text-[10px] text-[#8C6E5E] dark:text-[#B59D8F] block">
                        Faltas
                      </span>
                      <span className="font-serif text-sm font-bold text-[#452414] dark:text-[#F6F1EC]">
                        {subject.absences ?? 0}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-[#FAF7F2] dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] text-center">
                      <span className="text-[10px] text-[#8C6E5E] dark:text-[#B59D8F] block">
                        Carga Horária
                      </span>
                      <span className="font-serif text-sm font-bold text-[#452414] dark:text-[#F6F1EC]">
                        {subject.workloadHours ? `${subject.workloadHours}h` : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Study Progress Slider */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#8C6E5E] dark:text-[#B59D8F]">
                        Progresso de Estudo do Conteúdo
                      </span>
                      <span className="font-semibold text-[#452414] dark:text-[#F6F1EC]">
                        {subject.studyProgress ?? 0}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={subject.studyProgress ?? 0}
                      onChange={(e) =>
                        handleUpdateSubjectProgress(subject.id, parseInt(e.target.value, 10))
                      }
                      className="w-full accent-[#6B3F2A] cursor-pointer"
                    />
                  </div>

                  {/* Upcoming Exam Preview */}
                  {nextExam ? (
                    <div className="p-3 rounded-2xl bg-[#FDF4F5] dark:bg-[#38262B] border border-[#E8A5B8] flex items-center justify-between">
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-[#844E5F] dark:text-[#F2C4CE] block">
                          Próxima Avaliação
                        </span>
                        <h5 className="text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] truncate">
                          {nextExam.title} · {formatDateShortBR(nextExam.date)}
                        </h5>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const res = onAddEventToAgenda({
                            title: `[Prova] ${subject.name} - ${nextExam.title}`,
                            dateStr: nextExam.date,
                            time: '08:00',
                            description: `Avaliação da disciplina ${subject.name}.`,
                          });
                          showToast(res.message);
                        }}
                        className="px-2.5 py-1 rounded-xl bg-white dark:bg-[#251D17] border border-[#E8A5B8] text-[11px] font-semibold text-[#844E5F] dark:text-[#F2C4CE] hover:bg-[#844E5F] hover:text-white transition-all shrink-0 flex items-center gap-1"
                      >
                        <CalendarPlus className="w-3.5 h-3.5" />
                        <span>Na Agenda</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-xs text-[#8C6E5E] dark:text-[#B59D8F] pt-1">
                      <span>Nenhuma prova pendente.</span>
                      <button
                        onClick={() => {
                          setActiveSubjectForExams(subject);
                          setIsExamsModalOpen(true);
                        }}
                        className="text-[11px] font-semibold text-[#6B3F2A] dark:text-[#E8DDD4] hover:underline"
                      >
                        + Cadastrar prova
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Bloco de Provas e Concursos Alvo (ExamTarget) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1E1712] border border-[#EBDED5] dark:border-[#3D2E24] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[#8C6E5E] dark:text-[#B59D8F] block">
              Metas & Certificações
            </span>
            <h3 className="font-serif text-lg font-semibold text-[#452414] dark:text-[#F6F1EC]">
              Provas e Concursos Alvo
            </h3>
          </div>
          <button
            onClick={() => {
              setEditingTarget(null);
              setIsTargetModalOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-full bg-[#FAF7F2] dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] text-xs font-semibold text-[#6B3F2A] dark:text-[#E8DDD4] hover:bg-[#502916] hover:text-white transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Prova Alvo</span>
          </button>
        </div>

        {(studyData.examTargets || []).length === 0 ? (
          /* Empty State for Exam Targets */
          <div className="p-6 rounded-2xl bg-[#FAF7F2] dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] text-center space-y-2">
            <Award className="w-6 h-6 text-[#E8A5B8] mx-auto" />
            <p className="text-xs text-[#8C6E5E] dark:text-[#B59D8F]">
              Nenhum concurso, prova da OAB ou exame alvo cadastrado.
            </p>
            <button
              onClick={() => {
                setEditingTarget(null);
                setIsTargetModalOpen(true);
              }}
              className="text-xs font-semibold text-[#6B3F2A] dark:text-[#E8DDD4] hover:underline"
            >
              + Adicionar Prova Alvo
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {(studyData.examTargets || []).map((target) => {
              const diff = getDaysDiffFromToday(target.date);
              let badgeClass = 'bg-[#FAF7F2] dark:bg-[#251D17] text-[#6B3F2A] dark:text-[#D8BDB0] border-[#EBDED5] dark:border-[#3D2E24]';
              let badgeText = `${formatDateShortBR(target.date)} · Faltam ${diff} dias`;

              if (diff < 0) {
                badgeText = `${formatDateShortBR(target.date)} · Realizada há ${Math.abs(diff)} dias`;
                badgeClass = 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/40';
              } else if (diff === 0) {
                badgeText = `${formatDateShortBR(target.date)} · É Hoje!`;
                badgeClass = 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/40 font-bold';
              }

              return (
                <div
                  key={target.id}
                  className="p-4 rounded-2xl border border-[#EBDED5] dark:border-[#3D2E24] hover:bg-[#FAF7F2] dark:hover:bg-[#251D17] transition-colors flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <h5 className="text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] truncate">
                      {target.name}
                    </h5>
                    {target.notes && (
                      <p className="text-[11px] text-[#8C6E5E] dark:text-[#B59D8F] truncate mt-0.5">
                        {target.notes}
                      </p>
                    )}
                    <span className={`inline-block text-[10px] px-2.5 py-0.5 rounded-full border mt-1.5 font-medium ${badgeClass}`}>
                      {badgeText}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleAddTargetToAgenda(target)}
                      title="Adicionar à Agenda"
                      className="p-1.5 text-[#8C6E5E] dark:text-[#B59D8F] hover:text-[#6B3F2A] dark:hover:text-[#F6F1EC] rounded-lg hover:bg-[#FAF7F2] dark:hover:bg-[#251D17]"
                    >
                      <CalendarPlus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingTarget(target);
                        setIsTargetModalOpen(true);
                      }}
                      title="Editar prova alvo"
                      className="p-1.5 text-[#8C6E5E] dark:text-[#B59D8F] hover:text-[#6B3F2A] dark:hover:text-[#F6F1EC] rounded-lg hover:bg-[#FAF7F2] dark:hover:bg-[#251D17]"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteExamTarget(target.id)}
                      title="Excluir prova alvo"
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

      {/* 6. Modals */}
      <EditStudyBannerModal
        isOpen={isBannerModalOpen}
        onClose={() => setIsBannerModalOpen(false)}
        banner={banner}
        onSave={(newBanner) => {
          onUpdateStudyData((prev) => ({ ...prev, banner: newBanner }));
          showToast('Banner atualizado!');
        }}
      />

      <EditStudyProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => {
          setIsProjectModalOpen(false);
          setEditingProject(null);
        }}
        project={editingProject}
        onSave={handleSaveProject}
      />

      <EditStudySubjectModal
        isOpen={isSubjectModalOpen}
        onClose={() => {
          setIsSubjectModalOpen(false);
          setEditingSubject(null);
        }}
        subject={editingSubject}
        onSave={handleSaveSubject}
      />

      {activeSubjectForExams && (
        <EditSubjectExamsModal
          isOpen={isExamsModalOpen}
          onClose={() => {
            setIsExamsModalOpen(false);
            setActiveSubjectForExams(null);
          }}
          subject={activeSubjectForExams}
          onUpdateExams={handleUpdateSubjectExams}
          onAddEventToAgenda={onAddEventToAgenda}
        />
      )}

      <EditExamTargetModal
        isOpen={isTargetModalOpen}
        onClose={() => {
          setIsTargetModalOpen(false);
          setEditingTarget(null);
        }}
        examTarget={editingTarget}
        onSave={handleSaveExamTarget}
      />

      <EditFocusSettingsModal
        isOpen={isFocusSettingsModalOpen}
        onClose={() => setIsFocusSettingsModalOpen(false)}
        settings={focusSettings}
        onSave={(newSettings) => {
          onUpdateStudyData((prev) => ({ ...prev, focusSettings: newSettings }));
          showToast('Configurações de foco salvas!');
        }}
      />
    </div>
  );
};
