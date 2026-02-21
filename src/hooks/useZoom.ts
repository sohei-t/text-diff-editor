import { useCallback, useEffect, useRef, useState } from 'react';
import { clamp } from '../utils/clamp';

interface UseZoomOptions {
  minZoom?: number;
  maxZoom?: number;
  baseFontSize?: number;
  zoomStep?: number;
}

interface UseZoomReturn {
  level: number;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  setZoom: (level: number) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function useZoom(options: UseZoomOptions = {}): UseZoomReturn {
  const { minZoom = 0.5, maxZoom = 4.0, baseFontSize = 18, zoomStep = 0.008 } = options;
  const [level, setLevel] = useState(1.0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const zoomTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cmdPressedRef = useRef(false);

  const commitZoom = useCallback(
    (newLevel: number) => {
      const newSize = Math.round(baseFontSize * newLevel);
      const lineH = Math.round(newSize * 1.5);
      const container = containerRef.current;
      if (!container) return;

      container.querySelectorAll<HTMLElement>('.editor-textarea, .line-numbers').forEach((el) => {
        el.style.fontSize = `${newSize}px`;
        el.style.lineHeight = `${lineH}px`;
      });

      container.style.transform = 'scale(1)';
      container.style.transformOrigin = 'center center';
      container.style.willChange = 'auto';
    },
    [baseFontSize]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Meta') cmdPressedRef.current = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Meta') cmdPressedRef.current = false;
    };
    const onBlur = () => {
      cmdPressedRef.current = false;
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      const isZoom = e.ctrlKey || e.metaKey || cmdPressedRef.current;
      if (!isZoom) return;

      e.preventDefault();
      const delta = -e.deltaY * zoomStep;

      setLevel((current) => {
        const newLevel = clamp(current + delta, minZoom, maxZoom);
        if (Math.abs(newLevel - current) < 0.001) return current;

        // CSS transform for smooth zoom
        const rect = container.getBoundingClientRect();
        const ox = ((e.clientX - rect.left) / rect.width) * 100;
        const oy = ((e.clientY - rect.top) / rect.height) * 100;

        requestAnimationFrame(() => {
          container.style.transformOrigin = `${ox}% ${oy}%`;
          container.style.transform = `scale(${newLevel})`;
          container.style.willChange = 'transform';
        });

        // Commit to font size after zoom stops
        if (zoomTimerRef.current) clearTimeout(zoomTimerRef.current);
        zoomTimerRef.current = setTimeout(() => commitZoom(newLevel), 200);

        return newLevel;
      });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [minZoom, maxZoom, zoomStep, commitZoom]);

  const zoomIn = useCallback(() => {
    setLevel((current) => {
      const newLevel = clamp(current + 0.25, minZoom, maxZoom);
      commitZoom(newLevel);
      return newLevel;
    });
  }, [minZoom, maxZoom, commitZoom]);

  const zoomOut = useCallback(() => {
    setLevel((current) => {
      const newLevel = clamp(current - 0.25, minZoom, maxZoom);
      commitZoom(newLevel);
      return newLevel;
    });
  }, [minZoom, maxZoom, commitZoom]);

  const resetZoom = useCallback(() => {
    setLevel(1.0);
    commitZoom(1.0);
  }, [commitZoom]);

  const setZoom = useCallback(
    (newLevel: number) => {
      const clamped = clamp(newLevel, minZoom, maxZoom);
      setLevel(clamped);
      commitZoom(clamped);
    },
    [minZoom, maxZoom, commitZoom]
  );

  return { level, zoomIn, zoomOut, resetZoom, setZoom, containerRef };
}
