import React, { useState, useMemo, useEffect } from 'react';
import { SocialSharingSystem } from '../lib/socialSharing';
import { 
  ShareableScore, 
  ShareOptions, 
  CompetitiveChallenge, 
  MilestoneShare,
  SocialStats,
  ShareTemplate,
  SocialPlatform 
} from '../types/social';
import { LeaderboardEntry } from '../types/leaderboard';
import { Achievement } from '../types/achievements';

interface SocialMenuProps {
  isVisible: boolean;
  onClose: () => void;
  currentScore?: number;
  leaderboardEntries: LeaderboardEntry[];
  achievements: Record<string, Achievement>;
  gameMode?: string;
  onMilestoneNotification?: (milestone: MilestoneShare) => void;
}

export default function SocialMenu({
  isVisible,
  onClose,
  currentScore = 0,
  leaderboardEntries,
  achievements,
  gameMode = 'Classic',
  onMilestoneNotification
}: SocialMenuProps) {
  const [activeTab, setActiveTab] = useState<'share' | 'challenges' | 'compare' | 'milestones'>('share');
  const [socialSystem] = useState(() => new SocialSharingSystem());
  const [shareOptions, setShareOptions] = useState<ShareOptions>({
    includeScore: true,
    includeStats: true,
    includeAchievements: true,
    includeGameMode: true,
    includeTimestamp: true,
    platform: 'clipboard',
    template: 'high_score'
  });
  const [customMessage, setCustomMessage] = useState('');
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);
  const [socialStats, setSocialStats] = useState<SocialStats>(socialSystem.getSocialStats());
  const [challenges, setChallenges] = useState<CompetitiveChallenge[]>(socialSystem.getChallenges());

  // Get latest leaderboard entry for sharing
  const latestEntry = useMemo(() => {
    if (leaderboardEntries.length === 0) return null;
    return leaderboardEntries.sort((a, b) => b.timestamp - a.timestamp)[0];
  }, [leaderboardEntries]);

  // Share templates
  const shareTemplates: ShareTemplate[] = [
    {
      id: 'high_score',
      type: 'score',
      title: '🏆 New High Score!',
      description: 'Just achieved my personal best!',
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
    }
  ];

  // Platform options
  const platformOptions: { value: SocialPlatform; label: string; icon: string; color: string }[] = [
    { value: 'twitter', label: 'Twitter', icon: '🐦', color: '#1DA1F2' },
    { value: 'facebook', label: 'Facebook', icon: '📘', color: '#4267B2' },
    { value: 'clipboard', label: 'Copy Text', icon: '📋', color: '#6B7280' },
    { value: 'file', label: 'Download', icon: '💾', color: '#10B981' }
  ];

  // Handle sharing
  const handleShare = async () => {
    if (!latestEntry) {
      setShareSuccess('No score to share yet. Play a game first!');
      return;
    }

    const shareableScore = socialSystem.generateShareableScore(latestEntry, gameMode);
    const options = {
      ...shareOptions,
      customMessage: customMessage || undefined
    };

    try {
      const success = await socialSystem.shareToplatform(shareableScore, options);
      if (success) {
        setShareSuccess(`Successfully shared to ${shareOptions.platform}!`);
        setSocialStats(socialSystem.getSocialStats());
        
        // Check for milestones
        const milestones = socialSystem.checkMilestones(currentScore, socialStats);
        milestones.forEach(milestone => {
          if (onMilestoneNotification) {
            onMilestoneNotification(milestone);
          }
        });
      } else {
        setShareSuccess('Sharing failed. Please try again.');
      }
    } catch (error) {
      setShareSuccess('Sharing failed. Please try again.');
    }

    setTimeout(() => setShareSuccess(null), 3000);
  };

  // Handle achievement sharing
  const shareAchievement = async (achievement: Achievement) => {
    const text = socialSystem.generateAchievementShare(achievement);
    try {
      await navigator.clipboard.writeText(text);
      setShareSuccess('Achievement copied to clipboard!');
    } catch (error) {
      setShareSuccess('Failed to copy achievement.');
    }
    setTimeout(() => setShareSuccess(null), 3000);
  };

  // Leaderboard comparison
  const leaderboardComparison = useMemo(() => {
    if (currentScore > 0 && leaderboardEntries.length > 0) {
      return socialSystem.generateLeaderboardComparison(leaderboardEntries, currentScore);
    }
    return null;
  }, [currentScore, leaderboardEntries, socialSystem]);

  // Check challenge progress
  const checkChallengeProgress = (challenge: CompetitiveChallenge): number => {
    switch (challenge.type) {
      case 'score_challenge':
        return Math.min(100, (currentScore / challenge.requirements.target) * 100);
      case 'power_up_challenge':
        // Would need power-up stats from game
        return 0;
      case 'time_challenge':
        // Would need session time from game
        return 0;
      default:
        return 0;
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 max-w-4xl max-h-[90vh] w-full mx-4 overflow-hidden shadow-2xl border border-slate-600">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="text-3xl">🌟</div>
            <div>
              <h2 className="text-2xl font-bold text-white">Social & Sharing</h2>
              <p className="text-slate-300 text-sm">Share your achievements and compete with others</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-red-400 transition-colors text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Social Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-3 text-white">
            <div className="text-lg font-bold">{socialStats.totalShares}</div>
            <div className="text-xs opacity-90">Total Shares</div>
          </div>
          <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-3 text-white">
            <div className="text-lg font-bold">{socialStats.shareStreaks.current}</div>
            <div className="text-xs opacity-90">Share Streak</div>
          </div>
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-3 text-white">
            <div className="text-lg font-bold">{socialStats.engagementScore}</div>
            <div className="text-xs opacity-90">Engagement</div>
          </div>
          <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-lg p-3 text-white">
            <div className="text-lg font-bold">{challenges.length}</div>
            <div className="text-xs opacity-90">Active Challenges</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-slate-700 rounded-lg p-1">
          {[
            { id: 'share', label: '📤 Share', icon: '📤' },
            { id: 'challenges', label: '🏆 Challenges', icon: '🏆' },
            { id: 'compare', label: '📊 Compare', icon: '📊' },
            { id: 'milestones', label: '🎯 Milestones', icon: '🎯' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-slate-800 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Share Tab */}
        {activeTab === 'share' && (
          <div className="space-y-6">
            {/* Share Template Selection */}
            <div>
              <h3 className="text-lg font-bold text-white mb-3">🎨 Share Template</h3>
              <div className="grid grid-cols-2 gap-3">
                {shareTemplates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => setShareOptions(prev => ({ ...prev, template: template.id }))}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      shareOptions.template === template.id
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-slate-600 bg-slate-700 text-white hover:border-slate-500'
                    }`}
                    style={shareOptions.template === template.id ? 
                      { backgroundColor: template.bgColor + '20', borderColor: template.bgColor } : {}
                    }
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-lg">{template.icon}</span>
                      <span className="font-medium text-sm">{template.title}</span>
                    </div>
                    <p className="text-xs opacity-75">{template.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Platform Selection */}
            <div>
              <h3 className="text-lg font-bold text-white mb-3">🌐 Share Platform</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {platformOptions.map(platform => (
                  <button
                    key={platform.value}
                    onClick={() => setShareOptions(prev => ({ ...prev, platform: platform.value }))}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      shareOptions.platform === platform.value
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-slate-600 bg-slate-700 text-white hover:border-slate-500'
                    }`}
                  >
                    <div className="text-lg mb-1">{platform.icon}</div>
                    <div className="text-sm font-medium">{platform.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Share Options */}
            <div>
              <h3 className="text-lg font-bold text-white mb-3">⚙️ Share Options</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { key: 'includeScore', label: 'Include Score', icon: '🏆' },
                  { key: 'includeStats', label: 'Include Stats', icon: '📊' },
                  { key: 'includeAchievements', label: 'Include Achievements', icon: '🏅' },
                  { key: 'includeGameMode', label: 'Include Game Mode', icon: '🎮' },
                  { key: 'includeTimestamp', label: 'Include Date', icon: '📅' }
                ].map(option => (
                  <label key={option.key} className="flex items-center space-x-2 text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shareOptions[option.key as keyof ShareOptions] as boolean}
                      onChange={(e) => setShareOptions(prev => ({
                        ...prev,
                        [option.key]: e.target.checked
                      }))}
                      className="rounded"
                    />
                    <span className="text-sm">{option.icon} {option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Custom Message */}
            <div>
              <h3 className="text-lg font-bold text-white mb-3">✏️ Custom Message</h3>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Add a personal message to your share..."
                className="w-full p-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none resize-none"
                rows={3}
              />
            </div>

            {/* Share Button */}
            <div className="flex items-center justify-between">
              <button
                onClick={handleShare}
                disabled={!latestEntry}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  latestEntry
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                }`}
              >
                📤 Share {latestEntry ? `Score: ${latestEntry.score}` : 'Play to Share'}
              </button>
              
              {shareSuccess && (
                <div className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  shareSuccess.includes('Successfully') 
                    ? 'bg-green-600 text-white' 
                    : 'bg-red-600 text-white'
                }`}>
                  {shareSuccess}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Challenges Tab */}
        {activeTab === 'challenges' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white mb-3">🏆 Active Challenges</h3>
            {challenges.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <div className="text-4xl mb-4">🎯</div>
                <p>No active challenges at the moment.</p>
                <p className="text-sm mt-2">Check back later for new challenges!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {challenges.map(challenge => {
                  const progress = checkChallengeProgress(challenge);
                  const difficultyColors = {
                    easy: 'from-green-600 to-green-700',
                    medium: 'from-yellow-600 to-yellow-700',
                    hard: 'from-orange-600 to-orange-700',
                    extreme: 'from-red-600 to-red-700'
                  };

                  return (
                    <div
                      key={challenge.id}
                      className="bg-slate-700 rounded-lg p-4 border border-slate-600"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">{challenge.rewards.badge}</div>
                          <div>
                            <h4 className="text-white font-bold">{challenge.title}</h4>
                            <p className="text-slate-300 text-sm">{challenge.description}</p>
                          </div>
                        </div>
                        <div
                          className={`px-3 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r ${difficultyColors[challenge.difficulty]}`}
                        >
                          {challenge.difficulty.toUpperCase()}
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="flex justify-between text-sm text-slate-300 mb-1">
                          <span>Progress</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-slate-600 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(100, progress)}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-300">
                          Reward: {challenge.rewards.points} points
                          {challenge.rewards.title && ` + "${challenge.rewards.title}" title`}
                        </span>
                        <span className="text-slate-400">
                          Ends: {new Date(challenge.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Compare Tab */}
        {activeTab === 'compare' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-white mb-3">📊 Leaderboard Comparison</h3>
            
            {leaderboardComparison ? (
              <div className="space-y-4">
                {/* Your Position */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">#{leaderboardComparison.yourRank}</div>
                      <div className="text-sm opacity-90">Your Rank</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{leaderboardComparison.yourScore}</div>
                      <div className="text-sm opacity-90">Points</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{leaderboardComparison.percentile}%</div>
                      <div className="text-sm opacity-90">Percentile</div>
                    </div>
                  </div>
                </div>

                {/* Nearby Players */}
                <div>
                  <h4 className="text-white font-bold mb-3">🎯 Nearby Players</h4>
                  <div className="space-y-2">
                    {leaderboardComparison.nearbyPlayers.map(player => (
                      <div
                        key={`${player.rank}-${player.score}`}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          player.isYou 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="font-bold">#{player.rank}</span>
                          <span>{player.name}{player.isYou ? ' (You)' : ''}</span>
                        </div>
                        <span className="font-bold">{player.score} pts</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Improvement Goal */}
                {leaderboardComparison.improvementNeeded.pointsNeeded > 0 && (
                  <div className="bg-slate-700 rounded-lg p-4">
                    <h4 className="text-white font-bold mb-2">🎯 Next Goal</h4>
                    <p className="text-slate-300">
                      Score <span className="font-bold text-white">{leaderboardComparison.improvementNeeded.pointsNeeded}</span> more points 
                      to reach rank <span className="font-bold text-white">#{leaderboardComparison.improvementNeeded.nextRank}</span>!
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <div className="text-4xl mb-4">📊</div>
                <p>Play a game to see your leaderboard comparison!</p>
              </div>
            )}
          </div>
        )}

        {/* Milestones Tab */}
        {activeTab === 'milestones' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white mb-3">🎯 Recent Milestones</h3>
            
            {/* Share Recent Achievements */}
            <div>
              <h4 className="text-white font-bold mb-3">🏅 Share Achievements</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.values(achievements)
                  .filter(achievement => achievement.unlocked)
                  .slice(-4)
                  .map(achievement => (
                    <div
                      key={achievement.id}
                      className="bg-slate-700 rounded-lg p-3 border border-slate-600"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">{achievement.icon}</span>
                          <div>
                            <div className="text-white font-medium text-sm">{achievement.name}</div>
                            <div className="text-slate-300 text-xs">{achievement.rewards.points} pts</div>
                          </div>
                        </div>
                        <button
                          onClick={() => shareAchievement(achievement)}
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors"
                        >
                          📤 Share
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Score Milestones */}
            <div>
              <h4 className="text-white font-bold mb-3">🏆 Score Milestones</h4>
              <div className="space-y-2">
                {[10, 25, 50, 100, 200, 500].map(milestone => {
                  const achieved = currentScore >= milestone;
                  return (
                    <div
                      key={milestone}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        achieved 
                          ? 'bg-green-600 text-white' 
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">
                          {achieved ? '✅' : milestone >= 100 ? '💯' : milestone >= 50 ? '🎯' : '🏆'}
                        </span>
                        <span>{milestone} Point Club</span>
                      </div>
                      <span className="font-bold">
                        {achieved ? 'Achieved!' : `${milestone - currentScore} to go`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 