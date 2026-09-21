import React, { useState } from 'react';
import { Lock, KeyRound, ShieldCheck, AlertCircle, Trash2, CheckCircle2, X } from 'lucide-react';
import {
  generateSalt,
  hashPin,
  verifyPin,
  savePinConfig,
  PinLockConfig,
} from '../../lib/security';

interface PinSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: PinLockConfig | null;
  onConfigUpdated: (newConfig: PinLockConfig | null) => void;
  onLockImmediately: () => void;
}

export const PinSettingsModal: React.FC<PinSettingsModalProps> = ({
  isOpen,
  onClose,
  currentConfig,
  onConfigUpdated,
  onLockImmediately,
}) => {
  const [mode, setMode] = useState<'create' | 'change' | 'remove'>(
    currentConfig?.enabled ? 'change' : 'create'
  );

  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleCreatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!/^\d{4,6}$/.test(newPin)) {
      setErrorMsg('O PIN deve conter de 4 a 6 dígitos numéricos.');
      return;
    }

    if (newPin !== confirmPin) {
      setErrorMsg('A confirmação do PIN não confere.');
      return;
    }

    try {
      setIsProcessing(true);
      const salt = generateSalt();
      const hash = await hashPin(newPin, salt);
      const config: PinLockConfig = {
        enabled: true,
        salt,
        hash,
        updatedAt: new Date().toISOString(),
      };
      savePinConfig(config);
      onConfigUpdated(config);
      setSuccessMsg('PIN ativado com sucesso!');
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setErrorMsg('Erro ao configurar PIN. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!currentConfig) return;

    if (!/^\d{4,6}$/.test(currentPin)) {
      setErrorMsg('Informe o PIN atual.');
      return;
    }

    if (!/^\d{4,6}$/.test(newPin)) {
      setErrorMsg('O novo PIN deve conter de 4 a 6 dígitos numéricos.');
      return;
    }

    if (newPin !== confirmPin) {
      setErrorMsg('A confirmação do novo PIN não confere.');
      return;
    }

    try {
      setIsProcessing(true);
      const isValid = await verifyPin(currentPin, currentConfig.salt, currentConfig.hash);
      if (!isValid) {
        setErrorMsg('PIN atual incorreto.');
        return;
      }

      const salt = generateSalt();
      const hash = await hashPin(newPin, salt);
      const config: PinLockConfig = {
        enabled: true,
        salt,
        hash,
        updatedAt: new Date().toISOString(),
      };
      savePinConfig(config);
      onConfigUpdated(config);
      setSuccessMsg('PIN alterado com sucesso!');
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setErrorMsg('Erro ao atualizar PIN.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemovePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!currentConfig) return;

    if (!/^\d{4,6}$/.test(currentPin)) {
      setErrorMsg('Informe o PIN atual para desativar.');
      return;
    }

    try {
      setIsProcessing(true);
      const isValid = await verifyPin(currentPin, currentConfig.salt, currentConfig.hash);
      if (!isValid) {
        setErrorMsg('PIN atual incorreto.');
        return;
      }

      savePinConfig(null);
      onConfigUpdated(null);
      setSuccessMsg('PIN desativado com sucesso.');
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setErrorMsg('Erro ao remover PIN.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#231A14]/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-[#FAF7F2] dark:bg-[#1E1712] rounded-3xl border border-[#EBDED5] dark:border-[#3D2E24] shadow-2xl overflow-hidden transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#EBDED5] dark:border-[#3D2E24] bg-white dark:bg-[#251D17]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FDF4F5] dark:bg-[#38262B] border border-[#E8A5B8] flex items-center justify-center text-[#B05D76]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-semibold text-[#452414] dark:text-[#F6F1EC]">
                Privacidade do Diário & Desabafos
              </h2>
              <p className="text-xs text-[#8C6E5E] dark:text-[#B59D8F]">
                Bloqueio local por PIN (4 a 6 dígitos)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#8C6E5E] hover:text-[#452414] dark:hover:text-[#F6F1EC] rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informative Disclaimer */}
        <div className="p-6 space-y-4">
          <div className="p-3.5 bg-[#F4EBE1]/60 dark:bg-[#2A2018]/60 border border-[#E8DACB] dark:border-[#4A392D] rounded-2xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#8C6E5E] dark:text-[#D1BEB0] shrink-0 mt-0.5" />
            <p className="text-xs text-[#6B5344] dark:text-[#D1BEB0] leading-relaxed">
              <strong>Aviso de Segurança:</strong> O PIN é uma proteção contra curiosos que
              peguem seu aparelho (bloqueio de tela local com hash PBKDF2), e não uma
              criptografia de banco de dados. Bloqueia automaticamente após 1 minuto de inatividade.
            </p>
          </div>

          {/* Mode Switcher */}
          {currentConfig?.enabled && (
            <div className="flex rounded-xl bg-[#EFE8DF] dark:bg-[#2A2018] p-1 gap-1">
              <button
                type="button"
                onClick={() => {
                  setMode('change');
                  setErrorMsg(null);
                }}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  mode === 'change'
                    ? 'bg-white dark:bg-[#3D2E24] text-[#452414] dark:text-[#FAF7F2] shadow-sm'
                    : 'text-[#8C6E5E] dark:text-[#B59D8F]'
                }`}
              >
                Alterar PIN
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('remove');
                  setErrorMsg(null);
                }}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  mode === 'remove'
                    ? 'bg-white dark:bg-[#3D2E24] text-[#C45E5E] dark:text-[#F2A4A4] shadow-sm'
                    : 'text-[#8C6E5E] dark:text-[#B59D8F]'
                }`}
              >
                Desativar PIN
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form Create */}
          {(!currentConfig?.enabled || mode === 'create') && (
            <form onSubmit={handleCreatePin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#6B5344] dark:text-[#D1BEB0] mb-1">
                  Criar Novo PIN (4 a 6 dígitos)
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full px-4 py-2.5 bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] rounded-xl text-center text-lg tracking-widest text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:ring-2 focus:ring-[#B05D76]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#6B5344] dark:text-[#D1BEB0] mb-1">
                  Confirmar PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full px-4 py-2.5 bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] rounded-xl text-center text-lg tracking-widest text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:ring-2 focus:ring-[#B05D76]"
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing || newPin.length < 4 || newPin !== confirmPin}
                className="w-full py-2.5 bg-[#B05D76] hover:bg-[#9B4F65] disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
              >
                {isProcessing ? 'Salvando...' : 'Ativar Proteção por PIN'}
              </button>
            </form>
          )}

          {/* Form Change */}
          {currentConfig?.enabled && mode === 'change' && (
            <form onSubmit={handleChangePin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[#6B5344] dark:text-[#D1BEB0] mb-1">
                  PIN Atual
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full px-4 py-2 bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] rounded-xl text-center text-base tracking-widest text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:ring-2 focus:ring-[#B05D76]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#6B5344] dark:text-[#D1BEB0] mb-1">
                  Novo PIN (4 a 6 dígitos)
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full px-4 py-2 bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] rounded-xl text-center text-base tracking-widest text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:ring-2 focus:ring-[#B05D76]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#6B5344] dark:text-[#D1BEB0] mb-1">
                  Confirmar Novo PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full px-4 py-2 bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] rounded-xl text-center text-base tracking-widest text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:ring-2 focus:ring-[#B05D76]"
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing || !currentPin || newPin.length < 4 || newPin !== confirmPin}
                className="w-full py-2.5 bg-[#B05D76] hover:bg-[#9B4F65] disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors shadow-sm mt-2"
              >
                {isProcessing ? 'Atualizando...' : 'Atualizar PIN'}
              </button>
            </form>
          )}

          {/* Form Remove */}
          {currentConfig?.enabled && mode === 'remove' && (
            <form onSubmit={handleRemovePin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#6B5344] dark:text-[#D1BEB0] mb-1">
                  Digite seu PIN atual para confirmar a desativação:
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full px-4 py-2.5 bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] rounded-xl text-center text-lg tracking-widest text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:ring-2 focus:ring-[#C45E5E]"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing || !currentPin}
                className="w-full py-2.5 bg-[#C45E5E] hover:bg-[#A94747] disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {isProcessing ? 'Desativando...' : 'Desativar e Remover PIN'}
              </button>
            </form>
          )}

          {currentConfig?.enabled && (
            <div className="pt-2 border-t border-[#EBDED5] dark:border-[#3D2E24] flex justify-between items-center">
              <span className="text-xs text-[#8C6E5E] dark:text-[#B59D8F]">Status: Proteção Ativa</span>
              <button
                type="button"
                onClick={() => {
                  onLockImmediately();
                  onClose();
                }}
                className="text-xs text-[#B05D76] hover:underline font-medium"
              >
                Bloquear agora
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
