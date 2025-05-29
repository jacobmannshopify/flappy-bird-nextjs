export type PowerUpType = 'shield' | 'slowmo' | 'tiny' | 'magnet';

export interface PowerUp {
  id: string;
  type: PowerUpType;
  x: number;
  y: number;
  collected: boolean;
  animationPhase: number; // For floating animation
  spawnTime: number;
}

export interface ActivePowerUp {
  type: PowerUpType;
  duration: number;
  maxDuration: number;
  startTime: number;
}

export interface PowerUpConfig {
  type: PowerUpType;
  name: string;
  icon: string;
  color: string;
  glowColor: string;
  duration: number; // in milliseconds
  description: string;
  effect: {
    // Effect-specific properties will be handled in game logic
    shield?: {
      invulnerable: boolean;
    };
    slowmo?: {
      speedMultiplier: number;
    };
    tiny?: {
      sizeMultiplier: number;
    };
    magnet?: {
      attractionRadius: number;
      attractionStrength: number;
    };
  };
}

export interface PowerUpSpawnConfig {
  spawnChance: number; // 0.0 to 1.0 (20% = 0.2)
  minSpawnInterval: number; // minimum time between spawns (ms)
  maxActiveCount: number; // max power-ups on screen at once
  despawnTime: number; // time before uncollected power-ups disappear (ms)
}

export interface PowerUpVisualConfig {
  size: number;
  floatAmplitude: number; // vertical floating animation range
  floatSpeed: number; // floating animation speed
  glowIntensity: number;
  particleCount: number; // particles on collection
} 