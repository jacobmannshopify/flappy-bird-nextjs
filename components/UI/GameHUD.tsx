'use client';

import { useEffect, useState } from 'react';
import { soundManager } from '@/lib/soundManager';
import { DayNightCycle } from '../../lib/dayNightCycle';

interface GameHUDProps {
  score: number;
  highScore: number;
  gameTime: number;
  fps: number;
  pipesCleared: number;
  gameStarted: boolean;
  gameOver: boolean;
  className?: string;
}

const GameHUD: React.FC<GameHUDProps> = ({
  score,
  highScore,
  gameTime,
  fps,
  pipesCleared,
  gameStarted,
  gameOver,
  className = ''
}) => {
  const [previousScore, setPreviousScore] = useState(score);
  const [scoreAnimation, setScoreAnimation] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [lastMilestoneScore, setLastMilestoneScore] = useState(0);
  const dayNightCycle = new DayNightCycle();
  const timeInfo = dayNightCycle.getCurrentTimeInfo(score);

  useEffect(() => {
    // Entrance animation
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Score increase animation and milestone sounds
    if (score > previousScore) {
      setScoreAnimation(true);
      
      // Play milestone achievement sounds
      if (score > 0 && score % 10 === 0 && score > lastMilestoneScore) {
        soundManager.playSound('achievement');
        setLastMilestoneScore(score);
      }
      
      const timer = setTimeout(() => setScoreAnimation(false), 300);
      setPreviousScore(score);
      return () => clearTimeout(timer);
    }
  }, [score, previousScore, lastMilestoneScore]);

  // Play high score celebration sound
  useEffect(() => {
    if (score > highScore && score > 0 && score > previousScore) {
      soundManager.playSound('highScore');
    }
  }, [score, highScore, previousScore]);

  const formatTime = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (): string => {
    if (score >= highScore && score > 0) return 'text-yellow-300';
    if (score >= 30) return 'text-green-300';
    if (score >= 15) return 'text-blue-300';
    return 'text-white';
  };

  const getPerformanceColor = (): string => {
    if (fps >= 55) return 'text-green-400';
    if (fps >= 45) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className={`fixed inset-0 pointer-events-none z-40 ${className}`}>
      {/* Main Score Display */}
      <div 
        className={`absolute top-8 left-1/2 transform -translate-x-1/2 transition-all duration-700 ${
          isVisible ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0'
        }`}
      >
        <div className="text-center">
          <div 
            className={`text-6xl font-bold drop-shadow-lg transition-all duration-300 ${
              scoreAnimation ? 'scale-125' : 'scale-100'
            } ${getScoreColor()}`}
            style={{
              textShadow: '3px 3px 0px rgba(0,0,0,0.8), 6px 6px 10px rgba(0,0,0,0.5)',
              filter: scoreAnimation ? 'brightness(1.3)' : 'brightness(1)'
            }}
          >
            {score}
          </div>
          
          {/* Score Milestone Celebration */}
          {scoreAnimation && score > 0 && score % 5 === 0 && (
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 animate-bounce">
              <span className="text-2xl">
                {score >= 25 ? '🔥' : score >= 15 ? '⭐' : score >= 5 ? '💫' : '✨'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Top Left Stats */}
      <div 
        className={`absolute top-6 left-6 space-y-2 transition-all duration-700 delay-200 ${
          isVisible ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'
        }`}
      >
        {/* High Score */}
        <div className="bg-black/30 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20">
          <p className="text-white/70 text-xs uppercase tracking-wide">Best</p>
          <p className="text-yellow-300 font-bold text-lg">{highScore}</p>
        </div>

        {/* Game Time */}
        <div className="bg-black/30 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20">
          <p className="text-white/70 text-xs uppercase tracking-wide">Time</p>
          <p className="text-blue-300 font-bold text-lg font-mono">{formatTime(gameTime)}</p>
        </div>

        {/* Pipes Cleared */}
        <div className="bg-black/30 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20">
          <p className="text-white/70 text-xs uppercase tracking-wide">Pipes</p>
          <p className="text-green-300 font-bold text-lg">{pipesCleared}</p>
        </div>
      </div>

      {/* Top Right Performance Stats */}
      <div 
        className={`absolute top-6 right-6 space-y-2 transition-all duration-700 delay-400 ${
          isVisible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
        }`}
      >
        {/* FPS Counter */}
        <div className="bg-black/30 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20">
          <p className="text-white/70 text-xs uppercase tracking-wide">FPS</p>
          <p className={`font-bold text-lg font-mono ${getPerformanceColor()}`}>
            {fps}
          </p>
        </div>

        {/* Performance Indicator */}
        <div className="bg-black/30 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20">
          <p className="text-white/70 text-xs uppercase tracking-wide">Performance</p>
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${fps >= 55 ? 'bg-green-400' : fps >= 45 ? 'bg-yellow-400' : 'bg-red-400'}`}></div>
            <span className="text-white text-xs">
              {fps >= 55 ? 'Excellent' : fps >= 45 ? 'Good' : 'Poor'}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Controls Hint */}
      <div 
        className={`absolute bottom-6 left-1/2 transform -translate-x-1/2 transition-all duration-700 delay-600 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}
      >
        <div className="bg-black/20 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/10">
          <div className="flex items-center space-x-6 text-xs text-white/60">
            <span className="flex items-center space-x-1">
              <kbd className="bg-white/10 px-1 py-0.5 rounded text-xs">SPACE</kbd>
              <span>Flap</span>
            </span>
            <span className="flex items-center space-x-1">
              <kbd className="bg-white/10 px-1 py-0.5 rounded text-xs">P</kbd>
              <span>Pause</span>
            </span>
            <span className="flex items-center space-x-1">
              <kbd className="bg-white/10 px-1 py-0.5 rounded text-xs">ESC</kbd>
              <span>Menu</span>
            </span>
          </div>
        </div>
      </div>

      {/* Score Streak Indicator */}
      {score > 0 && score % 10 === 0 && scoreAnimation && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-xl shadow-lg animate-pulse">
            <p className="text-2xl font-bold">🏆 {score} STREAK!</p>
          </div>
        </div>
      )}

      {/* New High Score Celebration */}
      {score > highScore && score > 0 && (
        <div className="absolute top-24 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-4 py-2 rounded-lg shadow-lg">
            <p className="text-lg font-bold">🎉 NEW HIGH SCORE!</p>
          </div>
        </div>
      )}

      {/* Day/Night Cycle Indicator */}
      {gameStarted && (
        <div className="absolute top-4 left-4 text-white z-10 pointer-events-none">
          <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3 mb-2">
            <div className="text-sm opacity-75 mb-1">Time of Day</div>
            <div className="flex items-center gap-2">
              <div className="text-lg font-semibold">
                {timeInfo.name === 'Dawn' && '🌅'}
                {timeInfo.name === 'Day' && '☀️'}
                {timeInfo.name === 'Sunset' && '🌇'}
                {timeInfo.name === 'Night' && '🌙'}
                {timeInfo.name}
              </div>
            </div>
            {timeInfo.pointsUntilNext > 0 && (
              <div className="text-xs opacity-60 mt-1">
                {timeInfo.pointsUntilNext} points until next phase
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameHUD; 