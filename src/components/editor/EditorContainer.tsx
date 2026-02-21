import React, { useCallback, useMemo } from 'react';
import { useSplitContext } from '../../context/SplitContext';
import { useEditorContext } from '../../context/EditorContext';
import { useScrollSync } from '../../hooks/useScrollSync';
import type { PanelId } from '../../types';
import EditorPanel from './EditorPanel';
import Splitter from './Splitter';

interface EditorContainerProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  onDrop: (panelId: PanelId, file: File) => void;
  onClose: (panelId: PanelId) => void;
}

const EditorContainer: React.FC<EditorContainerProps> = React.memo(function EditorContainer({
  containerRef,
  onDrop,
  onClose,
}) {
  const { paneCount, splitRatio, setSplitRatio, syncScroll, tripleR1, tripleR2, setTripleR1, setTripleR2 } =
    useSplitContext();
  const { textareaRefs } = useEditorContext();
  const { handleScroll: syncScrollHandler } = useScrollSync(syncScroll);

  const isSplit = paneCount >= 2;
  const isTriple = paneCount === 3;

  const handleLeftScroll = useCallback(() => {
    syncScrollHandler(textareaRefs.left, textareaRefs.right);
  }, [syncScrollHandler, textareaRefs.left, textareaRefs.right]);

  const handleRightScroll = useCallback(() => {
    syncScrollHandler(textareaRefs.right, textareaRefs.left);
  }, [syncScrollHandler, textareaRefs.right, textareaRefs.left]);

  const handleCenterScroll = useCallback(() => {
    // Center panel scroll - no sync for now
  }, []);

  const handleSplitter1Resize = useCallback(
    (ratio: number) => {
      if (isTriple) {
        const clamped = Math.min(Math.max(ratio, 0.15), tripleR2 - 0.15);
        setTripleR1(clamped);
      } else {
        setSplitRatio(ratio);
      }
    },
    [isTriple, tripleR2, setTripleR1, setSplitRatio]
  );

  const handleSplitter2Resize = useCallback(
    (ratio: number) => {
      const clamped = Math.min(Math.max(ratio, tripleR1 + 0.15), 0.85);
      setTripleR2(clamped);
    },
    [tripleR1, setTripleR2]
  );

  const containerClassName = useMemo(() => {
    const classes = [];
    if (isSplit) classes.push('split-mode');
    if (isTriple) classes.push('triple-mode');
    return classes.join(' ');
  }, [isSplit, isTriple]);

  const leftStyle = useMemo((): React.CSSProperties | undefined => {
    if (!isSplit) return undefined;
    if (isTriple) {
      return { width: `calc(${tripleR1 * 100}% - 8px)`, flex: 'none' };
    }
    return { width: `calc(${splitRatio * 100}% - 4px)`, flex: 'none' };
  }, [isSplit, isTriple, splitRatio, tripleR1]);

  const centerStyle = useMemo((): React.CSSProperties | undefined => {
    if (!isTriple) return undefined;
    return { width: `calc(${(tripleR2 - tripleR1) * 100}% - 8px)`, flex: 'none' };
  }, [isTriple, tripleR1, tripleR2]);

  const rightStyle = useMemo((): React.CSSProperties | undefined => {
    if (!isSplit) return undefined;
    if (isTriple) {
      return { width: `calc(${(1 - tripleR2) * 100}%)`, flex: 'none' };
    }
    return { width: `calc(${(1 - splitRatio) * 100}% - 4px)`, flex: 'none' };
  }, [isSplit, isTriple, splitRatio, tripleR2]);

  return (
    <div
      ref={containerRef as React.Ref<HTMLDivElement>}
      id="editor-container"
      className={containerClassName}
    >
      <EditorPanel
        panelId="left"
        title="Original"
        placeholder="Open a file or start typing..."
        onScroll={handleLeftScroll}
        onDrop={onDrop}
        onClose={onClose}
        style={leftStyle}
      />

      <Splitter
        id="splitter"
        onResize={handleSplitter1Resize}
        containerRef={containerRef}
        hidden={!isSplit}
      />

      <EditorPanel
        panelId="center"
        title="Center"
        placeholder="Open a file..."
        onScroll={handleCenterScroll}
        onDrop={onDrop}
        onClose={onClose}
        hidden={!isTriple}
        style={centerStyle}
      />

      <Splitter
        id="splitter-2"
        onResize={handleSplitter2Resize}
        containerRef={containerRef}
        hidden={!isTriple}
      />

      <EditorPanel
        panelId="right"
        title="Modified"
        placeholder="Open a file to compare..."
        onScroll={handleRightScroll}
        onDrop={onDrop}
        onClose={onClose}
        hidden={!isSplit}
        style={rightStyle}
      />
    </div>
  );
});

export default EditorContainer;
