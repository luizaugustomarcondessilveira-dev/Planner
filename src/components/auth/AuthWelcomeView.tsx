import React, { useState } from 'react';
import { Sparkles, ShieldCheck, Heart, AlertCircle, RefreshCw, KeyRound, ExternalLink } from 'lucide-react';
import { AALogo } from '../AALogo';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';

interface AuthWelcomeViewProps {
  onLoginWithGoogle: () => Promise<void>;
  isLoading: boolean;
  errorMessage?: string | null;
}

export const AuthWelcomeView: React.FC<AuthWelcomeViewProps> = ({
  onLoginWithGoogle,
  isLoading,
  errorMessage,
}) => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);

  const handleGoogleClick = async () => {
    try {
      setIsSigningIn(true);
      setInternalError(null);
      await onLoginWithGoogle();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao iniciar login com o Google.';
      setInternalError(msg);
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#1E1712] text-[#452414] dark:text-[#F6F1EC] flex flex-col justify-between px-4 py-8 sm:py-12 transition-colors">
      <div className="max-w-md w-full mx-auto my-auto space-y-6">
        {/* Brand Card */}
        <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] shadow-sm text-center space-y-6">
          {/* Logo Floral Monogram */}
          <div className="flex justify-center">
            <div className="p-1 rounded-full ring-4 ring-[#E8A5B8]/30 dark:ring-[#E8A5B8]/20 shadow-sm">
              <AALogo size={64} />
            </div>
          </div>

          {/* Titles & Devotional Subtitle */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-[0.22em] font-semibold text-[#8C6E5E] dark:text-[#B59D8F] block">
              Santuário Pessoal & Gestão com Propósito
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#452414] dark:text-[#F6F1EC] tracking-tight">
              Planner da Mulher
            </h1>
            <p className="text-xs sm:text-sm text-[#8C6E5E] dark:text-[#B59D8F] max-w-xs mx-auto leading-relaxed">
              Organize seus dias, honre seus compromissos e guarde seu coração em graça e paz.
            </p>
          </div>

          {/* Not Configured State */}
          {!isSupabaseConfigured ? (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-left space-y-3">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold text-xs">
                <KeyRound className="w-4 h-4 shrink-0" />
                <span>Configuração do Supabase Necessária</span>
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                Para conectar sua conta e habilitar a sincronização segura, defina as variáveis de ambiente:
              </p>
              <div className="p-2.5 rounded-xl bg-amber-100/60 dark:bg-black/30 font-mono text-[10px] text-amber-900 dark:text-amber-200 space-y-1">
                <div>VITE_SUPABASE_URL</div>
                <div>VITE_SUPABASE_ANON_KEY</div>
              </div>
              <p className="text-[10px] text-amber-600 dark:text-amber-500">
                Nunca utilize ou insira a chave secreta (service_role). Utilize apenas a chave anônima (anon).
              </p>
            </div>
          ) : (
            <>
              {/* Errors/Session notices */}
              {(errorMessage || internalError) && (
                <div className="p-3.5 rounded-2xl bg-[#FDF4F5] dark:bg-[#38262B] border border-[#E8A5B8] text-xs text-[#844E5F] dark:text-[#F2C4CE] flex items-center gap-2.5 text-left animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-[#844E5F] dark:text-[#E8A5B8]" />
                  <span className="leading-snug">{errorMessage || internalError}</span>
                </div>
              )}

              {/* Login Button with Google */}
              <div className="pt-2 space-y-3">
                <button
                  type="button"
                  onClick={handleGoogleClick}
                  disabled={isLoading || isSigningIn}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#502916] hover:bg-[#6B3F2A] active:scale-[0.99] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-3 shadow-md transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed group"
                >
                  {isLoading || isSigningIn ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-[#E8A5B8]" />
                      <span>Conectando ao Google...</span>
                    </>
                  ) : (
                    <>
                      {/* Google G SVG */}
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>Entrar com Google</span>
                    </>
                  )}
                </button>

                <p className="text-[11px] text-[#8C6E5E] dark:text-[#B59D8F] text-center leading-relaxed">
                  Acesso protegido via Supabase com autenticação Google e criptografia em trânsito.
                </p>
              </div>
            </>
          )}

          {/* Privacy & Sacred Pillars Note */}
          <div className="pt-4 border-t border-[#EBDED5]/60 dark:border-[#3D2E24]/60 grid grid-cols-2 gap-2 text-left">
            <div className="p-2.5 rounded-xl bg-[#FAF7F2] dark:bg-[#1E1712] border border-[#EBDED5]/40 dark:border-[#3D2E24]/40">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#452414] dark:text-[#F6F1EC]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Privacidade</span>
              </div>
              <p className="text-[10px] text-[#8C6E5E] dark:text-[#B59D8F] mt-0.5">
                Suas orações, diários e notas pertencem apenas a você.
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-[#FAF7F2] dark:bg-[#1E1712] border border-[#EBDED5]/40 dark:border-[#3D2E24]/40">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#452414] dark:text-[#F6F1EC]">
                <Heart className="w-3.5 h-3.5 text-[#E8A5B8]" />
                <span>Propósito</span>
              </div>
              <p className="text-[10px] text-[#8C6E5E] dark:text-[#B59D8F] mt-0.5">
                Rotina serena, família e vida espiritual integradas.
              </p>
            </div>
          </div>
        </div>

        {/* Biblical Devotional Footer */}
        <p className="text-center font-serif italic text-xs text-[#8C6E5E] dark:text-[#B59D8F]">
          «Reveste-se de força e dignidade; sorri diante do futuro.» — Provérbios 31:25
        </p>
      </div>
    </div>
  );
};
