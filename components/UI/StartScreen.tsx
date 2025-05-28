'use client';

import { useEffect, useState } from 'react';
import { soundManager } from '@/lib/soundManager';

interface StartScreenProps {
  onStartGame: () => void;
  highScore: number;
  className?: string;
}

const StartScreen: React.FC<StartScreenProps> = ({
  onStartGame,
  highScore,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [pulseAnimation, setPulseAnimation] = useState(false);

  useEffect(() => {
    // Fade in animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    // Pulse animation for call-to-action
    const pulseTimer = setInterval(() => {
      setPulseAnimation(prev => !prev);
    }, 2000);

    return () => {
      clearTimeout(timer);
      clearInterval(pulseTimer);
    };
  }, []);

  const handleStart = async () => {
    await soundManager.playSound('button');
    setIsVisible(false);
    setTimeout(onStartGame, 300); // Smooth transition out
  };

  const handleKeyPress = async (event: React.KeyboardEvent) => {
    if (event.code === 'Space' || event.code === 'Enter') {
      event.preventDefault();
      await handleStart();
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      } ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(135, 206, 235, 0.95) 0%, rgba(176, 224, 230, 0.95) 50%, rgba(240, 248, 255, 0.95) 100%)',
        backdropFilter: 'blur(10px)'
      }}
      onKeyDown={handleKeyPress}
      tabIndex={0}
    >
      <div className="text-center space-y-8 max-w-md mx-auto px-6">
        {/* Game Title */}
        <div className="space-y-2">
          <h1 
            className="text-6xl font-bold text-white drop-shadow-lg transform transition-all duration-1000"
            style={{
              textShadow: '3px 3px 0px #2563eb, 6px 6px 10px rgba(0,0,0,0.3)',
              transform: isVisible ? 'translateY(0)' : 'translateY(-50px)'
            }}
          >
            🐦 Flappy Bird
          </h1>
          <p 
            className="text-xl text-blue-800 font-semibold opacity-90 transform transition-all duration-1000 delay-300"
            style={{
              transform: isVisible ? 'translateY(0)' : 'translateY(30px)'
            }}
          >
            Next.js Edition
          </p>
        </div>

        {/* Game Preview Bird */}
        <div 
          className="flex justify-center transform transition-all duration-1000 delay-500"
          style={{
            transform: isVisible ? 'scale(1)' : 'scale(0.5)'
          }}
        >
          <div className="w-16 h-16 bg-yellow-400 rounded-full border-4 border-yellow-600 shadow-lg animate-bounce">
            <div className="flex items-center justify-center h-full">
              <div className="w-3 h-3 bg-black rounded-full mr-1 mt-1"></div>
              <div className="w-4 h-2 bg-orange-500 rounded-r-full"></div>
            </div>
          </div>
        </div>

        {/* High Score Display */}
        {highScore > 0 && (
          <div 
            className="bg-white/20 backdrop-blur-sm rounded-lg p-4 border border-white/30 transform transition-all duration-1000 delay-700"
            style={{
              transform: isVisible ? 'translateY(0)' : 'translateY(50px)'
            }}
          >
            <p className="text-blue-800 font-semibold text-sm uppercase tracking-wide">Best Score</p>
            <p className="text-3xl font-bold text-white drop-shadow-md">{highScore}</p>
          </div>
        )}

        {/* Start Button */}
        <div 
          className="space-y-4 transform transition-all duration-1000 delay-1000"
          style={{
            transform: isVisible ? 'translateY(0)' : 'translateY(50px)'
          }}
        >
          <button
            onClick={handleStart}
            className={`w-full py-4 px-8 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold text-xl rounded-xl shadow-lg transition-all duration-300 transform ${
              pulseAnimation ? 'scale-105 shadow-xl' : 'scale-100'
            } hover:scale-105 active:scale-95`}
            style={{
              textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
            }}
          >
            🚀 Start Game
          </button>
          
          {/* Instructions */}
          <div className="space-y-2 text-blue-800 opacity-80">
            <p className="text-sm font-medium">Controls:</p>
            <div className="flex justify-center space-x-6 text-xs">
              <span className="bg-white/20 px-3 py-1 rounded-full border border-white/30">
                <kbd className="font-mono">SPACE</kbd> Flap
              </span>
              <span className="bg-white/20 px-3 py-1 rounded-full border border-white/30">
                <kbd className="font-mono">P</kbd> Pause
              </span>
              <span className="bg-white/20 px-3 py-1 rounded-full border border-white/30">
                <kbd className="font-mono">ESC</kbd> Menu
              </span>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute opacity-20"
              style={{
                left: `${20 + i * 15}%`,
                top: `${10 + i * 20}%`,
                animation: `float ${3 + i * 0.5}s ease-in-out infinite`,
                animationDelay: `${i * 0.5}s`
              }}
            >
              ☁️
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(-10px) translateX(5px); }
          50% { transform: translateY(-20px) translateX(0px); }
          75% { transform: translateY(-10px) translateX(-5px); }
        }
      `}</style>
    </div>
  );
};

export default StartScreen; 