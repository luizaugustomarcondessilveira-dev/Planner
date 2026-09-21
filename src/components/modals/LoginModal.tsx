import React, { useState } from 'react';
import {
  X,
  Mail,
  Cloud,
  Check,
  Download,
  Upload,
  ShieldCheck,
  LogOut,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { UserSession } from '../../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  userSession: UserSession;
  onLogin: (email: string, name: string) => void;
  onLogout: () => void;
  onManualSync: () => void;
  onExportData: () => void;
  onImportData: (jsonStr: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  userSession,
  onLogin,
  onLogout,
  onManualSync,
  onExportData,
  onImportData,
}) => {
  const [emailInput, setEmailInput] = useState(userSession.email || '');
  const [nameInput, setNameInput] = useState(userSession.name || 'Helena');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    onLogin(emailInput.trim(), nameInput.trim() || 'Helena');
    setSyncNotice('Login realizado e progresso salvo com sucesso!');
    setTimeout(() => {
      setSyncNotice(null);
      onClose();
    }, 1200);
  };

  const handleSyncNow = () => {
    setIsSyncing(true);
    onManualSync();
    setTimeout(() => {
      setIsSyncing(false);
      setSyncNotice('Todos os dados foram sincronizados e salvos com segurança.');
      setTimeout(() => setSyncNotice(null), 3000);
    }, 800);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        onImportData(text);
        setSyncNotice('Backup restaurado com sucesso!');
        setTimeout(() => setSyncNotice(null), 3000);
      } catch (err) {
        alert('Arquivo de backup inválido.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#231A14]/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-[#FAF7F2] dark:bg-[#1E1712] rounded-3xl border border-[#EBDED5] dark:border-[#3D2E24] p-6 space-y-5 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#FDF4F5] dark:bg-[#38262B] border border-[#E8A5B8] flex items-center justify-center text-[#6B3F2A] dark:text-[#F2C4CE]">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-semibold text-[#452414] dark:text-[#F6F1EC]">
                {userSession.isLoggedIn ? 'Conta & Armazenamento Local' : 'Entrar com seu E-mail'}
              </h3>
              <p className="text-xs text-[#8C6E5E] dark:text-[#B59D8F]">
                Salve todo o seu progresso neste aparelho com segurança
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

        {syncNotice && (
          <div className="p-3 rounded-2xl bg-[#FDF4F5] dark:bg-[#38262B] border border-[#E8A5B8] text-xs text-[#844E5F] dark:text-[#F2C4CE] flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{syncNotice}</span>
          </div>
        )}

        {/* If logged in */}
        {userSession.isLoggedIn ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#8C6E5E] dark:text-[#B59D8F]">E-mail Conectado:</span>
                <span className="font-semibold text-[#452414] dark:text-[#F6F1EC] font-mono">
                  {userSession.email}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8C6E5E] dark:text-[#B59D8F]">Nome:</span>
                <span className="font-semibold text-[#452414] dark:text-[#F6F1EC]">
                  {userSession.name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8C6E5E] dark:text-[#B59D8F]">Último Salvamento:</span>
                <span className="font-medium text-emerald-700 dark:text-emerald-400">
                  {userSession.lastSyncedAt || 'Hoje'}
                </span>
              </div>
            </div>

            {/* Sync Now Action */}
            <button
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="w-full py-3 px-4 rounded-2xl bg-[#502916] hover:bg-[#6B3F2A] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Sincronizando...' : 'Salvar Todo o Progresso Agora'}</span>
            </button>

            {/* Backup Export / Import */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={onExportData}
                className="py-2.5 px-3 rounded-2xl bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] hover:border-[#B88E72] text-xs font-medium text-[#6B3F2A] dark:text-[#E8DDD4] flex items-center justify-center gap-1.5 transition-colors"
                title="Baixar arquivo de backup do seu app"
              >
                <Download className="w-3.5 h-3.5 text-[#B88E72]" />
                <span>Exportar Backup</span>
              </button>

              <label className="py-2.5 px-3 rounded-2xl bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] hover:border-[#B88E72] text-xs font-medium text-[#6B3F2A] dark:text-[#E8DDD4] flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center">
                <Upload className="w-3.5 h-3.5 text-[#B88E72]" />
                <span>Restaurar</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="hidden"
                />
              </label>
            </div>

            {/* Logout button */}
            <div className="pt-2 flex justify-between items-center text-xs">
              <span className="text-[#8C6E5E] dark:text-[#B59D8F] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Seus dados salvos localmente
              </span>
              <button
                onClick={onLogout}
                className="text-[#8C6E5E] hover:text-red-600 flex items-center gap-1 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Trocar E-mail</span>
              </button>
            </div>
          </div>
        ) : (
          /* Form to login */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] mb-1">
                Seu Nome ou Apelido
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Ex: Helena"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] mb-1">
                Seu E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C6E5E]" />
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="exemplo@email.com"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
                  required
                />
              </div>
              <p className="text-[11px] text-[#8C6E5E] dark:text-[#B59D8F] mt-1">
                Ao entrar, seu progresso fica vinculado a este e-mail no navegador.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-2xl bg-[#502916] hover:bg-[#6B3F2A] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all"
            >
              <Sparkles className="w-4 h-4 text-[#E8A5B8]" />
              <span>Conectar e Salvar Progresso</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
