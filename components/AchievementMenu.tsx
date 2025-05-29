import React, { useState, useMemo } from 'react';
import { Achievement, AchievementCategory, AchievementDifficulty } from '../types/achievements';
import { ACHIEVEMENT_DIFFICULTY_CONFIG } from '../constants/achievements';

interface AchievementMenuProps {
  achievements: Record<string, Achievement>;
  totalAchievementPoints: number;
  isVisible: boolean;
  onClose: () => void;
}

type SortOption = 'name' | 'difficulty' | 'completion' | 'points';

const CATEGORY_CONFIG = {
  all: { name: 'All', icon: '🏆', color: '#4ECDC4' },
  score: { name: 'Score', icon: '📊', color: '#FFD700' },
  powerup: { name: 'Power-ups', icon: '⚡', color: '#FF6B6B' },
  skill: { name: 'Skill', icon: '🎯', color: '#4ECDC4' },
  progression: { name: 'Progress', icon: '📈', color: '#95E1D3' },
  special: { name: 'Special', icon: '✨', color: '#9966CC' }
};

export default function AchievementMenu({ achievements, totalAchievementPoints, isVisible, onClose }: AchievementMenuProps) {
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('difficulty');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyUnlocked, setShowOnlyUnlocked] = useState(false);

  // Calculate statistics
  const stats = useMemo(() => {
    const achievementArray = Object.values(achievements);
    const unlockedAchievements = achievementArray.filter(a => a.unlocked);
    const totalAchievements = achievementArray.filter(a => !a.hidden || a.unlocked).length;
    const completionPercentage = Math.round((unlockedAchievements.length / totalAchievements) * 100);
    
    const categoryStats = Object.entries(CATEGORY_CONFIG).reduce((acc, [key, config]) => {
      if (key === 'all') return acc;
      const categoryAchievements = achievementArray.filter(a => 
        a.category === key && (!a.hidden || a.unlocked)
      );
      const unlockedInCategory = categoryAchievements.filter(a => a.unlocked);
      acc[key as AchievementCategory] = {
        total: categoryAchievements.length,
        unlocked: unlockedInCategory.length,
        percentage: categoryAchievements.length > 0 ? Math.round((unlockedInCategory.length / categoryAchievements.length) * 100) : 0
      };
      return acc;
    }, {} as Record<AchievementCategory, { total: number; unlocked: number; percentage: number }>);

    return {
      totalAchievements,
      unlockedAchievements: unlockedAchievements.length,
      completionPercentage,
      totalPoints: totalAchievementPoints,
      categoryStats
    };
  }, [achievements, totalAchievementPoints]);

  // Filter and sort achievements
  const filteredAndSortedAchievements = useMemo(() => {
    let filtered = Object.values(achievements).filter(achievement => {
      // Filter by visibility (hidden achievements only show when unlocked)
      if (achievement.hidden && !achievement.unlocked) return false;
      
      // Filter by category
      if (selectedCategory !== 'all' && achievement.category !== selectedCategory) return false;
      
      // Filter by unlock status
      if (showOnlyUnlocked && !achievement.unlocked) return false;
      
      // Filter by search term
      if (searchTerm && !achievement.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !achievement.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      
      return true;
    });

    // Sort achievements
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'difficulty':
          const difficultyOrder: AchievementDifficulty[] = ['bronze', 'silver', 'gold', 'platinum', 'legendary'];
          return difficultyOrder.indexOf(a.difficulty) - difficultyOrder.indexOf(b.difficulty);
        case 'completion':
          if (a.unlocked && !b.unlocked) return -1;
          if (!a.unlocked && b.unlocked) return 1;
          return a.progress - b.progress;
        case 'points':
          return b.rewards.points - a.rewards.points;
        default:
          return 0;
      }
    });

    return filtered;
  }, [achievements, selectedCategory, sortBy, searchTerm, showOnlyUnlocked]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 max-w-4xl max-h-[90vh] w-full mx-4 overflow-hidden shadow-2xl border border-slate-600">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="text-3xl">🏆</div>
            <div>
              <h2 className="text-2xl font-bold text-white">Achievements</h2>
              <p className="text-slate-300 text-sm">Track your progress and unlock rewards</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-red-400 transition-colors text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-4 text-white">
            <div className="text-2xl font-bold">{stats.completionPercentage}%</div>
            <div className="text-sm opacity-90">Overall Completion</div>
            <div className="text-xs opacity-75">{stats.unlockedAchievements}/{stats.totalAchievements} unlocked</div>
          </div>
          <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-lg p-4 text-white">
            <div className="text-2xl font-bold">{stats.totalPoints}</div>
            <div className="text-sm opacity-90">Achievement Points</div>
            <div className="text-xs opacity-75">Earned from unlocked achievements</div>
          </div>
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-4 text-white">
            <div className="text-2xl font-bold">{Object.values(stats.categoryStats).reduce((sum, cat) => sum + cat.unlocked, 0)}</div>
            <div className="text-sm opacity-90">Categories Mastered</div>
            <div className="text-xs opacity-75">Achievements across all categories</div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
            const isSelected = selectedCategory === key;
            const categoryData = key === 'all' ? null : stats.categoryStats[key as AchievementCategory];
            
            return (
              <button
                key={key}
                onClick={() => setSelectedCategory(key as AchievementCategory | 'all')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-white text-slate-800 shadow-lg'
                    : 'bg-slate-700 text-white hover:bg-slate-600'
                }`}
                style={isSelected ? {} : { backgroundColor: config.color + '20', borderColor: config.color }}
              >
                <span>{config.icon}</span>
                <span>{config.name}</span>
                {categoryData && (
                  <span className="text-xs opacity-75">
                    {categoryData.unlocked}/{categoryData.total}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search and Sort Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search achievements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="difficulty">Sort by Difficulty</option>
              <option value="name">Sort by Name</option>
              <option value="completion">Sort by Completion</option>
              <option value="points">Sort by Points</option>
            </select>
            <label className="flex items-center space-x-2 text-white text-sm">
              <input
                type="checkbox"
                checked={showOnlyUnlocked}
                onChange={(e) => setShowOnlyUnlocked(e.target.checked)}
                className="rounded"
              />
              <span>Unlocked only</span>
            </label>
          </div>
        </div>

        {/* Achievement Grid */}
        <div className="overflow-y-auto max-h-96">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndSortedAchievements.map((achievement) => {
              const difficultyConfig = ACHIEVEMENT_DIFFICULTY_CONFIG[achievement.difficulty];
              const progressPercentage = Math.min(100, (achievement.progress / achievement.requirement.value) * 100);
              
              return (
                <div
                  key={achievement.id}
                  className={`rounded-lg p-4 border-2 transition-all ${
                    achievement.unlocked
                      ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-500 shadow-lg'
                      : 'bg-gradient-to-br from-slate-700 to-slate-800 border-slate-600'
                  }`}
                >
                  {/* Achievement Icon and Difficulty */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-2xl">{achievement.icon}</div>
                    <div
                      className="px-2 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: difficultyConfig.color }}
                    >
                      {achievement.difficulty.toUpperCase()}
                    </div>
                  </div>

                  {/* Achievement Info */}
                  <div className={`mb-3 ${achievement.unlocked ? 'text-slate-800' : 'text-white'}`}>
                    <h3 className="font-bold text-sm mb-1">{achievement.name}</h3>
                    <p className="text-xs opacity-75 leading-relaxed">{achievement.description}</p>
                  </div>

                  {/* Progress Bar */}
                  {!achievement.unlocked && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-slate-300 mb-1">
                        <span>Progress</span>
                        <span>{achievement.progress}/{achievement.requirement.value}</span>
                      </div>
                      <div className="w-full bg-slate-600 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Rewards */}
                  <div className={`flex items-center justify-between text-xs ${achievement.unlocked ? 'text-slate-600' : 'text-slate-300'}`}>
                    <span className="flex items-center space-x-1">
                      <span>💎</span>
                      <span>{achievement.rewards.points} pts</span>
                    </span>
                    {achievement.unlocked && achievement.unlockedAt && (
                      <span className="text-green-600 font-medium">
                        ✓ Unlocked
                      </span>
                    )}
                    {achievement.rewards.title && (
                      <span className="text-purple-400 font-medium">
                        👑 {achievement.rewards.title}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredAndSortedAchievements.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <div className="text-4xl mb-4">🔍</div>
              <p>No achievements match your current filters.</p>
              <p className="text-sm mt-2">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-600">
          <div className="flex flex-wrap justify-center gap-4 text-xs text-slate-400">
            {Object.entries(ACHIEVEMENT_DIFFICULTY_CONFIG).map(([difficulty, config]) => (
              <div key={difficulty} className="flex items-center space-x-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: config.color }}
                />
                <span>{difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</span>
                <span>({config.minPoints}-{config.maxPoints} pts)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 