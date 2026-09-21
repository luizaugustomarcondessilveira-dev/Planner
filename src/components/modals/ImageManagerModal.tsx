import React, { useState } from 'react';
import {
  X,
  Image as ImageIcon,
  Link as LinkIcon,
  Check,
  Copy,
  RotateCcw,
  ExternalLink,
  Info,
  Upload,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { AppImages } from '../../types';
import { sanitizeImageUrl, isValidImageUrl } from '../../lib/security';

interface ImageManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: AppImages;
  onUpdateImages: (newImages: AppImages) => void;
  onResetImages: () => void;
}

interface ImageFieldMeta {
  key: keyof AppImages;
  label: string;
  location: string;
  purpose: string;
  defaultAlt: string;
  recommendedSize: string;
}

export const ImageManagerModal: React.FC<ImageManagerModalProps> = ({
  isOpen,
  onClose,
  images,
  onUpdateImages,
  onResetImages,
}) => {
  const [formData, setFormData] = useState<AppImages>({ ...images });
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);

  if (!isOpen) return null;

  const imageFields: ImageFieldMeta[] = [
    {
      key: 'avatar',
      label: 'Foto de Perfil do Usuário',
      location: 'Canto superior direito do Cabeçalho e na Janela de Perfil/Conta.',
      purpose: 'Identifica a usuária no app, personificando a experiência diária.',
      defaultAlt: 'Retrato de Helena',
      recommendedSize: 'Quadrada (1:1), 400x400px, JPG ou PNG',
    },
    {
      key: 'logo',
      label: 'Logotipo / Foto no Logo (Topo Esquerdo)',
      location: 'No canto superior esquerdo ao lado do título do Atelier.',
      purpose: 'Pode ser o monograma floral tradicional "AA" ou a foto que você preferir.',
      defaultAlt: 'Logotipo Atelier & Alento',
      recommendedSize: 'Quadrada ou Circular, 200x200px',
    },
    {
      key: 'meal',
      label: 'Cardápio Planejado (Almoço)',
      location: 'Aba "Hoje", no cardápio de refeição saudável (Salmão grelhado).',
      purpose: 'Ilustra a mesa posta, receitas nutritivas e o momento de almoço em família.',
      defaultAlt: 'Salmão grelhado com legumes',
      recommendedSize: 'Panorâmica (16:9), 800x450px',
    },
    {
      key: 'journal',
      label: 'Capa do Diário da Alma',
      location: 'Aba "Diário", no topo ao lado do título "Diário da Alma".',
      purpose: 'Cria atmosfera editorial de um caderno secreto e páginas acolhedoras.',
      defaultAlt: 'Caderno de capa artesanal e caneta',
      recommendedSize: 'Retangular (3:4), 600x800px',
    },
    {
      key: 'goalsQuote',
      label: 'Banner de Metas & Inspiração',
      location: 'Aba "Metas", no banner central "Pequenos começos geram grandes colheitas".',
      purpose: 'Traz motivação visual e estética suave para a visualização dos propósitos.',
      defaultAlt: 'Flores frescas e caderno matinal',
      recommendedSize: 'Panorâmica (16:9), 900x400px',
    },
    {
      key: 'studyDesk',
      label: 'Ambiente de Estudos (Direito / TCC)',
      location: 'Aba "Estudos", no topo do cronômetro Pomodoro e acompanhamento do TCC.',
      purpose: 'Estimula o foco profundo, livros jurídicos e rotina acadêmica.',
      defaultAlt: 'Mesa de estudos com livros e café',
      recommendedSize: 'Panorâmica (16:9), 800x400px',
    },
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const sanitizedImages: AppImages = {
      avatar: sanitizeImageUrl(formData.avatar, images.avatar),
      logo: sanitizeImageUrl(formData.logo, images.logo),
      meal: sanitizeImageUrl(formData.meal, images.meal),
      journal: sanitizeImageUrl(formData.journal, images.journal),
      goalsQuote: sanitizeImageUrl(formData.goalsQuote, images.goalsQuote),
      studyDesk: sanitizeImageUrl(formData.studyDesk, images.studyDesk),
    };

    onUpdateImages(sanitizedImages);
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 900);
  };

  const copyHtmlSnippet = (url: string, alt: string, key: string) => {
    const safeUrl = sanitizeImageUrl(url);
    const html = `<img src="${safeUrl}" alt="${alt}" loading="lazy" referrerpolicy="no-referrer" />`;
    navigator.clipboard.writeText(html);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleFileUpload = (
    key: keyof AppImages,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image MIME type
    if (!file.type.match(/^image\/(png|jpeg|jpg|webp|gif|svg\+xml)$/)) {
      alert('Formato de imagem não suportado. Utilize PNG, JPEG ou WEBP.');
      return;
    }

    // Limit image upload to 2MB
    if (file.size > 2 * 1024 * 1024) {
      alert('A imagem não pode ultrapassar 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (isValidImageUrl(base64)) {
        setFormData((prev) => ({ ...prev, [key]: base64 }));
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#231A14]/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-[#FAF7F2] dark:bg-[#1E1712] rounded-3xl border border-[#EBDED5] dark:border-[#3D2E24] shadow-2xl overflow-hidden transition-colors">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#EBDED5] dark:border-[#3D2E24] bg-white dark:bg-[#251D17]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FDF4F5] dark:bg-[#38262B] border border-[#E8A5B8] flex items-center justify-center text-[#6B3F2A] dark:text-[#F2C4CE]">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-semibold text-[#452414] dark:text-[#F6F1EC]">
                Gerenciador de Imagens & Links HTML
              </h2>
              <p className="text-xs text-[#8C6E5E] dark:text-[#B59D8F]">
                Upload direto ou URLs da internet para cada parte do aplicativo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#8C6E5E] hover:text-[#452414] dark:hover:text-[#F6F1EC] rounded-full transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informative Callout explaining where and how it works */}
        <div className="p-4 mx-6 mt-4 rounded-2xl bg-[#FDF4F5] dark:bg-[#38262B] border border-[#E8A5B8]/50 flex items-start gap-3 text-xs text-[#6B3F2A] dark:text-[#F2C4CE] leading-relaxed">
          <Info className="w-4 h-4 text-[#E8A5B8] shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block">
              Como funciona o gerenciamento de imagens?
            </span>
            <p className="mt-0.5 text-[#8C6E5E] dark:text-[#D8BDB0]">
              Você pode carregar fotos diretamente do seu dispositivo (celular ou computador) clicando em <strong>"Fazer Upload"</strong>, ou colar um link direto da web (ex: Imgur, Unsplash, Google Fotos). O app atualiza imediatamente a interface e permite copiar a tag HTML <code className="bg-white dark:bg-[#2A2019] px-1 py-0.5 rounded border border-[#EBDED5] dark:border-[#423126] font-mono text-[11px]">&lt;img src="..." /&gt;</code> pronta.
            </p>
          </div>
        </div>

        {/* Content list */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {imageFields.map((field) => {
            const currentUrl = formData[field.key] || '';
            const isCopied = copiedKey === field.key;

            return (
              <div
                key={field.key}
                className="p-4 rounded-2xl bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] hover:border-[#B88E72] transition-all space-y-3"
              >
                {/* Field info & thumbnail */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-semibold text-[#452414] dark:text-[#F6F1EC]">
                        {field.label}
                      </label>
                    </div>

                    {/* Where it appears */}
                    <p className="text-xs text-[#6B3F2A] dark:text-[#D8BDB0] mt-0.5 font-medium flex items-center gap-1">
                      <span className="text-[#E8A5B8]">📍 Onde aparece:</span> {field.location}
                    </p>

                    {/* Purpose */}
                    <p className="text-[11px] text-[#8C6E5E] dark:text-[#B59D8F] mt-0.5">
                      {field.purpose} • <span className="italic">{field.recommendedSize}</span>
                    </p>
                  </div>

                  {/* Thumbnail preview */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-[#EBDED5] dark:border-[#3D2E24] bg-[#FAF7F2] shrink-0 shadow-sm relative group">
                    {currentUrl && isValidImageUrl(currentUrl) ? (
                      <img
                        src={sanitizeImageUrl(currentUrl)}
                        alt={field.defaultAlt}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://placehold.co/120x120?text=Imagem';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-[#8C6E5E]">
                        Vazio
                      </div>
                    )}
                  </div>
                </div>

                {/* Input & Upload Controls */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C6E5E]" />
                    <input
                      type="text"
                      value={currentUrl.startsWith('data:image') ? 'Foto carregada do dispositivo (Base64)' : currentUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, [field.key]: e.target.value })
                      }
                      placeholder="Cole uma URL direta https://... ou faça upload"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF7F2] dark:bg-[#1E1712] border border-[#EBDED5] dark:border-[#3D2E24] rounded-xl focus:outline-none focus:border-[#6B3F2A] text-[#452414] dark:text-[#F6F1EC] transition-colors font-mono"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Upload button */}
                    <label className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-white bg-[#502916] hover:bg-[#6B3F2A] rounded-xl transition-all cursor-pointer shrink-0 shadow-2xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Fazer Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(field.key, e)}
                        className="hidden"
                      />
                    </label>

                    {/* Copy HTML tag button */}
                    <button
                      type="button"
                      onClick={() => copyHtmlSnippet(currentUrl, field.defaultAlt, field.key)}
                      className="flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-[#6B3F2A] dark:text-[#E8DDD4] bg-[#FAF7F2] dark:bg-[#2A2019] hover:bg-[#F0EDE9] border border-[#EBDED5] dark:border-[#3D2E24] rounded-xl transition-colors shrink-0"
                      title="Copiar código HTML <img src='...'>"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar HTML</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#EBDED5] dark:border-[#3D2E24] bg-white dark:bg-[#251D17] flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onResetImages();
              onClose();
            }}
            className="flex items-center gap-1.5 text-xs text-[#8C6E5E] dark:text-[#B59D8F] hover:text-[#452414] py-2 px-3 rounded-xl hover:bg-[#FAF7F2] dark:hover:bg-[#2F241C] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restaurar Padrões
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#6B3F2A] dark:text-[#D8BDB0] hover:bg-[#FAF7F2] rounded-full transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 text-xs font-semibold text-white bg-[#502916] hover:bg-[#6B3F2A] rounded-full shadow-sm transition-all flex items-center gap-1.5"
            >
              {savedNotice ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  Salvo!
                </>
              ) : (
                'Salvar Alterações'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
