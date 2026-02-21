// ============================================================
// Theme Types
// ============================================================
export type ThemeName = 'light' | 'dark' | 'high-contrast';

// ============================================================
// Settings Types
// ============================================================
export interface Settings {
  theme: ThemeName;
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  wordWrap: boolean;
  showLineNumbers: boolean;
  highlightCurrentLine: boolean;
  autoSaveInterval: number;
  splitRatio: number;
  syncScroll: boolean;
  lastZoomLevel: number;
  recentFiles: RecentFile[];
  welcomeShown: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'light',
  fontSize: 18,
  fontFamily: '"SF Mono", "Menlo", "Monaco", "Consolas", monospace',
  lineHeight: 1.6,
  wordWrap: true,
  showLineNumbers: true,
  highlightCurrentLine: true,
  autoSaveInterval: 0,
  splitRatio: 0.5,
  syncScroll: true,
  lastZoomLevel: 1.0,
  recentFiles: [],
  welcomeShown: false,
};

// ============================================================
// Editor Types
// ============================================================
export type PanelId = 'left' | 'center' | 'right';

export interface CursorPosition {
  line: number;
  column: number;
}

export interface TextSelection {
  start: number;
  end: number;
  text: string;
}

export interface UndoRedoState {
  undoStack: string[];
  redoStack: string[];
  lastContent: string;
}

// ============================================================
// Diff Types
// ============================================================
export type ChangeType = 'equal' | 'add' | 'delete' | 'modify';

export interface InlineDiff {
  type: 'equal' | 'add' | 'delete';
  text: string;
}

export interface DiffChange {
  type: ChangeType;
  lineLeft: number | null;
  lineRight: number | null;
  contentLeft: string;
  contentRight: string;
  inlineDiffs: InlineDiff[];
}

export interface DiffStats {
  added: number;
  deleted: number;
  modified: number;
  unchanged: number;
}

export interface DiffResult {
  changes: DiffChange[];
  stats: DiffStats;
}

// ============================================================
// File Types
// ============================================================
export interface FileState {
  name: string;
  handle: FileSystemFileHandle | null;
  content: string;
}

export interface RecentFile {
  name: string;
  time: number;
}

// ============================================================
// Split View Types
// ============================================================
export type PaneCount = 0 | 2 | 3;

// ============================================================
// Toast Types
// ============================================================
export type ToastType = 'info' | 'success' | 'error' | 'warning';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

// ============================================================
// Search Types
// ============================================================
export interface SearchMatch {
  start: number;
  end: number;
}

export interface SearchState {
  query: string;
  caseSensitive: boolean;
  useRegex: boolean;
  matches: SearchMatch[];
  currentIndex: number;
  isOpen: boolean;
  showReplace: boolean;
}
