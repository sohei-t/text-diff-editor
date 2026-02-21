import { useEffect } from 'react';

interface ShortcutHandlers {
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onClose: () => void;
  onSearch: () => void;
  onSearchReplace: () => void;
  onToggleSplit: () => void;
  onFontIncrease: () => void;
  onFontDecrease: () => void;
  onResetZoom: () => void;
  onDiffNext: () => void;
  onDiffPrev: () => void;
}

/**
 * Hook for registering global keyboard shortcuts.
 */
export function useKeyboardShortcuts(handlers: ShortcutHandlers): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key === 'n') {
        e.preventDefault();
        handlers.onNew();
      } else if (mod && e.key === 'o') {
        e.preventDefault();
        handlers.onOpen();
      } else if (mod && e.key === 's') {
        e.preventDefault();
        handlers.onSave();
      } else if (mod && e.key === 'w') {
        e.preventDefault();
        handlers.onClose();
      } else if (mod && e.key === 'f') {
        e.preventDefault();
        handlers.onSearch();
      } else if (mod && e.key === 'h') {
        e.preventDefault();
        handlers.onSearchReplace();
      } else if (mod && e.key === '\\') {
        e.preventDefault();
        handlers.onToggleSplit();
      } else if (mod && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        handlers.onFontIncrease();
      } else if (mod && e.key === '-') {
        e.preventDefault();
        handlers.onFontDecrease();
      } else if (mod && e.key === '0') {
        e.preventDefault();
        handlers.onResetZoom();
      } else if (e.key === 'F7' && !e.shiftKey) {
        e.preventDefault();
        handlers.onDiffNext();
      } else if (e.key === 'F7' && e.shiftKey) {
        e.preventDefault();
        handlers.onDiffPrev();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}
