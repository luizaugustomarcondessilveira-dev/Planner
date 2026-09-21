import React, { useState, useEffect } from 'react';
import { Lock, ShieldAlert, KeyRound, AlertTriangle, Delete, ArrowRight } from 'lucide-react';
import { verifyPin, PinLockConfig } from '../../lib/security';

interface PinLockScreenProps {
  pinConfig: PinLockConfig;
  onUnlock: () => void;
  onOpenSettings?: () => void;
}

export const PinLockScreen: React.FC<PinLockScreenProps> = ({
  pinConfig,
  onUnlock,
  onOpenSettings,
}) => {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  const handleKeypadPress = (digit: string) => {
    if (lockoutSeconds > 0 || isVerifying) return;
    if (pin.length < 6) {
      setPin((prev) => prev + digit);
      setErrorMsg(null);
    }
  };

  const handleBackspace = () => {
    if (lockoutSeconds > 0 || isVerifying) return;
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const handleClear = () => {
    if (lockoutSeconds > 0 || isVerifying) return;
    setPin('');
    setErrorMsg(null);
  };

  const handleVerify = async (pinToVerify = pin) => {
    if (lockoutSeconds > 0 || isVerifying) return;
    if (pinToVerify.length < 4) {
      setErrorMsg('Digite ao menos 4 dígitos.');
      return;
    }

    try {
      setIsVerifying(true);
      setErrorMsg(null);
      const isValid = await verifyPin(pinToVerify, pinConfig.salt, pinConfig.hash);

      if (isValid) {
        setFailedAttempts(0);
        setPin('');
        onUnlock();
      } else {
        const nextFailed = failedAttempts + 1;
        setFailedAttempts(nextFailed);
        setPin('');

        if (nextFailed >= 5) {
          setLockoutSeconds(30);
          setErrorMsg('Muitas tentativas incorretas. Aguarde 30 segundos.');
        } else {
          const remaining = 5 - nextFailed;
          setErrorMsg(`PIN incorreto. (${remaining} tentativa${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''})`);
        }
      }
    } catch {
      setErrorMsg('Erro ao verificar PIN. Tente novamente.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (lockoutSeconds > 0 || isVerifying) return;
    if (e.key >= '0' && e.key <= '9') {
      handleKeypadPress(e.key);
    } else if (e.key === 'Backspace') {
      handleBackspace();
    } else if (e.key === 'Enter') {
      handleVerify();
    }
  };

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="outline-none flex flex-col items-center justify-center min-h-[68vh] p-6 text-center animate-fade-in"
    >
      <div className="w-full max-w-sm bg-white dark:bg-[#1E1712] rounded-3xl border border-[#EBDED5] dark:border-[#3D2E24] shadow-xl p-8 transition-colors">
        {/* Lock Icon */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-[#FDF4F5] dark:bg-[#38262B] border border-[#E8A5B8] flex items-center justify-center text-[#B05D76] shadow-sm">
          <Lock className="w-8 h-8 animate-pulse" />
        </div>

        <h2 className="font-serif text-2xl font-semibold text-[#452414] dark:text-[#F6F1EC] mb-1">
          Área Protegida
        </h2>
        <p className="text-xs text-[#8C6E5E] dark:text-[#B59D8F] mb-6">
          Diário & Desabafos bloqueados por PIN local
        </p>

        {/* PIN Indicators */}
        <div className="flex justify-center items-center gap-3 mb-6">
          {[0, 1, 2, 3, 4, 5].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full transition-all duration-200 border ${
                idx < pin.length
                  ? 'bg-[#B05D76] border-[#B05D76] scale-110 shadow-sm'
                  : 'bg-[#FAF7F2] dark:bg-[#2A2018] border-[#D9C8BC] dark:border-[#4D3B2F]'
              }`}
            />
          ))}
        </div>

        {/* Error or Lockout Message */}
        {lockoutSeconds > 0 ? (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl flex items-center justify-center gap-2 text-xs text-red-600 dark:text-red-400">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Bloqueado temporariamente por {lockoutSeconds}s</span>
          </div>
        ) : errorMsg ? (
          <div className="mb-4 p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-600 dark:text-red-400">
            {errorMsg}
          </div>
        ) : null}

        {/* Number Pad */}
        <div className="grid grid-cols-3 gap-3 mb-6 max-w-[260px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              disabled={lockoutSeconds > 0 || isVerifying}
              onClick={() => handleKeypadPress(digit)}
              className="h-12 rounded-2xl bg-[#FAF7F2] dark:bg-[#2A2018] hover:bg-[#F2E8DC] dark:hover:bg-[#3D2E24] active:scale-95 text-[#452414] dark:text-[#F6F1EC] text-lg font-medium border border-[#EBDED5] dark:border-[#3D2E24] transition-all disabled:opacity-40"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            disabled={lockoutSeconds > 0 || isVerifying || pin.length === 0}
            onClick={handleClear}
            className="h-12 rounded-2xl bg-transparent hover:bg-[#FAF7F2] dark:hover:bg-[#2A2018] text-[#8C6E5E] text-xs font-medium transition-all disabled:opacity-30"
          >
            Limpar
          </button>
          <button
            type="button"
            disabled={lockoutSeconds > 0 || isVerifying}
            onClick={() => handleKeypadPress('0')}
            className="h-12 rounded-2xl bg-[#FAF7F2] dark:bg-[#2A2018] hover:bg-[#F2E8DC] dark:hover:bg-[#3D2E24] active:scale-95 text-[#452414] dark:text-[#F6F1EC] text-lg font-medium border border-[#EBDED5] dark:border-[#3D2E24] transition-all disabled:opacity-40"
          >
            0
          </button>
          <button
            type="button"
            disabled={lockoutSeconds > 0 || isVerifying || pin.length === 0}
            onClick={handleBackspace}
            className="h-12 rounded-2xl bg-transparent hover:bg-[#FAF7F2] dark:hover:bg-[#2A2018] text-[#8C6E5E] flex items-center justify-center transition-all disabled:opacity-30"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Action Button */}
        <button
          type="button"
          disabled={lockoutSeconds > 0 || isVerifying || pin.length < 4}
          onClick={() => handleVerify()}
          className="w-full py-3 bg-[#B05D76] hover:bg-[#9B4F65] disabled:opacity-40 text-white rounded-2xl text-sm font-medium transition-all shadow-md flex items-center justify-center gap-2"
        >
          {isVerifying ? (
            'Desbloqueando...'
          ) : (
            <>
              Desbloquear <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Clarification Note */}
        <div className="mt-6 pt-4 border-t border-[#EBDED5] dark:border-[#3D2E24]">
          <p className="text-[11px] text-[#8C6E5E] dark:text-[#A89283] leading-relaxed">
            Proteção contra curiosos no aparelho (bloqueio de tela local), não criptografia de
            banco de dados. Bloqueia após 1 min de inatividade.
          </p>
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="mt-2 text-xs text-[#B05D76] hover:underline inline-flex items-center gap-1 font-medium"
            >
              <KeyRound className="w-3.5 h-3.5" /> Gerenciar PIN
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
