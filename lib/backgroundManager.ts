import { Sprite } from '@/types/sprites';
import { spriteManager, SpriteRenderer } from './spriteManager';
import { COLORS, RENDERING } from '@/constants/game';

export interface BackgroundLayer {
  id: string;
  sprite: Sprite;
  scrollSpeed: number; // Multiplier for base scroll speed
  x: number;
  y: number;
  width: number;
  height: number;
  repeat: boolean; // Whether this layer repeats horizontally
  zIndex: number; // Rendering order (lower = behind)
}

export interface CloudElement {
  id: string;
  sprite: Sprite;
  x: number;
  y: number;
  scrollSpeed: number;
  scale: number;
  alpha: number;
}

export class BackgroundManager {
  private layers: BackgroundLayer[] = [];
  private clouds: CloudElement[] = [];
  private baseScrollSpeed: number = 1;
  private nextCloudId: number = 1;
  private initialized: boolean = false;

  constructor() {
    // Only initialize on client-side
    if (typeof window !== 'undefined') {
      this.initializeBackgrounds();
    }
  }

  // Create distant mountain silhouette
  createMountainSprite(width: number, height: number): Sprite {
    if (typeof window === 'undefined') {
      // Return a placeholder sprite for SSR
      return {
        id: 'mountains',
        image: new Image(),
        frame: { x: 0, y: 0, width, height },
        width,
        height,
        loaded: false
      };
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Create mountain silhouette gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#4169E1'); // Royal blue
    gradient.addColorStop(0.3, '#6495ED'); // Cornflower blue
    gradient.addColorStop(0.7, '#87CEEB'); // Sky blue
    gradient.addColorStop(1, '#B0E0E6'); // Powder blue

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw mountain peaks
    ctx.fillStyle = '#2F4F4F'; // Dark slate gray
    ctx.beginPath();
    
    // Create multiple mountain peaks
    const peaks = [
      { x: 0, y: height * 0.6 },
      { x: width * 0.15, y: height * 0.4 },
      { x: width * 0.3, y: height * 0.7 },
      { x: width * 0.5, y: height * 0.3 },
      { x: width * 0.65, y: height * 0.6 },
      { x: width * 0.8, y: height * 0.45 },
      { x: width, y: height * 0.65 }
    ];

    ctx.moveTo(0, height);
    peaks.forEach((peak, index) => {
      if (index === 0) {
        ctx.lineTo(peak.x, peak.y);
      } else {
        // Add some curve to make it look more natural
        const prevPeak = peaks[index - 1];
        const cpX = (prevPeak.x + peak.x) / 2;
        const cpY = Math.min(prevPeak.y, peak.y) - 20;
        ctx.quadraticCurveTo(cpX, cpY, peak.x, peak.y);
      }
    });
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();

    // Add some texture with darker lines
    ctx.strokeStyle = '#1C1C1C';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(width * (0.2 + i * 0.15), height * 0.3);
      ctx.lineTo(width * (0.2 + i * 0.15), height);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    const image = new Image();
    image.src = canvas.toDataURL();
    
    return {
      id: 'mountains',
      image,
      frame: { x: 0, y: 0, width, height },
      width,
      height,
      loaded: true
    };
  }

  // Create cloud sprite
  createCloudSprite(size: number = 60): Sprite {
    if (typeof window === 'undefined') {
      // Return a placeholder sprite for SSR
      return {
        id: `cloud-${Date.now()}`,
        image: new Image(),
        frame: { x: 0, y: 0, width: size, height: size * 0.6 },
        width: size,
        height: size * 0.6,
        loaded: false
      };
    }

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size * 0.6;
    const ctx = canvas.getContext('2d')!;

    // Create fluffy cloud
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    
    // Main cloud body
    ctx.beginPath();
    ctx.arc(size * 0.3, canvas.height * 0.7, size * 0.2, 0, Math.PI * 2);
    ctx.arc(size * 0.5, canvas.height * 0.6, size * 0.25, 0, Math.PI * 2);
    ctx.arc(size * 0.7, canvas.height * 0.7, size * 0.2, 0, Math.PI * 2);
    ctx.arc(size * 0.6, canvas.height * 0.8, size * 0.15, 0, Math.PI * 2);
    ctx.arc(size * 0.4, canvas.height * 0.8, size * 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Add cloud highlights
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(size * 0.45, canvas.height * 0.5, size * 0.15, 0, Math.PI * 2);
    ctx.arc(size * 0.55, canvas.height * 0.55, size * 0.12, 0, Math.PI * 2);
    ctx.fill();

    const image = new Image();
    image.src = canvas.toDataURL();
    
    return {
      id: `cloud-${Date.now()}`,
      image,
      frame: { x: 0, y: 0, width: size, height: canvas.height },
      width: size,
      height: canvas.height,
      loaded: true
    };
  }

  // Create parallax sky gradient
  createSkyGradientSprite(width: number, height: number): Sprite {
    if (typeof window === 'undefined') {
      // Return a placeholder sprite for SSR
      return {
        id: 'sky-gradient',
        image: new Image(),
        frame: { x: 0, y: 0, width, height },
        width,
        height,
        loaded: false
      };
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Create beautiful sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#87CEEB'); // Sky blue at top
    gradient.addColorStop(0.3, '#ADD8E6'); // Light blue
    gradient.addColorStop(0.7, '#F0F8FF'); // Alice blue
    gradient.addColorStop(1, '#F5F5DC'); // Beige near horizon

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const image = new Image();
    image.src = canvas.toDataURL();
    
    return {
      id: 'sky-gradient',
      image,
      frame: { x: 0, y: 0, width, height },
      width,
      height,
      loaded: true
    };
  }

  // Initialize all background layers
  initializeBackgrounds(): void {
    if (typeof window === 'undefined' || this.initialized) return;
    
    const canvasWidth = 800;
    const canvasHeight = 600;

    // Layer 1: Sky gradient (stationary background)
    const skySprite = this.createSkyGradientSprite(canvasWidth, canvasHeight);
    this.layers.push({
      id: 'sky',
      sprite: skySprite,
      scrollSpeed: 0, // Stationary
      x: 0,
      y: 0,
      width: canvasWidth,
      height: canvasHeight,
      repeat: false,
      zIndex: 0
    });

    // Layer 2: Distant mountains (very slow parallax)
    const mountainSprite = this.createMountainSprite(canvasWidth * 2, canvasHeight);
    this.layers.push({
      id: 'mountains',
      sprite: mountainSprite,
      scrollSpeed: RENDERING.BACKGROUND_PARALLAX_SPEED * 0.2, // Very slow
      x: 0,
      y: 0,
      width: canvasWidth * 2,
      height: canvasHeight,
      repeat: true,
      zIndex: 1
    });

    // Initialize some clouds
    this.spawnInitialClouds();

    this.initialized = true;
    console.log('Background layers initialized');
  }

  // Ensure initialization when needed
  ensureInitialized(): void {
    if (!this.initialized && typeof window !== 'undefined') {
      this.initializeBackgrounds();
    }
  }

  // Spawn initial clouds
  spawnInitialClouds(): void {
    if (typeof window === 'undefined') return;
    
    const canvasWidth = 800;
    const canvasHeight = 600;

    for (let i = 0; i < 5; i++) {
      const cloudSprite = this.createCloudSprite(40 + Math.random() * 40);
      const cloud: CloudElement = {
        id: `cloud-${this.nextCloudId++}`,
        sprite: cloudSprite,
        x: Math.random() * canvasWidth * 2,
        y: 50 + Math.random() * 150, // Upper portion of screen
        scrollSpeed: RENDERING.BACKGROUND_PARALLAX_SPEED * (0.3 + Math.random() * 0.4),
        scale: 0.5 + Math.random() * 0.8,
        alpha: 0.4 + Math.random() * 0.4
      };
      this.clouds.push(cloud);
    }
  }

  // Update background positions
  update(deltaTime: number): void {
    this.ensureInitialized();
    
    const scrollAmount = this.baseScrollSpeed * (deltaTime / 16.67);

    // Update layer positions
    this.layers.forEach(layer => {
      if (layer.scrollSpeed > 0) {
        layer.x -= scrollAmount * layer.scrollSpeed;
        
        // Handle repeating layers
        if (layer.repeat && layer.x <= -layer.width / 2) {
          layer.x = 0;
        }
      }
    });

    // Update cloud positions
    this.clouds.forEach(cloud => {
      cloud.x -= scrollAmount * cloud.scrollSpeed;
      
      // Respawn clouds that have moved off screen
      if (cloud.x < -cloud.sprite.width) {
        cloud.x = 800 + Math.random() * 200;
        cloud.y = 50 + Math.random() * 150;
        cloud.scrollSpeed = RENDERING.BACKGROUND_PARALLAX_SPEED * (0.3 + Math.random() * 0.4);
      }
    });
  }

  // Set scroll speed (for different game states)
  setScrollSpeed(speed: number): void {
    this.baseScrollSpeed = speed;
  }

  // Render all background layers
  render(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void {
    this.ensureInitialized();
    
    // Fallback to basic sky color if not initialized
    if (!this.initialized) {
      ctx.fillStyle = COLORS.sky;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      return;
    }

    // Sort layers by z-index
    const sortedLayers = [...this.layers].sort((a, b) => a.zIndex - b.zIndex);

    // Render layers
    sortedLayers.forEach(layer => {
      if (layer.sprite.loaded) {
        if (layer.repeat) {
          // Draw repeating layer
          SpriteRenderer.drawSprite(ctx, layer.sprite, {
            x: layer.x,
            y: layer.y,
            width: layer.width,
            height: layer.height
          });
          
          // Draw second copy for seamless scrolling
          SpriteRenderer.drawSprite(ctx, layer.sprite, {
            x: layer.x + layer.width,
            y: layer.y,
            width: layer.width,
            height: layer.height
          });
        } else {
          // Draw single layer
          SpriteRenderer.drawSprite(ctx, layer.sprite, {
            x: layer.x,
            y: layer.y,
            width: layer.width,
            height: layer.height
          });
        }
      }
    });

    // Render clouds
    this.clouds.forEach(cloud => {
      if (cloud.sprite.loaded) {
        SpriteRenderer.drawSprite(ctx, cloud.sprite, {
          x: cloud.x,
          y: cloud.y,
          width: cloud.sprite.width * cloud.scale,
          height: cloud.sprite.height * cloud.scale,
          alpha: cloud.alpha
        });
      }
    });
  }

  // Get layer by ID
  getLayer(id: string): BackgroundLayer | null {
    return this.layers.find(layer => layer.id === id) || null;
  }

  // Add new cloud
  addCloud(x: number, y: number): void {
    if (typeof window === 'undefined') return;
    
    const cloudSprite = this.createCloudSprite(40 + Math.random() * 40);
    const cloud: CloudElement = {
      id: `cloud-${this.nextCloudId++}`,
      sprite: cloudSprite,
      x,
      y,
      scrollSpeed: RENDERING.BACKGROUND_PARALLAX_SPEED * (0.3 + Math.random() * 0.4),
      scale: 0.5 + Math.random() * 0.8,
      alpha: 0.4 + Math.random() * 0.4
    };
    this.clouds.push(cloud);
  }
}

// Create background manager instance only on client-side
let backgroundManagerInstance: BackgroundManager | null = null;

export const backgroundManager = (() => {
  if (typeof window !== 'undefined' && !backgroundManagerInstance) {
    backgroundManagerInstance = new BackgroundManager();
  }
  return backgroundManagerInstance || new BackgroundManager();
})(); 