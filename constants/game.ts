import { GameConfig } from '@/types/game';

// Default game configuration
export const DEFAULT_GAME_CONFIG: GameConfig = {
  canvas: {
    width: 800,
    height: 600,
  },
  bird: {
    size: 24,
    startX: 100,
    startY: 300,
  },
  pipes: {
    width: 60,
    gapHeight: 180,
    spacing: 300,
    spawnRate: 0.003, // Probability per frame
  },
  physics: {
    gravity: 0.6,
    jumpVelocity: -12,
    terminalVelocity: 15,
    pipeSpeed: 2,
  },
};

// Game colors
export const COLORS = {
  sky: '#87CEEB',
  ground: '#DEB887',
  pipe: '#228B22',
  bird: '#FFD700',
  text: '#333333',
  shadow: 'rgba(0, 0, 0, 0.3)',
  white: '#FFFFFF',
} as const;

// Z-index layers for rendering
export const LAYERS = {
  BACKGROUND: 0,
  PIPES: 1,
  GROUND: 2,
  BIRD: 3,
  PARTICLES: 4,
  UI: 5,
} as const;

// Game timing constants
export const TIMING = {
  TARGET_FPS: 60,
  FRAME_TIME: 1000 / 60, // 16.67ms per frame
  PIPE_SPAWN_DISTANCE: 300,
  RESPAWN_DELAY: 1000, // 1 second
} as const;

// Score constants
export const SCORING = {
  PIPE_CLEAR: 1,
  PERFECT_LANDING_BONUS: 5,
  CONSECUTIVE_BONUS_MULTIPLIER: 0.1,
} as const;

// Input constants
export const INPUT = {
  KEYBOARD_KEYS: {
    SPACE: 'Space',
    ENTER: 'Enter',
    ESCAPE: 'Escape',
    R: 'KeyR',
  },
  TOUCH_DEADZONE: 10, // pixels
  DOUBLE_TAP_TIME: 300, // milliseconds
} as const;

// Canvas rendering constants (safe for SSR)
export const RENDERING = {
  get PIXEL_RATIO() {
    return typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  },
  SMOOTH_SCALING: false,
  FPS: 60,
  DEBUG_MODE: false,
  CANVAS_SCALE: 1,
  BIRD_GLOW_RADIUS: 15,
  PIPE_GLOW_RADIUS: 20,
  BACKGROUND_PARALLAX_SPEED: 1.5, // Base speed for parallax layers
} as const;

// Animation constants
export const ANIMATION = {
  BIRD_FLAP_FRAMES: 3,
  BIRD_FLAP_SPEED: 0.2,
  DEATH_ROTATION_SPEED: 0.3,
  UI_FADE_SPEED: 0.05,
  
  // Death animation
  DEATH_DURATION: 2000,
  DEATH_ROTATION_MULTIPLIER: 3,
  
  // Score popup
  SCORE_POPUP_DURATION: 1500,
  SCORE_POPUP_RISE_SPEED: 2,
  SCORE_POPUP_SCALE_MAX: 1.2,
  
  // Screen flash
  SCREEN_FLASH_DURATION: 300,
  SCREEN_FLASH_INTENSITY: 0.4,
  
  // Particle system
  COLLISION_PARTICLES: 15,
  SCORE_PARTICLES: 8,
  PARTICLE_LIFE_MIN: 600,
  PARTICLE_LIFE_MAX: 1500,
  PARTICLE_SIZE_MIN: 2,
  PARTICLE_SIZE_MAX: 8,
  PARTICLE_SPEED_MIN: 1,
  PARTICLE_SPEED_MAX: 8,
  PARTICLE_GRAVITY: 0.15,
} as const;

// Particle colors
export const PARTICLE_COLORS = {
  COLLISION: ['#ff6b6b', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd'],
  CELEBRATION: ['#00d2d3', '#ff9f43', '#55a3ff', '#26de81'],
  SPARKLE: ['#ffffff', '#ffeb3b', '#03dac6'],
} as const;

// Development and debugging
export const DEBUG = {
  SHOW_HITBOXES: false,
  SHOW_FPS: true,
  LOG_PHYSICS: false,
  INVINCIBLE_MODE: false,
  SHOW_ANIMATION_DEBUG: false,
} as const; 