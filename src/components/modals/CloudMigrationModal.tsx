import React, { useState } from 'react';
import {
  CloudUpload,
  CheckCircle2,
  AlertCircle,
  Trash2,
  ShieldCheck,
  Sparkles,
  Calendar,
  BookOpen,
  Target,
  Heart,
  Users,
  Bell,
  X,
} from 'lucide-react';
import { LocalDataSummary } from '../../lib/cloudSync';

interface CloudMigrationModalProps {
  isOpen: boolean;
  summary: LocalDataSummary;
  onMigrate: () => Promise<void>;
  onSkip: () => void;
  onClearLocalData?: () => void;
  onClearLocal?: () => void;
  onClose?: () => void;
}

export const CloudMigrationModal: React.FC<CloudMigrationModalProps> = ({
  isOpen,
  summary,
  onMigrate,
  onSkip,
  onClearLocalData,
  onClearLocal,
  onClose,
}) => {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationDone, setMigrationDone] = useState(false);
  const [cleanedLocal, setCleanedLocal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartMigration = async () => {
    try {
      setIsMigrating(true);
      setErrorMessage(null);
      await onMigrate();
      setMigrationDone(true);
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Não foi possível concluir a importação. Tente novamente.'
      );
    } finally {
      setIsMigrating(false);
    }
  };

  const handleClear = () => {
    if (onClearLocalData) onClearLocalData();
    if (onClearLocal) onClearLocal();
    setCleanedLocal(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#FAF7F2] dark:bg-[#1F1914] w-full max-w-lg rounded-2xl shadow-2xl border border-[#EADBCC] dark:border-[#3D2E24] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-br from-[#F4ECE2] to-[#FAF7F2] dark:from-[#2A211B] dark:to-[#1F1914] border-b border-[#EADBCC] dark:border-[#3D2E24] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#6B3F2A]/10 dark:bg-[#E8A5B8]/20 flex items-center justify-center text-[#6B3F2A] dark:text-[#E8A5B8]">
              {migrationDone ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <CloudUpload className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#452414] dark:text-[#F6F1EC]">
                {migrationDone ? 'Dados Salvos na Nuvem!' : 'Importar Dados deste Aparelho'}
              </h3>
              <p className="text-xs text-[#8C6E5E] dark:text-[#B59D8F]">
                {migrationDone
                  ? 'Seu santuário pessoal agora está seguro e sincronizado.'
                  : 'Encontramos registros salvos no armazenamento deste navegador.'}
              </p>
            </div>
          </div>
          {!migrationDone && !isMigrating && (
            <button
              onClick={onSkip}
              className="p-2 text-[#8C6E5E] hover:text-[#452414] dark:hover:text-[#F6F1EC] rounded-lg transition-colors"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {!migrationDone ? (
            <>
              <p className="text-sm text-[#5C3A21] dark:text-[#D1C2B8] leading-relaxed">
                Sua conta na nuvem está pronta para receber os dados locais. Deseja enviar seus
                registros para que fiquem protegidos e acessíveis em qualquer dispositivo?
              </p>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                {summary.roteirosCount > 0 && (
                  <div className="p-3 bg-white/70 dark:bg-[#282019] rounded-xl border border-[#EADBCC] dark:border-[#3D2E24] flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-[#C4788C]" />
                    <div>
                      <div className="text-sm font-bold text-[#452414] dark:text-[#F6F1EC]">
                        {summary.roteirosCount}
                      </div>
                      <div className="text-[10px] text-[#8C6E5E] dark:text-[#B59D8F]">
                        Dias de Roteiro
                      </div>
                    </div>
                  </div>
                )}

                {summary.eventsCount > 0 && (
                  <div className="p-3 bg-white/70 dark:bg-[#282019] rounded-xl border border-[#EADBCC] dark:border-[#3D2E24] flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-[#6B3F2A] dark:text-[#E8A5B8]" />
                    <div>
                      <div className="text-sm font-bold text-[#452414] dark:text-[#F6F1EC]">
                        {summary.eventsCount}
                      </div>
                      <div className="text-[10px] text-[#8C6E5E] dark:text-[#B59D8F]">
                        Compromissos
                      </div>
                    </div>
                  </div>
                )}

                {summary.noticesCount > 0 && (
                  <div className="p-3 bg-white/70 dark:bg-[#282019] rounded-xl border border-[#EADBCC] dark:border-[#3D2E24] flex items-center gap-2.5">
                    <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <div>
                      <div className="text-sm font-bold text-[#452414] dark:text-[#F6F1EC]">
                        {summary.noticesCount}
                      </div>
                      <div className="text-[10px] text-[#8C6E5E] dark:text-[#B59D8F]">
                        Lembretes
                      </div>
                    </div>
                  </div>
                )}

                {summary.journalCount > 0 && (
                  <div className="p-3 bg-white/70 dark:bg-[#282019] rounded-xl border border-[#EADBCC] dark:border-[#3D2E24] flex items-center gap-2.5">
                    <BookOpen className="w-4 h-4 text-[#8C6E5E] dark:text-[#C5B0A2]" />
                    <div>
                      <div className="text-sm font-bold text-[#452414] dark:text-[#F6F1EC]">
                        {summary.journalCount}
                      </div>
                      <div className="text-[10px] text-[#8C6E5E] dark:text-[#B59D8F]">
                        Páginas Diário
                      </div>
                    </div>
                  </div>
                )}

                {summary.goalsCount > 0 && (
                  <div className="p-3 bg-white/70 dark:bg-[#282019] rounded-xl border border-[#EADBCC] dark:border-[#3D2E24] flex items-center gap-2.5">
                    <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <div className="text-sm font-bold text-[#452414] dark:text-[#F6F1EC]">
                        {summary.goalsCount}
                      </div>
                      <div className="text-[10px] text-[#8C6E5E] dark:text-[#B59D8F]">Metas</div>
                    </div>
                  </div>
                )}

                {summary.desabafosCount > 0 && (
                  <div className="p-3 bg-white/70 dark:bg-[#282019] rounded-xl border border-[#EADBCC] dark:border-[#3D2E24] flex items-center gap-2.5">
                    <Heart className="w-4 h-4 text-[#E8A5B8]" />
                    <div>
                      <div className="text-sm font-bold text-[#452414] dark:text-[#F6F1EC]">
                        {summary.desabafosCount}
                      </div>
                      <div className="text-[10px] text-[#8C6E5E] dark:text-[#B59D8F]">
                        Desabafos
                      </div>
                    </div>
                  </div>
                )}

                {summary.peopleCount > 0 && (
                  <div className="p-3 bg-white/70 dark:bg-[#282019] rounded-xl border border-[#EADBCC] dark:border-[#3D2E24] flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-[#6B3F2A] dark:text-[#E8A5B8]" />
                    <div>
                      <div className="text-sm font-bold text-[#452414] dark:text-[#F6F1EC]">
                        {summary.peopleCount}
                      </div>
                      <div className="text-[10px] text-[#8C6E5E] dark:text-[#B59D8F]">Família</div>
                    </div>
                  </div>
                )}
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4 text-center py-2">
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/50 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <p className="text-sm text-[#5C3A21] dark:text-[#D1C2B8] max-w-sm mx-auto leading-relaxed">
                Todos os seus dados foram validados e salvos na Nuvem com sucesso. Agora a nuvem é a
                sua fonte de dados oficial.
              </p>

              <div className="p-4 bg-white/60 dark:bg-[#282019] rounded-xl border border-[#EADBCC] dark:border-[#3D2E24] text-left">
                <h4 className="text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] mb-1 flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5 text-[#8C6E5E]" />
                  Limpeza de Cache Local
                </h4>
                <p className="text-xs text-[#8C6E5E] dark:text-[#B59D8F] mb-3 leading-relaxed">
                  Para economizar espaço e evitar duplicidades locais, você pode limpar os dados
                  antigos salvos apenas neste navegador.
                </p>
                {cleanedLocal ? (
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Dados locais limpos com sucesso.
                  </span>
                ) : (
                  <button
                    onClick={handleClear}
                    className="text-xs font-medium text-[#6B3F2A] dark:text-[#E8A5B8] underline hover:opacity-80 transition-opacity"
                  >
                    Limpar dados locais deste aparelho agora
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#F4ECE2]/60 dark:bg-[#241C16] border-t border-[#EADBCC] dark:border-[#3D2E24] flex items-center justify-end gap-3">
          {!migrationDone ? (
            <>
              <button
                onClick={onSkip}
                disabled={isMigrating}
                className="px-4 py-2 text-xs font-medium text-[#8C6E5E] hover:text-[#452414] dark:text-[#B59D8F] dark:hover:text-[#F6F1EC] transition-colors disabled:opacity-50"
              >
                Ignorar
              </button>
              <button
                onClick={handleStartMigration}
                disabled={isMigrating}
                className="px-5 py-2.5 bg-[#6B3F2A] hover:bg-[#533020] text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-60"
              >
                {isMigrating ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <CloudUpload className="w-4 h-4" />
                    Importar dados deste aparelho
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              onClick={onSkip}
              className="px-5 py-2.5 bg-[#6B3F2A] hover:bg-[#533020] text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
            >
              Concluir
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
