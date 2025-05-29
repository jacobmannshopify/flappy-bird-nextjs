import { PowerUpConfig, PowerUpSpawnConfig, PowerUpVisualConfig, PowerUpType } from '../types/powerUps';

// Power-up configurations for each type
export const POWER_UP_CONFIGS: Record<PowerUpType, PowerUpConfig> = {
  shield: {
    type: 'shield',
    name: 'Shield',
    icon: '🛡️',
    color: '#4ECDC4',
    glowColor: '#40E0D0',
    duration: 5000, // 5 seconds
    description: 'Temporary invincibility',
    effect: {
      shield: {
        invulnerable: true
      }
    }
  },
  slowmo: {
    type: 'slowmo',
    name: 'Slow Motion',
    icon: '⏱️',
    color: '#9B59B6',
    glowColor: '#E74C3C',
    duration: 4000, // 4 seconds
    description: 'Slows down time',
    effect: {
      slowmo: {
        speedMultiplier: 0.5 // Half speed
      }
    }
  },
  tiny: {
    type: 'tiny',
    name: 'Tiny Bird',
    icon: '🔬',
    color: '#F39C12',
    glowColor: '#F1C40F',
    duration: 6000, // 6 seconds
    description: 'Smaller collision box',
    effect: {
      tiny: {
        sizeMultiplier: 0.6 // 60% of original size
      }
    }
  },
  magnet: {
    type: 'magnet',
    name: 'Magnet',
    icon: '🧲',
    color: '#E74C3C',
    glowColor: '#C0392B',
    duration: 8000, // 8 seconds
    description: 'Attracts nearby power-ups',
    effect: {
      magnet: {
        attractionRadius: 80,
        attractionStrength: 0.3
      }
    }
  }
};

// Spawn configuration
export const POWER_UP_SPAWN_CONFIG: PowerUpSpawnConfig = {
  spawnChance: 0.2, // 20% chance
  minSpawnInterval: 8000, // 8 seconds minimum between spawns
  maxActiveCount: 2, // Max 2 power-ups on screen
  despawnTime: 15000 // 15 seconds before disappearing
};

// Visual configuration
export const POWER_UP_VISUAL_CONFIG: PowerUpVisualConfig = {
  size: 24, // Base size in pixels
  floatAmplitude: 8, // 8 pixels up/down floating
  floatSpeed: 0.002, // Floating animation speed
  glowIntensity: 15, // Shadow blur for glow effect
  particleCount: 12 // Particles created on collection
};

// Power-up spawn weights (relative probability)
export const POWER_UP_SPAWN_WEIGHTS: Record<PowerUpType, number> = {
  shield: 25,   // 25% of spawns
  slowmo: 30,   // 30% of spawns  
  tiny: 25,     // 25% of spawns
  magnet: 20    // 20% of spawns
};

// Power-up audio frequencies for collection sounds
export const POWER_UP_AUDIO_CONFIG: Record<PowerUpType, { frequency: number; duration: number }> = {
  shield: { frequency: 440, duration: 300 },    // A4 note
  slowmo: { frequency: 329.63, duration: 400 }, // E4 note
  tiny: { frequency: 523.25, duration: 200 },   // C5 note
  magnet: { frequency: 392, duration: 350 }     // G4 note
}; 