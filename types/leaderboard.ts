export interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  timestamp: number;
  gameStats: GameStatistics;
  achievementProgress: {
    totalUnlocked: number;
    totalPoints: number;
    completionPercentage: number;
  };
  rank: number;
}

export interface GameStatistics {
  playTime: number; // Total game duration in milliseconds
  pipesCleared: number; // Number of pipes successfully passed
  powerUpsCollected: {
    shield: number;
    slowmo: number;
    tiny: number;
    magnet: number;
    total: number;
  };
  averageScore: number; // Rolling average of recent games
  bestStreak: number; // Longest consecutive high-score games
  gamesPlayed: number; // Total games in this session
  collisionType?: 'pipe' | 'ground' | 'ceiling'; // How the game ended
  finalState: {
    birdY: number;
    velocity: number;
    activePowerUps: string[];
  };
}

export interface LeaderboardState {
  entries: LeaderboardEntry[];
  playerStats: PlayerStatistics;
  sessionStats: SessionStatistics;
  lastUpdated: number;
}

export interface PlayerStatistics {
  totalGamesPlayed: number;
  totalPlayTime: number;
  highScore: number;
  averageScore: number;
  totalScore: number;
  bestRank: number;
  powerUpStats: {
    shield: { collected: number; effectiveness: number };
    slowmo: { collected: number; effectiveness: number };
    tiny: { collected: number; effectiveness: number };
    magnet: { collected: number; effectiveness: number };
  };
  achievementStats: {
    totalUnlocked: number;
    totalPoints: number;
    categoriesCompleted: number;
    completionPercentage: number;
  };
  streakStats: {
    currentStreak: number;
    bestStreak: number;
    streakType: 'improvement' | 'high_score' | 'none';
  };
}

export interface SessionStatistics {
  sessionStartTime: number;
  gamesThisSession: number;
  bestScoreThisSession: number;
  totalScoreThisSession: number;
  powerUpsCollectedThisSession: number;
  improvementFromLastSession: number;
  sessionDuration: number;
}

export interface ScoreExport {
  playerName: string;
  score: number;
  rank: number;
  gameDate: string;
  gameStats: GameStatistics;
  achievements: string[];
  gameVersion: string;
  exportTimestamp: number;
}

export type LeaderboardSortOption = 'score' | 'date' | 'playTime' | 'powerUps' | 'achievements';
export type LeaderboardFilterOption = 'all' | 'recent' | 'today' | 'thisWeek' | 'personal';

export interface LeaderboardFilters {
  sortBy: LeaderboardSortOption;
  filterBy: LeaderboardFilterOption;
  showStats: boolean;
  showAchievements: boolean;
} 