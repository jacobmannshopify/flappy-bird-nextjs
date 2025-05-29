'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import PerformanceMonitor from './PerformanceMonitor';
import { DayNightCycle } from '../lib/dayNightCycle';
import { AchievementSystem } from '../lib/achievementSystem';
import { Achievement } from '../types/achievements';
import { PowerUp, ActivePowerUp, PowerUpType } from '../types/powerUps';
import { 
  POWER_UP_CONFIGS, 
  POWER_UP_SPAWN_CONFIG, 
  POWER_UP_VISUAL_CONFIG, 
  POWER_UP_SPAWN_WEIGHTS,
  POWER_UP_AUDIO_CONFIG 
} from '../constants/powerUps';

interface Bird {
  x: number;
  y: number;
  velocity: number;
  isAlive: boolean;
  rotation: number;  // Add rotation for death animation
}

interface Pipe {
  x: number;
  gapY: number;
  passed: boolean;
}

interface ScorePopup {
  x: number;
  y: number;
  opacity: number;
  scale: number;
  startTime: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

// Enhanced Achievement Notification interface
interface AchievementNotificationUI {
  id: string;
  achievement: Achievement;
  timestamp: number;
  animationPhase: 'sliding-in' | 'visible' | 'sliding-out';
  slideOffset: number;
  opacity: number;
  scale: number;
  autoRemoveTime: number;
}

const SimpleGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [bird, setBird] = useState<Bird>({ x: 100, y: 300, velocity: 0, isAlive: true, rotation: 0 });
  const [pipes, setPipes] = useState<Pipe[]>([]);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [scorePopups, setScorePopups] = useState<ScorePopup[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [touchFeedback, setTouchFeedback] = useState<{x: number, y: number, opacity: number} | null>(null);
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [musicVolume, setMusicVolume] = useState(0.7);
  
  // Enhanced achievement system state
  const [achievementNotifications, setAchievementNotifications] = useState<AchievementNotificationUI[]>([]);
  const [achievementProgress, setAchievementProgress] = useState<{[key: string]: {progress: number, visible: boolean}}>({});
  
  // Power-up system state
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [activePowerUps, setActivePowerUps] = useState<ActivePowerUp[]>([]);
  const lastPowerUpSpawnRef = useRef<number>(0);
  const previousShieldStateRef = useRef<boolean>(false);
  
  // Enhanced magnet trails state
  const [magnetTrails, setMagnetTrails] = useState<Array<{
    id: string;
    x: number;
    y: number;
    opacity: number;
    size: number;
    powerUpType: PowerUpType;
  }>>([]);
  
  // Performance and quality settings
  const [qualitySettings, setQualitySettings] = useState({
    particleMultiplier: 1.0,
    enableShadows: true,
    enableGradients: true,
    maxParticles: 50,
    adaptiveQuality: true
  });
  
  const animationRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const deathAnimationStartRef = useRef<number | null>(null);
  const touchFeedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fpsHistoryRef = useRef<number[]>([]);
  const lastFpsCheckRef = useRef<number>(Date.now());
  const groundOffsetRef = useRef<number>(0);
  const cloudOffsetRef = useRef<number>(0);
  const dayNightCycleRef = useRef<DayNightCycle>(new DayNightCycle());
  const proceduralMusicRef = useRef<any>(null);
  const lastTimeOfDayRef = useRef<string>('dawn');
  const musicInitializedRef = useRef<boolean>(false);
  const achievementSystemRef = useRef<AchievementSystem | null>(null);
  
  // Pre-calculate grass positions to avoid expensive random generation every frame
  const grassPositions = useRef<{x: number, heights: number[]}[]>([]);
  
  // Detect mobile device
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  // Initialize grass positions once
  useEffect(() => {
    const grass = [];
    for (let x = 0; x < CANVAS_WIDTH; x += 20) {
      grass.push({
        x,
        heights: [
          Math.random() * 15 + 5,
          Math.random() * 15 + 5 * 0.8,
          Math.random() * 15 + 5 * 0.6,
          Math.random() * 15 + 5 * 0.9
        ]
      });
    }
    grassPositions.current = grass;
  }, []);


  // Game constants - adjusted to match previous version's feel
  const GRAVITY = 0.3;                // Reduced from 0.6 to match original
  const JUMP_FORCE = -4.5;            // Reduced from -8 to match original sensitivity
  const BIRD_SIZE = 30;
  const PIPE_WIDTH = 80;
  const PIPE_SPEED = 2.5;             // Kept the same as it felt good
  const PIPE_GAP = 220;               // Increased from 180 to 220 for more vertical space
  const GROUND_HEIGHT = 120;
  
  // Mobile-responsive canvas dimensions
  const getCanvasDimensions = () => {
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        const maxWidth = Math.min(window.innerWidth - 40, 600);
        const maxHeight = Math.min(window.innerHeight - 200, 450);
        return { width: maxWidth, height: maxHeight };
      }
    }
    return { width: 800, height: 600 };
  };

  const [canvasDimensions, setCanvasDimensions] = useState(getCanvasDimensions());
  const CANVAS_WIDTH = canvasDimensions.width;
  const CANVAS_HEIGHT = canvasDimensions.height;

  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      setCanvasDimensions(getCanvasDimensions());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize audio context
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Enhanced achievement unlock sound with difficulty-based variations
  const playAchievementUnlockSound = useCallback((difficulty: string) => {
    const audioContext = initAudio();
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Difficulty-based sound variations
    let baseFreq = 400;
    let duration = 0.8;
    let filterFreq = 1200;
    
    switch (difficulty) {
      case 'bronze':
        baseFreq = 350;
        filterFreq = 800;
        break;
      case 'silver':
        baseFreq = 400;
        filterFreq = 1000;
        break;
      case 'gold':
        baseFreq = 450;
        filterFreq = 1400;
        duration = 1.0;
        break;
      case 'platinum':
        baseFreq = 500;
        filterFreq = 1600;
        duration = 1.2;
        break;
      case 'legendary':
        baseFreq = 550;
        filterFreq = 2000;
        duration = 1.5;
        break;
    }
    
    // Achievement unlock melody: triumphant ascending progression
    const notes = [
      { freq: baseFreq, time: 0, duration: 0.15 },
      { freq: baseFreq * 1.25, time: 0.15, duration: 0.15 },
      { freq: baseFreq * 1.5, time: 0.3, duration: 0.15 },
      { freq: baseFreq * 2, time: 0.45, duration: 0.25 }
    ];
    
    // Enhanced filter for richer sound
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq * 0.5, audioContext.currentTime);
    filter.frequency.exponentialRampToValueAtTime(filterFreq, audioContext.currentTime + duration);
    
    notes.forEach(note => {
      oscillator.frequency.setValueAtTime(note.freq, audioContext.currentTime + note.time);
    });
    
    // Dynamic gain envelope for natural sound
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.15, audioContext.currentTime + 0.05);
    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime + duration * 0.7);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  }, [initAudio]);

  // Power-up audio function
  const playPowerUpSound = useCallback((powerUpType: PowerUpType) => {
    const audioContext = initAudio();
    if (!audioContext) return;

    const config = POWER_UP_AUDIO_CONFIG[powerUpType];
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Power-up collection sound: pleasant chime
    oscillator.frequency.setValueAtTime(config.frequency, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(config.frequency * 1.5, audioContext.currentTime + config.duration / 1000);
    
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + config.duration / 1000);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + config.duration / 1000);
  }, [initAudio]);

  // Shield activation sound
  const playShieldActivationSound = useCallback(() => {
    const audioContext = initAudio();
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Shield activation: rising harmonic sound
    oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.3);
    oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.6);
    
    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.6);
  }, [initAudio]);

  // Shield deactivation sound
  const playShieldDeactivationSound = useCallback(() => {
    const audioContext = initAudio();
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Shield deactivation: falling harmonic sound
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.2);
    oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.4);
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.4);
  }, [initAudio]);

  // Simple sound generator functions
  const playFlapSound = useCallback(() => {
    const audioContext = initAudio();
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Flap sound: quick chirp with frequency sweep
    oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  }, [initAudio]);

  const playScoreSound = useCallback(() => {
    const audioContext = initAudio();
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Score sound: pleasant ascending notes
    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  }, [initAudio]);

  const playCollisionSound = useCallback(() => {
    const audioContext = initAudio();
    if (!audioContext) return;

    // Create noise for collision effect
    const bufferSize = audioContext.sampleRate * 0.3; // 0.3 seconds
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Generate noise with decreasing amplitude
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize) * 0.5;
    }
    
    const source = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    
    source.buffer = buffer;
    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Low-pass filter for muffled crash sound
    filter.type = 'lowpass';
    filter.frequency.value = 300;
    
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    source.start(audioContext.currentTime);
  }, [initAudio]);

  // Initialize achievement system
  useEffect(() => {
    if (typeof window !== 'undefined' && !achievementSystemRef.current) {
      achievementSystemRef.current = new AchievementSystem((achievement: Achievement) => {
        // Enhanced achievement unlock notification with animations
        const newNotification: AchievementNotificationUI = {
          id: `${achievement.id}-${Date.now()}`,
          achievement,
          timestamp: Date.now(),
          animationPhase: 'sliding-in',
          slideOffset: 300, // Start off-screen
          opacity: 0,
          scale: 0.8,
          autoRemoveTime: Date.now() + 6000 // 6 seconds display time
        };
        
        setAchievementNotifications(prev => [...prev, newNotification]);
        
        // Play achievement unlock sound with difficulty-specific variation
        playAchievementUnlockSound(achievement.difficulty);
        
        // Auto-remove notification after animation
        setTimeout(() => {
          setAchievementNotifications(prev => 
            prev.map(notif => 
              notif.id === newNotification.id 
                ? { ...notif, animationPhase: 'sliding-out' as const }
                : notif
            )
          );
        }, 5000);
        
        // Final removal after slide-out animation
        setTimeout(() => {
          setAchievementNotifications(prev => prev.filter(notif => notif.id !== newNotification.id));
        }, 5800);
      });
    }
  }, [playAchievementUnlockSound]);

  // Power-up utility functions
  const generatePowerUpId = useCallback(() => {
    return Date.now().toString() + Math.random().toString(36).substring(2);
  }, []);

  const getRandomPowerUpType = useCallback((): PowerUpType => {
    const types = Object.keys(POWER_UP_SPAWN_WEIGHTS) as PowerUpType[];
    const weights = Object.values(POWER_UP_SPAWN_WEIGHTS);
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    
    let random = Math.random() * totalWeight;
    for (let i = 0; i < types.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return types[i];
      }
    }
    return types[0]; // Fallback
  }, []);

  const spawnPowerUp = useCallback((currentTime: number) => {
    if (powerUps.length >= POWER_UP_SPAWN_CONFIG.maxActiveCount) return;
    if (currentTime - lastPowerUpSpawnRef.current < POWER_UP_SPAWN_CONFIG.minSpawnInterval) return;
    
    if (Math.random() < POWER_UP_SPAWN_CONFIG.spawnChance) {
      const type = getRandomPowerUpType();
      const newPowerUp: PowerUp = {
        id: generatePowerUpId(),
        type,
        x: CANVAS_WIDTH + 50, // Start off-screen to the right
        y: Math.random() * (CANVAS_HEIGHT - 200) + 100, // Random Y between safe bounds
        collected: false,
        animationPhase: 0,
        spawnTime: currentTime
      };
      
      setPowerUps(prev => [...prev, newPowerUp]);
      lastPowerUpSpawnRef.current = currentTime;
    }
  }, [powerUps.length, getRandomPowerUpType, generatePowerUpId, CANVAS_WIDTH, CANVAS_HEIGHT]);

  // Enhanced particle creation with quality settings and color override
  const createParticles = useCallback((x: number, y: number, count: number = 8, colorOverride?: string) => {
    const colors = colorOverride ? [colorOverride] : ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];
    const newParticles: Particle[] = [];
    
    // Apply quality settings to particle count
    let adjustedCount = count * qualitySettings.particleMultiplier;
    if (isMobile) adjustedCount *= 0.6; // Additional mobile reduction
    adjustedCount = Math.floor(Math.min(adjustedCount, qualitySettings.maxParticles - particles.length));
    
    for (let i = 0; i < adjustedCount; i++) {
      const angle = (Math.PI * 2 * i) / adjustedCount + Math.random() * 0.5;
      const speed = Math.random() * 3 + 2;
      
      newParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1, // Slight upward bias
        life: 1,
        maxLife: Math.random() * 60 + 30, // 30-90 frames
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 4 + 2
      });
    }
    
    setParticles(prev => [...prev, ...newParticles]);
  }, [isMobile, qualitySettings.particleMultiplier, qualitySettings.maxParticles, particles.length]);

  // Create magnet attraction trails
  const createMagnetTrail = useCallback((powerUp: PowerUp) => {
    if (!qualitySettings.enableShadows) return; // Skip trails on low quality
    
    const config = POWER_UP_CONFIGS[powerUp.type];
    const newTrail = {
      id: `${powerUp.id}-${Date.now()}`,
      x: powerUp.x,
      y: powerUp.y,
      opacity: 0.8,
      size: POWER_UP_VISUAL_CONFIG.size * 0.7,
      powerUpType: powerUp.type
    };
    
    setMagnetTrails(prev => [...prev, newTrail]);
  }, [qualitySettings.enableShadows]);

  // Enhanced power-up specific particle creation
  const createPowerUpParticles = useCallback((powerUp: PowerUp, count: number = 12) => {
    const config = POWER_UP_CONFIGS[powerUp.type];
    const newParticles: Particle[] = [];
    
    // Apply quality settings to particle count
    let adjustedCount = count * qualitySettings.particleMultiplier;
    if (isMobile) adjustedCount *= 0.6; // Additional mobile reduction
    adjustedCount = Math.floor(Math.min(adjustedCount, qualitySettings.maxParticles - particles.length));
    
    // Power-up specific particle behaviors
    for (let i = 0; i < adjustedCount; i++) {
      const angle = (Math.PI * 2 * i) / adjustedCount + Math.random() * 0.5;
      let speed = Math.random() * 3 + 2;
      let vx = Math.cos(angle) * speed;
      let vy = Math.sin(angle) * speed - 1;
      let maxLife = Math.random() * 60 + 30;
      let size = Math.random() * 4 + 2;
      
      // Power-up specific enhancements
      switch (powerUp.type) {
        case 'shield':
          // Shield particles: slower, longer-lasting, cyan colors
          speed *= 0.7;
          maxLife *= 1.5;
          size *= 1.2;
          vx = Math.cos(angle) * speed;
          vy = Math.sin(angle) * speed - 0.5; // Less upward bias
          break;
        case 'slowmo':
          // Slow-motion particles: slower, purple colors
          speed *= 0.5;
          maxLife *= 2;
          vx = Math.cos(angle) * speed;
          vy = Math.sin(angle) * speed - 0.3;
          break;
        case 'tiny':
          // Tiny particles: smaller, faster, orange colors
          speed *= 1.3;
          size *= 0.7;
          vx = Math.cos(angle) * speed;
          vy = Math.sin(angle) * speed - 1.5;
          break;
        case 'magnet':
          // Magnet particles: magnetic attraction effect, red colors
          speed *= 0.8;
          maxLife *= 1.2;
          vx = Math.cos(angle) * speed;
          vy = Math.sin(angle) * speed - 0.8;
          break;
      }
      
      newParticles.push({
        x: powerUp.x,
        y: powerUp.y,
        vx,
        vy,
        life: 1,
        maxLife,
        color: config.color,
        size
      });
    }
    
    setParticles(prev => [...prev, ...newParticles]);
  }, [isMobile, qualitySettings.particleMultiplier, qualitySettings.maxParticles, particles.length]);

  const createPowerUpPopup = useCallback((x: number, y: number, text: string) => {
    const popup: ScorePopup = {
      x,
      y,
      opacity: 1,
      scale: 1,
      startTime: Date.now()
    };
    setScorePopups(prev => [...prev, popup]);
  }, []);

  const collectPowerUp = useCallback((powerUp: PowerUp, currentTime: number) => {
    // Mark as collected
    setPowerUps(prev => prev.map(p => 
      p.id === powerUp.id ? { ...p, collected: true } : p
    ));
    
    // Add to active power-ups
    const config = POWER_UP_CONFIGS[powerUp.type];
    const activePowerUp: ActivePowerUp = {
      type: powerUp.type,
      duration: config.duration,
      maxDuration: config.duration,
      startTime: currentTime
    };
    
    setActivePowerUps(prev => {
      // Remove existing power-up of same type (they don't stack)
      const filtered = prev.filter(p => p.type !== powerUp.type);
      return [...filtered, activePowerUp];
    });
    
    // Track achievement progress
    if (achievementSystemRef.current) {
      achievementSystemRef.current.collectPowerUp(powerUp.type);
    }
    
    // Play collection sound
    playPowerUpSound(powerUp.type);
    
    // Play special shield activation sound
    if (powerUp.type === 'shield') {
      setTimeout(() => playShieldActivationSound(), 200); // Slight delay after collection sound
    }
    
    // Create collection particles
    createPowerUpParticles(powerUp, POWER_UP_VISUAL_CONFIG.particleCount);
    
    // Create collection popup
    createPowerUpPopup(powerUp.x, powerUp.y, config.name);
  }, [playPowerUpSound, playShieldActivationSound, createPowerUpParticles, createPowerUpPopup]);

  // Get current game speed multiplier (affected by slow-mo power-up)
  const getGameSpeedMultiplier = useCallback(() => {
    const slowmoPowerUp = activePowerUps.find(p => p.type === 'slowmo');
    if (slowmoPowerUp) {
      return POWER_UP_CONFIGS.slowmo.effect.slowmo?.speedMultiplier || 1;
    }
    return 1;
  }, [activePowerUps]);

  // Get current bird size multiplier (affected by tiny power-up)
  const getBirdSizeMultiplier = useCallback(() => {
    const tinyPowerUp = activePowerUps.find(p => p.type === 'tiny');
    if (tinyPowerUp) {
      return POWER_UP_CONFIGS.tiny.effect.tiny?.sizeMultiplier || 1;
    }
    return 1;
  }, [activePowerUps]);

  // Check if bird is currently invulnerable (shield power-up)
  const isBirdInvulnerable = useCallback(() => {
    return activePowerUps.some(p => p.type === 'shield');
  }, [activePowerUps]);

  // Animation helper functions
  const createScorePopup = useCallback((x: number, y: number) => {
    const popup: ScorePopup = {
      x,
      y,
      opacity: 1,
      scale: 1,
      startTime: Date.now()
    };
    setScorePopups(prev => [...prev, popup]);
  }, []);

  // Haptic feedback for mobile devices
  const triggerHapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      switch (type) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(25);
          break;
        case 'heavy':
          navigator.vibrate([50, 50, 50]);
          break;
      }
    }
  }, []);

  // Adaptive quality management
  const updateQualitySettings = useCallback((currentFps: number) => {
    if (!qualitySettings.adaptiveQuality) return;

    // Add FPS to history
    fpsHistoryRef.current.push(currentFps);
    if (fpsHistoryRef.current.length > 30) { // Keep last 30 FPS readings
      fpsHistoryRef.current.shift();
    }

    // Only adjust quality every 3 seconds to avoid constant changes
    const now = Date.now();
    if (now - lastFpsCheckRef.current < 3000) return;
    lastFpsCheckRef.current = now;

    if (fpsHistoryRef.current.length < 10) return; // Need some history

    const avgFps = fpsHistoryRef.current.reduce((a, b) => a + b, 0) / fpsHistoryRef.current.length;

    setQualitySettings(prev => {
      const newSettings = { ...prev };
      
      // Poor performance: reduce quality
      if (avgFps < 45) {
        newSettings.particleMultiplier = Math.max(0.3, prev.particleMultiplier - 0.1);
        newSettings.maxParticles = Math.max(10, prev.maxParticles - 5);
        newSettings.enableShadows = avgFps > 35; // Disable shadows if very poor
        newSettings.enableGradients = avgFps > 30; // Disable gradients if extremely poor
      }
      // Good performance: increase quality back up
      else if (avgFps > 55) {
        newSettings.particleMultiplier = Math.min(1.0, prev.particleMultiplier + 0.05);
        newSettings.maxParticles = Math.min(50, prev.maxParticles + 2);
        newSettings.enableShadows = true;
        newSettings.enableGradients = true;
      }

      // Only update if there's actually a change
      return JSON.stringify(newSettings) !== JSON.stringify(prev) ? newSettings : prev;
    });
  }, [qualitySettings.adaptiveQuality]);

  // Touch feedback animation
  const createTouchFeedback = useCallback((x: number, y: number) => {
    if (touchFeedbackTimeoutRef.current) {
      clearTimeout(touchFeedbackTimeoutRef.current);
    }

    setTouchFeedback({ x, y, opacity: 1 });
    
    touchFeedbackTimeoutRef.current = setTimeout(() => {
      setTouchFeedback(null);
    }, 300);
  }, []);

  // Performance tracking for FPS monitoring
  const trackPerformance = useCallback((deltaTime: number) => {
    const fps = 1000 / deltaTime;
    updateQualitySettings(fps);
  }, [updateQualitySettings]);

  const updateAnimations = useCallback((currentTime: number) => {
    // Apply speed multiplier for slow-mo effect
    const speedMultiplier = getGameSpeedMultiplier();
    const effectiveDeltaTime = 16.67 * speedMultiplier; // Adjusted for slow-mo
    
    // Update achievement notification animations
    setAchievementNotifications(prev => prev.map(notification => {
      const elapsed = currentTime - notification.timestamp;
      let newNotification = { ...notification };
      
      switch (notification.animationPhase) {
        case 'sliding-in':
          // Slide in from right with easing
          const slideProgress = Math.min(elapsed / 500, 1); // 500ms slide-in
          const easeOut = 1 - Math.pow(1 - slideProgress, 3); // Cubic ease-out
          
          newNotification.slideOffset = 300 * (1 - easeOut);
          newNotification.opacity = easeOut;
          newNotification.scale = 0.8 + (0.2 * easeOut);
          
          if (slideProgress >= 1) {
            newNotification.animationPhase = 'visible';
          }
          break;
          
        case 'visible':
          // Gentle floating animation
          const floatOffset = Math.sin(elapsed * 0.003) * 2;
          newNotification.slideOffset = floatOffset;
          newNotification.opacity = 1;
          newNotification.scale = 1;
          break;
          
        case 'sliding-out':
          // Slide out to right with fade
          const outProgress = Math.min((elapsed - 5000) / 800, 1); // 800ms slide-out
          const easeIn = Math.pow(outProgress, 2); // Quadratic ease-in
          
          newNotification.slideOffset = 300 * easeIn;
          newNotification.opacity = 1 - easeIn;
          newNotification.scale = 1 - (0.2 * easeIn);
          break;
      }
      
      return newNotification;
    }));
    
    // Update achievement progress indicators
    if (achievementSystemRef.current) {
      const state = achievementSystemRef.current.getState();
      const visibleAchievements = achievementSystemRef.current.getVisibleAchievements();
      
      // Update progress for achievements that should show progress bars
      const newProgress: {[key: string]: {progress: number, visible: boolean}} = {};
      visibleAchievements.forEach(achievement => {
        if (!achievement.unlocked && achievement.progress > 0 && achievement.progress < 1) {
          newProgress[achievement.id] = {
            progress: achievement.progress,
            visible: true
          };
        }
      });
      
      setAchievementProgress(newProgress);
    }
    
    // Update power-ups
    if (gameStarted && !gameOver) {
      // Spawn power-ups
      spawnPowerUp(currentTime);
      
      // Update power-up positions and animations
      setPowerUps(prev => prev
        .map(powerUp => {
          if (powerUp.collected) return powerUp;
          
          // Move power-up left
          const newX = powerUp.x - PIPE_SPEED * speedMultiplier;
          
          // Update floating animation
          const animationPhase = powerUp.animationPhase + POWER_UP_VISUAL_CONFIG.floatSpeed * effectiveDeltaTime;
          const floatOffset = Math.sin(animationPhase) * POWER_UP_VISUAL_CONFIG.floatAmplitude;
          
          return {
            ...powerUp,
            x: newX,
            animationPhase,
            y: powerUp.y + floatOffset * 0.1 // Subtle floating
          };
        })
        .filter(powerUp => {
          // Remove off-screen or old power-ups
          if (powerUp.x < -50) return false;
          if (currentTime - powerUp.spawnTime > POWER_UP_SPAWN_CONFIG.despawnTime) return false;
          if (powerUp.collected) return false;
          return true;
        })
      );
      
      // Check power-up collisions with bird
      powerUps.forEach(powerUp => {
        if (powerUp.collected) return;
        
        const distance = Math.sqrt(
          Math.pow(bird.x + BIRD_SIZE/2 - powerUp.x, 2) + 
          Math.pow(bird.y + BIRD_SIZE/2 - powerUp.y, 2)
        );
        
        if (distance < POWER_UP_VISUAL_CONFIG.size) {
          collectPowerUp(powerUp, currentTime);
        }
      });
      
      // Handle magnet effect
      const magnetPowerUp = activePowerUps.find(p => p.type === 'magnet');
      if (magnetPowerUp) {
        const config = POWER_UP_CONFIGS.magnet.effect.magnet;
        if (config) {
          setPowerUps(prev => prev.map(powerUp => {
            if (powerUp.collected) return powerUp;
            
            const dx = bird.x - powerUp.x;
            const dy = bird.y - powerUp.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < config.attractionRadius) {
              const force = config.attractionStrength;
              const moveX = (dx / distance) * force * speedMultiplier;
              const moveY = (dy / distance) * force * speedMultiplier;
              
              // Create attraction trail effect (every few frames for performance)
              if (Math.random() < 0.3) { // 30% chance each frame
                createMagnetTrail(powerUp);
              }
              
              return {
                ...powerUp,
                x: powerUp.x + moveX,
                y: powerUp.y + moveY
              };
            }
            
            return powerUp;
          }));
        }
      }
      
      // Update magnet trails
      setMagnetTrails(prev => prev
        .map(trail => ({
          ...trail,
          opacity: trail.opacity - 0.02 * speedMultiplier, // Fade out over time
          size: trail.size * (1 - 0.01 * speedMultiplier) // Shrink over time
        }))
        .filter(trail => trail.opacity > 0.1) // Remove very faded trails
      );
      
      // Update active power-ups duration
      setActivePowerUps(prev => prev
        .map(powerUp => ({
          ...powerUp,
          duration: powerUp.duration - effectiveDeltaTime
        }))
        .filter(powerUp => powerUp.duration > 0)
      );
      
      // Monitor shield state changes for audio feedback
      const currentShieldState = isBirdInvulnerable();
      if (previousShieldStateRef.current && !currentShieldState) {
        // Shield just deactivated
        playShieldDeactivationSound();
      }
      previousShieldStateRef.current = currentShieldState;
      
      // Track power-up combinations for special achievements
      if (achievementSystemRef.current && activePowerUps.length > 0) {
        const activePowerUpTypes = activePowerUps.map(p => p.type);
        achievementSystemRef.current.trackPowerUpCombo(activePowerUpTypes);
      }
    }
    
    // Consolidate all animation updates into a single state update to reduce re-renders
    let updatedParticles = particles;
    let updatedPopups = scorePopups;
    
    // Update touch feedback animation
    if (touchFeedback) {
      const elapsed = Date.now() - (currentTime - 300); // Rough timing
      const progress = Math.min(elapsed / 300, 1);
      const newOpacity = Math.max(0, 1 - progress);
      
      if (newOpacity > 0) {
        setTouchFeedback(prev => prev ? { ...prev, opacity: newOpacity } : null);
      }
    }

    // Update score popups (only if there are any)
    if (scorePopups.length > 0) {
      updatedPopups = scorePopups
        .map(popup => {
          const elapsed = currentTime - popup.startTime;
          const progress = elapsed / 1500; // 1.5 seconds
          
          return {
            ...popup,
            y: popup.y - 1 * speedMultiplier, // Float upward
            opacity: Math.max(0, 1 - progress),
            scale: 1 + progress * 0.5 // Slight scale increase
          };
        })
        .filter(popup => popup.opacity > 0);
      
      if (updatedPopups.length !== scorePopups.length) {
        setScorePopups(updatedPopups);
      } else if (updatedPopups.length > 0) {
        setScorePopups(updatedPopups);
      }
    }

    // Update particles (only if there are any)
    if (particles.length > 0) {
      updatedParticles = particles
        .map(particle => ({
          ...particle,
          x: particle.x + particle.vx * speedMultiplier,
          y: particle.y + particle.vy * speedMultiplier,
          vy: particle.vy + 0.1 * speedMultiplier, // Gravity
          life: particle.life - (1 / particle.maxLife) * speedMultiplier
        }))
        .filter(particle => particle.life > 0);
      
      if (updatedParticles.length !== particles.length) {
        setParticles(updatedParticles);
      } else if (updatedParticles.length > 0) {
        setParticles(updatedParticles);
      }
    }

    // Update death animation (only when dying)
    if (!bird.isAlive && deathAnimationStartRef.current) {
      const deathProgress = (currentTime - deathAnimationStartRef.current) / 2000; // 2 seconds
      if (deathProgress < 1) {
        setBird(prev => ({
          ...prev,
          rotation: deathProgress * Math.PI * 3 // 3 full rotations
        }));
      }
    }
  }, [
    gameStarted, gameOver, bird, powerUps, activePowerUps, particles, scorePopups, touchFeedback,
    getGameSpeedMultiplier, spawnPowerUp, collectPowerUp, PIPE_SPEED, BIRD_SIZE,
    isBirdInvulnerable, playShieldDeactivationSound, createMagnetTrail
  ]);

  const startDeathAnimation = useCallback(() => {
    if (!deathAnimationStartRef.current) {
      deathAnimationStartRef.current = Date.now();
    }
  }, []);

  // Bird flap function
  const flapBird = useCallback(() => {
    if (gameOver) return;
    
    if (!gameStarted) {
      setGameStarted(true);
      
      // Track game start for achievements
      if (achievementSystemRef.current) {
        achievementSystemRef.current.startSession();
      }
    }
    
    // Play flap sound
    playFlapSound();
    
    // Mobile haptic feedback
    if (isMobile) {
      triggerHapticFeedback('light');
    }
    
    setBird(prev => ({
      ...prev,
      velocity: JUMP_FORCE
    }));
  }, [gameOver, gameStarted, playFlapSound, isMobile, triggerHapticFeedback, JUMP_FORCE]);

  // Reset game
  const resetGame = useCallback(() => {
    setBird({ x: 100, y: 300, velocity: 0, isAlive: true, rotation: 0 });
    setPipes([]);
    setScore(0);
    setGameStarted(false);
    setGameOver(false);
    setScorePopups([]);
    setParticles([]);
    // Reset power-up system
    setPowerUps([]);
    setActivePowerUps([]);
    setMagnetTrails([]); // Clear magnet trails
    lastPowerUpSpawnRef.current = 0;
    deathAnimationStartRef.current = null; // Reset death animation
  }, []);

  // Game loop with integrated rendering
  const gameLoop = useCallback((currentTime: number) => {
    const deltaTime = currentTime - lastTimeRef.current;
    lastTimeRef.current = currentTime;
    
    // Apply speed multiplier for slow-mo effect
    const speedMultiplier = getGameSpeedMultiplier();

    // Track performance
    if (deltaTime > 0) {
      trackPerformance(deltaTime);
    }

    // Update animations only when game is running
    if (gameStarted && !gameOver) {
      updateAnimations(currentTime);

      // Update bird physics with size multiplier for collision detection
      setBird(prevBird => {
        let newY = prevBird.y + prevBird.velocity * speedMultiplier;
        let newVelocity = prevBird.velocity + GRAVITY * speedMultiplier;
        let isAlive = prevBird.isAlive;
        let rotation = prevBird.rotation;

        // Ground collision
        if (newY > CANVAS_HEIGHT - 100) {
          newY = CANVAS_HEIGHT - 100;
          if (isAlive && !isBirdInvulnerable()) {
            isAlive = false;
            setGameOver(true);
            
            // Track game end for achievements
            if (achievementSystemRef.current) {
              achievementSystemRef.current.endSession(score);
            }
            
            playCollisionSound();
            if (isMobile) {
              triggerHapticFeedback('heavy');
            }
            startDeathAnimation();
            createParticles(prevBird.x + 10, prevBird.y + 10, 15);
          }
        }

        // Ceiling collision
        if (newY < 0) {
          newY = 0;
          newVelocity = 0;
        }

        // Update rotation based on velocity when alive
        if (isAlive) {
          rotation = Math.max(-0.5, Math.min(0.5, newVelocity * 0.1));
        }

        return {
          ...prevBird,
          y: newY,
          velocity: newVelocity,
          isAlive,
          rotation
        };
      });

      // Update pipes with speed multiplier
      setPipes(prevPipes => {
        let updatedPipes = prevPipes.map(pipe => ({
          ...pipe,
          x: pipe.x - PIPE_SPEED * speedMultiplier
        }));

        // Add new pipes
        const lastPipe = updatedPipes[updatedPipes.length - 1];
        if (!lastPipe || lastPipe.x < CANVAS_WIDTH - 300) {
          updatedPipes.push({
            x: CANVAS_WIDTH,
            gapY: Math.random() * (CANVAS_HEIGHT - PIPE_GAP - 200) + 100,
            passed: false
          });
        }

        // Remove off-screen pipes and check collisions
        return updatedPipes.filter(pipe => {
          if (pipe.x < -PIPE_WIDTH) {
            return false;
          }

          // Check pipe collision with size multiplier for tiny bird power-up
          const birdSizeMultiplier = getBirdSizeMultiplier();
          const effectiveBirdSize = BIRD_SIZE * birdSizeMultiplier;
          
          if (
            bird.x + effectiveBirdSize > pipe.x &&
            bird.x < pipe.x + PIPE_WIDTH &&
            bird.isAlive &&
            (bird.y < pipe.gapY || bird.y + effectiveBirdSize > pipe.gapY + PIPE_GAP) &&
            !isBirdInvulnerable() // Shield protects from pipe collisions
          ) {
            // Collision detected
            setBird(prev => ({ ...prev, isAlive: false }));
            setGameOver(true);
            
            // Track game end for achievements
            if (achievementSystemRef.current) {
              achievementSystemRef.current.endSession(score);
            }
            
            playCollisionSound();
            if (isMobile) {
              triggerHapticFeedback('heavy');
            }
            startDeathAnimation();
            createParticles(bird.x + 10, bird.y + 10, 15);
          }

          // Check scoring
          if (!pipe.passed && pipe.x + PIPE_WIDTH < bird.x && bird.isAlive) {
            pipe.passed = true;
            setScore(prev => {
              const newScore = prev + 1;
              
              // Track achievement progress
              if (achievementSystemRef.current) {
                achievementSystemRef.current.updateScore(newScore);
              }
              
              return newScore;
            });
            playScoreSound();
            createScorePopup(pipe.x + PIPE_WIDTH / 2, pipe.gapY + PIPE_GAP / 2);
          }

          return true;
        });
      });
    }

    // Render the game
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Update ground and cloud offsets for scrolling effects
        groundOffsetRef.current += PIPE_SPEED * speedMultiplier;
        if (groundOffsetRef.current > 20) groundOffsetRef.current = 0;
        
        cloudOffsetRef.current += 0.2 * speedMultiplier;

        // Clear canvas
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw dynamic sky with day/night cycle
        dayNightCycleRef.current.drawSky(
          ctx, 
          CANVAS_WIDTH, 
          CANVAS_HEIGHT, 
          score, 
          GROUND_HEIGHT
        );
        
        // Draw clouds with parallax effect
        dayNightCycleRef.current.drawClouds(
          ctx, 
          CANVAS_WIDTH, 
          CANVAS_HEIGHT, 
          score, 
          cloudOffsetRef.current
        );

        // Draw ground with enhanced texture
        const groundGradient = ctx.createLinearGradient(0, CANVAS_HEIGHT - 100, 0, CANVAS_HEIGHT);
        groundGradient.addColorStop(0, '#90EE90');
        groundGradient.addColorStop(0.3, '#7CCD7C');
        groundGradient.addColorStop(1, '#228B22');
        ctx.fillStyle = groundGradient;
        ctx.fillRect(0, CANVAS_HEIGHT - 100, CANVAS_WIDTH, 100);

        // Enhanced grass texture
        ctx.fillStyle = '#32CD32';
        grassPositions.current.forEach(grass => {
          const adjustedX = (grass.x - groundOffsetRef.current) % CANVAS_WIDTH;
          grass.heights.forEach((height, i) => {
            const x = adjustedX + i * 5;
            if (x >= -10 && x <= CANVAS_WIDTH + 10) {
              ctx.fillRect(x, CANVAS_HEIGHT - 100, 2, -height);
            }
          });
        });

        // Draw pipes with 3D effect
        pipes.forEach(pipe => {
          // Pipe shadows (only if quality allows)
          if (qualitySettings.enableShadows) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(pipe.x + 5, 0, PIPE_WIDTH, pipe.gapY);
            ctx.fillRect(pipe.x + 5, pipe.gapY + PIPE_GAP, PIPE_WIDTH, CANVAS_HEIGHT - pipe.gapY - PIPE_GAP - 100);
          }

          // Main pipe gradient (or solid color for performance)
          if (qualitySettings.enableGradients) {
            const pipeGradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
            pipeGradient.addColorStop(0, '#2E8B57');
            pipeGradient.addColorStop(0.5, '#228B22');
            pipeGradient.addColorStop(1, '#006400');
            ctx.fillStyle = pipeGradient;
          } else {
            ctx.fillStyle = '#228B22'; // Solid color for performance
          }
          
          // Top pipe
          ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.gapY);
          // Bottom pipe
          ctx.fillRect(pipe.x, pipe.gapY + PIPE_GAP, PIPE_WIDTH, CANVAS_HEIGHT - pipe.gapY - PIPE_GAP - 100);

          // Pipe caps/rims for industrial look
          ctx.fillStyle = '#2F4F2F'; // Dark slate gray
          // Top pipe cap
          ctx.fillRect(pipe.x - 5, pipe.gapY - 25, PIPE_WIDTH + 10, 25);
          // Bottom pipe cap  
          ctx.fillRect(pipe.x - 5, pipe.gapY + PIPE_GAP, PIPE_WIDTH + 10, 25);

          // Pipe highlights for 3D effect
          ctx.fillStyle = '#90EE90'; // Light green highlight
          ctx.fillRect(pipe.x + 5, 0, 3, pipe.gapY - 25);
          ctx.fillRect(pipe.x + 5, pipe.gapY + PIPE_GAP + 25, 3, CANVAS_HEIGHT - pipe.gapY - PIPE_GAP - 125);
        });

        // Draw magnet attraction trails
        magnetTrails.forEach(trail => {
          const config = POWER_UP_CONFIGS[trail.powerUpType];
          
          ctx.save();
          ctx.globalAlpha = trail.opacity;
          
          // Trail glow effect (if quality allows)
          if (qualitySettings.enableShadows) {
            ctx.shadowColor = config.glowColor;
            ctx.shadowBlur = 10;
          }
          
          // Trail background circle (smaller and more transparent than main power-up)
          ctx.fillStyle = config.color;
          ctx.beginPath();
          ctx.arc(trail.x, trail.y, trail.size, 0, 2 * Math.PI);
          ctx.fill();
          
          ctx.restore();
        });

        // Draw power-ups
        powerUps.forEach(powerUp => {
          if (powerUp.collected) return;
          
          const config = POWER_UP_CONFIGS[powerUp.type];
          const visualConfig = POWER_UP_VISUAL_CONFIG;
          
          ctx.save();
          
          // Glow effect
          if (qualitySettings.enableShadows) {
            ctx.shadowColor = config.glowColor;
            ctx.shadowBlur = visualConfig.glowIntensity;
          }
          
          // Power-up background circle
          ctx.fillStyle = config.color;
          ctx.beginPath();
          ctx.arc(powerUp.x, powerUp.y, visualConfig.size, 0, 2 * Math.PI);
          ctx.fill();
          
          // Power-up icon (emoji)
          ctx.shadowBlur = 0;
          ctx.font = `${visualConfig.size}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(config.icon, powerUp.x, powerUp.y);
          
          ctx.restore();
        });

        // Draw enhanced bird with gradient and shadow
        ctx.save();
        
        // Bird shadow (only if quality allows)
        if (qualitySettings.enableShadows) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
          const sizeMultiplier = getBirdSizeMultiplier();
          const shadowSize = 20 * sizeMultiplier;
          ctx.fillRect(bird.x + 2, bird.y + 2, shadowSize, shadowSize);
        }
        
        // Apply rotation for bird
        ctx.translate(bird.x + 10, bird.y + 10);
        ctx.rotate(bird.rotation);
        ctx.translate(-10, -10);
        
        // Scale for tiny bird power-up
        const sizeMultiplier = getBirdSizeMultiplier();
        if (sizeMultiplier !== 1) {
          const scale = sizeMultiplier;
          ctx.scale(scale, scale);
        }
        
        // Draw pulsing shield barrier if shield is active
        if (isBirdInvulnerable() && qualitySettings.enableShadows) {
          const shieldPulse = 0.7 + 0.3 * Math.sin(currentTime * 0.008); // Pulsing effect
          const shieldRadius = 35 * shieldPulse;
          
          // Outer shield ring - more transparent
          ctx.strokeStyle = `rgba(64, 224, 208, ${0.4 * shieldPulse})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(10, 10, shieldRadius, 0, 2 * Math.PI);
          ctx.stroke();
          
          // Inner shield ring - more opaque
          ctx.strokeStyle = `rgba(78, 205, 196, ${0.6 * shieldPulse})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(10, 10, shieldRadius * 0.7, 0, 2 * Math.PI);
          ctx.stroke();
          
          // Shield energy sparks (particles around the shield)
          for (let i = 0; i < 6; i++) {
            const angle = (currentTime * 0.01 + i * Math.PI / 3) % (2 * Math.PI);
            const sparkX = 10 + Math.cos(angle) * shieldRadius * 0.8;
            const sparkY = 10 + Math.sin(angle) * shieldRadius * 0.8;
            
            ctx.fillStyle = `rgba(64, 224, 208, ${0.8 * shieldPulse})`;
            ctx.beginPath();
            ctx.arc(sparkX, sparkY, 2, 0, 2 * Math.PI);
            ctx.fill();
          }
        }
        
        // Main bird body gradient (or solid color for performance)
        if (qualitySettings.enableGradients) {
          const birdGradient = ctx.createRadialGradient(
            10, 8, 2,  // Inner circle (highlight)
            10, 10, 15 // Outer circle
          );
          if (bird.isAlive) {
            // Check for shield power-up glow
            if (isBirdInvulnerable()) {
              birdGradient.addColorStop(0, '#40E0D0');  // Cyan glow center
              birdGradient.addColorStop(0.7, '#4ECDC4'); // Cyan mid
              birdGradient.addColorStop(1, '#00CED1');   // Dark cyan edge
            } else {
              birdGradient.addColorStop(0, '#FFD700');  // Bright gold center
              birdGradient.addColorStop(0.7, '#FFA500'); // Orange mid
              birdGradient.addColorStop(1, '#FF8C00');   // Dark orange edge
            }
          } else {
            birdGradient.addColorStop(0, '#FF6B6B');  // Light red center
            birdGradient.addColorStop(0.7, '#FF4444'); // Medium red
            birdGradient.addColorStop(1, '#CC0000');   // Dark red edge
          }
          ctx.fillStyle = birdGradient;
        } else {
          // Solid colors for performance
          if (isBirdInvulnerable()) {
            ctx.fillStyle = '#4ECDC4'; // Shield color
          } else {
            ctx.fillStyle = bird.isAlive ? '#FFA500' : '#FF4444';
          }
        }
        ctx.fillRect(0, 0, 20, 20);

        // Bird eye
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(15, 7, 3, 0, 2 * Math.PI);
        ctx.fill();
        
        // Bird eye highlight
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(16, 6, 1, 0, 2 * Math.PI);
        ctx.fill();

        // Bird beak
        ctx.fillStyle = '#FF8C00';
        ctx.beginPath();
        ctx.moveTo(20, 10);
        ctx.lineTo(26, 8);
        ctx.lineTo(26, 12);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();

        // Render particles
        particles.forEach(particle => {
          ctx.save();
          ctx.globalAlpha = particle.life;
          ctx.fillStyle = particle.color;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, 2 * Math.PI);
          ctx.fill();
          ctx.restore();
        });

        // Render score popups
        scorePopups.forEach(popup => {
          ctx.save();
          ctx.globalAlpha = popup.opacity;
          ctx.font = `bold ${Math.floor(24 * popup.scale)}px Arial`;
          ctx.fillStyle = '#FFF';
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 2;
          ctx.textAlign = 'center';
          
          // Draw text with outline
          ctx.strokeText('+1', popup.x, popup.y);
          ctx.fillText('+1', popup.x, popup.y);
          
          ctx.restore();
        });

        // Render touch feedback for mobile
        if (touchFeedback && isMobile) {
          ctx.save();
          ctx.globalAlpha = touchFeedback.opacity * 0.6;
          ctx.strokeStyle = '#FFD700';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(touchFeedback.x, touchFeedback.y, 30 * (1 - touchFeedback.opacity), 0, 2 * Math.PI);
          ctx.stroke();
          
          ctx.globalAlpha = touchFeedback.opacity * 0.3;
          ctx.beginPath();
          ctx.arc(touchFeedback.x, touchFeedback.y, 50 * (1 - touchFeedback.opacity), 0, 2 * Math.PI);
          ctx.stroke();
          
          ctx.restore();
        }

        // Enhanced score display with shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.font = 'bold 28px Arial';
        ctx.fillText(`Score: ${score}`, 22, 42);
        
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 28px Arial';
        ctx.fillText(`Score: ${score}`, 20, 40);

        // Slow-motion visual effect overlay
        const slowmoPowerUp = activePowerUps.find(p => p.type === 'slowmo');
        if (slowmoPowerUp) {
          const progress = slowmoPowerUp.duration / slowmoPowerUp.maxDuration;
          const intensity = 0.15 * progress; // Fade out as effect ends
          
          // Purple-tinted overlay for slow-motion
          ctx.fillStyle = `rgba(155, 89, 182, ${intensity})`;
          ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
          
          // Slow-motion indicator with pulsing effect
          const pulse = 0.7 + 0.3 * Math.sin(currentTime * 0.01);
          ctx.fillStyle = `rgba(231, 76, 60, ${0.8 * pulse * progress})`;
          ctx.font = 'bold 24px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('⏱️ SLOW MOTION', CANVAS_WIDTH / 2, 50);
        }

        // Power-up progress bars
        if (activePowerUps.length > 0) {
          activePowerUps.forEach((powerUp, index) => {
            const config = POWER_UP_CONFIGS[powerUp.type];
            const progress = powerUp.duration / powerUp.maxDuration;
            const barY = 70 + index * 35; // Increased spacing for better visibility
            
            // Enhanced background with rounded corners effect
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(18, barY, 154, 24);
            
            // Inner background
            ctx.fillStyle = 'rgba(40, 40, 40, 0.8)';
            ctx.fillRect(20, barY + 2, 150, 20);
            
            // Animated progress bar with gradient
            if (qualitySettings.enableGradients) {
              const progressGradient = ctx.createLinearGradient(22, barY + 2, 22 + (150 - 4) * progress, barY + 2);
              progressGradient.addColorStop(0, config.color);
              progressGradient.addColorStop(0.5, config.glowColor);
              progressGradient.addColorStop(1, config.color);
              ctx.fillStyle = progressGradient;
            } else {
              ctx.fillStyle = config.color;
            }
            
            // Progress bar with smooth animation
            const animatedWidth = (150 - 4) * progress;
            ctx.fillRect(22, barY + 4, animatedWidth, 16);
            
            // Pulsing effect when time is running low
            if (progress < 0.3) {
              const pulse = 0.5 + 0.5 * Math.sin(currentTime * 0.01);
              ctx.fillStyle = `rgba(255, 255, 255, ${0.3 * pulse})`;
              ctx.fillRect(22, barY + 4, animatedWidth, 16);
            }
            
            // Enhanced border effect
            if (qualitySettings.enableShadows) {
              ctx.strokeStyle = config.glowColor;
              ctx.lineWidth = 1;
              ctx.strokeRect(22, barY + 4, 150 - 4, 16);
            }
            
            // Power-up icon and text with better positioning
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'left';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 2;
            ctx.fillText(`${config.icon} ${config.name}`, 26, barY + 16);
            ctx.shadowBlur = 0;
            
            // Duration countdown
            const remainingSeconds = Math.ceil(powerUp.duration / 1000);
            ctx.fillStyle = progress < 0.3 ? '#FFD700' : '#FFF';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(`${remainingSeconds}s`, 165, barY + 16);
          });
        }

        // Day/Night Cycle indicator (only when game is running)
        if (gameStarted && !gameOver) {
          const timeInfo = dayNightCycleRef.current.getCurrentTimeInfo(score);
          
          // Time display background
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.font = 'bold 18px Arial';
          const displayY = activePowerUps.length > 0 ? 70 + activePowerUps.length * 35 + 30 : 72; // Updated for new spacing
          ctx.fillText(`${timeInfo.name === 'Dawn' ? '🌅' : timeInfo.name === 'Day' ? '☀️' : timeInfo.name === 'Sunset' ? '🌇' : '🌙'} ${timeInfo.name}`, 22, displayY);
          
          ctx.fillStyle = '#FFF';
          ctx.font = 'bold 18px Arial';
          ctx.fillText(`${timeInfo.name === 'Dawn' ? '🌅' : timeInfo.name === 'Day' ? '☀️' : timeInfo.name === 'Sunset' ? '🌇' : '🌙'} ${timeInfo.name}`, 20, displayY - 2);
          
          // Points until next phase (if applicable)
          if (timeInfo.pointsUntilNext > 0) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.font = '12px Arial';
            ctx.fillText(`${timeInfo.pointsUntilNext} pts to next`, 22, displayY + 20);
            
            ctx.fillStyle = '#FFF';
            ctx.font = '12px Arial';
            ctx.fillText(`${timeInfo.pointsUntilNext} pts to next`, 20, displayY + 18);
          }
        }

        // Achievement notifications
        achievementNotifications.forEach((notification, index) => {
          const notificationY = 200 + index * 70;
          const notificationX = CANVAS_WIDTH - 320 + notification.slideOffset; // Apply slide animation
          
          // Difficulty-based glow colors (moved outside if block for broader scope)
          const glowColors = {
            bronze: '#CD7F32',
            silver: '#C0C0C0', 
            gold: '#FFD700',
            platinum: '#E5E4E2',
            legendary: '#9966CC'
          };
          const difficultyColor = glowColors[notification.achievement.difficulty] || '#FFD700';
          
          ctx.save();
          
          // Apply notification animation properties
          ctx.globalAlpha = notification.opacity;
          ctx.scale(notification.scale, notification.scale);
          
          // Enhanced notification background with glow and difficulty-based color
          if (qualitySettings.enableShadows) {
            ctx.shadowColor = difficultyColor;
            ctx.shadowBlur = 20 * notification.opacity; // Glow intensity matches opacity
          }
          
          // Enhanced background with gradient
          if (qualitySettings.enableGradients) {
            const bgGradient = ctx.createLinearGradient(notificationX, notificationY, notificationX + 300, notificationY + 60);
            bgGradient.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
            bgGradient.addColorStop(0.5, 'rgba(20, 20, 20, 0.9)');
            bgGradient.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
            ctx.fillStyle = bgGradient;
          } else {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
          }
          
          // Main notification background with rounded corners effect
          ctx.fillRect(notificationX, notificationY, 300, 60);
          
          // Enhanced border effect
          if (qualitySettings.enableShadows) {
            ctx.strokeStyle = difficultyColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(notificationX + 1, notificationY + 1, 298, 58);
          }
          
          ctx.shadowBlur = 0; // Reset shadow for icon
          
          // Achievement icon background with difficulty-based color
          const difficultyColors = {
            bronze: '#CD7F32',
            silver: '#C0C0C0',
            gold: '#FFD700', 
            platinum: '#E5E4E2',
            legendary: '#9966CC'
          };
          const iconBgColor = difficultyColors[notification.achievement.difficulty] || '#FFD700';
          
          ctx.fillStyle = iconBgColor;
          ctx.beginPath();
          ctx.arc(notificationX / notification.scale + 30, notificationY / notification.scale + 30, 22, 0, 2 * Math.PI);
          ctx.fill();
          
          // Icon inner circle for depth
          ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.beginPath();
          ctx.arc(notificationX / notification.scale + 30, notificationY / notification.scale + 30, 20, 0, 2 * Math.PI);
          ctx.fill();
          
          // Achievement icon with shadow
          if (qualitySettings.enableShadows) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 3;
          }
          
          ctx.fillStyle = '#000';
          ctx.font = `bold ${26 * notification.scale}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(notification.achievement.icon, (notificationX + 30) / notification.scale, (notificationY + 30) / notification.scale);
          
          ctx.shadowBlur = 0; // Reset shadow
          
          // "Achievement Unlocked!" text with enhanced styling
          if (qualitySettings.enableShadows) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 2;
          }
          
          ctx.fillStyle = iconBgColor;
          ctx.font = `bold ${14 * notification.scale}px Arial`;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.fillText('🏆 Achievement Unlocked!', (notificationX + 60) / notification.scale, (notificationY + 8) / notification.scale);
          
          // Achievement name with enhanced styling
          ctx.fillStyle = '#FFF';
          ctx.font = `bold ${16 * notification.scale}px Arial`;
          ctx.fillText(notification.achievement.name, (notificationX + 60) / notification.scale, (notificationY + 25) / notification.scale);
          
          // Achievement points with pulsing effect
          const pointsPulse = 0.8 + 0.2 * Math.sin(Date.now() * 0.008);
          ctx.fillStyle = iconBgColor;
          ctx.font = `bold ${12 * notification.scale * pointsPulse}px Arial`;
          ctx.fillText(`+${notification.achievement.rewards.points} points`, (notificationX + 60) / notification.scale, (notificationY + 45) / notification.scale);
          
          // Achievement difficulty badge
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect((notificationX + 250) / notification.scale, (notificationY + 8) / notification.scale, 45, 15);
          
          ctx.fillStyle = iconBgColor;
          ctx.font = `bold ${10 * notification.scale}px Arial`;
          ctx.textAlign = 'center';
          ctx.fillText(notification.achievement.difficulty.toUpperCase(), (notificationX + 272.5) / notification.scale, (notificationY + 18) / notification.scale);
          
          ctx.shadowBlur = 0; // Reset shadow
          ctx.restore();
        });

        // Enhanced game state overlays
        if (!gameStarted) {
          // Semi-transparent overlay
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
          
          // Title with glow effect
          ctx.shadowColor = '#FFD700';
          ctx.shadowBlur = 20;
          ctx.fillStyle = '#FFD700';
          ctx.font = 'bold 48px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Flappy Bird', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
          
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#FFF';
          ctx.font = '24px Arial';
          ctx.fillText('Click or Press Space to Start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
          
          // Power-up preview
          ctx.font = '18px Arial';
          ctx.fillText('Collect power-ups for special abilities!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
          
          // Show power-up icons
          const powerUpTypes: PowerUpType[] = ['shield', 'slowmo', 'tiny', 'magnet'];
          powerUpTypes.forEach((type, index) => {
            const config = POWER_UP_CONFIGS[type];
            const x = CANVAS_WIDTH / 2 - 60 + index * 40;
            const y = CANVAS_HEIGHT / 2 + 90;
            
            ctx.fillStyle = config.color;
            ctx.beginPath();
            ctx.arc(x, y, 15, 0, 2 * Math.PI);
            ctx.fill();
            
            ctx.font = '16px Arial';
            ctx.fillText(config.icon, x, y + 5);
          });
          
          // Animated instruction text
          const pulseAlpha = 0.5 + 0.5 * Math.sin(Date.now() * 0.005);
          ctx.fillStyle = `rgba(255, 255, 255, ${pulseAlpha})`;
          ctx.font = '18px Arial';
          ctx.fillText('🎮 Get ready to flap!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 130);
        }

        if (gameOver) {
          // Semi-transparent overlay
          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
          ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
          
          // Game Over with red glow
          ctx.shadowColor = '#FF0000';
          ctx.shadowBlur = 15;
          ctx.fillStyle = '#FF4444';
          ctx.font = 'bold 48px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Game Over', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
          
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#FFF';
          ctx.font = '28px Arial';
          ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
          
          ctx.font = '20px Arial';
          ctx.fillText('Click or Press Space to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
          
          // Add some emoji for fun
          ctx.font = '32px Arial';
          ctx.fillText('💥', CANVAS_WIDTH / 2 - 100, CANVAS_HEIGHT / 2 - 30);
          ctx.fillText('💥', CANVAS_WIDTH / 2 + 100, CANVAS_HEIGHT / 2 - 30);
        }

        ctx.textAlign = 'left';
        ctx.shadowBlur = 0;
      }
    }

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [
    gameStarted, gameOver, bird, pipes, powerUps, activePowerUps, particles, scorePopups, touchFeedback, isMobile,
    playScoreSound, playCollisionSound, updateAnimations, startDeathAnimation, createParticles, createScorePopup,
    getGameSpeedMultiplier, getBirdSizeMultiplier, isBirdInvulnerable, trackPerformance, qualitySettings,
    CANVAS_WIDTH, CANVAS_HEIGHT, PIPE_SPEED, PIPE_WIDTH, PIPE_GAP, BIRD_SIZE, GRAVITY, magnetTrails, achievementNotifications
  ]);

  // Start game loop and render
  useEffect(() => {
    const startGameLoop = (timestamp: number) => {
      gameLoop(timestamp);
    };
    
    animationRef.current = requestAnimationFrame(startGameLoop);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameLoop]);

  // Input handling
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Initialize audio on first interaction
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
      
      if (e.code === 'Space') {
        e.preventDefault();
        if (gameOver) {
          resetGame();
        } else {
          flapBird();
        }
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        toggleMusic();
      }
    };

    const handleClick = () => {
      // Initialize audio on first interaction
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
      
      if (gameOver) {
        resetGame();
      } else {
        flapBird();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [gameOver, flapBird, resetGame]);

  // Initialize procedural music only on client side with proper error handling
  const initializeMusic = useCallback(async () => {
    if (typeof window === 'undefined' || musicInitializedRef.current) return;
    
    try {
      const { ProceduralMusic } = await import('../lib/proceduralMusic');
      proceduralMusicRef.current = new ProceduralMusic();
      musicInitializedRef.current = true;
    } catch (error) {
      console.warn('Failed to initialize music system:', error);
    }
  }, []);

  // Get music instance safely
  const getMusic = useCallback(() => {
    return proceduralMusicRef.current;
  }, []);

  // Music management functions with safe fallbacks
  const startMusic = useCallback(async () => {
    if (!musicEnabled) return;
    
    if (!musicInitializedRef.current) {
      await initializeMusic();
    }
    
    const music = getMusic();
    if (music && !music.isActive()) {
      music.start();
      music.fadeIn(1);
    }
  }, [musicEnabled, initializeMusic, getMusic]);

  const stopMusic = useCallback(() => {
    const music = getMusic();
    if (music && music.isActive()) {
      music.fadeOut(1);
    }
  }, [getMusic]);

  const updateMusicVolume = useCallback(async (volume: number) => {
    if (!musicInitializedRef.current) {
      await initializeMusic();
    }
    
    const music = getMusic();
    if (music) {
      music.setVolume(volume);
    }
    setMusicVolume(volume);
  }, [initializeMusic, getMusic]);

  const toggleMusic = useCallback(() => {
    const newMusicEnabled = !musicEnabled;
    setMusicEnabled(newMusicEnabled);
    
    if (newMusicEnabled && gameStarted && !gameOver) {
      startMusic();
    } else {
      stopMusic();
    }
  }, [musicEnabled, gameStarted, gameOver, startMusic, stopMusic]);

  // Update music based on day/night cycle
  useEffect(() => {
    if (gameStarted && typeof window !== 'undefined') {
      const timeInfo = dayNightCycleRef.current.getCurrentTimeInfo(score);
      const currentTimeOfDay = timeInfo.name.toLowerCase();
      
      if (currentTimeOfDay !== lastTimeOfDayRef.current) {
        const music = getMusic();
        if (music) {
          music.setTimeOfDay(currentTimeOfDay);
        }
        lastTimeOfDayRef.current = currentTimeOfDay;
      }
    }
  }, [score, gameStarted, getMusic]);

  // Music state management
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (gameStarted && !gameOver && musicEnabled) {
        startMusic();
      } else {
        stopMusic();
      }
    }
  }, [gameStarted, gameOver, musicEnabled, startMusic, stopMusic]);

  // Update music volume
  useEffect(() => {
    if (typeof window !== 'undefined' && musicEnabled) {
      updateMusicVolume(musicVolume);
    }
  }, [musicVolume, musicEnabled, updateMusicVolume]);

  // Cleanup music on unmount
  useEffect(() => {
    return () => {
      const music = proceduralMusicRef.current;
      if (music) {
        music.stop();
      }
    };
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Simple Flappy Bird</h1>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={() => {
            // Initialize audio on first interaction
            if (audioContextRef.current?.state === 'suspended') {
              audioContextRef.current.resume();
            }
            
            if (gameOver) {
              resetGame();
            } else {
              flapBird();
            }
          }}
          onTouchStart={(e) => {
            e.preventDefault(); // Prevent scrolling on mobile
            
            // Initialize audio on first interaction
            if (audioContextRef.current?.state === 'suspended') {
              audioContextRef.current.resume();
            }
            
            // Get touch position relative to canvas
            const rect = canvasRef.current?.getBoundingClientRect();
            if (rect && e.touches[0]) {
              const touch = e.touches[0];
              const x = (touch.clientX - rect.left) * (CANVAS_WIDTH / rect.width);
              const y = (touch.clientY - rect.top) * (CANVAS_HEIGHT / rect.height);
              
              // Create touch feedback
              createTouchFeedback(x, y);
            }
            
            if (gameOver) {
              resetGame();
            } else {
              flapBird();
            }
          }}
          className="border-2 border-gray-300 cursor-pointer rounded-lg shadow-lg touch-none"
        />
        <div className="mt-4 text-gray-600">
          <p>Click canvas or press SPACE to flap</p>
          <p>Press M to toggle music</p>
          <p>Score: {score}</p>
          
          <div className="flex flex-wrap gap-2 mt-3 justify-center">
            <button
              onClick={() => setShowPerformanceMonitor(!showPerformanceMonitor)}
              className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded transition-colors"
            >
              {showPerformanceMonitor ? 'Hide' : 'Show'} Performance
            </button>
            
            <button
              onClick={toggleMusic}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                musicEnabled 
                  ? 'bg-green-200 hover:bg-green-300 text-green-800' 
                  : 'bg-red-200 hover:bg-red-300 text-red-800'
              }`}
            >
              🎵 Music {musicEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
          
          {/* Music Volume Control */}
          {musicEnabled && (
            <div className="mt-3 flex items-center justify-center gap-2">
              <span className="text-xs text-gray-500">🔊 Volume:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={musicVolume}
                onChange={(e) => updateMusicVolume(parseFloat(e.target.value))}
                className="w-20 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-xs text-gray-500 w-8">{Math.round(musicVolume * 100)}%</span>
            </div>
          )}
          
          {/* Music Status Indicator */}
          {musicEnabled && gameStarted && (
            <div className="mt-2 text-xs text-gray-500 text-center">
              🎼 Playing: {musicInitializedRef.current 
                ? `${lastTimeOfDayRef.current.charAt(0).toUpperCase() + lastTimeOfDayRef.current.slice(1)} Theme`
                : 'Loading...'
              }
            </div>
          )}
        </div>
      </div>
      
      {/* Performance Monitor */}
      <PerformanceMonitor
        particleCount={particles.length}
        gameObjects={pipes.length + (bird ? 1 : 0)}
        canvasWidth={CANVAS_WIDTH}
        canvasHeight={CANVAS_HEIGHT}
        isVisible={showPerformanceMonitor}
      />
    </div>
  );
};

export default SimpleGame; 