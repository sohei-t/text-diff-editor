import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { DiffEngine } from '../engine/DiffEngine';
import type { DiffChange, DiffResult, DiffStats } from '../types';

interface DiffContextValue {
  diffResult: DiffResult | null;
  computeDiff: (textA: string, textB: string) => void;
  clearDiff: () => void;
  changes: DiffChange[];
  stats: DiffStats | null;
  currentChangeIndex: number;
  navigateDiff: (direction: 'next' | 'prev') => DiffChange | null;
  diffChangesOnly: DiffChange[];
}

const DiffContext = createContext<DiffContextValue | null>(null);

export function DiffProvider({ children }: { children: ReactNode }) {
  const engineRef = useRef(new DiffEngine());
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
  const [currentChangeIndex, setCurrentChangeIndex] = useState(-1);

  const computeDiff = useCallback((textA: string, textB: string) => {
    const result = engineRef.current.computeLineDiff(textA, textB);
    setDiffResult(result);
    setCurrentChangeIndex(-1);
  }, []);

  const clearDiff = useCallback(() => {
    setDiffResult(null);
    setCurrentChangeIndex(-1);
  }, []);

  const changes = useMemo(() => diffResult?.changes ?? [], [diffResult]);
  const stats = useMemo(() => diffResult?.stats ?? null, [diffResult]);

  const diffChangesOnly = useMemo(
    () => changes.filter((c) => c.type !== 'equal'),
    [changes]
  );

  const navigateDiff = useCallback(
    (direction: 'next' | 'prev'): DiffChange | null => {
      if (diffChangesOnly.length === 0) return null;

      let nextIndex: number;
      if (direction === 'next') {
        nextIndex = (currentChangeIndex + 1) % diffChangesOnly.length;
      } else {
        nextIndex =
          currentChangeIndex <= 0 ? diffChangesOnly.length - 1 : currentChangeIndex - 1;
      }

      setCurrentChangeIndex(nextIndex);
      return diffChangesOnly[nextIndex];
    },
    [diffChangesOnly, currentChangeIndex]
  );

  return (
    <DiffContext.Provider
      value={{
        diffResult,
        computeDiff,
        clearDiff,
        changes,
        stats,
        currentChangeIndex,
        navigateDiff,
        diffChangesOnly,
      }}
    >
      {children}
    </DiffContext.Provider>
  );
}

export function useDiffContext(): DiffContextValue {
  const ctx = useContext(DiffContext);
  if (!ctx) throw new Error('useDiffContext must be used within DiffProvider');
  return ctx;
}
