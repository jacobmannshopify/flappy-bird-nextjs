import React, { useState, useMemo } from 'react';
import { 
  LeaderboardEntry, 
  PlayerStatistics, 
  SessionStatistics,
  LeaderboardSortOption,
  LeaderboardFilterOption 
} from '../types/leaderboard';

interface LeaderboardMenuProps {
  entries: LeaderboardEntry[];
  playerStats: PlayerStatistics;
  sessionStats: SessionStatistics;
  isVisible: boolean;
  onClose: () => void;
  onExportScore?: (entryId: string) => void;
  onClearData?: () => void;
}

const SORT_OPTIONS = [
  { value: 'score', label: '🏆 Score', icon: '📊' },
  { value: 'date', label: '📅 Date', icon: '🕒' },
  { value: 'playTime', label: '⏱️ Play Time', icon: '⌚' },
  { value: 'powerUps', label: '⚡ Power-ups', icon: '💫' },
  { value: 'achievements', label: '🏅 Achievements', icon: '🎯' }
] as const;

const FILTER_OPTIONS = [
  { value: 'all', label: 'All Scores', icon: '🌟' },
  { value: 'recent', label: 'Recent', icon: '🔥' },
  { value: 'today', label: 'Today', icon: '📅' },
  { value: 'thisWeek', label: 'This Week', icon: '📊' },
  { value: 'personal', label: 'Personal Best', icon: '👤' }
] as const;

export default function LeaderboardMenu({ 
  entries, 
  playerStats, 
  sessionStats, 
  isVisible, 
  onClose,
  onExportScore,
  onClearData
}: LeaderboardMenuProps) {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'stats' | 'session'>('leaderboard');
  const [sortBy, setSortBy] = useState<LeaderboardSortOption>('score');
  const [filterBy, setFilterBy] = useState<LeaderboardFilterOption>('all');

  // Calculate rank distribution
  const rankDistribution = useMemo(() => {
    if (!entries || entries.length === 0) return { top10: 0, top50: 0, average: 0 };
    
    const scores = entries.map(e => e.score).sort((a, b) => b - a);
    const top10Threshold = scores[Math.min(9, scores.length - 1)];
    const top50Threshold = scores[Math.min(49, scores.length - 1)];
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    return {
      top10: top10Threshold,
      top50: top50Threshold,
      average: Math.round(averageScore)
    };
  }, [entries]);

  // Format time duration
  const formatDuration = (ms: number): string => {
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
  };

  // Format relative time
  const formatRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 max-w-5xl max-h-[90vh] w-full mx-4 overflow-hidden shadow-2xl border border-slate-600">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="text-3xl">🏆</div>
            <div>
              <h2 className="text-2xl font-bold text-white">Leaderboard</h2>
              <p className="text-slate-300 text-sm">Track your scores and compete with yourself</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-red-400 transition-colors text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-slate-700 rounded-lg p-1">
          {[
            { id: 'leaderboard', label: '🏆 Scores', icon: '📊' },
            { id: 'stats', label: '📈 Statistics', icon: '📊' },
            { id: 'session', label: '🎮 Session', icon: '⏱️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-slate-800 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div>
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as LeaderboardSortOption)}
                  className="px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
                >
                  {SORT_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value as LeaderboardFilterOption)}
                  className="px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
                >
                  {FILTER_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {onClearData && (
                <button
                  onClick={onClearData}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                >
                  🗑️ Clear Data
                </button>
              )}
            </div>

            {/* Entries List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {!entries || entries.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <div className="text-4xl mb-4">🎯</div>
                  <p>No scores yet. Start playing to see your results!</p>
                </div>
              ) : (
                entries.map((entry, index) => (
                  <div
                    key={entry.id}
                    className={`rounded-lg p-4 border-2 transition-all ${
                      index === 0
                        ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 border-yellow-500 shadow-lg'
                        : index <= 2
                        ? 'bg-gradient-to-r from-slate-100 to-slate-200 border-slate-400 shadow-md'
                        : 'bg-gradient-to-r from-slate-700 to-slate-800 border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      {/* Rank and Score */}
                      <div className="flex items-center space-x-4">
                        <div className={`text-2xl font-bold ${
                          index === 0 ? 'text-yellow-600' : 
                          index <= 2 ? 'text-slate-600' : 'text-white'
                        }`}>
                          #{entry.rank}
                        </div>
                        <div>
                          <div className={`text-xl font-bold ${
                            index <= 2 ? 'text-slate-800' : 'text-white'
                          }`}>
                            {entry.score} points
                          </div>
                          <div className={`text-sm ${
                            index <= 2 ? 'text-slate-600' : 'text-slate-300'
                          }`}>
                            {entry.playerName} • {formatRelativeTime(entry.timestamp)}
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className={`text-right text-sm ${
                        index <= 2 ? 'text-slate-600' : 'text-slate-300'
                      }`}>
                        <div>⏱️ {formatDuration(entry.gameStats.playTime)}</div>
                        <div>⚡ {entry.gameStats.powerUpsCollected.total} power-ups</div>
                        <div>🏅 {entry.achievementProgress.totalPoints} pts</div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1">
                        {onExportScore && (
                          <button
                            onClick={() => onExportScore(entry.id)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors"
                          >
                            📤 Export
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            {/* Overall Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-4 text-white">
                <div className="text-2xl font-bold">{playerStats.highScore}</div>
                <div className="text-sm opacity-90">High Score</div>
                <div className="text-xs opacity-75">Rank #{playerStats.bestRank || 'N/A'}</div>
              </div>
              <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-4 text-white">
                <div className="text-2xl font-bold">{Math.round(playerStats.averageScore)}</div>
                <div className="text-sm opacity-90">Average Score</div>
                <div className="text-xs opacity-75">{playerStats.totalGamesPlayed} games played</div>
              </div>
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-4 text-white">
                <div className="text-2xl font-bold">{formatDuration(playerStats.totalPlayTime)}</div>
                <div className="text-sm opacity-90">Total Play Time</div>
                <div className="text-xs opacity-75">{Math.round(playerStats.totalPlayTime / playerStats.totalGamesPlayed || 0)} avg/game</div>
              </div>
            </div>

            {/* Power-up Stats */}
            <div>
              <h3 className="text-lg font-bold text-white mb-3">⚡ Power-up Performance</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(playerStats.powerUpStats).map(([type, stats]) => (
                  <div key={type} className="bg-slate-700 rounded-lg p-3">
                    <div className="text-white font-medium capitalize">{type}</div>
                    <div className="text-slate-300 text-sm">Collected: {stats.collected}</div>
                    <div className="text-slate-300 text-sm">
                      Effectiveness: {Math.round(stats.effectiveness)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievement Stats */}
            <div>
              <h3 className="text-lg font-bold text-white mb-3">🏅 Achievement Progress</h3>
              <div className="bg-slate-700 rounded-lg p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-white text-lg font-bold">
                      {playerStats.achievementStats.totalUnlocked}
                    </div>
                    <div className="text-slate-300 text-sm">Achievements Unlocked</div>
                  </div>
                  <div>
                    <div className="text-white text-lg font-bold">
                      {playerStats.achievementStats.totalPoints}
                    </div>
                    <div className="text-slate-300 text-sm">Achievement Points</div>
                  </div>
                  <div>
                    <div className="text-white text-lg font-bold">
                      {Math.round(playerStats.achievementStats.completionPercentage)}%
                    </div>
                    <div className="text-slate-300 text-sm">Completion Rate</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Streak Stats */}
            <div>
              <h3 className="text-lg font-bold text-white mb-3">🔥 Streak Performance</h3>
              <div className="bg-slate-700 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-white text-lg font-bold">
                      {playerStats.streakStats.currentStreak}
                    </div>
                    <div className="text-slate-300 text-sm">Current Streak</div>
                  </div>
                  <div>
                    <div className="text-white text-lg font-bold">
                      {playerStats.streakStats.bestStreak}
                    </div>
                    <div className="text-slate-300 text-sm">Best Streak</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Session Tab */}
        {activeTab === 'session' && (
          <div className="space-y-6">
            {/* Session Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-lg p-4 text-white">
                <div className="text-2xl font-bold">{sessionStats.gamesThisSession}</div>
                <div className="text-sm opacity-90">Games This Session</div>
                <div className="text-xs opacity-75">
                  {formatDuration(sessionStats.sessionDuration)} session time
                </div>
              </div>
              <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-lg p-4 text-white">
                <div className="text-2xl font-bold">{sessionStats.bestScoreThisSession}</div>
                <div className="text-sm opacity-90">Best Score Today</div>
                <div className="text-xs opacity-75">
                  {Math.round(sessionStats.totalScoreThisSession / Math.max(1, sessionStats.gamesThisSession))} avg
                </div>
              </div>
            </div>

            {/* Session Progress */}
            <div>
              <h3 className="text-lg font-bold text-white mb-3">📈 Session Progress</h3>
              <div className="space-y-3">
                <div className="bg-slate-700 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white">Total Score This Session</span>
                    <span className="text-white font-bold">{sessionStats.totalScoreThisSession}</span>
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all"
                      style={{ 
                        width: `${Math.min(100, (sessionStats.totalScoreThisSession / Math.max(1, playerStats.averageScore * 10)) * 100)}%` 
                      }}
                    />
                  </div>
                </div>

                <div className="bg-slate-700 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white">Power-ups Collected</span>
                    <span className="text-white font-bold">{sessionStats.powerUpsCollectedThisSession}</span>
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all"
                      style={{ 
                        width: `${Math.min(100, (sessionStats.powerUpsCollectedThisSession / Math.max(1, sessionStats.gamesThisSession * 2)) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Analysis */}
            <div>
              <h3 className="text-lg font-bold text-white mb-3">🎯 Performance Analysis</h3>
              <div className="bg-slate-700 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-white text-sm mb-2">Session vs All-Time Average</div>
                    <div className={`text-lg font-bold ${
                      sessionStats.improvementFromLastSession >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {sessionStats.improvementFromLastSession >= 0 ? '+' : ''}
                      {Math.round(sessionStats.improvementFromLastSession)}
                    </div>
                  </div>
                  <div>
                    <div className="text-white text-sm mb-2">Games per Hour</div>
                    <div className="text-lg font-bold text-white">
                      {sessionStats.sessionDuration > 0 
                        ? Math.round((sessionStats.gamesThisSession / (sessionStats.sessionDuration / (1000 * 60 * 60))) * 10) / 10
                        : 0
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 