import { useEffect } from 'react';
import { useDiffContext } from '../context/DiffContext';
import { useDebouncedCallback } from './useDebounce';

/**
 * Manages debounced diff computation when in split mode.
 * Automatically computes diff when content changes, and clears diff when not in split mode.
 */
export function useDiffComputation(
  isSplit: boolean,
  leftContent: string,
  rightContent: string
): void {
  const { computeDiff, clearDiff } = useDiffContext();

  const debouncedComputeDiff = useDebouncedCallback(
    (textA: string, textB: string) => computeDiff(textA, textB),
    150
  );

  useEffect(() => {
    if (isSplit) {
      debouncedComputeDiff(leftContent, rightContent);
    } else {
      clearDiff();
    }
  }, [isSplit, leftContent, rightContent, debouncedComputeDiff, clearDiff]);
}
