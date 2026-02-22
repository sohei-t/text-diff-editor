import React, { useCallback, useEffect, useMemo } from 'react';
import { useEditorContext } from '../context/EditorContext';
import { useSplitContext } from '../context/SplitContext';
import { useDiffContext } from '../context/DiffContext';
import { useFileContext } from '../context/FileContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { useZoom } from '../hooks/useZoom';
import { usePan } from '../hooks/usePan';
import { useSearch } from '../hooks/useSearch';
import { useAutoSave } from '../hooks/useAutoSave';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useDiffComputation } from '../hooks/useDiffComputation';
import { useWelcomeMessage } from '../hooks/useWelcomeMessage';
import type { PanelId } from '../types';

import Toolbar from './toolbar/Toolbar';
import SearchBar from './search/SearchBar';
import EditorContainer from './editor/EditorContainer';
import StatusBar from './status/StatusBar';
import ToastContainer from './ui/ToastContainer';

const EditorApp = React.memo(function EditorApp() {
  const { panels, activePanelId, setContent, setModified, setFileName, setFileHandle, textareaRefs } =
    useEditorContext();
  const { paneCount, toggleSplit } = useSplitContext();
  const { stats, diffChangesOnly, currentChangeIndex, navigateDiff } =
    useDiffContext();
  const { openFile, saveFile, reopenRecent } = useFileContext();
  const { settings, setSetting } = useSettings();
  const { showToast } = useToast();

  const { level: zoomLevel, zoomIn, zoomOut, resetZoom, setZoom, containerRef } = useZoom({
    baseFontSize: settings.fontSize,
  });
  usePan(containerRef);

  const search = useSearch();

  // Extracted hooks
  const leftContent = panels.left.content;
  const rightContent = panels.right.content;
  const isSplit = paneCount >= 2;

  useDiffComputation(isSplit, leftContent, rightContent);
  useWelcomeMessage();

  // Auto-save with error handling
  const handleAutoSave = useCallback(() => {
    const panel = panels.left;
    if (panel.modified) {
      try {
        saveFile('left', panel.content, panel.fileName, panel.fileHandle).catch((err) => {
          console.error('Auto-save failed:', err);
          showToast('Auto-save failed. Please save manually.', 'error', 3000);
        });
      } catch (err) {
        console.error('Auto-save failed:', err);
        showToast('Auto-save failed. Please save manually.', 'error', 3000);
      }
    }
  }, [panels.left, saveFile, showToast]);

  useAutoSave({
    intervalMs: settings.autoSaveInterval,
    modified: panels.left.modified,
    onSave: handleAutoSave,
  });

  // Search: trigger search when query or options change
  useEffect(() => {
    if (search.isOpen && search.query) {
      const ta = textareaRefs[activePanelId].current;
      if (ta) {
        search.performSearch(ta.value);
      }
    }
  }, [search.query, search.caseSensitive, search.useRegex]); // eslint-disable-line react-hooks/exhaustive-deps

  // Prevent browser zoom on Cmd+scroll
  useEffect(() => {
    const handler = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) e.preventDefault();
    };
    document.addEventListener('wheel', handler, { passive: false });
    return () => document.removeEventListener('wheel', handler);
  }, []);

  // Unsaved changes warning
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (panels.left.modified || panels.center.modified || panels.right.modified) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [panels.left.modified, panels.center.modified, panels.right.modified]);

  // ============================================================
  // Toolbar action handlers
  // ============================================================
  const handleNew = useCallback(() => {
    setContent('left', '');
    setModified('left', false);
    setFileName('left', 'Untitled');
    setFileHandle('left', null);
  }, [setContent, setModified, setFileName, setFileHandle]);

  const handleOpen = useCallback(async () => {
    const result = await openFile(activePanelId);
    if (result) {
      setContent(activePanelId, result.content);
      setModified(activePanelId, false);
      setFileName(activePanelId, result.name);
      setFileHandle(activePanelId, result.handle);
    }
  }, [activePanelId, openFile, setContent, setModified, setFileName, setFileHandle]);

  const handleSave = useCallback(async () => {
    const panel = panels[activePanelId];
    const result = await saveFile(activePanelId, panel.content, panel.fileName, panel.fileHandle);
    if (result) {
      setModified(activePanelId, false);
      setFileName(activePanelId, result.name);
      setFileHandle(activePanelId, result.handle);
    }
  }, [activePanelId, panels, saveFile, setModified, setFileName, setFileHandle]);

  const handleClose = useCallback(
    (panelId?: PanelId) => {
      const pid = panelId || activePanelId;
      const panel = panels[pid];
      if (panel.modified) {
        if (!window.confirm('Unsaved changes will be lost. Close without saving?')) return;
      }
      setContent(pid, '');
      setModified(pid, false);
      setFileName(pid, 'Untitled');
      setFileHandle(pid, null);
    },
    [activePanelId, panels, setContent, setModified, setFileName, setFileHandle]
  );

  const handleFontDecrease = useCallback(() => {
    const size = Math.max(12, settings.fontSize - 2);
    setSetting('fontSize', size);
  }, [settings.fontSize, setSetting]);

  const handleFontIncrease = useCallback(() => {
    const size = Math.min(48, settings.fontSize + 2);
    setSetting('fontSize', size);
  }, [settings.fontSize, setSetting]);

  const handleDiffNav = useCallback(
    (direction: 'next' | 'prev') => {
      const change = navigateDiff(direction);
      if (change) {
        const line = change.lineLeft || change.lineRight || 1;
        const leftTa = textareaRefs.left.current;
        const rightTa = textareaRefs.right.current;
        if (leftTa) {
          const lh = parseFloat(getComputedStyle(leftTa).lineHeight) || 27;
          leftTa.scrollTo({ top: (line - 1) * lh, behavior: 'smooth' });
        }
        if (rightTa) {
          const lh = parseFloat(getComputedStyle(rightTa).lineHeight) || 27;
          rightTa.scrollTo({ top: (line - 1) * lh, behavior: 'smooth' });
        }
      }
    },
    [navigateDiff, textareaRefs]
  );

  const handleDrop = useCallback(
    async (_panelId: PanelId, file: File) => {
      try {
        const content = await file.text();
        setContent(_panelId, content);
        setModified(_panelId, false);
        setFileName(_panelId, file.name);
        setFileHandle(_panelId, null);
        showToast(`Opened: ${file.name}`, 'success', 2000);
      } catch {
        showToast('Failed to read dropped file', 'error', 3000);
      }
    },
    [setContent, setModified, setFileName, setFileHandle, showToast]
  );

  const handleReopenRecent = useCallback(
    async (name: string) => {
      const result = await reopenRecent(name, activePanelId);
      if (result) {
        setContent(activePanelId, result.content);
        setModified(activePanelId, false);
        setFileName(activePanelId, result.name);
        setFileHandle(activePanelId, result.handle);
      }
    },
    [activePanelId, reopenRecent, setContent, setModified, setFileName, setFileHandle]
  );

  // Search handlers
  const handleSearchOpen = useCallback(() => {
    search.open(false);
  }, [search]);

  const handleSearchReplaceOpen = useCallback(() => {
    search.open(true);
  }, [search]);

  const handleFindNext = useCallback(() => {
    const ta = textareaRefs[activePanelId].current;
    if (ta) search.findNext(ta.value, ta);
  }, [search, textareaRefs, activePanelId]);

  const handleFindPrevious = useCallback(() => {
    const ta = textareaRefs[activePanelId].current;
    if (ta) search.findPrevious(ta.value, ta);
  }, [search, textareaRefs, activePanelId]);

  const handleReplace = useCallback(() => {
    const ta = textareaRefs[activePanelId].current;
    search.replace(ta);
  }, [search, textareaRefs, activePanelId]);

  const handleReplaceAll = useCallback(() => {
    const ta = textareaRefs[activePanelId].current;
    const count = search.replaceAll(ta);
    if (count > 0) {
      showToast(`Replaced ${count} occurrence${count !== 1 ? 's' : ''}`, 'info', 2000);
    }
  }, [search, textareaRefs, activePanelId, showToast]);

  // Keyboard shortcuts
  const shortcutHandlers = useMemo(
    () => ({
      onNew: handleNew,
      onOpen: handleOpen,
      onSave: handleSave,
      onClose: () => handleClose(),
      onSearch: handleSearchOpen,
      onSearchReplace: handleSearchReplaceOpen,
      onToggleSplit: toggleSplit,
      onFontIncrease: handleFontIncrease,
      onFontDecrease: handleFontDecrease,
      onResetZoom: resetZoom,
      onDiffNext: () => handleDiffNav('next'),
      onDiffPrev: () => handleDiffNav('prev'),
    }),
    [
      handleNew, handleOpen, handleSave, handleClose,
      handleSearchOpen, handleSearchReplaceOpen, toggleSplit,
      handleFontIncrease, handleFontDecrease, resetZoom, handleDiffNav,
    ]
  );
  useKeyboardShortcuts(shortcutHandlers);

  // Diff nav info for status bar
  const diffNavInfo = useMemo(() => {
    if (currentChangeIndex >= 0 && diffChangesOnly.length > 0) {
      return { index: currentChangeIndex, total: diffChangesOnly.length };
    }
    return null;
  }, [currentChangeIndex, diffChangesOnly.length]);

  const activePanel = panels[activePanelId];

  return (
    <>
      <a href="#editor-left" className="skip-link">
        Skip to editor
      </a>

      <Toolbar
        zoomLevel={zoomLevel}
        onNew={handleNew}
        onOpen={handleOpen}
        onSave={handleSave}
        onClose={() => handleClose()}
        onSearch={handleSearchOpen}
        onFontDecrease={handleFontDecrease}
        onFontIncrease={handleFontIncrease}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onZoomReset={resetZoom}
        onZoomSet={setZoom}
        onDiffPrev={() => handleDiffNav('prev')}
        onDiffNext={() => handleDiffNav('next')}
        onReopenRecent={handleReopenRecent}
      />

      <SearchBar
        isOpen={search.isOpen}
        showReplace={search.showReplace}
        query={search.query}
        caseSensitive={search.caseSensitive}
        useRegex={search.useRegex}
        matches={search.matches}
        currentIndex={search.currentIndex}
        replaceText={search.replaceText}
        onQueryChange={search.setQuery}
        onToggleCaseSensitive={search.toggleCaseSensitive}
        onToggleRegex={search.toggleRegex}
        onFindNext={handleFindNext}
        onFindPrevious={handleFindPrevious}
        onReplace={handleReplace}
        onReplaceAll={handleReplaceAll}
        onReplaceTextChange={search.setReplaceText}
        onClose={search.close}
      />

      <EditorContainer
        containerRef={containerRef}
        onDrop={handleDrop}
        onClose={handleClose}
      />

      <StatusBar
        fileName={activePanel.fileName}
        modified={activePanel.modified}
        cursorPosition={activePanel.cursorPosition}
        zoomLevel={zoomLevel}
        isSplit={isSplit}
        diffStats={stats}
        diffNavInfo={diffNavInfo}
        onZoomReset={resetZoom}
      />

      <ToastContainer />
    </>
  );
});

export default EditorApp;
