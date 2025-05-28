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
  UI: 4,
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
  BACKGROUND_PARALLAX_SPEED: 0.5,
} as const;

// Animation constants
export const ANIMATION = {
  BIRD_FLAP_FRAMES: 3,
  BIRD_FLAP_SPEED: 0.2,
  DEATH_ROTATION_SPEED: 0.3,
  UI_FADE_SPEED: 0.05,
} as const;

// Development and debugging
export const DEBUG = {
  SHOW_HITBOXES: false,
  SHOW_FPS: true,
  LOG_PHYSICS: false,
  INVINCIBLE_MODE: false,
} as const; 