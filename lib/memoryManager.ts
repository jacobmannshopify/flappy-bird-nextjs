// Memory Management Utility for Game Objects

interface PooledObject {
  reset(): void;
  isActive(): boolean;
}

interface MemoryStats {
  totalAllocated: number;
  poolSize: number;
  activeObjects: number;
  memoryUsage: number;
}

class ObjectPool<T extends PooledObject> {
  private pool: T[] = [];
  private createFn: () => T;
  private maxSize: number;

  constructor(createFn: () => T, initialSize: number = 10, maxSize: number = 100) {
    this.createFn = createFn;
    this.maxSize = maxSize;
    
    // Pre-allocate initial objects
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn());
    }
  }

  acquire(): T {
    // Try to reuse an existing object
    const obj = this.pool.pop();
    if (obj) {
      obj.reset();
      return obj;
    }
    
    // Create new object if pool is empty
    return this.createFn();
  }

  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      obj.reset();
      this.pool.push(obj);
    }
    // If pool is full, let the object be garbage collected
  }

  getStats(): { poolSize: number; maxSize: number } {
    return {
      poolSize: this.pool.length,
      maxSize: this.maxSize
    };
  }

  cleanup(): void {
    this.pool.length = 0;
  }
}

class MemoryManager {
  private static instance: MemoryManager;
  private pools: Map<string, ObjectPool<any>> = new Map();
  private allocatedObjects: number = 0;

  private constructor() {}

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  createPool<T extends PooledObject>(
    name: string, 
    createFn: () => T, 
    initialSize: number = 10, 
    maxSize: number = 100
  ): ObjectPool<T> {
    const pool = new ObjectPool(createFn, initialSize, maxSize);
    this.pools.set(name, pool);
    return pool;
  }

  getPool<T extends PooledObject>(name: string): ObjectPool<T> | undefined {
    return this.pools.get(name);
  }

  // Memory usage tracking
  getMemoryStats(): MemoryStats {
    let totalPoolSize = 0;
    let activeObjects = 0;

    this.pools.forEach(pool => {
      const stats = pool.getStats();
      totalPoolSize += stats.poolSize;
    });

    // Get JavaScript heap size if available
    let memoryUsage = 0;
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // Convert to MB
    }

    return {
      totalAllocated: this.allocatedObjects,
      poolSize: totalPoolSize,
      activeObjects,
      memoryUsage
    };
  }

  // Cleanup all pools
  cleanup(): void {
    this.pools.forEach(pool => pool.cleanup());
    this.pools.clear();
    this.allocatedObjects = 0;
  }

  // Force garbage collection (if available)
  forceGC(): void {
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }
  }

  // Memory pressure detection
  isMemoryPressureHigh(): boolean {
    const stats = this.getMemoryStats();
    return stats.memoryUsage > 100; // 100MB threshold
  }

  // Batch cleanup for performance
  performMaintenance(): void {
    // Clean up empty pools
    const emptyPools: string[] = [];
    this.pools.forEach((pool, name) => {
      const stats = pool.getStats();
      if (stats.poolSize === 0) {
        emptyPools.push(name);
      }
    });

    emptyPools.forEach(name => this.pools.delete(name));

    // Force GC if memory pressure is high
    if (this.isMemoryPressureHigh()) {
      this.forceGC();
    }
  }
}

// Particle pooling for game performance
interface PooledParticle extends PooledObject {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

class GameParticle implements PooledParticle {
  x: number = 0;
  y: number = 0;
  vx: number = 0;
  vy: number = 0;
  life: number = 1;
  maxLife: number = 60;
  color: string = '#FF0000';
  size: number = 2;
  private active: boolean = true;

  reset(): void {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.life = 1;
    this.maxLife = 60;
    this.color = '#FF0000';
    this.size = 2;
    this.active = true;
  }

  isActive(): boolean {
    return this.active && this.life > 0;
  }

  update(): void {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.1; // Gravity
    this.life -= 1 / this.maxLife;
    
    if (this.life <= 0) {
      this.active = false;
    }
  }

  deactivate(): void {
    this.active = false;
  }
}

// Export the memory manager instance and utility functions
const memoryManager = MemoryManager.getInstance();

export { 
  memoryManager, 
  MemoryManager, 
  ObjectPool, 
  GameParticle,
  type PooledObject,
  type MemoryStats 
}; 