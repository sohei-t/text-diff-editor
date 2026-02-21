import { useCallback, useState } from 'react';
import type { SearchMatch, SearchState } from '../types';
import { escapeRegex } from '../utils/format';

interface UseSearchReturn extends SearchState {
  open: (showReplace?: boolean) => void;
  close: () => void;
  setQuery: (query: string) => void;
  toggleCaseSensitive: () => void;
  toggleRegex: () => void;
  performSearch: (text: string) => SearchMatch[];
  findNext: (text: string, textarea: HTMLTextAreaElement | null) => void;
  findPrevious: (text: string, textarea: HTMLTextAreaElement | null) => void;
  replace: (textarea: HTMLTextAreaElement | null) => void;
  replaceAll: (textarea: HTMLTextAreaElement | null) => number;
  replaceText: string;
  setReplaceText: (text: string) => void;
}

export function useSearch(): UseSearchReturn {
  const [state, setState] = useState<SearchState>({
    query: '',
    caseSensitive: false,
    useRegex: false,
    matches: [],
    currentIndex: -1,
    isOpen: false,
    showReplace: false,
  });
  const [replaceText, setReplaceText] = useState('');

  const open = useCallback((showReplace = false) => {
    setState((prev) => ({ ...prev, isOpen: true, showReplace: showReplace || prev.showReplace }));
  }, []);

  const close = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isOpen: false,
      showReplace: false,
      matches: [],
      currentIndex: -1,
    }));
  }, []);

  const setQuery = useCallback((query: string) => {
    setState((prev) => ({ ...prev, query }));
  }, []);

  const toggleCaseSensitive = useCallback(() => {
    setState((prev) => ({ ...prev, caseSensitive: !prev.caseSensitive }));
  }, []);

  const toggleRegex = useCallback(() => {
    setState((prev) => ({ ...prev, useRegex: !prev.useRegex }));
  }, []);

  const performSearch = useCallback(
    (text: string): SearchMatch[] => {
      if (!state.query || !text) {
        setState((prev) => ({ ...prev, matches: [], currentIndex: -1 }));
        return [];
      }

      try {
        let regex: RegExp;
        if (state.useRegex) {
          regex = new RegExp(state.query, state.caseSensitive ? 'g' : 'gi');
        } else {
          const escaped = escapeRegex(state.query);
          regex = new RegExp(escaped, state.caseSensitive ? 'g' : 'gi');
        }

        const matches: SearchMatch[] = [];
        let match: RegExpExecArray | null;
        while ((match = regex.exec(text)) !== null) {
          matches.push({ start: match.index, end: match.index + match[0].length });
          if (match[0].length === 0) break;
        }

        const currentIndex = matches.length > 0 ? 0 : -1;
        setState((prev) => ({ ...prev, matches, currentIndex }));
        return matches;
      } catch {
        setState((prev) => ({ ...prev, matches: [], currentIndex: -1 }));
        return [];
      }
    },
    [state.query, state.caseSensitive, state.useRegex]
  );

  const highlightCurrent = useCallback(
    (textarea: HTMLTextAreaElement | null, matches: SearchMatch[], index: number) => {
      if (!textarea || matches.length === 0 || index === -1) return;
      const match = matches[index];
      textarea.focus();
      textarea.setSelectionRange(match.start, match.end);

      const text = textarea.value.substring(0, match.start);
      const line = text.split('\n').length;
      const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) || 27;
      const targetScroll = (line - 5) * lineHeight;
      if (targetScroll > 0) {
        textarea.scrollTop = targetScroll;
      }
    },
    []
  );

  const findNext = useCallback(
    (text: string, textarea: HTMLTextAreaElement | null) => {
      const matches = performSearch(text);
      if (matches.length === 0) return;

      setState((prev) => {
        const nextIndex = (prev.currentIndex + 1) % matches.length;
        highlightCurrent(textarea, matches, nextIndex);
        return { ...prev, matches, currentIndex: nextIndex };
      });
    },
    [performSearch, highlightCurrent]
  );

  const findPrevious = useCallback(
    (text: string, textarea: HTMLTextAreaElement | null) => {
      const matches = performSearch(text);
      if (matches.length === 0) return;

      setState((prev) => {
        const nextIndex = prev.currentIndex <= 0 ? matches.length - 1 : prev.currentIndex - 1;
        highlightCurrent(textarea, matches, nextIndex);
        return { ...prev, matches, currentIndex: nextIndex };
      });
    },
    [performSearch, highlightCurrent]
  );

  const replace = useCallback(
    (textarea: HTMLTextAreaElement | null) => {
      if (!textarea || state.matches.length === 0 || state.currentIndex === -1) return;
      const match = state.matches[state.currentIndex];
      const text = textarea.value;
      textarea.value = text.substring(0, match.start) + replaceText + text.substring(match.end);
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    },
    [state.matches, state.currentIndex, replaceText]
  );

  const replaceAll = useCallback(
    (textarea: HTMLTextAreaElement | null): number => {
      if (!textarea || state.matches.length === 0) return 0;
      const count = state.matches.length;
      let text = textarea.value;
      for (let i = state.matches.length - 1; i >= 0; i--) {
        const match = state.matches[i];
        text = text.substring(0, match.start) + replaceText + text.substring(match.end);
      }
      textarea.value = text;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      return count;
    },
    [state.matches, replaceText]
  );

  return {
    ...state,
    open,
    close,
    setQuery,
    toggleCaseSensitive,
    toggleRegex,
    performSearch,
    findNext,
    findPrevious,
    replace,
    replaceAll,
    replaceText,
    setReplaceText,
  };
}
