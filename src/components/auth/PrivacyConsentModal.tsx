import React, { useState } from 'react';
import { ShieldCheck, Heart, Lock, BookOpen, Check, RefreshCw } from 'lucide-react';
import { AALogo } from '../AALogo';

interface PrivacyConsentModalProps {
  userName?: string;
  onAcceptConsent: () => Promise<void>;
  isSubmitting: boolean;
}

export const PrivacyConsentModal: React.FC<PrivacyConsentModalProps> = ({
  userName = 'Irmã em Cristo',
  onAcceptConsent,
  isSubmitting,
}) => {
  const [hasAgreed, setHasAgreed] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAgreed) return;
    try {
      setErrorMsg(null);
      await onAcceptConsent();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao registrar consentimento.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#231A14]/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#FAF7F2] dark:bg-[#1E1712] rounded-3xl border border-[#EBDED5] dark:border-[#3D2E24] p-6 sm:p-8 space-y-5 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header with floral monogram */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="p-1 rounded-full ring-2 ring-[#E8A5B8]/30">
              <AALogo size={44} />
            </div>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-[0.16em] font-semibold text-[#8C6E5E] dark:text-[#B59D8F] block">
              Primeiro Acesso • Termos & Privacidade
            </span>
            <h2 className="font-serif text-2xl font-bold text-[#452414] dark:text-[#F6F1EC]">
              Bem-vinda ao Atelier, {userName}
            </h2>
          </div>
        </div>

        {/* Commitment Statement */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] space-y-3 text-xs leading-relaxed text-[#6B3F2A] dark:text-[#E8DDD4]">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#452414] dark:text-[#F6F1EC] block mb-0.5">
                Seus Dados são Sagrados e Privados
              </strong>
              <span>
                O Atelier foi concebido como um ambiente de recolhimento espiritual, organização do lar, metas familiares e estudos. Seus desabafos, orações e anotações diárias são armazenados em banco de dados isolado com segurança por linha (RLS) associada estritamente à sua conta Google autenticada.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 pt-2 border-t border-[#EBDED5]/60 dark:border-[#3D2E24]/60">
            <Lock className="w-5 h-5 text-[#844E5F] dark:text-[#E8A5B8] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#452414] dark:text-[#F6F1EC] block mb-0.5">
                Segurança e Direitos de Privacidade
              </strong>
              <span>
                Você mantém a posse e o controle integral de todos os seus dados. Pode exportar cópias de backup a qualquer momento e solicitar a exclusão irrevogável de sua conta e registros através do menu de perfil.
              </span>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
            {errorMsg}
          </div>
        )}

        {/* Form Agreement Checkbox */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] cursor-pointer hover:border-[#6B3F2A] transition-colors">
            <input
              type="checkbox"
              checked={hasAgreed}
              onChange={(e) => setHasAgreed(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded text-[#6B3F2A] accent-[#6B3F2A] focus:ring-0 cursor-pointer"
            />
            <span className="text-xs text-[#452414] dark:text-[#F6F1EC] leading-normal font-medium select-none">
              Li, compreendo e concordo com os termos de privacidade, consentindo com o armazenamento seguro dos meus registros pessoais no Atelier.
            </span>
          </label>

          <button
            type="submit"
            disabled={!hasAgreed || isSubmitting}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#502916] hover:bg-[#6B3F2A] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-[#E8A5B8]" />
                <span>Registrando Termos...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Confirmar e Acessar o Atelier</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
