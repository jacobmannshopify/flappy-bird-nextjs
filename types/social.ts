export interface ShareableScore {
  id: string;
  playerName: string;
  score: number;
  rank: number;
  timestamp: number;
  gameStats: {
    playTime: number;
    pipesCleared: number;
    powerUpsCollected: number;
    averageScore: number;
  };
  achievements: {
    unlockedInGame: string[];
    totalUnlocked: number;
    totalPoints: number;
  };
  gameContext: {
    gameMode?: string;
    difficulty?: string;
    specialConditions?: string[];
  };
}

export interface SocialStats {
  totalShares: number;
  popularShareType: 'score' | 'achievement' | 'milestone';
  shareStreaks: {
    current: number;
    best: number;
  };
  communityRank: number;
  engagementScore: number;
}

export interface ShareTemplate {
  id: string;
  type: 'score' | 'achievement' | 'milestone' | 'streak';
  title: string;
  description: string;
  hashtags: string[];
  icon: string;
  bgColor: string;
  textColor: string;
}

export type SocialPlatform = 'twitter' | 'facebook' | 'reddit' | 'discord' | 'clipboard' | 'file';

export interface ShareOptions {
  includeScore: boolean;
  includeStats: boolean;
  includeAchievements: boolean;
  includeGameMode: boolean;
  includeTimestamp: boolean;
  customMessage?: string;
  template?: string;
  platform?: SocialPlatform;
}

export interface MilestoneShare {
  id: string;
  type: 'score_milestone' | 'time_played' | 'games_played' | 'achievement_milestone';
  title: string;
  description: string;
  value: number;
  threshold: number;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  timestamp: number;
}

export interface CompetitiveChallenge {
  id: string;
  title: string;
  description: string;
  type: 'score_challenge' | 'time_challenge' | 'streak_challenge' | 'power_up_challenge';
  requirements: {
    target: number;
    timeLimit?: number;
    conditions?: string[];
  };
  rewards: {
    points: number;
    title?: string;
    badge?: string;
  };
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
  startDate: number;
  endDate: number;
  status: 'active' | 'completed' | 'failed' | 'upcoming';
}

export interface LeaderboardComparison {
  yourRank: number;
  yourScore: number;
  nearbyPlayers: {
    rank: number;
    name: string;
    score: number;
    isYou: boolean;
  }[];
  percentile: number;
  improvementNeeded: {
    nextRank: number;
    pointsNeeded: number;
  };
}

export type ShareFormat = 'text' | 'image' | 'url' | 'json'; 