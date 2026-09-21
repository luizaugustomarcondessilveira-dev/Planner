import React, { useState, useEffect } from 'react';
import {
  X,
  Bell,
  Volume2,
  Clock,
  Play,
  Check,
  Sparkles,
  Smartphone,
  ShieldCheck,
  Repeat,
  Radio,
} from 'lucide-react';
import { AgendaAlarmConfig, AlarmSoundType } from '../../types';
import { soundEffects } from '../../utils/audio';

interface AlarmSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AgendaAlarmConfig;
  onUpdateConfig?: (config: AgendaAlarmConfig) => void;
  onSaveConfig?: (config: AgendaAlarmConfig) => void;
  onTriggerTestAlarm?: () => void;
  onTestSound?: (sound: AlarmSoundType) => void;
}

const SOUND_OPTIONS: { id: AlarmSoundType; name: string; desc: string; icon: string }[] = [
  {
    id: 'sino-sereno',
    name: 'Sino Sereno de Mosteiro',
    desc: 'Harmônicos suaves e reflexivos com três tons pacíficos.',
    icon: '🔔',
  },
  {
    id: 'harpa-aurora',
    name: 'Harpa da Aurora',
    desc: 'Arpejo celestial ascendente com ressonância doce.',
    icon: '🎵',
  },
  {
    id: 'carrilhao-zen',
    name: 'Carrilhão Zen',
    desc: 'Sinos pentatônicos inspirados em brisas de jardim.',
    icon: '🎐',
  },
  {
    id: 'despertador-alento',
    name: 'Despertador Alento',
    desc: 'Pulso rítmico harmônico que desperta com gentileza.',
    icon: '⏰',
  },
  {
    id: 'gotas-tranquilas',
    name: 'Gotas Tranquilas',
    desc: 'Sequência relaxante de gotas de água cristalina.',
    icon: '💧',
  },
];

const MINUTES_BEFORE_OPTIONS = [
  { value: 0, label: 'Na hora do compromisso' },
  { value: 5, label: '5 minutos antes' },
  { value: 10, label: '10 minutos antes' },
  { value: 15, label: '15 minutos antes' },
  { value: 30, label: '30 minutos antes' },
  { value: 60, label: '1 hora antes' },
];

export const AlarmSettingsModal: React.FC<AlarmSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  onSaveConfig,
  onTriggerTestAlarm,
  onTestSound,
}) => {
  const [enabled, setEnabled] = useState(config.enabled ?? true);
  const [sound, setSound] = useState<AlarmSoundType>(config.sound || 'sino-sereno');
  const [minutesBefore, setMinutesBefore] = useState(config.minutesBefore ?? 5);
  const [loopSound, setLoopSound] = useState(config.loopSound ?? true);
  const [previewingSound, setPreviewingSound] = useState<AlarmSoundType | null>(null);

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  // Ressincronizar estados locais sempre que o modal abrir ou a config mudar
  useEffect(() => {
    if (isOpen) {
      setEnabled(config.enabled ?? true);
      setSound(config.sound || 'sino-sereno');
      setMinutesBefore(config.minutesBefore ?? 5);
      setLoopSound(config.loopSound ?? true);
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setNotificationPermission(Notification.permission);
      }
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  const handleRequestNotification = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotificationPermission(perm);
      } catch (e) {
        console.warn('Notification permission error:', e);
      }
    }
  };

  const handlePlayPreview = (soundType: AlarmSoundType) => {
    setPreviewingSound(soundType);
    if (onTestSound) {
      onTestSound(soundType);
    } else {
      soundEffects.playAlarmSound(soundType);
    }
    setTimeout(() => {
      setPreviewingSound(null);
    }, 1800);
  };

  const saveConfiguration = (newConfig: AgendaAlarmConfig) => {
    if (onUpdateConfig) {
      onUpdateConfig(newConfig);
    } else if (onSaveConfig) {
      onSaveConfig(newConfig);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveConfiguration({
      ...config,
      enabled,
      sound,
      minutesBefore,
      loopSound,
    });
    onClose();
  };

  const handleTestSimulation = () => {
    saveConfiguration({
      ...config,
      enabled,
      sound,
      minutesBefore,
      loopSound,
    });
    onClose();
    setTimeout(() => {
      if (onTriggerTestAlarm) {
        onTriggerTestAlarm();
      }
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#231A14]/65 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-[#FAF7F2] dark:bg-[#1E1712] rounded-3xl border border-[#EBDED5] dark:border-[#3D2E24] p-5 sm:p-6 space-y-4 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#EBDED5]/60 dark:border-[#3D2E24] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#FDF4F5] dark:bg-[#38262B] border border-[#E8A5B8] flex items-center justify-center text-[#6B3F2A] dark:text-[#F2C4CE]">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg sm:text-xl font-semibold text-[#452414] dark:text-[#F6F1EC]">
                Despertador da Agenda
              </h3>
              <p className="text-xs text-[#8C6E5E] dark:text-[#B59D8F]">
                Alertas sonoros e avisos na tela para seus compromissos
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

        {/* Informative Note: App must be open */}
        <div className="p-3 rounded-2xl bg-[#FDF4F5] dark:bg-[#38262B] border border-[#E8A5B8]/60 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#844E5F] dark:text-[#F2C4CE] mt-0.5 shrink-0" />
          <div className="text-[11px] text-[#844E5F] dark:text-[#F2C4CE] space-y-0.5 leading-relaxed">
            <p className="font-semibold">O alarme toca com o app aberto</p>
            <p className="text-[10.5px] opacity-90">
              Mantenha o Atelier Alento aberto em sua aba para receber os avisos e toques no horário programado.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Master Toggle */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] flex items-center justify-between gap-3 shadow-2xs">
            <div>
              <span className="text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] block">
                Ativar Despertador Automático
              </span>
              <span className="text-[11px] text-[#8C6E5E] dark:text-[#B59D8F]">
                Toca o alarme e exibe pop-up na tela ao chegar o horário do compromisso
              </span>
            </div>

            <button
              type="button"
              onClick={() => setEnabled((prev) => !prev)}
              className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none shrink-0 ${
                enabled ? 'bg-[#6B3F2A]' : 'bg-[#EBDED5] dark:bg-[#3D2E24]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  enabled ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Repeat Sound Loop Toggle */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] flex items-center justify-between gap-3 shadow-2xs">
            <div>
              <span className="text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] block">
                Repetir som até desligar
              </span>
              <span className="text-[11px] text-[#8C6E5E] dark:text-[#B59D8F]">
                Toca em repetição contínua até você dispensar ou colocar em soneca
              </span>
            </div>

            <button
              type="button"
              onClick={() => setLoopSound((prev) => !prev)}
              className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none shrink-0 ${
                loopSound ? 'bg-[#6B3F2A]' : 'bg-[#EBDED5] dark:bg-[#3D2E24]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  loopSound ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Time before appointment select */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#452414] dark:text-[#F6F1EC]">
              Quanto tempo antes deseja despertar?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {MINUTES_BEFORE_OPTIONS.map((opt) => {
                const isSelected = minutesBefore === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setMinutesBefore(opt.value)}
                    className={`py-2 px-3 rounded-xl text-xs font-medium text-left border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#FDF4F5] dark:bg-[#38262B] border-[#E8A5B8] text-[#452414] dark:text-[#F2C4CE] font-semibold'
                        : 'bg-white dark:bg-[#251D17] border-[#EBDED5] dark:border-[#3D2E24] text-[#8C6E5E] dark:text-[#B59D8F] hover:border-[#B88E72]'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#E8A5B8]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Sound Selection with Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-[#452414] dark:text-[#F6F1EC]">
                Escolha o Som do Despertador
              </label>
              <span className="text-[10px] text-[#8C6E5E] dark:text-[#B59D8F]">
                Toque no ícone para ouvir
              </span>
            </div>

            <div className="space-y-2">
              {SOUND_OPTIONS.map((opt) => {
                const isSelected = sound === opt.id;
                const isPlayingThis = previewingSound === opt.id;

                return (
                  <div
                    key={opt.id}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-[#FDF4F5] dark:bg-[#38262B] border-[#E8A5B8] shadow-xs'
                        : 'bg-white dark:bg-[#251D17] border-[#EBDED5] dark:border-[#3D2E24] hover:border-[#B88E72]'
                    }`}
                  >
                    <div
                      className="flex items-center gap-2.5 flex-1 cursor-pointer"
                      onClick={() => setSound(opt.id)}
                    >
                      <span className="text-xl">{opt.icon}</span>
                      <div>
                        <span className="text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] block">
                          {opt.name}
                        </span>
                        <span className="text-[11px] text-[#8C6E5E] dark:text-[#B59D8F]">
                          {opt.desc}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handlePlayPreview(opt.id)}
                        className={`p-2 rounded-xl border text-xs flex items-center gap-1 transition-all ${
                          isPlayingThis
                            ? 'bg-[#6B3F2A] text-white border-[#6B3F2A] scale-105'
                            : 'bg-white dark:bg-[#2E241E] border-[#EBDED5] dark:border-[#3D2E24] text-[#6B3F2A] dark:text-[#E8DDD4] hover:border-[#B88E72]'
                        }`}
                        title="Ouvir demonstração do som"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-semibold">Ouvir</span>
                      </button>

                      <input
                        type="radio"
                        name="alarm_sound"
                        checked={isSelected}
                        onChange={() => setSound(opt.id)}
                        className="w-4 h-4 accent-[#6B3F2A] ml-1"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Browser Notification Permission (Optional integration) */}
          {typeof window !== 'undefined' && 'Notification' in window && (
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] flex items-center justify-between gap-3 shadow-2xs">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-[#452414] dark:text-[#F6F1EC] block">
                  Notificações do Navegador
                </span>
                <span className="text-[11px] text-[#8C6E5E] dark:text-[#B59D8F]">
                  Receba alertas mesmo com o navegador minimizado
                </span>
              </div>

              {notificationPermission === 'granted' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 shrink-0">
                  <Check className="w-3 h-3" />
                  Ativadas
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleRequestNotification}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#6B3F2A] dark:text-[#E8DDD4] bg-[#FDF4F5] dark:bg-[#38262B] border border-[#E8A5B8] hover:bg-[#F6EBE5] transition-colors shrink-0"
                >
                  Ativar
                </button>
              )}
            </div>
          )}

          {/* Test Button (Simulate Pop-up immediately) */}
          <div className="p-3 rounded-2xl bg-[#F6F3EE] dark:bg-[#251D17] border border-[#EBDED5] dark:border-[#3D2E24] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#B88E72]" />
              <div className="text-[11px] text-[#8C6E5E] dark:text-[#B59D8F]">
                <span className="font-semibold text-[#452414] dark:text-[#F6F1EC] block">
                  Simulação do Pop-up Mobile
                </span>
                Veja como o alarme aparecerá na tela do seu aparelho
              </div>
            </div>

            <button
              type="button"
              onClick={handleTestSimulation}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#6B3F2A] dark:text-[#F2C4CE] bg-white dark:bg-[#382B22] border border-[#E8A5B8] hover:bg-[#FDF4F5] shrink-0"
            >
              Testar Agora
            </button>
          </div>

          {/* Save Footer */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EBDED5]/60 dark:border-[#3D2E24]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#8C6E5E] hover:text-[#452414] dark:hover:text-[#F6F1EC]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-semibold text-white bg-[#502916] hover:bg-[#6B3F2A] rounded-full shadow-sm"
            >
              Salvar Preferências
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
