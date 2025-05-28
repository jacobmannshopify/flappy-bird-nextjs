# AI Prompt Templates for Flappy Bird Development

This document contains successful prompt templates for AI-assisted development of our Flappy Bird game using Cursor IDE and Claude.

## Initial Setup Prompts

### Canvas Component Setup
```
Create a Next.js component with TypeScript that initializes an HTML5 canvas for a 2D game
```

### Game Loop Hook
```
Generate a custom React hook for managing game loop with requestAnimationFrame in Next.js
```

### Game State Structure
```
Design a TypeScript interface structure for Flappy Bird game state
```

## Physics Implementation Prompts

### Bird Physics
```
Implement frame-rate independent physics for a falling bird with gravity and jump mechanics
```

### Collision Detection
```
Create AABB collision detection between a bird sprite and rectangular pipe obstacles
```

### Movement Physics
```
Generate smooth movement physics with acceleration and terminal velocity
```

## State Management Prompts

### Zustand Store
```
Create a Zustand store for managing Flappy Bird game state with TypeScript
```

### Game State Transitions
```
Implement game state transitions (menu, playing, paused, game over) with proper TypeScript types
```

### Score System
```
Design a score tracking system with localStorage persistence
```

## Performance Optimization Prompts

### Canvas Rendering
```
Optimize canvas rendering for 60 FPS performance in a React component
```

### Object Pooling
```
Implement object pooling for pipe obstacles to reduce garbage collection
```

### Sprite Rendering
```
Create efficient sprite rendering system with minimal draw calls
```

## Testing Prompts

### Unit Tests
```
Generate Jest tests for collision detection functions
```

### Component Tests
```
Create React Testing Library tests for game component lifecycle
```

### Performance Tests
```
Design performance benchmarks for game loop consistency
```

## Best Practices

### When to Use Each Prompt
1. **Setup prompts** - Use during initial component creation
2. **Physics prompts** - Use when implementing game mechanics
3. **State prompts** - Use when building data flow
4. **Performance prompts** - Use during optimization phase
5. **Testing prompts** - Use throughout development

### Prompt Enhancement Tips
- Always specify TypeScript when asking for code
- Include performance requirements (60 FPS)
- Mention Next.js context for proper integration
- Ask for error handling and edge cases
- Request proper TypeScript interfaces

### Successful Patterns
- Start with simple implementations, then optimize
- Always ask for TypeScript types and interfaces
- Request component lifecycle considerations
- Include accessibility features when relevant
- Ask for mobile-friendly implementations 