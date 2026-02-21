import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import type { CursorPosition, PanelId } from '../types';

interface PanelState {
  content: string;
  modified: boolean;
  fileName: string;
  fileHandle: FileSystemFileHandle | null;
  cursorPosition: CursorPosition;
}

interface EditorContextValue {
  panels: Record<PanelId, PanelState>;
  activePanelId: PanelId;
  setActivePanelId: (id: PanelId) => void;
  setContent: (panelId: PanelId, content: string) => void;
  setModified: (panelId: PanelId, modified: boolean) => void;
  setFileName: (panelId: PanelId, name: string) => void;
  setFileHandle: (panelId: PanelId, handle: FileSystemFileHandle | null) => void;
  setCursorPosition: (panelId: PanelId, pos: CursorPosition) => void;
  textareaRefs: Record<PanelId, RefObject<HTMLTextAreaElement | null>>;
}

const EditorContext = createContext<EditorContextValue | null>(null);

function createPanelState(): PanelState {
  return {
    content: '',
    modified: false,
    fileName: 'Untitled',
    fileHandle: null,
    cursorPosition: { line: 1, column: 1 },
  };
}

export function EditorProvider({ children }: { children: ReactNode }) {
  const [panels, setPanels] = useState<Record<PanelId, PanelState>>({
    left: createPanelState(),
    center: createPanelState(),
    right: createPanelState(),
  });
  const [activePanelId, setActivePanelId] = useState<PanelId>('left');

  const leftRef = useRef<HTMLTextAreaElement | null>(null);
  const centerRef = useRef<HTMLTextAreaElement | null>(null);
  const rightRef = useRef<HTMLTextAreaElement | null>(null);

  const textareaRefs: Record<PanelId, RefObject<HTMLTextAreaElement | null>> = {
    left: leftRef,
    center: centerRef,
    right: rightRef,
  };

  const setContent = useCallback((panelId: PanelId, content: string) => {
    setPanels((prev) => ({
      ...prev,
      [panelId]: { ...prev[panelId], content },
    }));
  }, []);

  const setModified = useCallback((panelId: PanelId, modified: boolean) => {
    setPanels((prev) => ({
      ...prev,
      [panelId]: { ...prev[panelId], modified },
    }));
  }, []);

  const setFileName = useCallback((panelId: PanelId, name: string) => {
    setPanels((prev) => ({
      ...prev,
      [panelId]: { ...prev[panelId], fileName: name },
    }));
  }, []);

  const setFileHandle = useCallback((panelId: PanelId, handle: FileSystemFileHandle | null) => {
    setPanels((prev) => ({
      ...prev,
      [panelId]: { ...prev[panelId], fileHandle: handle },
    }));
  }, []);

  const setCursorPosition = useCallback((panelId: PanelId, pos: CursorPosition) => {
    setPanels((prev) => ({
      ...prev,
      [panelId]: { ...prev[panelId], cursorPosition: pos },
    }));
  }, []);

  return (
    <EditorContext.Provider
      value={{
        panels,
        activePanelId,
        setActivePanelId,
        setContent,
        setModified,
        setFileName,
        setFileHandle,
        setCursorPosition,
        textareaRefs,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
}

export function useEditorContext(): EditorContextValue {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error('useEditorContext must be used within EditorProvider');
  return ctx;
}
