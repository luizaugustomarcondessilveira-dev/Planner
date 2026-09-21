import React, { useState } from 'react';
import {
  X,
  User,
  Heart,
  Calendar,
  Sparkles,
  Camera,
  Upload,
  Check,
  RotateCcw,
  ShieldCheck,
  Baby,
} from 'lucide-react';
import { AppImages, UserSession } from '../../types';
import { resizeImage } from '../../utils/imageResizer';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: AppImages;
  onUpdateAvatar: (url: string) => void;
  userSession: UserSession;
  onUpdateSessionProfile: (name: string, email: string) => void;
  useUserPhotoAsLogo: boolean;
  onToggleUserPhotoAsLogo: () => void;
  onOpenImageManager: () => void;
  onOpenKidsManager?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  images,
  onUpdateAvatar,
  userSession,
  onUpdateSessionProfile,
  useUserPhotoAsLogo,
  onToggleUserPhotoAsLogo,
  onOpenImageManager,
  onOpenKidsManager,
}) => {
  const [name, setName] = useState(userSession.name || 'Helena');
  const [email, setEmail] = useState(userSession.email || '');
  const [avatarUrl, setAvatarUrl] = useState(images.avatar);
  const [savedNotice, setSavedNotice] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setAvatarUrl(images.avatar);
      setName(userSession.name || 'Helena');
      setEmail(userSession.email || '');
    }
  }, [isOpen, images.avatar, userSession]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      const resizedBase64 = await resizeImage(file, 400, 400); // limit for local storage
      setAvatarUrl(resizedBase64);
      onUpdateAvatar(resizedBase64);
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2000);
    } catch (err) {
      console.error('Failed to process image:', err);
      alert('Erro ao carregar a imagem. A imagem pode ser grande demais ou estar em formato não suportado.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSessionProfile(name.trim(), email.trim());
    onUpdateAvatar(avatarUrl);
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#231A14]/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-[#FAF7F2] dark:bg-[#1E1712] rounded-3xl border border-[#EBDED5] dark:border-[#3D2E24] p-6 space-y-5 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#FDF4F5] dark:bg-[#38262B] border border-[#E8A5B8] flex items-center justify-center text-[#6B3F2A] dark:text-[#F2C4CE]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-semibold text-[#452414] dark:text-[#F6F1EC]">
                Perfil & Identidade
              </h3>
              <p className="text-xs text-[#8C6E5E] dark:text-[#B59D8F]">
                Personalize sua foto, nome e presença no Atelier
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

        {savedNotice && (
          <div className="p-3 rounded-2xl bg-[#FDF4F5] dark:bg-[#38262B] border border-[#E8A5B8] text-xs text-[#844E5F] dark:text-[#F2C4CE] flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Foto e dados atualizados com sucesso!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* Avatar Picture with Upload */}
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#EBDED5] dark:border-[#3D2E24] ring-4 ring-[#E8A5B8]/30 shadow-md">
                <img
                  src={avatarUrl}
                  alt={name}
                  className="w-full h-full object-cover"
                />
              </div>

              <label className="absolute bottom-0 right-0 p-2 rounded-full bg-[#502916] hover:bg-[#6B3F2A] text-white shadow-md cursor-pointer transition-transform hover:scale-105">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex items-center gap-2">
              <label className="px-3 py-1.5 rounded-full bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] text-xs font-semibold text-[#6B3F2A] dark:text-[#E8DDD4] hover:border-[#B88E72] flex items-center gap-1.5 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Escolher Nova Foto</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
            {isProcessing && <span className="text-[10px] text-[#B88E72] animate-pulse">Processando imagem...</span>}
            
            <div className="w-full pt-1">
               <label className="block text-[10px] font-medium text-[#8C6E5E] dark:text-[#B59D8F] mb-1 text-center">
                 Ou cole o link direto de uma imagem (URL):
               </label>
               <input
                 type="text"
                 value={avatarUrl}
                 onChange={(e) => setAvatarUrl(e.target.value)}
                 placeholder="https://..."
                 className="w-full px-3 py-1.5 text-[11px] rounded-lg bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] text-[#452414] dark:text-[#F6F1EC] focus:outline-none"
               />
            </div>
          </div>

          {/* Toggle: Use User Photo in the Top Left Logo */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] block">
                Usar minha foto como Logotipo
              </span>
              <span className="text-[11px] text-[#8C6E5E] dark:text-[#B59D8F]">
                Substitui o monograma floral AA pela sua foto no canto superior esquerdo
              </span>
            </div>

            <button
              type="button"
              onClick={onToggleUserPhotoAsLogo}
              className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${
                useUserPhotoAsLogo ? 'bg-[#6B3F2A]' : 'bg-[#EBDED5] dark:bg-[#3D2E24]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  useUserPhotoAsLogo ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Name input */}
          <div>
            <label className="block text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] mb-1">
              Como gostaria de ser chamada no app?
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
              required
            />
          </div>

          {/* User Email Editable */}
          <div>
            <label className="block text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] mb-1">
              E-mail de acesso e sincronização
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@exemplo.com"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
            />
            <span className="text-[10px] text-[#8C6E5E] dark:text-[#B59D8F] mt-1 block">
              Altere para seu e-mail preferido para salvar e sincronizar seus dados do Atelier.
            </span>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            {onOpenKidsManager && (
              <button
                type="button"
                onClick={onOpenKidsManager}
                className="w-full p-3 rounded-2xl bg-[#FDF4F5] dark:bg-[#38262B] border border-[#E8A5B8] flex items-center justify-between text-[#844E5F] dark:text-[#F2C4CE] transition-colors hover:bg-[#F2C4CE]/40"
              >
                <div className="flex items-center gap-2">
                  <Baby className="w-4 h-4" />
                  <span className="text-xs font-semibold">Configurar Filhos</span>
                </div>
                <span className="text-[10px]">Alterar fotos, nomes e idade &rarr;</span>
              </button>
            )}

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={onOpenImageManager}
                className="text-xs text-[#B88E72] hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Gerenciar todas as fotos</span>
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 text-xs font-semibold text-white bg-[#502916] hover:bg-[#6B3F2A] rounded-full shadow-sm"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
