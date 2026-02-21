import React, { useCallback, useEffect, useRef } from 'react';
import type { SearchMatch } from '../../types';

interface SearchBarProps {
  isOpen: boolean;
  showReplace: boolean;
  query: string;
  caseSensitive: boolean;
  useRegex: boolean;
  matches: SearchMatch[];
  currentIndex: number;
  replaceText: string;
  onQueryChange: (query: string) => void;
  onToggleCaseSensitive: () => void;
  onToggleRegex: () => void;
  onFindNext: () => void;
  onFindPrevious: () => void;
  onReplace: () => void;
  onReplaceAll: () => void;
  onReplaceTextChange: (text: string) => void;
  onClose: () => void;
}

const SearchBar: React.FC<SearchBarProps> = React.memo(function SearchBar({
  isOpen,
  showReplace,
  query,
  caseSensitive,
  useRegex,
  matches,
  currentIndex,
  replaceText,
  onQueryChange,
  onToggleCaseSensitive,
  onToggleRegex,
  onFindNext,
  onFindPrevious,
  onReplace,
  onReplaceAll,
  onReplaceTextChange,
  onClose,
}) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      searchInputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onFindNext();
      } else if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        onFindPrevious();
      } else if (e.key === 'Escape') {
        onClose();
      }
    },
    [onFindNext, onFindPrevious, onClose]
  );

  const handleReplaceKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  const matchCountText = (() => {
    if (matches.length === 0) {
      return query ? 'No results' : '0 results';
    }
    return `${currentIndex + 1} / ${matches.length}`;
  })();

  if (!isOpen) return null;

  return (
    <div id="search-bar" role="search" aria-label="Search and replace">
      <div className="search-row">
        <div className="search-input-group">
          <span className="search-icon">&#x1F50D;</span>
          <input
            ref={searchInputRef}
            type="text"
            className="search-field"
            placeholder="Search..."
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
        </div>
        <button
          className={`search-toggle-btn${caseSensitive ? ' active' : ''}`}
          title="Match Case (Aa)"
          aria-pressed={caseSensitive}
          onClick={onToggleCaseSensitive}
        >
          Aa
        </button>
        <button
          className={`search-toggle-btn${useRegex ? ' active' : ''}`}
          title="Regular Expression (.*)"
          aria-pressed={useRegex}
          onClick={onToggleRegex}
        >
          .*
        </button>
        <button className="search-nav-btn" title="Previous Match" onClick={onFindPrevious}>
          &uarr;
        </button>
        <button className="search-nav-btn" title="Next Match" onClick={onFindNext}>
          &darr;
        </button>
        <span className="search-match-count">{matchCountText}</span>
        <button className="search-close-btn" title="Close" onClick={onClose}>
          &times;
        </button>
      </div>
      {showReplace && (
        <div className="search-row replace-row">
          <div className="search-input-group">
            <span className="search-icon" style={{ opacity: 0 }}>
              &#x1F50D;
            </span>
            <input
              type="text"
              className="search-field"
              placeholder="Replace..."
              autoComplete="off"
              spellCheck={false}
              value={replaceText}
              onChange={(e) => onReplaceTextChange(e.target.value)}
              onKeyDown={handleReplaceKeyDown}
            />
          </div>
          <button className="search-action-btn" title="Replace" onClick={onReplace}>
            Replace
          </button>
          <button className="search-action-btn" title="Replace All" onClick={onReplaceAll}>
            All
          </button>
        </div>
      )}
    </div>
  );
});

export default SearchBar;
