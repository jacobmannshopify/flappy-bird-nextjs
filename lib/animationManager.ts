import { 
  Particle, 
  ParticleEmitterConfig, 
  ScorePopup, 
  ScreenFlash, 
  DeathAnimation,
  Position,
  EasingFunction
} from '@/types/game';

// Easing functions for smooth animations
export const EASING = {
  linear: (t: number) => t,
  easeOut: (t: number) => 1 - Math.pow(1 - t, 3),
  easeIn: (t: number) => t * t * t,
  easeInOut: (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  bounce: (t: number) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  },
  elastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
  }
};

class AnimationManager {
  private particles: Particle[] = [];
  private scorePopups: ScorePopup[] = [];
  private screenFlash: ScreenFlash | null = null;
  private deathAnimation: DeathAnimation | null = null;
  private nextParticleId = 0;
  private nextPopupId = 0;

  // Particle System
  createParticleExplosion(config: ParticleEmitterConfig): void {
    const particles: Particle[] = [];
    
    for (let i = 0; i < config.particleCount; i++) {
      const angle = config.angle.min + Math.random() * (config.angle.max - config.angle.min);
      const speed = config.speed.min + Math.random() * (config.speed.max - config.speed.min);
      const life = config.life.min + Math.random() * (config.life.max - config.life.min);
      const size = config.size.min + Math.random() * (config.size.max - config.size.min);
      const color = config.colors[Math.floor(Math.random() * config.colors.length)];
      
      // Convert angle to velocity
      const velocityX = Math.cos(angle) * speed;
      const velocityY = Math.sin(angle) * speed;
      
      // Add some randomness to position
      const offsetX = (Math.random() - 0.5) * 20;
      const offsetY = (Math.random() - 0.5) * 20;
      
      const particle: Particle = {
        id: `particle_${this.nextParticleId++}`,
        x: config.position.x + offsetX,
        y: config.position.y + offsetY,
        velocity: { x: velocityX, y: velocityY },
        life: life,
        maxLife: life,
        size: size,
        color: color,
        alpha: 1,
        gravity: config.gravity || 0.1,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2
      };
      
      particles.push(particle);
    }
    
    this.particles.push(...particles);
  }

  // Create explosion effect on collision
  createCollisionExplosion(position: Position): void {
    this.createParticleExplosion({
      position,
      particleCount: 15,
      speed: { min: 2, max: 8 },
      angle: { min: 0, max: Math.PI * 2 },
      life: { min: 800, max: 1500 },
      size: { min: 3, max: 8 },
      colors: ['#ff6b6b', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd'],
      gravity: 0.15
    });
  }

  // Create celebration effect on score
  createScoreExplosion(position: Position): void {
    this.createParticleExplosion({
      position,
      particleCount: 8,
      speed: { min: 1, max: 4 },
      angle: { min: -Math.PI/4, max: -3*Math.PI/4 }, // Upward burst
      life: { min: 600, max: 1000 },
      size: { min: 2, max: 5 },
      colors: ['#00d2d3', '#ff9f43', '#55a3ff', '#26de81'],
      gravity: 0.05
    });
  }

  // Score Popup System
  createScorePopup(position: Position, value: number): void {
    const popup: ScorePopup = {
      id: `popup_${this.nextPopupId++}`,
      x: position.x,
      y: position.y,
      value,
      startTime: Date.now(),
      duration: 1500,
      isActive: true,
      alpha: 1,
      scale: 0.5
    };
    
    this.scorePopups.push(popup);
  }

  // Screen Flash Effect
  createScreenFlash(color: string = '#ff0000', duration: number = 200, intensity: number = 0.3): void {
    this.screenFlash = {
      isActive: true,
      startTime: Date.now(),
      duration,
      color,
      alpha: intensity,
      intensity
    };
  }

  // Death Animation
  startDeathAnimation(birdRotation: number): void {
    this.deathAnimation = {
      isActive: true,
      startTime: Date.now(),
      duration: 2000,
      initialRotation: birdRotation,
      targetRotation: birdRotation + Math.PI * 3, // 1.5 full rotations
      fallSpeed: 0,
      bounceHeight: 0,
      hasBounced: false
    };
  }

  // Update all animations
  update(deltaTime: number, currentTime: number): void {
    this.updateParticles(deltaTime);
    this.updateScorePopups(currentTime);
    this.updateScreenFlash(currentTime);
    this.updateDeathAnimation(deltaTime, currentTime);
  }

  private updateParticles(deltaTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      // Update position
      particle.x += particle.velocity.x * deltaTime;
      particle.y += particle.velocity.y * deltaTime;
      
      // Apply gravity
      if (particle.gravity) {
        particle.velocity.y += particle.gravity * deltaTime;
      }
      
      // Update rotation
      if (particle.rotationSpeed) {
        particle.rotation = (particle.rotation || 0) + particle.rotationSpeed * deltaTime;
      }
      
      // Update life
      particle.life -= deltaTime * 16.67; // Convert to ms-like units
      
      // Update alpha based on life
      particle.alpha = Math.max(0, particle.life / particle.maxLife);
      
      // Remove dead particles
      if (particle.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private updateScorePopups(currentTime: number): void {
    for (let i = this.scorePopups.length - 1; i >= 0; i--) {
      const popup = this.scorePopups[i];
      const elapsed = currentTime - popup.startTime;
      const progress = Math.min(elapsed / popup.duration, 1);
      
      // Animate upward movement
      popup.y -= 2; // Slow upward drift
      
      // Animate scale with bounce effect
      if (progress < 0.3) {
        popup.scale = EASING.bounce(progress / 0.3) * 1.2;
      } else {
        popup.scale = 1.2 - (progress - 0.3) * 0.4; // Slowly shrink
      }
      
      // Animate alpha fadeout
      if (progress > 0.7) {
        popup.alpha = 1 - EASING.easeOut((progress - 0.7) / 0.3);
      }
      
      // Remove finished popups
      if (progress >= 1) {
        popup.isActive = false;
        this.scorePopups.splice(i, 1);
      }
    }
  }

  private updateScreenFlash(currentTime: number): void {
    if (!this.screenFlash || !this.screenFlash.isActive) return;
    
    const elapsed = currentTime - this.screenFlash.startTime;
    const progress = Math.min(elapsed / this.screenFlash.duration, 1);
    
    // Quick fade out
    this.screenFlash.alpha = this.screenFlash.intensity * (1 - EASING.easeOut(progress));
    
    if (progress >= 1) {
      this.screenFlash.isActive = false;
      this.screenFlash = null;
    }
  }

  private updateDeathAnimation(deltaTime: number, currentTime: number): void {
    if (!this.deathAnimation || !this.deathAnimation.isActive) return;
    
    const elapsed = currentTime - this.deathAnimation.startTime;
    const progress = Math.min(elapsed / this.deathAnimation.duration, 1);
    
    // Increase fall speed over time
    this.deathAnimation.fallSpeed += 0.3 * deltaTime;
    
    if (progress >= 1) {
      this.deathAnimation.isActive = false;
    }
  }

  // Render all animations
  render(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void {
    this.renderParticles(ctx);
    this.renderScorePopups(ctx);
    this.renderScreenFlash(ctx, canvasWidth, canvasHeight);
  }

  private renderParticles(ctx: CanvasRenderingContext2D): void {
    for (const particle of this.particles) {
      ctx.save();
      
      ctx.globalAlpha = particle.alpha;
      ctx.fillStyle = particle.color;
      
      // Apply rotation if exists
      if (particle.rotation) {
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation);
        ctx.fillRect(-particle.size/2, -particle.size/2, particle.size, particle.size);
      } else {
        // Simple circle particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size/2, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    }
  }

  private renderScorePopups(ctx: CanvasRenderingContext2D): void {
    for (const popup of this.scorePopups) {
      if (!popup.isActive) continue;
      
      ctx.save();
      
      ctx.globalAlpha = popup.alpha;
      ctx.font = `bold ${24 * popup.scale}px Arial`;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 3 * popup.scale;
      ctx.textAlign = 'center';
      
      const text = `+${popup.value}`;
      
      // Draw text stroke
      ctx.strokeText(text, popup.x, popup.y);
      // Draw text fill
      ctx.fillText(text, popup.x, popup.y);
      
      ctx.restore();
    }
  }

  private renderScreenFlash(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    if (!this.screenFlash || !this.screenFlash.isActive) return;
    
    ctx.save();
    ctx.globalAlpha = this.screenFlash.alpha;
    ctx.fillStyle = this.screenFlash.color;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  // Get death animation data for bird rendering
  getDeathAnimationData(): { rotation: number; fallSpeed: number } | null {
    if (!this.deathAnimation || !this.deathAnimation.isActive) return null;
    
    const elapsed = Date.now() - this.deathAnimation.startTime;
    const progress = Math.min(elapsed / this.deathAnimation.duration, 1);
    
    // Calculate rotation with easing
    const rotation = this.deathAnimation.initialRotation + 
      (this.deathAnimation.targetRotation - this.deathAnimation.initialRotation) * 
      EASING.easeOut(progress);
    
    return {
      rotation,
      fallSpeed: this.deathAnimation.fallSpeed
    };
  }

  // Clear all animations
  clear(): void {
    this.particles = [];
    this.scorePopups = [];
    this.screenFlash = null;
    this.deathAnimation = null;
  }

  // Getters for debugging/UI
  get particleCount(): number {
    return this.particles.length;
  }

  get activePopupCount(): number {
    return this.scorePopups.filter(p => p.isActive).length;
  }

  get hasActiveAnimations(): boolean {
    return this.particles.length > 0 || 
           this.scorePopups.length > 0 || 
           (this.screenFlash?.isActive || false) ||
           (this.deathAnimation?.isActive || false);
  }
}

// Export singleton instance
export const animationManager = new AnimationManager();
export default animationManager; 