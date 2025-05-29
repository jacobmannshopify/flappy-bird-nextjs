import { 
  ShareableScore, 
  ShareOptions, 
  ShareTemplate, 
  MilestoneShare, 
  CompetitiveChallenge,
  SocialStats,
  LeaderboardComparison,
  SocialPlatform 
} from '../types/social';
import { LeaderboardEntry } from '../types/leaderboard';
import { Achievement } from '../types/achievements';

export class SocialSharingSystem {
  private socialStats: SocialStats;
  private shareTemplates: ShareTemplate[];
  private milestones: MilestoneShare[];
  private challenges: CompetitiveChallenge[];

  constructor() {
    this.socialStats = this.loadSocialStats();
    this.shareTemplates = this.initializeShareTemplates();
    this.milestones = this.loadMilestones();
    this.challenges = this.initializeChallenges();
  }

  // Share Templates
  private initializeShareTemplates(): ShareTemplate[] {
    return [
      {
        id: 'high_score',
        type: 'score',
        title: '🏆 New High Score!',
        description: 'Just achieved my personal best in Flappy Bird!',
        hashtags: ['#FlappyBird', '#HighScore', '#Gaming'],
        icon: '🏆',
        bgColor: '#FFD700',
        textColor: '#1a1a1a'
      },
      {
        id: 'milestone_score',
        type: 'milestone',
        title: '🎯 Milestone Reached!',
        description: 'Hit a major scoring milestone!',
        hashtags: ['#FlappyBird', '#Milestone', '#Achievement'],
        icon: '🎯',
        bgColor: '#4ECDC4',
        textColor: '#ffffff'
      },
      {
        id: 'achievement_unlock',
        type: 'achievement',
        title: '🏅 Achievement Unlocked!',
        description: 'Unlocked a new achievement!',
        hashtags: ['#FlappyBird', '#Achievement', '#Progress'],
        icon: '🏅',
        bgColor: '#9966CC',
        textColor: '#ffffff'
      },
      {
        id: 'epic_streak',
        type: 'streak',
        title: '🔥 Epic Streak!',
        description: 'On fire with consecutive high scores!',
        hashtags: ['#FlappyBird', '#Streak', '#OnFire'],
        icon: '🔥',
        bgColor: '#FF6B6B',
        textColor: '#ffffff'
      },
      {
        id: 'power_up_master',
        type: 'milestone',
        title: '⚡ Power-up Master!',
        description: 'Mastered the art of power-up collection!',
        hashtags: ['#FlappyBird', '#PowerUps', '#Mastery'],
        icon: '⚡',
        bgColor: '#FFA07A',
        textColor: '#1a1a1a'
      }
    ];
  }

  // Challenge System
  private initializeChallenges(): CompetitiveChallenge[] {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const weekMs = 7 * dayMs;

    return [
      {
        id: 'daily_fifty',
        title: 'Daily Fifty',
        description: 'Score 50+ points in a single game today',
        type: 'score_challenge',
        requirements: { target: 50 },
        rewards: { points: 100, badge: '🎯' },
        difficulty: 'easy',
        startDate: now,
        endDate: now + dayMs,
        status: 'active'
      },
      {
        id: 'power_collector',
        title: 'Power Collector',
        description: 'Collect 10 power-ups in one session',
        type: 'power_up_challenge',
        requirements: { target: 10 },
        rewards: { points: 200, badge: '⚡' },
        difficulty: 'medium',
        startDate: now,
        endDate: now + weekMs,
        status: 'active'
      },
      {
        id: 'marathon_session',
        title: 'Marathon Session',
        description: 'Play for 30 minutes straight',
        type: 'time_challenge',
        requirements: { target: 30 * 60 * 1000 },
        rewards: { points: 300, badge: '⏰', title: 'Marathon Runner' },
        difficulty: 'hard',
        startDate: now,
        endDate: now + weekMs,
        status: 'active'
      },
      {
        id: 'century_club',
        title: 'Century Club',
        description: 'Score 100+ points in a single game',
        type: 'score_challenge',
        requirements: { target: 100 },
        rewards: { points: 500, badge: '💯', title: 'Century Master' },
        difficulty: 'extreme',
        startDate: now,
        endDate: now + weekMs,
        status: 'active'
      }
    ];
  }

  // Score Sharing
  generateShareableScore(entry: LeaderboardEntry, gameMode?: string): ShareableScore {
    return {
      id: entry.id,
      playerName: entry.playerName,
      score: entry.score,
      rank: entry.rank,
      timestamp: entry.timestamp,
      gameStats: {
        playTime: entry.gameStats.playTime,
        pipesCleared: entry.gameStats.pipesCleared,
        powerUpsCollected: entry.gameStats.powerUpsCollected.total,
        averageScore: entry.gameStats.averageScore
      },
      achievements: {
        unlockedInGame: [], // Could track achievements unlocked during this game
        totalUnlocked: entry.achievementProgress.totalUnlocked,
        totalPoints: entry.achievementProgress.totalPoints
      },
      gameContext: {
        gameMode: gameMode || 'Classic',
        difficulty: this.getDifficultyLabel(entry.score),
        specialConditions: this.getSpecialConditions(entry)
      }
    };
  }

  private getDifficultyLabel(score: number): string {
    if (score >= 100) return 'Master';
    if (score >= 50) return 'Expert';
    if (score >= 25) return 'Advanced';
    if (score >= 10) return 'Intermediate';
    return 'Beginner';
  }

  private getSpecialConditions(entry: LeaderboardEntry): string[] {
    const conditions: string[] = [];
    if (entry.gameStats.powerUpsCollected.total >= 5) conditions.push('Power-up Expert');
    if (entry.gameStats.playTime < 60000 && entry.score >= 20) conditions.push('Speed Runner');
    if (entry.gameStats.powerUpsCollected.total === 0 && entry.score >= 15) conditions.push('Purist');
    return conditions;
  }

  // Text Generation
  generateShareText(score: ShareableScore, options: ShareOptions): string {
    const template = this.shareTemplates.find(t => t.id === options.template) || this.shareTemplates[0];
    let text = `${template.title}\n\n`;

    if (options.customMessage) {
      text += `${options.customMessage}\n\n`;
    }

    if (options.includeScore) {
      text += `🏆 Score: ${score.score} points (#${score.rank})\n`;
    }

    if (options.includeStats) {
      text += `📊 Stats:\n`;
      text += `  • ⏱️ Play time: ${this.formatDuration(score.gameStats.playTime)}\n`;
      text += `  • 🚪 Pipes cleared: ${score.gameStats.pipesCleared}\n`;
      text += `  • ⚡ Power-ups: ${score.gameStats.powerUpsCollected}\n`;
    }

    if (options.includeAchievements && score.achievements.totalUnlocked > 0) {
      text += `🏅 ${score.achievements.totalUnlocked} achievements (${score.achievements.totalPoints} pts)\n`;
    }

    if (options.includeGameMode) {
      text += `🎮 Mode: ${score.gameContext.gameMode} (${score.gameContext.difficulty})\n`;
      if (score.gameContext.specialConditions && score.gameContext.specialConditions.length > 0) {
        text += `✨ ${score.gameContext.specialConditions.join(', ')}\n`;
      }
    }

    if (options.includeTimestamp) {
      text += `📅 ${new Date(score.timestamp).toLocaleDateString()}\n`;
    }

    text += `\n${template.hashtags.join(' ')}`;
    
    return text;
  }

  // Platform-specific sharing
  async shareToplatform(score: ShareableScore, options: ShareOptions): Promise<boolean> {
    const text = this.generateShareText(score, options);

    try {
      switch (options.platform) {
        case 'twitter':
          return this.shareToTwitter(text);
        case 'facebook':
          return this.shareToFacebook(text);
        case 'clipboard':
          return this.copyToClipboard(text);
        case 'file':
          return this.downloadAsFile(score, text);
        default:
          return this.copyToClipboard(text);
      }
    } catch (error) {
      console.error('Sharing failed:', error);
      return false;
    }
  }

  private shareToTwitter(text: string): Promise<boolean> {
    const encodedText = encodeURIComponent(text);
    const url = `https://twitter.com/intent/tweet?text=${encodedText}`;
    window.open(url, '_blank', 'width=550,height=420');
    this.trackShare('twitter');
    return Promise.resolve(true);
  }

  private shareToFacebook(text: string): Promise<boolean> {
    const encodedText = encodeURIComponent(text);
    const url = `https://www.facebook.com/sharer/sharer.php?quote=${encodedText}`;
    window.open(url, '_blank', 'width=550,height=420');
    this.trackShare('facebook');
    return Promise.resolve(true);
  }

  private async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      this.trackShare('clipboard');
      return true;
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (success) this.trackShare('clipboard');
      return success;
    }
  }

  private downloadAsFile(score: ShareableScore, text: string): Promise<boolean> {
    try {
      const data = {
        shareText: text,
        scoreData: score,
        exportTimestamp: Date.now(),
        gameVersion: '1.0.0'
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `flappy-bird-score-${score.score}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      this.trackShare('file');
      return Promise.resolve(true);
    } catch (error) {
      return Promise.resolve(false);
    }
  }

  private generateShareableURL(score: ShareableScore): Promise<boolean> {
    try {
      const params = new URLSearchParams({
        score: score.score.toString(),
        rank: score.rank.toString(),
        playTime: score.gameStats.playTime.toString(),
        powerUps: score.gameStats.powerUpsCollected.toString(),
        mode: score.gameContext.gameMode || 'Classic'
      });
      
      const shareURL = `${window.location.origin}?share=true&${params.toString()}`;
      this.copyToClipboard(shareURL);
      this.trackShare('url');
      return Promise.resolve(true);
    } catch (error) {
      return Promise.resolve(false);
    }
  }

  // Achievement Sharing
  generateAchievementShare(achievement: Achievement): string {
    const template = this.shareTemplates.find(t => t.type === 'achievement')!;
    let text = `${template.title}\n\n`;
    text += `${achievement.icon} ${achievement.name}\n`;
    text += `${achievement.description}\n\n`;
    text += `💎 +${achievement.rewards.points} points\n`;
    text += `🏅 ${achievement.difficulty.toUpperCase()} tier\n\n`;
    text += `${template.hashtags.join(' ')}`;
    return text;
  }

  // Milestone Detection and Sharing
  checkMilestones(score: number, stats: any): MilestoneShare[] {
    const milestones: MilestoneShare[] = [];
    
    // Score milestones
    const scoreMilestones = [10, 25, 50, 100, 200, 500];
    for (const milestone of scoreMilestones) {
      if (score >= milestone && !this.hasMilestone(`score_${milestone}`)) {
        milestones.push({
          id: `score_${milestone}`,
          type: 'score_milestone',
          title: `${milestone} Point Club`,
          description: `Reached ${milestone} points in a single game!`,
          value: score,
          threshold: milestone,
          icon: milestone >= 100 ? '💯' : milestone >= 50 ? '🎯' : '🏆',
          rarity: milestone >= 200 ? 'legendary' : milestone >= 100 ? 'epic' : milestone >= 50 ? 'rare' : 'common',
          timestamp: Date.now()
        });
        this.saveMilestone(`score_${milestone}`);
      }
    }
    
    return milestones;
  }

  // Leaderboard Comparison
  generateLeaderboardComparison(entries: LeaderboardEntry[], playerScore: number): LeaderboardComparison {
    const sortedEntries = entries.sort((a, b) => b.score - a.score);
    const yourRank = sortedEntries.findIndex(e => e.score === playerScore) + 1;
    
    // Get nearby players (2 above, 2 below)
    const nearbyPlayers = [];
    const startIndex = Math.max(0, yourRank - 3);
    const endIndex = Math.min(sortedEntries.length, yourRank + 2);
    
    for (let i = startIndex; i < endIndex; i++) {
      const entry = sortedEntries[i];
      nearbyPlayers.push({
        rank: i + 1,
        name: entry.playerName,
        score: entry.score,
        isYou: entry.score === playerScore
      });
    }

    const percentile = Math.round((1 - (yourRank - 1) / sortedEntries.length) * 100);
    
    let nextRank = yourRank - 1;
    let pointsNeeded = 0;
    if (nextRank > 0) {
      pointsNeeded = sortedEntries[nextRank - 1].score - playerScore + 1;
    }

    return {
      yourRank,
      yourScore: playerScore,
      nearbyPlayers,
      percentile,
      improvementNeeded: {
        nextRank,
        pointsNeeded
      }
    };
  }

  // Social Stats Tracking
  private trackShare(platform: string): void {
    this.socialStats.totalShares++;
    // Update popular share type logic here
    this.saveSocialStats();
  }

  getSocialStats(): SocialStats {
    return { ...this.socialStats };
  }

  // Challenge Management
  getChallenges(): CompetitiveChallenge[] {
    return this.challenges.filter(c => c.status === 'active');
  }

  checkChallengeProgress(challenge: CompetitiveChallenge, currentValue: number): boolean {
    return currentValue >= challenge.requirements.target;
  }

  completeChallenge(challengeId: string): CompetitiveChallenge | null {
    const challenge = this.challenges.find(c => c.id === challengeId);
    if (challenge && challenge.status === 'active') {
      challenge.status = 'completed';
      this.saveChallenges();
      return challenge;
    }
    return null;
  }

  // Utility Functions
  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  // Local Storage Management
  private loadSocialStats(): SocialStats {
    try {
      const saved = localStorage.getItem('flappy-bird-social-stats');
      return saved ? JSON.parse(saved) : {
        totalShares: 0,
        popularShareType: 'score',
        shareStreaks: { current: 0, best: 0 },
        communityRank: 0,
        engagementScore: 0
      };
    } catch {
      return {
        totalShares: 0,
        popularShareType: 'score',
        shareStreaks: { current: 0, best: 0 },
        communityRank: 0,
        engagementScore: 0
      };
    }
  }

  private saveSocialStats(): void {
    try {
      localStorage.setItem('flappy-bird-social-stats', JSON.stringify(this.socialStats));
    } catch (error) {
      console.warn('Failed to save social stats:', error);
    }
  }

  private loadMilestones(): MilestoneShare[] {
    try {
      const saved = localStorage.getItem('flappy-bird-milestones');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  private saveMilestone(milestoneId: string): void {
    try {
      const milestones = this.loadMilestones();
      if (!milestones.find(m => m.id === milestoneId)) {
        const milestone = this.milestones.find(m => m.id === milestoneId);
        if (milestone) {
          milestones.push(milestone);
          localStorage.setItem('flappy-bird-milestones', JSON.stringify(milestones));
        }
      }
    } catch (error) {
      console.warn('Failed to save milestone:', error);
    }
  }

  private hasMilestone(milestoneId: string): boolean {
    const milestones = this.loadMilestones();
    return milestones.some(m => m.id === milestoneId);
  }

  private saveChallenges(): void {
    try {
      localStorage.setItem('flappy-bird-challenges', JSON.stringify(this.challenges));
    } catch (error) {
      console.warn('Failed to save challenges:', error);
    }
  }
} 