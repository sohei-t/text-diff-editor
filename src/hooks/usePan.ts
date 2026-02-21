import { useCallback, useEffect, useRef, useState } from 'react';

interface UsePanOptions {
  friction?: number;
}

interface UsePanReturn {
  isPanning: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function usePan(
  containerRef: React.RefObject<HTMLDivElement | null>,
  options: UsePanOptions = {}
): UsePanReturn {
  const { friction = 0.95 } = options;
  const [isPanning, setIsPanning] = useState(false);
  const panningRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const velocityRef = useRef({ x: 0, y: 0 });
  const inertiaFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onMouseDown = (e: MouseEvent) => {
      if (!e.altKey) return;
      e.preventDefault();
      panningRef.current = true;
      setIsPanning(true);
      lastPosRef.current = { x: e.clientX, y: e.clientY };
      velocityRef.current = { x: 0, y: 0 };
      if (inertiaFrameRef.current !== null) cancelAnimationFrame(inertiaFrameRef.current);
      container.style.cursor = 'grabbing';
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!panningRef.current) return;
      e.preventDefault();

      const dx = e.clientX - lastPosRef.current.x;
      const dy = e.clientY - lastPosRef.current.y;

      const textarea = container.querySelector<HTMLTextAreaElement>('.editor-textarea');
      if (textarea) {
        textarea.scrollLeft -= dx;
        textarea.scrollTop -= dy;
      }

      velocityRef.current = { x: dx, y: dy };
      lastPosRef.current = { x: e.clientX, y: e.clientY };
    };

    const startInertia = () => {
      const textarea = container.querySelector<HTMLTextAreaElement>('.editor-textarea');
      if (!textarea) return;

      const animate = () => {
        if (Math.abs(velocityRef.current.x) < 0.5 && Math.abs(velocityRef.current.y) < 0.5) return;

        textarea.scrollLeft -= velocityRef.current.x;
        textarea.scrollTop -= velocityRef.current.y;

        velocityRef.current.x *= friction;
        velocityRef.current.y *= friction;

        inertiaFrameRef.current = requestAnimationFrame(animate);
      };

      inertiaFrameRef.current = requestAnimationFrame(animate);
    };

    const onMouseUp = () => {
      if (!panningRef.current) return;
      panningRef.current = false;
      setIsPanning(false);
      container.style.cursor = '';
      startInertia();
    };

    container.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    return () => {
      container.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      if (inertiaFrameRef.current !== null) cancelAnimationFrame(inertiaFrameRef.current);
    };
  }, [containerRef, friction]);

  return { isPanning, containerRef };
}
