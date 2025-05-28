// Sprite and animation types
export interface SpriteFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Sprite {
  id: string;
  image: HTMLImageElement | null;
  frame: SpriteFrame;
  width: number;
  height: number;
  loaded: boolean;
}

export interface AnimatedSprite extends Sprite {
  frames: SpriteFrame[];
  currentFrame: number;
  frameRate: number; // frames per second
  lastFrameTime: number;
  loop: boolean;
  playing: boolean;
}

export interface SpriteSheet {
  id: string;
  image: HTMLImageElement | null;
  loaded: boolean;
  sprites: Map<string, Sprite>;
  animations: Map<string, AnimatedSprite>;
}

export interface RenderOptions {
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  alpha?: number;
  flipX?: boolean;
  flipY?: boolean;
  centerX?: number;
  centerY?: number;
}

export interface SpriteConfig {
  id: string;
  src: string;
  frame?: SpriteFrame;
  animations?: {
    [key: string]: {
      frames: SpriteFrame[];
      frameRate: number;
      loop: boolean;
    };
  };
}

// Bird sprite states
export type BirdAnimationState = 'idle' | 'flap' | 'fall' | 'dead';

// Game sprite collections
export interface GameSprites {
  bird: {
    idle: Sprite;
    flap: AnimatedSprite;
    fall: Sprite;
    dead: Sprite;
  };
  pipes: {
    top: Sprite;
    bottom: Sprite;
    body: Sprite;
  };
  background: {
    sky: Sprite;
    ground: Sprite;
    clouds: Sprite[];
  };
  ui: {
    numbers: Sprite[];
    gameOver: Sprite;
    getReady: Sprite;
    playButton: Sprite;
  };
} 