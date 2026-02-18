/**
 * files.js - FileManager + AutoSave
 * Text Diff Editor - Prototype C
 */

// ============================================================
// FileManager - File System Access API + Fallback
// ============================================================
class FileManager {
  /** Create the FileManager and wire up EventBus listeners. */
  constructor() {
    this.files = {
      left: { name: 'Untitled', handle: null, content: '' },
      right: { name: 'Untitled', handle: null, content: '' }
    };

    EventBus.on('file:save', (data) => this._onSaveRequest(data));
    EventBus.on('file:save-as', (data) => this._onSaveAsRequest(data));
    EventBus.on('file:drop', (data) => this._onDrop(data));
  }

  /**
   * Check if the File System Access API is available.
   * @returns {boolean}
   */
  isNativeSupported() {
    return 'showOpenFilePicker' in window;
  }

  /**
   * Open a file using the native picker or fallback input.
   * @param {string} panelId - Panel identifier ('left' or 'right').
   * @returns {Promise<{ name: string, content: string, handle: FileSystemFileHandle|null }|null>}
   */
  async openFile(panelId) {
    try {
      let name, content, handle = null;

      if (this.isNativeSupported()) {
        const [fileHandle] = await window.showOpenFilePicker({
          types: [{
            description: 'Text files',
            accept: { 'text/*': ['.txt', '.md', '.js', '.html', '.css', '.json', '.xml', '.csv', '.py', '.java', '.c', '.cpp', '.h', '.ts', '.tsx', '.jsx', '.yml', '.yaml', '.toml', '.ini', '.cfg', '.log', '.sh', '.bash', '.zsh'] }
          }],
          multiple: false
        });
        handle = fileHandle;
        const file = await fileHandle.getFile();
        name = file.name;
        content = await file.text();
      } else {
        // Fallback: input[type=file]
        const result = await this._openFallback();
        name = result.name;
        content = result.content;
      }

      this.files[panelId] = { name, handle, content };

      // Track recent files
      this._addToRecentFiles(name);

      EventBus.emit('file:open', { panelId, name, content, handle });
      EventBus.emit('toast:show', {
        message: `Opened: ${name}`,
        type: 'success',
        duration: 2000
      });

      return { name, content, handle };
    } catch (err) {
      if (err.name !== 'AbortError') {
        EventBus.emit('file:error', {
          panelId,
          error: err.message,
          action: 'open'
        });
        EventBus.emit('toast:show', {
          message: 'Failed to open file',
          type: 'error',
          duration: 3000
        });
      }
      return null;
    }
  }

  _openFallback() {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.txt,.md,.js,.html,.css,.json,.xml,.csv,.py,.java,.c,.cpp,.h,.ts,.tsx,.jsx,.yml,.yaml,.toml,.ini,.cfg,.log,.sh,.bash,.zsh';
      input.onchange = async () => {
        const file = input.files[0];
        if (!file) {
          reject(new DOMException('No file selected', 'AbortError'));
          return;
        }
        const content = await file.text();
        resolve({ name: file.name, content });
      };
      // Handle cancel: when focus returns to window without a file selection
      const onFocus = () => {
        window.removeEventListener('focus', onFocus);
        setTimeout(() => {
          if (!input.files || input.files.length === 0) {
            reject(new DOMException('User cancelled file picker', 'AbortError'));
          }
        }, 300);
      };
      window.addEventListener('focus', onFocus);
      input.click();
    });
  }

  /**
   * Save content to the current file handle or prompt for Save As.
   * @param {string} panelId - Panel identifier ('left' or 'right').
   * @param {string} content - Text content to save.
   * @returns {Promise<boolean>}
   */
  async saveFile(panelId, content) {
    try {
      const fileState = this.files[panelId];

      if (this.isNativeSupported() && fileState.handle) {
        const writable = await fileState.handle.createWritable();
        await writable.write(content);
        await writable.close();
      } else if (this.isNativeSupported() && !fileState.handle) {
        return this.saveAsFile(panelId, content, fileState.name);
      } else {
        this._saveFallback(content, fileState.name);
      }

      fileState.content = content;
      EventBus.emit('file:saved', { panelId, name: fileState.name });
      EventBus.emit('toast:show', {
        message: 'File saved',
        type: 'success',
        duration: 2000
      });
      return true;
    } catch (err) {
      if (err.name !== 'AbortError') {
        EventBus.emit('file:error', {
          panelId,
          error: err.message,
          action: 'save'
        });
        EventBus.emit('toast:show', {
          message: 'Failed to save file',
          type: 'error',
          duration: 3000
        });
      }
      return false;
    }
  }

  /**
   * Save content to a new file via Save As dialog.
   * @param {string} panelId - Panel identifier.
   * @param {string} content - Text content.
   * @param {string} [suggestedName] - Suggested file name.
   * @returns {Promise<{ name: string, handle: FileSystemFileHandle|null }|null>}
   */
  async saveAsFile(panelId, content, suggestedName) {
    try {
      let name, handle = null;

      if (this.isNativeSupported()) {
        handle = await window.showSaveFilePicker({
          suggestedName: suggestedName || 'untitled.txt',
          types: [{
            description: 'Text files',
            accept: { 'text/plain': ['.txt'] }
          }]
        });
        const writable = await handle.createWritable();
        await writable.write(content);
        await writable.close();
        name = handle.name;
      } else {
        name = suggestedName || 'untitled.txt';
        this._saveFallback(content, name);
      }

      this.files[panelId] = { name, handle, content };
      EventBus.emit('file:saved', { panelId, name });
      EventBus.emit('toast:show', {
        message: `Saved as: ${name}`,
        type: 'success',
        duration: 2000
      });
      return { name, handle };
    } catch (err) {
      if (err.name !== 'AbortError') {
        EventBus.emit('file:error', {
          panelId,
          error: err.message,
          action: 'save-as'
        });
      }
      return null;
    }
  }

  _saveFallback(content, filename) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Create a new empty file for the given panel.
   * @param {string} panelId - Panel identifier.
   */
  createNew(panelId) {
    this.files[panelId] = { name: 'Untitled', handle: null, content: '' };
    EventBus.emit('file:new', { panelId });
  }

  /**
   * Handle a file dropped onto a panel.
   * @param {string} panelId - Panel identifier.
   * @param {File} file - Dropped file.
   * @returns {Promise<{ name: string, content: string }|null>}
   */
  async handleDrop(panelId, file) {
    try {
      // Warn about binary files
      if (file.type && !file.type.startsWith('text/') && !file.type.includes('json') && !file.type.includes('xml') && !file.type.includes('javascript')) {
        EventBus.emit('toast:show', {
          message: 'This may not be a text file',
          type: 'warning',
          duration: 3000
        });
      }

      const content = await file.text();
      this.files[panelId] = { name: file.name, handle: null, content };
      EventBus.emit('file:open', { panelId, name: file.name, content, handle: null });
      return { name: file.name, content };
    } catch (err) {
      EventBus.emit('toast:show', {
        message: 'Failed to read dropped file',
        type: 'error',
        duration: 3000
      });
      return null;
    }
  }

  getFileName(panelId) {
    return this.files[panelId]?.name || 'Untitled';
  }

  /**
   * Add a filename to the recent files list in Settings.
   * @param {string} name - File name.
   */
  _addToRecentFiles(name) {
    if (!name || name === 'Untitled') return;
    try {
      let recent = Settings.get('recentFiles') || [];
      recent = recent.filter(f => f !== name);
      recent.unshift(name);
      if (recent.length > 10) recent = recent.slice(0, 10);
      Settings.set('recentFiles', recent);
    } catch (_e) {
      // Silently fail
    }
  }

  /**
   * Get the recent files list.
   * @returns {string[]}
   */
  getRecentFiles() {
    return Settings.get('recentFiles') || [];
  }

  _onSaveRequest(data) {
    // Will be handled by app.js integration
  }

  _onSaveAsRequest(data) {
    // Will be handled by app.js integration
  }

  async _onDrop(data) {
    await this.handleDrop(data.panelId, data.file);
  }

  destroy() {}
}

// ============================================================
// AutoSave - Timer-based auto-save
// ============================================================
class AutoSave {
  constructor() {
    this.timer = null;
    this.interval = 0;
    this._enabled = false;
    this._modified = false;

    EventBus.on('file:modified', (data) => {
      this._modified = data.modified;
      if (data.modified && this._enabled) {
        this.resetTimer();
      }
    });

    EventBus.on('file:saved', () => {
      this._modified = false;
    });
  }

  start(intervalMs) {
    this.interval = intervalMs;
    this._enabled = true;
    this._startTimer();
  }

  stop() {
    this._enabled = false;
    clearTimeout(this.timer);
    this.timer = null;
  }

  resetTimer() {
    clearTimeout(this.timer);
    if (this._enabled && this.interval > 0) {
      this._startTimer();
    }
  }

  _startTimer() {
    this.timer = setTimeout(() => {
      if (this._modified) {
        EventBus.emit('file:save', { panelId: 'left', auto: true });
      }
      if (this._enabled) {
        this._startTimer();
      }
    }, this.interval);
  }

  isEnabled() {
    return this._enabled;
  }

  destroy() {
    this.stop();
  }
}
