export interface GameMode {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert' | 'Legendary';
  unlockRequirement?: {
    type: 'score' | 'achievement' | 'games_played';
    value: number;
    description: string;
  };
  modifiers: GameModeModifiers;
  objectives?: GameModeObjective[];
}

export interface GameModeModifiers {
  // Physics modifiers
  gravity?: number; // Multiplier (1.0 = normal)
  flapStrength?: number; // Multiplier (1.0 = normal)
  gameSpeed?: number; // Multiplier (1.0 = normal)
  
  // Pipe system modifiers
  pipeSpacing?: number; // Multiplier (1.0 = normal)
  pipeGapSize?: number; // Multiplier (1.0 = normal)
  pipeSpeed?: number; // Multiplier (1.0 = normal)
  
  // Power-up system modifiers
  powerUpSpawnRate?: number; // Multiplier (1.0 = normal)
  powerUpDuration?: number; // Multiplier (1.0 = normal)
  powerUpEffectiveness?: number; // Multiplier (1.0 = normal)
  disabledPowerUps?: string[]; // Array of power-up IDs to disable
  
  // Scoring modifiers
  scoreMultiplier?: number; // Points multiplier (1.0 = normal)
  bonusPoints?: {
    condition: string;
    points: number;
  }[];
  
  // Time constraints
  timeLimit?: number; // Seconds (undefined = no limit)
  
  // Special mechanics
  invulnerabilityFrames?: number; // Milliseconds after collision
  respawnCount?: number; // Number of respawns allowed
  
  // Visual modifiers
  nightMode?: boolean;
  particleMultiplier?: number;
  backgroundSpeed?: number;
}

export interface GameModeObjective {
  id: string;
  description: string;
  type: 'score' | 'survival' | 'collection' | 'precision' | 'speed';
  target: number;
  current: number;
  completed: boolean;
  reward?: {
    type: 'points' | 'achievement' | 'unlock';
    value: string | number;
  };
}

export interface GameModeSession {
  modeId: string;
  startTime: Date;
  endTime?: Date;
  score: number;
  objectives: GameModeObjective[];
  statistics: {
    timeElapsed: number;
    pipesCleared: number;
    powerUpsCollected: number;
    perfectPipes: number; // Pipes passed through center
    nearMisses: number; // Close calls
    respawnsUsed: number;
  };
  completed: boolean;
  personalBest: boolean;
}

export interface GameModeStats {
  modeId: string;
  totalPlays: number;
  totalScore: number;
  bestScore: number;
  bestTime?: number;
  averageScore: number;
  completionRate: number;
  objectivesCompleted: number;
  totalObjectives: number;
  firstPlayDate: Date;
  lastPlayDate: Date;
}

// Predefined game modes
export const GAME_MODES: GameMode[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'The original Flappy Bird experience with no modifications',
    icon: '🐦',
    color: '#3B82F6',
    difficulty: 'Medium',
    modifiers: {
      // All default values (1.0 multipliers)
    }
  },
  {
    id: 'challenge',
    name: 'Challenge',
    description: 'Complete specific objectives for bonus points',
    icon: '🎯',
    color: '#EF4444',
    difficulty: 'Hard',
    unlockRequirement: {
      type: 'score',
      value: 10,
      description: 'Score 10 points in Classic mode'
    },
    modifiers: {
      scoreMultiplier: 1.5,
      bonusPoints: [
        { condition: 'perfect_pipe', points: 5 },
        { condition: 'no_power_ups', points: 10 },
        { condition: 'consecutive_perfect', points: 15 }
      ]
    },
    objectives: [
      {
        id: 'perfect_pipes',
        description: 'Pass through 5 pipes perfectly centered',
        type: 'precision',
        target: 5,
        current: 0,
        completed: false,
        reward: { type: 'points', value: 50 }
      },
      {
        id: 'no_power_ups',
        description: 'Score 15 points without collecting power-ups',
        type: 'score',
        target: 15,
        current: 0,
        completed: false,
        reward: { type: 'points', value: 100 }
      }
    ]
  },
  {
    id: 'speed_run',
    name: 'Speed Run',
    description: 'Race against time - reach 20 points as fast as possible',
    icon: '⚡',
    color: '#F59E0B',
    difficulty: 'Expert',
    unlockRequirement: {
      type: 'score',
      value: 15,
      description: 'Score 15 points in any mode'
    },
    modifiers: {
      gameSpeed: 1.3,
      scoreMultiplier: 2.0,
      powerUpSpawnRate: 1.5
    },
    objectives: [
      {
        id: 'time_trial',
        description: 'Reach 20 points in under 60 seconds',
        type: 'speed',
        target: 20,
        current: 0,
        completed: false,
        reward: { type: 'achievement', value: 'speed_demon' }
      }
    ]
  },
  {
    id: 'endurance',
    name: 'Endurance',
    description: 'Survive as long as possible with increasing difficulty',
    icon: '🏃',
    color: '#8B5CF6',
    difficulty: 'Expert',
    unlockRequirement: {
      type: 'achievement',
      value: 5,
      description: 'Unlock 5 achievements'
    },
    modifiers: {
      respawnCount: 3,
      invulnerabilityFrames: 1000,
      pipeGapSize: 0.9,
      // Difficulty increases over time
    },
    objectives: [
      {
        id: 'long_survival',
        description: 'Survive for 5 minutes',
        type: 'survival',
        target: 300, // 5 minutes in seconds
        current: 0,
        completed: false,
        reward: { type: 'achievement', value: 'endurance_master' }
      }
    ]
  },
  {
    id: 'power_focus',
    name: 'Power Focus',
    description: 'Enhanced power-up gameplay with special abilities',
    icon: '💫',
    color: '#10B981',
    difficulty: 'Hard',
    unlockRequirement: {
      type: 'score',
      value: 25,
      description: 'Score 25 points in Classic mode'
    },
    modifiers: {
      powerUpSpawnRate: 3.0,
      powerUpDuration: 1.5,
      powerUpEffectiveness: 1.2,
      scoreMultiplier: 1.3
    },
    objectives: [
      {
        id: 'power_collector',
        description: 'Collect 15 power-ups in a single game',
        type: 'collection',
        target: 15,
        current: 0,
        completed: false,
        reward: { type: 'points', value: 200 }
      }
    ]
  },
  {
    id: 'precision',
    name: 'Precision',
    description: 'Tight gaps require perfect navigation skills',
    icon: '🎯',
    color: '#EC4899',
    difficulty: 'Legendary',
    unlockRequirement: {
      type: 'achievement',
      value: 10,
      description: 'Unlock 10 achievements'
    },
    modifiers: {
      pipeGapSize: 0.7,
      flapStrength: 0.8,
      scoreMultiplier: 3.0,
      powerUpSpawnRate: 0.5
    },
    objectives: [
      {
        id: 'precision_master',
        description: 'Score 10 points with reduced gap size',
        type: 'score',
        target: 10,
        current: 0,
        completed: false,
        reward: { type: 'achievement', value: 'precision_pilot' }
      }
    ]
  }
];

export const DEFAULT_MODE = GAME_MODES[0]; // Classic mode 