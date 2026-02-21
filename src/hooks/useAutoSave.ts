import { useEffect, useRef } from 'react';

interface UseAutoSaveOptions {
  intervalMs: number;
  modified: boolean;
  onSave: () => void;
}

/**
 * Timer-based auto-save hook.
 * Triggers onSave callback periodically when content is modified.
 */
export function useAutoSave({ intervalMs, modified, onSave }: UseAutoSaveOptions): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  useEffect(() => {
    if (intervalMs <= 0 || !modified) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const tick = () => {
      onSaveRef.current();
      timerRef.current = setTimeout(tick, intervalMs);
    };

    timerRef.current = setTimeout(tick, intervalMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [intervalMs, modified]);
}
