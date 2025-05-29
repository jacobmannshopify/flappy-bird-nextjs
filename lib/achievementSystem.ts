import { 
  Achievement, 
  AchievementProgress, 
  AchievementSystemState, 
  AchievementNotification
} from '../types/achievements';
import { PowerUpType } from '../types/powerUps';
import { ACHIEVEMENTS_CONFIG, DEFAULT_ACHIEVEMENT_PROGRESS } from '../constants/achievements';

const STORAGE_KEY = 'flappy-bird-achievements';

export class AchievementSystem {
  private state: AchievementSystemState;
  private onAchievementUnlocked?: (achievement: Achievement) => void;

  constructor(onAchievementUnlocked?: (achievement: Achievement) => void) {
    this.onAchievementUnlocked = onAchievementUnlocked;
    this.state = this.loadState();
  }

  private loadState(): AchievementSystemState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        
        // Merge with new achievements in case we've added new ones
        const achievements: Record<string, Achievement> = {};
        
        // Initialize all achievements from config
        Object.entries(ACHIEVEMENTS_CONFIG).forEach(([id, config]) => {
          achievements[id] = {
            ...config,
            unlocked: parsed.achievements?.[id]?.unlocked || false,
            progress: parsed.achievements?.[id]?.progress || 0,
            unlockedAt: parsed.achievements?.[id]?.unlockedAt
          };
        });

        return {
          achievements,
          progress: { ...DEFAULT_ACHIEVEMENT_PROGRESS, ...parsed.progress },
          notifications: parsed.notifications || [],
          totalAchievementPoints: parsed.totalAchievementPoints || 0,
          unlockedCount: parsed.unlockedCount || 0,
          lastUpdated: parsed.lastUpdated || Date.now()
        };
      }
    } catch (error) {
      console.warn('Failed to load achievement data:', error);
    }

    // Initialize fresh state
    const achievements: Record<string, Achievement> = {};
    Object.entries(ACHIEVEMENTS_CONFIG).forEach(([id, config]) => {
      achievements[id] = {
        ...config,
        unlocked: false,
        progress: 0
      };
    });

    return {
      achievements,
      progress: { ...DEFAULT_ACHIEVEMENT_PROGRESS },
      notifications: [],
      totalAchievementPoints: 0,
      unlockedCount: 0,
      lastUpdated: Date.now()
    };
  }

  private saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      this.state.lastUpdated = Date.now();
    } catch (error) {
      console.warn('Failed to save achievement data:', error);
    }
  }

  private checkAchievement(achievementId: string): boolean {
    const achievement = this.state.achievements[achievementId];
    if (!achievement || achievement.unlocked) return false;

    const { requirement } = achievement;
    const progress = this.state.progress;
    let unlocked = false;

    switch (requirement.type) {
      case 'single_score':
        unlocked = progress.sessionStats.currentScore >= requirement.value;
        achievement.progress = Math.min(progress.sessionStats.currentScore / requirement.value, 1);
        break;
      
      case 'total_score':
        unlocked = progress.totalScore >= requirement.value;
        achievement.progress = Math.min(progress.totalScore / requirement.value, 1);
        break;
      
      case 'powerup_collected':
        unlocked = progress.powerUpsCollected.total >= requirement.value;
        achievement.progress = Math.min(progress.powerUpsCollected.total / requirement.value, 1);
        break;
      
      case 'powerup_type_collected':
        const powerUpKey = requirement.condition as PowerUpType;
        const typeCount = progress.powerUpsCollected[powerUpKey] || 0;
        unlocked = typeCount >= requirement.value;
        achievement.progress = Math.min(typeCount / requirement.value, 1);
        break;
      
      case 'total_powerups':
        unlocked = progress.powerUpsCollected.total >= requirement.value;
        achievement.progress = Math.min(progress.powerUpsCollected.total / requirement.value, 1);
        break;
      
      case 'games_played':
        unlocked = progress.gamesPlayed >= requirement.value;
        achievement.progress = Math.min(progress.gamesPlayed / requirement.value, 1);
        break;
      
      case 'win_streak':
        unlocked = progress.streaks.currentWinStreak >= requirement.value;
        achievement.progress = Math.min(progress.streaks.currentWinStreak / requirement.value, 1);
        break;
      
      case 'session_time':
        const sessionTime = Date.now() - progress.sessionStats.startTime;
        unlocked = sessionTime >= requirement.value;
        achievement.progress = Math.min(sessionTime / requirement.value, 1);
        break;
      
      case 'score_no_powerups':
        unlocked = progress.sessionStats.currentScore >= requirement.value && 
                  progress.sessionStats.powerUpsThisSession === 0;
        achievement.progress = progress.sessionStats.powerUpsThisSession === 0 ? 
          Math.min(progress.sessionStats.currentScore / requirement.value, 1) : 0;
        break;
      
      case 'rapid_flaps':
        unlocked = progress.skillStats.rapidFlaps >= requirement.value;
        achievement.progress = Math.min(progress.skillStats.rapidFlaps / requirement.value, 1);
        break;
      
      case 'close_calls':
        unlocked = progress.skillStats.closeCallsAvoided >= requirement.value;
        achievement.progress = Math.min(progress.skillStats.closeCallsAvoided / requirement.value, 1);
        break;
      
      // Special combo achievements would be checked in real-time during gameplay
      case 'combo_slowmo_shield':
      case 'combo_tiny_shield':
      case 'all_powerups_active':
        // These are handled by specific tracking methods
        break;
    }

    if (unlocked && !achievement.unlocked) {
      achievement.unlocked = true;
      achievement.progress = 1;
      achievement.unlockedAt = Date.now();
      
      this.state.totalAchievementPoints += achievement.rewards.points;
      this.state.unlockedCount++;
      
      const notification: AchievementNotification = {
        id: `notif-${achievement.id}-${Date.now()}`,
        achievement,
        timestamp: Date.now(),
        seen: false
      };
      
      this.state.notifications.push(notification);
      
      if (this.onAchievementUnlocked) {
        this.onAchievementUnlocked(achievement);
      }
      
      this.saveState();
      return true;
    }

    return false;
  }

  private checkAllAchievements(): Achievement[] {
    const newlyUnlocked: Achievement[] = [];
    
    Object.keys(this.state.achievements).forEach(id => {
      if (this.checkAchievement(id)) {
        newlyUnlocked.push(this.state.achievements[id]);
      }
    });

    if (newlyUnlocked.length > 0) {
      this.saveState();
    }

    return newlyUnlocked;
  }

  // Public methods for tracking game events
  public startSession(): void {
    this.state.progress.sessionStats.startTime = Date.now();
    this.state.progress.sessionStats.currentScore = 0;
    this.state.progress.sessionStats.currentDistance = 0;
    this.state.progress.sessionStats.powerUpsThisSession = 0;
    this.state.progress.sessionStats.collisionsThisSession = 0;
    this.state.progress.gamesPlayed++;
    this.state.progress.streaks.currentPlayStreak++;
    this.checkAllAchievements();
  }

  public updateScore(newScore: number): Achievement[] {
    const oldScore = this.state.progress.sessionStats.currentScore;
    this.state.progress.sessionStats.currentScore = newScore;
    this.state.progress.totalScore += (newScore - oldScore);
    
    if (newScore > this.state.progress.maxScore) {
      this.state.progress.maxScore = newScore;
    }

    return this.checkAllAchievements();
  }

  public collectPowerUp(type: PowerUpType): Achievement[] {
    this.state.progress.powerUpsCollected[type]++;
    this.state.progress.powerUpsCollected.total++;
    this.state.progress.sessionStats.powerUpsThisSession++;

    return this.checkAllAchievements();
  }

  public trackFlap(): void {
    // Could be used for rapid flapping achievement
    // Implementation would need flap timing tracking
  }

  public trackCloseCall(): Achievement[] {
    this.state.progress.skillStats.closeCallsAvoided++;
    return this.checkAllAchievements();
  }

  public trackPowerUpCombo(activePowerUps: string[]): Achievement[] {
    // Check for special combo achievements
    const hasShield = activePowerUps.includes('shield');
    const hasSlowmo = activePowerUps.includes('slowmo');
    const hasTiny = activePowerUps.includes('tiny');
    const hasMagnet = activePowerUps.includes('magnet');

    if (hasShield && hasSlowmo) {
      this.state.achievements['time_traveler'].progress = 1;
      this.checkAchievement('time_traveler');
    }

    if (hasShield && hasTiny) {
      this.state.achievements['tiny_tank'].progress = 1;
      this.checkAchievement('tiny_tank');
    }

    if (hasShield && hasSlowmo && hasTiny && hasMagnet) {
      this.state.achievements['power_master'].progress = 1;
      this.checkAchievement('power_master');
    }

    return this.checkAllAchievements();
  }

  public endSession(finalScore: number): Achievement[] {
    // Update win streak
    if (finalScore >= 10) {
      this.state.progress.streaks.currentWinStreak++;
      if (this.state.progress.streaks.currentWinStreak > this.state.progress.streaks.bestWinStreak) {
        this.state.progress.streaks.bestWinStreak = this.state.progress.streaks.currentWinStreak;
      }
    } else {
      this.state.progress.streaks.currentWinStreak = 0;
    }

    const sessionTime = Date.now() - this.state.progress.sessionStats.startTime;
    this.state.progress.totalPlayTime += sessionTime;

    return this.checkAllAchievements();
  }

  // Getters for UI
  public getState(): AchievementSystemState {
    return this.state;
  }

  public getUnlockedAchievements(): Achievement[] {
    return Object.values(this.state.achievements).filter(a => a.unlocked);
  }

  public getVisibleAchievements(): Achievement[] {
    return Object.values(this.state.achievements).filter(a => !a.hidden || a.unlocked);
  }

  public getUnseenNotifications(): AchievementNotification[] {
    return this.state.notifications.filter(n => !n.seen);
  }

  public markNotificationSeen(notificationId: string): void {
    const notification = this.state.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.seen = true;
      this.saveState();
    }
  }

  public getProgressPercentage(): number {
    const total = Object.keys(this.state.achievements).length;
    return total > 0 ? (this.state.unlockedCount / total) * 100 : 0;
  }
} 