'use client';

import { useEffect, useState, useCallback } from 'react';
import { useCanvas } from '@/hooks/useCanvas';
import { useGameLoop } from '@/hooks/useGameLoop';
import { COLORS } from '@/constants/game';

// TypeScript interfaces for component props and state
interface GameProps {
  width?: number;
  height?: number;
  className?: string;
}

interface GameState {
  isGameRunning: boolean;
  isGameOver: boolean;
  score: number;
}

const Game: React.FC<GameProps> = ({ 
  width = 800, 
  height = 600, 
  className = '' 
}) => {
  const [gameState, setGameState] = useState<GameState>({
    isGameRunning: false,
    isGameOver: false,
    score: 0
  });

  // Use our custom canvas hook
  const {
    canvasRef,
    context,
    actualWidth,
    actualHeight,
    isReady,
    clearCanvas
  } = useCanvas({
    width,
    height,
    maintainAspectRatio: true,
    pixelPerfect: true,
    enableHighDPI: true
  });

  // Game update callback for the game loop
  const gameUpdate = useCallback((deltaTime: number, totalTime: number) => {
    if (!context || !isReady) return;

    // Clear canvas
    context.clearRect(0, 0, actualWidth, actualHeight);

    // Draw background
    context.fillStyle = COLORS.sky;
    context.fillRect(0, 0, actualWidth, actualHeight);

    // Simple animation - pulsing circle to show the loop is working
    const centerX = actualWidth / 2;
    const centerY = actualHeight / 2;
    const pulseRadius = 50 + Math.sin(totalTime * 0.003) * 20;

    // Draw animated circle
    context.fillStyle = COLORS.bird;
    context.beginPath();
    context.arc(centerX, centerY - 50, pulseRadius, 0, Math.PI * 2);
    context.fill();

    // Draw text
    context.fillStyle = COLORS.text;
    context.font = '24px Arial';
    context.textAlign = 'center';
    context.fillText('Game Loop Running!', centerX, centerY + 50);
    context.font = '16px Arial';
    context.fillText(`Time: ${(totalTime / 1000).toFixed(1)}s`, centerX, centerY + 80);
    context.fillText('Press Space to start/stop', centerX, centerY + 110);

  }, [context, isReady, actualWidth, actualHeight]);

  // Use our custom game loop hook
  const {
    start: startGameLoop,
    stop: stopGameLoop,
    pause: pauseGameLoop,
    resume: resumeGameLoop,
    stats,
    isRunning: isLoopRunning,
    isPaused: isLoopPaused
  } = useGameLoop(gameUpdate, {
    targetFPS: 60,
    enableStats: true,
    autoStart: false
  });

  // Initialize canvas content when ready (but not running game loop)
  useEffect(() => {
    if (!context || !isReady || isLoopRunning) return;

    // Clear canvas with sky blue background
    context.fillStyle = COLORS.sky;
    context.fillRect(0, 0, actualWidth, actualHeight);

    // Add initial text
    context.fillStyle = COLORS.text;
    context.font = '24px Arial';
    context.textAlign = 'center';
    context.fillText('Flappy Bird Game Canvas', actualWidth / 2, actualHeight / 2);
    context.fillText('Press Space to Start Game Loop', actualWidth / 2, actualHeight / 2 + 40);

  }, [context, isReady, actualWidth, actualHeight, isLoopRunning]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        
        if (!isLoopRunning) {
          // Start the game loop
          startGameLoop();
          setGameState(prev => ({ ...prev, isGameRunning: true }));
        } else if (isLoopPaused) {
          // Resume if paused
          resumeGameLoop();
        } else {
          // Pause if running
          pauseGameLoop();
        }
      } else if (event.code === 'Escape') {
        // Stop the game loop
        stopGameLoop();
        setGameState(prev => ({ ...prev, isGameRunning: false }));
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isLoopRunning, isLoopPaused, startGameLoop, stopGameLoop, pauseGameLoop, resumeGameLoop]);

  // Handle mouse/touch input
  const handleCanvasClick = () => {
    if (!isLoopRunning) {
      startGameLoop();
      setGameState(prev => ({ ...prev, isGameRunning: true }));
    } else if (isLoopPaused) {
      resumeGameLoop();
    } else {
      pauseGameLoop();
    }
  };

  return (
    <div className={`game-container ${className}`}>
      <div className="game-info mb-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-lg font-semibold">Score: {gameState.score}</p>
          <p className="text-sm text-gray-600">
            Status: {isLoopRunning ? (isLoopPaused ? 'Paused' : 'Running') : 'Stopped'}
          </p>
          <p className="text-xs text-gray-400">
            Canvas: {actualWidth}x{actualHeight} | Ready: {isReady ? 'Yes' : 'No'}
          </p>
        </div>
        
        <div className="text-right">
          <p className="text-sm font-semibold text-green-600">Performance</p>
          <p className="text-xs text-gray-600">FPS: {stats.fps}</p>
          <p className="text-xs text-gray-600">Frame Time: {stats.frameTime.toFixed(1)}ms</p>
          <p className="text-xs text-gray-600">Total Frames: {stats.totalFrames}</p>
        </div>
      </div>
      
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="border-2 border-gray-300 cursor-pointer bg-sky-200 rounded-lg shadow-lg"
        style={{ 
          imageRendering: 'pixelated' // For crisp pixel art
        }}
      />
      
      <div className="game-controls mt-4 text-center">
        <p className="text-sm text-gray-500">
          Click canvas or press <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Space</kbd> to start/pause
          • <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Esc</kbd> to stop
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Game loop automatically pauses when tab loses focus
        </p>
      </div>
    </div>
  );
};

export default Game; 