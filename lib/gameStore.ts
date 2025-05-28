import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Bird, Pipe, GameMode, GameStats } from '@/types/game';
import { DEFAULT_GAME_CONFIG } from '@/constants/game';

// Enhanced game state interface
interface GameState {
  // Game status
  gameMode: GameMode;
  isGameRunning: boolean;
  isGameOver: boolean;
  isPaused: boolean;
  
  // Bird state
  bird: Bird;
  
  // Pipes state
  pipes: Pipe[];
  nextPipeId: number;
  
  // Score and statistics
  score: number;
  highScore: number;
  stats: GameStats;
  
  // Game timing
  gameTime: number;
  
  // Actions
  actions: {
    // Game control actions
    startGame: () => void;
    pauseGame: () => void;
    resumeGame: () => void;
    stopGame: () => void;
    restartGame: () => void;
    
    // Bird actions
    flapBird: () => void;
    updateBird: (deltaTime: number) => void;
    resetBird: () => void;
    
    // Pipe actions
    addPipe: (x: number, gapY: number, style?: 'green' | 'blue' | 'red') => void;
    updatePipes: (deltaTime: number) => void;
    removePipe: (id: string) => void;
    clearPipes: () => void;
    
    // Score actions
    incrementScore: (points?: number) => void;
    updateHighScore: () => void;
    resetScore: () => void;
    
    // Game time
    updateGameTime: (time: number) => void;
    
    // Load/Save high score
    loadHighScore: () => void;
    saveHighScore: () => void;
  };
}

// Initial bird state
const createInitialBird = (): Bird => ({
  x: DEFAULT_GAME_CONFIG.bird.startX,
  y: DEFAULT_GAME_CONFIG.bird.startY,
  velocity: 0,
  rotation: 0,
  isAlive: true,
  flapStrength: DEFAULT_GAME_CONFIG.physics.jumpVelocity,
});

// Initial stats
const createInitialStats = (): GameStats => ({
  currentScore: 0,
  highScore: 0,
  totalPipesCleared: 0,
  playTime: 0,
  attempts: 0,
});

// Create the Zustand store with subscribeWithSelector middleware for advanced features
export const useGameStore = create<GameState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    gameMode: 'menu',
    isGameRunning: false,
    isGameOver: false,
    isPaused: false,
    
    bird: createInitialBird(),
    
    pipes: [],
    nextPipeId: 1,
    
    score: 0,
    highScore: 0,
    stats: createInitialStats(),
    
    gameTime: 0,
    
    // Actions
    actions: {
      // Game control actions
      startGame: () => {
        set((state) => ({
          gameMode: 'playing',
          isGameRunning: true,
          isGameOver: false,
          isPaused: false,
          bird: createInitialBird(),
          pipes: [],
          score: 0,
          gameTime: 0,
          stats: {
            ...state.stats,
            attempts: state.stats.attempts + 1,
          },
        }));
      },

      pauseGame: () => {
        set((state) => ({
          gameMode: 'paused',
          isPaused: true,
        }));
      },

      resumeGame: () => {
        set((state) => ({
          gameMode: 'playing',
          isPaused: false,
        }));
      },

      stopGame: () => {
        set((state) => ({
          gameMode: 'menu',
          isGameRunning: false,
          isPaused: false,
        }));
      },

      restartGame: () => {
        const { startGame } = get().actions;
        startGame();
      },

      // Bird actions
      flapBird: () => {
        set((state) => {
          if (!state.isGameRunning || state.isPaused || !state.bird.isAlive) {
            return state;
          }

          return {
            bird: {
              ...state.bird,
              velocity: state.bird.flapStrength,
              rotation: Math.max(state.bird.rotation - 0.3, -0.5),
            },
          };
        });
      },

      updateBird: (deltaTime: number) => {
        set((state) => {
          if (!state.isGameRunning || state.isPaused || !state.bird.isAlive) {
            return state;
          }

          const gravity = DEFAULT_GAME_CONFIG.physics.gravity * (deltaTime / 16.67); // Normalize to 60fps
          const terminalVelocity = DEFAULT_GAME_CONFIG.physics.terminalVelocity;
          
          let newVelocity = state.bird.velocity + gravity;
          if (newVelocity > terminalVelocity) {
            newVelocity = terminalVelocity;
          }

          const newY = state.bird.y + newVelocity * (deltaTime / 16.67);
          
          // Calculate rotation based on velocity
          let newRotation = state.bird.rotation;
          if (newVelocity > 0) {
            newRotation = Math.min(newRotation + 0.05, 1.5);
          }

          // Check ground collision
          if (newY > DEFAULT_GAME_CONFIG.canvas.height - DEFAULT_GAME_CONFIG.bird.size) {
            return {
              bird: {
                ...state.bird,
                y: DEFAULT_GAME_CONFIG.canvas.height - DEFAULT_GAME_CONFIG.bird.size,
                velocity: 0,
                isAlive: false,
              },
              gameMode: 'gameOver' as GameMode,
              isGameOver: true,
              isGameRunning: false,
            };
          }

          // Check ceiling collision
          if (newY < 0) {
            return {
              bird: {
                ...state.bird,
                y: 0,
                velocity: 0,
              },
            };
          }

          return {
            bird: {
              ...state.bird,
              y: newY,
              velocity: newVelocity,
              rotation: newRotation,
            },
          };
        });
      },

      resetBird: () => {
        set({ bird: createInitialBird() });
      },

      // Pipe actions
      addPipe: (x: number, gapY: number, style?: 'green' | 'blue' | 'red') => {
        const newPipe: Pipe = {
          id: `pipe-${Date.now()}-${Math.random()}`,
          x,
          y: 0,
          width: 60,
          height: DEFAULT_GAME_CONFIG.canvas.height,
          gapY,
          gapHeight: 180,
          passed: false,
          style: style || (['green', 'blue', 'red'] as const)[Math.floor(Math.random() * 3)] // Random style if not specified
        };

        set(state => ({
          pipes: [...state.pipes, newPipe]
        }));
      },

      updatePipes: (deltaTime: number) => {
        set((state) => {
          if (!state.isGameRunning || state.isPaused) {
            return state;
          }

          const pipeSpeed = DEFAULT_GAME_CONFIG.physics.pipeSpeed * (deltaTime / 16.67);
          let scoreToAdd = 0;

          const updatedPipes = state.pipes
            .map((pipe) => {
              const newX = pipe.x - pipeSpeed;
              
              // Check if bird passed through pipe
              if (!pipe.passed && newX + pipe.width < state.bird.x) {
                scoreToAdd += 1;
                return { ...pipe, x: newX, passed: true };
              }
              
              return { ...pipe, x: newX };
            })
            .filter((pipe) => pipe.x + pipe.width > -50); // Remove pipes that are off-screen

          return {
            pipes: updatedPipes,
            score: state.score + scoreToAdd,
            stats: {
              ...state.stats,
              currentScore: state.score + scoreToAdd,
              totalPipesCleared: state.stats.totalPipesCleared + scoreToAdd,
            },
          };
        });
      },

      removePipe: (id: string) => {
        set((state) => ({
          pipes: state.pipes.filter((pipe) => pipe.id !== id),
        }));
      },

      clearPipes: () => {
        set({ pipes: [] });
      },

      // Score actions
      incrementScore: (points = 1) => {
        set((state) => ({
          score: state.score + points,
          stats: {
            ...state.stats,
            currentScore: state.score + points,
          },
        }));
      },

      updateHighScore: () => {
        set((state) => {
          const newHighScore = Math.max(state.score, state.highScore);
          return {
            highScore: newHighScore,
            stats: {
              ...state.stats,
              highScore: newHighScore,
            },
          };
        });
      },

      resetScore: () => {
        set((state) => ({
          score: 0,
          stats: {
            ...state.stats,
            currentScore: 0,
          },
        }));
      },

      // Game time
      updateGameTime: (time: number) => {
        set((state) => ({
          gameTime: time,
          stats: {
            ...state.stats,
            playTime: time,
          },
        }));
      },

      // Load/Save high score from localStorage
      loadHighScore: () => {
        if (typeof window !== 'undefined') {
          const savedHighScore = localStorage.getItem('flappy-bird-high-score');
          if (savedHighScore) {
            const highScore = parseInt(savedHighScore, 10);
            set((state) => ({
              highScore,
              stats: {
                ...state.stats,
                highScore,
              },
            }));
          }
        }
      },

      saveHighScore: () => {
        const { highScore } = get();
        if (typeof window !== 'undefined') {
          localStorage.setItem('flappy-bird-high-score', highScore.toString());
        }
      },
    },
  }))
);

// Selector hooks for specific parts of state (for performance optimization)
export const useBird = () => useGameStore((state) => state.bird);
export const usePipes = () => useGameStore((state) => state.pipes);
export const useScore = () => useGameStore((state) => state.score);
export const useHighScore = () => useGameStore((state) => state.highScore);
export const useGameMode = () => useGameStore((state) => state.gameMode);
export const useGameActions = () => useGameStore((state) => state.actions); 