import { useCallback, useEffect, useRef } from 'react';

interface UseSplitterOptions {
  onResize: (ratio: number) => void;
  containerRef: React.RefObject<HTMLElement | null>;
}

interface UseSplitterReturn {
  splitterRef: React.RefObject<HTMLDivElement | null>;
}

export function useSplitter({ onResize, containerRef }: UseSplitterOptions): UseSplitterReturn {
  const splitterRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    e.preventDefault();
    draggingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const splitter = splitterRef.current;
    if (!splitter) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      onResize(pos);
    };

    const handleMouseUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    splitter.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      splitter.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseDown, onResize, containerRef]);

  return { splitterRef };
}
