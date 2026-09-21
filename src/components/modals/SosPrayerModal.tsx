import React, { useState, useEffect } from 'react';
import { X, Heart, Wind, Sparkles, Volume2, VolumeX, CheckCircle2 } from 'lucide-react';

interface SosPrayerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRAYERS = [
  {
    verse: 'Filipenses 4:6-7',
    text: 'Não andeis ansiosos de coisa alguma; em tudo, porém, sejam conhecidas diante de Deus as vossas petições, pela oração e pela súplica, com ações de graças. E a paz de Deus, que excede todo o entendimento, guardará os vossos corações e as vossas mentes em Cristo Jesus.',
    prayer:
      'Senhor, entrego agora todas as preocupações do meu coração. Desacelero o meu passo e descanso na Tua infinita providência. Guarda minha mente em Tua paz perfeita.',
  },
  {
    verse: 'Salmos 46:10',
    text: 'Aquietai-vos e sabei que Eu sou Deus; sou exaltado entre as nações, sou exaltado na terra.',
    prayer:
      'Pai querido, em meio ao turbilhão do dia a dia, eu escolho aquietar minha alma. Reconheço que o controle está em Tuas mãos de amor.',
  },
  {
    verse: 'Mateus 11:28',
    text: 'Vinde a mim, todos os que estais cansados e sobrecarregados, e eu vos aliviarei. Tomai sobre vós o meu jugo e aprendei de mim, porque sou manso e humilde de coração; e achareis descanso para as vossas almas.',
    prayer:
      'Jesus, venho a Ti com todo o cansaço que acumulei. Recebo o Teu alívio suave e renovo minhas forças no Teu amor.',
  },
  {
    verse: 'Isaías 26:3',
    text: 'Tu guardarás em perfeita paz aquele cujo propósito está firme, porque em ti confia.',
    prayer:
      'Guarda meu pensamento em Ti, Senhor. Que nenhuma tempestade externa roube a serenidade que vem da certeza da Tua presença.',
  },
];

export const SosPrayerModal: React.FC<SosPrayerModalProps> = ({ isOpen, onClose }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [breathPhase, setBreathPhase] = useState<'Inspirar' | 'Segurar' | 'Espirar'>('Inspirar');
  const [counter, setCounter] = useState(4);
  const [isMuted, setIsMuted] = useState(true);

  // 4-7-8 breathing loop
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setCounter((prev) => {
        if (prev > 1) return prev - 1;

        // Transition phase
        if (breathPhase === 'Inspirar') {
          setBreathPhase('Segurar');
          return 7;
        } else if (breathPhase === 'Segurar') {
          setBreathPhase('Espirar');
          return 8;
        } else {
          setBreathPhase('Inspirar');
          return 4;
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, breathPhase]);

  if (!isOpen) return null;

  const active = PRAYERS[currentIdx];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#452414]/45 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#FAF7F2] rounded-3xl border border-[#EBDED5] shadow-2xl p-6 md:p-8 overflow-hidden">
        {/* Soft decorative background circles */}
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#FDF4F5] pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-[#F2C4CE]/20 pointer-events-none" />

        {/* Close & Mute Header */}
        <div className="flex items-center justify-between relative z-10 mb-5">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-full bg-[#FDF4F5] border border-[#E8A5B8] text-[#6B3F2A]">
              <Heart className="w-4 h-4 fill-[#E8A5B8] text-[#E8A5B8]" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8C6E5E]">
              SOS Oração & Paz
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 rounded-full text-[#8C6E5E] hover:bg-white transition-colors"
              title={isMuted ? 'Ativar som suave' : 'Silenciar'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#6B3F2A]" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-[#8C6E5E] hover:bg-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Breathing Circle Exercise */}
        <div className="flex flex-col items-center justify-center my-6 relative z-10">
          <div className="relative flex items-center justify-center">
            {/* Animated outer ring */}
            <div
              className={`w-36 h-36 rounded-full border-2 border-[#E8A5B8] flex items-center justify-center transition-all duration-1000 ${
                breathPhase === 'Inspirar'
                  ? 'scale-110 bg-[#FDF4F5] shadow-lg shadow-[#E8A5B8]/20'
                  : breathPhase === 'Segurar'
                  ? 'scale-110 bg-[#F2C4CE]/40 shadow-md shadow-[#E8A5B8]/30'
                  : 'scale-95 bg-white/60'
              }`}
            >
              <div className="text-center">
                <Wind className="w-6 h-6 mx-auto mb-1 text-[#6B3F2A] animate-pulse" />
                <span className="block text-xs uppercase tracking-widest text-[#8C6E5E] font-medium">
                  {breathPhase}
                </span>
                <span className="font-serif text-3xl font-semibold text-[#452414] leading-tight">
                  {counter}s
                </span>
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs text-[#8C6E5E] text-center max-w-xs">
            Respire devagar. Sinta o ar preencher seus pulmões e solte as tensões do corpo.
          </p>
        </div>

        {/* Scripture & Prayer Card */}
        <div className="p-5 rounded-2xl bg-white border border-[#EBDED5] relative z-10 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-[#B88E72]">
              Palavra de Alento
            </span>
            <span className="text-xs font-serif font-bold text-[#6B3F2A]">
              {active.verse}
            </span>
          </div>

          <p className="font-serif italic text-sm text-[#452414] leading-relaxed">
            "{active.text}"
          </p>

          <div className="pt-2 border-t border-[#EBDED5]/60">
            <span className="text-[11px] font-semibold text-[#8C6E5E] block mb-1">
              Oração Guiada:
            </span>
            <p className="text-xs text-[#51443E] leading-relaxed">
              {active.prayer}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex items-center justify-between gap-3 relative z-10">
          <button
            onClick={() => setCurrentIdx((prev) => (prev + 1) % PRAYERS.length)}
            className="px-4 py-2.5 rounded-full text-xs font-medium text-[#6B3F2A] bg-white border border-[#EBDED5] hover:bg-[#FAF7F2] transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#E8A5B8]" />
            Próxima Promessa
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-full text-xs font-semibold text-white bg-[#6B3F2A] hover:bg-[#502916] shadow-sm transition-all flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            Estou em Paz
          </button>
        </div>
      </div>
    </div>
  );
};
