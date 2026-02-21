import { createContext, useCallback, useContext, useRef, type ReactNode } from 'react';
import type { PanelId, RecentFile } from '../types';
import { useSettings } from './SettingsContext';
import { useToast } from './ToastContext';

const FILE_TYPES = [
  '.txt', '.md', '.js', '.html', '.css', '.json', '.xml', '.csv', '.py', '.java',
  '.c', '.cpp', '.h', '.ts', '.tsx', '.jsx', '.yml', '.yaml', '.toml', '.ini',
  '.cfg', '.log', '.sh', '.bash', '.zsh',
];

interface FileContextValue {
  openFile: (panelId: PanelId) => Promise<{ name: string; content: string; handle: FileSystemFileHandle | null } | null>;
  saveFile: (panelId: PanelId, content: string, currentName: string, currentHandle: FileSystemFileHandle | null) => Promise<{ name: string; handle: FileSystemFileHandle | null } | null>;
  saveAsFile: (panelId: PanelId, content: string, suggestedName?: string) => Promise<{ name: string; handle: FileSystemFileHandle | null } | null>;
  isNativeSupported: () => boolean;
  getRecentFiles: () => RecentFile[];
  clearRecentFiles: () => void;
  reopenRecent: (name: string, panelId: PanelId) => Promise<{ name: string; content: string; handle: FileSystemFileHandle | null } | null>;
}

const FileContext = createContext<FileContextValue | null>(null);

export function FileProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast();
  const { settings, setSetting } = useSettings();
  const handleCacheRef = useRef<Map<string, FileSystemFileHandle>>(new Map());

  const isNativeSupported = useCallback((): boolean => {
    return 'showOpenFilePicker' in window;
  }, []);

  const addToRecentFiles = useCallback(
    (name: string) => {
      if (!name || name === 'Untitled') return;
      let recent = (settings.recentFiles || []).map((f) =>
        typeof f === 'string' ? { name: f as string, time: 0 } : f
      );
      recent = recent.filter((f) => f.name !== name);
      recent.unshift({ name, time: Date.now() });
      if (recent.length > 10) recent = recent.slice(0, 10);
      setSetting('recentFiles', recent);
    },
    [settings.recentFiles, setSetting]
  );

  const openFallback = useCallback((): Promise<{ name: string; content: string }> => {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = FILE_TYPES.join(',');
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) {
          reject(new DOMException('No file selected', 'AbortError'));
          return;
        }
        const content = await file.text();
        resolve({ name: file.name, content });
      };
      const onFocus = () => {
        window.removeEventListener('focus', onFocus);
        setTimeout(() => {
          if (!input.files || input.files.length === 0) {
            reject(new DOMException('User cancelled', 'AbortError'));
          }
        }, 300);
      };
      window.addEventListener('focus', onFocus);
      input.click();
    });
  }, []);

  const saveFallback = useCallback((content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const openFile = useCallback(
    async (_panelId: PanelId) => {
      try {
        let name: string;
        let content: string;
        let handle: FileSystemFileHandle | null = null;

        if (isNativeSupported()) {
          const [fileHandle] = await (window as unknown as { showOpenFilePicker: (opts: unknown) => Promise<FileSystemFileHandle[]> }).showOpenFilePicker({
            types: [
              {
                description: 'Text files',
                accept: { 'text/*': FILE_TYPES },
              },
            ],
            multiple: false,
          });
          handle = fileHandle;
          const file = await fileHandle.getFile();
          name = file.name;
          content = await file.text();
        } else {
          const result = await openFallback();
          name = result.name;
          content = result.content;
        }

        if (handle) handleCacheRef.current.set(name, handle);
        addToRecentFiles(name);
        showToast(`Opened: ${name}`, 'success', 2000);
        return { name, content, handle };
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return null;
        showToast('Failed to open file', 'error', 3000);
        return null;
      }
    },
    [isNativeSupported, openFallback, addToRecentFiles, showToast]
  );

  const saveFile = useCallback(
    async (
      panelId: PanelId,
      content: string,
      currentName: string,
      currentHandle: FileSystemFileHandle | null
    ) => {
      try {
        if (isNativeSupported() && currentHandle) {
          const writable = await currentHandle.createWritable();
          await writable.write(content);
          await writable.close();
          showToast('File saved', 'success', 2000);
          return { name: currentName, handle: currentHandle };
        } else if (isNativeSupported() && !currentHandle) {
          return saveAsFile(panelId, content, currentName);
        } else {
          saveFallback(content, currentName);
          showToast('File saved', 'success', 2000);
          return { name: currentName, handle: null };
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return null;
        showToast('Failed to save file', 'error', 3000);
        return null;
      }
    },
    [isNativeSupported, saveFallback, showToast]
  );

  const saveAsFile = useCallback(
    async (_panelId: PanelId, content: string, suggestedName?: string) => {
      try {
        let name: string;
        let handle: FileSystemFileHandle | null = null;

        if (isNativeSupported()) {
          handle = await (window as unknown as { showSaveFilePicker: (opts: unknown) => Promise<FileSystemFileHandle> }).showSaveFilePicker({
            suggestedName: suggestedName || 'untitled.txt',
            types: [{ description: 'Text files', accept: { 'text/plain': ['.txt'] } }],
          });
          const writable = await handle.createWritable();
          await writable.write(content);
          await writable.close();
          name = handle.name;
        } else {
          name = suggestedName || 'untitled.txt';
          saveFallback(content, name);
        }

        showToast(`Saved as: ${name}`, 'success', 2000);
        return { name, handle };
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return null;
        showToast('Failed to save file', 'error', 3000);
        return null;
      }
    },
    [isNativeSupported, saveFallback, showToast]
  );

  const getRecentFiles = useCallback((): RecentFile[] => {
    return (settings.recentFiles || []).map((f) =>
      typeof f === 'string' ? { name: f as string, time: 0 } : f
    );
  }, [settings.recentFiles]);

  const clearRecentFiles = useCallback(() => {
    setSetting('recentFiles', []);
    handleCacheRef.current.clear();
  }, [setSetting]);

  const reopenRecent = useCallback(
    async (name: string, panelId: PanelId) => {
      const handle = handleCacheRef.current.get(name);
      if (handle) {
        try {
          const file = await handle.getFile();
          const content = await file.text();
          addToRecentFiles(file.name);
          showToast(`Reopened: ${file.name}`, 'success', 2000);
          return { name: file.name, content, handle };
        } catch {
          // Fall through to normal open
        }
      }
      showToast(`Select "${name}" to reopen`, 'info', 3000);
      return openFile(panelId);
    },
    [openFile, addToRecentFiles, showToast]
  );

  return (
    <FileContext.Provider
      value={{
        openFile,
        saveFile,
        saveAsFile,
        isNativeSupported,
        getRecentFiles,
        clearRecentFiles,
        reopenRecent,
      }}
    >
      {children}
    </FileContext.Provider>
  );
}

export function useFileContext(): FileContextValue {
  const ctx = useContext(FileContext);
  if (!ctx) throw new Error('useFileContext must be used within FileProvider');
  return ctx;
}
