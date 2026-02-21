import { useCallback, useRef } from 'react';

interface UndoRedoReturn {
  pushState: (content: string) => void;
  undo: (currentContent: string) => string | null;
  redo: (currentContent: string) => string | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

const MAX_HISTORY = 1000;

/**
 * Custom hook for undo/redo with a 1000-level stack.
 */
export function useUndoRedo(): UndoRedoReturn {
  const undoStackRef = useRef<string[]>([]);
  const redoStackRef = useRef<string[]>([]);
  const lastContentRef = useRef('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pushState = useCallback((content: string) => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (content !== lastContentRef.current) {
        undoStackRef.current.push(lastContentRef.current);
        if (undoStackRef.current.length > MAX_HISTORY) {
          undoStackRef.current.shift();
        }
        redoStackRef.current = [];
        lastContentRef.current = content;
      }
    }, 300);
  }, []);

  const undo = useCallback((currentContent: string): string | null => {
    if (undoStackRef.current.length === 0) return null;
    redoStackRef.current.push(currentContent);
    const prev = undoStackRef.current.pop()!;
    lastContentRef.current = prev;
    return prev;
  }, []);

  const redo = useCallback((currentContent: string): string | null => {
    if (redoStackRef.current.length === 0) return null;
    undoStackRef.current.push(currentContent);
    const next = redoStackRef.current.pop()!;
    lastContentRef.current = next;
    return next;
  }, []);

  const canUndo = useCallback(() => undoStackRef.current.length > 0, []);
  const canRedo = useCallback(() => redoStackRef.current.length > 0, []);

  return { pushState, undo, redo, canUndo, canRedo };
}
