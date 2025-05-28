import { Sprite, AnimatedSprite, SpriteFrame, RenderOptions, SpriteConfig, BirdAnimationState } from '@/types/sprites';
import { COLORS, ANIMATION } from '@/constants/game';

export class SpriteManager {
  private sprites: Map<string, Sprite> = new Map();
  private animatedSprites: Map<string, AnimatedSprite> = new Map();
  private loadedImages: Map<string, HTMLImageElement> = new Map();
  private initialized = false;

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

  // Create detailed pipe sprite with enhanced visuals
  createPipeSprite(width: number, height: number, isTop: boolean = false, style: 'green' | 'blue' | 'red' = 'green'): Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Choose colors based on style
    let baseColor: string;
    let darkColor: string;
    let lightColor: string;
    let accentColor: string;

    switch (style) {
      case 'blue':
        baseColor = '#4169E1';
        darkColor = '#191970';
        lightColor = '#6495ED';
        accentColor = '#87CEEB';
        break;
      case 'red':
        baseColor = '#DC143C';
        darkColor = '#8B0000';
        lightColor = '#F08080';
        accentColor = '#FFB6C1';
        break;
      default: // green
        baseColor = '#228B22';
        darkColor = '#006400';
        lightColor = '#32CD32';
        accentColor = '#90EE90';
    }

    // Main pipe body
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, lightColor);
    gradient.addColorStop(0.3, baseColor);
    gradient.addColorStop(0.7, baseColor);
    gradient.addColorStop(1, darkColor);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add pipe borders
    ctx.strokeStyle = darkColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, width - 2, height - 2);

    // Add vertical texture lines
    ctx.strokeStyle = darkColor;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;
    for (let i = 0; i < 3; i++) {
      const x = width * (0.25 + i * 0.25);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Add horizontal segments
    ctx.strokeStyle = darkColor;
    ctx.lineWidth = 1;
    const segmentHeight = 40;
    for (let y = segmentHeight; y < height; y += segmentHeight) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Add metallic shine effect
    const shineGradient = ctx.createLinearGradient(0, 0, width * 0.3, 0);
    shineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    shineGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = shineGradient;
    ctx.fillRect(0, 0, width * 0.3, height);

    // Add rivets/bolts for industrial look
    ctx.fillStyle = '#2F4F4F';
    const rivetSize = 3;
    const rivetSpacing = 35;
    
    for (let y = 20; y < height - 20; y += rivetSpacing) {
      // Left side rivets
      ctx.beginPath();
      ctx.arc(8, y, rivetSize, 0, Math.PI * 2);
      ctx.fill();
      
      // Right side rivets
      ctx.beginPath();
      ctx.arc(width - 8, y, rivetSize, 0, Math.PI * 2);
      ctx.fill();
    }

    // Add rivet highlights
    ctx.fillStyle = '#708090';
    for (let y = 20; y < height - 20; y += rivetSpacing) {
      ctx.beginPath();
      ctx.arc(7, y - 1, rivetSize - 1, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(width - 9, y - 1, rivetSize - 1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Add pipe cap for top/bottom sections
    if (isTop) {
      // Top pipe cap (actually bottom since it's flipped)
      const capHeight = 30;
      const capWidth = width + 8;
      const capX = -4;
      const capY = height - capHeight;

      // Cap gradient
      const capGradient = ctx.createLinearGradient(0, capY, 0, height);
      capGradient.addColorStop(0, lightColor);
      capGradient.addColorStop(0.5, baseColor);
      capGradient.addColorStop(1, darkColor);

      ctx.fillStyle = capGradient;
      ctx.fillRect(capX, capY, capWidth, capHeight);

      // Cap border
      ctx.strokeStyle = darkColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(capX, capY, capWidth, capHeight);

      // Cap highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(capX, capY, capWidth * 0.4, capHeight);
    } else {
      // Bottom pipe cap (actually top)
      const capHeight = 30;
      const capWidth = width + 8;
      const capX = -4;
      const capY = 0;

      // Cap gradient
      const capGradient = ctx.createLinearGradient(0, 0, 0, capHeight);
      capGradient.addColorStop(0, darkColor);
      capGradient.addColorStop(0.5, baseColor);
      capGradient.addColorStop(1, lightColor);

      ctx.fillStyle = capGradient;
      ctx.fillRect(capX, capY, capWidth, capHeight);

      // Cap border
      ctx.strokeStyle = darkColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(capX, capY, capWidth, capHeight);

      // Cap highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(capX, capY, capWidth * 0.4, capHeight);
    }

    const image = new Image();
    image.src = canvas.toDataURL();
    
    return {
      id: `pipe-${isTop ? 'top' : 'bottom'}-${style}`,
      image,
      frame: { x: 0, y: 0, width, height },
      width,
      height,
      loaded: true
    };
  }

  // Create pipe variety - different styles for visual interest
  createPipeVariety(): void {
    const pipeWidth = 60;
    const pipeHeight = 400;

    // Create multiple pipe styles
    const styles: Array<'green' | 'blue' | 'red'> = ['green', 'blue', 'red'];
    
    styles.forEach(style => {
      // Top pipes
      const topPipe = this.createPipeSprite(pipeWidth, pipeHeight, true, style);
      this.sprites.set(`pipe-top-${style}`, topPipe);
      
      // Bottom pipes
      const bottomPipe = this.createPipeSprite(pipeWidth, pipeHeight, false, style);
      this.sprites.set(`pipe-bottom-${style}`, bottomPipe);
    });

    // Set default pipes (green style)
    this.sprites.set('pipe-top', this.sprites.get('pipe-top-green')!);
    this.sprites.set('pipe-bottom', this.sprites.get('pipe-bottom-green')!);

    console.log('Pipe variety sprites created:', styles.length * 2, 'total pipe sprites');
  }

  // Get random pipe style for variety
  getRandomPipeStyle(): 'green' | 'blue' | 'red' {
    const styles: Array<'green' | 'blue' | 'red'> = ['green', 'blue', 'red'];
    return styles[Math.floor(Math.random() * styles.length)];
  }

  // Get pipe sprites with specific style
  getPipeSprites(style?: 'green' | 'blue' | 'red'): { top: Sprite | null, bottom: Sprite | null } {
    if (style) {
      return {
        top: this.sprites.get(`pipe-top-${style}`) || null,
        bottom: this.sprites.get(`pipe-bottom-${style}`) || null
      };
    }
    
    return {
      top: this.sprites.get('pipe-top') || null,
      bottom: this.sprites.get('pipe-bottom') || null
    };
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

  // Create beautiful ground sprite with texture
  createGroundSprite(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 100;
    const ctx = canvas.getContext('2d')!;

    // Create ground gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 100);
    gradient.addColorStop(0, '#DEB887'); // Sandy brown
    gradient.addColorStop(0.3, '#D2691E'); // Chocolate
    gradient.addColorStop(0.7, '#8B4513'); // Saddle brown
    gradient.addColorStop(1, '#654321'); // Dark brown

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 100);

    // Add texture pattern
    ctx.fillStyle = 'rgba(139, 69, 19, 0.3)';
    for (let x = 0; x < 800; x += 20) {
      for (let y = 10; y < 100; y += 15) {
        ctx.fillRect(x + Math.random() * 10, y + Math.random() * 5, 2, 2);
      }
    }

    // Add grass on top
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, 0, 800, 8);
    
    // Add grass blades
    ctx.strokeStyle = '#32CD32';
    ctx.lineWidth = 1;
    for (let x = 0; x < 800; x += 5) {
      ctx.beginPath();
      ctx.moveTo(x, 8);
      ctx.lineTo(x + Math.random() * 4 - 2, 0);
      ctx.stroke();
    }

    const image = new Image();
    image.src = canvas.toDataURL();
    
    const sprite: Sprite = {
      id: 'ground',
      image,
      frame: { x: 0, y: 0, width: 800, height: 100 },
      width: 800,
      height: 100,
      loaded: true
    };
    
    this.sprites.set('ground', sprite);
  }

  // Create all bird sprites with animations
  createBirdSprites(): void {
    // Create basic bird sprites
    this.createBirdSprite('bird-idle', 24);
    this.createBirdFlapAnimation('bird-flap', 24);
    this.createBirdSprite('bird-fall', 24);
    this.createBirdSprite('bird-dead', 24);
    
    console.log('Bird sprites created with animations');
  }

  // Initialize all game sprites
  initializeGameSprites(): void {
    if (this.initialized) return;

    console.log('Initializing enhanced game sprites...');

    // Create bird sprites with animation
    this.createBirdSprites();

    // Create enhanced pipe variety
    this.createPipeVariety();

    // Create beautiful ground sprite
    this.createGroundSprite();

    this.initialized = true;
    console.log('Enhanced game sprites initialized successfully!');
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