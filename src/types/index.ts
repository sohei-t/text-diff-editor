// ============================================================
// Theme Types
// ============================================================
export type ThemeName = 'light' | 'dark' | 'high-contrast';

// ============================================================
// Settings Types
// ============================================================
/** Application settings persisted to localStorage */
export interface Settings {
  readonly theme: ThemeName;
  readonly fontSize: number;
  readonly fontFamily: string;
  readonly lineHeight: number;
  readonly wordWrap: boolean;
  readonly showLineNumbers: boolean;
  readonly highlightCurrentLine: boolean;
  readonly autoSaveInterval: number;
  readonly splitRatio: number;
  readonly syncScroll: boolean;
  readonly lastZoomLevel: number;
  readonly recentFiles: RecentFile[];
  readonly welcomeShown: boolean;
}

export const DEFAULT_SETTINGS = {
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
} as const satisfies Settings;

// ============================================================
// Editor Types
// ============================================================
export type PanelId = 'left' | 'center' | 'right';

/** Cursor line/column position in the editor */
export interface CursorPosition {
  readonly line: number;
  readonly column: number;
}

/** A text selection range with the selected text */
export interface TextSelection {
  readonly start: number;
  readonly end: number;
  readonly text: string;
}

/** Undo/redo history state */
export interface UndoRedoState {
  readonly undoStack: string[];
  readonly redoStack: string[];
  readonly lastContent: string;
}

/** Panel content state */
export interface PanelState {
  readonly content: string;
  readonly modified: boolean;
  readonly fileName: string;
  readonly fileHandle: FileSystemFileHandle | null;
  readonly cursorPosition: CursorPosition;
}

// ============================================================
// Diff Types
// ============================================================
export type ChangeType = 'equal' | 'add' | 'delete' | 'modify';

export interface InlineDiff {
  type: 'equal' | 'add' | 'delete';
  text: string;
}

/** A single diff change between two texts */
export interface DiffChange {
  readonly type: ChangeType;
  readonly lineLeft: number | null;
  readonly lineRight: number | null;
  readonly contentLeft: string;
  readonly contentRight: string;
  readonly inlineDiffs: InlineDiff[];
}

/** Summary statistics for a diff result */
export interface DiffStats {
  added: number;
  deleted: number;
  modified: number;
  unchanged: number;
}

/** Complete result of a diff computation */
export interface DiffResult {
  readonly changes: DiffChange[];
  readonly stats: DiffStats;
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
  readonly query: string;
  readonly caseSensitive: boolean;
  readonly useRegex: boolean;
  readonly matches: SearchMatch[];
  readonly currentIndex: number;
  readonly isOpen: boolean;
  readonly showReplace: boolean;
}

// ============================================================
// Utility Types
// ============================================================

/** Immutable settings from localStorage */
export type ReadonlySettings = Readonly<Settings>;

/** Partial settings for updates */
export type SettingsUpdate = Partial<Settings>;

/** Panel content update */
export type PanelContentUpdate = Pick<PanelState, 'content'>;

/** Hook return type for async operations */
export interface AsyncState<T> {
  readonly data: T | null;
  readonly loading: boolean;
  readonly error: string | null;
}

/** File operation result */
export type FileOperationResult = {
  readonly success: boolean;
  readonly fileName?: string;
  readonly error?: string;
};
