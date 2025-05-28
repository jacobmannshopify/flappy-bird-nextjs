'use client';

import { useEffect, useState } from 'react';

interface GameOverScreenProps {
  score: number;
  highScore: number;
  isNewHighScore: boolean;
  onRestart: () => void;
  onMainMenu: () => void;
  className?: string;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({
  score,
  highScore,
  isNewHighScore,
  onRestart,
  onMainMenu,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);

  // Determine medal based on score
  const getMedal = (score: number) => {
    if (score >= 50) return { emoji: '🥇', name: 'Gold Medal', color: 'text-yellow-500' };
    if (score >= 30) return { emoji: '🥈', name: 'Silver Medal', color: 'text-gray-400' };
    if (score >= 15) return { emoji: '🥉', name: 'Bronze Medal', color: 'text-amber-600' };
    if (score >= 5) return { emoji: '🎖️', name: 'Achievement', color: 'text-blue-500' };
    return null;
  };

  const medal = getMedal(score);

  useEffect(() => {
    // Entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    // Score counting animation
    const scoreTimer = setTimeout(() => {
      const duration = 1500;
      const steps = 60;
      const increment = score / steps;
      let current = 0;
      
      const counter = setInterval(() => {
        current += increment;
        if (current >= score) {
          setAnimatedScore(score);
          clearInterval(counter);
          
          // Show fireworks for high scores
          if (isNewHighScore && score > 10) {
            setShowFireworks(true);
            setTimeout(() => setShowFireworks(false), 3000);
          }
        } else {
          setAnimatedScore(Math.floor(current));
        }
      }, duration / steps);
    }, 800);

    return () => {
      clearTimeout(timer);
      clearTimeout(scoreTimer);
    };
  }, [score, isNewHighScore]);

  const handleRestart = () => {
    setIsVisible(false);
    setTimeout(onRestart, 300);
  };

  const handleMainMenu = () => {
    setIsVisible(false);
    setTimeout(onMainMenu, 300);
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.code === 'KeyR' || event.code === 'Space') {
      event.preventDefault();
      handleRestart();
    } else if (event.code === 'Escape') {
      event.preventDefault();
      handleMainMenu();
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      } ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(220, 20, 60, 0.95) 0%, rgba(139, 0, 0, 0.95) 50%, rgba(75, 0, 130, 0.95) 100%)',
        backdropFilter: 'blur(15px)'
      }}
      onKeyDown={handleKeyPress}
      tabIndex={0}
    >
      <div className="text-center space-y-6 max-w-md mx-auto px-6">
        {/* Game Over Title */}
        <div 
          className="space-y-2 transform transition-all duration-1000"
          style={{
            transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(-50px) scale(0.8)'
          }}
        >
          <h1 
            className="text-5xl font-bold text-white drop-shadow-lg"
            style={{
              textShadow: '3px 3px 0px #8b0000, 6px 6px 15px rgba(0,0,0,0.5)'
            }}
          >
            💀 Game Over!
          </h1>
          {isNewHighScore && (
            <div className="animate-pulse">
              <p className="text-2xl font-bold text-yellow-300 drop-shadow-md">
                🎉 NEW HIGH SCORE! 🎉
              </p>
            </div>
          )}
        </div>

        {/* Medal Display */}
        {medal && (
          <div 
            className="transform transition-all duration-1000 delay-300"
            style={{
              transform: isVisible ? 'scale(1) rotate(0deg)' : 'scale(0) rotate(180deg)'
            }}
          >
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30">
              <div className="text-6xl mb-2">{medal.emoji}</div>
              <p className={`font-bold text-lg ${medal.color}`}>{medal.name}</p>
            </div>
          </div>
        )}

        {/* Score Display */}
        <div 
          className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30 space-y-4 transform transition-all duration-1000 delay-500"
          style={{
            transform: isVisible ? 'translateY(0)' : 'translateY(50px)'
          }}
        >
          <div>
            <p className="text-white/80 font-semibold text-sm uppercase tracking-wide">Final Score</p>
            <p className="text-5xl font-bold text-white drop-shadow-md">
              {animatedScore}
            </p>
          </div>
          
          <div className="border-t border-white/20 pt-4">
            <p className="text-white/70 font-medium text-sm">Best Score</p>
            <p className="text-2xl font-bold text-yellow-300 drop-shadow-sm">
              {highScore}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div 
          className="space-y-3 transform transition-all duration-1000 delay-700"
          style={{
            transform: isVisible ? 'translateY(0)' : 'translateY(50px)'
          }}
        >
          <button
            onClick={handleRestart}
            className="w-full py-3 px-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold text-lg rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95"
            style={{
              textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
            }}
          >
            🔄 Play Again
          </button>
          
          <button
            onClick={handleMainMenu}
            className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold text-lg rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95"
            style={{
              textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
            }}
          >
            🏠 Main Menu
          </button>
        </div>

        {/* Controls Hint */}
        <div 
          className="text-white/60 text-xs space-y-1 transform transition-all duration-1000 delay-900"
          style={{
            transform: isVisible ? 'translateY(0)' : 'translateY(30px)'
          }}
        >
          <p>Quick Controls:</p>
          <div className="flex justify-center space-x-4">
            <span className="bg-white/10 px-2 py-1 rounded border border-white/20">
              <kbd className="font-mono">R</kbd> Restart
            </span>
            <span className="bg-white/10 px-2 py-1 rounded border border-white/20">
              <kbd className="font-mono">ESC</kbd> Menu
            </span>
          </div>
        </div>
      </div>

      {/* Fireworks Effect for New High Score */}
      {showFireworks && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${10 + i * 10}%`,
                top: `${20 + (i % 3) * 20}%`,
                animation: `firework ${1 + i * 0.2}s ease-out infinite`,
                animationDelay: `${i * 0.3}s`
              }}
            >
              ✨
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes firework {
          0% { 
            transform: scale(0) rotate(0deg);
            opacity: 1;
          }
          50% { 
            transform: scale(1.5) rotate(180deg);
            opacity: 0.8;
          }
          100% { 
            transform: scale(2) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default GameOverScreen; 