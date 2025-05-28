'use client';

import { useEffect, useState } from 'react';
import { useCanvas } from '@/hooks/useCanvas';
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

  // Initialize canvas content when ready
  useEffect(() => {
    if (!context || !isReady) return;

    // Clear canvas with sky blue background
    context.fillStyle = COLORS.sky;
    context.fillRect(0, 0, actualWidth, actualHeight);

    // Add some initial text
    context.fillStyle = COLORS.text;
    context.font = '24px Arial';
    context.textAlign = 'center';
    context.fillText('Flappy Bird Game Canvas', actualWidth / 2, actualHeight / 2);
    context.fillText('Press Space to Start', actualWidth / 2, actualHeight / 2 + 40);

  }, [context, isReady, actualWidth, actualHeight]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        if (!gameState.isGameRunning && !gameState.isGameOver) {
          setGameState(prev => ({ ...prev, isGameRunning: true }));
          console.log('Game started!');
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState]);

  // Handle mouse/touch input
  const handleCanvasClick = () => {
    if (!gameState.isGameRunning && !gameState.isGameOver) {
      setGameState(prev => ({ ...prev, isGameRunning: true }));
      console.log('Game started!');
    }
  };

  return (
    <div className={`game-container ${className}`}>
      <div className="game-info mb-4">
        <p className="text-lg font-semibold">Score: {gameState.score}</p>
        <p className="text-sm text-gray-600">
          Status: {gameState.isGameRunning ? 'Playing' : gameState.isGameOver ? 'Game Over' : 'Ready'}
        </p>
        <p className="text-xs text-gray-400">
          Canvas: {actualWidth}x{actualHeight} | Ready: {isReady ? 'Yes' : 'No'}
        </p>
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
          Click canvas or press Space to start • Mouse click or Space to flap
        </p>
      </div>
    </div>
  );
};

export default Game; 