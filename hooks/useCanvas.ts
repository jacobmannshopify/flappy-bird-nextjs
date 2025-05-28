import { useEffect, useRef, useCallback, useState } from 'react';
import { CanvasContext } from '@/types/game';
import { RENDERING } from '@/constants/game';

interface UseCanvasOptions {
  width: number;
  height: number;
  maintainAspectRatio?: boolean;
  pixelPerfect?: boolean;
  enableHighDPI?: boolean;
}

interface UseCanvasReturn {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  context: CanvasRenderingContext2D | null;
  actualWidth: number;
  actualHeight: number;
  scale: number;
  isReady: boolean;
  clearCanvas: () => void;
  resizeCanvas: (newWidth: number, newHeight: number) => void;
}

export const useCanvas = (options: UseCanvasOptions): UseCanvasReturn => {
  const {
    width,
    height,
    maintainAspectRatio = true,
    pixelPerfect = true,
    enableHighDPI = true,
  } = options;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [actualWidth, setActualWidth] = useState(width);
  const [actualHeight, setActualHeight] = useState(height);
  const [scale, setScale] = useState(1);
  const [isReady, setIsReady] = useState(false);

  // Clear canvas utility function
  const clearCanvas = useCallback(() => {
    if (context) {
      context.clearRect(0, 0, actualWidth, actualHeight);
    }
  }, [context, actualWidth, actualHeight]);

  // Resize canvas utility function
  const resizeCanvas = useCallback((newWidth: number, newHeight: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !context) return;

    const pixelRatio = enableHighDPI ? RENDERING.PIXEL_RATIO : 1;
    
    // Update canvas dimensions
    canvas.width = newWidth * pixelRatio;
    canvas.height = newHeight * pixelRatio;
    
    // Update CSS dimensions
    canvas.style.width = `${newWidth}px`;
    canvas.style.height = `${newHeight}px`;
    
    // Scale context for high DPI displays
    if (pixelRatio !== 1) {
      context.scale(pixelRatio, pixelRatio);
    }
    
    // Configure rendering settings
    if (pixelPerfect) {
      context.imageSmoothingEnabled = false;
      if ('webkitImageSmoothingEnabled' in context) {
        (context as any).webkitImageSmoothingEnabled = false;
      }
      if ('mozImageSmoothingEnabled' in context) {
        (context as any).mozImageSmoothingEnabled = false;
      }
    }
    
    setActualWidth(newWidth);
    setActualHeight(newHeight);
    setScale(pixelRatio);
  }, [context, enableHighDPI, pixelPerfect]);

  // Initialize canvas and context
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Get 2D rendering context
    const ctx = canvas.getContext('2d', {
      alpha: false, // Improve performance if we don't need transparency
      desynchronized: true, // Better performance for animations
    });

    if (!ctx) {
      console.error('Failed to get 2D rendering context');
      return;
    }

    setContext(ctx);
    setIsReady(true);

    // Initial setup
    resizeCanvas(width, height);

  }, [width, height, resizeCanvas]);

  // Handle responsive behavior
  useEffect(() => {
    if (!maintainAspectRatio || !canvasRef.current) return;

    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const container = canvas.parentElement;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const aspectRatio = width / height;
      
      let newWidth = containerRect.width;
      let newHeight = newWidth / aspectRatio;
      
      // If height exceeds container, scale by height instead
      if (newHeight > containerRect.height) {
        newHeight = containerRect.height;
        newWidth = newHeight * aspectRatio;
      }
      
      // Update CSS dimensions (not canvas internal dimensions)
      canvas.style.width = `${newWidth}px`;
      canvas.style.height = `${newHeight}px`;
    };

    // Initial resize
    handleResize();
    
    // Listen for window resize
    window.addEventListener('resize', handleResize);
    
    // Use ResizeObserver if available for better performance
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(handleResize);
      const container = canvasRef.current.parentElement;
      if (container) {
        resizeObserver.observe(container);
      }
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [maintainAspectRatio, width, height]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (context) {
        clearCanvas();
      }
      setContext(null);
      setIsReady(false);
    };
  }, [context, clearCanvas]);

  return {
    canvasRef,
    context,
    actualWidth,
    actualHeight,
    scale,
    isReady,
    clearCanvas,
    resizeCanvas,
  };
}; 