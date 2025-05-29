# Technical Context

## 🛠️ Technologies Used

### Core Framework & Language
**Next.js 14+ with App Router**
- **Version:** Latest stable (14.x)
- **Router:** App Router (app/ directory structure)
- **Rendering:** Client-side rendering for game components
- **Build System:** Turbopack for fast development
- **Deployment:** Optimized for Vercel platform

**TypeScript**
- **Version:** 5.x+
- **Configuration:** Strict mode enabled
- **Benefits:** Type safety for game state, collision detection, audio APIs
- **Patterns:** Interface-driven development for game objects

**Tailwind CSS**
- **Version:** 3.x+
- **Usage:** UI styling, responsive design, utility classes
- **Customization:** Game-specific color palette and animations
- **Performance:** Purged CSS for optimal bundle size

### Game Technologies

**HTML5 Canvas API**
- **Context:** 2D rendering context
- **Performance:** Hardware-accelerated when available
- **Features:** Direct pixel manipulation, efficient rendering
- **Optimization:** Single canvas approach, minimal state changes

**Web Audio API**
- **Features:** Procedural sound generation, real-time audio effects
- **Implementation:** Direct oscillator and noise generation
- **Browser Support:** Modern browsers with fallback handling
- **Performance:** Efficient audio node management

**Browser APIs**
- **Performance API:** Frame rate monitoring, memory tracking
- **Intersection Observer:** Visibility detection for optimizations
- **Vibration API:** Haptic feedback on mobile devices
- **Service Worker API:** PWA functionality and offline support

### Development & Build Tools

**Package Manager**
- **Primary:** npm (Node Package Manager)
- **Lock File:** package-lock.json for consistent installs
- **Scripts:** Custom npm scripts for development and deployment

**Code Quality**
- **ESLint:** Code linting with TypeScript rules
- **Prettier:** Code formatting (integrated with ESLint)
- **TypeScript Compiler:** Static type checking

**Build & Bundle Optimization**
- **Next.js Compiler:** Built-in optimization and minification
- **Bundle Analyzer:** @next/bundle-analyzer for size analysis
- **Image Optimization:** Next.js automatic image optimization
- **Tree Shaking:** Automatic dead code elimination

## 📦 Dependencies

### Production Dependencies
```json
{
  "next": "^14.0.0",
  "react": "^18.0.0",
  "react-dom": "^18.0.0",
  "typescript": "^5.0.0"
}
```

### Development Dependencies
```json
{
  "@next/bundle-analyzer": "^14.0.0",
  "@types/node": "^20.0.0",
  "@types/react": "^18.0.0",
  "@types/react-dom": "^18.0.0",
  "autoprefixer": "^10.0.0",
  "eslint": "^8.0.0",
  "eslint-config-next": "^14.0.0",
  "postcss": "^8.0.0",
  "tailwindcss": "^3.0.0"
}
```

### Key Design Decision: Minimal Dependencies
**Philosophy:** Keep dependencies minimal to reduce bundle size and security surface
**Benefits:**
- Faster installation and builds
- Reduced security vulnerabilities
- Easier maintenance and updates
- Lower runtime overhead

## 🏗️ Development Setup

### Environment Requirements
- **Node.js:** 18.x+ (LTS recommended)
- **npm:** 9.x+ (comes with Node.js)
- **Browser:** Modern browsers with ES2020+ support
- **OS:** Cross-platform (Windows, macOS, Linux)

### Development Workflow
```bash
# Installation
npm install

# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Bundle analysis
npm run analyze
```

### Development Server Configuration
- **Port:** 3000-3003 (auto-increment if occupied)
- **Hot Reload:** Fast refresh for React components
- **Type Checking:** Real-time TypeScript error reporting
- **Performance:** Turbopack for fast bundling

## 🖥️ Browser Compatibility

### Target Browser Support
**Desktop:**
- Chrome 90+ (Primary target)
- Firefox 88+ (Full support)
- Safari 14+ (Full support)
- Edge 90+ (Full support)

**Mobile:**
- iOS Safari 14+ (Touch optimized)
- Chrome Mobile 90+ (Primary mobile target)
- Samsung Internet 15+ (Android)
- Firefox Mobile 88+ (Alternative)

### Feature Detection & Fallbacks
**Canvas API:** Required (no fallback - fundamental to game)
**Web Audio API:** Graceful degradation (visual-only mode)
**Vibration API:** Enhancement only (not required)
**Service Worker:** Progressive enhancement (PWA features)

### Performance Targets
- **Desktop:** 60 FPS minimum on mid-range hardware
- **Mobile:** 60 FPS on devices from 2020+
- **Memory:** <100MB total heap usage
- **Bundle:** <1MB JavaScript bundle size

## 🔧 Technical Constraints

### Performance Constraints
**Frame Rate:** Maintain 60 FPS across all target platforms
- Adaptive quality system reduces effects when FPS drops
- Mobile devices get reduced particle counts by default
- Performance monitoring provides real-time feedback

**Memory Usage:** Keep memory footprint reasonable
- Object pooling for frequently created objects
- Cleanup of event listeners and timers
- Monitoring of JavaScript heap size

**Network:** Optimize for initial load and offline usage
- Service worker caches all game assets
- No external API dependencies during gameplay
- Minimal bundle size for fast loading

### Browser API Limitations
**Audio Context:** Requires user interaction to start
- Handle suspended audio context state
- Initialize audio on first user input
- Graceful degradation if audio fails

**Canvas Performance:** Varies significantly across devices
- Adaptive quality based on measured performance
- Efficient rendering techniques (batch operations)
- Mobile-specific optimizations

**Local Storage:** Limited to 5-10MB in most browsers
- Efficient storage of high scores and settings
- Cleanup of old or corrupted data
- Fallback for storage quota exceeded

### Platform-Specific Considerations
**iOS Safari:**
- Audio context suspension policies
- Viewport meta tag requirements for PWA
- Home screen icon specifications

**Android Chrome:**
- Vibration API support and patterns
- PWA installation prompts
- Performance variation across devices

**Desktop Browsers:**
- Keyboard input handling
- Full-screen API support
- Mouse vs touch event handling

## 📱 PWA Technical Implementation

### Manifest Configuration
```json
{
  "name": "Flappy Bird Next.js",
  "short_name": "Flappy Bird",
  "description": "Modern Flappy Bird with procedural music",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#4ECDC4",
  "background_color": "#87CEEB",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### Service Worker Strategy
- **Cache First:** Static assets (JS, CSS, images)
- **Network First:** Game data and API calls
- **Offline Fallback:** Core game functionality available offline
- **Update Strategy:** Background updates with user notification

### Installation Criteria
- **Minimum Requirements:** Manifest + Service Worker + HTTPS
- **Enhancement:** Install prompt with custom UI
- **User Experience:** Seamless installation flow
- **Platform Integration:** Native app-like behavior

## 🚀 Deployment Configuration

### Vercel Deployment (Primary)
- **Framework:** Next.js automatic detection
- **Build Command:** `npm run build`
- **Output Directory:** `.next` (automatic)
- **Environment:** Node.js 18.x runtime

### Performance Optimizations
- **Code Splitting:** Automatic with Next.js
- **Image Optimization:** Next.js Image component
- **Asset Optimization:** Automatic compression and minification
- **Caching:** Aggressive caching for static assets

### Monitoring & Analytics
- **Performance:** Web Vitals monitoring
- **Errors:** Automatic error reporting
- **Usage:** PWA installation and usage tracking
- **Performance:** Real-time FPS and memory monitoring

## 🔮 Technical Roadmap

### Near-Term Enhancements
- **WebGL Renderer:** Optional WebGL mode for enhanced performance
- **Web Workers:** Background processing for complex calculations
- **IndexedDB:** Enhanced storage for achievements and progress
- **WebRTC:** Multiplayer functionality (future consideration)

### Performance Improvements
- **Offscreen Canvas:** Background rendering optimization
- **Web Assembly:** CPU-intensive calculations (if needed)
- **Streaming:** Progressive loading of game assets
- **Compression:** Advanced asset compression techniques

### Browser API Evolution
- **WebXR:** VR/AR modes (experimental)
- **File System Access:** Local file management
- **Screen Wake Lock:** Prevent screen sleep during gameplay
- **Gamepad API:** Controller support for enhanced input 