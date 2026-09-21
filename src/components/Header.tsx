import React, { useState } from 'react';
import { AppTab, AppImages, UserSession, SyncState } from '../types';
import { AALogo } from './AALogo';
import { sanitizeImageUrl } from '../lib/security';
import {
  Image as ImageIcon,
  Sun,
  Moon,
  Feather,
  Cloud,
  Edit2,
  Check,
  User,
  Sparkles,
  RefreshCw,
  WifiOff,
  AlertCircle,
} from 'lucide-react';

interface HeaderProps {
  currentTab: AppTab;
  images: AppImages;
  appTitle: string;
  onUpdateAppTitle: (newTitle: string) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  userSession: UserSession;
  syncState?: SyncState;
  onOpenLoginModal: () => void;
  onOpenDesabafoModal: () => void;
  onOpenImageManager: () => void;
  onOpenProfile: () => void;
  useUserPhotoAsLogo: boolean;
  onToggleUserPhotoAsLogo: () => void;
}

const TAB_INFO: Record<AppTab, { label: string; icon: string; subtitle: string }> = {
  hoje: { label: 'Hoje', icon: '✨', subtitle: 'Ritmo, hábitos e hidratação' },
  agenda: { label: 'Agenda', icon: '📅', subtitle: 'Compromissos e família' },
  diario: { label: 'Diário', icon: '📖', subtitle: 'Caderno secreto da alma' },
  metas: { label: 'Metas', icon: '🎯', subtitle: 'Propósitos e celebrações' },
  estudos: { label: 'Estudos', icon: '🎓', subtitle: 'Foco profundo & TCC' },
};

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  images,
  appTitle,
  onUpdateAppTitle,
  isDarkMode,
  onToggleDarkMode,
  userSession,
  syncState = 'sincronizado',
  onOpenLoginModal,
  onOpenDesabafoModal,
  onOpenImageManager,
  onOpenProfile,
  useUserPhotoAsLogo,
  onToggleUserPhotoAsLogo,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(appTitle);

  const handleSaveTitle = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (tempTitle.trim()) {
      onUpdateAppTitle(tempTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const activeTabInfo = TAB_INFO[currentTab];

  const getSyncStateUI = () => {
    switch (syncState) {
      case 'sincronizando':
        return {
          icon: <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin" />,
          label: 'Sincronizando...',
          style: 'bg-white dark:bg-[#251D17] text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800',
        };
      case 'offline':
        return {
          icon: <WifiOff className="w-3.5 h-3.5 text-amber-600" />,
          label: 'Modo Offline',
          style: 'bg-white dark:bg-[#251D17] text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800',
        };
      case 'erro':
        return {
          icon: <AlertCircle className="w-3.5 h-3.5 text-rose-500" />,
          label: 'Erro ao Salvar',
          style: 'bg-white dark:bg-[#251D17] text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800',
        };
      case 'sincronizado':
      default:
        return {
          icon: <Cloud className="w-3.5 h-3.5 text-emerald-500" />,
          label: 'Salvo na Nuvem',
          style: 'bg-white dark:bg-[#251D17] text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800',
        };
    }
  };

  const syncUI = getSyncStateUI();

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FAF7F2]/95 dark:bg-[#1E1712]/95 backdrop-blur-md border-b border-[#EBDED5]/80 dark:border-[#3D2E24] px-3 sm:px-6 py-2.5 transition-colors">
      <div className="max-w-xl mx-auto flex flex-col gap-2">
        {/* Main top bar */}
        <div className="flex items-center justify-between gap-2">
          {/* Brand & Logo */}
          <div className="flex items-center gap-2.5">
            {/* Logo / User Photo button */}
            <div className="relative group">
              <button
                onClick={onToggleUserPhotoAsLogo}
                className="group relative focus:outline-none transition-transform active:scale-95"
                title={
                  useUserPhotoAsLogo
                    ? 'Logo: Sua foto de perfil (Clique para voltar ao monograma floral)'
                    : 'Logo: Monograma Floral AA (Clique para usar sua foto)'
                }
              >
                <AALogo
                  size={38}
                  useUserPhotoAsLogo={useUserPhotoAsLogo}
                  userPhotoUrl={images.avatar}
                  customUrl={!useUserPhotoAsLogo && images.logo !== INITIAL_IMAGES_LOGO_CHECK ? images.logo : undefined}
                />
              </button>
            </div>

            {/* Editable Title */}
            <div>
              {isEditingTitle ? (
                <form onSubmit={handleSaveTitle} className="flex items-center gap-1">
                  <input
                    type="text"
                    value={tempTitle}
                    onChange={(e) => setTempTitle(e.target.value)}
                    className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-white dark:bg-[#2A2019] border border-[#6B3F2A] text-[#452414] dark:text-white focus:outline-none"
                    autoFocus
                    onBlur={() => handleSaveTitle()}
                  />
                  <button
                    type="submit"
                    className="p-1 rounded bg-[#6B3F2A] text-white"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                </form>
              ) : (
                <div
                  onClick={() => setIsEditingTitle(true)}
                  className="flex items-center gap-1 cursor-pointer group"
                  title="Clique para personalizar o título do Atelier"
                >
                  <span className="text-[11px] tracking-[0.12em] uppercase font-bold text-[#8C6E5E] dark:text-[#B59D8F] group-hover:text-[#452414] dark:group-hover:text-white transition-colors">
                    {appTitle}
                  </span>
                  <Edit2 className="w-2.5 h-2.5 text-[#8C6E5E] dark:text-[#B59D8F] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}

              {/* Highlight active tab in header */}
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-serif text-lg font-bold text-[#452414] dark:text-[#F6F1EC] leading-tight">
                  {activeTabInfo.label}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#F2C4CE]/50 dark:bg-[#4A2D35] border border-[#E8A5B8]/60 text-[#844E5F] dark:text-[#F2C4CE] font-semibold text-[10px] tracking-wide">
                  Aba Ativa
                </span>
              </div>
            </div>
          </div>

          {/* Right Action Icons & Controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Cantinho do Desabafo Button */}
            <button
              onClick={onOpenDesabafoModal}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-full text-xs font-medium text-[#844E5F] dark:text-[#F2C4CE] bg-[#FDF4F5] dark:bg-[#38262B] hover:bg-[#F2C4CE]/40 border border-[#E8A5B8]/60 transition-all shadow-2xs group"
              title="Cantinho do Desabafo: Escreva ou leia desabafos"
            >
              <Feather className="w-3.5 h-3.5 text-[#E8A5B8] group-hover:rotate-12 transition-transform" />
              <span className="text-[11px] font-semibold hidden min-[400px]:inline">Desabafo</span>
            </button>

            {/* Login / Cloud Sync Button */}
            <button
              onClick={onOpenLoginModal}
              className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-full text-xs font-medium border transition-all shadow-2xs cursor-pointer ${syncUI.style}`}
              title={`Conta: ${userSession.email || 'Conectada'} • Estado: ${syncUI.label}`}
            >
              {syncUI.icon}
              <span className="text-[11px] font-medium hidden sm:inline">
                {syncUI.label}
              </span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={onToggleDarkMode}
              className={`p-2 rounded-full border transition-all ${
                isDarkMode
                  ? 'bg-[#35251C] border-amber-400/60 text-amber-300 shadow-sm'
                  : 'bg-white border-[#EBDED5] text-[#6B3F2A] hover:bg-[#F0EDE9]'
              }`}
              title={isDarkMode ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro (Noite Serena)'}
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-300 animate-spin-slow" />
              ) : (
                <Moon className="w-4 h-4 text-[#6B3F2A]" />
              )}
            </button>

            {/* Direct HTML Image Links trigger button */}
            <button
              onClick={onOpenImageManager}
              className="p-2 rounded-full text-[#6B3F2A] dark:text-[#E8DDD4] hover:bg-[#FDF4F5] dark:hover:bg-[#38262B] border border-[#EBDED5] dark:border-[#3D2E24] transition-colors"
              title="Gerenciador de Imagens & Links HTML"
            >
              <ImageIcon className="w-4 h-4 text-[#E8A5B8]" />
            </button>

            {/* Profile Avatar */}
            <button
              onClick={onOpenProfile}
              className="relative group focus:outline-none"
              title={`${userSession.name || 'Helena'} • Perfil & Identidade`}
            >
              <div className="w-8 h-8 rounded-full overflow-hidden border border-[#EBDED5] dark:border-[#3D2E24] ring-2 ring-[#E8A5B8]/40 shadow-sm">
                <img
                  src={sanitizeImageUrl(images.avatar, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400')}
                  alt={userSession.name || 'Helena'}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-[#6B3F2A] dark:bg-[#E8A5B8] ring-1 ring-white" />
            </button>
          </div>
        </div>

        {/* Selected Tab Subtitle Banner */}
        <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-white/80 dark:bg-[#251D17]/80 border border-[#EBDED5]/60 dark:border-[#3D2E24]/60 text-[11px] text-[#8C6E5E] dark:text-[#B59D8F]">
          <div className="flex items-center gap-1.5 truncate">
            <span>{activeTabInfo.icon}</span>
            <span className="font-semibold text-[#452414] dark:text-[#F6F1EC]">
              {activeTabInfo.label}:
            </span>
            <span className="truncate">{activeTabInfo.subtitle}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline text-[11px] font-medium text-[#6B3F2A] dark:text-[#F2C4CE]">
              Paz e graça, {userSession.name || 'Helena'}
            </span>
            <span className="text-[10px] text-[#B88E72] dark:text-[#D8BDB0] font-mono">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

const INITIAL_IMAGES_LOGO_CHECK =
  'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80';
