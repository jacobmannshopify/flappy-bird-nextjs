'use client';

export type SoundType = 'flap' | 'score' | 'collision' | 'achievement' | 'button' | 'highScore' | 'medal';

export interface SoundSettings {
  masterVolume: number;
  muted: boolean;
  soundEffectsEnabled: boolean;
}

export class SoundManager {
  private audioContext: AudioContext | null = null;
  private settings: SoundSettings = {
    masterVolume: 0.7,
    muted: false,
    soundEffectsEnabled: true
  };
  private initialized = false;
  private gainNode: GainNode | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadSettings();
    }
  }

  // Initialize the audio context (must be called after user interaction)
  async initialize(): Promise<void> {
    if (this.initialized || typeof window === 'undefined') return;

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.updateVolume();
      this.initialized = true;
      console.log('Sound manager initialized successfully');
    } catch (error) {
      console.warn('Failed to initialize audio context:', error);
    }
  }

  // Create a programmatic flap sound (bird wing flap)
  private createFlapSound(): void {
    if (!this.audioContext || !this.gainNode) return;

    const oscillator = this.audioContext.createOscillator();
    const envelope = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    // Configure filter for a "whoosh" effect
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.audioContext.currentTime);
    filter.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.1);

    // Wing flap frequency sweep
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(80, this.audioContext.currentTime + 0.1);

    // Envelope for quick attack and decay
    envelope.gain.setValueAtTime(0, this.audioContext.currentTime);
    envelope.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01);
    envelope.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.15);

    // Connect the chain
    oscillator.connect(filter);
    filter.connect(envelope);
    envelope.connect(this.gainNode);

    // Play the sound
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.15);
  }

  // Create a scoring sound (pleasant ding)
  private createScoreSound(): void {
    if (!this.audioContext || !this.gainNode) return;

    const oscillator1 = this.audioContext.createOscillator();
    const oscillator2 = this.audioContext.createOscillator();
    const envelope = this.audioContext.createGain();

    // Two-tone bell sound
    oscillator1.type = 'sine';
    oscillator1.frequency.setValueAtTime(800, this.audioContext.currentTime);
    
    oscillator2.type = 'sine';
    oscillator2.frequency.setValueAtTime(1200, this.audioContext.currentTime);

    // Bell-like envelope
    envelope.gain.setValueAtTime(0, this.audioContext.currentTime);
    envelope.gain.linearRampToValueAtTime(0.4, this.audioContext.currentTime + 0.01);
    envelope.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.8);

    // Connect both oscillators
    oscillator1.connect(envelope);
    oscillator2.connect(envelope);
    envelope.connect(this.gainNode);

    // Play the sound
    oscillator1.start(this.audioContext.currentTime);
    oscillator2.start(this.audioContext.currentTime);
    oscillator1.stop(this.audioContext.currentTime + 0.8);
    oscillator2.stop(this.audioContext.currentTime + 0.8);
  }

  // Create a collision sound (dramatic thud)
  private createCollisionSound(): void {
    if (!this.audioContext || !this.gainNode) return;

    // Create noise for impact
    const bufferSize = this.audioContext.sampleRate * 0.3;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const output = buffer.getChannelData(0);

    // Generate noise
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
    }

    const noiseSource = this.audioContext.createBufferSource();
    noiseSource.buffer = buffer;

    // Add a low-frequency thump
    const oscillator = this.audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(60, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(20, this.audioContext.currentTime + 0.3);

    const envelope = this.audioContext.createGain();
    envelope.gain.setValueAtTime(0, this.audioContext.currentTime);
    envelope.gain.linearRampToValueAtTime(0.8, this.audioContext.currentTime + 0.01);
    envelope.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.5);

    // Mix noise and thump
    const mixer = this.audioContext.createGain();
    mixer.gain.setValueAtTime(0.7, this.audioContext.currentTime);

    noiseSource.connect(mixer);
    oscillator.connect(mixer);
    mixer.connect(envelope);
    envelope.connect(this.gainNode);

    // Play the sound
    noiseSource.start(this.audioContext.currentTime);
    oscillator.start(this.audioContext.currentTime);
    noiseSource.stop(this.audioContext.currentTime + 0.3);
    oscillator.stop(this.audioContext.currentTime + 0.5);
  }

  // Create an achievement sound (celebratory)
  private createAchievementSound(): void {
    if (!this.audioContext || !this.gainNode) return;

    const frequencies = [523, 659, 784, 1047]; // C major arpeggio
    frequencies.forEach((freq, index) => {
      const oscillator = this.audioContext!.createOscillator();
      const envelope = this.audioContext!.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, this.audioContext!.currentTime);

      const startTime = this.audioContext!.currentTime + index * 0.1;
      envelope.gain.setValueAtTime(0, startTime);
      envelope.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
      envelope.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);

      oscillator.connect(envelope);
      envelope.connect(this.gainNode!);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.5);
    });
  }

  // Create a button click sound
  private createButtonSound(): void {
    if (!this.audioContext || !this.gainNode) return;

    const oscillator = this.audioContext.createOscillator();
    const envelope = this.audioContext.createGain();

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(1000, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.1);

    envelope.gain.setValueAtTime(0, this.audioContext.currentTime);
    envelope.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 0.01);
    envelope.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);

    oscillator.connect(envelope);
    envelope.connect(this.gainNode);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.1);
  }

  // Create a high score celebration sound
  private createHighScoreSound(): void {
    if (!this.audioContext || !this.gainNode) return;

    // Play achievement sound followed by ascending melody
    this.createAchievementSound();
    
    setTimeout(() => {
      const frequencies = [523, 587, 659, 698, 784, 880, 988, 1047]; // C major scale
      frequencies.forEach((freq, index) => {
        const oscillator = this.audioContext!.createOscillator();
        const envelope = this.audioContext!.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, this.audioContext!.currentTime);

        const startTime = this.audioContext!.currentTime + index * 0.08;
        envelope.gain.setValueAtTime(0, startTime);
        envelope.gain.linearRampToValueAtTime(0.25, startTime + 0.01);
        envelope.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

        oscillator.connect(envelope);
        envelope.connect(this.gainNode!);

        oscillator.start(startTime);
        oscillator.stop(startTime + 0.3);
      });
    }, 600);
  }

  // Create medal award sound
  private createMedalSound(): void {
    if (!this.audioContext || !this.gainNode) return;

    // Triumphant fanfare
    const chord = [523, 659, 784]; // C major chord
    chord.forEach((freq, index) => {
      const oscillator = this.audioContext!.createOscillator();
      const envelope = this.audioContext!.createGain();

      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(freq, this.audioContext!.currentTime);

      envelope.gain.setValueAtTime(0, this.audioContext!.currentTime);
      envelope.gain.linearRampToValueAtTime(0.3, this.audioContext!.currentTime + 0.1);
      envelope.gain.exponentialRampToValueAtTime(0.001, this.audioContext!.currentTime + 1.2);

      oscillator.connect(envelope);
      envelope.connect(this.gainNode!);

      oscillator.start(this.audioContext!.currentTime);
      oscillator.stop(this.audioContext!.currentTime + 1.2);
    });
  }

  // Public method to play sounds
  async playSound(type: SoundType): Promise<void> {
    if (!this.settings.soundEffectsEnabled || this.settings.muted) return;

    // Initialize audio context on first interaction
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.audioContext || !this.gainNode) return;

    // Resume audio context if suspended (mobile requirement)
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    try {
      switch (type) {
        case 'flap':
          this.createFlapSound();
          break;
        case 'score':
          this.createScoreSound();
          break;
        case 'collision':
          this.createCollisionSound();
          break;
        case 'achievement':
          this.createAchievementSound();
          break;
        case 'button':
          this.createButtonSound();
          break;
        case 'highScore':
          this.createHighScoreSound();
          break;
        case 'medal':
          this.createMedalSound();
          break;
      }
    } catch (error) {
      console.warn('Failed to play sound:', error);
    }
  }

  // Volume controls
  setVolume(volume: number): void {
    this.settings.masterVolume = Math.max(0, Math.min(1, volume));
    this.updateVolume();
    this.saveSettings();
  }

  getVolume(): number {
    return this.settings.masterVolume;
  }

  toggleMute(): void {
    this.settings.muted = !this.settings.muted;
    this.updateVolume();
    this.saveSettings();
  }

  isMuted(): boolean {
    return this.settings.muted;
  }

  setSoundEffectsEnabled(enabled: boolean): void {
    this.settings.soundEffectsEnabled = enabled;
    this.saveSettings();
  }

  isSoundEffectsEnabled(): boolean {
    return this.settings.soundEffectsEnabled;
  }

  private updateVolume(): void {
    if (this.gainNode) {
      this.gainNode.gain.setValueAtTime(
        this.settings.muted ? 0 : this.settings.masterVolume,
        this.audioContext?.currentTime || 0
      );
    }
  }

  // Settings persistence
  private saveSettings(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('flappy-bird-sound-settings', JSON.stringify(this.settings));
    }
  }

  private loadSettings(): void {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('flappy-bird-sound-settings');
      if (saved) {
        try {
          this.settings = { ...this.settings, ...JSON.parse(saved) };
        } catch (error) {
          console.warn('Failed to load sound settings:', error);
        }
      }
    }
  }

  // Get current settings
  getSettings(): SoundSettings {
    return { ...this.settings };
  }

  // Audio context state
  getAudioContextState(): string {
    return this.audioContext?.state || 'not-initialized';
  }

  // Check if audio is supported
  isAudioSupported(): boolean {
    return typeof window !== 'undefined' && 
           (window.AudioContext || (window as any).webkitAudioContext) !== undefined;
  }

  // Cleanup
  destroy(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.gainNode = null;
      this.initialized = false;
    }
  }
}

// Global sound manager instance
export const soundManager = new SoundManager(); 