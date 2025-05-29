import {
  LeaderboardEntry,
  LeaderboardState,
  GameStatistics,
  PlayerStatistics,
  SessionStatistics,
  ScoreExport,
  LeaderboardSortOption,
  LeaderboardFilterOption
} from '../types/leaderboard';

const STORAGE_KEY = 'flappy-bird-leaderboard';
const MAX_ENTRIES = 10;
const GAME_VERSION = '1.0.0';

export class LeaderboardSystem {
  private state: LeaderboardState;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): LeaderboardState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          entries: parsed.entries || [],
          playerStats: {
            ...this.getDefaultPlayerStats(),
            ...parsed.playerStats
          },
          sessionStats: {
            ...this.getDefaultSessionStats(),
            ...parsed.sessionStats
          },
          lastUpdated: parsed.lastUpdated || Date.now()
        };
      }
    } catch (error) {
      console.warn('Failed to load leaderboard data:', error);
    }

    return {
      entries: [],
      playerStats: this.getDefaultPlayerStats(),
      sessionStats: this.getDefaultSessionStats(),
      lastUpdated: Date.now()
    };
  }

  private getDefaultPlayerStats(): PlayerStatistics {
    return {
      totalGamesPlayed: 0,
      totalPlayTime: 0,
      highScore: 0,
      averageScore: 0,
      totalScore: 0,
      bestRank: 0,
      powerUpStats: {
        shield: { collected: 0, effectiveness: 0 },
        slowmo: { collected: 0, effectiveness: 0 },
        tiny: { collected: 0, effectiveness: 0 },
        magnet: { collected: 0, effectiveness: 0 }
      },
      achievementStats: {
        totalUnlocked: 0,
        totalPoints: 0,
        categoriesCompleted: 0,
        completionPercentage: 0
      },
      streakStats: {
        currentStreak: 0,
        bestStreak: 0,
        streakType: 'none'
      }
    };
  }

  private getDefaultSessionStats(): SessionStatistics {
    return {
      sessionStartTime: Date.now(),
      gamesThisSession: 0,
      bestScoreThisSession: 0,
      totalScoreThisSession: 0,
      powerUpsCollectedThisSession: 0,
      improvementFromLastSession: 0,
      sessionDuration: 0
    };
  }

  private saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      this.state.lastUpdated = Date.now();
    } catch (error) {
      console.warn('Failed to save leaderboard data:', error);
    }
  }

  private generateEntryId(): string {
    return Date.now().toString() + Math.random().toString(36).substring(2);
  }

  private calculateRank(score: number): number {
    const betterScores = this.state.entries.filter(entry => entry.score > score).length;
    return betterScores + 1;
  }

  private updatePlayerStats(gameStats: GameStatistics, score: number): void {
    const stats = this.state.playerStats;
    
    // Update basic stats
    stats.totalGamesPlayed++;
    stats.totalPlayTime += gameStats.playTime;
    stats.totalScore += score;
    stats.averageScore = stats.totalScore / stats.totalGamesPlayed;
    
    // Update high score and rank
    if (score > stats.highScore) {
      stats.highScore = score;
      stats.bestRank = this.calculateRank(score);
    }

    // Update power-up stats
    const powerUpKeys = ['shield', 'slowmo', 'tiny', 'magnet'] as const;
    powerUpKeys.forEach(key => {
      if (key in gameStats.powerUpsCollected && key in stats.powerUpStats) {
        stats.powerUpStats[key].collected += gameStats.powerUpsCollected[key];
        
        // Calculate effectiveness (score per power-up)
        if (stats.powerUpStats[key].collected > 0) {
          stats.powerUpStats[key].effectiveness = 
            stats.totalScore / stats.powerUpStats[key].collected;
        }
      }
    });

    // Update streak stats
    if (score > stats.averageScore) {
      stats.streakStats.currentStreak++;
      stats.streakStats.streakType = 'improvement';
    } else {
      stats.streakStats.currentStreak = 0;
      stats.streakStats.streakType = 'none';
    }
    
    if (stats.streakStats.currentStreak > stats.streakStats.bestStreak) {
      stats.streakStats.bestStreak = stats.streakStats.currentStreak;
    }
  }

  private updateSessionStats(score: number, powerUpsCollected: number): void {
    const session = this.state.sessionStats;
    
    session.gamesThisSession++;
    session.totalScoreThisSession += score;
    session.powerUpsCollectedThisSession += powerUpsCollected;
    session.sessionDuration = Date.now() - session.sessionStartTime;
    
    if (score > session.bestScoreThisSession) {
      session.bestScoreThisSession = score;
    }
  }

  public startSession(): void {
    this.state.sessionStats = this.getDefaultSessionStats();
    this.saveState();
  }

  public submitScore(
    playerName: string,
    score: number,
    gameStats: GameStatistics,
    achievementProgress: { totalUnlocked: number; totalPoints: number; completionPercentage: number }
  ): LeaderboardEntry {
    const entry: LeaderboardEntry = {
      id: this.generateEntryId(),
      playerName,
      score,
      timestamp: Date.now(),
      gameStats,
      achievementProgress,
      rank: this.calculateRank(score)
    };

    // Add to entries and sort
    this.state.entries.push(entry);
    this.state.entries.sort((a, b) => b.score - a.score);
    
    // Keep only top entries
    if (this.state.entries.length > MAX_ENTRIES) {
      this.state.entries = this.state.entries.slice(0, MAX_ENTRIES);
    }

    // Update ranks
    this.state.entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    // Update statistics
    this.updatePlayerStats(gameStats, score);
    this.updateSessionStats(score, gameStats.powerUpsCollected.total);

    // Update achievement stats from current achievement system
    this.state.playerStats.achievementStats = {
      ...achievementProgress,
      categoriesCompleted: 0 // Will be updated by achievement system integration
    };

    this.saveState();
    return entry;
  }

  public getLeaderboard(
    sortBy: LeaderboardSortOption = 'score',
    filterBy: LeaderboardFilterOption = 'all'
  ): LeaderboardEntry[] {
    let entries = [...this.state.entries];

    // Apply filters
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;

    switch (filterBy) {
      case 'recent':
        entries = entries.slice(0, 5);
        break;
      case 'today':
        entries = entries.filter(entry => now - entry.timestamp < oneDay);
        break;
      case 'thisWeek':
        entries = entries.filter(entry => now - entry.timestamp < oneWeek);
        break;
      case 'personal':
        // This would need player identification in a real app
        // For now, show recent entries
        entries = entries.slice(0, 3);
        break;
    }

    // Apply sorting
    switch (sortBy) {
      case 'score':
        entries.sort((a, b) => b.score - a.score);
        break;
      case 'date':
        entries.sort((a, b) => b.timestamp - a.timestamp);
        break;
      case 'playTime':
        entries.sort((a, b) => b.gameStats.playTime - a.gameStats.playTime);
        break;
      case 'powerUps':
        entries.sort((a, b) => b.gameStats.powerUpsCollected.total - a.gameStats.powerUpsCollected.total);
        break;
      case 'achievements':
        entries.sort((a, b) => b.achievementProgress.totalPoints - a.achievementProgress.totalPoints);
        break;
    }

    return entries;
  }

  public getPlayerStats(): PlayerStatistics {
    return { ...this.state.playerStats };
  }

  public getSessionStats(): SessionStatistics {
    return { ...this.state.sessionStats };
  }

  public getScoreAnalysis(score: number): {
    rank: number;
    percentile: number;
    betterThan: number;
    isPersonalBest: boolean;
    improvement: number;
  } {
    const rank = this.calculateRank(score);
    const totalEntries = this.state.entries.length;
    const percentile = totalEntries > 0 ? ((totalEntries - rank + 1) / totalEntries) * 100 : 100;
    const betterThan = totalEntries - rank;
    const isPersonalBest = score > this.state.playerStats.highScore;
    const improvement = score - this.state.playerStats.averageScore;

    return {
      rank,
      percentile: Math.round(percentile),
      betterThan,
      isPersonalBest,
      improvement: Math.round(improvement)
    };
  }

  public exportScore(entryId: string): ScoreExport | null {
    const entry = this.state.entries.find(e => e.id === entryId);
    if (!entry) return null;

    // Get achievements for this score (would integrate with achievement system)
    const achievements: string[] = []; // TODO: Get from achievement system

    return {
      playerName: entry.playerName,
      score: entry.score,
      rank: entry.rank,
      gameDate: new Date(entry.timestamp).toISOString(),
      gameStats: entry.gameStats,
      achievements,
      gameVersion: GAME_VERSION,
      exportTimestamp: Date.now()
    };
  }

  public clearData(): void {
    this.state = {
      entries: [],
      playerStats: this.getDefaultPlayerStats(),
      sessionStats: this.getDefaultSessionStats(),
      lastUpdated: Date.now()
    };
    this.saveState();
  }

  public getState(): LeaderboardState {
    return { ...this.state };
  }
} 