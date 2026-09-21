import { AlarmSoundType } from '../types';

/**
 * Serene Web Audio Chime synthesizer for alerts, mindfulness, and appointment alarms.
 * Plays delicate bell / harp / chime tones without external audio assets.
 */
class SoundEffects {
  private ctx: AudioContext | null = null;
  private alarmInterval: number | null = null;
  private isAlarmPlaying = false;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Unlock or resume Web Audio Context on initial user interaction.
   */
  unlockAudio() {
    try {
      const ctx = this.getContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
    } catch (e) {
      console.warn('Audio unlock error:', e);
    }
  }

  /**
   * Delicate serene bell chime for notices, timer completion, and reminders.
   */
  playSereneChime() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // Dual harmonic tones (E5 ~ 659.25Hz, B5 ~ 987.77Hz, E6 ~ 1318.5Hz)
      const frequencies = [659.25, 987.77, 1318.5];

      frequencies.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.08);

        gain.gain.setValueAtTime(0.001, now + index * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.25 / (index + 1), now + index * 0.08 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.08 + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + index * 0.08);
        osc.stop(now + index * 0.08 + 1.3);
      });
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }

  /**
   * Harpa da Aurora: Arpejo suave celestial
   */
  playHarpaAurora() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // Arpeggio notes: C5, E5, G5, B5, C6
      const notes = [523.25, 659.25, 783.99, 987.77, 1046.5];

      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + index * 0.1);

        gain.gain.setValueAtTime(0.001, now + index * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.2, now + index * 0.1 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.1 + 1.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + index * 0.1);
        osc.stop(now + index * 0.1 + 1.5);
      });
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  /**
   * Carrilhão Zen: Pentatônica suave de jardim
   */
  playCarrilhaoZen() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // Pentatonic notes: D5, F#5, A5, B5, D6
      const notes = [587.33, 739.99, 880.0, 987.77, 1174.66];

      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.12);

        gain.gain.setValueAtTime(0.001, now + index * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.22, now + index * 0.12 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.12 + 1.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + index * 0.12);
        osc.stop(now + index * 0.12 + 1.7);
      });
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  /**
   * Despertador Alento: Pulso duplo harmônico ritmado
   */
  playDespertadorAlento() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const pulses = [0, 0.22, 0.6, 0.82];

      pulses.forEach((offset, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(idx % 2 === 0 ? 880 : 1046.5, now + offset);

        gain.gain.setValueAtTime(0.001, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.28, now + offset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + offset);
        osc.stop(now + offset + 0.25);
      });
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  /**
   * Gotas Tranquilas: Sequência melódica de gotas
   */
  playGotasTranquilas() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const drops = [
        { freq1: 650, freq2: 1300, offset: 0 },
        { freq1: 750, freq2: 1500, offset: 0.18 },
        { freq1: 900, freq2: 1800, offset: 0.36 },
      ];

      drops.forEach(({ freq1, freq2, offset }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq1, now + offset);
        osc.frequency.exponentialRampToValueAtTime(freq2, now + offset + 0.1);

        gain.gain.setValueAtTime(0.2, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + offset);
        osc.stop(now + offset + 0.25);
      });
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  /**
   * Play any chosen alarm sound
   */
  playAlarmSound(soundType: AlarmSoundType) {
    switch (soundType) {
      case 'harpa-aurora':
        this.playHarpaAurora();
        break;
      case 'carrilhao-zen':
        this.playCarrilhaoZen();
        break;
      case 'despertador-alento':
        this.playDespertadorAlento();
        break;
      case 'gotas-tranquilas':
        this.playGotasTranquilas();
        break;
      case 'sino-sereno':
      default:
        this.playSereneChime();
        break;
    }
  }

  /**
   * Start a continuous alarm cycle until dismissed
   */
  startAlarmLoop(soundType: AlarmSoundType) {
    this.stopAlarmLoop();
    this.isAlarmPlaying = true;
    this.playAlarmSound(soundType);

    // Repeat every 2.8 seconds
    this.alarmInterval = window.setInterval(() => {
      if (this.isAlarmPlaying) {
        this.playAlarmSound(soundType);
      }
    }, 2800);
  }

  /**
   * Stop active alarm
   */
  stopAlarmLoop() {
    this.isAlarmPlaying = false;
    if (this.alarmInterval) {
      clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }
  }

  isAlarmActive(): boolean {
    return this.isAlarmPlaying;
  }

  /**
   * Water drop tone for hydration logging.
   */
  playWaterDrop() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.12);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }
}

export const soundEffects = new SoundEffects();
