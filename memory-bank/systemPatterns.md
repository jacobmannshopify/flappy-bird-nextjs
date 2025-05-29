# System Patterns

## 🏗️ System Architecture

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                        Next.js App                         │
├─────────────────────────────────────────────────────────────┤
│  App Router (app/)                                          │
│  ├── page.tsx (Main entry point)                           │
│  └── layout.tsx (Root layout with PWA metadata)            │
├─────────────────────────────────────────────────────────────┤
│  Components Layer                                           │
│  ├── SimpleGame.tsx (Main game component)                  │
│  ├── PerformanceMonitor.tsx (Performance tracking)         │
│  ├── PWAInstaller.tsx (PWA installation)                   │
│  └── UI/ (Reusable UI components)                          │
├─────────────────────────────────────────────────────────────┤
│  Game Systems Layer                                         │
│  ├── lib/dayNightCycle.ts (Visual themes)                  │
│  ├── lib/proceduralMusic.ts (Audio generation)             │
│  ├── constants/ (Game configuration)                       │
│  ├── types/ (TypeScript definitions)                       │
│  └── hooks/ (Reusable game logic)                          │
├─────────────────────────────────────────────────────────────┤
│  Platform Layer                                             │
│  ├── public/manifest.json (PWA configuration)              │
│  ├── public/sw.js (Service worker)                         │
│  └── Browser APIs (Canvas, Web Audio, Vibration)           │
└─────────────────────────────────────────────────────────────┘
```

### Component Architecture Pattern
**Single-Component Game Design:**
- `SimpleGame.tsx` contains all game logic in one comprehensive component
- Self-contained state management using React hooks
- Direct canvas rendering without abstraction layers
- Immediate integration of all systems (visual, audio, input, performance)

**Benefits:**
- Simplified debugging and development
- Consistent state management
- Optimal performance (no prop drilling or context overhead)
- Easy to understand and modify

## 🎯 Key Technical Decisions

### 1. **Canvas-Based Rendering**
**Decision:** Use HTML5 Canvas for all game rendering
**Rationale:**
- Direct pixel control for smooth 60 FPS performance
- Efficient for particle systems and dynamic animations
- Better performance than DOM-based animations
- Consistent rendering across platforms

**Implementation Pattern:**
```typescript
// Single render loop handles all graphics
const render = (ctx: CanvasRenderingContext2D) => {
  // Clear and draw background
  // Draw game objects (pipes, bird)
  // Draw particles and effects
  // Draw UI overlays
};
```

### 2. **Web Audio API for Procedural Audio**
**Decision:** Generate all audio procedurally without external files
**Rationale:**
- No dependency on audio file loading
- Dynamic audio that adapts to gameplay
- Smaller bundle size
- Real-time audio parameter control

**Implementation Pattern:**
```typescript
// Direct Web Audio API usage
const createSound = (frequency: number, duration: number) => {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  // Configure and play sound
};
```

### 3. **React Hooks for State Management**
**Decision:** Use useState and useRef instead of external state management
**Rationale:**
- Game state is localized to single component
- Direct state updates for optimal performance
- Simpler than Redux/Zustand for this use case
- Immediate state access without context

**State Management Pattern:**
```typescript
// Core game state
const [bird, setBird] = useState<Bird>({ ... });
const [pipes, setPipes] = useState<Pipe[]>([]);
const [gameState, setGameState] = useState<GameState>('playing');

// Performance-critical refs
const animationRef = useRef<number>();
const audioContextRef = useRef<AudioContext>();
```

### 4. **Progressive Enhancement Architecture**
**Decision:** Build in layers with graceful degradation
**Rationale:**
- Core game works without advanced features
- Features can be disabled for performance
- Better mobile device support
- Easier debugging and development

**Enhancement Layers:**
1. **Core:** Basic bird physics and collision detection
2. **Visual:** Gradients, shadows, particle effects
3. **Audio:** Sound effects and procedural music
4. **Performance:** Adaptive quality and monitoring
5. **Platform:** PWA features and mobile optimizations

## 🔧 Design Patterns

### 1. **Game Loop Pattern**
**Implementation:** requestAnimationFrame-based loop
```typescript
const gameLoop = useCallback((currentTime: number) => {
  const deltaTime = currentTime - lastTimeRef.current;
  
  // Update game state
  updatePhysics(deltaTime);
  updateAnimations(deltaTime);
  
  // Render frame
  render(canvasContext);
  
  // Schedule next frame
  animationRef.current = requestAnimationFrame(gameLoop);
}, [dependencies]);
```

**Benefits:**
- Smooth 60 FPS performance
- Automatic frame rate adaptation
- Efficient resource usage

### 2. **Object Pool Pattern**
**Usage:** Particle systems and temporary objects
```typescript
// Reuse particle objects instead of creating new ones
const updateParticles = () => {
  particles.forEach(particle => {
    if (particle.life <= 0) {
      // Reset and reuse instead of delete
      resetParticle(particle);
    }
  });
};
```

**Benefits:**
- Reduced garbage collection
- Consistent memory usage
- Better performance on mobile devices

### 3. **Adaptive Quality Pattern**
**Implementation:** Real-time performance monitoring with automatic adjustments
```typescript
const updateQualitySettings = (currentFps: number) => {
  if (currentFps < PERFORMANCE_THRESHOLD) {
    reduceParticleCount();
    disableExpensiveEffects();
  } else if (currentFps > GOOD_PERFORMANCE_THRESHOLD) {
    restoreQuality();
  }
};
```

**Benefits:**
- Maintains 60 FPS across devices
- Automatic optimization without user intervention
- Graceful degradation on lower-end devices

### 4. **Singleton Pattern for Audio**
**Usage:** Single AudioContext instance
```typescript
const audioContextRef = useRef<AudioContext | null>(null);

const initAudio = () => {
  if (!audioContextRef.current) {
    audioContextRef.current = new AudioContext();
  }
  return audioContextRef.current;
};
```

**Benefits:**
- Proper browser audio context management
- Resource efficiency
- Consistent audio state

## 🔗 Component Relationships

### Primary Data Flow
```
User Input → Game State Update → Physics Update → Rendering
     ↓              ↓               ↓            ↓
Audio Feedback ← Score Update ← Collision ← Visual Update
```

### State Dependencies
```
Bird State ←→ Physics System
     ↓
Collision Detection ←→ Pipe State
     ↓
Score Updates → Audio Feedback
     ↓
Visual Effects ← Particle System
```

### System Integration
```
Game Loop (Core)
├── Input System (keyboard, mouse, touch)
├── Physics System (gravity, collision)
├── Audio System (effects + music)
├── Visual System (rendering + effects)
├── Performance System (monitoring + adaptation)
└── Platform System (PWA + mobile features)
```

## ⚡ Performance Patterns

### 1. **Efficient Rendering**
- Single canvas context used throughout
- Batch drawing operations
- Minimize state changes (save/restore)
- Use appropriate drawing methods for each object type

### 2. **Memory Management**
- Object pooling for frequently created/destroyed objects
- Cleanup timers and event listeners
- Proper garbage collection triggers
- Memory usage monitoring

### 3. **Adaptive Systems**
- Real-time FPS monitoring
- Dynamic quality adjustment
- Mobile-specific optimizations
- Progressive feature loading

## 🏛️ Architectural Principles

### 1. **Simplicity Over Abstraction**
- Direct implementation preferred over complex architectures
- Minimal abstraction layers
- Clear, readable code structure
- Easy to debug and modify

### 2. **Performance First**
- 60 FPS is non-negotiable
- Optimize for the game loop
- Efficient state updates
- Minimize re-renders and calculations

### 3. **Progressive Enhancement**
- Core functionality works everywhere
- Advanced features add value incrementally
- Graceful degradation on limitations
- Platform-specific optimizations

### 4. **Self-Contained Components**
- Minimal external dependencies
- Clear component boundaries
- Predictable data flow
- Easy to test and maintain

## 🔮 Future Architecture Considerations

### Power-Up System Integration
- **Pattern:** Composition over inheritance for power-up effects
- **State:** Separate power-up state from core game state
- **Rendering:** Integrate with existing particle and visual systems
- **Performance:** Maintain 60 FPS with active power-ups

### Achievement System Architecture
- **Storage:** localStorage with optional cloud sync
- **Events:** Observer pattern for achievement triggers
- **UI:** Non-intrusive notification system
- **Performance:** Lightweight achievement checking

### Multiplayer Considerations (Future)
- **Architecture:** Client-server with authoritative server
- **State:** Separate local and networked state
- **Synchronization:** Delta compression for efficient updates
- **Fallback:** Single-player mode when offline 