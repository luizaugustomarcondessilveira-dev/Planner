import React, { useState } from 'react';
import {
  X,
  Cloud,
  Check,
  Download,
  Upload,
  ShieldCheck,
  LogOut,
  RefreshCw,
  AlertCircle,
  WifiOff,
  UserCheck,
} from 'lucide-react';
import { UserSession, SyncState } from '../../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  userSession: UserSession;
  syncState: SyncState;
  onLogout: () => Promise<void>;
  onManualSync: () => Promise<void>;
  onExportData: () => void;
  onImportData: (jsonStr: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  userSession,
  syncState,
  onLogout,
  onManualSync,
  onExportData,
  onImportData,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSyncNow = async () => {
    try {
      setIsSyncing(true);
      await onManualSync();
      setSyncNotice('Sincronização concluída com sucesso.');
      setTimeout(() => setSyncNotice(null), 3000);
    } catch (err: unknown) {
      setSyncNotice('Erro ao sincronizar. Verifique sua conexão.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogoutClick = async () => {
    try {
      setIsLoggingOut(true);
      await onLogout();
      onClose();
    } catch (err) {
      setIsLoggingOut(false);
    }
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

  const getSyncStateBadge = () => {
    switch (syncState) {
      case 'sincronizando':
        return (
          <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-semibold">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Sincronizando com a Nuvem...
          </span>
        );
      case 'offline':
        return (
          <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-semibold">
            <WifiOff className="w-3 h-3" />
            Offline (Alterações Locais)
          </span>
        );
      case 'erro':
        return (
          <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold">
            <AlertCircle className="w-3 h-3" />
            Erro na Sincronização
          </span>
        );
      case 'sincronizado':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
            <Check className="w-3 h-3 text-emerald-600" />
            Sincronizado na Nuvem
          </span>
        );
    }
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
                Conta & Nuvem Supabase
              </h3>
              <p className="text-xs text-[#8C6E5E] dark:text-[#B59D8F]">
                Sincronização em tempo real e cópias de segurança
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

        {/* Real User Session Card */}
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] space-y-2.5 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#EBDED5]/60 dark:border-[#3D2E24]/60">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-[#452414] dark:text-[#F6F1EC]">
                  {userSession.name || 'Conta Google Conectada'}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium text-[10px] border border-emerald-200 dark:border-emerald-800">
                Ativo
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#8C6E5E] dark:text-[#B59D8F]">E-mail:</span>
              <span className="font-semibold text-[#452414] dark:text-[#F6F1EC] font-mono text-[11px] truncate max-w-[200px]">
                {userSession.email}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#8C6E5E] dark:text-[#B59D8F]">Estado Atual:</span>
              <div className="text-right">{getSyncStateBadge()}</div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#8C6E5E] dark:text-[#B59D8F]">Última Sincronização:</span>
              <span className="font-mono text-[11px] text-[#6B3F2A] dark:text-[#D8BDB0]">
                {userSession.lastSyncedAt || 'Recentemente'}
              </span>
            </div>
          </div>

          {/* Sync Now Action */}
          <button
            type="button"
            onClick={handleSyncNow}
            disabled={isSyncing || syncState === 'offline'}
            className="w-full py-3 px-4 rounded-2xl bg-[#502916] hover:bg-[#6B3F2A] disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Agora com Supabase'}</span>
          </button>

          {/* Backup Export / Import */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={onExportData}
              className="py-2.5 px-3 rounded-2xl bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] hover:border-[#B88E72] text-xs font-medium text-[#6B3F2A] dark:text-[#E8DDD4] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Baixar cópia local em arquivo JSON"
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
              Protegido via RLS
            </span>
            <button
              type="button"
              onClick={handleLogoutClick}
              disabled={isLoggingOut}
              className="text-[#8C6E5E] hover:text-rose-600 flex items-center gap-1 transition-colors cursor-pointer font-medium disabled:opacity-50"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isLoggingOut ? 'Saindo...' : 'Sair da Conta'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
