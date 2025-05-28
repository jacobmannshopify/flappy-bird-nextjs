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
  
  const animationRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(0);

  // Game constants - Adjusted for better gameplay
  const GRAVITY = 0.6;
  const JUMP_FORCE = -10;        // Reduced from -12 to -10 (less sensitive flapping)
  const PIPE_WIDTH = 60;
  const PIPE_GAP = 180;
  const PIPE_SPEED = 3;          // Increased from 2 to 3 (faster scrolling)
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
  }, [gameStarted, gameOver, bird, pipes]);

  // Render function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create beautiful gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#87CEEB');    // Sky blue at top
    gradient.addColorStop(0.7, '#98E4FF');  // Lighter blue
    gradient.addColorStop(1, '#B8F2FF');    // Very light blue at horizon
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Add some cloud-like shapes for atmosphere
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.ellipse(150, 100, 40, 20, 0, 0, 2 * Math.PI);
    ctx.ellipse(200, 120, 50, 25, 0, 0, 2 * Math.PI);
    ctx.ellipse(500, 80, 35, 18, 0, 0, 2 * Math.PI);
    ctx.ellipse(650, 110, 45, 22, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Draw enhanced ground with gradient
    const groundGradient = ctx.createLinearGradient(0, CANVAS_HEIGHT - 100, 0, CANVAS_HEIGHT);
    groundGradient.addColorStop(0, '#8FBC8F');  // Forest green at top
    groundGradient.addColorStop(0.3, '#6B8E23'); // Olive drab
    groundGradient.addColorStop(1, '#556B2F');   // Dark olive green at bottom
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, CANVAS_HEIGHT - 100, CANVAS_WIDTH, 100);

    // Add grass texture effect on ground
    ctx.fillStyle = '#228B22';
    for (let x = 0; x < CANVAS_WIDTH; x += 20) {
      const grassHeight = Math.random() * 15 + 5;
      ctx.fillRect(x, CANVAS_HEIGHT - 100, 2, -grassHeight);
      ctx.fillRect(x + 5, CANVAS_HEIGHT - 100, 2, -grassHeight * 0.8);
      ctx.fillRect(x + 10, CANVAS_HEIGHT - 100, 2, -grassHeight * 0.6);
      ctx.fillRect(x + 15, CANVAS_HEIGHT - 100, 2, -grassHeight * 0.9);
    }

    // Draw enhanced pipes with 3D effect
    pipes.forEach(pipe => {
      // Pipe shadow for depth
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(pipe.x + 3, 3, PIPE_WIDTH, pipe.gapY);
      ctx.fillRect(pipe.x + 3, pipe.gapY + PIPE_GAP + 3, PIPE_WIDTH, CANVAS_HEIGHT - pipe.gapY - PIPE_GAP - 100);

      // Main pipe gradient
      const pipeGradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
      pipeGradient.addColorStop(0, '#228B22');   // Forest green
      pipeGradient.addColorStop(0.3, '#32CD32'); // Lime green
      pipeGradient.addColorStop(0.7, '#228B22'); // Forest green
      pipeGradient.addColorStop(1, '#006400');   // Dark green
      ctx.fillStyle = pipeGradient;
      
      // Top pipe
      ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.gapY);
      // Bottom pipe
      ctx.fillRect(pipe.x, pipe.gapY + PIPE_GAP, PIPE_WIDTH, CANVAS_HEIGHT - pipe.gapY - PIPE_GAP - 100);

      // Pipe caps/rims for industrial look
      ctx.fillStyle = '#2F4F2F'; // Dark slate gray
      // Top pipe cap
      ctx.fillRect(pipe.x - 5, pipe.gapY - 25, PIPE_WIDTH + 10, 25);
      // Bottom pipe cap  
      ctx.fillRect(pipe.x - 5, pipe.gapY + PIPE_GAP, PIPE_WIDTH + 10, 25);

      // Pipe highlights for 3D effect
      ctx.fillStyle = '#90EE90'; // Light green highlight
      ctx.fillRect(pipe.x + 5, 0, 3, pipe.gapY - 25);
      ctx.fillRect(pipe.x + 5, pipe.gapY + PIPE_GAP + 25, 3, CANVAS_HEIGHT - pipe.gapY - PIPE_GAP - 125);
    });

    // Draw enhanced bird with gradient and shadow
    ctx.save();
    
    // Bird shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(bird.x + 2, bird.y + 2, 20, 20);
    
    // Main bird body gradient
    const birdGradient = ctx.createRadialGradient(
      bird.x + 10, bird.y + 8, 2,  // Inner circle (highlight)
      bird.x + 10, bird.y + 10, 15 // Outer circle
    );
    if (bird.isAlive) {
      birdGradient.addColorStop(0, '#FFD700');  // Bright gold center
      birdGradient.addColorStop(0.7, '#FFA500'); // Orange mid
      birdGradient.addColorStop(1, '#FF8C00');   // Dark orange edge
    } else {
      birdGradient.addColorStop(0, '#FF6B6B');  // Light red center
      birdGradient.addColorStop(0.7, '#FF4444'); // Medium red
      birdGradient.addColorStop(1, '#CC0000');   // Dark red edge
    }
    ctx.fillStyle = birdGradient;
    ctx.fillRect(bird.x, bird.y, 20, 20);

    // Bird eye
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(bird.x + 15, bird.y + 7, 3, 0, 2 * Math.PI);
    ctx.fill();
    
    // Bird eye highlight
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(bird.x + 16, bird.y + 6, 1, 0, 2 * Math.PI);
    ctx.fill();

    // Bird beak
    ctx.fillStyle = '#FF8C00';
    ctx.beginPath();
    ctx.moveTo(bird.x + 20, bird.y + 10);
    ctx.lineTo(bird.x + 26, bird.y + 8);
    ctx.lineTo(bird.x + 26, bird.y + 12);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();

    // Enhanced score display with shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.font = 'bold 28px Arial';
    ctx.fillText(`Score: ${score}`, 22, 42);
    
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 28px Arial';
    ctx.fillText(`Score: ${score}`, 20, 40);

    // Enhanced game state overlays
    if (!gameStarted) {
      // Semi-transparent overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      // Title with glow effect
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Flappy Bird', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#FFF';
      ctx.font = '24px Arial';
      ctx.fillText('Click or Press Space to Start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
      
      // Animated instruction text
      const pulseAlpha = 0.5 + 0.5 * Math.sin(Date.now() * 0.005);
      ctx.fillStyle = `rgba(255, 255, 255, ${pulseAlpha})`;
      ctx.font = '18px Arial';
      ctx.fillText('🎮 Get ready to flap!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
    }

    if (gameOver) {
      // Semi-transparent overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      // Game Over with red glow
      ctx.shadowColor = '#FF0000';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#FF4444';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
      
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#FFF';
      ctx.font = '28px Arial';
      ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
      
      ctx.font = '20px Arial';
      ctx.fillText('Click or Press Space to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
      
      // Add some emoji for fun
      ctx.font = '32px Arial';
      ctx.fillText('💥', CANVAS_WIDTH / 2 - 100, CANVAS_HEIGHT / 2 - 30);
      ctx.fillText('💥', CANVAS_WIDTH / 2 + 100, CANVAS_HEIGHT / 2 - 30);
    }

    ctx.textAlign = 'left';
    ctx.shadowBlur = 0;
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