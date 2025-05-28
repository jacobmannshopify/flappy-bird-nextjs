'use client';

import { useEffect, useRef, useState } from 'react';

interface PerformanceMetrics {
  fps: number;
  avgFps: number;
  frameTime: number;
  memoryUsage: number;
  particleCount: number;
  renderTime: number;
  gameObjects: number;
  devicePixelRatio: number;
  canvasSize: string;
  timestamp: number;
}

interface PerformanceMonitorProps {
  particleCount: number;
  gameObjects: number;
  canvasWidth: number;
  canvasHeight: number;
  isVisible?: boolean;
}

const PerformanceMonitor = ({ 
  particleCount, 
  gameObjects, 
  canvasWidth, 
  canvasHeight,
  isVisible = true 
}: PerformanceMonitorProps) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    avgFps: 0,
    frameTime: 0,
    memoryUsage: 0,
    particleCount: 0,
    renderTime: 0,
    gameObjects: 0,
    devicePixelRatio: 1,
    canvasSize: '',
    timestamp: 0
  });

  const [showDetails, setShowDetails] = useState(false);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const fpsHistoryRef = useRef<number[]>([]);
  const renderStartTimeRef = useRef(0);
  const performanceObserverRef = useRef<PerformanceObserver | null>(null);

  // Track render performance
  const markRenderStart = () => {
    renderStartTimeRef.current = performance.now();
  };

  const markRenderEnd = () => {
    const renderTime = performance.now() - renderStartTimeRef.current;
    return renderTime;
  };

  useEffect(() => {
    // Set up performance observer for navigation and resource timing
    if ('PerformanceObserver' in window) {
      performanceObserverRef.current = new PerformanceObserver((list) => {
        // Handle performance entries if needed
      });
    }

    const updateMetrics = () => {
      const now = performance.now();
      const deltaTime = now - lastTimeRef.current;
      
      if (deltaTime >= 1000) { // Update every second
        frameCountRef.current += 1;
        const fps = Math.round((frameCountRef.current * 1000) / deltaTime);
        
        // Add to FPS history for averaging
        fpsHistoryRef.current.push(fps);
        if (fpsHistoryRef.current.length > 10) {
          fpsHistoryRef.current.shift();
        }
        
        const avgFps = Math.round(
          fpsHistoryRef.current.reduce((a, b) => a + b, 0) / fpsHistoryRef.current.length
        );

        // Get memory usage (if available)
        let memoryUsage = 0;
        if ('memory' in performance) {
          const memory = (performance as any).memory;
          memoryUsage = Math.round(memory.usedJSHeapSize / 1024 / 1024); // MB
        }

        // Calculate render time
        const renderTime = markRenderEnd();

        setMetrics({
          fps,
          avgFps,
          frameTime: Math.round(deltaTime / frameCountRef.current * 100) / 100,
          memoryUsage,
          particleCount,
          renderTime: Math.round(renderTime * 100) / 100,
          gameObjects,
          devicePixelRatio: window.devicePixelRatio || 1,
          canvasSize: `${canvasWidth}x${canvasHeight}`,
          timestamp: now
        });

        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      markRenderStart();
      requestAnimationFrame(updateMetrics);
    };

    const animationId = requestAnimationFrame(updateMetrics);

    return () => {
      cancelAnimationFrame(animationId);
      if (performanceObserverRef.current) {
        performanceObserverRef.current.disconnect();
      }
    };
  }, [particleCount, gameObjects, canvasWidth, canvasHeight]);

  // Performance status based on FPS
  const getPerformanceStatus = (fps: number) => {
    if (fps >= 55) return { status: 'Excellent', color: 'text-green-500', bgColor: 'bg-green-100' };
    if (fps >= 45) return { status: 'Good', color: 'text-yellow-500', bgColor: 'bg-yellow-100' };
    if (fps >= 30) return { status: 'Fair', color: 'text-orange-500', bgColor: 'bg-orange-100' };
    return { status: 'Poor', color: 'text-red-500', bgColor: 'bg-red-100' };
  };

  const performanceStatus = getPerformanceStatus(metrics.fps);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* Compact view */}
      <div 
        className={`${performanceStatus.bgColor} rounded-lg px-3 py-2 shadow-lg cursor-pointer transition-all hover:shadow-xl`}
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${metrics.fps >= 55 ? 'bg-green-500' : metrics.fps >= 30 ? 'bg-yellow-500' : 'bg-red-500'}`} />
          <span className="font-mono text-sm font-bold">
            {metrics.fps} FPS
          </span>
          <span className="text-xs opacity-70">
            {showDetails ? '▼' : '▶'}
          </span>
        </div>
      </div>

      {/* Detailed view */}
      {showDetails && (
        <div className="mt-2 bg-white rounded-lg shadow-xl border p-4 min-w-64">
          <div className="text-sm font-bold mb-3 flex items-center justify-between">
            <span>Performance Metrics</span>
            <span className={`px-2 py-1 rounded text-xs ${performanceStatus.color} ${performanceStatus.bgColor}`}>
              {performanceStatus.status}
            </span>
          </div>
          
          <div className="space-y-2 text-xs font-mono">
            {/* FPS Metrics */}
            <div className="flex justify-between">
              <span className="text-gray-600">Current FPS:</span>
              <span className="font-bold">{metrics.fps}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Average FPS:</span>
              <span className="font-bold">{metrics.avgFps}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Frame Time:</span>
              <span className="font-bold">{metrics.frameTime}ms</span>
            </div>
            
            <hr className="my-2" />
            
            {/* Render Metrics */}
            <div className="flex justify-between">
              <span className="text-gray-600">Render Time:</span>
              <span className="font-bold">{metrics.renderTime}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Particles:</span>
              <span className="font-bold">{metrics.particleCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Game Objects:</span>
              <span className="font-bold">{metrics.gameObjects}</span>
            </div>
            
            <hr className="my-2" />
            
            {/* System Metrics */}
            <div className="flex justify-between">
              <span className="text-gray-600">Memory:</span>
              <span className="font-bold">{metrics.memoryUsage}MB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Canvas:</span>
              <span className="font-bold">{metrics.canvasSize}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">DPR:</span>
              <span className="font-bold">{metrics.devicePixelRatio}x</span>
            </div>
          </div>

          {/* Performance Recommendations */}
          {metrics.fps < 45 && (
            <div className="mt-3 p-2 bg-yellow-50 rounded border-l-2 border-yellow-400">
              <div className="text-xs font-bold text-yellow-800">Performance Tips:</div>
              <div className="text-xs text-yellow-700 mt-1">
                {metrics.particleCount > 20 && "• Reduce particle effects"}
                {metrics.renderTime > 16 && "• Optimize rendering"}
                {metrics.memoryUsage > 50 && "• Check memory usage"}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitor; 