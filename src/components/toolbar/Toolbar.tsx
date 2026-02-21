import React, { useCallback, useMemo, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useSplitContext } from '../../context/SplitContext';
import { useFileContext } from '../../context/FileContext';
import { formatTimeAgo } from '../../utils/format';
import type { RecentFile } from '../../types';

interface ToolbarProps {
  zoomLevel: number;
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onClose: () => void;
  onSearch: () => void;
  onFontDecrease: () => void;
  onFontIncrease: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onZoomSet: (level: number) => void;
  onDiffPrev: () => void;
  onDiffNext: () => void;
  onReopenRecent: (name: string) => void;
}

const THEME_ICONS: Record<string, string> = {
  light: '\u2600',
  dark: '\uD83C\uDF19',
  'high-contrast': '\uD83D\uDD76',
};

const THEME_LABELS: Record<string, string> = {
  light: 'Light',
  dark: 'Dark',
  'high-contrast': 'HC',
};

const Toolbar: React.FC<ToolbarProps> = React.memo(function Toolbar({
  zoomLevel,
  onNew,
  onOpen,
  onSave,
  onClose,
  onSearch,
  onFontDecrease,
  onFontIncrease,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onZoomSet,
  onDiffPrev,
  onDiffNext,
  onReopenRecent,
}) {
  const { theme, toggleTheme } = useTheme();
  const { paneCount, toggleSplit, syncScroll, setSyncScroll } = useSplitContext();
  const { getRecentFiles, clearRecentFiles } = useFileContext();
  const [recentOpen, setRecentOpen] = useState(false);

  const isSplit = paneCount >= 2;
  const zoomPercent = Math.round(zoomLevel * 100);

  const handleSyncToggle = useCallback(() => {
    setSyncScroll(!syncScroll);
  }, [syncScroll, setSyncScroll]);

  const splitLabel = useMemo(() => {
    if (paneCount === 3) return '3-Split';
    if (paneCount === 2) return '2-Split';
    return 'Split';
  }, [paneCount]);

  const recentFiles = useMemo(() => getRecentFiles(), [getRecentFiles]);

  const handleRecentToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setRecentOpen(!recentOpen);
    },
    [recentOpen]
  );

  const handleRecentClick = useCallback(
    (name: string) => {
      setRecentOpen(false);
      onReopenRecent(name);
    },
    [onReopenRecent]
  );

  const handleClearRecent = useCallback(() => {
    setRecentOpen(false);
    clearRecentFiles();
  }, [clearRecentFiles]);

  return (
    <div id="toolbar" role="toolbar" aria-label="Editor toolbar">
      {/* File group */}
      <div className="toolbar-group">
        <button className="toolbar-btn" title="New (Cmd+N)" aria-label="New file" onClick={onNew}>
          <span className="toolbar-icon">&#x1F4C4;</span>
          <span className="toolbar-label">New</span>
        </button>
        <div className="toolbar-open-group">
          <button className="toolbar-btn" title="Open (Cmd+O)" aria-label="Open file" onClick={onOpen}>
            <span className="toolbar-icon">&#x1F4C2;</span>
            <span className="toolbar-label">Open</span>
          </button>
          <button
            className="toolbar-btn toolbar-recent-arrow"
            title="Recent Files"
            aria-label="Recent files"
            aria-haspopup="true"
            aria-expanded={recentOpen}
            onClick={handleRecentToggle}
          >
            <span className="toolbar-icon toolbar-chevron">&#x25BE;</span>
          </button>
          {recentOpen && (
            <RecentDropdown
              files={recentFiles}
              onSelect={handleRecentClick}
              onClear={handleClearRecent}
            />
          )}
        </div>
        <button className="toolbar-btn" title="Save (Cmd+S)" aria-label="Save file" onClick={onSave}>
          <span className="toolbar-icon">&#x1F4BE;</span>
          <span className="toolbar-label">Save</span>
        </button>
        <button className="toolbar-btn" title="Close (Cmd+W)" aria-label="Close file" onClick={onClose}>
          <span className="toolbar-icon">&#x2715;</span>
          <span className="toolbar-label">Close</span>
        </button>
      </div>

      <div className="toolbar-separator" />

      {/* View group */}
      <div className="toolbar-group">
        <button
          className={`toolbar-btn${isSplit ? ' active' : ''}`}
          title="Split View (Cmd+\)"
          aria-label="Toggle split view"
          onClick={toggleSplit}
        >
          <span className="toolbar-icon">&#x2B1C;</span>
          <span className="toolbar-label">{splitLabel}</span>
        </button>
        <button
          className={`toolbar-btn${syncScroll ? ' active' : ''}`}
          title={
            syncScroll
              ? 'Sync: scroll & zoom together (click for independent)'
              : 'Independent: each panel scrolls & zooms separately (click for sync)'
          }
          aria-label="Toggle sync mode"
          aria-pressed={syncScroll}
          onClick={handleSyncToggle}
        >
          <span className="toolbar-icon">&#x1F517;</span>
          <span className="toolbar-label">{syncScroll ? 'Sync' : 'Indep'}</span>
        </button>
        {isSplit && (
          <>
            <button
              className="toolbar-btn"
              title="Previous Diff (Shift+F7)"
              aria-label="Previous difference"
              onClick={onDiffPrev}
            >
              <span className="toolbar-icon">&uarr;</span>
              <span className="toolbar-label">Prev</span>
            </button>
            <button
              className="toolbar-btn"
              title="Next Diff (F7)"
              aria-label="Next difference"
              onClick={onDiffNext}
            >
              <span className="toolbar-icon">&darr;</span>
              <span className="toolbar-label">Next</span>
            </button>
          </>
        )}
      </div>

      <div className="toolbar-separator" />

      {/* Search group */}
      <div className="toolbar-group">
        <button className="toolbar-btn" title="Search (Cmd+F)" aria-label="Search" onClick={onSearch}>
          <span className="toolbar-icon">&#x1F50D;</span>
          <span className="toolbar-label">Search</span>
        </button>
      </div>

      <div className="toolbar-separator" />

      {/* Theme group */}
      <div className="toolbar-group">
        <button className="toolbar-btn" title="Toggle Theme" aria-label="Toggle theme" onClick={toggleTheme}>
          <span className="toolbar-icon">{THEME_ICONS[theme] || THEME_ICONS.light}</span>
          <span className="toolbar-label">{THEME_LABELS[theme] || THEME_LABELS.light}</span>
        </button>
      </div>

      <div className="toolbar-separator" />

      {/* Font group */}
      <div className="toolbar-group">
        <button className="toolbar-btn" title="Decrease Font" aria-label="Decrease font size" onClick={onFontDecrease}>
          <span className="toolbar-icon">A-</span>
        </button>
        <button className="toolbar-btn" title="Increase Font" aria-label="Increase font size" onClick={onFontIncrease}>
          <span className="toolbar-icon">A+</span>
        </button>
      </div>

      <div className="toolbar-separator" />

      {/* Zoom group */}
      <div className="toolbar-group toolbar-zoom-group">
        <button className="toolbar-btn" title="Zoom Out" aria-label="Zoom out" onClick={onZoomOut}>
          <span className="toolbar-icon">&minus;</span>
        </button>
        <span
          className="toolbar-zoom-display"
          title="Click to reset zoom"
          onClick={onZoomReset}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onZoomReset();
            }
          }}
        >
          {zoomPercent}%
        </span>
        <button className="toolbar-btn" title="Zoom In" aria-label="Zoom in" onClick={onZoomIn}>
          <span className="toolbar-icon">&plus;</span>
        </button>
        <div className="zoom-presets">
          {[1.0, 1.5, 2.0, 3.0].map((level) => (
            <button
              key={level}
              className="zoom-preset-btn"
              onClick={() => onZoomSet(level)}
            >
              {Math.round(level * 100)}%
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

// Recent files dropdown sub-component
const RecentDropdown: React.FC<{
  files: RecentFile[];
  onSelect: (name: string) => void;
  onClear: () => void;
}> = React.memo(function RecentDropdown({ files, onSelect, onClear }) {
  if (files.length === 0) {
    return (
      <div className="recent-dropdown" role="menu" aria-label="Recent files">
        <div className="recent-empty">No recent files</div>
      </div>
    );
  }

  return (
    <div className="recent-dropdown" role="menu" aria-label="Recent files">
      {files.map((f) => (
        <button
          key={f.name}
          className="recent-item"
          role="menuitem"
          onClick={() => onSelect(f.name)}
        >
          <span className="recent-item-name">{f.name}</span>
          {f.time > 0 && <span className="recent-item-time">{formatTimeAgo(f.time)}</span>}
        </button>
      ))}
      <div className="recent-divider" />
      <button className="recent-item recent-clear" role="menuitem" onClick={onClear}>
        Clear History
      </button>
    </div>
  );
});

export default Toolbar;
