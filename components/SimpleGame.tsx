'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import PerformanceMonitor from './PerformanceMonitor';
import { DayNightCycle } from '../lib/dayNightCycle';

interface Bird {
  x: number;
  y: number;
  velocity: number;
  isAlive: boolean;
  rotation: number;  // Add rotation for death animation
}

interface Pipe {
  x: number;
  gapY: number;
  passed: boolean;
}

interface ScorePopup {
  x: number;
  y: number;
  opacity: number;
  scale: number;
  startTime: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

const SimpleGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [bird, setBird] = useState<Bird>({ x: 100, y: 300, velocity: 0, isAlive: true, rotation: 0 });
  const [pipes, setPipes] = useState<Pipe[]>([]);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [scorePopups, setScorePopups] = useState<ScorePopup[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [touchFeedback, setTouchFeedback] = useState<{x: number, y: number, opacity: number} | null>(null);
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [musicVolume, setMusicVolume] = useState(0.7);
  
  // Performance and quality settings
  const [qualitySettings, setQualitySettings] = useState({
    particleMultiplier: 1.0,
    enableShadows: true,
    enableGradients: true,
    maxParticles: 50,
    adaptiveQuality: true
  });
  
  const animationRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const deathAnimationStartRef = useRef<number | null>(null);
  const touchFeedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fpsHistoryRef = useRef<number[]>([]);
  const lastFpsCheckRef = useRef<number>(Date.now());
  const groundOffsetRef = useRef<number>(0);
  const cloudOffsetRef = useRef<number>(0);
  const dayNightCycleRef = useRef<DayNightCycle>(new DayNightCycle());
  const proceduralMusicRef = useRef<any>(null);
  const lastTimeOfDayRef = useRef<string>('dawn');
  const musicInitializedRef = useRef<boolean>(false);
  
  // Pre-calculate grass positions to avoid expensive random generation every frame
  const grassPositions = useRef<{x: number, heights: number[]}[]>([]);
  
  // Detect mobile device
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  // Initialize grass positions once
  useEffect(() => {
    const grass = [];
    for (let x = 0; x < CANVAS_WIDTH; x += 20) {
      grass.push({
        x,
        heights: [
          Math.random() * 15 + 5,
          Math.random() * 15 + 5 * 0.8,
          Math.random() * 15 + 5 * 0.6,
          Math.random() * 15 + 5 * 0.9
        ]
      });
    }
    grassPositions.current = grass;
  }, []);

  // Game constants - adjusted to match previous version's feel
  const GRAVITY = 0.3;                // Reduced from 0.6 to match original
  const JUMP_FORCE = -4.5;            // Reduced from -8 to match original sensitivity
  const BIRD_SIZE = 30;
  const PIPE_WIDTH = 80;
  const PIPE_SPEED = 2.5;             // Kept the same as it felt good
  const PIPE_GAP = 180;
  const GROUND_HEIGHT = 120;
  
  // Mobile-responsive canvas dimensions
  const getCanvasDimensions = () => {
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        const maxWidth = Math.min(window.innerWidth - 40, 600);
        const maxHeight = Math.min(window.innerHeight - 200, 450);
        return { width: maxWidth, height: maxHeight };
      }
    }
    return { width: 800, height: 600 };
  };

  const [canvasDimensions, setCanvasDimensions] = useState(getCanvasDimensions());
  const CANVAS_WIDTH = canvasDimensions.width;
  const CANVAS_HEIGHT = canvasDimensions.height;

  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      setCanvasDimensions(getCanvasDimensions());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize audio context
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Simple sound generator functions
  const playFlapSound = useCallback(() => {
    const audioContext = initAudio();
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Flap sound: quick chirp with frequency sweep
    oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  }, [initAudio]);

  const playScoreSound = useCallback(() => {
    const audioContext = initAudio();
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Score sound: pleasant ascending notes
    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  }, [initAudio]);

  const playCollisionSound = useCallback(() => {
    const audioContext = initAudio();
    if (!audioContext) return;

    // Create noise for collision effect
    const bufferSize = audioContext.sampleRate * 0.3; // 0.3 seconds
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Generate noise with decreasing amplitude
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize) * 0.5;
    }
    
    const source = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    
    source.buffer = buffer;
    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Low-pass filter for muffled crash sound
    filter.type = 'lowpass';
    filter.frequency.value = 300;
    
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    source.start(audioContext.currentTime);
  }, [initAudio]);

  // Animation helper functions
  const createScorePopup = useCallback((x: number, y: number) => {
    const popup: ScorePopup = {
      x,
      y,
      opacity: 1,
      scale: 1,
      startTime: Date.now()
    };
    setScorePopups(prev => [...prev, popup]);
  }, []);

  // Haptic feedback for mobile devices
  const triggerHapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      switch (type) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(25);
          break;
        case 'heavy':
          navigator.vibrate([50, 50, 50]);
          break;
      }
    }
  }, []);

  // Adaptive quality management
  const updateQualitySettings = useCallback((currentFps: number) => {
    if (!qualitySettings.adaptiveQuality) return;

    // Add FPS to history
    fpsHistoryRef.current.push(currentFps);
    if (fpsHistoryRef.current.length > 30) { // Keep last 30 FPS readings
      fpsHistoryRef.current.shift();
    }

    // Only adjust quality every 3 seconds to avoid constant changes
    const now = Date.now();
    if (now - lastFpsCheckRef.current < 3000) return;
    lastFpsCheckRef.current = now;

    if (fpsHistoryRef.current.length < 10) return; // Need some history

    const avgFps = fpsHistoryRef.current.reduce((a, b) => a + b, 0) / fpsHistoryRef.current.length;

    setQualitySettings(prev => {
      const newSettings = { ...prev };
      
      // Poor performance: reduce quality
      if (avgFps < 45) {
        newSettings.particleMultiplier = Math.max(0.3, prev.particleMultiplier - 0.1);
        newSettings.maxParticles = Math.max(10, prev.maxParticles - 5);
        newSettings.enableShadows = avgFps > 35; // Disable shadows if very poor
        newSettings.enableGradients = avgFps > 30; // Disable gradients if extremely poor
      }
      // Good performance: increase quality back up
      else if (avgFps > 55) {
        newSettings.particleMultiplier = Math.min(1.0, prev.particleMultiplier + 0.05);
        newSettings.maxParticles = Math.min(50, prev.maxParticles + 2);
        newSettings.enableShadows = true;
        newSettings.enableGradients = true;
      }

      // Only update if there's actually a change
      return JSON.stringify(newSettings) !== JSON.stringify(prev) ? newSettings : prev;
    });
  }, [qualitySettings.adaptiveQuality]);

  // Enhanced particle creation with quality settings
  const createParticles = useCallback((x: number, y: number, count: number = 8) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];
    const newParticles: Particle[] = [];
    
    // Apply quality settings to particle count
    let adjustedCount = count * qualitySettings.particleMultiplier;
    if (isMobile) adjustedCount *= 0.6; // Additional mobile reduction
    adjustedCount = Math.floor(Math.min(adjustedCount, qualitySettings.maxParticles - particles.length));
    
    for (let i = 0; i < adjustedCount; i++) {
      const angle = (Math.PI * 2 * i) / adjustedCount + Math.random() * 0.5;
      const speed = Math.random() * 3 + 2;
      
      newParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1, // Slight upward bias
        life: 1,
        maxLife: Math.random() * 60 + 30, // 30-90 frames
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 4 + 2
      });
    }
    
    setParticles(prev => [...prev, ...newParticles]);
  }, [isMobile, qualitySettings.particleMultiplier, qualitySettings.maxParticles, particles.length]);

  // Touch feedback animation
  const createTouchFeedback = useCallback((x: number, y: number) => {
    if (touchFeedbackTimeoutRef.current) {
      clearTimeout(touchFeedbackTimeoutRef.current);
    }

    setTouchFeedback({ x, y, opacity: 1 });
    
    touchFeedbackTimeoutRef.current = setTimeout(() => {
      setTouchFeedback(null);
    }, 300);
  }, []);

  // Performance tracking for FPS monitoring
  const trackPerformance = useCallback((deltaTime: number) => {
    const fps = 1000 / deltaTime;
    updateQualitySettings(fps);
  }, [updateQualitySettings]);

  const updateAnimations = useCallback((currentTime: number) => {
    // Consolidate all animation updates into a single state update to reduce re-renders
    let updatedParticles = particles;
    let updatedPopups = scorePopups;
    
    // Update touch feedback animation
    if (touchFeedback) {
      const elapsed = Date.now() - (currentTime - 300); // Rough timing
      const progress = Math.min(elapsed / 300, 1);
      const newOpacity = Math.max(0, 1 - progress);
      
      if (newOpacity > 0) {
        setTouchFeedback(prev => prev ? { ...prev, opacity: newOpacity } : null);
      }
    }

    // Update score popups (only if there are any)
    if (scorePopups.length > 0) {
      updatedPopups = scorePopups
        .map(popup => {
          const elapsed = currentTime - popup.startTime;
          const progress = elapsed / 1500; // 1.5 seconds
          
          return {
            ...popup,
            y: popup.y - 1, // Float upward
            opacity: Math.max(0, 1 - progress),
            scale: 1 + progress * 0.5 // Slight scale increase
          };
        })
        .filter(popup => popup.opacity > 0);
      
      if (updatedPopups.length !== scorePopups.length) {
        setScorePopups(updatedPopups);
      } else if (updatedPopups.length > 0) {
        setScorePopups(updatedPopups);
      }
    }

    // Update particles (only if there are any)
    if (particles.length > 0) {
      updatedParticles = particles
        .map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          vy: particle.vy + 0.1, // Gravity
          life: particle.life - (1 / particle.maxLife)
        }))
        .filter(particle => particle.life > 0);
      
      if (updatedParticles.length !== particles.length) {
        setParticles(updatedParticles);
      } else if (updatedParticles.length > 0) {
        setParticles(updatedParticles);
      }
    }

    // Update death animation (only when dying)
    if (!bird.isAlive && deathAnimationStartRef.current) {
      const deathProgress = (currentTime - deathAnimationStartRef.current) / 2000; // 2 seconds
      if (deathProgress < 1) {
        setBird(prev => ({
          ...prev,
          rotation: deathProgress * Math.PI * 3 // 3 full rotations
        }));
      }
    }
  }, [bird.isAlive, particles, scorePopups, touchFeedback]);

  const startDeathAnimation = useCallback(() => {
    if (!deathAnimationStartRef.current) {
      deathAnimationStartRef.current = Date.now();
    }
  }, []);

  // Bird flap function
  const flapBird = useCallback(() => {
    if (gameOver) return;
    
    if (!gameStarted) {
      setGameStarted(true);
    }
    
    // Play flap sound
    playFlapSound();
    
    // Mobile haptic feedback
    if (isMobile) {
      triggerHapticFeedback('light');
    }
    
    setBird(prev => ({
      ...prev,
      velocity: JUMP_FORCE
    }));
  }, [gameOver, gameStarted, playFlapSound, isMobile, triggerHapticFeedback]);

  // Reset game
  const resetGame = useCallback(() => {
    setBird({ x: 100, y: 300, velocity: 0, isAlive: true, rotation: 0 });
    setPipes([]);
    setScore(0);
    setGameStarted(false);
    setGameOver(false);
    setScorePopups([]);
    setParticles([]);
    deathAnimationStartRef.current = null; // Reset death animation
  }, []);

  // Game loop with integrated rendering
  const gameLoop = useCallback((currentTime: number) => {
    const deltaTime = currentTime - lastTimeRef.current;
    lastTimeRef.current = currentTime;

    // Track performance
    if (deltaTime > 0) {
      trackPerformance(deltaTime);
    }

    // Update animations only when game is running
    if (gameStarted && !gameOver) {
      updateAnimations(currentTime);

      // Update bird physics
      setBird(prevBird => {
        let newY = prevBird.y + prevBird.velocity;
        let newVelocity = prevBird.velocity + GRAVITY;
        let isAlive = prevBird.isAlive;
        let rotation = prevBird.rotation;

        // Ground collision
        if (newY > CANVAS_HEIGHT - 100) {
          newY = CANVAS_HEIGHT - 100;
          if (isAlive) {
            isAlive = false;
            setGameOver(true);
            // Play collision sound for ground hit
            playCollisionSound();
            // Mobile haptic feedback for collision
            if (isMobile) {
              triggerHapticFeedback('heavy');
            }
            // Start death animation and create particles
            startDeathAnimation();
            createParticles(prevBird.x + 10, prevBird.y + 10, 12);
          }
        }

        // Ceiling collision
        if (newY < 0) {
          newY = 0;
          newVelocity = 0;
        }

        // Update rotation based on velocity when alive
        if (isAlive) {
          rotation = Math.max(-0.5, Math.min(0.5, newVelocity * 0.1));
        }

        return {
          ...prevBird,
          y: newY,
          velocity: newVelocity,
          isAlive,
          rotation
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
              setScore(prev => {
                // Play score sound when scoring
                playScoreSound();
                // Create score popup animation
                createScorePopup(newPipe.x + PIPE_WIDTH / 2, bird.y);
                // Create celebration particles
                createParticles(newPipe.x + PIPE_WIDTH / 2, bird.y, 6);
                return prev + 1;
              });
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
          if (bird.isAlive) {
            setBird(prev => ({ ...prev, isAlive: false }));
            setGameOver(true);
            // Play collision sound
            playCollisionSound();
            // Mobile haptic feedback for collision
            if (isMobile) {
              triggerHapticFeedback('heavy');
            }
            // Start death animation and create particles
            startDeathAnimation();
            createParticles(bird.x + 10, bird.y + 10, 15);
          }
          break;
        }
      }
    } else if (!bird.isAlive && deathAnimationStartRef.current) {
      // Update death animation even when game is over
      updateAnimations(currentTime);
    }

    // Render everything in the same loop
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Update ground offset for scrolling effect
        groundOffsetRef.current = (groundOffsetRef.current + PIPE_SPEED) % CANVAS_WIDTH;
        
        // Update cloud offset for parallax effect (slower than ground)
        cloudOffsetRef.current += PIPE_SPEED * 0.3;

        // Clear canvas
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw dynamic sky with day/night cycle
        dayNightCycleRef.current.drawSky(
          ctx, 
          CANVAS_WIDTH, 
          CANVAS_HEIGHT, 
          score, 
          GROUND_HEIGHT
        );

        // Draw clouds with parallax effect
        dayNightCycleRef.current.drawClouds(
          ctx, 
          CANVAS_WIDTH, 
          CANVAS_HEIGHT, 
          score, 
          cloudOffsetRef.current
        );

        // Draw enhanced ground with gradient
        const groundGradient = ctx.createLinearGradient(0, CANVAS_HEIGHT - 100, 0, CANVAS_HEIGHT);
        groundGradient.addColorStop(0, '#8FBC8F');  // Forest green at top
        groundGradient.addColorStop(0.3, '#6B8E23'); // Olive drab
        groundGradient.addColorStop(1, '#556B2F');   // Dark olive green at bottom
        ctx.fillStyle = groundGradient;
        ctx.fillRect(0, CANVAS_HEIGHT - 100, CANVAS_WIDTH, 100);

        // Add grass texture effect on ground
        ctx.fillStyle = '#228B22';
        grassPositions.current.forEach(grass => {
          ctx.fillRect(grass.x, CANVAS_HEIGHT - 100, 2, -grass.heights[0]);
          ctx.fillRect(grass.x + 5, CANVAS_HEIGHT - 100, 2, -grass.heights[1]);
          ctx.fillRect(grass.x + 10, CANVAS_HEIGHT - 100, 2, -grass.heights[2]);
          ctx.fillRect(grass.x + 15, CANVAS_HEIGHT - 100, 2, -grass.heights[3]);
        });

        // Draw enhanced pipes with 3D effect
        pipes.forEach(pipe => {
          // Pipe shadow for depth (only if quality allows)
          if (qualitySettings.enableShadows) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillRect(pipe.x + 3, 3, PIPE_WIDTH, pipe.gapY);
            ctx.fillRect(pipe.x + 3, pipe.gapY + PIPE_GAP + 3, PIPE_WIDTH, CANVAS_HEIGHT - pipe.gapY - PIPE_GAP - 100);
          }

          // Main pipe gradient (or solid color for performance)
          if (qualitySettings.enableGradients) {
            const pipeGradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
            pipeGradient.addColorStop(0, '#228B22');   // Forest green
            pipeGradient.addColorStop(0.3, '#32CD32'); // Lime green
            pipeGradient.addColorStop(0.7, '#228B22'); // Forest green
            pipeGradient.addColorStop(1, '#006400');   // Dark green
            ctx.fillStyle = pipeGradient;
          } else {
            ctx.fillStyle = '#228B22'; // Solid color for performance
          }
          
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
        
        // Bird shadow (only if quality allows)
        if (qualitySettings.enableShadows) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.fillRect(bird.x + 2, bird.y + 2, 20, 20);
        }
        
        // Apply rotation for bird
        ctx.translate(bird.x + 10, bird.y + 10);
        ctx.rotate(bird.rotation);
        ctx.translate(-10, -10);
        
        // Main bird body gradient (or solid color for performance)
        if (qualitySettings.enableGradients) {
          const birdGradient = ctx.createRadialGradient(
            10, 8, 2,  // Inner circle (highlight)
            10, 10, 15 // Outer circle
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
        } else {
          // Solid colors for performance
          ctx.fillStyle = bird.isAlive ? '#FFA500' : '#FF4444';
        }
        ctx.fillRect(0, 0, 20, 20);

        // Bird eye
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(15, 7, 3, 0, 2 * Math.PI);
        ctx.fill();
        
        // Bird eye highlight
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(16, 6, 1, 0, 2 * Math.PI);
        ctx.fill();

        // Bird beak
        ctx.fillStyle = '#FF8C00';
        ctx.beginPath();
        ctx.moveTo(20, 10);
        ctx.lineTo(26, 8);
        ctx.lineTo(26, 12);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();

        // Render particles
        particles.forEach(particle => {
          ctx.save();
          ctx.globalAlpha = particle.life;
          ctx.fillStyle = particle.color;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, 2 * Math.PI);
          ctx.fill();
          ctx.restore();
        });

        // Render score popups
        scorePopups.forEach(popup => {
          ctx.save();
          ctx.globalAlpha = popup.opacity;
          ctx.font = `bold ${Math.floor(24 * popup.scale)}px Arial`;
          ctx.fillStyle = '#FFF';
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 2;
          ctx.textAlign = 'center';
          
          // Draw text with outline
          ctx.strokeText('+1', popup.x, popup.y);
          ctx.fillText('+1', popup.x, popup.y);
          
          ctx.restore();
        });

        // Render touch feedback for mobile
        if (touchFeedback && isMobile) {
          ctx.save();
          ctx.globalAlpha = touchFeedback.opacity * 0.6;
          ctx.strokeStyle = '#FFD700';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(touchFeedback.x, touchFeedback.y, 30 * (1 - touchFeedback.opacity), 0, 2 * Math.PI);
          ctx.stroke();
          
          ctx.globalAlpha = touchFeedback.opacity * 0.3;
          ctx.beginPath();
          ctx.arc(touchFeedback.x, touchFeedback.y, 50 * (1 - touchFeedback.opacity), 0, 2 * Math.PI);
          ctx.stroke();
          
          ctx.restore();
        }

        // Enhanced score display with shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.font = 'bold 28px Arial';
        ctx.fillText(`Score: ${score}`, 22, 42);
        
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 28px Arial';
        ctx.fillText(`Score: ${score}`, 20, 40);

        // Day/Night Cycle indicator (only when game is running)
        if (gameStarted && !gameOver) {
          const timeInfo = dayNightCycleRef.current.getCurrentTimeInfo(score);
          
          // Time display background
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.font = 'bold 18px Arial';
          ctx.fillText(`${timeInfo.name === 'Dawn' ? '🌅' : timeInfo.name === 'Day' ? '☀️' : timeInfo.name === 'Sunset' ? '🌇' : '🌙'} ${timeInfo.name}`, 22, 72);
          
          ctx.fillStyle = '#FFF';
          ctx.font = 'bold 18px Arial';
          ctx.fillText(`${timeInfo.name === 'Dawn' ? '🌅' : timeInfo.name === 'Day' ? '☀️' : timeInfo.name === 'Sunset' ? '🌇' : '🌙'} ${timeInfo.name}`, 20, 70);
          
          // Points until next phase (if applicable)
          if (timeInfo.pointsUntilNext > 0) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.font = '12px Arial';
            ctx.fillText(`${timeInfo.pointsUntilNext} pts to next`, 22, 92);
            
            ctx.fillStyle = '#FFF';
            ctx.font = '12px Arial';
            ctx.fillText(`${timeInfo.pointsUntilNext} pts to next`, 20, 90);
          }
        }

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
      }
    }

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [gameStarted, gameOver, bird, pipes, playScoreSound, playCollisionSound, updateAnimations, startDeathAnimation, createParticles, createScorePopup, score, particles, scorePopups, touchFeedback, isMobile]);

  // Start game loop and render
  useEffect(() => {
    const startGameLoop = (timestamp: number) => {
      gameLoop(timestamp);
    };
    
    animationRef.current = requestAnimationFrame(startGameLoop);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameLoop]);

  // Input handling
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Initialize audio on first interaction
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
      
      if (e.code === 'Space') {
        e.preventDefault();
        if (gameOver) {
          resetGame();
        } else {
          flapBird();
        }
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        toggleMusic();
      }
    };

    const handleClick = () => {
      // Initialize audio on first interaction
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
      
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

  // Initialize procedural music only on client side with proper error handling
  const initializeMusic = useCallback(async () => {
    if (typeof window === 'undefined' || musicInitializedRef.current) return;
    
    try {
      const { ProceduralMusic } = await import('../lib/proceduralMusic');
      proceduralMusicRef.current = new ProceduralMusic();
      musicInitializedRef.current = true;
    } catch (error) {
      console.warn('Failed to initialize music system:', error);
    }
  }, []);

  // Get music instance safely
  const getMusic = useCallback(() => {
    return proceduralMusicRef.current;
  }, []);

  // Music management functions with safe fallbacks
  const startMusic = useCallback(async () => {
    if (!musicEnabled) return;
    
    if (!musicInitializedRef.current) {
      await initializeMusic();
    }
    
    const music = getMusic();
    if (music && !music.isActive()) {
      music.start();
      music.fadeIn(1);
    }
  }, [musicEnabled, initializeMusic, getMusic]);

  const stopMusic = useCallback(() => {
    const music = getMusic();
    if (music && music.isActive()) {
      music.fadeOut(1);
    }
  }, [getMusic]);

  const updateMusicVolume = useCallback(async (volume: number) => {
    if (!musicInitializedRef.current) {
      await initializeMusic();
    }
    
    const music = getMusic();
    if (music) {
      music.setVolume(volume);
    }
    setMusicVolume(volume);
  }, [initializeMusic, getMusic]);

  const toggleMusic = useCallback(() => {
    const newMusicEnabled = !musicEnabled;
    setMusicEnabled(newMusicEnabled);
    
    if (newMusicEnabled && gameStarted && !gameOver) {
      startMusic();
    } else {
      stopMusic();
    }
  }, [musicEnabled, gameStarted, gameOver, startMusic, stopMusic]);

  // Update music based on day/night cycle
  useEffect(() => {
    if (gameStarted && typeof window !== 'undefined') {
      const timeInfo = dayNightCycleRef.current.getCurrentTimeInfo(score);
      const currentTimeOfDay = timeInfo.name.toLowerCase();
      
      if (currentTimeOfDay !== lastTimeOfDayRef.current) {
        const music = getMusic();
        if (music) {
          music.setTimeOfDay(currentTimeOfDay);
        }
        lastTimeOfDayRef.current = currentTimeOfDay;
      }
    }
  }, [score, gameStarted, getMusic]);

  // Music state management
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (gameStarted && !gameOver && musicEnabled) {
        startMusic();
      } else {
        stopMusic();
      }
    }
  }, [gameStarted, gameOver, musicEnabled, startMusic, stopMusic]);

  // Update music volume
  useEffect(() => {
    if (typeof window !== 'undefined' && musicEnabled) {
      updateMusicVolume(musicVolume);
    }
  }, [musicVolume, musicEnabled, updateMusicVolume]);

  // Cleanup music on unmount
  useEffect(() => {
    return () => {
      const music = proceduralMusicRef.current;
      if (music) {
        music.stop();
      }
    };
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Simple Flappy Bird</h1>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={() => {
            // Initialize audio on first interaction
            if (audioContextRef.current?.state === 'suspended') {
              audioContextRef.current.resume();
            }
            
            if (gameOver) {
              resetGame();
            } else {
              flapBird();
            }
          }}
          onTouchStart={(e) => {
            e.preventDefault(); // Prevent scrolling on mobile
            
            // Initialize audio on first interaction
            if (audioContextRef.current?.state === 'suspended') {
              audioContextRef.current.resume();
            }
            
            // Get touch position relative to canvas
            const rect = canvasRef.current?.getBoundingClientRect();
            if (rect && e.touches[0]) {
              const touch = e.touches[0];
              const x = (touch.clientX - rect.left) * (CANVAS_WIDTH / rect.width);
              const y = (touch.clientY - rect.top) * (CANVAS_HEIGHT / rect.height);
              
              // Create touch feedback
              createTouchFeedback(x, y);
            }
            
            if (gameOver) {
              resetGame();
            } else {
              flapBird();
            }
          }}
          className="border-2 border-gray-300 cursor-pointer rounded-lg shadow-lg touch-none"
        />
        <div className="mt-4 text-gray-600">
          <p>Click canvas or press SPACE to flap</p>
          <p>Press M to toggle music</p>
          <p>Score: {score}</p>
          
          <div className="flex flex-wrap gap-2 mt-3 justify-center">
            <button
              onClick={() => setShowPerformanceMonitor(!showPerformanceMonitor)}
              className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded transition-colors"
            >
              {showPerformanceMonitor ? 'Hide' : 'Show'} Performance
            </button>
            
            <button
              onClick={toggleMusic}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                musicEnabled 
                  ? 'bg-green-200 hover:bg-green-300 text-green-800' 
                  : 'bg-red-200 hover:bg-red-300 text-red-800'
              }`}
            >
              🎵 Music {musicEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
          
          {/* Music Volume Control */}
          {musicEnabled && (
            <div className="mt-3 flex items-center justify-center gap-2">
              <span className="text-xs text-gray-500">🔊 Volume:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={musicVolume}
                onChange={(e) => updateMusicVolume(parseFloat(e.target.value))}
                className="w-20 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-xs text-gray-500 w-8">{Math.round(musicVolume * 100)}%</span>
            </div>
          )}
          
          {/* Music Status Indicator */}
          {musicEnabled && gameStarted && (
            <div className="mt-2 text-xs text-gray-500 text-center">
              🎼 Playing: {musicInitializedRef.current 
                ? `${lastTimeOfDayRef.current.charAt(0).toUpperCase() + lastTimeOfDayRef.current.slice(1)} Theme`
                : 'Loading...'
              }
            </div>
          )}
        </div>
      </div>
      
      {/* Performance Monitor */}
      <PerformanceMonitor
        particleCount={particles.length}
        gameObjects={pipes.length + (bird ? 1 : 0)}
        canvasWidth={CANVAS_WIDTH}
        canvasHeight={CANVAS_HEIGHT}
        isVisible={showPerformanceMonitor}
      />
    </div>
  );
};

export default SimpleGame; 