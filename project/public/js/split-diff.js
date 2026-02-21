/**
 * split-diff.js - SplitView + DiffEngine + Diff Display
 * Text Diff Editor - Prototype C
 */

// ============================================================
// DiffEngine - Myers Diff Algorithm Implementation
// ============================================================
class DiffEngine {
  constructor() {
    /** @type {Map<string, Object>} Simple cache keyed by hash of inputs */
    this._cache = new Map();
    this._cacheMaxSize = 20;
  }

  /**
   * Compute a line-level diff between two texts.
   * Results are cached for repeated comparisons.
   * @param {string} textA - Original text.
   * @param {string} textB - Modified text.
   * @returns {{ changes: Object[], stats: Object }}
   */
  computeLineDiff(textA, textB) {
    // Check cache
    const cacheKey = textA.length + ':' + textB.length + ':' + (textA.slice(0, 64)) + ':' + (textB.slice(0, 64));
    if (this._cache.has(cacheKey)) {
      const cached = this._cache.get(cacheKey);
      if (cached._fullKeyA === textA && cached._fullKeyB === textB) {
        return { changes: cached.changes, stats: cached.stats };
      }
    }

    // Normalize line endings
    const linesA = this._normalizeAndSplit(textA);
    const linesB = this._normalizeAndSplit(textB);

    const ops = this._myersDiff(linesA, linesB);
    const changes = this._buildChanges(ops, linesA, linesB);
    const stats = this.computeStats(changes);

    // Store in cache
    if (this._cache.size >= this._cacheMaxSize) {
      const firstKey = this._cache.keys().next().value;
      this._cache.delete(firstKey);
    }
    this._cache.set(cacheKey, { changes, stats, _fullKeyA: textA, _fullKeyB: textB });

    return { changes, stats };
  }

  _normalizeAndSplit(text) {
    if (!text && text !== '') return [''];
    return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  }

  _myersDiff(a, b) {
    const N = a.length;
    const M = b.length;
    const MAX = N + M;
    const v = new Array(2 * MAX + 1);
    v[MAX + 1] = 0;
    const trace = [];

    for (let d = 0; d <= MAX; d++) {
      const newV = v.slice();
      for (let k = -d; k <= d; k += 2) {
        let x;
        if (k === -d || (k !== d && v[MAX + k - 1] < v[MAX + k + 1])) {
          x = v[MAX + k + 1];
        } else {
          x = v[MAX + k - 1] + 1;
        }
        let y = x - k;

        while (x < N && y < M && a[x] === b[y]) {
          x++;
          y++;
        }

        newV[MAX + k] = x;

        if (x >= N && y >= M) {
          trace.push(newV);
          return this._backtrack(trace, MAX, N, M);
        }
      }
      trace.push(newV.slice());
      for (let k = -d; k <= d; k += 2) {
        v[MAX + k] = newV[MAX + k];
      }
    }

    return [];
  }

  _backtrack(trace, MAX, N, M) {
    let x = N;
    let y = M;
    const ops = [];

    for (let d = trace.length - 1; d >= 0; d--) {
      const v = trace[d];
      const k = x - y;

      let prevK;
      if (k === -d || (k !== d && (d > 0 ? trace[d - 1][MAX + k - 1] : 0) < (d > 0 ? trace[d - 1][MAX + k + 1] : 0))) {
        prevK = k + 1;
      } else {
        prevK = k - 1;
      }

      const prevX = d > 0 ? trace[d - 1][MAX + prevK] : 0;
      const prevY = prevX - prevK;

      // Diagonal moves (equal)
      while (x > prevX + (prevK < k ? 1 : 0) && y > prevY + (prevK < k ? 0 : 1)) {
        x--;
        y--;
        ops.unshift({ type: 'equal', lineA: x, lineB: y });
      }

      if (d > 0) {
        if (prevK < k) {
          // Delete from A
          x--;
          ops.unshift({ type: 'delete', lineA: x });
        } else {
          // Insert from B
          y--;
          ops.unshift({ type: 'add', lineB: y });
        }
      }

      // Diagonal moves before the edit
      while (x > prevX && y > prevY) {
        x--;
        y--;
        ops.unshift({ type: 'equal', lineA: x, lineB: y });
      }
    }

    return ops;
  }

  _buildChanges(ops, linesA, linesB) {
    const changes = [];
    let i = 0;

    while (i < ops.length) {
      const op = ops[i];

      if (op.type === 'equal') {
        changes.push({
          type: 'equal',
          lineLeft: op.lineA + 1,
          lineRight: op.lineB + 1,
          contentLeft: linesA[op.lineA],
          contentRight: linesB[op.lineB],
          inlineDiffs: []
        });
        i++;
      } else if (op.type === 'delete' && i + 1 < ops.length && ops[i + 1].type === 'add') {
        // Modify: delete followed by add
        const delOp = op;
        const addOp = ops[i + 1];
        const inlineDiffs = this.computeInlineDiff(linesA[delOp.lineA], linesB[addOp.lineB]);
        changes.push({
          type: 'modify',
          lineLeft: delOp.lineA + 1,
          lineRight: addOp.lineB + 1,
          contentLeft: linesA[delOp.lineA],
          contentRight: linesB[addOp.lineB],
          inlineDiffs
        });
        i += 2;
      } else if (op.type === 'delete') {
        changes.push({
          type: 'delete',
          lineLeft: op.lineA + 1,
          lineRight: null,
          contentLeft: linesA[op.lineA],
          contentRight: '',
          inlineDiffs: []
        });
        i++;
      } else if (op.type === 'add') {
        changes.push({
          type: 'add',
          lineLeft: null,
          lineRight: op.lineB + 1,
          contentLeft: '',
          contentRight: linesB[op.lineB],
          inlineDiffs: []
        });
        i++;
      } else {
        i++;
      }
    }

    // Handle edge case: if ops is empty but texts are different
    if (changes.length === 0 && (linesA.length > 0 || linesB.length > 0)) {
      // Both empty or one empty
      if (linesA.join('') === '' && linesB.join('') === '') {
        changes.push({
          type: 'equal', lineLeft: 1, lineRight: 1,
          contentLeft: '', contentRight: '', inlineDiffs: []
        });
      }
    }

    return changes;
  }

  /**
   * Compute character-level inline diff between two lines using LCS.
   * @param {string} lineA - Original line.
   * @param {string} lineB - Modified line.
   * @returns {Array<{ type: string, text: string }>}
   */
  computeInlineDiff(lineA, lineB) {
    if (lineA === lineB) {
      return [{ type: 'equal', text: lineA }];
    }

    const result = [];
    const charsA = lineA.split('');
    const charsB = lineB.split('');

    // Simple LCS-based inline diff
    const lcs = this._lcs(charsA, charsB);
    let idxA = 0, idxB = 0, idxL = 0;

    while (idxA < charsA.length || idxB < charsB.length) {
      if (idxL < lcs.length && idxA < charsA.length && charsA[idxA] === lcs[idxL] && idxB < charsB.length && charsB[idxB] === lcs[idxL]) {
        // Equal
        let eq = '';
        while (idxL < lcs.length && idxA < charsA.length && idxB < charsB.length && charsA[idxA] === lcs[idxL] && charsB[idxB] === lcs[idxL]) {
          eq += charsA[idxA];
          idxA++;
          idxB++;
          idxL++;
        }
        if (eq) result.push({ type: 'equal', text: eq });
      } else {
        // Deletions from A
        let del = '';
        while (idxA < charsA.length && (idxL >= lcs.length || charsA[idxA] !== lcs[idxL])) {
          del += charsA[idxA];
          idxA++;
        }
        if (del) result.push({ type: 'delete', text: del });

        // Additions from B
        let add = '';
        while (idxB < charsB.length && (idxL >= lcs.length || charsB[idxB] !== lcs[idxL])) {
          add += charsB[idxB];
          idxB++;
        }
        if (add) result.push({ type: 'add', text: add });
      }
    }

    return result;
  }

  _lcs(a, b) {
    const m = a.length;
    const n = b.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (a[i - 1] === b[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    // Backtrack
    const result = [];
    let i = m, j = n;
    while (i > 0 && j > 0) {
      if (a[i - 1] === b[j - 1]) {
        result.unshift(a[i - 1]);
        i--;
        j--;
      } else if (dp[i - 1][j] > dp[i][j - 1]) {
        i--;
      } else {
        j--;
      }
    }
    return result;
  }

  /**
   * Compute summary statistics from a list of change objects.
   * @param {Object[]} changes - Array of change records.
   * @returns {{ added: number, deleted: number, modified: number, unchanged: number }}
   */
  computeStats(changes) {
    const stats = { added: 0, deleted: 0, modified: 0, unchanged: 0 };
    changes.forEach(c => {
      switch (c.type) {
        case 'add': stats.added++; break;
        case 'delete': stats.deleted++; break;
        case 'modify': stats.modified++; break;
        case 'equal': stats.unchanged++; break;
      }
    });
    return stats;
  }

  /**
   * Async diff computation for large files.
   * Uses setTimeout to yield to the main thread.
   * @param {string} textA - Original text.
   * @param {string} textB - Modified text.
   * @param {Function} [onProgress] - Progress callback (0-100).
   * @returns {Promise<{changes: Object[], stats: Object}>}
   */
  async computeAsync(textA, textB, onProgress) {
    return new Promise((resolve) => {
      if (onProgress) onProgress(0);

      setTimeout(() => {
        const result = this.computeLineDiff(textA, textB);
        if (onProgress) onProgress(100);
        resolve(result);
      }, 0);
    });
  }

  /** Clear the diff result cache. */
  clearCache() {
    this._cache.clear();
  }
}

// ============================================================
// SplitView - Two-pane layout with draggable splitter
// ============================================================
class SplitView {
  /**
   * @param {HTMLElement} container - The editor container.
   */
  constructor(container) {
    this.container = container;
    this.leftPanel = document.getElementById('panel-left');
    this.centerPanel = document.getElementById('panel-center');
    this.rightPanel = document.getElementById('panel-right');
    this.splitter = document.getElementById('splitter');
    this.splitter2 = document.getElementById('splitter-2');
    this._enabled = false;
    /** @type {0|2|3} Number of visible panels (0=single, 2=dual, 3=triple) */
    this.paneCount = 0;
    this.ratio = 0.5;
    this.syncScroll = true;
    this.dragging = false;
    this.diffEngine = new DiffEngine();
    this.changes = [];
    this.currentChangeIndex = -1;

    this._setupSplitter();
    this._setupSplitter2();
    this._setupDiffListener();
    this._setupScrollSync();
  }

  _setupSplitter() {
    if (!this.splitter) return;

    this._onSplitterMouseDown = (e) => {
      e.preventDefault();
      this.dragging = 'splitter1';
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    };

    this._onSplitterMouseMove = (e) => {
      if (this.dragging !== 'splitter1') return;
      const containerRect = this.container.getBoundingClientRect();
      const pos = (e.clientX - containerRect.left) / containerRect.width;
      if (this.paneCount === 3) {
        this._applyTripleRatios(pos, null);
      } else {
        this.setSplitRatio(pos);
      }
    };

    this._onSplitterMouseUp = () => {
      if (this.dragging === 'splitter1') {
        this.dragging = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    this.splitter.addEventListener('mousedown', this._onSplitterMouseDown);
    document.addEventListener('mousemove', this._onSplitterMouseMove);
    document.addEventListener('mouseup', this._onSplitterMouseUp);
  }

  _setupSplitter2() {
    if (!this.splitter2) return;

    this._onSplitter2MouseDown = (e) => {
      e.preventDefault();
      this.dragging = 'splitter2';
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    };

    this._onSplitter2MouseMove = (e) => {
      if (this.dragging !== 'splitter2') return;
      const containerRect = this.container.getBoundingClientRect();
      const pos = (e.clientX - containerRect.left) / containerRect.width;
      this._applyTripleRatios(null, pos);
    };

    this._onSplitter2MouseUp = () => {
      if (this.dragging === 'splitter2') {
        this.dragging = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    this.splitter2.addEventListener('mousedown', this._onSplitter2MouseDown);
    document.addEventListener('mousemove', this._onSplitter2MouseMove);
    document.addEventListener('mouseup', this._onSplitter2MouseUp);
  }

  _setupDiffListener() {
    const debouncedDiff = Utils.debounce((data) => {
      if (!this._enabled) return;
      const result = this.diffEngine.computeLineDiff(data.textLeft, data.textRight);
      this.changes = result.changes;
      this.currentChangeIndex = -1;
      EventBus.emit('diff:result', result);
    }, 150);

    EventBus.on('diff:compute', debouncedDiff);

    EventBus.on('diff:navigate', (data) => {
      this._navigateDiff(data.direction);
    });
  }

  _setupScrollSync() {
    EventBus.on('editor:scroll', (data) => {
      if (!this._enabled || !this.syncScroll) return;

      const otherPanelId = data.panelId === 'left' ? 'right' : 'left';
      const otherTextarea = document.getElementById(`editor-${otherPanelId}`);
      if (!otherTextarea) return;

      // Proportional sync
      const scrollRatio = data.scrollHeight > 0 ? data.scrollTop / data.scrollHeight : 0;
      otherTextarea.scrollTop = scrollRatio * otherTextarea.scrollHeight;
    });
  }

  /** Cycle split mode: 1 → 2 → 3 → 1 */
  toggle() {
    if (this.paneCount === 0) {
      this.setPaneCount(2);
    } else if (this.paneCount === 2) {
      this.setPaneCount(3);
    } else {
      this.setPaneCount(0);
    }
  }

  /**
   * Set the number of visible panes.
   * @param {0|2|3} count - 0=single, 2=dual, 3=triple
   */
  setPaneCount(count) {
    this.paneCount = count;
    this._enabled = count >= 2;

    // Reset all
    this.container.classList.remove('split-mode', 'triple-mode');
    this.rightPanel.hidden = true;
    this.centerPanel.hidden = true;
    this.splitter.hidden = true;
    if (this.splitter2) this.splitter2.hidden = true;
    this.leftPanel.style.width = '';
    this.rightPanel.style.width = '';
    if (this.centerPanel) this.centerPanel.style.width = '';

    if (count === 2) {
      this.rightPanel.hidden = false;
      this.splitter.hidden = false;
      this.container.classList.add('split-mode');
      this._applyRatio();
    } else if (count === 3) {
      this.centerPanel.hidden = false;
      this.rightPanel.hidden = false;
      this.splitter.hidden = false;
      if (this.splitter2) this.splitter2.hidden = false;
      this.container.classList.add('split-mode', 'triple-mode');
      this._applyTripleRatios();
    } else {
      this.changes = [];
      this.currentChangeIndex = -1;
      EventBus.emit('diff:clear', {});
    }

    EventBus.emit('split:toggle', { enabled: this._enabled, paneCount: count });
  }

  /**
   * @deprecated Use setPaneCount instead.
   */
  setSplit(enabled) {
    this.setPaneCount(enabled ? 2 : 0);
  }

  /**
   * Set the split ratio (left panel width proportion).
   * @param {number} ratio - Value between 0.2 and 0.8.
   */
  setSplitRatio(ratio) {
    this.ratio = Utils.clamp(ratio, 0.2, 0.8);
    if (this._enabled) {
      this._applyRatio();
    }
    EventBus.emit('split:resize', { ratio: this.ratio });
  }

  _applyRatio() {
    const splitterWidth = 8;
    this.leftPanel.style.width = `calc(${this.ratio * 100}% - ${splitterWidth / 2}px)`;
    this.rightPanel.style.width = `calc(${(1 - this.ratio) * 100}% - ${splitterWidth / 2}px)`;
  }

  /**
   * Apply widths for 3-panel layout.
   * @param {number|null} [split1Pos] - Position of splitter 1 (0-1). Null keeps current.
   * @param {number|null} [split2Pos] - Position of splitter 2 (0-1). Null keeps current.
   */
  _applyTripleRatios(split1Pos, split2Pos) {
    const sw = 8; // splitter width
    const totalSplitterWidth = sw * 2;

    // Current stored ratios (default: equal thirds)
    if (!this._tripleR1) this._tripleR1 = 1 / 3;
    if (!this._tripleR2) this._tripleR2 = 2 / 3;

    if (split1Pos !== null && split1Pos !== undefined) {
      this._tripleR1 = Utils.clamp(split1Pos, 0.15, this._tripleR2 - 0.15);
    }
    if (split2Pos !== null && split2Pos !== undefined) {
      this._tripleR2 = Utils.clamp(split2Pos, this._tripleR1 + 0.15, 0.85);
    }

    const r1 = this._tripleR1;
    const r2 = this._tripleR2;

    this.leftPanel.style.width = `calc(${r1 * 100}% - ${sw}px)`;
    this.centerPanel.style.width = `calc(${(r2 - r1) * 100}% - ${sw}px)`;
    this.rightPanel.style.width = `calc(${(1 - r2) * 100}%)`;
  }

  /**
   * Get the current split ratio.
   * @returns {number}
   */
  getSplitRatio() {
    return this.ratio;
  }

  /**
   * Get the panel element for the given side.
   * @param {'left'|'right'} side - Panel side.
   * @returns {HTMLElement}
   */
  getPane(side) {
    return side === 'left' ? this.leftPanel : this.rightPanel;
  }

  /**
   * Check if split view is currently active.
   * @returns {boolean}
   */
  isSplit() {
    return this._enabled;
  }

  /**
   * Enable or disable synchronized scrolling between panels.
   * @param {boolean} enabled - Whether to sync scroll positions.
   */
  setSyncScroll(enabled) {
    this.syncScroll = enabled;
    EventBus.emit('sync:change', { enabled });
  }

  _navigateDiff(direction) {
    const diffChanges = this.changes.filter(c => c.type !== 'equal');
    if (diffChanges.length === 0) return;

    if (direction === 'next') {
      this.currentChangeIndex = (this.currentChangeIndex + 1) % diffChanges.length;
    } else {
      this.currentChangeIndex = this.currentChangeIndex <= 0
        ? diffChanges.length - 1
        : this.currentChangeIndex - 1;
    }

    const change = diffChanges[this.currentChangeIndex];
    const line = change.lineLeft || change.lineRight || 1;

    EventBus.emit('diff:navigated', {
      change,
      index: this.currentChangeIndex,
      total: diffChanges.length,
      line
    });
  }

  /** Clean up event listeners and resources. */
  destroy() {
    if (this.splitter && this._onSplitterMouseDown) {
      this.splitter.removeEventListener('mousedown', this._onSplitterMouseDown);
    }
    if (this._onSplitterMouseMove) {
      document.removeEventListener('mousemove', this._onSplitterMouseMove);
    }
    if (this._onSplitterMouseUp) {
      document.removeEventListener('mouseup', this._onSplitterMouseUp);
    }
    if (this.splitter2 && this._onSplitter2MouseDown) {
      this.splitter2.removeEventListener('mousedown', this._onSplitter2MouseDown);
    }
    if (this._onSplitter2MouseMove) {
      document.removeEventListener('mousemove', this._onSplitter2MouseMove);
    }
    if (this._onSplitter2MouseUp) {
      document.removeEventListener('mouseup', this._onSplitter2MouseUp);
    }
  }
}
