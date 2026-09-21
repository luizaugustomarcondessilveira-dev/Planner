import React, { useEffect } from 'react';
import { Bell, Clock, MapPin, Users, VolumeX, CheckCircle, Sparkles, X } from 'lucide-react';
import { ActiveAlarmPopup, AlarmSoundType } from '../../types';
import { soundEffects } from '../../utils/audio';

interface AppointmentAlarmPopupProps {
  alarm: ActiveAlarmPopup | null;
  soundType: AlarmSoundType;
  loopSound?: boolean;
  onDismiss: () => void;
  onSnooze: (minutes: number) => void;
}

export const AppointmentAlarmPopup: React.FC<AppointmentAlarmPopupProps> = ({
  alarm,
  soundType,
  loopSound = true,
  onDismiss,
  onSnooze,
}) => {
  useEffect(() => {
    let autoStopTimer: ReturnType<typeof setTimeout> | null = null;
    if (alarm) {
      if (loopSound) {
        soundEffects.startAlarmLoop(soundType);
        // Parar o som (não o pop-up) após 2 minutos
        autoStopTimer = setTimeout(() => {
          soundEffects.stopAlarmLoop();
        }, 2 * 60 * 1000);
      } else {
        soundEffects.playAlarmSound(soundType);
      }

      // Attempt mobile vibration if supported
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([300, 200, 300, 200, 500]);
        } catch (e) {}
      }
    }

    return () => {
      if (autoStopTimer) clearTimeout(autoStopTimer);
      soundEffects.stopAlarmLoop();
    };
  }, [alarm, soundType, loopSound]);

  if (!alarm) return null;

  const handleDismiss = () => {
    soundEffects.stopAlarmLoop();
    onDismiss();
  };

  const handleSnooze = () => {
    soundEffects.stopAlarmLoop();
    onSnooze(5);
  };

  const getNoticeMessage = () => {
    if (alarm.minutesBefore === 0) {
      return 'Chegou o momento do seu compromisso!';
    }
    return `Início em ${alarm.minutesBefore} minutos! Prepare-se com serenidade.`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#231A14]/75 backdrop-blur-md animate-fade-in">
      {/* Mobile-first card container */}
      <div className="relative w-full max-w-sm sm:max-w-md bg-[#FAF7F2] dark:bg-[#1E1712] rounded-3xl border-2 border-[#E8A5B8] dark:border-[#844E5F] p-6 sm:p-7 space-y-5 shadow-2xl overflow-hidden ring-4 ring-[#E8A5B8]/30">
        {/* Delicate background pattern glow */}
        <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-[#E8A5B8]/20 dark:bg-[#E8A5B8]/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full bg-[#B88E72]/20 dark:bg-[#B88E72]/10 blur-2xl pointer-events-none" />

        {/* Top bar with close */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#B88E72] dark:text-[#E8DDD4] px-2.5 py-0.5 rounded-full bg-[#FDF4F5] dark:bg-[#38262B] border border-[#E8A5B8]/60">
            ⏰ Despertador de Compromisso
          </span>

          <button
            onClick={handleDismiss}
            className="p-1 rounded-full text-[#8C6E5E] hover:text-[#452414] dark:hover:text-[#F6F1EC]"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pulsing Bell Icon */}
        <div className="flex flex-col items-center justify-center text-center pt-1">
          <div className="relative flex items-center justify-center">
            <span className="absolute w-20 h-20 rounded-full bg-[#E8A5B8]/30 dark:bg-[#E8A5B8]/20 animate-ping pointer-events-none" />
            <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-[#6B3F2A] to-[#452414] text-white flex items-center justify-center shadow-lg ring-4 ring-[#FAF7F2] dark:ring-[#1E1712]">
              <Bell className="w-8 h-8 animate-bounce text-amber-200" />
            </div>
          </div>

          <div className="mt-4 space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FDF4F5] dark:bg-[#38262B] text-xs font-semibold text-[#844E5F] dark:text-[#F2C4CE]">
              <Clock className="w-3.5 h-3.5" />
              <span>Horário Agendado: {alarm.timeStr}</span>
            </div>

            <h3 className="font-serif text-2xl font-bold text-[#452414] dark:text-[#F6F1EC] pt-1">
              {alarm.title}
            </h3>

            {alarm.subtitle && (
              <p className="text-xs text-[#8C6E5E] dark:text-[#B59D8F] max-w-xs mx-auto leading-relaxed">
                {alarm.subtitle}
              </p>
            )}

            {alarm.location && (
              <div className="pt-1 flex items-center justify-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] text-[11px] font-medium text-[#6B3F2A] dark:text-[#E8DDD4]">
                  <MapPin className="w-3.5 h-3.5 text-[#B88E72] shrink-0" />
                  <span className="truncate max-w-[220px]">{alarm.location}</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Notice alert pill */}
        <div className="p-3 rounded-2xl bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] text-center space-y-1">
          <p className="text-xs font-semibold text-[#6B3F2A] dark:text-[#E8DDD4]">
            {getNoticeMessage()}
          </p>
          <p className="text-[11px] text-[#8C6E5E] dark:text-[#B59D8F] italic flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 text-[#B88E72]" />
            Som suave ativo tocando na frequência de paz
          </p>
        </div>

        {/* Action Buttons: Big & Touch-friendly for Mobile */}
        <div className="space-y-2 pt-1">
          <button
            onClick={handleDismiss}
            className="w-full py-3.5 px-4 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-[#502916] to-[#6B3F2A] hover:opacity-95 shadow-md flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
          >
            <CheckCircle className="w-4 h-4 text-emerald-300" />
            <span>Estou Ciente / Desligar Alarme</span>
          </button>

          <button
            onClick={handleSnooze}
            className="w-full py-2.5 px-4 rounded-2xl text-xs font-medium text-[#6B3F2A] dark:text-[#E8DDD4] bg-white dark:bg-[#251D17] hover:bg-[#F0EDE9] dark:hover:bg-[#2F241C] border border-[#EBDED5] dark:border-[#3D2E24] flex items-center justify-center gap-1.5 transition-colors"
          >
            <VolumeX className="w-3.5 h-3.5 text-[#B88E72]" />
            <span>Adiar 5 minutos (Soneca serena)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
