import React, { useCallback, type ChangeEvent } from 'react';
import type { PanelId } from '../../types';

interface TextAreaProps {
  panelId: PanelId;
  content: string;
  placeholder: string;
  textareaRef: React.Ref<HTMLTextAreaElement>;
  onInput: (value: string) => void;
  onCursorChange: () => void;
  onFocus: () => void;
  onScroll: () => void;
  onDrop: (file: File) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

const TextArea: React.FC<TextAreaProps> = React.memo(function TextArea({
  panelId,
  content,
  placeholder,
  textareaRef,
  onInput,
  onCursorChange,
  onFocus,
  onScroll,
  onDrop,
  onKeyDown,
}) {
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      onInput(e.target.value);
    },
    [onInput]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('drag-over');
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.currentTarget.classList.remove('drag-over');
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file) onDrop(file);
    },
    [onDrop]
  );

  return (
    <textarea
      ref={textareaRef}
      id={`editor-${panelId}`}
      className="editor-textarea"
      spellCheck={false}
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      placeholder={placeholder}
      aria-label={`${panelId} editor panel`}
      value={content}
      onChange={handleChange}
      onKeyUp={onCursorChange}
      onClick={onCursorChange}
      onFocus={onFocus}
      onScroll={onScroll}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onKeyDown={onKeyDown}
    />
  );
});

export default TextArea;
