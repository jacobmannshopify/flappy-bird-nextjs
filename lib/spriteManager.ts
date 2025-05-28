import { Sprite, AnimatedSprite, SpriteFrame, RenderOptions, SpriteConfig, BirdAnimationState } from '@/types/sprites';
import { COLORS, ANIMATION } from '@/constants/game';

export class SpriteManager {
  private sprites: Map<string, Sprite> = new Map();
  private animatedSprites: Map<string, AnimatedSprite> = new Map();
  private loadedImages: Map<string, HTMLImageElement> = new Map();

  // Create a simple colored sprite programmatically
  createColorSprite(id: string, width: number, height: number, color: string): Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
    
    const image = new Image();
    image.src = canvas.toDataURL();
    
    const sprite: Sprite = {
      id,
      image,
      frame: { x: 0, y: 0, width, height },
      width,
      height,
      loaded: true
    };
    
    this.sprites.set(id, sprite);
    return sprite;
  }

  // Create a bird sprite with visual details
  createBirdSprite(id: string, size: number = 24): Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    
    // Draw bird body (circle)
    ctx.fillStyle = COLORS.bird;
    ctx.beginPath();
    ctx.arc(size/2, size/2, size/2 - 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw bird outline
    ctx.strokeStyle = '#B8860B';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw eye
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(size/2 + 3, size/2 - 2, 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(size/2 + 4, size/2 - 2, 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw beak
    ctx.fillStyle = 'orange';
    ctx.beginPath();
    ctx.moveTo(size - 2, size/2);
    ctx.lineTo(size + 4, size/2 - 2);
    ctx.lineTo(size + 4, size/2 + 2);
    ctx.closePath();
    ctx.fill();
    
    const image = new Image();
    image.src = canvas.toDataURL();
    
    const sprite: Sprite = {
      id,
      image,
      frame: { x: 0, y: 0, width: size, height: size },
      width: size,
      height: size,
      loaded: true
    };
    
    this.sprites.set(id, sprite);
    return sprite;
  }

  // Create animated bird flapping sprite
  createBirdFlapAnimation(id: string, size: number = 24): AnimatedSprite {
    const frames: SpriteFrame[] = [];
    const canvas = document.createElement('canvas');
    canvas.width = size * 3; // 3 frames
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    
    // Create 3 flap frames
    for (let frame = 0; frame < 3; frame++) {
      const x = frame * size;
      
      // Draw bird body
      ctx.fillStyle = COLORS.bird;
      ctx.beginPath();
      ctx.arc(x + size/2, size/2, size/2 - 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw outline
      ctx.strokeStyle = '#B8860B';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw wing (different position for each frame)
      const wingOffset = frame === 1 ? -3 : frame === 2 ? -1 : 0;
      ctx.fillStyle = '#DAA520';
      ctx.beginPath();
      ctx.ellipse(x + size/2 - 2, size/2 + wingOffset, 4, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw eye
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(x + size/2 + 3, size/2 - 2, 3, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = 'black';
      ctx.beginPath();
      ctx.arc(x + size/2 + 4, size/2 - 2, 1.5, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw beak
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(x + size - 2, size/2);
      ctx.lineTo(x + size + 4, size/2 - 2);
      ctx.lineTo(x + size + 4, size/2 + 2);
      ctx.closePath();
      ctx.fill();
      
      frames.push({ x, y: 0, width: size, height: size });
    }
    
    const image = new Image();
    image.src = canvas.toDataURL();
    
    const animatedSprite: AnimatedSprite = {
      id,
      image,
      frame: frames[0],
      frames,
      width: size,
      height: size,
      loaded: true,
      currentFrame: 0,
      frameRate: ANIMATION.BIRD_FLAP_SPEED * 60, // Convert to FPS
      lastFrameTime: 0,
      loop: true,
      playing: false
    };
    
    this.animatedSprites.set(id, animatedSprite);
    return animatedSprite;
  }

  // Create pipe sprite with visual details
  createPipeSprite(id: string, width: number, height: number, isTop: boolean = false): Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    
    // Create gradient for pipe
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, '#228B22');
    gradient.addColorStop(0.3, '#32CD32');
    gradient.addColorStop(0.7, '#228B22');
    gradient.addColorStop(1, '#006400');
    
    // Draw pipe body
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Draw pipe cap (wider section)
    if (isTop) {
      ctx.fillRect(-5, height - 20, width + 10, 20);
    } else {
      ctx.fillRect(-5, 0, width + 10, 20);
    }
    
    // Draw vertical lines for texture
    ctx.strokeStyle = '#006400';
    ctx.lineWidth = 2;
    for (let x = width * 0.2; x < width; x += width * 0.2) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Draw highlight
    ctx.strokeStyle = '#90EE90';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(2, 0);
    ctx.lineTo(2, height);
    ctx.stroke();
    
    const image = new Image();
    image.src = canvas.toDataURL();
    
    const sprite: Sprite = {
      id,
      image,
      frame: { x: 0, y: 0, width, height },
      width,
      height,
      loaded: true
    };
    
    this.sprites.set(id, sprite);
    return sprite;
  }

  // Update animated sprites
  updateAnimations(currentTime: number): void {
    this.animatedSprites.forEach((sprite) => {
      if (!sprite.playing) return;
      
      const frameTime = 1000 / sprite.frameRate;
      if (currentTime - sprite.lastFrameTime >= frameTime) {
        sprite.currentFrame = (sprite.currentFrame + 1) % sprite.frames.length;
        sprite.frame = sprite.frames[sprite.currentFrame];
        sprite.lastFrameTime = currentTime;
        
        if (!sprite.loop && sprite.currentFrame === sprite.frames.length - 1) {
          sprite.playing = false;
        }
      }
    });
  }

  // Get sprite by ID
  getSprite(id: string): Sprite | null {
    return this.sprites.get(id) || null;
  }

  // Get animated sprite by ID
  getAnimatedSprite(id: string): AnimatedSprite | null {
    return this.animatedSprites.get(id) || null;
  }

  // Play animation
  playAnimation(id: string): void {
    const sprite = this.animatedSprites.get(id);
    if (sprite) {
      sprite.playing = true;
      sprite.currentFrame = 0;
      sprite.lastFrameTime = performance.now();
    }
  }

  // Stop animation
  stopAnimation(id: string): void {
    const sprite = this.animatedSprites.get(id);
    if (sprite) {
      sprite.playing = false;
      sprite.currentFrame = 0;
      sprite.frame = sprite.frames[0];
    }
  }

  // Initialize all game sprites
  initializeGameSprites(): void {
    // Create bird sprites
    this.createBirdSprite('bird-idle', 24);
    this.createBirdFlapAnimation('bird-flap', 24);
    this.createBirdSprite('bird-fall', 24);
    this.createBirdSprite('bird-dead', 24);
    
    // Create pipe sprites
    this.createPipeSprite('pipe-top', 60, 300, true);
    this.createPipeSprite('pipe-bottom', 60, 300, false);
    
    // Create background elements
    this.createColorSprite('ground', 800, 100, COLORS.ground);
    
    console.log('Game sprites initialized');
  }
}

// Sprite rendering utilities
export class SpriteRenderer {
  static drawSprite(
    ctx: CanvasRenderingContext2D,
    sprite: Sprite | AnimatedSprite,
    options: RenderOptions
  ): void {
    if (!sprite.loaded || !sprite.image) return;
    
    ctx.save();
    
    // Set alpha
    if (options.alpha !== undefined) {
      ctx.globalAlpha = options.alpha;
    }
    
    // Calculate center point for rotation
    const centerX = options.centerX ?? (options.width ? options.width / 2 : sprite.width / 2);
    const centerY = options.centerY ?? (options.height ? options.height / 2 : sprite.height / 2);
    
    // Apply transformations
    ctx.translate(options.x + centerX, options.y + centerY);
    
    if (options.rotation) {
      ctx.rotate(options.rotation);
    }
    
    if (options.flipX || options.flipY) {
      ctx.scale(options.flipX ? -1 : 1, options.flipY ? -1 : 1);
    }
    
    // Draw the sprite
    const drawWidth = options.width ?? sprite.width;
    const drawHeight = options.height ?? sprite.height;
    
    ctx.drawImage(
      sprite.image,
      sprite.frame.x,
      sprite.frame.y,
      sprite.frame.width,
      sprite.frame.height,
      -centerX,
      -centerY,
      drawWidth,
      drawHeight
    );
    
    ctx.restore();
  }
}

// Global sprite manager instance
export const spriteManager = new SpriteManager(); 