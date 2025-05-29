import { 
  GameMode, 
  GameModeSession, 
  GameModeStats, 
  GameModeObjective,
  GAME_MODES,
  DEFAULT_MODE 
} from '../types/gameModes';

export class GameModeSystem {
  private sessions: GameModeSession[] = [];
  private stats: Map<string, GameModeStats> = new Map();
  private currentSession: GameModeSession | null = null;
  private sessionStartTime: number = 0;
  
  constructor() {
    this.loadData();
    this.initializeStats();
  }

  // Data persistence
  private loadData(): void {
    try {
      const sessionsData = localStorage.getItem('flappy_game_mode_sessions');
      if (sessionsData) {
        this.sessions = JSON.parse(sessionsData).map((session: any) => ({
          ...session,
          startTime: new Date(session.startTime),
          endTime: session.endTime ? new Date(session.endTime) : undefined
        }));
      }

      const statsData = localStorage.getItem('flappy_game_mode_stats');
      if (statsData) {
        const parsedStats = JSON.parse(statsData);
        Object.entries(parsedStats).forEach(([modeId, stats]: [string, any]) => {
          this.stats.set(modeId, {
            ...stats,
            firstPlayDate: new Date(stats.firstPlayDate),
            lastPlayDate: new Date(stats.lastPlayDate)
          });
        });
      }
    } catch (error) {
      console.warn('Failed to load game mode data:', error);
    }
  }

  private saveData(): void {
    try {
      localStorage.setItem('flappy_game_mode_sessions', JSON.stringify(this.sessions));
      
      const statsObject: Record<string, GameModeStats> = {};
      this.stats.forEach((stats, modeId) => {
        statsObject[modeId] = stats;
      });
      localStorage.setItem('flappy_game_mode_stats', JSON.stringify(statsObject));
    } catch (error) {
      console.warn('Failed to save game mode data:', error);
    }
  }

  private initializeStats(): void {
    GAME_MODES.forEach(mode => {
      if (!this.stats.has(mode.id)) {
        this.stats.set(mode.id, {
          modeId: mode.id,
          totalPlays: 0,
          totalScore: 0,
          bestScore: 0,
          averageScore: 0,
          completionRate: 0,
          objectivesCompleted: 0,
          totalObjectives: mode.objectives?.length || 0,
          firstPlayDate: new Date(),
          lastPlayDate: new Date()
        });
      }
    });
  }

  // Game mode access and validation
  getAvailableModes(): GameMode[] {
    return GAME_MODES.filter(mode => this.isModeUnlocked(mode));
  }

  getMode(modeId: string): GameMode | undefined {
    return GAME_MODES.find(mode => mode.id === modeId);
  }

  isModeUnlocked(mode: GameMode): boolean {
    if (!mode.unlockRequirement) return true;

    const { type, value } = mode.unlockRequirement;
    
    switch (type) {
      case 'score':
        return this.getHighestScore() >= value;
      case 'achievement':
        // Would integrate with achievement system
        return this.getUnlockedAchievementsCount() >= value;
      case 'games_played':
        return this.getTotalGamesPlayed() >= value;
      default:
        return true;
    }
  }

  // Session management
  startSession(modeId: string): GameModeSession | null {
    const mode = this.getMode(modeId);
    if (!mode || !this.isModeUnlocked(mode)) {
      return null;
    }

    this.currentSession = {
      modeId,
      startTime: new Date(),
      score: 0,
      objectives: mode.objectives ? mode.objectives.map(obj => ({ ...obj, current: 0, completed: false })) : [],
      statistics: {
        timeElapsed: 0,
        pipesCleared: 0,
        powerUpsCollected: 0,
        perfectPipes: 0,
        nearMisses: 0,
        respawnsUsed: 0
      },
      completed: false,
      personalBest: false
    };

    this.sessionStartTime = Date.now();
    return this.currentSession;
  }

  updateSession(updates: Partial<GameModeSession['statistics']> & { score?: number }): void {
    if (!this.currentSession) return;

    // Update statistics
    if (updates.score !== undefined) {
      this.currentSession.score = updates.score;
    }
    
    Object.assign(this.currentSession.statistics, updates);
    this.currentSession.statistics.timeElapsed = Date.now() - this.sessionStartTime;

    // Update objectives based on current statistics
    this.updateObjectives();
  }

  private updateObjectives(): void {
    if (!this.currentSession?.objectives) return;

    const { statistics, score } = this.currentSession;

    this.currentSession.objectives.forEach(objective => {
      if (objective.completed) return;

      switch (objective.type) {
        case 'score':
          objective.current = score;
          break;
        case 'survival':
          objective.current = Math.floor(statistics.timeElapsed / 1000);
          break;
        case 'collection':
          objective.current = statistics.powerUpsCollected;
          break;
        case 'precision':
          objective.current = statistics.perfectPipes;
          break;
        case 'speed':
          if (score >= objective.target) {
            objective.current = objective.target;
          }
          break;
      }

      if (objective.current >= objective.target && !objective.completed) {
        objective.completed = true;
        this.onObjectiveCompleted(objective);
      }
    });
  }

  private onObjectiveCompleted(objective: GameModeObjective): void {
    console.log(`Objective completed: ${objective.description}`);
    
    // Handle rewards
    if (objective.reward) {
      switch (objective.reward.type) {
        case 'points':
          if (this.currentSession) {
            this.currentSession.score += objective.reward.value as number;
          }
          break;
        case 'achievement':
          // Would trigger achievement unlock
          console.log(`Achievement unlocked: ${objective.reward.value}`);
          break;
        case 'unlock':
          console.log(`Unlocked: ${objective.reward.value}`);
          break;
      }
    }
  }

  endSession(finalScore: number): GameModeSession | null {
    if (!this.currentSession) return null;

    this.currentSession.endTime = new Date();
    this.currentSession.score = finalScore;
    this.currentSession.statistics.timeElapsed = Date.now() - this.sessionStartTime;
    
    // Check if all objectives are completed
    this.currentSession.completed = this.currentSession.objectives.every(obj => obj.completed);
    
    // Check if this is a personal best
    const stats = this.stats.get(this.currentSession.modeId);
    if (stats) {
      this.currentSession.personalBest = finalScore > stats.bestScore;
    }

    // Update stats
    this.updateStats(this.currentSession);
    
    // Save session
    this.sessions.push({ ...this.currentSession });
    this.saveData();

    const completedSession = this.currentSession;
    this.currentSession = null;
    
    return completedSession;
  }

  private updateStats(session: GameModeSession): void {
    const stats = this.stats.get(session.modeId);
    if (!stats) return;

    stats.totalPlays++;
    stats.totalScore += session.score;
    stats.lastPlayDate = session.endTime || new Date();
    
    if (session.score > stats.bestScore) {
      stats.bestScore = session.score;
    }

    stats.averageScore = stats.totalScore / stats.totalPlays;
    
    const completedSessions = this.sessions.filter(s => s.modeId === session.modeId && s.completed);
    stats.completionRate = completedSessions.length / stats.totalPlays;
    
    const totalObjectivesCompleted = this.sessions
      .filter(s => s.modeId === session.modeId)
      .reduce((total, s) => total + s.objectives.filter(obj => obj.completed).length, 0);
    stats.objectivesCompleted = totalObjectivesCompleted;

    this.stats.set(session.modeId, stats);
  }

  // Statistics and data access
  getCurrentSession(): GameModeSession | null {
    return this.currentSession;
  }

  getStats(modeId: string): GameModeStats | undefined {
    return this.stats.get(modeId);
  }

  getAllStats(): Map<string, GameModeStats> {
    return new Map(this.stats);
  }

  getSessionHistory(modeId?: string): GameModeSession[] {
    if (modeId) {
      return this.sessions.filter(session => session.modeId === modeId);
    }
    return [...this.sessions];
  }

  getHighestScore(): number {
    return Math.max(0, ...this.sessions.map(session => session.score));
  }

  getTotalGamesPlayed(): number {
    return this.sessions.length;
  }

  private getUnlockedAchievementsCount(): number {
    // This would integrate with the achievement system
    // For now, return a mock value based on total games played
    return Math.floor(this.getTotalGamesPlayed() / 5);
  }

  // Game mode application helpers
  applyModeModifiers(mode: GameMode, baseValues: any): any {
    const modifiers = mode.modifiers;
    const modified = { ...baseValues };

    // Apply multipliers
    if (modifiers.gravity) modified.gravity *= modifiers.gravity;
    if (modifiers.flapStrength) modified.flapStrength *= modifiers.flapStrength;
    if (modifiers.gameSpeed) modified.gameSpeed *= modifiers.gameSpeed;
    if (modifiers.pipeSpacing) modified.pipeSpacing *= modifiers.pipeSpacing;
    if (modifiers.pipeGapSize) modified.pipeGapSize *= modifiers.pipeGapSize;
    if (modifiers.pipeSpeed) modified.pipeSpeed *= modifiers.pipeSpeed;
    if (modifiers.powerUpSpawnRate) modified.powerUpSpawnRate *= modifiers.powerUpSpawnRate;
    if (modifiers.powerUpDuration) modified.powerUpDuration *= modifiers.powerUpDuration;
    if (modifiers.scoreMultiplier) modified.scoreMultiplier = modifiers.scoreMultiplier;

    // Apply absolute values
    if (modifiers.timeLimit) modified.timeLimit = modifiers.timeLimit;
    if (modifiers.respawnCount) modified.respawnCount = modifiers.respawnCount;
    if (modifiers.invulnerabilityFrames) modified.invulnerabilityFrames = modifiers.invulnerabilityFrames;
    if (modifiers.nightMode !== undefined) modified.nightMode = modifiers.nightMode;
    if (modifiers.particleMultiplier) modified.particleMultiplier *= modifiers.particleMultiplier;

    return modified;
  }

  shouldSpawnPowerUp(modeId: string, powerUpType: string): boolean {
    const mode = this.getMode(modeId);
    if (!mode) return true;

    // Check if power-up is disabled in this mode
    if (mode.modifiers.disabledPowerUps?.includes(powerUpType)) {
      return false;
    }

    return true;
  }

  calculateBonusPoints(modeId: string, condition: string): number {
    const mode = this.getMode(modeId);
    if (!mode?.modifiers.bonusPoints) return 0;

    const bonus = mode.modifiers.bonusPoints.find(b => b.condition === condition);
    return bonus ? bonus.points : 0;
  }

  // Export functionality
  exportModeData(): any {
    return {
      sessions: this.sessions,
      stats: Object.fromEntries(this.stats),
      exportDate: new Date(),
      version: '1.0'
    };
  }

  // Utility functions
  getModeProgress(modeId: string): {
    completionPercentage: number;
    objectivesCompleted: number;
    totalObjectives: number;
    bestScore: number;
    totalPlays: number;
  } {
    const stats = this.getStats(modeId);
    const mode = this.getMode(modeId);
    
    if (!stats || !mode) {
      return {
        completionPercentage: 0,
        objectivesCompleted: 0,
        totalObjectives: 0,
        bestScore: 0,
        totalPlays: 0
      };
    }

    return {
      completionPercentage: stats.totalObjectives > 0 ? (stats.objectivesCompleted / stats.totalObjectives) * 100 : 0,
      objectivesCompleted: stats.objectivesCompleted,
      totalObjectives: stats.totalObjectives,
      bestScore: stats.bestScore,
      totalPlays: stats.totalPlays
    };
  }
} 