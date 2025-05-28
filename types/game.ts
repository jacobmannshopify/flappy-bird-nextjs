// Core game state types
export interface GameState {
  isGameRunning: boolean;
  isGameOver: boolean;
  isPaused: boolean;
  score: number;
  highScore: number;
  gameMode: GameMode;
}

export type GameMode = 'menu' | 'playing' | 'paused' | 'gameOver';

// Entity position and dimensions
export interface Position {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface BoundingBox extends Position, Dimensions {}

// Bird entity types
export interface Bird extends Position {
  velocity: number;
  rotation: number;
  isAlive: boolean;
  flapStrength: number;
}

// Pipe entity types
export interface Pipe extends Position, Dimensions {
  id: string;
  passed: boolean;
  gapY: number;
  gapHeight: number;
  style: 'green' | 'blue' | 'red';
}

// Physics types
export interface PhysicsConfig {
  gravity: number;
  jumpVelocity: number;
  terminalVelocity: number;
  pipeSpeed: number;
}

// Game configuration
export interface GameConfig {
  canvas: {
    width: number;
    height: number;
  };
  bird: {
    size: number;
    startX: number;
    startY: number;
  };
  pipes: {
    width: number;
    gapHeight: number;
    spacing: number;
    spawnRate: number;
  };
  physics: PhysicsConfig;
}

// Input handling
export type InputType = 'keyboard' | 'mouse' | 'touch';

export interface InputEvent {
  type: InputType;
  action: 'flap' | 'start' | 'pause' | 'restart';
  timestamp: number;
}

// Score and statistics
export interface GameStats {
  currentScore: number;
  highScore: number;
  totalPipesCleared: number;
  playTime: number;
  attempts: number;
}

// Canvas and rendering types
export interface CanvasContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
}

export interface RenderState {
  bird: Bird;
  pipes: Pipe[];
  score: number;
  gameState: GameMode;
}

// Animation system types
export interface AnimationConfig {
  duration: number;
  easing?: EasingFunction;
  delay?: number;
  loop?: boolean;
  autoStart?: boolean;
}

export type EasingFunction = (t: number) => number;

export interface Animation {
  id: string;
  startTime: number;
  duration: number;
  easing: EasingFunction;
  isActive: boolean;
  isComplete: boolean;
  onUpdate?: (progress: number, value: any) => void;
  onComplete?: () => void;
}

// Particle system types
export interface Particle extends Position {
  id: string;
  velocity: { x: number; y: number };
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
  gravity?: number;
  rotation?: number;
  rotationSpeed?: number;
}

export interface ParticleEmitterConfig {
  position: Position;
  particleCount: number;
  speed: { min: number; max: number };
  angle: { min: number; max: number };
  life: { min: number; max: number };
  size: { min: number; max: number };
  colors: string[];
  gravity?: number;
  burst?: boolean;
}

// Score popup animation
export interface ScorePopup extends Position {
  id: string;
  value: number;
  startTime: number;
  duration: number;
  isActive: boolean;
  alpha: number;
  scale: number;
}

// Screen flash effect
export interface ScreenFlash {
  isActive: boolean;
  startTime: number;
  duration: number;
  color: string;
  alpha: number;
  intensity: number;
}

// Death animation state
export interface DeathAnimation {
  isActive: boolean;
  startTime: number;
  duration: number;
  initialRotation: number;
  targetRotation: number;
  fallSpeed: number;
  bounceHeight?: number;
  hasBounced?: boolean;
} 