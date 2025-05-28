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