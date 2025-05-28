'use client';

import { useEffect, useState } from 'react';

interface PauseMenuProps {
  onResume: () => void;
  onMainMenu: () => void;
  currentScore: number;
  gameTime: number;
  className?: string;
}

const PauseMenu: React.FC<PauseMenuProps> = ({
  onResume,
  onMainMenu,
  currentScore,
  gameTime,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleResume = () => {
    setIsVisible(false);
    setTimeout(onResume, 200);
  };

  const handleMainMenu = () => {
    setIsVisible(false);
    setTimeout(onMainMenu, 200);
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.code === 'Space' || event.code === 'KeyP') {
      event.preventDefault();
      handleResume();
    } else if (event.code === 'Escape') {
      event.preventDefault();
      handleMainMenu();
    }
  };

  const formatTime = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      } ${className}`}
      style={{
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)'
      }}
      onKeyDown={handleKeyPress}
      tabIndex={0}
    >
      <div className="text-center space-y-6 max-w-sm mx-auto px-6">
        {/* Pause Title */}
        <div 
          className="transform transition-all duration-500"
          style={{
            transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(-30px) scale(0.8)'
          }}
        >
          <h1 
            className="text-4xl font-bold text-white drop-shadow-lg mb-2"
            style={{
              textShadow: '2px 2px 0px #4a5568, 4px 4px 8px rgba(0,0,0,0.3)'
            }}
          >
            ⏸️ Game Paused
          </h1>
          <p className="text-gray-300 text-sm">Take a breath!</p>
        </div>

        {/* Game Stats */}
        <div 
          className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 space-y-3 transform transition-all duration-500 delay-200"
          style={{
            transform: isVisible ? 'translateY(0)' : 'translateY(30px)'
          }}
        >
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide">Current Score</p>
              <p className="text-2xl font-bold text-white">{currentScore}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide">Time Played</p>
              <p className="text-2xl font-bold text-blue-300">{formatTime(gameTime)}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div 
          className="space-y-3 transform transition-all duration-500 delay-400"
          style={{
            transform: isVisible ? 'translateY(0)' : 'translateY(30px)'
          }}
        >
          <button
            onClick={handleResume}
            className="w-full py-3 px-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold text-lg rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95"
            style={{
              textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
            }}
          >
            ▶️ Resume Game
          </button>
          
          <button
            onClick={handleMainMenu}
            className="w-full py-3 px-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold text-lg rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95"
            style={{
              textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
            }}
          >
            🏠 Quit to Menu
          </button>
        </div>

        {/* Controls Hint */}
        <div 
          className="text-gray-400 text-xs space-y-2 transform transition-all duration-500 delay-600"
          style={{
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)'
          }}
        >
          <p>Quick Controls:</p>
          <div className="flex justify-center space-x-4">
            <span className="bg-white/10 px-2 py-1 rounded border border-white/20">
              <kbd className="font-mono">SPACE</kbd> Resume
            </span>
            <span className="bg-white/10 px-2 py-1 rounded border border-white/20">
              <kbd className="font-mono">ESC</kbd> Quit
            </span>
          </div>
        </div>

        {/* Breathing Animation */}
        <div 
          className="flex justify-center transform transition-all duration-500 delay-800"
          style={{
            transform: isVisible ? 'scale(1)' : 'scale(0)'
          }}
        >
          <div className="w-4 h-4 bg-blue-400 rounded-full animate-ping opacity-30"></div>
        </div>
      </div>
    </div>
  );
};

export default PauseMenu; 