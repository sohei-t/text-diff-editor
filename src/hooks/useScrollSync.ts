import { useCallback, useRef } from 'react';

/**
 * Hook for syncing scroll position between two textareas proportionally.
 */
export function useScrollSync(enabled: boolean) {
  const isScrollingRef = useRef(false);

  const handleScroll = useCallback(
    (
      sourceRef: React.RefObject<HTMLTextAreaElement | null>,
      targetRef: React.RefObject<HTMLTextAreaElement | null>
    ) => {
      if (!enabled || isScrollingRef.current) return;
      const source = sourceRef.current;
      const target = targetRef.current;
      if (!source || !target) return;

      isScrollingRef.current = true;
      const scrollRatio =
        source.scrollHeight > 0 ? source.scrollTop / source.scrollHeight : 0;
      target.scrollTop = scrollRatio * target.scrollHeight;

      requestAnimationFrame(() => {
        isScrollingRef.current = false;
      });
    },
    [enabled]
  );

  return { handleScroll };
}
