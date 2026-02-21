import React from 'react';
import type { PanelId } from '../../types';

interface PanelHeaderProps {
  panelId: PanelId;
  title: string;
  fileName: string;
  onClose: (panelId: PanelId) => void;
}

const PanelHeader: React.FC<PanelHeaderProps> = React.memo(function PanelHeader({
  panelId,
  title,
  fileName,
  onClose,
}) {
  return (
    <div className="panel-header">
      <span className="panel-title">{title}</span>
      <span className="panel-filename" id={`panel-${panelId}-filename`}>
        {fileName}
      </span>
      <button
        className="panel-close-btn"
        data-panel={panelId}
        title="Close file"
        aria-label="Close file"
        onClick={() => onClose(panelId)}
      >
        &times;
      </button>
    </div>
  );
});

export default PanelHeader;
