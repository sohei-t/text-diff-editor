/**
 * ui.js - Toolbar + StatusBar + Toast + ThemeManager
 * Text Diff Editor - Prototype C
 */

// ============================================================
// ThemeManager - Theme switching with CSS Custom Properties
// ============================================================
class ThemeManager {
  constructor() {
    /** @type {string[]} Available theme names. */
    this.themes = ['light', 'dark', 'high-contrast'];
    /** @type {string} Currently active theme. */
    this.currentTheme = 'light';
    this._loadTheme();
  }

  /** @private Load saved theme from localStorage. */
  _loadTheme() {
    const saved = localStorage.getItem('textDiffEditor_theme');
    if (saved && this.themes.includes(saved)) {
      this.currentTheme = saved;
    }
    this._applyTheme();
  }

  /**
   * Set the active theme.
   * @param {string} theme - Theme name ('light', 'dark', or 'high-contrast').
   */
  setTheme(theme) {
    if (!this.themes.includes(theme)) return;
    this.currentTheme = theme;
    this._applyTheme();
    localStorage.setItem('textDiffEditor_theme', theme);
    EventBus.emit('theme:change', { theme });
  }

  /**
   * Get the current theme name.
   * @returns {string}
   */
  getTheme() {
    return this.currentTheme;
  }

  /**
   * Get list of available themes.
   * @returns {string[]}
   */
  getAvailableThemes() {
    return [...this.themes];
  }

  /** Cycle to the next theme in order. */
  toggleTheme() {
    const idx = this.themes.indexOf(this.currentTheme);
    const next = this.themes[(idx + 1) % this.themes.length];
    this.setTheme(next);
  }

  /**
   * Detect the system color scheme preference.
   * @returns {string} 'dark' or 'light'.
   */
  getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  /**
   * Enable or disable automatic sync with the OS color scheme.
   * @param {boolean} enabled - Whether to sync with system theme.
   */
  setSystemThemeSync(enabled) {
    if (enabled) {
      this.setTheme(this.getSystemTheme());
      this._mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this._mediaHandler = (e) => this.setTheme(e.matches ? 'dark' : 'light');
      this._mediaQuery.addEventListener('change', this._mediaHandler);
    } else if (this._mediaQuery && this._mediaHandler) {
      this._mediaQuery.removeEventListener('change', this._mediaHandler);
    }
  }

  /** @private Apply the current theme via data-attribute and smooth transition. */
  _applyTheme() {
    document.documentElement.setAttribute('data-theme', this.currentTheme);
    document.documentElement.style.transition = 'background-color 0.3s ease, color 0.3s ease';
    setTimeout(() => {
      document.documentElement.style.transition = '';
    }, 300);
  }

  /** Clean up media query listeners. */
  destroy() {
    if (this._mediaQuery && this._mediaHandler) {
      this._mediaQuery.removeEventListener('change', this._mediaHandler);
    }
  }
}

// ============================================================
// Toast - Notification system
// ============================================================
class Toast {
  /**
   * @param {HTMLElement} [container] - Toast container element.
   */
  constructor(container) {
    this.container = container || document.getElementById('toast-container');
  }

  /**
   * Show a toast notification.
   * @param {string} message - Notification text.
   * @param {'info'|'success'|'error'|'warning'} [type='info'] - Notification type.
   * @param {number} [duration=3000] - Auto-dismiss delay in ms (0 = manual dismiss).
   */
  show(message, type = 'info', duration = 3000) {
    if (!this.container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');

    const icons = { success: '\u2713', error: '\u2717', warning: '\u26A0', info: '\u2139' };
    toast.innerHTML = `
      <span class="toast-icon" aria-hidden="true">${icons[type] || icons.info}</span>
      <span class="toast-message">${Utils.escapeHtml(message)}</span>
      <button class="toast-dismiss" aria-label="Dismiss notification">&times;</button>
    `;

    toast.querySelector('.toast-dismiss').addEventListener('click', () => {
      this._removeToast(toast);
    });

    this.container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('toast-visible');
    });

    if (duration > 0) {
      setTimeout(() => this._removeToast(toast), duration);
    }
  }

  /** @private Remove a toast with exit animation. */
  _removeToast(toast) {
    toast.classList.remove('toast-visible');
    toast.classList.add('toast-exit');
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }

  /** Remove all visible toasts. */
  clearAll() {
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

// ============================================================
// StatusBar - Bottom status display
// ============================================================
class StatusBar {
  /**
   * @param {HTMLElement} [container] - Status bar container element.
   */
  constructor(container) {
    this.container = container || document.getElementById('status-bar');
    this._build();
    this._setupListeners();
  }

  /** @private Build the status bar HTML. */
  _build() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="status-left">
        <span id="status-filename" class="status-item" title="File name">Untitled</span>
        <span id="status-modified" class="status-item status-modified" hidden title="Unsaved changes">&bull;</span>
      </div>
      <div class="status-center">
        <span id="status-cursor" class="status-item" title="Cursor position">Ln 1, Col 1</span>
        <span id="status-encoding" class="status-item">UTF-8</span>
        <span id="status-diff-stats" class="status-item" hidden aria-live="polite"></span>
      </div>
      <div class="status-right">
        <span id="status-zoom" class="status-item status-zoom" title="Zoom level (click to reset)" role="button" tabindex="0" aria-label="Zoom level, click to reset">100%</span>
        <span id="status-split" class="status-item" hidden title="Split mode">Split</span>
      </div>
    `;

    // Click or Enter on zoom to reset
    const zoomEl = document.getElementById('status-zoom');
    zoomEl?.addEventListener('click', () => {
      EventBus.emit('zoom:reset', {});
    });
    zoomEl?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        EventBus.emit('zoom:reset', {});
      }
    });
  }

  /** @private Wire up EventBus listeners for status updates. */
  _setupListeners() {
    EventBus.on('editor:cursor', (data) => {
      if (data.panelId === 'left') {
        this.updateCursorPosition(data.line, data.column);
      }
    });

    EventBus.on('file:open', (data) => {
      if (data.panelId === 'left') this.updateFileName(data.name);
    });

    EventBus.on('file:new', (data) => {
      if (data.panelId === 'left') this.updateFileName('Untitled');
    });

    EventBus.on('file:saved', (data) => {
      if (data.panelId === 'left') this.updateFileName(data.name);
      this.updateModifiedIndicator(false);
    });

    EventBus.on('file:modified', (data) => {
      if (data.panelId === 'left') this.updateModifiedIndicator(data.modified);
    });

    EventBus.on('zoom:change', (data) => {
      this.updateZoomLevel(data.level);
    });

    EventBus.on('split:toggle', (data) => {
      const el = document.getElementById('status-split');
      if (el) el.hidden = !data.enabled;
    });

    EventBus.on('diff:result', (data) => {
      this.updateDiffStats(data.stats);
    });

    EventBus.on('diff:clear', () => {
      const el = document.getElementById('status-diff-stats');
      if (el) el.hidden = true;
    });

    EventBus.on('diff:navigated', (data) => {
      const el = document.getElementById('status-diff-stats');
      if (el) {
        el.hidden = false;
        el.textContent = `Diff ${data.index + 1}/${data.total}`;
      }
    });
  }

  /**
   * Update the cursor position display.
   * @param {number} line - Current line number.
   * @param {number} column - Current column number.
   */
  updateCursorPosition(line, column) {
    const el = document.getElementById('status-cursor');
    if (el) el.textContent = `Ln ${line}, Col ${column}`;
  }

  /**
   * Update the displayed file name.
   * @param {string} name - File name.
   */
  updateFileName(name) {
    const el = document.getElementById('status-filename');
    if (el) el.textContent = name;
  }

  /**
   * Update the zoom level display.
   * @param {number} level - Zoom level (1.0 = 100%).
   */
  updateZoomLevel(level) {
    const el = document.getElementById('status-zoom');
    if (el) {
      const pct = Math.round(level * 100);
      el.textContent = `${pct}%`;
      el.setAttribute('aria-label', `Zoom ${pct}%, click to reset`);
    }
  }

  /**
   * Show or hide the unsaved changes indicator.
   * @param {boolean} modified - Whether file has unsaved changes.
   */
  updateModifiedIndicator(modified) {
    const el = document.getElementById('status-modified');
    if (el) el.hidden = !modified;
  }

  /**
   * Update the diff statistics display.
   * @param {{ added: number, deleted: number, modified: number, unchanged: number }} stats
   */
  updateDiffStats(stats) {
    const el = document.getElementById('status-diff-stats');
    if (el) {
      el.hidden = false;
      const total = stats.added + stats.deleted + stats.modified;
      el.textContent = `+${stats.added} -${stats.deleted} ~${stats.modified} (${total} changes)`;
    }
  }

  /** Clean up listeners. */
  destroy() {}
}

// ============================================================
// Toolbar - Top toolbar with actions
// ============================================================
class Toolbar {
  /**
   * @param {HTMLElement} [container] - Toolbar container element.
   */
  constructor(container) {
    this.container = container || document.getElementById('toolbar');
    this._build();
    this._setupListeners();
  }

  /** @private Build the toolbar HTML with all action buttons. */
  _build() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="toolbar-group">
        <button id="btn-new" class="toolbar-btn" title="New (Cmd+N)" aria-label="New file">
          <span class="toolbar-icon">&#x1F4C4;</span>
          <span class="toolbar-label">New</span>
        </button>
        <button id="btn-open" class="toolbar-btn" title="Open (Cmd+O)" aria-label="Open file">
          <span class="toolbar-icon">&#x1F4C2;</span>
          <span class="toolbar-label">Open</span>
        </button>
        <button id="btn-save" class="toolbar-btn" title="Save (Cmd+S)" aria-label="Save file">
          <span class="toolbar-icon">&#x1F4BE;</span>
          <span class="toolbar-label">Save</span>
        </button>
      </div>
      <div class="toolbar-separator"></div>
      <div class="toolbar-group">
        <button id="btn-split" class="toolbar-btn" title="Split View (Cmd+\\)" aria-label="Toggle split view">
          <span class="toolbar-icon">&#x2B1C;</span>
          <span class="toolbar-label">Split</span>
        </button>
        <button id="btn-sync-scroll" class="toolbar-btn active" title="Sync Scroll" aria-label="Toggle scroll sync" aria-pressed="true">
          <span class="toolbar-icon">&#x1F517;</span>
          <span class="toolbar-label">Sync</span>
        </button>
        <button id="btn-diff-prev" class="toolbar-btn" title="Previous Diff (Shift+F7)" aria-label="Previous difference" hidden>
          <span class="toolbar-icon">&uarr;</span>
          <span class="toolbar-label">Prev</span>
        </button>
        <button id="btn-diff-next" class="toolbar-btn" title="Next Diff (F7)" aria-label="Next difference" hidden>
          <span class="toolbar-icon">&darr;</span>
          <span class="toolbar-label">Next</span>
        </button>
      </div>
      <div class="toolbar-separator"></div>
      <div class="toolbar-group">
        <button id="btn-search" class="toolbar-btn" title="Search (Cmd+F)" aria-label="Search">
          <span class="toolbar-icon">&#x1F50D;</span>
          <span class="toolbar-label">Search</span>
        </button>
      </div>
      <div class="toolbar-separator"></div>
      <div class="toolbar-group">
        <button id="btn-theme" class="toolbar-btn" title="Toggle Theme" aria-label="Toggle theme">
          <span class="toolbar-icon" id="theme-icon">&#x2600;</span>
          <span class="toolbar-label" id="theme-label">Light</span>
        </button>
      </div>
      <div class="toolbar-separator"></div>
      <div class="toolbar-group">
        <button id="btn-font-down" class="toolbar-btn" title="Decrease Font" aria-label="Decrease font size">
          <span class="toolbar-icon">A-</span>
        </button>
        <button id="btn-font-up" class="toolbar-btn" title="Increase Font" aria-label="Increase font size">
          <span class="toolbar-icon">A+</span>
        </button>
      </div>
      <div class="toolbar-separator"></div>
      <div class="toolbar-group toolbar-zoom-group">
        <button id="btn-zoom-out" class="toolbar-btn" title="Zoom Out" aria-label="Zoom out">
          <span class="toolbar-icon">&minus;</span>
        </button>
        <span id="toolbar-zoom-display" class="toolbar-zoom-display" title="Click to reset zoom">100%</span>
        <button id="btn-zoom-in" class="toolbar-btn" title="Zoom In" aria-label="Zoom in">
          <span class="toolbar-icon">&plus;</span>
        </button>
        <div class="zoom-presets">
          <button class="zoom-preset-btn" data-zoom="1.0">100%</button>
          <button class="zoom-preset-btn" data-zoom="1.5">150%</button>
          <button class="zoom-preset-btn" data-zoom="2.0">200%</button>
          <button class="zoom-preset-btn" data-zoom="3.0">300%</button>
        </div>
      </div>
    `;
  }

  /** @private Wire up all toolbar button event listeners. */
  _setupListeners() {
    // File operations
    document.getElementById('btn-new')?.addEventListener('click', () => {
      EventBus.emit('toolbar:action', { action: 'new' });
    });

    document.getElementById('btn-open')?.addEventListener('click', () => {
      EventBus.emit('toolbar:action', { action: 'open' });
    });

    document.getElementById('btn-save')?.addEventListener('click', () => {
      EventBus.emit('toolbar:action', { action: 'save' });
    });

    // View operations
    document.getElementById('btn-split')?.addEventListener('click', () => {
      EventBus.emit('toolbar:action', { action: 'split' });
    });

    document.getElementById('btn-sync-scroll')?.addEventListener('click', (e) => {
      const btn = e.currentTarget;
      const isActive = btn.classList.toggle('active');
      btn.setAttribute('aria-pressed', isActive);
      EventBus.emit('toolbar:action', { action: 'sync-scroll', params: { enabled: isActive } });
    });

    document.getElementById('btn-diff-prev')?.addEventListener('click', () => {
      EventBus.emit('diff:navigate', { direction: 'prev' });
    });

    document.getElementById('btn-diff-next')?.addEventListener('click', () => {
      EventBus.emit('diff:navigate', { direction: 'next' });
    });

    // Search
    document.getElementById('btn-search')?.addEventListener('click', () => {
      EventBus.emit('search:open', { replace: false });
    });

    // Theme
    document.getElementById('btn-theme')?.addEventListener('click', () => {
      EventBus.emit('toolbar:action', { action: 'theme-toggle' });
    });

    // Font size
    document.getElementById('btn-font-down')?.addEventListener('click', () => {
      EventBus.emit('toolbar:action', { action: 'font-decrease' });
    });

    document.getElementById('btn-font-up')?.addEventListener('click', () => {
      EventBus.emit('toolbar:action', { action: 'font-increase' });
    });

    // Zoom
    document.getElementById('btn-zoom-out')?.addEventListener('click', () => {
      EventBus.emit('toolbar:action', { action: 'zoom-out' });
    });

    document.getElementById('btn-zoom-in')?.addEventListener('click', () => {
      EventBus.emit('toolbar:action', { action: 'zoom-in' });
    });

    document.getElementById('toolbar-zoom-display')?.addEventListener('click', () => {
      EventBus.emit('zoom:reset', {});
    });

    // Zoom presets
    document.querySelectorAll('.zoom-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const level = parseFloat(btn.dataset.zoom);
        EventBus.emit('zoom:set', { level });
      });
    });

    // Listen for state changes
    EventBus.on('zoom:change', (data) => {
      const el = document.getElementById('toolbar-zoom-display');
      if (el) el.textContent = `${Math.round(data.level * 100)}%`;
    });

    EventBus.on('theme:change', (data) => {
      this.updateThemeIcon(data.theme);
    });

    EventBus.on('split:toggle', (data) => {
      const splitBtn = document.getElementById('btn-split');
      if (splitBtn) splitBtn.classList.toggle('active', data.enabled);

      const prevBtn = document.getElementById('btn-diff-prev');
      const nextBtn = document.getElementById('btn-diff-next');
      if (prevBtn) prevBtn.hidden = !data.enabled;
      if (nextBtn) nextBtn.hidden = !data.enabled;
    });
  }

  /**
   * Update file name display (handled by StatusBar).
   * @param {string} name - File name.
   */
  updateFileName(name) {
    // Handled by StatusBar
  }

  /**
   * Update the zoom level display in the toolbar.
   * @param {number} level - Zoom level (1.0 = 100%).
   */
  updateZoomLevel(level) {
    const el = document.getElementById('toolbar-zoom-display');
    if (el) el.textContent = `${Math.round(level * 100)}%`;
  }

  /**
   * Update the split button active state.
   * @param {boolean} enabled - Whether split mode is active.
   */
  updateSplitState(enabled) {
    const btn = document.getElementById('btn-split');
    if (btn) btn.classList.toggle('active', enabled);
  }

  /**
   * Update the theme toggle button icon and label.
   * @param {string} theme - Active theme name.
   */
  updateThemeIcon(theme) {
    const iconEl = document.getElementById('theme-icon');
    const labelEl = document.getElementById('theme-label');
    if (!iconEl || !labelEl) return;

    const icons = { 'light': '\u2600', 'dark': '\uD83C\uDF19', 'high-contrast': '\uD83D\uDD76' };
    const labels = { 'light': 'Light', 'dark': 'Dark', 'high-contrast': 'HC' };
    iconEl.textContent = icons[theme] || icons.light;
    labelEl.textContent = labels[theme] || labels.light;
  }

  /** Clean up listeners. */
  destroy() {}
}
