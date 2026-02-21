import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import type { PaneCount } from '../types';

interface SplitContextValue {
  paneCount: PaneCount;
  setPaneCount: (count: PaneCount) => void;
  toggleSplit: () => void;
  splitRatio: number;
  setSplitRatio: (ratio: number) => void;
  syncScroll: boolean;
  setSyncScroll: (enabled: boolean) => void;
  tripleR1: number;
  tripleR2: number;
  setTripleR1: (r: number) => void;
  setTripleR2: (r: number) => void;
}

const SplitContext = createContext<SplitContextValue | null>(null);

export function SplitProvider({ children }: { children: ReactNode }) {
  const [paneCount, setPaneCountState] = useState<PaneCount>(0);
  const [splitRatio, setSplitRatioState] = useState(0.5);
  const [syncScroll, setSyncScroll] = useState(true);
  const [tripleR1, setTripleR1] = useState(1 / 3);
  const [tripleR2, setTripleR2] = useState(2 / 3);

  const setPaneCount = useCallback((count: PaneCount) => {
    setPaneCountState(count);
  }, []);

  const toggleSplit = useCallback(() => {
    setPaneCountState((current) => {
      if (current === 0) return 2;
      if (current === 2) return 3;
      return 0;
    });
  }, []);

  const setSplitRatio = useCallback((ratio: number) => {
    setSplitRatioState(Math.min(Math.max(ratio, 0.2), 0.8));
  }, []);

  return (
    <SplitContext.Provider
      value={{
        paneCount,
        setPaneCount,
        toggleSplit,
        splitRatio,
        setSplitRatio,
        syncScroll,
        setSyncScroll,
        tripleR1,
        tripleR2,
        setTripleR1,
        setTripleR2,
      }}
    >
      {children}
    </SplitContext.Provider>
  );
}

export function useSplitContext(): SplitContextValue {
  const ctx = useContext(SplitContext);
  if (!ctx) throw new Error('useSplitContext must be used within SplitProvider');
  return ctx;
}
