import React from 'react';
import type { CursorPosition, DiffStats } from '../../types';

interface StatusBarProps {
  fileName: string;
  modified: boolean;
  cursorPosition: CursorPosition;
  zoomLevel: number;
  isSplit: boolean;
  diffStats: DiffStats | null;
  diffNavInfo: { index: number; total: number } | null;
  onZoomReset: () => void;
}

const StatusBar: React.FC<StatusBarProps> = React.memo(function StatusBar({
  fileName,
  modified,
  cursorPosition,
  zoomLevel,
  isSplit,
  diffStats,
  diffNavInfo,
  onZoomReset,
}) {
  const zoomPercent = Math.round(zoomLevel * 100);

  const diffStatsText = (() => {
    if (diffNavInfo) {
      return `Diff ${diffNavInfo.index + 1}/${diffNavInfo.total}`;
    }
    if (!diffStats) return null;
    const total = diffStats.added + diffStats.deleted + diffStats.modified;
    return `+${diffStats.added} -${diffStats.deleted} ~${diffStats.modified} (${total} changes)`;
  })();

  return (
    <div id="status-bar" role="status" aria-label="Editor status">
      <div className="status-left">
        <span className="status-item" title="File name">
          {fileName}
        </span>
        {modified && (
          <span className="status-item status-modified" title="Unsaved changes">
            &bull;
          </span>
        )}
      </div>
      <div className="status-center">
        <span className="status-item" title="Cursor position">
          Ln {cursorPosition.line}, Col {cursorPosition.column}
        </span>
        <span className="status-item">UTF-8</span>
        {diffStatsText && (
          <span className="status-item" aria-live="polite">
            {diffStatsText}
          </span>
        )}
      </div>
      <div className="status-right">
        <span
          className="status-item status-zoom"
          title="Zoom level (click to reset)"
          role="button"
          tabIndex={0}
          aria-label={`Zoom ${zoomPercent}%, click to reset`}
          onClick={onZoomReset}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onZoomReset();
            }
          }}
        >
          {zoomPercent}%
        </span>
        {isSplit && (
          <span className="status-item" title="Split mode">
            Split
          </span>
        )}
      </div>
    </div>
  );
});

export default StatusBar;
