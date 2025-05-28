import { useEffect, useRef, useCallback, useState } from 'react';
import { TIMING } from '@/constants/game';

interface GameLoopStats {
  fps: number;
  frameTime: number;
  totalFrames: number;
  isRunning: boolean;
}

interface UseGameLoopOptions {
  targetFPS?: number;
  enableStats?: boolean;
  autoStart?: boolean;
}

interface UseGameLoopReturn {
  start: () => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  stats: GameLoopStats;
  isRunning: boolean;
  isPaused: boolean;
}

type GameLoopCallback = (deltaTime: number, totalTime: number) => void;

export const useGameLoop = (
  callback: GameLoopCallback,
  options: UseGameLoopOptions = {}
): UseGameLoopReturn => {
  const {
    targetFPS = TIMING.TARGET_FPS,
    enableStats = true,
    autoStart = false,
  } = options;

  // State management
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [stats, setStats] = useState<GameLoopStats>({
    fps: 0,
    frameTime: 0,
    totalFrames: 0,
    isRunning: false,
  });

  // Refs for loop management
  const animationFrameId = useRef<number | null>(null);
  const lastFrameTime = useRef<number>(0);
  const frameCount = useRef<number>(0);
  const fpsLastUpdate = useRef<number>(0);
  const gameStartTime = useRef<number>(0);
  const pausedTime = useRef<number>(0);
  const totalPausedTime = useRef<number>(0);

  // Target frame time for FPS limiting
  const targetFrameTime = 1000 / targetFPS;

  // Performance monitoring
  const updateStats = useCallback((currentTime: number, deltaTime: number) => {
    if (!enableStats) return;

    frameCount.current++;
    
    // Update FPS every second
    if (currentTime - fpsLastUpdate.current >= 1000) {
      const fps = Math.round((frameCount.current * 1000) / (currentTime - fpsLastUpdate.current));
      
      setStats(prev => ({
        ...prev,
        fps,
        frameTime: deltaTime,
        totalFrames: frameCount.current,
        isRunning: true,
      }));
      
      fpsLastUpdate.current = currentTime;
      frameCount.current = 0;
    }
  }, [enableStats]);

  // Main game loop function
  const gameLoop = useCallback((currentTime: number) => {
    if (!isRunning || isPaused) return;

    // Calculate delta time
    const deltaTime = Math.min(currentTime - lastFrameTime.current, targetFrameTime * 2);
    lastFrameTime.current = currentTime;

    // Skip frame if we're running too fast (FPS limiting)
    if (deltaTime < targetFrameTime * 0.95) {
      animationFrameId.current = requestAnimationFrame(gameLoop);
      return;
    }

    // Calculate total game time (excluding paused time)
    const totalTime = currentTime - gameStartTime.current - totalPausedTime.current;

    // Update performance stats
    updateStats(currentTime, deltaTime);

    // Call the game update callback
    try {
      callback(deltaTime, totalTime);
    } catch (error) {
      console.error('Error in game loop callback:', error);
      stop();
      return;
    }

    // Schedule next frame
    animationFrameId.current = requestAnimationFrame(gameLoop);
  }, [isRunning, isPaused, targetFrameTime, callback, updateStats]);

  // Start the game loop
  const start = useCallback(() => {
    if (isRunning) return;

    const currentTime = performance.now();
    gameStartTime.current = currentTime;
    lastFrameTime.current = currentTime;
    fpsLastUpdate.current = currentTime;
    frameCount.current = 0;
    totalPausedTime.current = 0;

    setIsRunning(true);
    setIsPaused(false);
    
    animationFrameId.current = requestAnimationFrame(gameLoop);
  }, [isRunning, gameLoop]);

  // Stop the game loop
  const stop = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }

    setIsRunning(false);
    setIsPaused(false);
    
    if (enableStats) {
      setStats(prev => ({ ...prev, isRunning: false }));
    }
  }, [enableStats]);

  // Pause the game loop
  const pause = useCallback(() => {
    if (!isRunning || isPaused) return;

    pausedTime.current = performance.now();
    setIsPaused(true);
    
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
  }, [isRunning, isPaused]);

  // Resume the game loop
  const resume = useCallback(() => {
    if (!isRunning || !isPaused) return;

    // Add to total paused time
    totalPausedTime.current += performance.now() - pausedTime.current;
    lastFrameTime.current = performance.now();
    
    setIsPaused(false);
    animationFrameId.current = requestAnimationFrame(gameLoop);
  }, [isRunning, isPaused, gameLoop]);

  // Auto-start if requested
  useEffect(() => {
    if (autoStart) {
      start();
    }

    // Cleanup on unmount
    return () => {
      stop();
    };
  }, [autoStart, start, stop]);

  // Handle visibility change (pause when tab is hidden)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isRunning && !isPaused) {
        pause();
      } else if (!document.hidden && isRunning && isPaused) {
        resume();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isRunning, isPaused, pause, resume]);

  // Handle window focus/blur events
  useEffect(() => {
    const handleFocus = () => {
      if (isRunning && isPaused) {
        resume();
      }
    };

    const handleBlur = () => {
      if (isRunning && !isPaused) {
        pause();
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isRunning, isPaused, pause, resume]);

  return {
    start,
    stop,
    pause,
    resume,
    stats,
    isRunning,
    isPaused,
  };
}; 