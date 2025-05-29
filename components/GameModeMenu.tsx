import React, { useState, useMemo } from 'react';
import { GameMode, GameModeStats, GAME_MODES } from '../types/gameModes';
import { GameModeSystem } from '../lib/gameModeSystem';

interface GameModeMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onModeSelect: (modeId: string) => void;
  gameModeSystem: GameModeSystem;
  currentModeId: string;
}

export default function GameModeMenu({ 
  isOpen, 
  onClose, 
  onModeSelect, 
  gameModeSystem,
  currentModeId 
}: GameModeMenuProps) {
  const [activeTab, setActiveTab] = useState<'modes' | 'progress' | 'stats'>('modes');
  const [selectedModeFilter, setSelectedModeFilter] = useState<'all' | 'unlocked' | 'locked'>('unlocked');

  const availableModes = useMemo(() => {
    const modes = GAME_MODES;
    
    switch (selectedModeFilter) {
      case 'unlocked':
        return modes.filter(mode => gameModeSystem.isModeUnlocked(mode));
      case 'locked':
        return modes.filter(mode => !gameModeSystem.isModeUnlocked(mode));
      default:
        return modes;
    }
  }, [selectedModeFilter, gameModeSystem]);

  const allStats = useMemo(() => {
    return GAME_MODES.map(mode => ({
      mode,
      stats: gameModeSystem.getStats(mode.id),
      progress: gameModeSystem.getModeProgress(mode.id),
      isUnlocked: gameModeSystem.isModeUnlocked(mode)
    }));
  }, [gameModeSystem]);

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'Easy': return 'text-green-400';
      case 'Medium': return 'text-blue-400';
      case 'Hard': return 'text-orange-400';
      case 'Expert': return 'text-red-400';
      case 'Legendary': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  const getDifficultyBg = (difficulty: string): string => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-500/20 border-green-500/30';
      case 'Medium': return 'bg-blue-500/20 border-blue-500/30';
      case 'Hard': return 'bg-orange-500/20 border-orange-500/30';
      case 'Expert': return 'bg-red-500/20 border-red-500/30';
      case 'Legendary': return 'bg-purple-500/20 border-purple-500/30';
      default: return 'bg-gray-500/20 border-gray-500/30';
    }
  };

  const totalGames = useMemo(() => 
    allStats.reduce((sum, { stats }) => sum + (stats?.totalPlays || 0), 0), 
    [allStats]
  );

  const totalScore = useMemo(() => 
    allStats.reduce((sum, { stats }) => sum + (stats?.totalScore || 0), 0), 
    [allStats]
  );

  const unlockedModes = useMemo(() => 
    allStats.filter(({ isUnlocked }) => isUnlocked).length, 
    [allStats]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-slate-700">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Game Modes</h2>
              <p className="text-blue-100">Choose your challenge and test your skills</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-red-300 transition-colors text-2xl font-bold"
            >
              ✕
            </button>
          </div>

          {/* Quick Stats */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{unlockedModes}/{GAME_MODES.length}</div>
              <div className="text-sm text-blue-200">Unlocked</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{totalGames}</div>
              <div className="text-sm text-blue-200">Total Games</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{totalScore}</div>
              <div className="text-sm text-blue-200">Total Score</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{Math.round((unlockedModes / GAME_MODES.length) * 100)}%</div>
              <div className="text-sm text-blue-200">Progress</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-700 bg-slate-800">
          {[
            { id: 'modes', label: 'Modes', icon: '🎮' },
            { id: 'progress', label: 'Progress', icon: '📊' },
            { id: 'stats', label: 'Statistics', icon: '📈' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-4 px-6 text-center transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'modes' && (
            <div>
              {/* Filter Controls */}
              <div className="mb-6 flex flex-wrap gap-2">
                {[
                  { id: 'unlocked', label: 'Unlocked', count: availableModes.filter(m => gameModeSystem.isModeUnlocked(m)).length },
                  { id: 'locked', label: 'Locked', count: availableModes.filter(m => !gameModeSystem.isModeUnlocked(m)).length },
                  { id: 'all', label: 'All Modes', count: GAME_MODES.length }
                ].map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setSelectedModeFilter(filter.id as any)}
                    className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                      selectedModeFilter === filter.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {filter.label} ({filter.count})
                  </button>
                ))}
              </div>

              {/* Mode Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableModes.map(mode => {
                  const isUnlocked = gameModeSystem.isModeUnlocked(mode);
                  const stats = gameModeSystem.getStats(mode.id);
                  const progress = gameModeSystem.getModeProgress(mode.id);
                  const isSelected = currentModeId === mode.id;

                  return (
                    <div
                      key={mode.id}
                      className={`relative p-6 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500/10'
                          : isUnlocked
                          ? 'border-slate-600 bg-slate-700/50 hover:border-slate-500 hover:bg-slate-700/70'
                          : 'border-slate-700 bg-slate-800/50 opacity-60'
                      }`}
                    >
                      {/* Mode Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl" style={{ color: mode.color }}>
                            {mode.icon}
                          </span>
                          <div>
                            <h3 className="text-xl font-bold text-white">{mode.name}</h3>
                            <span className={`text-sm px-2 py-1 rounded border ${getDifficultyBg(mode.difficulty)} ${getDifficultyColor(mode.difficulty)}`}>
                              {mode.difficulty}
                            </span>
                          </div>
                        </div>
                        {isSelected && (
                          <span className="text-blue-400 text-sm font-medium">CURRENT</span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-slate-300 text-sm mb-4">{mode.description}</p>

                      {/* Unlock Requirement */}
                      {!isUnlocked && mode.unlockRequirement && (
                        <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                          <div className="text-orange-400 text-sm font-medium mb-1">🔒 Unlock Requirement</div>
                          <div className="text-orange-300 text-sm">{mode.unlockRequirement.description}</div>
                        </div>
                      )}

                      {/* Progress & Stats */}
                      {isUnlocked && stats && (
                        <div className="mb-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Best Score:</span>
                            <span className="text-white font-medium">{stats.bestScore}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Games Played:</span>
                            <span className="text-white font-medium">{stats.totalPlays}</span>
                          </div>
                          {progress.totalObjectives > 0 && (
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-400">Objectives:</span>
                                <span className="text-white font-medium">
                                  {progress.objectivesCompleted}/{progress.totalObjectives}
                                </span>
                              </div>
                              <div className="w-full bg-slate-600 rounded-full h-2">
                                <div
                                  className="bg-green-500 h-2 rounded-full transition-all"
                                  style={{ width: `${progress.completionPercentage}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Objectives Preview */}
                      {mode.objectives && mode.objectives.length > 0 && (
                        <div className="mb-4">
                          <div className="text-sm font-medium text-slate-300 mb-2">Objectives:</div>
                          <div className="space-y-1">
                            {mode.objectives.slice(0, 2).map(objective => (
                              <div key={objective.id} className="text-xs text-slate-400 flex items-center gap-2">
                                <span>•</span>
                                <span>{objective.description}</span>
                              </div>
                            ))}
                            {mode.objectives.length > 2 && (
                              <div className="text-xs text-slate-500">
                                +{mode.objectives.length - 2} more objectives...
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action Button */}
                      <button
                        onClick={() => isUnlocked && onModeSelect(mode.id)}
                        disabled={!isUnlocked}
                        className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                          isUnlocked
                            ? isSelected
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {!isUnlocked ? '🔒 Locked' : isSelected ? '✓ Selected' : 'Select Mode'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'progress' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Overall Progress</h3>
                <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                  {Math.round((unlockedModes / GAME_MODES.length) * 100)}%
                </div>
                <p className="text-slate-400">Modes Unlocked</p>
              </div>

              {allStats.map(({ mode, stats, progress, isUnlocked }) => (
                <div key={mode.id} className="p-4 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl" style={{ color: mode.color }}>{mode.icon}</span>
                      <div>
                        <h4 className="text-lg font-bold text-white">{mode.name}</h4>
                        <span className={`text-sm ${getDifficultyColor(mode.difficulty)}`}>
                          {mode.difficulty}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      {isUnlocked ? (
                        <span className="text-green-400 text-sm">✓ Unlocked</span>
                      ) : (
                        <span className="text-orange-400 text-sm">🔒 Locked</span>
                      )}
                    </div>
                  </div>

                  {isUnlocked && stats ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-slate-400">Best Score</div>
                        <div className="text-white font-medium">{stats.bestScore}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Games Played</div>
                        <div className="text-white font-medium">{stats.totalPlays}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Avg Score</div>
                        <div className="text-white font-medium">{Math.round(stats.averageScore)}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Completion</div>
                        <div className="text-white font-medium">{Math.round(stats.completionRate * 100)}%</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-400 text-sm">
                      {mode.unlockRequirement?.description || 'Play to unlock this mode'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-6">
              {/* Overall Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-lg border border-blue-500/30">
                  <div className="text-2xl font-bold text-blue-400">{totalGames}</div>
                  <div className="text-sm text-blue-300">Total Games</div>
                </div>
                <div className="p-4 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-lg border border-green-500/30">
                  <div className="text-2xl font-bold text-green-400">{totalScore}</div>
                  <div className="text-sm text-green-300">Total Score</div>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-lg border border-purple-500/30">
                  <div className="text-2xl font-bold text-purple-400">{unlockedModes}</div>
                  <div className="text-sm text-purple-300">Modes Unlocked</div>
                </div>
                <div className="p-4 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-lg border border-orange-500/30">
                  <div className="text-2xl font-bold text-orange-400">
                    {totalGames > 0 ? Math.round(totalScore / totalGames) : 0}
                  </div>
                  <div className="text-sm text-orange-300">Avg Score</div>
                </div>
              </div>

              {/* Detailed Mode Statistics */}
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Mode Performance</h3>
                <div className="space-y-3">
                  {allStats
                    .filter(({ isUnlocked }) => isUnlocked)
                    .sort((a, b) => (b.stats?.bestScore || 0) - (a.stats?.bestScore || 0))
                    .map(({ mode, stats }) => (
                      <div key={mode.id} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl" style={{ color: mode.color }}>{mode.icon}</span>
                          <div>
                            <div className="font-medium text-white">{mode.name}</div>
                            <div className={`text-sm ${getDifficultyColor(mode.difficulty)}`}>
                              {mode.difficulty}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-bold">{stats?.bestScore || 0}</div>
                          <div className="text-slate-400 text-sm">Best Score</div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-800 border-t border-slate-700 text-center text-slate-400 text-sm">
          Press 'G' to quickly access Game Modes • {unlockedModes}/{GAME_MODES.length} modes unlocked
        </div>
      </div>
    </div>
  );
} 