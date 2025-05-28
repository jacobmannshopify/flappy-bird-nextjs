'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface Bird {
  x: number;
  y: number;
  velocity: number;
  isAlive: boolean;
}

interface Pipe {
  x: number;
  gapY: number;
  passed: boolean;
}

const SimpleGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [bird, setBird] = useState<Bird>({ x: 100, y: 300, velocity: 0, isAlive: true });
  const [pipes, setPipes] = useState<Pipe[]>([]);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  // Game constants
  const GRAVITY = 0.6;
  const JUMP_FORCE = -12;
  const PIPE_WIDTH = 60;
  const PIPE_GAP = 180;
  const PIPE_SPEED = 2;
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;

  // Bird flap function
  const flapBird = useCallback(() => {
    if (gameOver) return;
    
    if (!gameStarted) {
      setGameStarted(true);
    }
    
    setBird(prev => ({
      ...prev,
      velocity: JUMP_FORCE
    }));
  }, [gameOver, gameStarted]);

  // Reset game
  const resetGame = useCallback(() => {
    setBird({ x: 100, y: 300, velocity: 0, isAlive: true });
    setPipes([]);
    setScore(0);
    setGameStarted(false);
    setGameOver(false);
  }, []);

  // Game loop
  const gameLoop = useCallback((currentTime: number) => {
    if (!gameStarted || gameOver) {
      animationRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    const deltaTime = currentTime - lastTimeRef.current;
    lastTimeRef.current = currentTime;

    // Update bird physics
    setBird(prevBird => {
      let newY = prevBird.y + prevBird.velocity;
      let newVelocity = prevBird.velocity + GRAVITY;
      let isAlive = prevBird.isAlive;

      // Ground collision
      if (newY > CANVAS_HEIGHT - 100) {
        newY = CANVAS_HEIGHT - 100;
        isAlive = false;
        setGameOver(true);
      }

      // Ceiling collision
      if (newY < 0) {
        newY = 0;
        newVelocity = 0;
      }

      return {
        ...prevBird,
        y: newY,
        velocity: newVelocity,
        isAlive
      };
    });

    // Update pipes
    setPipes(prevPipes => {
      const updatedPipes = prevPipes
        .map(pipe => {
          const newPipe = { ...pipe, x: pipe.x - PIPE_SPEED };
          
          // Check if bird passed pipe (for scoring)
          if (!newPipe.passed && newPipe.x + PIPE_WIDTH < bird.x) {
            newPipe.passed = true;
            setScore(prev => prev + 1);
          }
          
          return newPipe;
        })
        .filter(pipe => pipe.x > -PIPE_WIDTH);

      // Add new pipe
      const lastPipe = updatedPipes[updatedPipes.length - 1];
      if (!lastPipe || lastPipe.x < CANVAS_WIDTH - 300) {
        updatedPipes.push({
          x: CANVAS_WIDTH,
          gapY: Math.random() * (CANVAS_HEIGHT - PIPE_GAP - 200) + 100,
          passed: false
        });
      }

      return updatedPipes;
    });

    // Check pipe collisions
    for (const pipe of pipes) {
      // Bird collision with pipe
      if (
        bird.x + 20 > pipe.x &&
        bird.x < pipe.x + PIPE_WIDTH &&
        (bird.y < pipe.gapY || bird.y + 20 > pipe.gapY + PIPE_GAP)
      ) {
        setBird(prev => ({ ...prev, isAlive: false }));
        setGameOver(true);
        break;
      }
    }

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [gameStarted, gameOver, bird, pipes, GRAVITY, JUMP_FORCE, PIPE_WIDTH, PIPE_GAP, PIPE_SPEED, CANVAS_WIDTH, CANVAS_HEIGHT]);

  // Render function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw ground
    ctx.fillStyle = '#DEB887';
    ctx.fillRect(0, CANVAS_HEIGHT - 100, CANVAS_WIDTH, 100);

    // Draw pipes
    ctx.fillStyle = '#228B22';
    pipes.forEach(pipe => {
      // Top pipe
      ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.gapY);
      // Bottom pipe
      ctx.fillRect(pipe.x, pipe.gapY + PIPE_GAP, PIPE_WIDTH, CANVAS_HEIGHT - pipe.gapY - PIPE_GAP - 100);
    });

    // Draw bird
    ctx.fillStyle = bird.isAlive ? '#FFD700' : '#FF6B6B';
    ctx.fillRect(bird.x, bird.y, 20, 20);

    // Draw score
    ctx.fillStyle = '#000';
    ctx.font = '24px Arial';
    ctx.fillText(`Score: ${score}`, 20, 40);

    // Draw game states
    if (!gameStarted) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#FFF';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Click or Press Space to Start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }

    if (gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#FFF';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.font = '24px Arial';
      ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
      ctx.fillText('Click or Press Space to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100);
    }

    ctx.textAlign = 'left';
  }, [bird, pipes, score, gameStarted, gameOver]);

  // Start game loop and render
  useEffect(() => {
    const startGameLoop = (timestamp: number) => {
      gameLoop(timestamp);
    };
    
    animationRef.current = requestAnimationFrame(startGameLoop);
    
    const renderLoop = () => {
      render();
      requestAnimationFrame(renderLoop);
    };
    renderLoop();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameLoop, render]);

  // Input handling
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (gameOver) {
          resetGame();
        } else {
          flapBird();
        }
      }
    };

    const handleClick = () => {
      if (gameOver) {
        resetGame();
      } else {
        flapBird();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [gameOver, flapBird, resetGame]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Simple Flappy Bird</h1>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={() => gameOver ? resetGame() : flapBird()}
          className="border-2 border-gray-300 cursor-pointer rounded-lg shadow-lg"
        />
        <div className="mt-4 text-gray-600">
          <p>Click canvas or press SPACE to flap</p>
          <p>Score: {score}</p>
        </div>
      </div>
    </div>
  );
};

export default SimpleGame; 