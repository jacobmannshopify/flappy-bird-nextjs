'use client';

import { useEffect, useCallback } from 'react';
import { useCanvas } from '@/hooks/useCanvas';
import { useGameLoop } from '@/hooks/useGameLoop';
import { useGameStore, useGameActions, useGameMode, useScore, useHighScore } from '@/lib/gameStore';
import { COLORS } from '@/constants/game';

// TypeScript interfaces for component props
interface GameProps {
  width?: number;
  height?: number;
  className?: string;
}

const Game: React.FC<GameProps> = ({ 
  width = 800, 
  height = 600, 
  className = '' 
}) => {
  // Use Zustand store for state management
  const gameMode = useGameMode();
  const score = useScore();
  const highScore = useHighScore();
  const actions = useGameActions();
  
  // Get the full game state for rendering
  const bird = useGameStore((state) => state.bird);
  const pipes = useGameStore((state) => state.pipes);
  const isGameRunning = useGameStore((state) => state.isGameRunning);
  const isPaused = useGameStore((state) => state.isPaused);
  const gameTime = useGameStore((state) => state.gameTime);

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

    // Update game time
    actions.updateGameTime(totalTime);

    // Update bird physics
    actions.updateBird(deltaTime);

    // Update pipes
    actions.updatePipes(deltaTime);

    // Clear canvas
    context.clearRect(0, 0, actualWidth, actualHeight);

    // Draw background
    context.fillStyle = COLORS.sky;
    context.fillRect(0, 0, actualWidth, actualHeight);

    // Draw pipes
    pipes.forEach((pipe) => {
      context.fillStyle = COLORS.pipe;
      
      // Draw top pipe
      context.fillRect(
        pipe.x, 
        0, 
        pipe.width, 
        pipe.gapY
      );
      
      // Draw bottom pipe
      context.fillRect(
        pipe.x, 
        pipe.gapY + pipe.gapHeight, 
        pipe.width, 
        actualHeight - (pipe.gapY + pipe.gapHeight)
      );
    });

    // Draw bird
    context.save();
    context.translate(bird.x + 12, bird.y + 12); // Center rotation
    context.rotate(bird.rotation);
    context.fillStyle = COLORS.bird;
    context.fillRect(-12, -12, 24, 24);
    context.restore();

    // Draw UI
    context.fillStyle = COLORS.text;
    context.font = 'bold 32px Arial';
    context.textAlign = 'center';
    context.fillText(score.toString(), actualWidth / 2, 50);

    // Draw game status
    context.font = '16px Arial';
    if (gameMode === 'gameOver') {
      context.fillText('Game Over! Press R to restart', actualWidth / 2, actualHeight / 2 + 60);
      context.fillText(`Final Score: ${score}`, actualWidth / 2, actualHeight / 2 + 90);
      if (score === highScore && score > 0) {
        context.fillStyle = COLORS.white;
        context.fillText('NEW HIGH SCORE!', actualWidth / 2, actualHeight / 2 + 120);
      }
    } else if (isPaused) {
      context.fillText('PAUSED - Press Space to resume', actualWidth / 2, actualHeight / 2);
    }

  }, [context, isReady, actualWidth, actualHeight, bird, pipes, score, highScore, gameMode, isPaused, actions]);

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

  // Load high score on component mount
  useEffect(() => {
    actions.loadHighScore();
  }, [actions]);

  // Sync game loop with game state
  useEffect(() => {
    if (isGameRunning && !isLoopRunning) {
      startGameLoop();
    } else if (!isGameRunning && isLoopRunning) {
      stopGameLoop();
    }
  }, [isGameRunning, isLoopRunning, startGameLoop, stopGameLoop]);

  // Sync pause state
  useEffect(() => {
    if (isPaused && isLoopRunning && !isLoopPaused) {
      pauseGameLoop();
    } else if (!isPaused && isLoopRunning && isLoopPaused) {
      resumeGameLoop();
    }
  }, [isPaused, isLoopRunning, isLoopPaused, pauseGameLoop, resumeGameLoop]);

  // Handle game over state
  useEffect(() => {
    if (gameMode === 'gameOver') {
      actions.updateHighScore();
      actions.saveHighScore();
    }
  }, [gameMode, actions]);

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
    context.fillText('Flappy Bird Game', actualWidth / 2, actualHeight / 2 - 40);
    context.font = '18px Arial';
    context.fillText('Press Space to Start Game', actualWidth / 2, actualHeight / 2);
    context.font = '14px Arial';
    context.fillText(`High Score: ${highScore}`, actualWidth / 2, actualHeight / 2 + 40);

  }, [context, isReady, actualWidth, actualHeight, isLoopRunning, highScore]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        
        if (gameMode === 'menu') {
          actions.startGame();
        } else if (gameMode === 'playing') {
          actions.flapBird();
        } else if (gameMode === 'paused') {
          actions.resumeGame();
        } else if (gameMode === 'gameOver') {
          actions.restartGame();
        }
      } else if (event.code === 'KeyP' && gameMode === 'playing') {
        actions.pauseGame();
      } else if (event.code === 'KeyR' && gameMode === 'gameOver') {
        actions.restartGame();
      } else if (event.code === 'Escape') {
        if (gameMode === 'playing' || gameMode === 'paused') {
          actions.stopGame();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameMode, actions]);

  // Handle mouse/touch input
  const handleCanvasClick = () => {
    if (gameMode === 'menu') {
      actions.startGame();
    } else if (gameMode === 'playing') {
      actions.flapBird();
    } else if (gameMode === 'paused') {
      actions.resumeGame();
    } else if (gameMode === 'gameOver') {
      actions.restartGame();
    }
  };

  // Add pipe spawning logic
  useEffect(() => {
    if (!isGameRunning || isPaused) return;

    const spawnPipe = () => {
      const gapY = Math.random() * (actualHeight - 300) + 100; // Random gap position
      actions.addPipe(actualWidth + 50, gapY);
    };

    // Spawn first pipe after 1 second
    const initialPipeTimer = setTimeout(spawnPipe, 1000);
    
    // Then spawn pipes every 2 seconds
    const pipeSpawnInterval = setInterval(spawnPipe, 2000);

    return () => {
      clearTimeout(initialPipeTimer);
      clearInterval(pipeSpawnInterval);
    };
  }, [isGameRunning, isPaused, actualWidth, actions]);

  return (
    <div className={`game-container ${className}`}>
      <div className="game-info mb-4 grid grid-cols-3 gap-4">
        <div>
          <p className="text-lg font-semibold">Score: {score}</p>
          <p className="text-sm text-gray-600">High Score: {highScore}</p>
          <p className="text-xs text-gray-400">
            Mode: {gameMode}
          </p>
        </div>
        
        <div className="text-center">
          <p className="text-sm font-semibold text-blue-600">Game State</p>
          <p className="text-xs text-gray-600">Running: {isGameRunning ? 'Yes' : 'No'}</p>
          <p className="text-xs text-gray-600">Bird Alive: {bird.isAlive ? 'Yes' : 'No'}</p>
          <p className="text-xs text-gray-600">Pipes: {pipes.length}</p>
        </div>
        
        <div className="text-right">
          <p className="text-sm font-semibold text-green-600">Performance</p>
          <p className="text-xs text-gray-600">FPS: {stats.fps}</p>
          <p className="text-xs text-gray-600">Frame Time: {stats.frameTime.toFixed(1)}ms</p>
          <p className="text-xs text-gray-600">Time: {(gameTime / 1000).toFixed(1)}s</p>
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
          <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Space</kbd> to flap/start
          • <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">P</kbd> to pause
          • <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">R</kbd> to restart
          • <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Esc</kbd> to stop
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Click canvas for touch controls • High score saved automatically
        </p>
      </div>
    </div>
  );
};

export default Game; 