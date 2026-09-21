import React, { useState } from 'react';
import {
  X,
  Baby,
  Camera,
  Upload,
  Plus,
  Trash2,
  Check,
  Sparkles,
  Heart,
} from 'lucide-react';
import { KidProfile } from '../../types';
import { resizeImage } from '../../utils/imageResizer';
import { sanitizeImageUrl, sanitizeText } from '../../lib/security';

interface KidsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  kids: KidProfile[];
  onUpdateKids: (kids: KidProfile[]) => void;
}

export const KidsManagerModal: React.FC<KidsManagerModalProps> = ({
  isOpen,
  onClose,
  kids,
  onUpdateKids,
}) => {
  const [localKids, setLocalKids] = useState<KidProfile[]>(() => {
    if (kids && kids.length > 0) return kids;
    return [
      {
        id: 'k1',
        name: 'Theo',
        photoUrl:
          'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=400&q=80',
        birthDate: '3 aninhos',
        notes: 'Natação, pediatra e carinho.',
      },
    ];
  });

  // Keep localKids synced if props change
  React.useEffect(() => {
    if (isOpen) {
      setLocalKids(kids);
    }
  }, [kids, isOpen]);

  const [savedNotice, setSavedNotice] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handlePhotoUpload = async (kidId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(png|jpeg|jpg|webp|gif)$/)) {
      alert('Selecione uma imagem válida (PNG, JPEG ou WEBP).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('A imagem não pode ultrapassar 2MB.');
      return;
    }

    try {
      setIsProcessing(true);
      const resizedBase64 = await resizeImage(file, 400, 400); // 400x400 limit for local storage
      const safeUrl = sanitizeImageUrl(resizedBase64);
      setLocalKids((prev) =>
        prev.map((k) => (k.id === kidId ? { ...k, photoUrl: safeUrl } : k))
      );
    } catch (err) {
      console.error('Failed to process image:', err);
      alert('Erro ao carregar a imagem. A imagem pode ser grande demais ou estar em formato não suportado.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateField = (kidId: string, field: keyof KidProfile, val: string) => {
    const maxLength = field === 'name' ? 80 : field === 'birthDate' ? 50 : 500;
    const sanitizedVal = sanitizeText(val, maxLength);
    setLocalKids((prev) =>
      prev.map((k) => (k.id === kidId ? { ...k, [field]: sanitizedVal } : k))
    );
  };

  const handleAddKid = () => {
    const newKid: KidProfile = {
      id: `k_${Date.now()}`,
      name: 'Novo Filho',
      photoUrl:
        'https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=400&q=80',
      birthDate: '',
      notes: '',
    };
    setLocalKids((prev) => [...prev, newKid]);
  };

  const handleDeleteKid = (kidId: string) => {
    if (localKids.length <= 1) {
      alert('Mantenha pelo menos um perfil de filho cadastrado.');
      return;
    }
    setLocalKids((prev) => prev.filter((k) => k.id !== kidId));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const sanitizedKids = localKids.map((k) => ({
      ...k,
      name: sanitizeText(k.name, 80) || 'Filho(a)',
      photoUrl: sanitizeImageUrl(k.photoUrl, 'https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=400&q=80'),
      birthDate: sanitizeText(k.birthDate || '', 50),
      notes: sanitizeText(k.notes || '', 500),
    }));
    onUpdateKids(sanitizedKids);
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#231A14]/65 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-[#FAF7F2] dark:bg-[#1E1712] rounded-3xl border border-[#EBDED5] dark:border-[#3D2E24] p-5 sm:p-6 space-y-4 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#EBDED5]/60 dark:border-[#3D2E24] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#FDF4F5] dark:bg-[#38262B] border border-[#E8A5B8] flex items-center justify-center text-[#844E5F] dark:text-[#F2C4CE]">
              <Baby className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg sm:text-xl font-semibold text-[#452414] dark:text-[#F6F1EC]">
                Espaço dos Filhos
              </h3>
              <p className="text-xs text-[#8C6E5E] dark:text-[#B59D8F]">
                Personalize fotos, nomes e detalhes dos seus filhos
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
            <span>Fotos e dados dos filhos atualizados com amor!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {localKids.map((kid, idx) => (
            <div
              key={kid.id}
              className="p-4 rounded-2xl bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] space-y-3 shadow-2xs relative"
            >
              {localKids.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleDeleteKid(kid.id)}
                  className="absolute top-3 right-3 p-1.5 text-[#8C6E5E] hover:text-red-600 transition-colors"
                  title="Remover este filho"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              {/* Photo Upload & Preview */}
              <div className="flex items-center gap-4">
                <div className="relative group shrink-0">
                  <div className="w-18 h-18 rounded-2xl overflow-hidden border-2 border-[#EBDED5] dark:border-[#3D2E24] ring-4 ring-[#E8A5B8]/30 shadow-md">
                    <img
                      src={sanitizeImageUrl(kid.photoUrl, 'https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=400&q=80')}
                      alt={kid.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <label className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-full bg-[#502916] hover:bg-[#6B3F2A] text-white shadow-md cursor-pointer transition-transform hover:scale-105">
                    <Camera className="w-3.5 h-3.5" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(kid.id, e)}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex-1 space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#B88E72] dark:text-[#E8DDD4]">
                    Filho {idx + 1}
                  </span>

                  <label className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF7F2] dark:bg-[#2F241C] border border-[#EBDED5] dark:border-[#3D2E24] text-xs font-semibold text-[#6B3F2A] dark:text-[#E8DDD4] hover:border-[#B88E72] cursor-pointer">
                    <Upload className="w-3 h-3 text-[#E8A5B8]" />
                    <span>Carregar Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(kid.id, e)}
                      className="hidden"
                    />
                  </label>
                  
                  {isProcessing && <p className="text-[10px] text-[#B88E72] animate-pulse">Processando...</p>}

                  <p className="text-[10px] text-[#8C6E5E] dark:text-[#B59D8F]">
                    Foto exibida nos filtros da agenda e compromissos.
                  </p>
                </div>
              </div>

              {/* Name & Age / Info */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-[#452414] dark:text-[#F6F1EC] mb-1">
                    Nome da Criança
                  </label>
                  <input
                    type="text"
                    required
                    value={kid.name}
                    onChange={(e) => handleUpdateField(kid.id, 'name', e.target.value)}
                    placeholder="Ex: Theo"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF7F2] dark:bg-[#1E1712] border border-[#EBDED5] dark:border-[#3D2E24] text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#452414] dark:text-[#F6F1EC] mb-1">
                    Idade / Fase (opcional)
                  </label>
                  <input
                    type="text"
                    value={kid.birthDate || ''}
                    onChange={(e) => handleUpdateField(kid.id, 'birthDate', e.target.value)}
                    placeholder="Ex: 3 aninhos"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF7F2] dark:bg-[#1E1712] border border-[#EBDED5] dark:border-[#3D2E24] text-[#452414] dark:text-[#F6F1EC] focus:outline-none focus:border-[#6B3F2A]"
                  />
                </div>
              </div>

              {/* Photo URL option if preferred */}
              <div>
                <label className="block text-[10px] font-medium text-[#8C6E5E] dark:text-[#B59D8F] mb-1">
                  Ou link direto da foto (URL):
                </label>
                <input
                  type="text"
                  value={kid.photoUrl}
                  onChange={(e) => handleUpdateField(kid.id, 'photoUrl', e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-1.5 text-[11px] rounded-lg bg-[#FAF7F2] dark:bg-[#1E1712] border border-[#EBDED5] dark:border-[#3D2E24] text-[#452414] dark:text-[#F6F1EC] focus:outline-none"
                />
              </div>
            </div>
          ))}

          {/* Add another child button */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleAddKid}
              className="text-xs font-semibold text-[#6B3F2A] dark:text-[#E8DDD4] hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5 text-[#E8A5B8]" />
              <span>Adicionar outro filho</span>
            </button>
          </div>

          {/* Footer Save */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EBDED5]/60 dark:border-[#3D2E24]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#8C6E5E] hover:text-[#452414] dark:hover:text-[#F6F1EC]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-semibold text-white bg-[#502916] hover:bg-[#6B3F2A] rounded-full shadow-sm flex items-center gap-1.5"
            >
              <Heart className="w-3.5 h-3.5 fill-white text-white" />
              <span>Salvar Fotos & Dados</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
