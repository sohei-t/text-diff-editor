import { useCallback, type RefObject } from 'react';
import type { CursorPosition, PanelId } from '../types';
import { useEditorContext } from '../context/EditorContext';
import { useUndoRedo } from './useUndoRedo';

interface UseEditorReturn {
  content: string;
  modified: boolean;
  fileName: string;
  cursorPosition: CursorPosition;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  handleInput: (value: string) => void;
  handleCursorChange: () => void;
  handleFocus: () => void;
  setText: (text: string) => void;
  clearModified: () => void;
  undo: () => void;
  redo: () => void;
  scrollToLine: (line: number) => void;
  setFontSize: (size: number) => void;
}

export function useEditor(panelId: PanelId): UseEditorReturn {
  const {
    panels,
    setContent,
    setModified,
    setCursorPosition,
    setActivePanelId,
    textareaRefs,
  } = useEditorContext();

  const panel = panels[panelId];
  const textareaRef = textareaRefs[panelId];
  const { pushState, undo: undoAction, redo: redoAction } = useUndoRedo();

  const getCursorPos = useCallback((): CursorPosition => {
    const ta = textareaRef.current;
    if (!ta) return { line: 1, column: 1 };
    const text = ta.value;
    const pos = ta.selectionStart;
    const lines = text.substring(0, pos).split('\n');
    return { line: lines.length, column: lines[lines.length - 1].length + 1 };
  }, [textareaRef]);

  const handleInput = useCallback(
    (value: string) => {
      setContent(panelId, value);
      pushState(value);
      if (!panel.modified) {
        setModified(panelId, true);
      }
    },
    [panelId, setContent, setModified, pushState, panel.modified]
  );

  const handleCursorChange = useCallback(() => {
    const pos = getCursorPos();
    setCursorPosition(panelId, pos);
  }, [panelId, getCursorPos, setCursorPosition]);

  const handleFocus = useCallback(() => {
    setActivePanelId(panelId);
  }, [panelId, setActivePanelId]);

  const setText = useCallback(
    (text: string) => {
      setContent(panelId, text);
      if (textareaRef.current) {
        textareaRef.current.value = text;
      }
    },
    [panelId, setContent, textareaRef]
  );

  const clearModified = useCallback(() => {
    setModified(panelId, false);
  }, [panelId, setModified]);

  const undo = useCallback(() => {
    const prev = undoAction(panel.content);
    if (prev !== null) {
      setContent(panelId, prev);
      if (textareaRef.current) {
        textareaRef.current.value = prev;
      }
    }
  }, [undoAction, panel.content, panelId, setContent, textareaRef]);

  const redo = useCallback(() => {
    const next = redoAction(panel.content);
    if (next !== null) {
      setContent(panelId, next);
      if (textareaRef.current) {
        textareaRef.current.value = next;
      }
    }
  }, [redoAction, panel.content, panelId, setContent, textareaRef]);

  const scrollToLine = useCallback(
    (line: number) => {
      const ta = textareaRef.current;
      if (!ta) return;
      const lineHeight = parseFloat(getComputedStyle(ta).lineHeight) || 27;
      const targetTop = (line - 1) * lineHeight;
      ta.scrollTo({ top: targetTop, behavior: 'smooth' });
    },
    [textareaRef]
  );

  const setFontSize = useCallback(
    (size: number) => {
      const ta = textareaRef.current;
      if (!ta) return;
      ta.style.fontSize = `${size}px`;
      ta.style.lineHeight = `${Math.round(size * 1.5)}px`;
    },
    [textareaRef]
  );

  return {
    content: panel.content,
    modified: panel.modified,
    fileName: panel.fileName,
    cursorPosition: panel.cursorPosition,
    textareaRef,
    handleInput,
    handleCursorChange,
    handleFocus,
    setText,
    clearModified,
    undo,
    redo,
    scrollToLine,
    setFontSize,
  };
}
