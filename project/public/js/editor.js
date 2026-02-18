/**
 * editor.js - EditorManager + Line Numbers + Cursor Management
 * Text Diff Editor - Prototype C
 */

class EditorManager {
  /** Large file warning threshold: 10 MB */
  static LARGE_FILE_THRESHOLD = 10 * 1024 * 1024;

  /**
   * @param {HTMLTextAreaElement} textarea - The textarea element.
   * @param {HTMLElement} lineNumbersContainer - Line numbers container.
   * @param {string} panelId - Panel identifier ('left' or 'right').
   */
  constructor(textarea, lineNumbersContainer, panelId) {
    this.textarea = textarea;
    this.lineNumbers = lineNumbersContainer;
    this.panelId = panelId;
    this.modified = false;
    this.fileHandle = null;
    this.fileName = 'Untitled';
    this.undoStack = [];
    this.redoStack = [];
    this.maxHistory = 1000;
    this.lastContent = '';
    this.historyTimer = null;
    this._lastLineCount = 0;

    this._setupEventListeners();
    this.updateLineNumbers();
  }

  _setupEventListeners() {
    this.textarea.addEventListener('input', () => {
      this._onContentChange();
    });

    this.textarea.addEventListener('keyup', () => this._emitCursorPosition());
    this.textarea.addEventListener('click', () => this._emitCursorPosition());
    this.textarea.addEventListener('focus', () => {
      EventBus.emit('editor:focus', { panelId: this.panelId });
    });

    this.textarea.addEventListener('scroll', () => {
      this._syncLineNumberScroll();
      EventBus.emit('editor:scroll', {
        panelId: this.panelId,
        scrollTop: this.textarea.scrollTop,
        scrollLeft: this.textarea.scrollLeft,
        scrollHeight: this.textarea.scrollHeight
      });
    });

    // Drag and drop support
    this.textarea.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.textarea.classList.add('drag-over');
    });

    this.textarea.addEventListener('dragleave', () => {
      this.textarea.classList.remove('drag-over');
    });

    this.textarea.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.textarea.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file) {
        EventBus.emit('file:drop', { panelId: this.panelId, file });
      }
    });

    // Keyboard shortcuts
    this.textarea.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        this.undo();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        this.redo();
      }
    });
  }

  _onContentChange() {
    const content = this.textarea.value;

    // Record undo history with debounce
    clearTimeout(this.historyTimer);
    this.historyTimer = setTimeout(() => {
      if (content !== this.lastContent) {
        this.undoStack.push(this.lastContent);
        if (this.undoStack.length > this.maxHistory) {
          this.undoStack.shift();
        }
        this.redoStack = [];
        this.lastContent = content;
      }
    }, 300);

    if (!this.modified) {
      this.modified = true;
      EventBus.emit('file:modified', { panelId: this.panelId, modified: true });
    }

    this.updateLineNumbers();
    this._emitCursorPosition();
    EventBus.emit('editor:change', { panelId: this.panelId, content });
  }

  _emitCursorPosition() {
    const pos = this.getCursorPosition();
    EventBus.emit('editor:cursor', {
      panelId: this.panelId,
      line: pos.line,
      column: pos.column
    });
  }

  _syncLineNumberScroll() {
    if (this.lineNumbers) {
      this.lineNumbers.scrollTop = this.textarea.scrollTop;
    }
  }

  /**
   * Get the current editor text content.
   * @returns {string}
   */
  getText() {
    return this.textarea.value;
  }

  /**
   * Set the editor text content.
   * Emits a large file warning if content exceeds threshold.
   * @param {string} text - The text to set.
   */
  setText(text) {
    // Large file warning
    if (text && text.length > EditorManager.LARGE_FILE_THRESHOLD) {
      EventBus.emit('toast:show', {
        message: `Large file (${Utils.formatFileSize(text.length)}). Editing may be slow.`,
        type: 'warning',
        duration: 5000
      });
    }
    this.undoStack.push(this.lastContent);
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    this.redoStack = [];

    this.textarea.value = text;
    this.lastContent = text;
    this.updateLineNumbers();
    EventBus.emit('editor:change', { panelId: this.panelId, content: text });
  }

  /**
   * Get the current text selection range and content.
   * @returns {{ start: number, end: number, text: string }}
   */
  getSelection() {
    return {
      start: this.textarea.selectionStart,
      end: this.textarea.selectionEnd,
      text: this.textarea.value.substring(this.textarea.selectionStart, this.textarea.selectionEnd)
    };
  }

  /**
   * Get the current cursor position as line/column.
   * @returns {{ line: number, column: number }}
   */
  getCursorPosition() {
    const text = this.textarea.value;
    const pos = this.textarea.selectionStart;
    const lines = text.substring(0, pos).split('\n');
    return {
      line: lines.length,
      column: lines[lines.length - 1].length + 1
    };
  }

  /**
   * Set the cursor to a specific line and column.
   * @param {number} line - 1-based line number.
   * @param {number} column - 1-based column number.
   */
  setCursorPosition(line, column) {
    const lines = this.textarea.value.split('\n');
    let pos = 0;
    for (let i = 0; i < Math.min(line - 1, lines.length); i++) {
      pos += lines[i].length + 1;
    }
    pos += Math.min(column - 1, (lines[line - 1] || '').length);
    this.textarea.selectionStart = pos;
    this.textarea.selectionEnd = pos;
    this.textarea.focus();
  }

  /**
   * Insert text at a specific character position.
   * @param {number} position - Character offset.
   * @param {string} text - Text to insert.
   */
  insertText(position, text) {
    const before = this.textarea.value.substring(0, position);
    const after = this.textarea.value.substring(position);
    this.textarea.value = before + text + after;
    this._onContentChange();
  }

  /**
   * Replace a character range with new text.
   * @param {number} start - Start offset.
   * @param {number} end - End offset.
   * @param {string} replacement - Replacement text.
   */
  replaceRange(start, end, replacement) {
    const before = this.textarea.value.substring(0, start);
    const after = this.textarea.value.substring(end);
    this.textarea.value = before + replacement + after;
    this.textarea.selectionStart = start + replacement.length;
    this.textarea.selectionEnd = start + replacement.length;
    this._onContentChange();
  }

  /** Undo the last edit, restoring previous content. */
  undo() {
    if (this.undoStack.length === 0) return;
    const current = this.textarea.value;
    this.redoStack.push(current);
    const prev = this.undoStack.pop();
    this.textarea.value = prev;
    this.lastContent = prev;
    this.updateLineNumbers();
    EventBus.emit('editor:change', { panelId: this.panelId, content: prev });
  }

  /** Redo the last undone edit. */
  redo() {
    if (this.redoStack.length === 0) return;
    const current = this.textarea.value;
    this.undoStack.push(current);
    const next = this.redoStack.pop();
    this.textarea.value = next;
    this.lastContent = next;
    this.updateLineNumbers();
    EventBus.emit('editor:change', { panelId: this.panelId, content: next });
  }

  /**
   * Update line number gutter display.
   * Uses incremental add/remove for better performance with 10000+ lines.
   */
  updateLineNumbers() {
    if (!this.lineNumbers) return;
    const lineCount = this.getLineCount();
    const currentCount = this._lastLineCount;

    // Only re-render if count changed
    if (currentCount === lineCount) return;
    this._lastLineCount = lineCount;

    // For large changes (>500 line diff), full rebuild is faster
    const diff = lineCount - currentCount;
    if (Math.abs(diff) > 500 || currentCount === 0) {
      const fragment = document.createDocumentFragment();
      this.lineNumbers.innerHTML = '';
      for (let i = 1; i <= lineCount; i++) {
        const div = document.createElement('div');
        div.className = 'line-number';
        div.textContent = i;
        fragment.appendChild(div);
      }
      this.lineNumbers.appendChild(fragment);
      return;
    }

    // Incremental update: add or remove lines at the end
    if (diff > 0) {
      const fragment = document.createDocumentFragment();
      for (let i = currentCount + 1; i <= lineCount; i++) {
        const div = document.createElement('div');
        div.className = 'line-number';
        div.textContent = i;
        fragment.appendChild(div);
      }
      this.lineNumbers.appendChild(fragment);
    } else {
      for (let i = 0; i < -diff; i++) {
        const last = this.lineNumbers.lastChild;
        if (last) this.lineNumbers.removeChild(last);
      }
    }
  }

  /**
   * Get the total number of lines in the editor.
   * @returns {number}
   */
  getLineCount() {
    const text = this.textarea.value;
    if (text === '') return 1;
    return text.split('\n').length;
  }

  /**
   * Scroll the editor to bring a specific line into view with smooth scrolling.
   * @param {number} line - 1-based line number.
   */
  scrollToLine(line) {
    const lineHeight = parseFloat(getComputedStyle(this.textarea).lineHeight) || 27;
    const targetTop = (line - 1) * lineHeight;
    this.textarea.scrollTo({ top: targetTop, behavior: 'smooth' });
  }

  /**
   * Set the editor font size.
   * @param {number} size - Font size in pixels.
   */
  setFontSize(size) {
    this.textarea.style.fontSize = `${size}px`;
    this.textarea.style.lineHeight = `${Math.round(size * 1.5)}px`;
    if (this.lineNumbers) {
      this.lineNumbers.style.fontSize = `${size}px`;
      this.lineNumbers.style.lineHeight = `${Math.round(size * 1.5)}px`;
    }
  }

  /**
   * Set the editor font family.
   * @param {string} fontFamily - CSS font-family value.
   */
  setFontFamily(fontFamily) {
    this.textarea.style.fontFamily = fontFamily;
    if (this.lineNumbers) {
      this.lineNumbers.style.fontFamily = fontFamily;
    }
  }

  /**
   * Set the editor line height multiplier.
   * @param {number} lineHeight - Multiplier relative to font size.
   */
  setLineHeight(lineHeight) {
    const fontSize = parseFloat(this.textarea.style.fontSize) || 18;
    const px = Math.round(fontSize * lineHeight);
    this.textarea.style.lineHeight = `${px}px`;
    if (this.lineNumbers) {
      this.lineNumbers.style.lineHeight = `${px}px`;
    }
  }

  /**
   * Enable or disable word wrapping.
   * @param {boolean} wrap - Whether to wrap lines.
   */
  setWordWrap(wrap) {
    this.textarea.style.whiteSpace = wrap ? 'pre-wrap' : 'pre';
    this.textarea.style.overflowX = wrap ? 'hidden' : 'auto';
  }

  /** Focus the textarea element. */
  focus() {
    this.textarea.focus();
  }

  /** Clear the modified flag and emit a file:modified event. */
  clearModified() {
    this.modified = false;
    EventBus.emit('file:modified', { panelId: this.panelId, modified: false });
  }

  /** Clean up timers and resources. */
  destroy() {
    clearTimeout(this.historyTimer);
  }
}
