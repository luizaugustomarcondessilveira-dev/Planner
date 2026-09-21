import React, { useState } from 'react';
import {
  X,
  Heart,
  Flame,
  Lock,
  Sparkles,
  Feather,
  Trash2,
  CheckCircle2,
  Calendar,
  Clock,
  Volume2,
} from 'lucide-react';
import { DesabafoEntry } from '../../types';
import { soundEffects } from '../../utils/audio';

interface DesabafoModalProps {
  isOpen: boolean;
  onClose: () => void;
  desabafos: DesabafoEntry[];
  onSaveDesabafo: (entry: Omit<DesabafoEntry, 'id' | 'createdAt'>) => void;
  onDeleteDesabafo: (id: string) => void;
}

const EMOTIONS = [
  { label: 'Sobrecarregada', icon: '🌧️' },
  { label: 'Ansiosa / Aflita', icon: '🍂' },
  { label: 'Coração Apertado', icon: '💔' },
  { label: 'Incompreendida', icon: '🌫️' },
  { label: 'Cansada da Rotina', icon: '🥀' },
  { label: 'Buscando Direção', icon: '🕯️' },
];

export const DesabafoModal: React.FC<DesabafoModalProps> = ({
  isOpen,
  onClose,
  desabafos,
  onSaveDesabafo,
  onDeleteDesabafo,
}) => {
  const [activeTab, setActiveTab] = useState<'escrever' | 'historico'>('escrever');
  const [selectedEmotion, setSelectedEmotion] = useState(EMOTIONS[0].label);
  const [desabafoText, setDesabafoText] = useState('');
  const [reliefNote, setReliefNote] = useState('');
  const [burningAnimation, setBurningAnimation] = useState(false);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string | null>(null);
  const [selectedEntryView, setSelectedEntryView] = useState<DesabafoEntry | null>(null);

  if (!isOpen) return null;

  const handleSave = (status: 'guardado' | 'queimado' | 'aliviado') => {
    if (!desabafoText.trim()) return;

    if (status === 'queimado') {
      setBurningAnimation(true);
      soundEffects.playSereneChime();
      setTimeout(() => {
        onSaveDesabafo({
          dateStr: new Date().toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          }),
          timeStr: new Date().toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          emotion: selectedEmotion,
          text: desabafoText.trim(),
          reliefNote: reliefNote.trim() || 'Desabafo entregue e solto ao vento com oração.',
          status: 'queimado',
        });
        setBurningAnimation(false);
        setDesabafoText('');
        setReliefNote('');
        setSavedSuccessMsg('O peso foi solto ao vento. Respire fundo, você está segura.');
        setTimeout(() => setSavedSuccessMsg(null), 3000);
      }, 1400);
      return;
    }

    soundEffects.playSereneChime();
    onSaveDesabafo({
      dateStr: new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
      timeStr: new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      emotion: selectedEmotion,
      text: desabafoText.trim(),
      reliefNote: reliefNote.trim() || undefined,
      status,
    });

    setDesabafoText('');
    setReliefNote('');
    setSavedSuccessMsg(
      status === 'guardado'
        ? 'Guardado a sete chaves no seu cantinho seguro.'
        : 'Desabafo acolhido com serenidade.'
    );
    setTimeout(() => setSavedSuccessMsg(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#231A14]/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-[#FAF7F2] dark:bg-[#1E1712] rounded-3xl border border-[#EBDED5] dark:border-[#3D2E24] shadow-2xl overflow-hidden transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EBDED5] dark:border-[#3D2E24] bg-white dark:bg-[#251D17]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#FDF4F5] dark:bg-[#38262B] border border-[#E8A5B8] flex items-center justify-center text-[#6B3F2A] dark:text-[#F2C4CE]">
              <Feather className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-semibold text-[#452414] dark:text-[#F6F1EC]">
                Cantinho do Desabafo
              </h3>
              <p className="text-xs text-[#8C6E5E] dark:text-[#B59D8F]">
                Coloque tudo para fora com acolhimento e sem julgamentos
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

        {/* Tab switch */}
        <div className="flex p-2 bg-[#F0EDE9] dark:bg-[#2A2019] border-b border-[#EBDED5] dark:border-[#3D2E24]">
          <button
            onClick={() => setActiveTab('escrever')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'escrever'
                ? 'bg-white dark:bg-[#382B22] text-[#452414] dark:text-white shadow-xs'
                : 'text-[#8C6E5E] dark:text-[#A89284] hover:text-[#452414]'
            }`}
          >
            <Feather className="w-3.5 h-3.5" />
            <span>Escrever Desabafo</span>
          </button>
          <button
            onClick={() => setActiveTab('historico')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'historico'
                ? 'bg-white dark:bg-[#382B22] text-[#452414] dark:text-white shadow-xs'
                : 'text-[#8C6E5E] dark:text-[#A89284] hover:text-[#452414]'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Desabafos Anteriores ({desabafos.length})</span>
          </button>
        </div>

        {/* Notification Toast */}
        {savedSuccessMsg && (
          <div className="p-3 mx-6 mt-3 rounded-2xl bg-[#FDF4F5] dark:bg-[#38262B] border border-[#E8A5B8] text-xs text-[#844E5F] dark:text-[#F2C4CE] flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{savedSuccessMsg}</span>
          </div>
        )}

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'escrever' ? (
            <div className={`space-y-4 transition-all duration-700 ${burningAnimation ? 'opacity-20 scale-95 filter blur-xs' : ''}`}>
              {/* Emotion Selector */}
              <div>
                <label className="block text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] mb-2">
                  Como está apertando o seu peito agora?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {EMOTIONS.map((emo) => {
                    const isSelected = selectedEmotion === emo.label;
                    return (
                      <button
                        key={emo.label}
                        type="button"
                        onClick={() => setSelectedEmotion(emo.label)}
                        className={`p-2.5 rounded-xl text-xs font-medium text-left border flex items-center gap-2 transition-all ${
                          isSelected
                            ? 'bg-[#F2C4CE] dark:bg-[#4A2D35] border-[#E8A5B8] text-[#452414] dark:text-white shadow-xs font-semibold'
                            : 'bg-white dark:bg-[#251D17] border-[#EBDED5] dark:border-[#3D2E24] text-[#8C6E5E] dark:text-[#B59D8F] hover:border-[#B88E72]'
                        }`}
                      >
                        <span className="text-base">{emo.icon}</span>
                        <span className="leading-tight">{emo.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Textarea */}
              <div>
                <label className="block text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] mb-1">
                  Escreva sem filtros. Ninguém além de você lerá isto.
                </label>
                <textarea
                  rows={6}
                  value={desabafoText}
                  onChange={(e) => setDesabafoText(e.target.value)}
                  placeholder="Desabafe tudo que está guardado... As lágrimas, as angústias, os cansaços que você não pode falar em voz alta lá fora..."
                  className="w-full p-3.5 text-xs sm:text-sm leading-relaxed rounded-2xl bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] text-[#452414] dark:text-[#F6F1EC] placeholder:text-[#8C6E5E]/60 focus:outline-none focus:border-[#6B3F2A]"
                />
              </div>

              {/* Optional Relief Note */}
              <div>
                <label className="block text-xs font-semibold text-[#8C6E5E] dark:text-[#B59D8F] mb-1">
                  Oração ou Palavra de Conforto (Opcional):
                </label>
                <input
                  type="text"
                  value={reliefNote}
                  onChange={(e) => setReliefNote(e.target.value)}
                  placeholder="Ex: Entrego isso nas Tuas mãos, Senhor. Cuida da minha mente."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] text-[#452414] dark:text-[#F6F1EC] placeholder:text-[#8C6E5E]/60 focus:outline-none focus:border-[#6B3F2A]"
                />
              </div>

              {/* Action buttons */}
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleSave('guardado')}
                  disabled={!desabafoText.trim()}
                  className="py-2.5 px-3 rounded-2xl bg-[#502916] hover:bg-[#6B3F2A] disabled:opacity-50 text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
                  title="Salvar no cantinho secreto protegido"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Guardar a 7 Chaves</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSave('queimado')}
                  disabled={!desabafoText.trim()}
                  className="py-2.5 px-3 rounded-2xl bg-gradient-to-r from-[#D96B43] to-[#B85430] hover:opacity-90 disabled:opacity-50 text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
                  title="Soltar o peso, queimar simbolicamente e entregar a Deus"
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Queimar & Soltar</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSave('aliviado')}
                  disabled={!desabafoText.trim()}
                  className="py-2.5 px-3 rounded-2xl bg-[#FDF4F5] dark:bg-[#38262B] border border-[#E8A5B8] disabled:opacity-50 text-[#844E5F] dark:text-[#F2C4CE] font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
                  title="Salvar como desabafo acolhido com paz"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Registrar Alívio</span>
                </button>
              </div>
            </div>
          ) : (
            /* Desabafos Anteriores (Histórico) */
            <div className="space-y-3">
              {desabafos.length === 0 ? (
                <div className="py-12 text-center text-[#8C6E5E] dark:text-[#B59D8F] space-y-2">
                  <Feather className="w-8 h-8 mx-auto text-[#B88E72]" />
                  <p className="text-sm font-medium">Nenhum desabafo registrado ainda.</p>
                  <p className="text-xs text-[#8C6E5E]/80">
                    Sempre que seu coração estiver pesado, este espaço estará aberto para acolher você.
                  </p>
                </div>
              ) : (
                desabafos.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] shadow-xs space-y-2 hover:border-[#B88E72] transition-all"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#452414] dark:text-[#F6F1EC]">
                          {item.emotion}
                        </span>
                        <span className="text-[11px] text-[#8C6E5E] dark:text-[#B59D8F]">
                          • {item.dateStr} às {item.timeStr}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            item.status === 'queimado'
                              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
                              : item.status === 'guardado'
                              ? 'bg-[#FAF7F2] dark:bg-[#34271E] text-[#6B3F2A] dark:text-[#D8BDB0]'
                              : 'bg-[#FDF4F5] dark:bg-[#38262B] text-[#844E5F] dark:text-[#F2C4CE]'
                          }`}
                        >
                          {item.status === 'queimado'
                            ? '🕊️ Solto ao vento'
                            : item.status === 'guardado'
                            ? '🔒 Guardado a 7 chaves'
                            : '🌿 Aliviado'}
                        </span>
                        <button
                          onClick={() => onDeleteDesabafo(item.id)}
                          className="p-1 text-[#8C6E5E] hover:text-red-600 transition-colors"
                          title="Excluir este desabafo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-[#452414] dark:text-[#E8DDD4] leading-relaxed line-clamp-3">
                      {item.text}
                    </p>

                    {item.reliefNote && (
                      <div className="p-2 rounded-xl bg-[#FAF7F2] dark:bg-[#2F241C] border border-[#EBDED5]/60 dark:border-[#3D2E24] text-[11px] text-[#6B3F2A] dark:text-[#D8BDB0] italic">
                        "{item.reliefNote}"
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
