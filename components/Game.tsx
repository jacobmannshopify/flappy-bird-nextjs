'use client';

import { useEffect, useRef, useState } from 'react';

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>({
    isGameRunning: false,
    isGameOver: false,
    score: 0
  });

  // Initialize canvas and rendering context
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Failed to get 2D rendering context');
      return;
    }

    // Configure canvas for pixel-perfect rendering
    ctx.imageSmoothingEnabled = false;
    
    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;

    // Clear canvas with sky blue background
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, width, height);

    // Add some initial text
    ctx.fillStyle = '#333';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Flappy Bird Game Canvas', width / 2, height / 2);
    ctx.fillText('Press Space to Start', width / 2, height / 2 + 40);

  }, [width, height]);

  // Handle canvas cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup function for when component unmounts
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    };
  }, []);

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
      </div>
      
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onClick={handleCanvasClick}
        className="border-2 border-gray-300 cursor-pointer bg-sky-200 rounded-lg shadow-lg"
        style={{ 
          maxWidth: '100%', 
          height: 'auto',
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