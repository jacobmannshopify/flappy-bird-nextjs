export type AchievementCategory = 'score' | 'distance' | 'powerup' | 'skill' | 'progression' | 'special';

export type AchievementDifficulty = 'bronze' | 'silver' | 'gold' | 'platinum' | 'legendary';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  difficulty: AchievementDifficulty;
  icon: string;
  requirement: {
    type: string;
    value: number;
    condition?: string;
  };
  rewards: {
    points: number;
    title?: string;
  };
  hidden: boolean; // Whether achievement is visible before unlocking
  unlocked: boolean;
  progress: number;
  unlockedAt?: number; // Timestamp when unlocked
}

export interface AchievementProgress {
  totalScore: number;
  maxScore: number;
  totalDistance: number;
  maxDistance: number;
  gamesPlayed: number;
  totalPlayTime: number;
  powerUpsCollected: {
    shield: number;
    slowmo: number;
    tiny: number;
    magnet: number;
    total: number;
  };
  skillStats: {
    perfectRuns: number; // No collisions for X score
    closeCallsAvoided: number; // Near misses
    rapidFlaps: number; // Fast consecutive flaps
    steadyFlying: number; // Consistent altitude
  };
  streaks: {
    currentWinStreak: number;
    bestWinStreak: number;
    currentPlayStreak: number;
    bestPlayStreak: number;
  };
  sessionStats: {
    startTime: number;
    currentScore: number;
    currentDistance: number;
    powerUpsThisSession: number;
    collisionsThisSession: number;
  };
}

export interface AchievementNotification {
  id: string;
  achievement: Achievement;
  timestamp: number;
  seen: boolean;
}

export interface AchievementSystemState {
  achievements: Record<string, Achievement>;
  progress: AchievementProgress;
  notifications: AchievementNotification[];
  totalAchievementPoints: number;
  unlockedCount: number;
  lastUpdated: number;
} 