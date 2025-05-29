import { Achievement, AchievementProgress } from '../types/achievements';

// Achievement configuration data
export const ACHIEVEMENTS_CONFIG: Record<string, Omit<Achievement, 'unlocked' | 'progress' | 'unlockedAt'>> = {
  // Score-based achievements
  'first_score': {
    id: 'first_score',
    name: 'First Flight',
    description: 'Score your first point',
    category: 'score',
    difficulty: 'bronze',
    icon: '🏅',
    requirement: { type: 'single_score', value: 1 },
    rewards: { points: 10 },
    hidden: false
  },
  'score_10': {
    id: 'score_10',
    name: 'Rising Star',
    description: 'Reach a score of 10',
    category: 'score',
    difficulty: 'bronze',
    icon: '⭐',
    requirement: { type: 'single_score', value: 10 },
    rewards: { points: 25 },
    hidden: false
  },
  'score_25': {
    id: 'score_25',
    name: 'Sky Walker',
    description: 'Reach a score of 25',
    category: 'score',
    difficulty: 'silver',
    icon: '🌟',
    requirement: { type: 'single_score', value: 25 },
    rewards: { points: 50 },
    hidden: false
  },
  'score_50': {
    id: 'score_50',
    name: 'Cloud Surfer',
    description: 'Reach a score of 50',
    category: 'score',
    difficulty: 'gold',
    icon: '☁️',
    requirement: { type: 'single_score', value: 50 },
    rewards: { points: 100 },
    hidden: false
  },
  'score_100': {
    id: 'score_100',
    name: 'Century Flyer',
    description: 'Reach a score of 100',
    category: 'score',
    difficulty: 'platinum',
    icon: '💯',
    requirement: { type: 'single_score', value: 100 },
    rewards: { points: 250, title: 'Century Flyer' },
    hidden: false
  },
  'total_score_1000': {
    id: 'total_score_1000',
    name: 'Point Collector',
    description: 'Accumulate 1,000 total points',
    category: 'progression',
    difficulty: 'silver',
    icon: '💰',
    requirement: { type: 'total_score', value: 1000 },
    rewards: { points: 75 },
    hidden: false
  },

  // Power-up achievements
  'first_powerup': {
    id: 'first_powerup',
    name: 'Power Player',
    description: 'Collect your first power-up',
    category: 'powerup',
    difficulty: 'bronze',
    icon: '⚡',
    requirement: { type: 'powerup_collected', value: 1 },
    rewards: { points: 15 },
    hidden: false
  },
  'shield_master': {
    id: 'shield_master',
    name: 'Shield Master',
    description: 'Collect 25 shield power-ups',
    category: 'powerup',
    difficulty: 'silver',
    icon: '🛡️',
    requirement: { type: 'powerup_type_collected', value: 25, condition: 'shield' },
    rewards: { points: 60 },
    hidden: false
  },
  'slowmo_expert': {
    id: 'slowmo_expert',
    name: 'Time Bender',
    description: 'Collect 25 slow-motion power-ups',
    category: 'powerup',
    difficulty: 'silver',
    icon: '⏱️',
    requirement: { type: 'powerup_type_collected', value: 25, condition: 'slowmo' },
    rewards: { points: 60 },
    hidden: false
  },
  'tiny_specialist': {
    id: 'tiny_specialist',
    name: 'Tiny Flyer',
    description: 'Collect 25 tiny bird power-ups',
    category: 'powerup',
    difficulty: 'silver',
    icon: '🔬',
    requirement: { type: 'powerup_type_collected', value: 25, condition: 'tiny' },
    rewards: { points: 60 },
    hidden: false
  },
  'magnet_enthusiast': {
    id: 'magnet_enthusiast',
    name: 'Magnetic Personality',
    description: 'Collect 25 magnet power-ups',
    category: 'powerup',
    difficulty: 'silver',
    icon: '🧲',
    requirement: { type: 'powerup_type_collected', value: 25, condition: 'magnet' },
    rewards: { points: 60 },
    hidden: false
  },
  'powerup_hoarder': {
    id: 'powerup_hoarder',
    name: 'Power Hoarder',
    description: 'Collect 100 total power-ups',
    category: 'powerup',
    difficulty: 'gold',
    icon: '💎',
    requirement: { type: 'total_powerups', value: 100 },
    rewards: { points: 150 },
    hidden: false
  },

  // Skill-based achievements
  'perfect_start': {
    id: 'perfect_start',
    name: 'Perfect Start',
    description: 'Reach score 10 without using any power-ups',
    category: 'skill',
    difficulty: 'silver',
    icon: '🎯',
    requirement: { type: 'score_no_powerups', value: 10 },
    rewards: { points: 80 },
    hidden: false
  },
  'endurance_flyer': {
    id: 'endurance_flyer',
    name: 'Endurance Flyer',
    description: 'Play for 10 minutes in a single session',
    category: 'skill',
    difficulty: 'gold',
    icon: '⏰',
    requirement: { type: 'session_time', value: 600000 }, // 10 minutes in ms
    rewards: { points: 120 },
    hidden: false
  },
  'rapid_flapper': {
    id: 'rapid_flapper',
    name: 'Rapid Flapper',
    description: 'Make 20 flaps in 5 seconds',
    category: 'skill',
    difficulty: 'silver',
    icon: '⚡',
    requirement: { type: 'rapid_flaps', value: 20 },
    rewards: { points: 70 },
    hidden: false
  },
  'close_call_king': {
    id: 'close_call_king',
    name: 'Close Call King',
    description: 'Avoid 50 close calls with pipes',
    category: 'skill',
    difficulty: 'gold',
    icon: '😅',
    requirement: { type: 'close_calls', value: 50 },
    rewards: { points: 100 },
    hidden: false
  },

  // Progression achievements
  'dedicated_player': {
    id: 'dedicated_player',
    name: 'Dedicated Player',
    description: 'Play 25 games',
    category: 'progression',
    difficulty: 'bronze',
    icon: '🎮',
    requirement: { type: 'games_played', value: 25 },
    rewards: { points: 40 },
    hidden: false
  },
  'veteran_flyer': {
    id: 'veteran_flyer',
    name: 'Veteran Flyer',
    description: 'Play 100 games',
    category: 'progression',
    difficulty: 'gold',
    icon: '🏆',
    requirement: { type: 'games_played', value: 100 },
    rewards: { points: 200, title: 'Veteran Flyer' },
    hidden: false
  },
  'win_streak_3': {
    id: 'win_streak_3',
    name: 'Hot Streak',
    description: 'Score 10+ points in 3 consecutive games',
    category: 'progression',
    difficulty: 'silver',
    icon: '🔥',
    requirement: { type: 'win_streak', value: 3 },
    rewards: { points: 90 },
    hidden: false
  },

  // Special/Hidden achievements
  'time_traveler': {
    id: 'time_traveler',
    name: 'Time Traveler',
    description: 'Use slow-motion while the shield is active',
    category: 'special',
    difficulty: 'gold',
    icon: '🌀',
    requirement: { type: 'combo_slowmo_shield', value: 1 },
    rewards: { points: 150 },
    hidden: true
  },
  'tiny_tank': {
    id: 'tiny_tank',
    name: 'Tiny Tank',
    description: 'Use tiny bird while the shield is active',
    category: 'special',
    difficulty: 'gold',
    icon: '🛡️',
    requirement: { type: 'combo_tiny_shield', value: 1 },
    rewards: { points: 150 },
    hidden: true
  },
  'power_master': {
    id: 'power_master',
    name: 'Power Master',
    description: 'Have all 4 power-up types active simultaneously',
    category: 'special',
    difficulty: 'legendary',
    icon: '👑',
    requirement: { type: 'all_powerups_active', value: 1 },
    rewards: { points: 500, title: 'Power Master' },
    hidden: true
  },
  'flappy_legend': {
    id: 'flappy_legend',
    name: 'Flappy Legend',
    description: 'Reach a score of 200',
    category: 'score',
    difficulty: 'legendary',
    icon: '👑',
    requirement: { type: 'single_score', value: 200 },
    rewards: { points: 1000, title: 'Flappy Legend' },
    hidden: true
  }
};

// Default achievement progress
export const DEFAULT_ACHIEVEMENT_PROGRESS: AchievementProgress = {
  totalScore: 0,
  maxScore: 0,
  totalDistance: 0,
  maxDistance: 0,
  gamesPlayed: 0,
  totalPlayTime: 0,
  powerUpsCollected: {
    shield: 0,
    slowmo: 0,
    tiny: 0,
    magnet: 0,
    total: 0
  },
  skillStats: {
    perfectRuns: 0,
    closeCallsAvoided: 0,
    rapidFlaps: 0,
    steadyFlying: 0
  },
  streaks: {
    currentWinStreak: 0,
    bestWinStreak: 0,
    currentPlayStreak: 0,
    bestPlayStreak: 0
  },
  sessionStats: {
    startTime: 0,
    currentScore: 0,
    currentDistance: 0,
    powerUpsThisSession: 0,
    collisionsThisSession: 0
  }
};

// Achievement difficulty colors and point values
export const ACHIEVEMENT_DIFFICULTY_CONFIG = {
  bronze: { color: '#CD7F32', minPoints: 10, maxPoints: 50 },
  silver: { color: '#C0C0C0', minPoints: 50, maxPoints: 100 },
  gold: { color: '#FFD700', minPoints: 100, maxPoints: 250 },
  platinum: { color: '#E5E4E2', minPoints: 200, maxPoints: 500 },
  legendary: { color: '#9966CC', minPoints: 500, maxPoints: 1000 }
}; 