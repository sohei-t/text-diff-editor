import React, { useCallback, useMemo } from 'react';
import type { PanelId } from '../../types';
import { useEditor } from '../../hooks/useEditor';
import PanelHeader from './PanelHeader';
import LineNumbers from './LineNumbers';
import TextArea from './TextArea';

interface EditorPanelProps {
  panelId: PanelId;
  title: string;
  placeholder: string;
  onScroll: () => void;
  onDrop: (panelId: PanelId, file: File) => void;
  onClose: (panelId: PanelId) => void;
  hidden?: boolean;
  style?: React.CSSProperties;
}

const EditorPanel: React.FC<EditorPanelProps> = React.memo(function EditorPanel({
  panelId,
  title,
  placeholder,
  onScroll,
  onDrop,
  onClose,
  hidden = false,
  style,
}) {
  const {
    content,
    fileName,
    textareaRef,
    handleInput,
    handleCursorChange,
    handleFocus,
    undo,
    redo,
  } = useEditor(panelId);

  const lineCount = useMemo(() => {
    if (content === '') return 1;
    return content.split('\n').length;
  }, [content]);

  const handleDrop = useCallback(
    (file: File) => {
      onDrop(panelId, file);
    },
    [panelId, onDrop]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      }
    },
    [undo, redo]
  );

  const handleScrollSync = useCallback(() => {
    // Sync line numbers scroll
    const ta = textareaRef.current;
    const lineNumbersEl = ta?.parentElement?.querySelector('.line-numbers') as HTMLElement | null;
    if (lineNumbersEl && ta) {
      lineNumbersEl.scrollTop = ta.scrollTop;
    }
    onScroll();
  }, [textareaRef, onScroll]);

  if (hidden) return null;

  return (
    <div id={`panel-${panelId}`} className="editor-panel" style={style}>
      <PanelHeader
        panelId={panelId}
        title={title}
        fileName={fileName}
        onClose={onClose}
      />
      <div className="editor-inner">
        <LineNumbers lineCount={lineCount} />
        <TextArea
          panelId={panelId}
          content={content}
          placeholder={placeholder}
          textareaRef={textareaRef as React.Ref<HTMLTextAreaElement>}
          onInput={handleInput}
          onCursorChange={handleCursorChange}
          onFocus={handleFocus}
          onScroll={handleScrollSync}
          onDrop={handleDrop}
          onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  );
});

export default EditorPanel;
