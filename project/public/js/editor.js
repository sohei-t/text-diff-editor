/**
 * editor.js - EditorManager + Line Numbers + Cursor Management
 * Text Diff Editor - Prototype C
 */

class EditorManager {
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

  getText() {
    return this.textarea.value;
  }

  setText(text) {
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

  getSelection() {
    return {
      start: this.textarea.selectionStart,
      end: this.textarea.selectionEnd,
      text: this.textarea.value.substring(this.textarea.selectionStart, this.textarea.selectionEnd)
    };
  }

  getCursorPosition() {
    const text = this.textarea.value;
    const pos = this.textarea.selectionStart;
    const lines = text.substring(0, pos).split('\n');
    return {
      line: lines.length,
      column: lines[lines.length - 1].length + 1
    };
  }

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

  insertText(position, text) {
    const before = this.textarea.value.substring(0, position);
    const after = this.textarea.value.substring(position);
    this.textarea.value = before + text + after;
    this._onContentChange();
  }

  replaceRange(start, end, replacement) {
    const before = this.textarea.value.substring(0, start);
    const after = this.textarea.value.substring(end);
    this.textarea.value = before + replacement + after;
    this.textarea.selectionStart = start + replacement.length;
    this.textarea.selectionEnd = start + replacement.length;
    this._onContentChange();
  }

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

  updateLineNumbers() {
    if (!this.lineNumbers) return;
    const lineCount = this.getLineCount();
    const fragment = document.createDocumentFragment();

    // Only re-render if count changed
    const currentCount = this.lineNumbers.children.length;
    if (currentCount === lineCount) return;

    this.lineNumbers.innerHTML = '';
    for (let i = 1; i <= lineCount; i++) {
      const div = document.createElement('div');
      div.className = 'line-number';
      div.textContent = i;
      fragment.appendChild(div);
    }
    this.lineNumbers.appendChild(fragment);
  }

  getLineCount() {
    const text = this.textarea.value;
    if (text === '') return 1;
    return text.split('\n').length;
  }

  scrollToLine(line) {
    const lineHeight = parseFloat(getComputedStyle(this.textarea).lineHeight) || 27;
    this.textarea.scrollTop = (line - 1) * lineHeight;
  }

  setFontSize(size) {
    this.textarea.style.fontSize = `${size}px`;
    this.textarea.style.lineHeight = `${Math.round(size * 1.5)}px`;
    if (this.lineNumbers) {
      this.lineNumbers.style.fontSize = `${size}px`;
      this.lineNumbers.style.lineHeight = `${Math.round(size * 1.5)}px`;
    }
  }

  setFontFamily(fontFamily) {
    this.textarea.style.fontFamily = fontFamily;
    if (this.lineNumbers) {
      this.lineNumbers.style.fontFamily = fontFamily;
    }
  }

  setLineHeight(lineHeight) {
    const fontSize = parseFloat(this.textarea.style.fontSize) || 18;
    const px = Math.round(fontSize * lineHeight);
    this.textarea.style.lineHeight = `${px}px`;
    if (this.lineNumbers) {
      this.lineNumbers.style.lineHeight = `${px}px`;
    }
  }

  setWordWrap(wrap) {
    this.textarea.style.whiteSpace = wrap ? 'pre-wrap' : 'pre';
    this.textarea.style.overflowX = wrap ? 'hidden' : 'auto';
  }

  focus() {
    this.textarea.focus();
  }

  clearModified() {
    this.modified = false;
    EventBus.emit('file:modified', { panelId: this.panelId, modified: false });
  }

  destroy() {
    clearTimeout(this.historyTimer);
  }
}
