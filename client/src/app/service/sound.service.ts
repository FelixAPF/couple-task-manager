import { Injectable } from '@angular/core';
import { CardEffectType } from '../model/blind-box.model';

@Injectable({ providedIn: 'root' })
export class SoundService {
  private audioCtx: AudioContext | null = null;
  private keyAddedAudio: HTMLAudioElement = new Audio('assets/sounds/key_added.wav');
  private revealCardAudio: HTMLAudioElement = new Audio('assets/sounds/reveal_standard.mp3');
  private revealHolographicAudio: HTMLAudioElement = new Audio('assets/sounds/reveal_holographic.mp3');
  private revealRainbowAudio: HTMLAudioElement = new Audio('assets/sounds/reveal_card.mp3');
  private revealFoilAudio: HTMLAudioElement = new Audio('assets/sounds/reveal_foil.mp3');
  private tearEffectAudio: HTMLAudioElement = new Audio('assets/sounds/tear_effect.mp3');
  private forgeAudio: HTMLAudioElement = new Audio('assets/sounds/forge.mp3');
  private revealLightningAudio: HTMLAudioElement = new Audio('assets/sounds/reveal_lightning.mp3');
  public isMuted: boolean = localStorage.getItem('pokedex_sound_muted') === 'true';

  constructor(){
    this.keyAddedAudio.volume = 0.5; // Adjust default volume (0.0 to 1.0)
    this.keyAddedAudio.load();
  }

  private getContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('pokedex_sound_muted', String(this.isMuted));
    return this.isMuted;
  }

  playKeyClick(): void {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {}
  }

  playForgeAudio(): void {
    if (this.isMuted) return;
    try {
        this.forgeAudio.currentTime = 0;
        this.forgeAudio.play().catch(() => {});
    } catch {}

  }

  // Son de déchirure du paquet
  playSealBreak(): void {
    if (this.isMuted) return;
    try {
        this.tearEffectAudio.currentTime = 0;
        this.tearEffectAudio.play().catch(() => {});
    } catch {}
  }

  playKeyAdded(): void {
    if (this.isMuted) return;
    try {
      // Reset playhead so rapid triggers replay immediately
      this.keyAddedAudio.currentTime = 0;
      this.keyAddedAudio.play().catch(() => {});
    } catch {}
  }

  // Grondement d'énergie qui monte en intensité (Hearthstone tension)
  playChargingRumble(): void {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(45, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.65);
      gain.gain.setValueAtTime(0.02, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 0.55);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.7);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.7);
    } catch {}
  }

  // Détonation explosion du paquet
  playBurstExplosion(): void {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const bufferSize = ctx.sampleRate * 0.45;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.45);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.45, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    } catch {}
  }

  playCardFlip(): void {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(750, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {}
  }

  playRevealSound(revealEffect: CardEffectType): void {
    if (this.isMuted) return;
    try {
        let htmlAudioElement: HTMLAudioElement;
        switch(revealEffect){
            case 'STANDARD':
                htmlAudioElement = this.revealCardAudio;
                break;
            case 'HOLOGRAPHIC':
                htmlAudioElement = this.revealHolographicAudio;
                break;
            case 'FOIL':
                htmlAudioElement = this.revealFoilAudio;
                break;
            case 'RAINBOW_SHIMMER':
                htmlAudioElement = this.revealRainbowAudio;
                break;
            case 'LIGHTNING':
            default:
                htmlAudioElement = this.revealLightningAudio;
                break;

        }
      // Reset playhead so rapid triggers replay immediately
        htmlAudioElement.currentTime = 0;
        htmlAudioElement.play().catch(() => {});
    } catch {}
  }
}