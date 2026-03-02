# Text Diff Editor

[![CI](https://github.com/sohei-t/text-diff-editor/actions/workflows/ci.yml/badge.svg)](https://github.com/sohei-t/text-diff-editor/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Tests](https://img.shields.io/badge/tests-66%20passing-brightgreen)](https://github.com/sohei-t/text-diff-editor/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A multi-panel text diff viewer and editor built with React 18 and TypeScript. Features a custom Myers diff algorithm implementation with character-level precision, three professional themes, and a complete editing toolkit -- all without external diff libraries.

**[Live Demo](https://sohei-t.github.io/text-diff-editor/)**

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Testing](#testing)
- [Diff Algorithm](#diff-algorithm)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Text Diff Editor is a browser-based application for comparing and editing text side by side. It supports 1-, 2-, and 3-panel split views with real-time diff computation, character-level inline highlighting, and a full-featured editor with undo/redo, search and replace, zoom, and pan.

The diff engine is written entirely in TypeScript with no external dependencies, implementing the Myers shortest edit script algorithm for line-level diffs and LCS (Longest Common Subsequence) for character-level inline diffs.

---

## Features

### Diff and Comparison

- **Myers diff algorithm** -- Line-level diff with O(D(N+M)) time complexity
- **Character-level inline diffs** -- LCS-based highlighting within modified lines
- **Real-time computation** -- Diffs update as you type
- **Async diff support** -- Non-blocking computation for large files
- **Result caching** -- 20-item LRU cache for repeated comparisons

### Editor

- **Multi-panel views** -- Switch between 1, 2, or 3 pane split layouts
- **Resizable panels** -- Drag splitters to adjust panel widths
- **1000-level undo/redo** -- Deep operation history per panel
- **Line numbers** -- Toggleable gutter display
- **Word wrap** -- Configurable text wrapping
- **Current line highlighting** -- Visual indicator for active line

### Search and Replace

- **Full-text search** -- Find across editor content with match navigation
- **Regular expression support** -- Regex pattern matching with case sensitivity toggle
- **Replace and replace all** -- Single or bulk replacements

### Navigation and Viewport

- **Zoom** -- Cmd/Ctrl + scroll wheel for scaling
- **Pan** -- Alt + drag with momentum-based inertia scrolling
- **Synchronized scrolling** -- Lock scroll position across panels
- **Diff navigation** -- Jump to next/previous change with F7/Shift+F7

### File Operations

- **File System Access API** -- Native file open/save on supported browsers (Chrome/Edge)
- **Fallback file handling** -- Download-based save for unsupported browsers
- **Auto-save** -- Configurable timer-based automatic saving
- **Recent files** -- Track recently opened files

### Themes and Accessibility

- **Light theme** -- Clean parchment-toned design
- **Dark theme** -- Low-glare ink-themed interface
- **High Contrast theme** -- WCAG AA compliant with enhanced color ratios
- **CSS Custom Properties** -- Theme switching via CSS variables with zero re-renders
- **Keyboard-accessible** -- Full operation via keyboard shortcuts

---

## Architecture

```
src/
|
|-- engine/                     # Pure TypeScript diff engine
|   |-- DiffEngine.ts           #   Myers algorithm + LCS inline diffs
|   +-- README.md               #   Algorithm documentation
|
|-- types/
|   +-- index.ts                # All type definitions (185 lines)
|
|-- context/                    # 7 React Context providers
|   |-- ThemeContext.tsx         #   Theme switching (light/dark/high-contrast)
|   |-- SettingsContext.tsx      #   Persisted user preferences
|   |-- EditorContext.tsx        #   Panel content and cursor state
|   |-- SplitContext.tsx         #   Split view configuration
|   |-- DiffContext.tsx          #   Diff computation results
|   |-- FileContext.tsx          #   File operations
|   |-- ToastContext.tsx         #   Notification system
|   +-- index.ts                #   Barrel export
|
|-- hooks/                      # 12 custom hooks
|   |-- useEditor.ts            #   Core editor state management
|   |-- useUndoRedo.ts          #   1000-level undo/redo history
|   |-- useSearch.ts            #   Search and replace logic
|   |-- useDiffComputation.ts   #   Debounced diff computation
|   |-- useZoom.ts              #   Cmd+scroll zoom handler
|   |-- usePan.ts               #   Alt+drag with momentum inertia
|   |-- useScrollSync.ts        #   Synchronized panel scrolling
|   |-- useSplitter.ts          #   Drag-to-resize panels
|   |-- useAutoSave.ts          #   Timer-based auto-save
|   |-- useKeyboardShortcuts.ts #   Global shortcut registration
|   |-- useDebounce.ts          #   Debounce utility hook
|   +-- useWelcomeMessage.ts    #   First-run welcome message
|
|-- components/
|   |-- EditorApp.tsx           # Root application component
|   |-- toolbar/
|   |   +-- Toolbar.tsx         #   File, view, font, and zoom controls
|   |-- editor/
|   |   |-- EditorContainer.tsx #   Multi-panel layout orchestrator
|   |   |-- EditorPanel.tsx     #   Individual editor panel
|   |   |-- TextArea.tsx        #   Controlled textarea with diff overlay
|   |   |-- LineNumbers.tsx     #   Gutter line number display
|   |   |-- PanelHeader.tsx     #   Panel title and file info
|   |   +-- Splitter.tsx        #   Draggable panel divider
|   |-- search/
|   |   +-- SearchBar.tsx       #   Search/replace floating bar
|   |-- status/
|   |   +-- StatusBar.tsx       #   Cursor position, diff stats, theme
|   +-- ui/
|       |-- Toast.tsx           #   Individual toast notification
|       |-- ToastContainer.tsx  #   Toast stack manager
|       +-- ErrorBoundary.tsx   #   React error boundary
|
|-- utils/                      # Helper functions
|-- styles/
|   +-- index.css               # All styles with CSS Custom Properties
|
+-- __tests__/                  # 66 tests across 4 test suites
    |-- DiffEngine.test.ts      #   Diff algorithm unit tests
    |-- hooks.test.ts           #   Custom hook tests
    |-- utils.test.ts           #   Utility function tests
    +-- components.test.tsx     #   Component rendering tests
```

---

## Tech Stack

| Category         | Technology                                  |
| ---------------- | ------------------------------------------- |
| Framework        | React 18.3.1                                |
| Language         | TypeScript 5.7.2 (strict mode)              |
| Build Tool       | Vite 6.0.5                                  |
| Test Framework   | Vitest 2.1.8                                |
| Test Utilities   | React Testing Library 16.1, jsdom 25        |
| Styling          | CSS Custom Properties (zero-runtime themes) |
| CI/CD            | GitHub Actions (test, build, deploy)        |
| Hosting          | GitHub Pages                                |
| Diff Engine      | Custom Myers algorithm (pure TypeScript)     |
| File Handling    | File System Access API + fallback           |

**Zero external diff dependencies.** The entire diff engine is implemented from scratch in TypeScript.

---

## Getting Started

### Prerequisites

- Node.js 20 or later
- npm 9 or later

### Installation

```bash
git clone https://github.com/sohei-t/text-diff-editor.git
cd text-diff-editor
npm install
```

### Development

```bash
npm run dev          # Start development server (Vite HMR)
```

Open [http://localhost:5173/text-diff-editor/](http://localhost:5173/text-diff-editor/) in your browser.

### Build

```bash
npm run build        # Type-check and build for production
npm run preview      # Preview the production build locally
```

### Test

```bash
npm test             # Run all 66 tests
npm run test:watch   # Run tests in watch mode
```

---

## Keyboard Shortcuts

| Shortcut           | Action                    |
| ------------------ | ------------------------- |
| `Cmd/Ctrl + N`     | New file                  |
| `Cmd/Ctrl + O`     | Open file                 |
| `Cmd/Ctrl + S`     | Save file                 |
| `Cmd/Ctrl + W`     | Close panel               |
| `Cmd/Ctrl + F`     | Find                      |
| `Cmd/Ctrl + H`     | Find and replace          |
| `Cmd/Ctrl + \`     | Toggle split view         |
| `Cmd/Ctrl + Z`     | Undo                      |
| `Cmd/Ctrl + Shift + Z` | Redo                  |
| `F7`               | Jump to next diff         |
| `Shift + F7`       | Jump to previous diff     |
| `Cmd/Ctrl + Scroll`| Zoom in/out               |
| `Alt + Drag`       | Pan viewport (with momentum) |

---

## Testing

The test suite contains **66 tests** organized into four test files covering the core layers of the application:

| Test File               | Scope                                      | Tests |
| ----------------------- | ------------------------------------------ | ----- |
| `DiffEngine.test.ts`    | Myers algorithm, inline diffs, caching     | Core  |
| `hooks.test.ts`         | Custom hook behavior and state management  | Hooks |
| `utils.test.ts`         | Utility and helper function correctness    | Utils |
| `components.test.tsx`   | Component rendering and user interactions  | UI    |

Run the full suite:

```bash
npm test
```

The CI pipeline runs on every push and pull request to `main`, executing type checking, all tests, and a production build before deploying to GitHub Pages.

---

## Diff Algorithm

The diff engine implements two complementary algorithms:

### Line-Level Diff: Myers Shortest Edit Script

The [Myers diff algorithm](http://www.xmailserver.org/diff2.pdf) (1986) finds the shortest edit script between two sequences. It operates in O(D(N+M)) time where D is the edit distance, making it efficient for texts with few changes.

**Implementation details:**

1. **Forward pass** -- Explores the edit graph along diagonals, tracking the furthest-reaching point for each diagonal at each edit distance `d`
2. **Trace recording** -- Stores the state vector at each step for backtracking
3. **Backtracking** -- Reconstructs the optimal edit path from the trace, producing a sequence of equal/add/delete operations
4. **Change building** -- Converts raw edit operations into structured `DiffChange` objects, pairing adjacent delete+add operations as modifications

### Character-Level Inline Diff: LCS

For lines classified as "modified" (a paired delete and add), the engine computes character-level diffs using a dynamic programming LCS (Longest Common Subsequence) approach:

1. Build an (m+1) x (n+1) DP table for the two character arrays
2. Backtrack through the table to extract the LCS
3. Walk both strings against the LCS to emit equal/add/delete segments

This produces precise, character-by-character highlighting of what changed within a line.

### Caching

Results are stored in a 20-item LRU cache keyed by text length and a 64-character prefix. Full-text equality is verified on cache hits to prevent false matches.

---

## Contributing

Contributions are welcome. Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/your-feature`)
3. Make your changes with tests
4. Ensure all 66 tests pass (`npm test`)
5. Ensure TypeScript compiles without errors (`npx tsc --noEmit`)
6. Submit a pull request

### Code Style

- TypeScript strict mode is enforced
- All types are defined in `src/types/index.ts`
- Context providers follow the pattern in `src/context/`
- Custom hooks are in `src/hooks/` with barrel exports

---

## License

[MIT](./LICENSE) -- Copyright (c) 2026 sohei-t
