export interface MusicNote {
  frequency: number;
  duration: number;
  startTime: number;
  velocity: number;
}

export interface MusicPattern {
  melody: number[];
  bass: number[];
  tempo: number;
  key: string;
}

export class ProceduralMusic {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private melodyGain: GainNode | null = null;
  private bassGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private isPlaying: boolean = false;
  private currentPattern: MusicPattern | null = null;
  private scheduledNotes: AudioScheduledSourceNode[] = [];
  private beatInterval: number = 0;
  private nextNoteTime: number = 0;
  private currentStep: number = 0;
  private timeOfDay: string = 'Day';
  private maxScheduledNotes: number = 20; // Limit active notes for performance

  // Musical scales and patterns
  private patterns: Record<string, MusicPattern> = {
    dawn: {
      melody: [0, 2, 4, 2, 0, -1, 0, 2], // C-D-E-D-C-B-C-D pattern
      bass: [0, -7, -5, -7], // C-F-G-F bass line
      tempo: 90, // BPM
      key: 'C'
    },
    day: {
      melody: [0, 4, 7, 4, 0, 2, 4, 0], // C-E-G-E-C-D-E-C pattern
      bass: [0, -7, -5, -3], // C-F-G-A bass line
      tempo: 110, // Slightly faster for day
      key: 'C'
    },
    sunset: {
      melody: [0, 3, 7, 5, 2, 0, -1, 0], // C-Eb-G-F-D-C-B-C pattern
      bass: [0, -8, -5, -7], // C-E-G-F bass line
      tempo: 85, // Slower, more contemplative
      key: 'C'
    },
    night: {
      melody: [0, -2, -4, -2, 0, 2, 0, -2], // C-Bb-Ab-Bb-C-D-C-Bb pattern
      bass: [0, -7, -10, -7], // C-F-D-F bass line
      tempo: 75, // Slowest, most peaceful
      key: 'C'
    }
  };

  // Note frequencies (C4 = 261.63 Hz as base)
  private baseFrequency: number = 261.63; // C4
  private noteFrequencies: Record<number, number> = {
    '-10': 146.83, // D3
    '-8': 164.81,  // E3
    '-7': 174.61,  // F3
    '-5': 196.00,  // G3
    '-4': 207.65,  // Ab3
    '-3': 220.00,  // A3
    '-2': 233.08,  // Bb3
    '-1': 246.94,  // B3
    '0': 261.63,   // C4
    '2': 293.66,   // D4
    '3': 311.13,   // Eb4
    '4': 329.63,   // E4
    '5': 349.23,   // F4
    '7': 392.00,   // G4
    '9': 440.00,   // A4
  };

  constructor() {
    // Don't initialize audio immediately to avoid SSR issues
    // Audio will be initialized when start() is called
  }

  private initAudio(): void {
    // Only initialize if we haven't already and we're in the browser
    if (this.audioContext || typeof window === 'undefined') return;

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create gain nodes for different instrument groups
      this.masterGain = this.audioContext.createGain();
      this.melodyGain = this.audioContext.createGain();
      this.bassGain = this.audioContext.createGain();
      this.ambientGain = this.audioContext.createGain();

      // Connect gain nodes
      this.melodyGain.connect(this.masterGain);
      this.bassGain.connect(this.masterGain);
      this.ambientGain.connect(this.masterGain);
      this.masterGain.connect(this.audioContext.destination);

      // Set initial volumes (reduced for better balance with sound effects)
      this.masterGain.gain.value = 0.08; // Reduced from 0.15 to 0.08
      this.melodyGain.gain.value = 0.6;  // Reduced from 0.7
      this.bassGain.gain.value = 0.3;    // Reduced from 0.4
      this.ambientGain.gain.value = 0.2; // Reduced from 0.3

    } catch (error) {
      console.warn('Failed to initialize audio context for music:', error);
    }
  }

  public setTimeOfDay(timeOfDay: string): void {
    const normalizedTime = timeOfDay.toLowerCase();
    if (this.timeOfDay !== normalizedTime) {
      this.timeOfDay = normalizedTime;
      this.currentPattern = this.patterns[normalizedTime] || this.patterns.day;
      
      if (this.isPlaying) {
        this.updateTempo();
      }
    }
  }

  private updateTempo(): void {
    if (this.currentPattern && this.audioContext) {
      const beatsPerSecond = this.currentPattern.tempo / 60;
      this.beatInterval = 1 / beatsPerSecond;
    }
  }

  public start(): void {
    // Initialize audio context when starting (browser-only)
    this.initAudio();
    
    if (!this.audioContext || this.isPlaying) return;

    // Resume audio context if suspended
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.isPlaying = true;
    this.currentPattern = this.patterns[this.timeOfDay] || this.patterns.day;
    this.updateTempo();
    this.nextNoteTime = this.audioContext.currentTime;
    this.currentStep = 0;

    this.scheduleNotes();
  }

  public stop(): void {
    this.isPlaying = false;
    
    // Stop all scheduled notes efficiently
    this.scheduledNotes.forEach(source => {
      try {
        source.stop();
      } catch (e) {
        // Note might already be stopped
      }
    });
    this.scheduledNotes.length = 0; // Clear array efficiently
  }

  public setVolume(volume: number): void {
    if (this.masterGain) {
      // Further reduce max volume for better balance
      this.masterGain.gain.setTargetAtTime(volume * 0.08, this.audioContext!.currentTime, 0.1);
    }
  }

  private scheduleNotes(): void {
    if (!this.isPlaying || !this.audioContext || !this.currentPattern) return;

    const currentTime = this.audioContext.currentTime;
    const lookahead = 0.15; // Increased from 0.1 to reduce CPU overhead

    while (this.nextNoteTime < currentTime + lookahead) {
      this.playMelodyNote(this.nextNoteTime);
      this.playBassNote(this.nextNoteTime);
      
      // Reduce ambient note frequency for performance
      if (this.currentStep % 8 === 0) { // Changed from every 4 beats to every 8 beats
        this.playAmbientNote(this.nextNoteTime);
      }

      this.nextNoteTime += this.beatInterval;
      this.currentStep = (this.currentStep + 1) % 8;
    }

    // Reduce scheduling frequency for better performance
    setTimeout(() => this.scheduleNotes(), 50); // Changed from 25ms to 50ms
  }

  private playMelodyNote(startTime: number): void {
    if (!this.audioContext || !this.currentPattern) return;

    const pattern = this.currentPattern.melody;
    const noteIndex = this.currentStep % pattern.length;
    const semitoneOffset = pattern[noteIndex];
    const frequency = this.noteFrequencies[semitoneOffset] || this.baseFrequency;

    this.playNote(frequency, startTime, this.beatInterval * 0.8, this.melodyGain!, 'sine');
  }

  private playBassNote(startTime: number): void {
    if (!this.audioContext || !this.currentPattern) return;

    // Bass plays every 2 beats
    if (this.currentStep % 2 !== 0) return;

    const pattern = this.currentPattern.bass;
    const noteIndex = Math.floor(this.currentStep / 2) % pattern.length;
    const semitoneOffset = pattern[noteIndex];
    const frequency = this.noteFrequencies[semitoneOffset] || this.baseFrequency;

    this.playNote(frequency, startTime, this.beatInterval * 1.6, this.bassGain!, 'triangle');
  }

  private playAmbientNote(startTime: number): void {
    if (!this.audioContext) return;

    // Play a soft chord based on time of day
    const ambientFreqs = this.getAmbientFrequencies();
    
    ambientFreqs.forEach((freq, index) => {
      setTimeout(() => {
        this.playNote(freq, startTime + index * 0.05, this.beatInterval * 3, this.ambientGain!, 'sine');
      }, index * 20);
    });
  }

  private getAmbientFrequencies(): number[] {
    switch (this.timeOfDay) {
      case 'dawn':
        return [this.noteFrequencies[0], this.noteFrequencies[4], this.noteFrequencies[7]]; // C-E-G
      case 'day':
        return [this.noteFrequencies[0], this.noteFrequencies[4], this.noteFrequencies[7], this.noteFrequencies[9]]; // C-E-G-A
      case 'sunset':
        return [this.noteFrequencies[0], this.noteFrequencies[3], this.noteFrequencies[7]]; // C-Eb-G
      case 'night':
        return [this.noteFrequencies[0], this.noteFrequencies[-2], this.noteFrequencies[7]]; // C-Bb-G
      default:
        return [this.noteFrequencies[0], this.noteFrequencies[4], this.noteFrequencies[7]]; // C-E-G
    }
  }

  private playNote(
    frequency: number, 
    startTime: number, 
    duration: number, 
    gainNode: GainNode, 
    waveType: OscillatorType = 'sine'
  ): void {
    if (!this.audioContext) return;

    // Don't create new notes if we have too many scheduled (performance optimization)
    if (this.scheduledNotes.length >= this.maxScheduledNotes) {
      return;
    }

    try {
      const oscillator = this.audioContext.createOscillator();
      const noteGain = this.audioContext.createGain();

      oscillator.connect(noteGain);
      noteGain.connect(gainNode);

      oscillator.frequency.setValueAtTime(frequency, startTime);
      oscillator.type = waveType;

      // Envelope: attack, sustain, release
      const attackTime = 0.05;
      const releaseTime = 0.1;
      const sustainLevel = 0.25; // Reduced from 0.3 to 0.25 for less CPU load

      noteGain.gain.setValueAtTime(0, startTime);
      noteGain.gain.linearRampToValueAtTime(sustainLevel, startTime + attackTime);
      noteGain.gain.setValueAtTime(sustainLevel, startTime + duration - releaseTime);
      noteGain.gain.linearRampToValueAtTime(0, startTime + duration);

      oscillator.start(startTime);
      oscillator.stop(startTime + duration);

      this.scheduledNotes.push(oscillator);

      // Clean up finished notes more efficiently
      oscillator.onended = () => {
        const index = this.scheduledNotes.indexOf(oscillator);
        if (index > -1) {
          this.scheduledNotes.splice(index, 1);
        }
      };

    } catch (error) {
      console.warn('Failed to play note:', error);
    }
  }

  public isActive(): boolean {
    return this.isPlaying;
  }

  public fadeIn(duration: number = 2): void {
    if (!this.masterGain || !this.audioContext) return;

    this.masterGain.gain.setValueAtTime(0, this.audioContext.currentTime);
    this.masterGain.gain.linearRampToValueAtTime(0.08, this.audioContext.currentTime + duration); // Reduced target volume
  }

  public fadeOut(duration: number = 2): void {
    if (!this.masterGain || !this.audioContext) return;

    this.masterGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);
    setTimeout(() => this.stop(), duration * 1000);
  }
} 