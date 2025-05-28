'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useCanvas } from '@/hooks/useCanvas';
import { useGameLoop } from '@/hooks/useGameLoop';
import { useGameStore, useGameActions, useGameMode, useScore, useHighScore } from '@/lib/gameStore';
import { spriteManager, SpriteRenderer } from '@/lib/spriteManager';
import { backgroundManager } from '@/lib/backgroundManager';
import { soundManager } from '@/lib/soundManager';
import { COLORS } from '@/constants/game';

// Import UI Components
import StartScreen from '@/components/UI/StartScreen';
import GameOverScreen from '@/components/UI/GameOverScreen';
import PauseMenu from '@/components/UI/PauseMenu';
import GameHUD from '@/components/UI/GameHUD';
import VolumeControl from '@/components/UI/VolumeControl';

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
  
  // Add ref to track previous score for scoring sound
  const previousScoreRef = useRef(score);
  // Add ref to track previous bird alive state for collision sound
  const prevBirdAliveRef = useRef(true);
  
  // Get the full game state for rendering
  const bird = useGameStore((state: any) => state.bird);
  const pipes = useGameStore((state: any) => state.pipes);
  const isGameRunning = useGameStore((state: any) => state.isGameRunning);
  const isPaused = useGameStore((state: any) => state.isPaused);
  const gameTime = useGameStore((state: any) => state.gameTime);
  const stats = useGameStore((state: any) => state.stats);

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

  // Initialize sprites when component mounts
  useEffect(() => {
    spriteManager.initializeGameSprites();
  }, []);

  // Initialize sound manager on first user interaction
  useEffect(() => {
    const initializeSounds = async () => {
      await soundManager.initialize();
    };
    
    // Initialize on any user interaction
    const handleFirstInteraction = () => {
      initializeSounds();
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);
    document.addEventListener('touchstart', handleFirstInteraction);

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, []);

  // Add sound effect when score changes (bird passes pipes)
  useEffect(() => {
    if (score > previousScoreRef.current && isGameRunning) {
      soundManager.playSound('score');
      previousScoreRef.current = score;
    } else {
      previousScoreRef.current = score;
    }
  }, [score, isGameRunning]);

  // Add sound effect when bird dies (collision)
  useEffect(() => {
    if (prevBirdAliveRef.current && !bird.isAlive) {
      soundManager.playSound('collision');
    }
    
    prevBirdAliveRef.current = bird.isAlive;
  }, [bird.isAlive]);

  // Game update callback for the game loop
  const gameUpdate = useCallback((deltaTime: number, totalTime: number) => {
    if (!context || !isReady) return;

    // Update game time
    actions.updateGameTime(totalTime);

    // Update bird physics
    actions.updateBird(deltaTime);

    // Update pipes
    actions.updatePipes(deltaTime);

    // Update background parallax
    backgroundManager.update(deltaTime);
    
    // Set background scroll speed based on game state
    if (isGameRunning && !isPaused) {
      backgroundManager.setScrollSpeed(1);
    } else {
      backgroundManager.setScrollSpeed(0.3); // Slow scroll when paused/menu
    }

    // Update sprite animations
    spriteManager.updateAnimations(totalTime);

    // Clear canvas
    context.clearRect(0, 0, actualWidth, actualHeight);

    // Draw beautiful parallax background layers
    backgroundManager.render(context, actualWidth, actualHeight);

    // Draw ground
    const groundSprite = spriteManager.getSprite('ground');
    if (groundSprite) {
      SpriteRenderer.drawSprite(context, groundSprite, {
        x: 0,
        y: actualHeight - 100,
        width: actualWidth,
        height: 100
      });
    }

    // Draw pipes using sprites with style variety
    pipes.forEach((pipe: any) => {
      const { top: topPipeSprite, bottom: bottomPipeSprite } = spriteManager.getPipeSprites(pipe.style);
      
      if (topPipeSprite && bottomPipeSprite) {
        // Draw top pipe
        SpriteRenderer.drawSprite(context, topPipeSprite, {
          x: pipe.x,
          y: 0,
          width: pipe.width,
          height: pipe.gapY,
          flipY: true // Flip the top pipe
        });
        
        // Draw bottom pipe
        SpriteRenderer.drawSprite(context, bottomPipeSprite, {
          x: pipe.x,
          y: pipe.gapY + pipe.gapHeight,
          width: pipe.width,
          height: actualHeight - (pipe.gapY + pipe.gapHeight) - 100 // Account for ground
        });
      }
    });

    // Determine bird animation state and draw bird with sprite
    let birdSpriteId = 'bird-idle';
    let shouldAnimate = false;

    if (!bird.isAlive) {
      birdSpriteId = 'bird-dead';
    } else if (bird.velocity < -2) {
      birdSpriteId = 'bird-flap';
      shouldAnimate = true;
    } else if (bird.velocity > 2) {
      birdSpriteId = 'bird-fall';
    }

    // Handle bird animation
    if (shouldAnimate) {
      const flapSprite = spriteManager.getAnimatedSprite('bird-flap');
      if (flapSprite && !flapSprite.playing) {
        spriteManager.playAnimation('bird-flap');
      }
    } else {
      spriteManager.stopAnimation('bird-flap');
    }

    // Draw bird with sprite
    const birdSprite = shouldAnimate 
      ? spriteManager.getAnimatedSprite('bird-flap') 
      : spriteManager.getSprite(birdSpriteId);
    
    if (birdSprite) {
      SpriteRenderer.drawSprite(context, birdSprite, {
        x: bird.x,
        y: bird.y,
        width: 24,
        height: 24,
        rotation: bird.rotation,
        alpha: bird.isAlive ? 1 : 0.7
      });
    }

    // Note: UI rendering is now handled by React components, not canvas

  }, [context, isReady, actualWidth, actualHeight, bird, pipes, score, highScore, gameMode, isPaused, isGameRunning, actions]);

  // Use our custom game loop hook
  const {
    start: startGameLoop,
    stop: stopGameLoop,
    pause: pauseGameLoop,
    resume: resumeGameLoop,
    stats: loopStats,
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

    // Clear canvas and render static background
    context.clearRect(0, 0, actualWidth, actualHeight);
    
    // Draw static background
    backgroundManager.render(context, actualWidth, actualHeight);

    // Draw ground
    const groundSprite = spriteManager.getSprite('ground');
    if (groundSprite) {
      SpriteRenderer.drawSprite(context, groundSprite, {
        x: 0,
        y: actualHeight - 100,
        width: actualWidth,
        height: 100
      });
    }

    // Draw idle bird
    const birdSprite = spriteManager.getSprite('bird-idle');
    if (birdSprite) {
      SpriteRenderer.drawSprite(context, birdSprite, {
        x: 100,
        y: actualHeight / 2 - 50,
        width: 24,
        height: 24
      });
    }

  }, [context, isReady, actualWidth, actualHeight, isLoopRunning, highScore]);

  // Enhanced keyboard input with sound effects
  useEffect(() => {
    const handleKeyPress = async (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        
        if (gameMode === 'menu') {
          await soundManager.playSound('button');
          actions.startGame();
        } else if (gameMode === 'playing') {
          await soundManager.playSound('flap');
          actions.flapBird();
        } else if (gameMode === 'paused') {
          await soundManager.playSound('button');
          actions.resumeGame();
        } else if (gameMode === 'gameOver') {
          await soundManager.playSound('button');
          actions.restartGame();
        }
      } else if (event.code === 'KeyP' && gameMode === 'playing') {
        await soundManager.playSound('button');
        actions.pauseGame();
      } else if (event.code === 'KeyR' && gameMode === 'gameOver') {
        await soundManager.playSound('button');
        actions.restartGame();
      } else if (event.code === 'Escape') {
        if (gameMode === 'playing' || gameMode === 'paused') {
          await soundManager.playSound('button');
          actions.stopGame();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameMode, actions]);

  // Enhanced mouse/touch input with sound effects
  const handleCanvasClick = async () => {
    if (gameMode === 'menu') {
      await soundManager.playSound('button');
      actions.startGame();
    } else if (gameMode === 'playing') {
      await soundManager.playSound('flap');
      actions.flapBird();
    } else if (gameMode === 'paused') {
      await soundManager.playSound('button');
      actions.resumeGame();
    } else if (gameMode === 'gameOver') {
      await soundManager.playSound('button');
      actions.restartGame();
    }
  };

  // Add pipe spawning logic
  useEffect(() => {
    if (!isGameRunning || isPaused) return;

    const spawnPipe = () => {
      const gapY = Math.random() * (actualHeight - 400) + 150; // Adjusted for ground
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
    <div className={`game-container relative ${className}`}>
      {/* Volume Control */}
      <VolumeControl position="top-right" />
      
      {/* Main Game Canvas */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="border-2 border-gray-300 cursor-pointer bg-sky-200 rounded-lg shadow-lg"
        style={{ 
          imageRendering: 'pixelated' // For crisp pixel art
        }}
      />
      
      {/* UI Overlays */}
      {gameMode === 'menu' && (
        <StartScreen
          onStartGame={actions.startGame}
          highScore={highScore}
        />
      )}

      {gameMode === 'playing' && (
        <GameHUD
          score={score}
          highScore={highScore}
          gameTime={gameTime}
          fps={loopStats.fps}
          pipesCleared={stats.totalPipesCleared}
        />
      )}

      {gameMode === 'paused' && (
        <PauseMenu
          onResume={actions.resumeGame}
          onMainMenu={actions.stopGame}
          currentScore={score}
          gameTime={gameTime}
        />
      )}

      {gameMode === 'gameOver' && (
        <GameOverScreen
          score={score}
          highScore={highScore}
          isNewHighScore={score === highScore && score > 0}
          onRestart={actions.restartGame}
          onMainMenu={actions.stopGame}
        />
      )}

      {/* Development Info Panel (hidden in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg text-sm">
          <h3 className="font-semibold text-gray-800 mb-2">Development Info</h3>
          <div className="grid grid-cols-2 gap-4 text-gray-600">
            <div>
              <p>Mode: {gameMode}</p>
              <p>Running: {isGameRunning ? 'Yes' : 'No'}</p>
              <p>Bird Alive: {bird.isAlive ? 'Yes' : 'No'}</p>
              <p>Pipes: {pipes.length}</p>
            </div>
            <div>
              <p>FPS: {loopStats.fps}</p>
              <p>Frame Time: {loopStats.frameTime.toFixed(1)}ms</p>
              <p>Time: {(gameTime / 1000).toFixed(1)}s</p>
              <p>Score: {score} / {highScore}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game; 